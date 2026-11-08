import { Chess, Square } from 'chess.js';
import { chessEngine } from './chessEngine';
import { MoveAnalysis, PieceColor } from '../types/chess';

export interface StockfishInfo {
  depth: number;
  seldepth?: number;
  scoreCp?: number; // Centipawns from White's perspective (+ White, - Black)
  mateIn?: number;  // Mate in N moves (+ White wins, - Black wins)
  nodes?: number;
  nps?: number;
  pv?: string[];
  bestMove?: string;
  isThinking: boolean;
  engineName?: string;
}

export interface StockfishMoveResult {
  from: Square;
  to: Square;
  promotion?: string;
  uci: string;
  san?: string;
  evalCp: number;
  depth: number;
}

const STOCKFISH_WASM_WORKER = '/stockfish-19-lite-single.js';
const STOCKFISH_ASM_WORKER = '/stockfish-19-asm.js';

class StockfishService {
  private worker: Worker | null = null;
  private isReady = false;
  private isInitializing = false;
  private isWasmActive = false;
  private engineName = 'Stockfish 19 (WebAssembly)';
  private listeners: ((info: StockfishInfo) => void)[] = [];
  private currentResolve: ((result: StockfishMoveResult) => void) | null = null;
  private currentReject: ((err: Error) => void) | null = null;
  private currentEvalResolve: ((info: StockfishInfo) => void) | null = null;
  private currentInfo: StockfishInfo = { depth: 0, isThinking: false };
  private activeFen = '';

  constructor() {
    // Attempt lazy initialization on client
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      this.initWorker();
    }
  }

  public getEngineName(): string {
    return this.engineName;
  }

  public isWebAssembly(): boolean {
    return this.isWasmActive;
  }

  public initWorker(): Promise<boolean> {
    if (this.isReady) return Promise.resolve(true);
    if (this.isInitializing) {
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          if (this.isReady || !this.isInitializing) {
            clearInterval(interval);
            resolve(this.isReady);
          }
        }, 100);
      });
    }

    this.isInitializing = true;

    return new Promise((resolve) => {
      // Step 1: Attempt to load latest WebAssembly build of Stockfish 19
      try {
        this.worker = new Worker(STOCKFISH_WASM_WORKER);
        this.isWasmActive = true;
        this.engineName = 'Stockfish 19 (WebAssembly NNUE)';
        this.setupWorkerEvents(resolve, () => {
          // If WASM worker fails, fallback to Stockfish 19 ASM.js
          console.warn('[Stockfish 19] WebAssembly worker failed, falling back to Stockfish 19 ASM.js');
          this.isWasmActive = false;
          this.engineName = 'Stockfish 19 (ASM.js)';
          try {
            this.worker = new Worker(STOCKFISH_ASM_WORKER);
            this.setupWorkerEvents(resolve, () => {
              this.worker = null;
              this.isReady = false;
              this.isInitializing = false;
              resolve(false);
            });
          } catch {
            this.worker = null;
            this.isReady = false;
            this.isInitializing = false;
            resolve(false);
          }
        });
      } catch (err) {
        console.warn('[Stockfish 19] Could not instantiate Web Worker:', err);
        this.worker = null;
        this.isReady = false;
        this.isInitializing = false;
        resolve(false);
      }
    });
  }

  private setupWorkerEvents(resolve: (success: boolean) => void, onErrorFallback: () => void) {
    if (!this.worker) {
      onErrorFallback();
      return;
    }

    this.worker.onmessage = (e: MessageEvent) => {
      const line: string = typeof e.data === 'string' ? e.data : '';
      this.handleWorkerMessage(line);
    };

    this.worker.onerror = (err) => {
      console.warn('[Stockfish 19] Worker runtime error:', err);
      onErrorFallback();
    };

    // Send UCI handshake
    this.sendCommand('uci');

    // Watchdog timeout: if engine doesn't reply within 5 seconds, resolve state
    setTimeout(() => {
      if (this.isInitializing) {
        this.isInitializing = false;
        resolve(this.isReady);
      }
    }, 5000);
  }

  private sendCommand(cmd: string) {
    if (this.worker) {
      this.worker.postMessage(cmd);
    }
  }

  private handleWorkerMessage(line: string) {
    // Capture engine version string
    if (line.startsWith('id name')) {
      const rawName = line.replace('id name', '').trim();
      if (rawName) {
        this.engineName = `${rawName} (${this.isWasmActive ? 'WASM' : 'ASM.js'})`;
      }
      return;
    }

    if (line === 'uciok') {
      // Configure Stockfish 19 for competitive analysis
      this.sendCommand('setoption name Threads value 1');
      this.sendCommand('setoption name Hash value 32');
      this.sendCommand('setoption name UCI_AnalyseMode value true');
      this.sendCommand('isready');
      return;
    }

    if (line === 'readyok') {
      this.isReady = true;
      this.isInitializing = false;
      return;
    }

    // Parse info lines: e.g. "info depth 12 score cp 42 nodes 12480 nps 240000 pv e2e4 e7e5"
    if (line.startsWith('info') && (line.includes('score') || line.includes('depth'))) {
      const parts = line.split(' ');
      let depth = this.currentInfo.depth;
      let rawScoreCp: number | undefined = undefined;
      let rawMateIn: number | undefined = undefined;
      let nodes: number | undefined = undefined;
      let nps: number | undefined = undefined;
      let pv: string[] = [];

      for (let i = 0; i < parts.length; i++) {
        if (parts[i] === 'depth' && parts[i + 1]) {
          depth = parseInt(parts[i + 1], 10);
        } else if (parts[i] === 'score') {
          if (parts[i + 1] === 'cp' && parts[i + 2]) {
            rawScoreCp = parseInt(parts[i + 2], 10);
          } else if (parts[i + 1] === 'mate' && parts[i + 2]) {
            rawMateIn = parseInt(parts[i + 2], 10);
          }
        } else if (parts[i] === 'nodes' && parts[i + 1]) {
          nodes = parseInt(parts[i + 1], 10);
        } else if (parts[i] === 'nps' && parts[i + 1]) {
          nps = parseInt(parts[i + 1], 10);
        } else if (parts[i] === 'pv') {
          pv = parts.slice(i + 1);
          break;
        }
      }

      // Convert score from the engine's side-to-move point of view to White's perspective (+ White, - Black)
      const isBlackTurn = this.activeFen.split(' ')[1] === 'b';
      let scoreCp: number | undefined = undefined;
      let mateIn: number | undefined = undefined;

      if (rawScoreCp !== undefined) {
        scoreCp = isBlackTurn ? -rawScoreCp : rawScoreCp;
      }
      if (rawMateIn !== undefined) {
        mateIn = isBlackTurn ? -rawMateIn : rawMateIn;
      }

      this.currentInfo = {
        ...this.currentInfo,
        depth: depth || this.currentInfo.depth,
        scoreCp: scoreCp !== undefined ? scoreCp : this.currentInfo.scoreCp,
        mateIn: mateIn !== undefined ? mateIn : this.currentInfo.mateIn,
        nodes: nodes || this.currentInfo.nodes,
        nps: nps || this.currentInfo.nps,
        pv: pv.length ? pv : this.currentInfo.pv,
        isThinking: true,
        engineName: this.engineName,
      };

      this.notifyListeners(this.currentInfo);
    }

    // Parse bestmove line: e.g. "bestmove e2e4 ponder e7e5"
    if (line.startsWith('bestmove')) {
      const parts = line.split(' ');
      const bestMoveUci = parts[1];

      this.currentInfo = {
        ...this.currentInfo,
        bestMove: bestMoveUci,
        isThinking: false,
        engineName: this.engineName,
      };
      this.notifyListeners(this.currentInfo);

      if (this.currentEvalResolve) {
        const resolveFn = this.currentEvalResolve;
        this.currentEvalResolve = null;
        resolveFn(this.currentInfo);
      }

      if (this.currentResolve && bestMoveUci && bestMoveUci !== '(none)') {
        const from = bestMoveUci.substring(0, 2) as Square;
        const to = bestMoveUci.substring(2, 4) as Square;
        const promotion = bestMoveUci.length > 4 ? bestMoveUci.substring(4, 5) : undefined;
        const evalCp = this.currentInfo.scoreCp ?? 0;
        const depth = this.currentInfo.depth || 10;

        let san = bestMoveUci;
        try {
          const c = new Chess(this.activeFen);
          const m = c.move({ from, to, promotion: promotion || 'q' });
          if (m) san = m.san;
        } catch {
          // fallback to UCI
        }

        const resolveFn = this.currentResolve;
        this.currentResolve = null;
        this.currentReject = null;
        resolveFn({
          from,
          to,
          promotion,
          uci: bestMoveUci,
          san,
          evalCp,
          depth,
        });
      }
    }
  }

  private notifyListeners(info: StockfishInfo) {
    for (const listener of this.listeners) {
      try {
        listener(info);
      } catch (err) {
        console.error('[Stockfish 19] Listener error:', err);
      }
    }
  }

  public subscribe(callback: (info: StockfishInfo) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Evaluate a position using Stockfish 19 WebAssembly.
   * Returns calculated centipawns (from White's perspective), depth, nodes, and principal variation.
   */
  public async evaluatePosition(fen: string, depth = 12, movetimeMs = 280): Promise<StockfishInfo> {
    if (!this.worker || !this.isReady) {
      await this.initWorker();
    }

    // Fallback if Stockfish worker isn't supported
    if (!this.worker || !this.isReady) {
      const chess = new Chess(fen);
      const evalCp = chessEngine.evaluatePosition(chess);
      const bestMove = chessEngine.findBestMove(chess, 2).bestMove;
      return {
        depth: 2,
        scoreCp: evalCp,
        bestMove: bestMove ? `${bestMove.from}${bestMove.to}${bestMove.promotion || ''}` : undefined,
        isThinking: false,
        engineName: 'Minimax (JS Fallback)',
      };
    }

    if (this.currentResolve) {
      // Bot is currently calculating a move; do not collide with UCI commands
      return this.currentInfo;
    }

    this.activeFen = fen;
    this.currentInfo = { depth: 0, isThinking: true, engineName: this.engineName };
    this.sendCommand('stop');
    this.sendCommand(`position fen ${fen}`);
    this.sendCommand(`go depth ${depth} movetime ${movetimeMs}`);

    return new Promise((resolve) => {
      this.currentEvalResolve = resolve;

      // Snappy timeout safety
      setTimeout(() => {
        if (this.currentEvalResolve) {
          const resolveFn = this.currentEvalResolve;
          this.currentEvalResolve = null;
          resolveFn(this.currentInfo);
        }
      }, Math.max(500, movetimeMs + 300));
    });
  }

  /**
   * Request Stockfish 19 to calculate and return the best move for the active position.
   */
  public async getBestMove(
    fen: string,
    skillLevel = 10,
    depth = 10,
    movetimeMs = 150
  ): Promise<StockfishMoveResult> {
    if (!this.worker || !this.isReady) {
      await this.initWorker();
    }

    // Local minimax fallback
    if (!this.worker || !this.isReady) {
      const chess = new Chess(fen);
      const minimaxDepth = Math.min(Math.max(1, Math.floor(depth / 4)), 2);
      const move = chessEngine.findBestMove(chess, minimaxDepth).bestMove;
      if (!move) {
        throw new Error('No legal moves available');
      }
      const evalCp = chessEngine.evaluatePosition(chess);
      return {
        from: move.from as Square,
        to: move.to as Square,
        promotion: move.promotion,
        uci: `${move.from}${move.to}${move.promotion || ''}`,
        san: move.san,
        evalCp,
        depth: minimaxDepth,
      };
    }

    // Clear any pending background eval so bot move has full priority
    if (this.currentEvalResolve) {
      const fn = this.currentEvalResolve;
      this.currentEvalResolve = null;
      fn(this.currentInfo);
    }

    this.activeFen = fen;
    this.currentInfo = { depth: 0, isThinking: true, engineName: this.engineName };

    // Configure Stockfish 19 Skill Level (0 to 20)
    const clampedSkill = Math.max(0, Math.min(20, skillLevel));
    this.sendCommand(`setoption name Skill Level value ${clampedSkill}`);
    this.sendCommand('stop');
    this.sendCommand(`position fen ${fen}`);
    this.sendCommand(`go depth ${depth} movetime ${movetimeMs}`);

    return new Promise((resolve, reject) => {
      this.currentResolve = resolve;
      this.currentReject = reject;

      // Snappy timeout safety (movetime + 350ms)
      setTimeout(() => {
        if (this.currentResolve) {
          this.sendCommand('stop');
          // Fallback to local minimax if worker timed out
          const chess = new Chess(fen);
          const move = chessEngine.findBestMove(chess, 2).bestMove;
          if (move) {
            const resolveFn = this.currentResolve;
            this.currentResolve = null;
            this.currentReject = null;
            resolveFn({
              from: move.from as Square,
              to: move.to as Square,
              promotion: move.promotion,
              uci: `${move.from}${move.to}${move.promotion || ''}`,
              san: move.san,
              evalCp: this.currentInfo.scoreCp ?? 0,
              depth,
            });
          }
        }
      }, Math.max(450, movetimeMs + 350));
    });
  }

  /**
   * Analyze a single move with Stockfish 19 WebAssembly precision
   */
  public async analyzeMoveWithStockfish(
    fenBefore: string,
    moveSan: string,
    moveFrom: string,
    moveTo: string,
    color: PieceColor,
    plyIndex = 0,
    previousMoveAnalysis?: MoveAnalysis,
    depth = 10
  ): Promise<MoveAnalysis> {
    if (!this.worker || !this.isReady) {
      await this.initWorker();
    }

    if (!this.worker || !this.isReady) {
      // Fallback to synchronous minimax analysis
      return chessEngine.analyzeMove(
        fenBefore,
        moveSan,
        moveFrom,
        moveTo,
        color,
        plyIndex,
        previousMoveAnalysis
      );
    }

    // 1. Evaluate fenBefore to determine optimal engine move and eval
    const evalBeforeInfo = await this.evaluatePosition(fenBefore, depth, 180);
    const evalBeforeCp = evalBeforeInfo.scoreCp ?? 0;
    const bestMoveUci = evalBeforeInfo.bestMove;

    let bestMoveSan = moveSan;
    if (bestMoveUci && bestMoveUci.length >= 4) {
      try {
        const c = new Chess(fenBefore);
        const from = bestMoveUci.substring(0, 2) as Square;
        const to = bestMoveUci.substring(2, 4) as Square;
        const promo = bestMoveUci.length > 4 ? bestMoveUci.substring(4, 5) : undefined;
        const m = c.move({ from, to, promotion: promo || 'q' });
        if (m) bestMoveSan = m.san;
      } catch {
        // fallback
      }
    }

    // 2. Evaluate fenAfter
    const chess = new Chess(fenBefore);
    chess.move(moveSan);
    const fenAfter = chess.fen();
    const evalAfterInfo = await this.evaluatePosition(fenAfter, depth, 180);
    const evalAfterCp = evalAfterInfo.scoreCp ?? 0;

    return chessEngine.analyzeMove(
      fenBefore,
      moveSan,
      moveFrom,
      moveTo,
      color,
      plyIndex,
      previousMoveAnalysis,
      {
        evalBefore: evalBeforeCp,
        evalAfter: evalAfterCp,
        bestMoveSan,
        bestMoveUci,
      }
    );
  }

  /**
   * High-accuracy batch analysis of a complete game using Stockfish 19 WebAssembly.
   * Reports live progress to caller.
   */
  public async batchAnalyzeGameAsync(
    pgn: string,
    onProgress?: (analyzed: number, total: number, currentSan?: string) => void,
    depth = 10
  ): Promise<MoveAnalysis[]> {
    const c = new Chess();
    try {
      c.loadPgn(pgn);
    } catch {
      return [];
    }

    const history = c.history({ verbose: true });
    if (history.length === 0) return [];

    await this.initWorker();

    const stepper = new Chess();
    const resultMoves: MoveAnalysis[] = [];

    for (let i = 0; i < history.length; i++) {
      const m = history[i];
      const fenBefore = stepper.fen();
      const prevAnalysis = resultMoves[i - 1];

      onProgress?.(i, history.length, m.san);

      const analysis = await this.analyzeMoveWithStockfish(
        fenBefore,
        m.san,
        m.from,
        m.to,
        m.color,
        i,
        prevAnalysis,
        depth
      );

      stepper.move(m);
      resultMoves.push(analysis);
      onProgress?.(i + 1, history.length, m.san);
    }

    return resultMoves;
  }

  /**
   * Fast synchronous fallback analysis using minimax + Quiescence search.
   */
  public batchAnalyzeGame(
    pgn: string,
    onProgress?: (analyzed: number, total: number) => void
  ): MoveAnalysis[] {
    const c = new Chess();
    try {
      c.loadPgn(pgn);
    } catch {
      return [];
    }

    const history = c.history({ verbose: true });
    if (history.length === 0) return [];

    const stepper = new Chess();
    const resultMoves: MoveAnalysis[] = [];

    for (let i = 0; i < history.length; i++) {
      const m = history[i];
      const fenBefore = stepper.fen();
      const prevAnalysis = resultMoves[i - 1];

      const analysis = chessEngine.analyzeMove(
        fenBefore,
        m.san,
        m.from,
        m.to,
        m.color,
        i,
        prevAnalysis
      );

      stepper.move(m);
      resultMoves.push(analysis);
      onProgress?.(i + 1, history.length);
    }

    return resultMoves;
  }

  public stop() {
    if (this.worker && this.isReady) {
      this.sendCommand('stop');
    }
    this.currentInfo = { ...this.currentInfo, isThinking: false };
    this.notifyListeners(this.currentInfo);
  }

  public isAvailable(): boolean {
    return this.isReady;
  }
}

export const stockfishService = new StockfishService();
