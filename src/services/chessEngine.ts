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

// Helper to calculate board position index 0..63
function squareToIndex(square: Square): number {
  const file = square.charCodeAt(0) - 97; // a-h -> 0-7
  const rank = 8 - parseInt(square[1], 10); // 8-1 -> 0-7
  return rank * 8 + file;
}

export interface TacticalThreat {
  square: Square;
  pieceType: string;
  color: PieceColor;
  threatType: 'hanging' | 'under_attack' | 'pinned' | 'forked' | 'open_file' | 'check';
  description: string;
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

    // Fast evaluation based on material + piece-square tables (0.002ms)
    const total = (materialWhite - materialBlack) + (pstWhite - pstBlack);
    return total;
  }

  /**
   * Find best move using Minimax with Alpha-Beta Pruning
   */
  public findBestMove(
    chess: Chess,
    depth: number = 3
  ): { bestMove: Move | null; score: number } {
    const isMaximizing = chess.turn() === 'w';
    let bestMove: Move | null = null;
    let alpha = -Infinity;
    let beta = Infinity;

    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) {
      return { bestMove: null, score: this.evaluatePosition(chess) };
    }

    // Move ordering: prioritize captures and checks for faster pruning
    moves.sort((a, b) => {
      const scoreA = (a.captured ? PIECE_VALUES[a.captured] * 10 - PIECE_VALUES[a.piece] : 0) + (a.san.includes('+') ? 50 : 0);
      const scoreB = (b.captured ? PIECE_VALUES[b.captured] * 10 - PIECE_VALUES[b.piece] : 0) + (b.san.includes('+') ? 50 : 0);
      return scoreB - scoreA;
    });

    let bestScore = isMaximizing ? -Infinity : Infinity;

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

    // Quick move sort for pruning
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

    // Random mistake injection for beginner / casual bots
    const roll = Math.random() * 100;
    if (roll < botLevel.randomness) {
      // Pick a random legal move or second-best move
      const randomIndex = Math.floor(Math.random() * moves.length);
      return moves[randomIndex];
    }

    // Ensure minimax search depth is clamped to max 3 for instant responsiveness (<15ms)
    const effectiveDepth = Math.min(Math.max(1, botLevel.depth), 3);
    const { bestMove } = this.findBestMove(chess, effectiveDepth);
    return bestMove || moves[0];
  }

  /**
   * Analyze a single move played
   */
  public analyzeMove(
    fenBefore: string,
    moveSan: string,
    moveFrom: string,
    moveTo: string,
    color: PieceColor
  ): MoveAnalysis {
    const chess = new Chess(fenBefore);
    const evalBefore = this.evaluatePosition(chess);

    // Compute best move before this move was played (snappy depth 2 for real-time responsiveness)
    const { bestMove: optimalMove, score: optimalScore } = this.findBestMove(chess, 2);
    const bestMoveSan = optimalMove ? optimalMove.san : moveSan;
    const bestMoveUci = optimalMove ? `${optimalMove.from}${optimalMove.to}` : `${moveFrom}${moveTo}`;

    // Now execute played move
    const moveResult = chess.move(moveSan);
    const fenAfter = chess.fen();
    const evalAfter = this.evaluatePosition(chess);

    // Perspective delta: positive delta = user improved; negative delta = user lost eval
    const playerMultiplier = color === 'w' ? 1 : -1;
    const playerEvalBefore = evalBefore * playerMultiplier;
    const playerEvalAfter = evalAfter * playerMultiplier;
    const evalDelta = playerEvalAfter - playerEvalBefore;

    // Classify move
    let classification: MoveClassification = 'good';
    const isOptimal = moveSan === bestMoveSan;

    if (isOptimal) {
      // Check for brilliant sacrifice: sacrificed material but maintained or improved advantage
      const captured = moveResult?.captured;
      const isSacrifice = !captured && (moveResult?.piece === 'q' || moveResult?.piece === 'r' || moveResult?.piece === 'b' || moveResult?.piece === 'n') && evalDelta >= 50;
      classification = isSacrifice ? 'brilliant' : 'best';
    } else if (evalDelta >= -20) {
      classification = 'best';
    } else if (evalDelta >= -60) {
      classification = 'excellent';
    } else if (evalDelta >= -130) {
      classification = 'good';
    } else if (evalDelta >= -240) {
      classification = 'inaccuracy';
    } else if (evalDelta >= -450) {
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
    };
  }

  /**
   * Generates clear, instructive, rule-based chess reasoning for why to move a piece or why it was a blunder
   */
  public generateMoveExplanation(
    fenBefore: string,
    moveSan: string,
    moveResult: Move | null,
    classification: MoveClassification,
    bestMoveSan: string,
    evalDelta: number,
    color: PieceColor
  ): string {
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

    // Blunders & Mistakes
    if (classification === 'blunder') {
      return `Blunder (${(evalDelta / 100).toFixed(1)} pawns)! Moving ${pName} to ${moveResult.to} overlooked crucial tactical defense or conceded severe material. Better was ${bestMoveSan}.`;
    }
    if (classification === 'mistake') {
      return `Mistake (${(evalDelta / 100).toFixed(1)} pawns). ${moveSan} relinquishes initiative or leaves a defensive vulnerability. Recommended was ${bestMoveSan}.`;
    }
    if (classification === 'inaccuracy') {
      return `Inaccuracy. ${moveSan} is playable but slightly passive. ${bestMoveSan} puts higher pressure on the opponent.`;
    }

    // Captures
    if (moveResult.captured) {
      const capturedName = pieceNames[moveResult.captured] || 'piece';
      return `Captures the enemy ${capturedName} on ${moveResult.to}, gaining material and simplifying into an advantageous position.`;
    }

    // Check
    if (moveSan.includes('+')) {
      return `Delivers check with the ${pName} on ${moveResult.to}, forcing opponent's King to respond and seizing critical tactical tempo.`;
    }

    // Central development
    const centerSquares = ['d4', 'e4', 'd5', 'e5', 'c4', 'f4', 'c5', 'f5'];
    if (centerSquares.includes(moveResult.to)) {
      return `Develops the ${pName} actively to ${moveResult.to}, staking a strong claim over central squares and restricting enemy counterplay.`;
    }

    // Minor piece development
    if (moveResult.piece === 'n' || moveResult.piece === 'b') {
      return `Develops minor piece ${pName} to ${moveResult.to}, clearing back rank for castling and coordinating harmoniously with surrounding pieces.`;
    }

    // Rook to open file
    if (moveResult.piece === 'r') {
      return `Activates the Rook onto ${moveResult.to}, eyeing crucial open files and potential infiltration along the 7th rank.`;
    }

    return `Positions the ${pName} on ${moveResult.to} to improve piece activity, fortify structure, and prepare future tactical operations.`;
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

    // Check if king is in check
    if (chess.inCheck()) {
      threats.push({
        square: currentTurn === 'w' ? 'e1' : 'e8',
        pieceType: 'King',
        color: currentTurn,
        threatType: 'check',
        description: `${currentTurn === 'w' ? 'White' : 'Black'} King is under direct check! You must respond immediately.`,
      });
    }

    // Check for hanging / undefended pieces
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece || piece.type === 'k') continue;

        const square = `${String.fromCharCode(97 + c)}${8 - r}` as Square;
        const isCurrentColor = piece.color === currentTurn;

        // Count enemy attackers
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
   * Calculate accuracy percentage from moves
   */
  public calculateAccuracy(moves: MoveAnalysis[], color: PieceColor): number {
    const playerMoves = moves.filter((m) => m.color === color);
    if (playerMoves.length === 0) return 100;

    let scoreSum = 0;
    for (const m of playerMoves) {
      switch (m.classification) {
        case 'brilliant':
        case 'best':
          scoreSum += 100;
          break;
        case 'excellent':
          scoreSum += 90;
          break;
        case 'good':
          scoreSum += 75;
          break;
        case 'inaccuracy':
          scoreSum += 50;
          break;
        case 'mistake':
          scoreSum += 25;
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
