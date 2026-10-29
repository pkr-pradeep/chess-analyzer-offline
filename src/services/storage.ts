import { Chess } from 'chess.js';
import { GameRecord, RatingPoint, ChessPuzzle, ImprovementPlan, MoveAnalysis } from '../types/chess';

export function parsePgnToMoves(pgn: string): MoveAnalysis[] {
  if (!pgn) return [];
  try {
    const c = new Chess();
    c.loadPgn(pgn);
    const history = c.history({ verbose: true });
    const stepper = new Chess();
    return history.map((m) => {
      const fenBefore = stepper.fen();
      stepper.move(m);
      const fenAfter = stepper.fen();
      return {
        san: m.san,
        from: m.from,
        to: m.to,
        color: m.color,
        fenBefore,
        fenAfter,
        evalBefore: 0,
        evalAfter: 0,
        evalDelta: 0,
        classification: 'good',
        explanation: '',
      };
    });
  } catch (err) {
    console.warn('Failed to parse PGN to moves:', err);
    return [];
  }
}

const STORAGE_KEYS = {
  GAMES: 'chess_bot_games_v1',
  RATINGS: 'chess_bot_ratings_v1',
  PUZZLES: 'chess_bot_puzzles_v1',
  IMPROVEMENT_PLAN: 'chess_bot_improvement_plan_v1',
  USER_PREFERENCES: 'chess_bot_prefs_v1',
};

// High-quality initial practice puzzles
const INITIAL_PUZZLES: ChessPuzzle[] = [
  {
    id: 'puz-fork-1',
    title: 'Royal Knight Fork',
    fen: 'r1b1k2r/pppp1ppp/8/4N3/1b1qn3/2N5/PPPP1PPP/R1BQKB1R w KQkq - 0 7',
    solution: ['Qf3', 'Qxe5', 'Qxf7+'],
    playerToMove: 'w',
    theme: 'fork',
    rating: 1250,
    difficulty: 'Beginner',
    hint: 'Look for the vulnerable f7 square defended only by the Black King.',
    explanation: 'Qf3 exerts lethal double pressure on f7 while defending e4. Black is forced to concede material.',
  },
  {
    id: 'puz-backrank-1',
    title: 'Back-Rank Decoy',
    fen: '3r2k1/5ppp/8/8/8/8/1Q3PPP/6K1 w - - 0 1',
    solution: ['Qb8', 'Rxb8', 'Rxd8#'],
    playerToMove: 'w',
    theme: 'back_rank',
    rating: 1320,
    difficulty: 'Beginner',
    hint: 'Notice Black King has no flight squares ("luft") on the 8th rank.',
    explanation: 'Sacrificing the Queen on the back rank deflects the defending Rook, delivering an inescapable back-rank checkmate.',
  },
  {
    id: 'puz-pin-1',
    title: 'Absolute Pin Conversion',
    fen: 'r3kb1r/pppq1ppp/2n1pn2/1B1p4/3P4/2N1PN2/PPP2PPP/R1BQK2R w KQkq - 0 6',
    solution: ['Ne5', 'Qd6', 'Bxc6+'],
    playerToMove: 'w',
    theme: 'pin',
    rating: 1450,
    difficulty: 'Intermediate',
    hint: 'Black Knight on c6 is pinned to the King/Queen. Pile up pressure!',
    explanation: 'Ne5 adds a second attacker to the pinned c6-knight. Black cannot defend both threats without breaking pawn structure.',
  },
  {
    id: 'puz-deflection-1',
    title: 'Queen Deflection Mate',
    fen: '5rk1/5ppp/8/8/8/1B6/4qPPP/2Q3K1 w - - 0 1',
    solution: ['Bxf7+', 'Rxf7', 'Qc8+', 'Rf8', 'Qxf8#'],
    playerToMove: 'w',
    theme: 'deflection',
    rating: 1580,
    difficulty: 'Intermediate',
    hint: 'Can you deflect the f7 defense and break open the back rank?',
    explanation: 'Bxf7+ forces the King or Rook to move, allowing Qc8+ followed by forced back-rank execution.',
  },
  {
    id: 'puz-endgame-1',
    title: 'Lucena Bridge Building',
    fen: '1K1R4/1P3k2/8/8/8/8/7r/8 w - - 0 1',
    solution: ['Rd4', 'Ke7', 'Kc7', 'Rc2+', 'Kb6', 'Rb2+', 'Kc6'],
    playerToMove: 'w',
    theme: 'endgame',
    rating: 1750,
    difficulty: 'Advanced',
    hint: 'Set up the 4th rank rook shield to block horizontal checks.',
    explanation: 'The classic Lucena technique: placing the rook on the 4th rank prepares a shield ("bridge") against enemy rook checks.',
  },
  {
    id: 'puz-skewer-1',
    title: 'Lethal Rook Skewer',
    fen: '8/8/8/4k3/8/8/1r6/R3K3 w - - 0 1',
    solution: ['Ra4'],
    playerToMove: 'w',
    theme: 'skewer',
    rating: 1200,
    difficulty: 'Beginner',
    hint: 'Cut off the King and keep your pieces coordinated.',
    explanation: 'Active rook placement cuts off the King from penetrating the queenside.',
  },
];

// Realistic seeded games so dashboard has rich initial progress visuals
const SEED_GAMES: GameRecord[] = [
  {
    id: 'game-seed-1',
    date: '2026-09-08 14:20',
    whitePlayer: 'You (1200)',
    blackPlayer: 'Bot (Casual 1200)',
    playerColor: 'w',
    botLevel: 'Casual 1200',
    result: '1-0',
    terminationReason: 'Checkmate',
    pgn: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 d6 6. c3 O-O 7. Bg5 h6 8. Bh4 g5 9. Nxg5 hxg5 10. Bxg5 Kg7 11. Qf3 Rh8 12. Qg3 Nh5 13. Bxd8+ Nxg3 14. hxg3 Nxd8',
    moves: [],
    whiteAccuracy: 84.2,
    blackAccuracy: 71.5,
    whiteBlunders: 1,
    blackBlunders: 3,
    whiteMistakes: 2,
    blackMistakes: 4,
    whiteInaccuracies: 3,
    blackInaccuracies: 5,
    ratingBefore: 1200,
    ratingAfter: 1215,
  },
  {
    id: 'game-seed-2',
    date: '2026-09-09 16:45',
    whitePlayer: 'Bot (Club Player 1600)',
    blackPlayer: 'You (1215)',
    playerColor: 'b',
    botLevel: 'Club Player 1600',
    result: '1-0',
    terminationReason: 'Resignation',
    pgn: '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 Nbd7 7. Qc2 c5 8. cxd5 exd5 9. Bd3 c4 10. Bf5 a6 11. a4',
    moves: [],
    whiteAccuracy: 91.0,
    blackAccuracy: 76.4,
    whiteBlunders: 0,
    blackBlunders: 2,
    whiteMistakes: 1,
    blackMistakes: 3,
    whiteInaccuracies: 2,
    blackInaccuracies: 4,
    ratingBefore: 1215,
    ratingAfter: 1208,
  },
  {
    id: 'game-seed-3',
    date: '2026-09-10 19:10',
    whitePlayer: 'You (1208)',
    blackPlayer: 'Bot (Casual 1200)',
    playerColor: 'w',
    botLevel: 'Casual 1200',
    result: '1-0',
    terminationReason: 'Checkmate',
    pgn: '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 8. f3 Be7 9. Qd2 O-O 10. O-O-O Nbd7 11. g4 b5 12. g5 Nh5 13. Nd5 Bxd5 14. exd5',
    moves: [],
    whiteAccuracy: 88.5,
    blackAccuracy: 74.0,
    whiteBlunders: 0,
    blackBlunders: 2,
    whiteMistakes: 1,
    blackMistakes: 3,
    whiteInaccuracies: 2,
    blackInaccuracies: 3,
    ratingBefore: 1208,
    ratingAfter: 1226,
  },
  {
    id: 'game-seed-4',
    date: '2026-09-11 11:30',
    whitePlayer: 'Bot (Intermediate 1500)',
    blackPlayer: 'You (1226)',
    playerColor: 'b',
    botLevel: 'Intermediate 1500',
    result: '1/2-1/2',
    terminationReason: 'Draw by repetition',
    pgn: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7',
    moves: [],
    whiteAccuracy: 86.1,
    blackAccuracy: 85.3,
    whiteBlunders: 0,
    blackBlunders: 1,
    whiteMistakes: 2,
    blackMistakes: 2,
    whiteInaccuracies: 4,
    blackInaccuracies: 3,
    ratingBefore: 1226,
    ratingAfter: 1234,
  },
  {
    id: 'game-seed-5',
    date: '2026-09-12 09:15',
    whitePlayer: 'You (1234)',
    blackPlayer: 'Bot (Casual 1200)',
    playerColor: 'w',
    botLevel: 'Casual 1200',
    result: '1-0',
    terminationReason: 'Resignation',
    pgn: '1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. Qg4 O-O 8. Bd3 Nbc6 9. Qh5 Ng6 10. Nf3 c4 11. Ng5 h6 12. Nxf7 Rxf7 13. Bxg6',
    moves: [],
    whiteAccuracy: 92.4,
    blackAccuracy: 69.8,
    whiteBlunders: 0,
    blackBlunders: 3,
    whiteMistakes: 1,
    blackMistakes: 4,
    whiteInaccuracies: 2,
    blackInaccuracies: 4,
    ratingBefore: 1234,
    ratingAfter: 1252,
  },
];

const SEED_RATINGS: RatingPoint[] = [
  { id: 'r-1', date: 'Sep 05', timestamp: Date.now() - 7 * 86400000, rating: 1180, change: 0, mode: 'vs_bot', accuracy: 78 },
  { id: 'r-2', date: 'Sep 07', timestamp: Date.now() - 5 * 86400000, rating: 1200, change: 20, mode: 'vs_bot', accuracy: 82 },
  { id: 'r-3', date: 'Sep 08', timestamp: Date.now() - 4 * 86400000, rating: 1215, change: 15, mode: 'vs_bot', accuracy: 84 },
  { id: 'r-4', date: 'Sep 09', timestamp: Date.now() - 3 * 86400000, rating: 1208, change: -7, mode: 'vs_bot', accuracy: 76 },
  { id: 'r-5', date: 'Sep 10', timestamp: Date.now() - 2 * 86400000, rating: 1226, change: 18, mode: 'vs_bot', accuracy: 88 },
  { id: 'r-6', date: 'Sep 11', timestamp: Date.now() - 1 * 86400000, rating: 1234, change: 8, mode: 'vs_bot', accuracy: 85 },
  { id: 'r-7', date: 'Sep 12', timestamp: Date.now(), rating: 1252, change: 18, mode: 'vs_bot', accuracy: 92 },
];

export class OfflineStorageService {
  /**
   * Get all saved games (stored 100% locally in browser)
   */
  public getGames(): GameRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GAMES);
      let list: GameRecord[] = [];
      if (!data) {
        list = SEED_GAMES;
        this.saveGames(SEED_GAMES);
      } else {
        list = JSON.parse(data);
      }
      return list.map((g) => {
        if ((!g.moves || g.moves.length === 0) && g.pgn) {
          return {
            ...g,
            moves: parsePgnToMoves(g.pgn),
          };
        }
        return g;
      });
    } catch {
      return SEED_GAMES.map((g) => {
        if ((!g.moves || g.moves.length === 0) && g.pgn) {
          return {
            ...g,
            moves: parsePgnToMoves(g.pgn),
          };
        }
        return g;
      });
    }
  }

  public saveGames(games: GameRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games));
    } catch (e) {
      console.error("Storage error:", e);
    }
  }

  public addGame(game: GameRecord): void {
    const games = this.getGames();
    const updated = [game, ...games.filter(g => g.id !== game.id)];
    this.saveGames(updated);

    // Also record rating point
    const latestRating = game.ratingAfter;
    const change = game.ratingAfter - game.ratingBefore;
    this.addRatingPoint({
      id: 'r-' + Date.now(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timestamp: Date.now(),
      rating: latestRating,
      change,
      gameId: game.id,
      mode: 'vs_bot',
      accuracy: game.playerColor === 'w' ? game.whiteAccuracy : game.blackAccuracy,
    });
  }

  /**
   * Rating history
   */
  public getRatingHistory(): RatingPoint[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RATINGS);
      if (!data) {
        this.saveRatingHistory(SEED_RATINGS);
        return SEED_RATINGS;
      }
      return JSON.parse(data);
    } catch {
      return SEED_RATINGS;
    }
  }

  public saveRatingHistory(ratings: RatingPoint[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(ratings));
    } catch (e) {
      console.error(e);
    }
  }

  public addRatingPoint(point: RatingPoint): void {
    const history = this.getRatingHistory();
    const updated = [...history, point];
    this.saveRatingHistory(updated);
  }

  public getCurrentRating(): number {
    const history = this.getRatingHistory();
    if (history.length === 0) return 1200;
    return history[history.length - 1].rating;
  }

  /**
   * Puzzles
   */
  public getPuzzles(): ChessPuzzle[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PUZZLES);
      if (!data) {
        this.savePuzzles(INITIAL_PUZZLES);
        return INITIAL_PUZZLES;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_PUZZLES;
    }
  }

  public savePuzzles(puzzles: ChessPuzzle[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PUZZLES, JSON.stringify(puzzles));
    } catch (e) {
      console.error(e);
    }
  }

  public addPuzzleFromBlunder(
    fen: string,
    bestMoveSan: string,
    bestMoveUci: string,
    blunderSan: string,
    explanation: string,
    gameId: string
  ): ChessPuzzle {
    const puzzles = this.getPuzzles();
    const newPuzzle: ChessPuzzle = {
      id: `blunder-${Date.now()}`,
      title: `Tactical Drill: Fix Your ${blunderSan} Mistake`,
      fen,
      solution: [bestMoveSan],
      playerToMove: fen.split(' ')[1] as any,
      theme: 'hanging_piece',
      rating: this.getCurrentRating(),
      difficulty: 'Intermediate',
      hint: `In your game, you played ${blunderSan}. Find the optimal response that avoids this leak!`,
      explanation: `Solution: ${bestMoveSan}. ${explanation}`,
      isUserBlunder: true,
      originGameId: gameId,
    };

    const updated = [newPuzzle, ...puzzles];
    this.savePuzzles(updated);
    return newPuzzle;
  }

  /**
   * Improvement Plan
   */
  public getImprovementPlan(): ImprovementPlan | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.IMPROVEMENT_PLAN);
      if (data) return JSON.parse(data);
    } catch {}

    // Generate initial structured plan
    return this.generateDefaultImprovementPlan();
  }

  public saveImprovementPlan(plan: ImprovementPlan): void {
    try {
      localStorage.setItem(STORAGE_KEYS.IMPROVEMENT_PLAN, JSON.stringify(plan));
    } catch (e) {
      console.error(e);
    }
  }

  public generateDefaultImprovementPlan(): ImprovementPlan {
    const games = this.getGames();
    const currentRating = this.getCurrentRating();

    const plan: ImprovementPlan = {
      id: `plan-${Date.now()}`,
      generatedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      playerRating: currentRating,
      primaryWeaknesses: [
        {
          theme: 'Tactical Awareness & Hanging Pieces',
          description: 'Occasional oversights of piece coordination, resulting in unprotected minor pieces.',
          frequency: 4,
          severity: 'high',
        },
        {
          theme: 'Endgame King Activity',
          description: 'Hesitation to activate the King once Queens are exchanged off the board.',
          frequency: 3,
          severity: 'medium',
        },
        {
          theme: 'Defensive Prophylaxis',
          description: 'Focusing solely on own attacking ideas while neglecting opponent checkmate threats.',
          frequency: 2,
          severity: 'medium',
        },
      ],
      phases: [
        {
          phaseNumber: 1,
          title: 'Tactical Hygiene & Blunder Defense',
          focus: 'Eliminate one-move blunders and spot opponent tactical motifs (Forks, Pins, Skewers).',
          duration: 'Week 1 - 2',
          drills: [
            {
              id: 'd1',
              title: 'Spot the Hanging Piece',
              goal: 'Perform 10 tactical checks per game before releasing the mouse.',
              completed: true,
              puzzleTheme: 'hanging_piece',
            },
            {
              id: 'd2',
              title: 'Master Knight Forks & Skewers',
              goal: 'Solve 15 Knight Fork practice puzzles with >80% accuracy.',
              completed: false,
              puzzleTheme: 'fork',
            },
            {
              id: 'd3',
              title: 'Back-Rank Defense Routine',
              goal: 'Always create luft (h3/g3 or h6/g6) before launching a heavy piece assault.',
              completed: false,
              puzzleTheme: 'back_rank',
            },
          ],
        },
        {
          phaseNumber: 2,
          title: 'Positional Harmony & Center Domination',
          focus: 'Control d4/e4/d5/e5 and place rooks on open files.',
          duration: 'Week 3 - 4',
          drills: [
            {
              id: 'd4',
              title: 'Minor Piece Coordination',
              goal: 'Castle within the first 8 moves in at least 4 consecutive games.',
              completed: false,
            },
            {
              id: 'd5',
              title: 'Rook Infiltration Drills',
              goal: 'Occupy the 7th rank with a connected rook pair in middle game.',
              completed: false,
            },
          ],
        },
        {
          phaseNumber: 3,
          title: 'Endgame Precision & Conversion',
          focus: 'Convert +2 material leads into clean checkmates with zero stalemate mistakes.',
          duration: 'Week 5 - 6',
          drills: [
            {
              id: 'd6',
              title: 'King & Pawn Promotion Fundamentals',
              goal: 'Master opposition and square-rule calculation.',
              completed: false,
              puzzleTheme: 'endgame',
            },
            {
              id: 'd7',
              title: 'Re-solve Your Own Game Blunders',
              goal: 'Clean up every saved blunder puzzle in your custom practice vault.',
              completed: false,
            },
          ],
        },
      ],
      grandmasterMantra: '“Before every single move, ask: What does my opponent want? Is my intended destination safe?”',
      recommendedOpenings: ['Italian Game (Giuoco Piano)', 'Queen’s Gambit Declined', 'French Defense Solid Variation'],
    };

    this.saveImprovementPlan(plan);
    return plan;
  }

  /**
   * Export all user data as JSON for local backup (guaranteeing user data ownership & privacy)
   */
  public exportData(): string {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      privacyNote: '100% offline local user data. No external server tracking.',
      games: this.getGames(),
      ratings: this.getRatingHistory(),
      puzzles: this.getPuzzles(),
      improvementPlan: this.getImprovementPlan(),
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data from JSON backup file
   */
  public importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.games)) this.saveGames(data.games);
      if (Array.isArray(data.ratings)) this.saveRatingHistory(data.ratings);
      if (Array.isArray(data.puzzles)) this.savePuzzles(data.puzzles);
      if (data.improvementPlan) this.saveImprovementPlan(data.improvementPlan);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear all data reset
   */
  public clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.GAMES);
    localStorage.removeItem(STORAGE_KEYS.RATINGS);
    localStorage.removeItem(STORAGE_KEYS.PUZZLES);
    localStorage.removeItem(STORAGE_KEYS.IMPROVEMENT_PLAN);
  }
}

export const offlineStorage = new OfflineStorageService();
