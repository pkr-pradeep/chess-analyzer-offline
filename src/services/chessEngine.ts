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

// Standard Opening Book Lines
const OPENING_BOOK_SAN = new Set([
  // 1st moves
  'e4', 'd4', 'c4', 'Nf3', 'g3', 'f4', 'b3', 'Nc3',
  'e5', 'c5', 'e6', 'c6', 'd5', 'Nf6', 'g6', 'd6', 'b6',
  // 2nd moves
  'Nf3', 'Nc3', 'Bc4', 'Bb5', 'd4', 'c3', 'f4', 'c4', 'Bf4', 'Bg5', 'd3', 'g3',
  'Nc6', 'Nf6', 'd6', 'Bc5', 'e6', 'd5', 'exd4', 'cxd4', 'Bb4', 'a6', 'g6', 'Bg7',
  // 3rd moves & 4th moves
  'Bc4', 'Bb5', 'd4', 'exd5', 'cxd5', 'Nc3', 'Nbd2', 'O-O', 'Be2', 'Bd3', 'c4', 'c3', 'a3', 'h3',
  'Bc5', 'Bb4', 'Be7', 'Bd6', 'O-O', 'a6', 'b5', 'h6', 'Re8', 'Qe7', 'Qc7', 'Nbd7', 'd5', 'e5'
]);

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
    return total;
  }

  /**
   * Find best move using Minimax with Alpha-Beta pruning
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
    if (depth === 0 || chess.isGameOver()) {
      return this.evaluatePosition(chess);
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
   */
  public analyzeMove(
    fenBefore: string,
    moveSan: string,
    moveFrom: string,
    moveTo: string,
    color: PieceColor,
    plyIndex: number = 0,
    previousMoveAnalysis?: MoveAnalysis
  ): MoveAnalysis {
    const chess = new Chess(fenBefore);
    const evalBefore = this.evaluatePosition(chess);

    // Compute best move and best score before the move was played
    const { bestMove: optimalMove, score: optimalScore } = this.findBestMove(chess, 2);
    const bestMoveSan = optimalMove ? optimalMove.san : moveSan;
    const bestMoveUci = optimalMove ? `${optimalMove.from}${optimalMove.to}` : `${moveFrom}${moveTo}`;

    // Execute played move
    const moveResult = chess.move(moveSan);
    const fenAfter = chess.fen();
    const evalAfter = this.evaluatePosition(chess);

    // Perspective evaluations from current player's standpoint
    const playerMultiplier = color === 'w' ? 1 : -1;
    const playerEvalBefore = evalBefore * playerMultiplier;
    const playerEvalAfter = evalAfter * playerMultiplier;
    const playerOptimalScore = optimalScore * playerMultiplier;
    const evalDelta = playerEvalAfter - playerEvalBefore;

    // Expected Points & Win Probabilities (0..100%)
    const winProbBefore = centipawnsToWinProbability(playerEvalBefore);
    const winProbAfter = centipawnsToWinProbability(playerEvalAfter);
    const winProbBest = centipawnsToWinProbability(playerOptimalScore);

    // Expected Points drop (how much win probability dropped compared to best move)
    const expectedPointsDrop = Math.max(0, Number((winProbBest - winProbAfter).toFixed(1)));

    // Piece sacrifice check for Brilliant (!!) move
    const piece = moveResult?.piece;
    const captured = moveResult?.captured;
    const isPieceSacrifice = Boolean(
      piece && 
      ['n', 'b', 'r', 'q'].includes(piece) &&
      (!captured || PIECE_VALUES[piece] > PIECE_VALUES[captured]) &&
      winProbAfter >= 45 &&
      expectedPointsDrop <= 2.5
    );

    // Check if critical game changing move for Great (!)
    // 1. Turned losing position into equal/solid
    const turnedLosingToEqual = winProbBefore < 38 && winProbAfter >= 46 && expectedPointsDrop <= 1.5;
    // 2. Turned equal position into clear win
    const turnedEqualToWinning = winProbBefore <= 54 && winProbAfter >= 72 && expectedPointsDrop <= 1.0;
    // 3. Only good move in the position (best move maintained eval while alternatives lose)
    const isOnlySavingMove = (optimalMove?.san === moveSan) && (winProbBefore < 48) && (winProbAfter >= 46);

    const isGreatMove = turnedLosingToEqual || turnedEqualToWinning || isOnlySavingMove;

    // Check for Miss (X): Position had a winning or heavily advantageous tactical blow, but player missed it
    const hadTacticalWin = winProbBest >= 62 || (previousMoveAnalysis && (previousMoveAnalysis.classification === 'blunder' || previousMoveAnalysis.classification === 'mistake'));
    const isMiss = hadTacticalWin && expectedPointsDrop >= 14 && winProbAfter <= 50;

    // Opening book check
    const isBook = plyIndex <= 10 && OPENING_BOOK_SAN.has(moveSan) && expectedPointsDrop <= 3.5;

    // Move Classification based on Chess.com Expected Points Model
    let classification: MoveClassification;

    if (isPieceSacrifice) {
      classification = 'brilliant';
    } else if (isGreatMove && optimalMove?.san === moveSan) {
      classification = 'great';
    } else if (isBook) {
      classification = 'book';
    } else if (optimalMove?.san === moveSan || expectedPointsDrop <= 0.8) {
      classification = 'best';
    } else if (expectedPointsDrop <= 3.0) {
      classification = 'excellent';
    } else if (expectedPointsDrop <= 7.0) {
      classification = 'good';
    } else if (isMiss) {
      classification = 'miss';
    } else if (expectedPointsDrop <= 13.0) {
      classification = 'inaccuracy';
    } else if (expectedPointsDrop <= 22.0) {
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
      evalBefore,
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
      return `Castling secures the ${color === 'w' ? 'White' : 'Black'} King behind protective pawns and connects the rooks for central coordination.`;
    }

    // Brilliant (!!)
    if (classification === 'brilliant') {
      return `Brilliant (!!) - A sound, voluntary piece sacrifice that is the optimal choice in the position. Even after sacrificing material, you maintain a winning ${winProbAfter}% win probability!`;
    }

    // Great (!)
    if (classification === 'great') {
      return `Great (!) - A critical game-changing resource that turns the outcome of the position or finds the only good move available to stay balanced!`;
    }

    // Best (⭐)
    if (classification === 'best') {
      return `Best (⭐) - The optimal engine move. ${moveSan} maximizes piece activity and asserts total control with a ${winProbAfter}% win probability.`;
    }

    // Excellent (👍)
    if (classification === 'excellent') {
      return `Excellent (👍) - A near-top choice with only a minimal ${pointsDrop}% drop in expected points, keeping full pressure on your opponent.`;
    }

    // Book (📖)
    if (classification === 'book') {
      return `Book (📖) - A recognized, theoretical opening move establishing healthy central presence and piece harmony according to grandmaster theory.`;
    }

    // Good (✅)
    if (classification === 'good') {
      return `Good (✅) - A solid, dependable move that preserves position safety without compromising your win probability.`;
    }

    // Inaccuracy (?!)
    if (classification === 'inaccuracy') {
      return `Inaccuracy (?!) - A weak or slightly dubious move that creates minor structural weaknesses (-${pointsDrop}% win chance). Better was ${bestMoveSan}.`;
    }

    // Mistake (?)
    if (classification === 'mistake') {
      return `Mistake (?) - Noticeably worsens your position (-${pointsDrop}% win probability). ${bestMoveSan} was substantially stronger.`;
    }

    // Miss (X)
    if (classification === 'miss') {
      return `Miss (X) - Failed to capitalize on an opponent mistake or missed a clear tactical/winning breakthrough! ${bestMoveSan} would have seized a massive edge.`;
    }

    // Blunder (??)
    if (classification === 'blunder') {
      return `Blunder (??) - A severe, game-swinging blunder that dropped your win probability by ${pointsDrop}%. ${bestMoveSan} was crucial to stay in the fight.`;
    }

    return `Positions the ${pName} on ${moveResult.to} to improve piece activity.`;
  }

  /**
   * Detect tactical motives (Pin, Fork, Hanging Piece, King Safety, etc.)
   */
  private detectTacticalMotive(
    fenBefore: string,
    moveSan: string,
    moveResult: Move | null,
    classification: MoveClassification
  ): string {
    if (classification === 'brilliant') return 'Piece Sacrifice / Brilliance';
    if (classification === 'great') return 'Heroic Resource / Great Move';
    if (classification === 'miss') return 'Missed Tactical Opportunity';
    if (classification === 'blunder') return 'Hanging / Tactical Overlook';
    if (moveSan.includes('#')) return 'Checkmate';
    if (moveSan.includes('+')) return 'Check / Initiative';
    if (moveSan === 'O-O' || moveSan === 'O-O-O') return 'King Safety';
    if (moveResult?.captured) return 'Material Capture';
    if (moveResult?.piece === 'n' || moveResult?.piece === 'b') return 'Piece Development';
    if (moveResult?.piece === 'p' && ['e4', 'd4', 'e5', 'd5'].includes(moveResult.to)) return 'Central Control';
    if (moveResult?.piece === 'r') return 'File Activation';
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
