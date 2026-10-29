import React, { useState, useEffect } from 'react';
import { Chess, Square, Move, PieceSymbol } from 'chess.js';
import { ChessPuzzle, PieceColor } from '../../types/chess';
import { ChessBoard } from '../ChessBoard/ChessBoard';
import { chessAudio } from '../../utils/chessAudio';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  RefreshCw, 
  Sparkles, 
  Lightbulb, 
  Filter, 
  Trophy, 
  BookmarkCheck,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

interface PuzzleTrainerProps {
  puzzles: ChessPuzzle[];
  currentRating: number;
  onPuzzleSolved: (puzzle: ChessPuzzle, success: boolean, ratingChange: number) => void;
}

export const PuzzleTrainer: React.FC<PuzzleTrainerProps> = ({
  puzzles,
  currentRating,
  onPuzzleSolved,
}) => {
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState<number>(0);
  const [status, setStatus] = useState<'solving' | 'success' | 'failed'>('solving');
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [moveIndex, setMoveIndex] = useState<number>(0);

  // Filtered puzzle list
  const filteredPuzzles = puzzles.filter((p) => {
    if (selectedTheme === 'all') return true;
    if (selectedTheme === 'my_blunders') return Boolean(p.isUserBlunder);
    return p.theme === selectedTheme;
  });

  const activePuzzle: ChessPuzzle | undefined = filteredPuzzles[currentPuzzleIndex] || filteredPuzzles[0];

  const [puzzleChess, setPuzzleChess] = useState<Chess>(() => {
    return activePuzzle ? new Chess(activePuzzle.fen) : new Chess();
  });

  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);

  // Reset board when puzzle changes
  useEffect(() => {
    if (activePuzzle) {
      setPuzzleChess(new Chess(activePuzzle.fen));
      setStatus('solving');
      setShowHint(false);
      setShowSolution(false);
      setMoveIndex(0);
      setLastMove(null);
    }
  }, [activePuzzle?.id]);

  if (!activePuzzle) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
        <p className="text-slate-400">No puzzles found for this category.</p>
        <button
          onClick={() => setSelectedTheme('all')}
          className="mt-3 text-xs bg-amber-500 text-slate-950 px-3 py-1.5 rounded-lg font-bold"
        >
          View All Puzzles
        </button>
      </div>
    );
  }

  const handleMove = ({ from, to, promotion }: { from: Square; to: Square; promotion?: PieceSymbol }): boolean => {
    if (status !== 'solving') return false;

    const testChess = new Chess(puzzleChess.fen());
    const moveResult = testChess.move({ from, to, promotion: promotion || 'q' });
    if (!moveResult) return false;

    const expectedSan = activePuzzle.solution[moveIndex];
    // Check if played move matches expected SAN or UCI
    const matchesSan = moveResult.san === expectedSan;
    const matchesUci = `${from}${to}` === expectedSan;

    if (matchesSan || matchesUci) {
      // Correct user move!
      puzzleChess.move({ from, to, promotion: promotion || 'q' });
      setPuzzleChess(new Chess(puzzleChess.fen()));
      setLastMove({ from, to });
      chessAudio.playMove();

      const nextMoveIndex = moveIndex + 1;
      setMoveIndex(nextMoveIndex);

      if (nextMoveIndex >= activePuzzle.solution.length) {
        // Solved full puzzle!
        setStatus('success');
        chessAudio.playSuccess();
        onPuzzleSolved(activePuzzle, true, 12);
      } else {
        // Automatic opponent reply from solution sequence
        setTimeout(() => {
          const opponentMoveSan = activePuzzle.solution[nextMoveIndex];
          try {
            const oppMove = puzzleChess.move(opponentMoveSan);
            if (oppMove) {
              setPuzzleChess(new Chess(puzzleChess.fen()));
              setLastMove({ from: oppMove.from, to: oppMove.to });
              chessAudio.playMove();
              setMoveIndex(nextMoveIndex + 1);
            }
          } catch {
            // End of line
            setStatus('success');
            chessAudio.playSuccess();
            onPuzzleSolved(activePuzzle, true, 12);
          }
        }, 500);
      }
      return true;
    } else {
      // Incorrect move
      setStatus('failed');
      chessAudio.playBlunder();
      onPuzzleSolved(activePuzzle, false, -8);
      return false;
    }
  };

  const handleNextPuzzle = () => {
    const nextIdx = (currentPuzzleIndex + 1) % filteredPuzzles.length;
    setCurrentPuzzleIndex(nextIdx);
  };

  const handleRetry = () => {
    if (activePuzzle) {
      setPuzzleChess(new Chess(activePuzzle.fen));
      setStatus('solving');
      setMoveIndex(0);
      setLastMove(null);
    }
  };

  return (
    <div id="puzzle-trainer-root" className="space-y-6">
      {/* Filters bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2 overflow-x-auto text-xs py-1">
          <Filter className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          {[
            { id: 'all', label: 'All Puzzles' },
            { id: 'my_blunders', label: `My Game Blunders (${puzzles.filter(p => p.isUserBlunder).length})` },
            { id: 'fork', label: 'Forks' },
            { id: 'pin', label: 'Pins & Skewers' },
            { id: 'back_rank', label: 'Back-Rank Mate' },
            { id: 'deflection', label: 'Deflection' },
            { id: 'endgame', label: 'Endgames' },
          ].map((theme) => (
            <button
              key={theme.id}
              onClick={() => {
                setSelectedTheme(theme.id);
                setCurrentPuzzleIndex(0);
              }}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                selectedTheme === theme.id
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {theme.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Puzzle Rating: <strong className="text-amber-400">{currentRating}</strong></span>
        </div>
      </div>

      {/* Main Puzzle Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Board */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-[560px] sm:max-w-[620px]">
            <ChessBoard
              chess={puzzleChess}
              onMove={handleMove}
              playerColor={activePuzzle.playerToMove}
              isInteractive={status === 'solving'}
              lastMove={lastMove}
            />

            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-200">
                {activePuzzle.playerToMove === 'w' ? 'White' : 'Black'} to move & win
              </span>
              <span>
                Puzzle {currentPuzzleIndex + 1} of {filteredPuzzles.length}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Info & Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
            {/* Title & tags */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {activePuzzle.theme.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-400">Rating {activePuzzle.rating}</span>
                  {activePuzzle.isUserBlunder && (
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                      From Your Game
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-100 mt-1">
                  {activePuzzle.title}
                </h3>
              </div>
            </div>

            {/* Status Feedback Banner */}
            {status === 'success' && (
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Tactical Victory! (+12 Rating)
                </div>
                <p className="text-slate-300 leading-relaxed pt-1">{activePuzzle.explanation}</p>
              </div>
            )}

            {status === 'failed' && (
              <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-300 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-sm">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  Incorrect Move (-8 Rating)
                </div>
                <p className="text-slate-300">That wasn't the critical winning sequence. Try again or check the hint!</p>
                <button
                  onClick={handleRetry}
                  className="bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Try Again
                </button>
              </div>
            )}

            {/* Hint Box */}
            {showHint && (
              <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-amber-200 text-xs flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Grandmaster Hint:</span>
                  <p className="text-slate-300 mt-0.5 leading-relaxed">{activePuzzle.hint}</p>
                </div>
              </div>
            )}

            {/* Solution Reveal */}
            {showSolution && (
              <div className="p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs space-y-1">
                <span className="font-bold text-slate-200">Optimal Sequence:</span>
                <p className="font-mono text-emerald-400 text-sm font-bold">
                  {activePuzzle.solution.join(' → ')}
                </p>
                <p className="text-slate-400 text-xs pt-1">{activePuzzle.explanation}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-slate-300 flex items-center gap-1.5 transition-colors"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </button>

              <button
                onClick={() => setShowSolution(!showSolution)}
                className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-slate-300 flex items-center gap-1.5 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {showSolution ? 'Hide Solution' : 'Reveal Solution'}
              </button>

              <button
                id="btn-next-puzzle"
                onClick={handleNextPuzzle}
                className="ml-auto text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                Next Puzzle <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
