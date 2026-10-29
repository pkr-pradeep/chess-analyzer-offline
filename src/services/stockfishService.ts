import { Chess, Square } from 'chess.js';
import { chessEngine } from './chessEngine';

export interface StockfishInfo {
  depth: number;
  seldepth?: number;
  scoreCp?: number;
  mateIn?: number;
  nodes?: number;
  nps?: number;
  pv?: string[];
  bestMove?: string;
  isThinking: boolean;
}

export interface StockfishMoveResult {
  from: Square;
  to: Square;
  promotion?: string;
  uci: string;
  evalCp: number;
  depth: number;
}

class StockfishService {
  private worker: Worker | null = null;
  private isReady = false;
  private isInitializing = false;
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
      try {
        // Look for the stockfish.js file in public directory
        this.worker = new Worker('/stockfish.js');

        this.worker.onmessage = (e: MessageEvent) => {
          const line: string = typeof e.data === 'string' ? e.data : '';
          this.handleWorkerMessage(line);
        };

        this.worker.onerror = (err) => {
          console.warn('[Stockfish] Worker initialization failed, using local engine fallback:', err);
          this.worker = null;
          this.isReady = false;
          this.isInitializing = false;
          resolve(false);
        };

        // Send initialization commands
        this.sendCommand('uci');

        // Watchdog timeout: if stockfish doesn't reply within 4 seconds, mark ready or fallback
        setTimeout(() => {
          if (this.isInitializing) {
            this.isInitializing = false;
            resolve(this.isReady);
          }
        }, 4000);
      } catch (err) {
        console.warn('[Stockfish] Could not instantiate Web Worker:', err);
        this.worker = null;
        this.isReady = false;
        this.isInitializing = false;
        resolve(false);
      }
    });
  }

  private sendCommand(cmd: string) {
    if (this.worker) {
      this.worker.postMessage(cmd);
    }
  }

  private handleWorkerMessage(line: string) {
    if (line === 'uciok') {
      this.sendCommand('isready');
      return;
    }

    if (line === 'readyok') {
      this.isReady = true;
      this.isInitializing = false;
      return;
    }

    // Parse info lines: e.g. "info depth 12 seldepth 16 score cp 42 nodes 12480 nps 240000 pv e2e4 e7e5"
    if (line.startsWith('info') && (line.includes('score') || line.includes('depth'))) {
      const parts = line.split(' ');
      let depth = this.currentInfo.depth;
      let scoreCp: number | undefined = undefined;
      let mateIn: number | undefined = undefined;
      let nodes: number | undefined = undefined;
      let nps: number | undefined = undefined;
      let pv: string[] = [];

      for (let i = 0; i < parts.length; i++) {
        if (parts[i] === 'depth' && parts[i + 1]) {
          depth = parseInt(parts[i + 1], 10);
        } else if (parts[i] === 'score') {
          if (parts[i + 1] === 'cp' && parts[i + 2]) {
            scoreCp = parseInt(parts[i + 2], 10);
          } else if (parts[i + 1] === 'mate' && parts[i + 2]) {
            mateIn = parseInt(parts[i + 2], 10);
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

      this.currentInfo = {
        ...this.currentInfo,
        depth: depth || this.currentInfo.depth,
        scoreCp: scoreCp !== undefined ? scoreCp : this.currentInfo.scoreCp,
        mateIn: mateIn !== undefined ? mateIn : this.currentInfo.mateIn,
        nodes: nodes || this.currentInfo.nodes,
        nps: nps || this.currentInfo.nps,
        pv: pv.length ? pv : this.currentInfo.pv,
        isThinking: true,
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
        const depth = this.currentInfo.depth || 8;

        const resolveFn = this.currentResolve;
        this.currentResolve = null;
        this.currentReject = null;
        resolveFn({
          from,
          to,
          promotion,
          uci: bestMoveUci,
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
        console.error('[Stockfish] Listener error:', err);
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
   * Evaluate a position using Stockfish UCI engine.
   * Returns calculated centipawns (from White's perspective), depth, and best line.
   */
  public async evaluatePosition(fen: string, depth = 8, movetimeMs = 250): Promise<StockfishInfo> {
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
      };
    }

    if (this.currentResolve) {
      // Bot is currently calculating a move; do not collide with UCI commands
      return this.currentInfo;
    }

    this.activeFen = fen;
    this.currentInfo = { depth: 0, isThinking: true };
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
   * Request Stockfish to calculate and return the best move for the active position.
   * movetimeMs guarantees a fast, fluid response without stalling (default 120ms).
   */
  public async getBestMove(
    fen: string,
    skillLevel = 10,
    depth = 8,
    movetimeMs = 120
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
    this.currentInfo = { depth: 0, isThinking: true };

    // Configure Stockfish Skill Level (0 to 20)
    const clampedSkill = Math.max(0, Math.min(20, skillLevel));
    this.sendCommand(`setoption name Skill Level value ${clampedSkill}`);
    this.sendCommand('stop');
    this.sendCommand(`position fen ${fen}`);
    this.sendCommand(`go depth ${depth} movetime ${movetimeMs}`);

    return new Promise((resolve, reject) => {
      this.currentResolve = resolve;
      this.currentReject = reject;

      // Snappy timeout safety (max movetime + 350ms)
      setTimeout(() => {
        if (this.currentResolve) {
          this.sendCommand('stop');
          // If still unresolved, fallback to instantaneous local minimax (<1ms)
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
              evalCp: this.currentInfo.scoreCp ?? 0,
              depth,
            });
          }
        }
      }, Math.max(450, movetimeMs + 350));
    });
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
