export type PieceColor = 'w' | 'b';

export type MoveClassification = 
  | 'brilliant' 
  | 'best' 
  | 'excellent' 
  | 'good' 
  | 'inaccuracy' 
  | 'mistake' 
  | 'blunder' 
  | 'book';

export interface MoveAnalysis {
  san: string;
  from: string;
  to: string;
  color: PieceColor;
  fenBefore: string;
  fenAfter: string;
  evalBefore: number; // in centipawns (positive = white advantage)
  evalAfter: number;
  evalDelta: number; // eval difference from player's perspective
  classification: MoveClassification;
  bestMove?: string;
  bestMoveSan?: string;
  explanation: string;
  tacticalMotive?: string;
  timeSpentSeconds?: number; // Time spent by player on this move
}

export interface GameRecord {
  id: string;
  date: string;
  whitePlayer: string;
  blackPlayer: string;
  playerColor: PieceColor;
  botLevel: string;
  result: '1-0' | '0-1' | '1/2-1/2' | 'in_progress';
  terminationReason: string;
  pgn: string;
  moves: MoveAnalysis[];
  whiteAccuracy: number;
  blackAccuracy: number;
  whiteBlunders: number;
  blackBlunders: number;
  whiteMistakes: number;
  blackMistakes: number;
  whiteInaccuracies: number;
  blackInaccuracies: number;
  ratingBefore: number;
  ratingAfter: number;
  timeControl?: string;
  avgPlayerMoveTime?: number;
  impulsiveMoveCount?: number;
}

export interface RatingPoint {
  id: string;
  date: string;
  timestamp: number;
  rating: number;
  gameId?: string;
  change: number;
  mode: 'vs_bot' | 'puzzle' | 'rapid';
  accuracy?: number;
}

export interface ChessPuzzle {
  id: string;
  title: string;
  fen: string;
  solution: string[]; // sequence of SAN moves or UCI moves e.g. ['Nf6+', 'Kh8', 'Bxf7']
  playerToMove: PieceColor;
  theme: 'fork' | 'pin' | 'skewer' | 'back_rank' | 'deflection' | 'hanging_piece' | 'endgame' | 'mate';
  rating: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  hint: string;
  explanation: string;
  isUserBlunder?: boolean;
  originGameId?: string;
}

export interface ImprovementPlan {
  id: string;
  generatedDate: string;
  playerRating: number;
  primaryWeaknesses: {
    theme: string;
    description: string;
    frequency: number;
    severity: 'high' | 'medium' | 'low';
  }[];
  phases: {
    phaseNumber: number;
    title: string;
    focus: string;
    duration: string;
    drills: {
      id: string;
      title: string;
      goal: string;
      completed: boolean;
      puzzleTheme?: string;
    }[];
  }[];
  grandmasterMantra: string;
  recommendedOpenings: string[];
}

export interface BotDifficulty {
  id: string;
  name: string;
  rating: number;
  depth: number;
  randomness: number; // blunder chance %
  description: string;
  avatar: string;
}
