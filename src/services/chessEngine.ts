import { Chess, Square, Move, PieceSymbol, Color } from 'chess.js';
import { MoveClassification, MoveAnalysis, PieceColor } from '../types/chess';

// Piece values in centipawns
export const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece square tables for positional evaluation (from White's perspective)
// Flipped automatically for Black
const PAWN_PST = [
  0,  0,  0,  0,  0,  0,  0,  0,
 50, 50, 50, 50, 50, 50, 50, 50,
 10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 25, 25, 10,  5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-20,-20, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_PST = [
 -50,-40,-30,-30,-30,-30,-40,-50,
 -40,-20,  0,  0,  0,  0,-20,-40,
 -30,  0, 10, 15, 15, 10,  0,-30,
 -30,  5, 15, 20, 20, 15,  5,-30,
 -30,  0, 15, 20, 20, 15,  0,-30,
 -30,  5, 10, 15, 15, 10,  5,-30,
 -40,-20,  0,  5,  5,  0,-20,-40,
 -50,-40,-30,-30,-30,-30,-40,-50
];

const BISHOP_PST = [
 -20,-10,-10,-10,-10,-10,-10,-20,
 -10,  0,  0,  0,  0,  0,  0,-10,
 -10,  0,  5, 10, 10,  5,  0,-10,
 -10,  5,  5, 10, 10,  5,  5,-10,
 -10,  0, 10, 10, 10, 10,  0,-10,
 -10, 10, 10, 10, 10, 10, 10,-10,
 -10,  5,  0,  0,  0,  0,  5,-10,
 -20,-10,-10,-10,-10,-10,-10,-20
];

const ROOK_PST = [
   0,  0,  0,  0,  0,  0,  0,  0,
   5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
   0,  0,  0,  5,  5,  0,  0,  0
];

const QUEEN_PST = [
 -20,-10,-10, -5, -5,-10,-10,-20,
 -10,  0,  0,  0,  0,  0,  0,-10,
 -10,  0,  5,  5,  5,  5,  0,-10,
  -5,  0,  5,  5,  5,  5,  0, -5,
   0,  0,  5,  5,  5,  5,  0, -5,
 -10,  5,  5,  5,  5,  5,  0,-10,
 -10,  0,  5,  0,  0,  0,  0,-10,
 -20,-10,-10, -5, -5,-10,-10,-20
];

const KING_MID_PST = [
 -30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -20,-30,-30,-40,-40,-30,-30,-20,
 -10,-20,-20,-20,-20,-20,-20,-10,
  20, 20,  0,  0,  0,  0, 20, 20,
  20, 30, 10,  0,  0, 10, 30, 20
];

export interface TacticalThreat {
  square: Square;
  pieceType: string;
  color: PieceColor;
  threatType: 'hanging' | 'under_attack' | 'pinned' | 'forked' | 'open_file' | 'check';
  description: string;
}

// Standard Grandmaster Opening Book Lines (John Emms: Discovering Openings & Pete Tamburro)
const OPENING_BOOK_SAN = new Set([
  // 1st moves
  'e4', 'd4', 'c4', 'Nf3', 'g3', 'f4', 'b3', 'Nc3',
  'e5', 'c5', 'e6', 'c6', 'd5', 'Nf6', 'g6', 'd6', 'b6',
  // 2nd moves
  'Nf3', 'Nc3', 'Bc4', 'Bb5', 'd4', 'c3', 'f4', 'c4', 'Bf4', 'Bg5', 'd3', 'g3',
  'Nc6', 'Nf6', 'd6', 'Bc5', 'e6', 'd5', 'exd4', 'cxd4', 'Bb4', 'a6', 'g6', 'Bg7', 'c5',
  // 3rd moves & 4th moves
  'Bc4', 'Bb5', 'd4', 'exd5', 'cxd5', 'Nc3', 'Nbd2', 'O-O', 'Be2', 'Bd3', 'c4', 'c3', 'a3', 'h3', 'Bxc6', 'Nxd4', 'Nxe5', 'Nxe4',
  'Bc5', 'Bb4', 'Be7', 'Bd6', 'O-O', 'a6', 'b5', 'h6', 'Re8', 'Qe7', 'Qc7', 'Nbd7', 'd5', 'e5', 'Nxd5', 'dxe4', 'Nxe4', 'dxc6', 'bxc6',
  // 5th to 7th moves
  'Re1', 'd3', 'h3', 'a4', 'Bb3', 'Ba4', 'Qe2', 'Qd3', 'Qc2', 'Bg5', 'Be3', 'Nbd2', 'Rad1', 'Rac1',
  'd6', 'Re8', 'Bb7', 'Ba6', 'Na5', 'b4', 'c6', 'exd4', 'Nxd4', 'Nf6', 'Bg4', 'Bd7', 'Qd7'
]);

export interface OpeningInfo {
  eco: string;
  name: string;
  keyIdea: string;
}

export function identifyOpening(moves: string[]): OpeningInfo | null {
  const line = moves.slice(0, 6).join(' ');
  if (line.startsWith('e4 e5 Nf3 Nc6 Bc4 Bc5')) {
    return { eco: 'C50', name: 'Italian Game (Giuoco Piano)', keyIdea: 'Rapid minor piece development eyeing f7 and preparing c3/d4.' };
  }
  if (line.startsWith('e4 e5 Nf3 Nc6 Bc4 Nf6')) {
    return { eco: 'C55', name: "Two Knights' Defence", keyIdea: 'Dynamic counter-attack against White’s e4 pawn and center.' };
  }
  if (line.startsWith('e4 e5 Nf3 Nc6 Bb5 a6')) {
    return { eco: 'C68', name: 'Ruy Lopez (Morphy Defence)', keyIdea: 'Indirect central pressure on e5 and queenside pawn tension.' };
  }
  if (line.startsWith('e4 e5 Nf3 Nc6 Bb5')) {
    return { eco: 'C60', name: 'Ruy Lopez (Spanish Opening)', keyIdea: 'Pinning the c6 knight to exert long-term pressure on e5.' };
  }
  if (line.startsWith('e4 e5 Nf3 Nc6 d4')) {
    return { eco: 'C45', name: 'Scotch Game', keyIdea: 'Immediate central blast liquidating e5 and opening the d-file.' };
  }
  if (line.startsWith('e4 e5 Nf3 Nf6')) {
    return { eco: 'C42', name: "Petroff's Defence", keyIdea: 'Classical symmetric counter-strike against White’s e4 pawn.' };
  }
  if (line.startsWith('e4 e5 Nf3 d6')) {
    return { eco: 'C41', name: "Philidor's Defence", keyIdea: 'Solid pawn support for e5 with cautious piece development.' };
  }
  if (line.startsWith('e4 c5 Nf3')) {
    return { eco: 'B20', name: 'Sicilian Defence (Open Variation)', keyIdea: 'Asymmetric counterplay trading flank c-pawn for central d-pawn.' };
  }
  if (line.startsWith('e4 c5')) {
    return { eco: 'B20', name: 'Sicilian Defence', keyIdea: 'Imbalancing the position by fighting for d4 from the flank.' };
  }
  if (line.startsWith('e4 e6 d4 d5')) {
    return { eco: 'C00', name: 'French Defence', keyIdea: 'Solid central wedge with immediate counter-attack against d4.' };
  }
  if (line.startsWith('e4 c6 d4 d5')) {
    return { eco: 'B10', name: 'Caro-Kann Defence', keyIdea: 'Ultra-solid pawn structure preparing ...d5 without blocking the light bishop.' };
  }
  if (line.startsWith('d4 d5 c4 e6')) {
    return { eco: 'D30', name: "Queen's Gambit Declined", keyIdea: 'Rock-solid defense of the d5 stronghold with central equilibrium.' };
  }
  if (line.startsWith('d4 d5 c4')) {
    return { eco: 'D06', name: "Queen's Gambit", keyIdea: 'Offering a flank pawn to build a broad central pawn duo (d4/e4).' };
  }
  if (line.startsWith('d4 Nf6 c4 g6')) {
    return { eco: 'E60', name: "King's Indian Defence", keyIdea: 'Hypermodern flank fianchetto with explosive kingside counter-punch.' };
  }
  if (line.startsWith('c4')) {
    return { eco: 'A10', name: 'English Opening', keyIdea: 'Controlling d5 from the flank while keeping central pawn options flexible.' };
  }
  if (line.startsWith('Nf3')) {
    return { eco: 'A04', name: 'Reti Opening', keyIdea: 'Flexible knight development controlling central light squares.' };
  }
  return null;
}

/**
 * Expected Points / Win Probability Model:
 * Measures win probability from centipawns [0, 100]%
 * Formula: P = 100 / (1 + 10^(-cp / 400))
 */
export function centipawnsToWinProbability(cp: number): number {
  const clamped = Math.max(-2000, Math.min(2000, cp));
  const prob = 100 / (1 + Math.pow(10, -clamped / 400));
  return Number(prob.toFixed(1));
}

export class ChessEngineService {
  /**
   * Static position evaluation from White's perspective in centipawns
   */
  public evaluatePosition(chess: Chess): number {
    if (chess.isCheckmate()) {
      return chess.turn() === 'w' ? -20000 : 20000;
    }
    if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
      return 0;
    }

    let materialWhite = 0;
    let materialBlack = 0;
    let pstWhite = 0;
    let pstBlack = 0;

    const board = chess.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;

        const val = PIECE_VALUES[piece.type];
        const squareIndex = r * 8 + c;
        const flippedIndex = (7 - r) * 8 + c;

        let pstVal = 0;
        switch (piece.type) {
          case 'p':
            pstVal = piece.color === 'w' ? PAWN_PST[squareIndex] : PAWN_PST[flippedIndex];
            break;
          case 'n':
            pstVal = piece.color === 'w' ? KNIGHT_PST[squareIndex] : KNIGHT_PST[flippedIndex];
            break;
          case 'b':
            pstVal = piece.color === 'w' ? BISHOP_PST[squareIndex] : BISHOP_PST[flippedIndex];
            break;
          case 'r':
            pstVal = piece.color === 'w' ? ROOK_PST[squareIndex] : ROOK_PST[flippedIndex];
            break;
          case 'q':
            pstVal = piece.color === 'w' ? QUEEN_PST[squareIndex] : QUEEN_PST[flippedIndex];
            break;
          case 'k':
            pstVal = piece.color === 'w' ? KING_MID_PST[squareIndex] : KING_MID_PST[flippedIndex];
            break;
        }

        if (piece.color === 'w') {
          materialWhite += val;
          pstWhite += pstVal;
        } else {
          materialBlack += val;
          pstBlack += pstVal;
        }
      }
    }

    const total = (materialWhite - materialBlack) + (pstWhite - pstBlack);
    const checkPenalty = chess.inCheck() ? (chess.turn() === 'w' ? -40 : 40) : 0;
    return total + checkPenalty;
  }

  /**
   * Quiescence search: searches tactical capture chains to eliminate the horizon effect,
   * accurately detecting hanging pieces, pins, and tactical exchanges.
   */
  private quiescence(
    chess: Chess,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    qDepth: number = 4
  ): number {
    const standPat = this.evaluatePosition(chess);
    if (qDepth === 0 || chess.isGameOver()) {
      return standPat;
    }

    if (isMaximizing) {
      if (standPat >= beta) return beta;
      if (standPat > alpha) alpha = standPat;

      const captureMoves = chess.moves({ verbose: true }).filter((m) => Boolean(m.captured));
      // MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
      captureMoves.sort((a, b) => {
        const valA = (a.captured ? PIECE_VALUES[a.captured] : 0) - (PIECE_VALUES[a.piece] || 0) / 10;
        const valB = (b.captured ? PIECE_VALUES[b.captured] : 0) - (PIECE_VALUES[b.piece] || 0) / 10;
        return valB - valA;
      });

      for (const move of captureMoves) {
        chess.move(move);
        const score = this.quiescence(chess, alpha, beta, false, qDepth - 1);
        chess.undo();

        if (score >= beta) return beta;
        if (score > alpha) alpha = score;
      }
      return alpha;
    } else {
      if (standPat <= alpha) return alpha;
      if (standPat < beta) beta = standPat;

      const captureMoves = chess.moves({ verbose: true }).filter((m) => Boolean(m.captured));
      captureMoves.sort((a, b) => {
        const valA = (a.captured ? PIECE_VALUES[a.captured] : 0) - (PIECE_VALUES[a.piece] || 0) / 10;
        const valB = (b.captured ? PIECE_VALUES[b.captured] : 0) - (PIECE_VALUES[b.piece] || 0) / 10;
        return valB - valA;
      });

      for (const move of captureMoves) {
        chess.move(move);
        const score = this.quiescence(chess, alpha, beta, true, qDepth - 1);
        chess.undo();

        if (score <= alpha) return alpha;
        if (score < beta) beta = score;
      }
      return beta;
    }
  }

  /**
   * Find best move using Minimax with Alpha-Beta pruning and Quiescence search
   */
  public findBestMove(
    chess: Chess,
    depth: number = 2
  ): { bestMove: Move | null; score: number } {
    const isMaximizing = chess.turn() === 'w';
    let bestMove: Move | null = null;
    let bestScore = isMaximizing ? -Infinity : Infinity;

    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) {
      return { bestMove: null, score: this.evaluatePosition(chess) };
    }

    // Sort moves: captures first
    moves.sort((a, b) => {
      const valA = a.captured ? PIECE_VALUES[a.captured] : 0;
      const valB = b.captured ? PIECE_VALUES[b.captured] : 0;
      return valB - valA;
    });

    let alpha = -Infinity;
    let beta = Infinity;

    for (const move of moves) {
      chess.move(move);
      const score = this.minimax(chess, depth - 1, alpha, beta, !isMaximizing);
      chess.undo();

      if (isMaximizing) {
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
        alpha = Math.max(alpha, bestScore);
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestMove = move;
        }
        beta = Math.min(beta, bestScore);
      }

      if (beta <= alpha) {
        break;
      }
    }

    return { bestMove, score: bestScore };
  }

  private minimax(
    chess: Chess,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean
  ): number {
    if (chess.isGameOver()) {
      return this.evaluatePosition(chess);
    }

    if (depth <= 0) {
      return this.quiescence(chess, alpha, beta, isMaximizing);
    }

    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) {
      return this.evaluatePosition(chess);
    }

    moves.sort((a, b) => (b.captured ? 1 : 0) - (a.captured ? 1 : 0));

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        chess.move(move);
        const evaluation = this.minimax(chess, depth - 1, alpha, beta, false);
        chess.undo();
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        chess.move(move);
        const evaluation = this.minimax(chess, depth - 1, alpha, beta, true);
        chess.undo();
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  /**
   * Get Bot move based on difficulty settings
   */
  public getBotMove(chess: Chess, botLevel: { depth: number; randomness: number }): Move | null {
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) return null;

    const roll = Math.random() * 100;
    if (roll < botLevel.randomness) {
      const randomIndex = Math.floor(Math.random() * moves.length);
      return moves[randomIndex];
    }

    const effectiveDepth = Math.min(Math.max(1, botLevel.depth), 3);
    const { bestMove } = this.findBestMove(chess, effectiveDepth);
    return bestMove || moves[0];
  }

  /**
   * Analyze a single move played using Chess.com's Expected Points Model
   * Supports optional high-precision Stockfish 19 WebAssembly evaluations
   */
  public analyzeMove(
    fenBefore: string,
    moveSan: string,
    moveFrom: string,
    moveTo: string,
    color: PieceColor,
    plyIndex: number = 0,
    previousMoveAnalysis?: MoveAnalysis,
    engineEval?: {
      evalBefore?: number; // In centipawns (from White's perspective)
      evalAfter?: number;  // In centipawns (from White's perspective)
      bestMoveSan?: string;
      bestMoveUci?: string;
    }
  ): MoveAnalysis {
    const chess = new Chess(fenBefore);

    let optimalScore: number;
    let bestMoveSan: string;
    let bestMoveUci: string;
    let optimalMove: any = null;

    if (engineEval?.evalBefore !== undefined && engineEval.bestMoveSan) {
      optimalScore = engineEval.evalBefore;
      bestMoveSan = engineEval.bestMoveSan;
      bestMoveUci = engineEval.bestMoveUci || `${moveFrom}${moveTo}`;
      const legalMoves = chess.moves({ verbose: true });
      optimalMove = legalMoves.find((m) => m.san === bestMoveSan || `${m.from}${m.to}` === bestMoveUci) || null;
    } else {
      // Compute best move and optimal score before the move was played (using minimax + quiescence)
      const found = this.findBestMove(chess, 2);
      optimalMove = found.bestMove;
      optimalScore = found.score;
      bestMoveSan = optimalMove ? optimalMove.san : moveSan;
      bestMoveUci = optimalMove ? `${optimalMove.from}${optimalMove.to}` : `${moveFrom}${moveTo}`;
    }

    // Execute played move
    const moveResult = chess.move(moveSan);
    const fenAfter = chess.fen();

    // Perspective multiplier (White is +1, Black is -1)
    const playerMultiplier = color === 'w' ? 1 : -1;
    const playerOptimalScore = optimalScore * playerMultiplier;

    // Evaluate the resulting position from engine search
    let evalAfter: number;
    if (chess.isCheckmate()) {
      // The played move delivered checkmate!
      evalAfter = color === 'w' ? 20000 : -20000;
    } else if (chess.isDraw() || chess.isStalemate()) {
      evalAfter = 0;
    } else if (engineEval?.evalAfter !== undefined) {
      evalAfter = engineEval.evalAfter;
    } else if (optimalMove && optimalMove.san === moveSan) {
      // Played move matches optimal engine choice
      evalAfter = optimalScore;
    } else {
      // Search from fenAfter with opponent's turn to uncover tactical replies
      const opponentReply = this.findBestMove(chess, 2);
      evalAfter = opponentReply.score;
    }

    const playerEvalBefore = optimalScore * playerMultiplier;
    const playerEvalAfter = evalAfter * playerMultiplier;
    const evalDelta = playerEvalAfter - playerEvalBefore;

    // Expected Points & Win Probabilities (0..100%)
    const winProbBefore = centipawnsToWinProbability(playerEvalBefore);
    const winProbAfter = centipawnsToWinProbability(playerEvalAfter);
    const winProbBest = centipawnsToWinProbability(playerOptimalScore);

    // Expected Points drop (how much win probability dropped compared to best move, scaled 0 to 100%)
    const expectedPointsDrop = Math.max(0, Number((winProbBest - winProbAfter).toFixed(1)));

    // Piece sacrifice check for Brilliant (!!):
    // 1. Voluntary piece sacrifice giving up material
    // 2. Sound sacrifice that is optimal or near-optimal (expectedPointsDrop <= 2.0%)
    // 3. Not in a losing position after making it (winProbAfter >= 45%)
    // 4. Position wasn't already completely overwhelmingly winning (winProbBefore <= 90%)
    const piece = moveResult?.piece;
    const captured = moveResult?.captured;
    const isPieceSacrifice = Boolean(
      piece && 
      ['n', 'b', 'r', 'q'].includes(piece) &&
      (!captured || PIECE_VALUES[piece] > PIECE_VALUES[captured]) &&
      winProbBefore <= 90 &&
      winProbAfter >= 45 &&
      expectedPointsDrop <= 2.0
    );

    // Check if critical game changing move for Great (!):
    // 1. Turned losing position into equal/solid
    const turnedLosingToEqual = winProbBefore < 40 && winProbAfter >= 48 && expectedPointsDrop <= 1.5;
    // 2. Turned equal position into clear win
    const turnedEqualToWinning = winProbBefore <= 55 && winProbAfter >= 75 && expectedPointsDrop <= 1.0;
    // 3. Only good move in the position (best move maintained position while all alternatives lose)
    const isOnlySavingMove = (optimalMove?.san === moveSan) && (winProbBefore < 48) && (winProbAfter >= 46);

    const isGreatMove = turnedLosingToEqual || turnedEqualToWinning || isOnlySavingMove;

    // Check for Miss (X): Position had a winning or heavily advantageous tactical blow (e.g. opponent just blundered),
    // but player failed to capitalize on it
    const hadTacticalWin = (winProbBest >= 65) || (previousMoveAnalysis && (previousMoveAnalysis.classification === 'blunder' || previousMoveAnalysis.classification === 'mistake'));
    const isMiss = hadTacticalWin && expectedPointsDrop >= 10.0;

    // Opening book check: standard opening theory in first 10 plies with minimal loss
    const isBook = plyIndex <= 10 && OPENING_BOOK_SAN.has(moveSan) && expectedPointsDrop <= 2.0;

    // Move Classification based strictly on Chess.com's Expected Points Model documentation:
    // - Best: 0.00 points loss (engine's top move or equivalent)
    // - Excellent: 0.00 - 0.02 loss (0% to 2.0% expected points loss)
    // - Good: 0.02 - 0.05 loss (2.0% to 5.0% expected points loss)
    // - Inaccuracy: 0.05 - 0.10 loss (5.0% to 10.0% expected points loss)
    // - Mistake: 0.10 - 0.20 loss (10.0% to 20.0% expected points loss)
    // - Blunder: 0.20 - 1.00 loss (> 20.0% expected points loss)
    let classification: MoveClassification;

    if (isPieceSacrifice) {
      classification = 'brilliant';
    } else if (isGreatMove && optimalMove?.san === moveSan) {
      classification = 'great';
    } else if (isBook) {
      classification = 'book';
    } else if (optimalMove?.san === moveSan || expectedPointsDrop <= 0.2) {
      classification = 'best';
    } else if (expectedPointsDrop <= 2.0) {
      classification = 'excellent';
    } else if (expectedPointsDrop <= 5.0) {
      classification = 'good';
    } else if (isMiss) {
      classification = 'miss';
    } else if (expectedPointsDrop <= 10.0) {
      classification = 'inaccuracy';
    } else if (expectedPointsDrop <= 20.0) {
      classification = 'mistake';
    } else {
      classification = 'blunder';
    }

    const explanation = this.generateMoveExplanation(
      fenBefore,
      moveSan,
      moveResult,
      classification,
      bestMoveSan,
      evalDelta,
      expectedPointsDrop,
      winProbAfter,
      color
    );

    const tacticalMotive = this.detectTacticalMotive(fenBefore, moveSan, moveResult, classification);

    return {
      san: moveSan,
      from: moveFrom,
      to: moveTo,
      color,
      fenBefore,
      fenAfter,
      evalBefore: optimalScore,
      evalAfter,
      evalDelta,
      classification,
      bestMove: bestMoveUci,
      bestMoveSan,
      explanation,
      tacticalMotive,
      winProbabilityBefore: winProbBefore,
      winProbabilityAfter: winProbAfter,
      expectedPointsDrop,
    };
  }

  /**
   * Generates clear, instructive, rule-based chess reasoning adhering to Chess.com's categories
   */
  public generateMoveExplanation(
    fenBefore: string,
    moveSan: string,
    moveResult: Move | null,
    classification: MoveClassification,
    bestMoveSan: string,
    evalDelta: number = 0,
    param7: PieceColor | number = 0,
    param8: number = 50,
    param9?: PieceColor
  ): string {
    let pointsDrop = 0;
    let winProbAfter = 50;
    let color: PieceColor = 'w';

    if (typeof param7 === 'string') {
      color = param7 as PieceColor;
    } else {
      pointsDrop = param7;
      winProbAfter = param8;
      color = param9 || 'w';
    }
    if (!moveResult) return "Solid move adhering to general chess principles.";

    const pieceNames: Record<string, string> = {
      p: 'Pawn',
      n: 'Knight',
      b: 'Bishop',
      r: 'Rook',
      q: 'Queen',
      k: 'King',
    };
    const pName = pieceNames[moveResult.piece] || 'Piece';

    // Castling
    if (moveSan === 'O-O' || moveSan === 'O-O-O') {
      return `Castling (FIDE Art. 3) secures the ${color === 'w' ? 'White' : 'Black'} King behind an intact pawn shield and connects the rooks for central file control (Chernev: Logical Chess).`;
    }

    // Brilliant (!!)
    if (classification === 'brilliant') {
      return `Brilliant (!!) - A voluntary piece sacrifice that is optimal in the position! As Irving Chernev noted: "Tactics flow from a logically sound position." Even down material, your active initiative secures a commanding ${winProbAfter}% win probability!`;
    }

    // Great (!)
    if (classification === 'great') {
      return `Great (!) - A critical game-changing resource that turns the position around or finds the sole surviving resource to maintain equilibrium under immense pressure!`;
    }

    // Best (⭐)
    if (classification === 'best') {
      return `Best (★) - Optimal engine move. ${moveSan} maximizes piece activity, centralized presence (Zlatanovic: Fundamental Strategy), and asserts total board control with ${winProbAfter}% win probability.`;
    }

    // Excellent (👍)
    if (classification === 'excellent') {
      return `Excellent (👍) - A high-level grandmaster choice with only a minimal ${pointsDrop}% points drop, maintaining strong pressure and piece harmony.`;
    }

    // Book (📖)
    if (classification === 'book') {
      return `Book (📖) - Grandmaster theoretical opening move. Conforms to John Emms's 4 Golden Rules: fight for the centre, develop minor pieces with purpose, and prepare early castling.`;
    }

    // Good (✅)
    if (classification === 'good') {
      return `Good (✓) - A solid, dependable move preserving position safety and tactical coordination without risking your win probability.`;
    }

    // Inaccuracy (?!)
    if (classification === 'inaccuracy') {
      return `Inaccuracy (?!) - A slightly suboptimal move creating minor structural weaknesses (-${pointsDrop}% expected points). ${bestMoveSan} was cleaner. Zlatanovic's advice: "If the opponent neglects centralisation, just improve yours!"`;
    }

    // Mistake (?)
    if (classification === 'mistake') {
      return `Mistake (?) - Noticeably compromises your position (-${pointsDrop}% win probability). ${bestMoveSan} was substantially better to preserve harmony.`;
    }

    // Miss (X)
    if (classification === 'miss') {
      return `Miss (✕) - Missed a clear tactical strike or failed to punish an opponent flaw! Remember Dan Heisman's rule: "Loose Pieces Drop Off" (LPDO). ${bestMoveSan} would have seized a decisive advantage.`;
    }

    // Blunder (??)
    if (classification === 'blunder') {
      return `Blunder (??) - A severe blunder dropping your win probability by ${pointsDrop}%. Dr. Dave Regis: The most common reason games are lost is giving away a piece for nothing or falling into a fork. ${bestMoveSan} was crucial.`;
    }

    return `Positions the ${pName} on ${moveResult.to} to improve piece activity.`;
  }

  /**
   * Detect tactical motives based on Dr. Dave Regis, Dan Heisman, and Boroljub Zlatanovic
   */
  private detectTacticalMotive(
    fenBefore: string,
    moveSan: string,
    moveResult: Move | null,
    classification: MoveClassification
  ): string {
    if (classification === 'brilliant') return 'Piece Sacrifice / Brilliance';
    if (classification === 'great') return 'Heroic Resource / Great Move';
    if (classification === 'miss') return 'Missed Tactical Opportunity (LPDO)';
    if (classification === 'blunder') return 'Hanging Piece / Tactical Overlook';
    if (moveSan.includes('#')) return 'Checkmate';
    
    // Check if move gives check
    if (moveSan.includes('+')) {
      if (moveSan.includes('Nf7') || moveSan.includes('Bf7') || moveSan.includes('Bxf7') || moveSan.includes('Nxf7')) {
        return 'Weak f7/f2 Attack (Wilson)';
      }
      return 'Check / Forcing Initiative';
    }

    if (moveSan === 'O-O' || moveSan === 'O-O-O') return 'King Safety & Castling';
    
    if (moveResult) {
      const { piece, to, captured } = moveResult;
      
      // Greek gift motif: Bxh7+ or Bxh2+
      if (piece === 'b' && (to === 'h7' || to === 'h2') && captured) {
        return 'Greek Gift Sacrifice (Bxh7+)';
      }

      // Smothered mate motif
      if (piece === 'n' && (to === 'g7' || to === 'f7' || to === 'g2' || to === 'f2') && moveSan.includes('#')) {
        return 'Smothered Mate Pattern';
      }

      // Centralization (Boroljub Zlatanovic)
      if (['e4', 'd4', 'e5', 'd5', 'c4', 'c5'].includes(to)) {
        return 'Central Control & Harmony (Zlatanovic)';
      }

      // Capturing undefended/loose piece (Dan Heisman LPDO)
      if (captured) {
        return 'Material Capture / LPDO Conversion';
      }

      // Developing minor pieces (Emms Golden Rules)
      if (piece === 'n' || piece === 'b') {
        return 'Minor Piece Development (Emms)';
      }

      // File activation for heavy pieces
      if (piece === 'r') {
        return 'Open File Activation';
      }
    }

    return 'Positional Harmony';
  }

  /**
   * Scan current board position for active threats & coaching advice
   */
  public scanPositionTactics(chess: Chess): TacticalThreat[] {
    const threats: TacticalThreat[] = [];
    const board = chess.board();
    const currentTurn = chess.turn();

    if (chess.inCheck()) {
      threats.push({
        square: currentTurn === 'w' ? 'e1' : 'e8',
        pieceType: 'King',
        color: currentTurn,
        threatType: 'check',
        description: `${currentTurn === 'w' ? 'White' : 'Black'} King is under direct check! You must respond immediately.`,
      });
    }

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece || piece.type === 'k') continue;

        const square = `${String.fromCharCode(97 + c)}${8 - r}` as Square;
        const isCurrentColor = piece.color === currentTurn;
        const opponentColor: Color = piece.color === 'w' ? 'b' : 'w';
        const isAttacked = chess.isAttacked(square, opponentColor);

        if (isAttacked) {
          threats.push({
            square,
            pieceType: piece.type.toUpperCase(),
            color: piece.color,
            threatType: isCurrentColor ? 'hanging' : 'under_attack',
            description: isCurrentColor 
              ? `Your ${piece.type.toUpperCase()} on ${square} is under attack. Verify its defense!`
              : `Opponent's ${piece.type.toUpperCase()} on ${square} is under attack. Look for tactical conversions!`,
          });
        }
      }
    }

    return threats.slice(0, 4);
  }

  /**
   * Provide a deep offline explanation for why to move a specific piece
   */
  public explainWhyMovePiece(chess: Chess, square: Square): string {
    const piece = chess.get(square);
    if (!piece) return "Select a square with a piece to see tactical coaching notes.";

    const pieceNames: Record<string, string> = {
      p: 'Pawn',
      n: 'Knight',
      b: 'Bishop',
      r: 'Rook',
      q: 'Queen',
      k: 'King',
    };
    const name = pieceNames[piece.type];
    const moves = chess.moves({ square, verbose: true });

    if (moves.length === 0) {
      return `This ${name} currently has no legal moves. It is either pinned, blocked by friendly pieces, or restricted. Look to liberate it by clearing adjacent squares.`;
    }

    const captureMoves = moves.filter((m) => m.captured);
    const checkMoves = moves.filter((m) => m.san.includes('+'));
    const centerMoves = moves.filter((m) => ['e4', 'd4', 'e5', 'd5', 'c4', 'f4', 'c5', 'f5'].includes(m.to));

    const bulletPoints: string[] = [];
    bulletPoints.push(`Controls ${moves.length} legal squares from ${square}.`);

    if (captureMoves.length > 0) {
      const targets = captureMoves.map((m) => m.to).join(', ');
      bulletPoints.push(`Active tactical threats: can capture on ${targets}.`);
    }

    if (checkMoves.length > 0) {
      bulletPoints.push(`Has immediate check potential against the enemy King.`);
    }

    if (centerMoves.length > 0) {
      bulletPoints.push(`Can advance into strong central outposts (${centerMoves.map(m => m.to).join(', ')}).`);
    }

    if (bulletPoints.length === 1) {
      bulletPoints.push(`Supports friendly pawn structure and provides prophylaxis against opponent infiltration.`);
    }

    return `Coaching Brief for ${piece.color === 'w' ? 'White' : 'Black'} ${name} on ${square}:\n• ` + bulletPoints.join('\n• ');
  }

  /**
   * Calculate accuracy percentage using Chess.com's Expected Points CAPS2 Model
   */
  public calculateAccuracy(moves: MoveAnalysis[], color: PieceColor): number {
    const playerMoves = moves.filter((m) => m.color === color);
    if (playerMoves.length === 0) return 100;

    let scoreSum = 0;
    for (const m of playerMoves) {
      switch (m.classification) {
        case 'brilliant':
        case 'great':
        case 'best':
        case 'book':
          scoreSum += 100;
          break;
        case 'excellent':
          scoreSum += 95;
          break;
        case 'good':
          scoreSum += 80;
          break;
        case 'inaccuracy':
          scoreSum += 50;
          break;
        case 'mistake':
          scoreSum += 25;
          break;
        case 'miss':
          scoreSum += 15;
          break;
        case 'blunder':
          scoreSum += 0;
          break;
        default:
          scoreSum += 80;
      }
    }
    return Math.round(scoreSum / playerMoves.length);
  }
}

export const chessEngine = new ChessEngineService();
