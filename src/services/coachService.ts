import { chessEngine } from './chessEngine';
import { Chess } from 'chess.js';
import { geminiKeyService } from './geminiKeyService';

export interface CoachResponse {
  source: 'ai' | 'offline_engine';
  content: string;
  isOffline: boolean;
}

export class CoachService {
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const key = geminiKeyService.getStoredApiKey();
    if (key) {
      headers['x-gemini-key'] = key;
    }
    return headers;
  }

  /**
   * Explains why to move a specific piece or move
   */
  public async explainWhyMove(
    fen: string,
    moveSan: string,
    context?: string
  ): Promise<CoachResponse> {
    try {
      const res = await fetch('/api/gemini/coach', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          mode: 'why_move',
          fen,
          move: moveSan,
          context,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.analysis) {
          return {
            source: 'ai',
            content: data.analysis,
            isOffline: false,
          };
        }
      }
    } catch {
      // Offline fallback
    }

    // Offline Local Tactical Engine Fallback
    const chess = new Chess(fen);
    const moveResult = chess.move(moveSan);
    const explanation = chessEngine.generateMoveExplanation(
      fen,
      moveSan,
      moveResult,
      'best',
      moveSan,
      0,
      chess.turn() === 'w' ? 'b' : 'w' // turn was flipped after move
    );

    return {
      source: 'offline_engine',
      content: `Grandmaster Coach Insight (Offline Engine):
• Motive: ${explanation}
• Strategic Logic (Chernev: Logical Chess): Piece moves with purpose, fighting for central control and developing towards active squares.
• Tactical Safety (Heisman: LPDO): Ensure no friendly pieces were left loose or undefended after making this move.
• Next Objective: Watch for opponent counterplay in the center and prepare coordinated king safety.`,
      isOffline: true,
    };
  }

  /**
   * Deep dive analysis for a blunder or mistake
   */
  public async analyzeBlunder(
    fenBefore: string,
    moveSan: string,
    bestMoveSan: string,
    evalDelta: number
  ): Promise<CoachResponse> {
    try {
      const res = await fetch('/api/gemini/coach', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          mode: 'blunder_analysis',
          fen: fenBefore,
          move: moveSan,
          context: `Played: ${moveSan}, Best alternative: ${bestMoveSan}, Evaluation dropped by ${(Math.abs(evalDelta)/100).toFixed(1)} pawns.`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.analysis) {
          return {
            source: 'ai',
            content: data.analysis,
            isOffline: false,
          };
        }
      }
    } catch {
      // Fall through to offline engine
    }

    return {
      source: 'offline_engine',
      content: `Tactical Blunder Breakdown (Master Coach):
1. The Flaw: ${moveSan} yielded significant compensation (dropped ${(Math.abs(evalDelta)/100).toFixed(1)} pawns in evaluation).
2. The Tactical Threat: Opponent can exploit loose piece geometry, unmasked lines, or an exposed King (Dr. Dave Regis: The Three Most Common Reasons Games Are Lost).
3. Recommended Alternative: ${bestMoveSan} was substantially stronger, keeping piece harmony and central balance.
4. Coach's Golden Rule (Dan Heisman LPDO): "Loose Pieces Drop Off! Always check what is attacked and what is defended before you let go of the piece!"`,
      isOffline: true,
    };
  }

  /**
   * Ask Coach custom question
   */
  public async askCoachQuestion(
    question: string,
    fen: string,
    pgn?: string
  ): Promise<CoachResponse> {
    try {
      const res = await fetch('/api/gemini/coach', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          mode: 'custom_question',
          userQuestion: question,
          fen,
          pgn,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.analysis) {
          return {
            source: 'ai',
            content: data.analysis,
            isOffline: false,
          };
        }
      }
    } catch {
      // Offline
    }

    const chess = new Chess(fen);
    const threats = chessEngine.scanPositionTactics(chess);
    const threatsSummary = threats.length > 0
      ? threats.map(t => `• ${t.description}`).join('\n')
      : '• No immediate loose or undefended pieces detected. Pieces are functioning harmoniously.';

    return {
      source: 'offline_engine',
      content: `Master Coach Assessment for Current Position:
${threatsSummary}

Key Guiding Principles (From Chess Classics):
• Centralisation (Boroljub Zlatanovic): If your opponent neglects central control, immediately improve yours!
• Safety First (Dan Heisman LPDO): Loose Pieces Drop Off. Constantly audit which pieces are undefended.
• Piece Harmony (Irving Chernev): Place knights and pawns on squares of the same color, and bishops on opposite colors.
• King Safety (Fred Wilson): Guard f7/f2 diligently and castle early before attacking.`,
      isOffline: true,
    };
  }
}

export const coachService = new CoachService();
