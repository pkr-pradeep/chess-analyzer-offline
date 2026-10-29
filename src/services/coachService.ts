import { chessEngine } from './chessEngine';
import { Chess, Square } from 'chess.js';

export interface CoachResponse {
  source: 'ai' | 'offline_engine';
  content: string;
  isOffline: boolean;
}

export class CoachService {
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
        headers: { 'Content-Type': 'application/json' },
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
      content: `Tactical Rationale (Offline Engine):\n• ${explanation}\n• Maintains piece harmony and prevents enemy counterplay.\n• Safe coordinate placement with active board presence.`,
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
        headers: { 'Content-Type': 'application/json' },
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
      content: `Tactical Blunder Breakdown (Offline Engine):
1. The Flaw: ${moveSan} yielded significant positional or material compensation.
2. Punishment: Opponent gains a ${(Math.abs(evalDelta)/100).toFixed(1)} pawn tactical edge.
3. Recommended Move: ${bestMoveSan} was substantially better to preserve balance.
4. Coach's Tip: Always double-check which squares are defended after moving your piece!`,
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
        headers: { 'Content-Type': 'application/json' },
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
      : '• No immediate undefended pieces found. Focus on piece activity and king safety.';

    return {
      source: 'offline_engine',
      content: `Offline Coach Assessment for Current Position:\n${threatsSummary}\n\nKey Principles:\n• Keep King sheltered behind pawn shield.\n• Look for forks and pins on opponent's uncoordinated pieces.\n• Fight for central squares (d4, e4, d5, e5).`,
      isOffline: true,
    };
  }
}

export const coachService = new CoachService();
