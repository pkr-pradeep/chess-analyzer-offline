import React, { useState, useEffect, useMemo } from 'react';
import { Chess, Square } from 'chess.js';
import { GameRecord, MoveAnalysis, MoveClassification } from '../../types/chess';
import { ChessBoard } from '../ChessBoard/ChessBoard';
import { parsePgnToMoves } from '../../services/storage';
import { chessAudio } from '../../utils/chessAudio';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Play, 
  Pause, 
  Sparkles, 
  Star, 
  AlertTriangle, 
  ShieldAlert, 
  BookmarkPlus, 
  BarChart2, 
  CheckCircle2,
  TrendingUp,
  Brain
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface GameReviewProps {
  game: GameRecord;
  onSaveBlunderAsPuzzle: (move: MoveAnalysis) => void;
  onClose?: () => void;
}

export const GameReview: React.FC<GameReviewProps> = ({
  game,
  onSaveBlunderAsPuzzle,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [savedPuzzles, setSavedPuzzles] = useState<Set<number>>(new Set());

  // Reconstruct chess moves reliably from moves or pgn
  const moves: MoveAnalysis[] = useMemo(() => {
    if (game.moves && game.moves.length > 0 && game.moves[0].fenAfter) {
      return game.moves;
    }
    if (game.pgn) {
      const parsed = parsePgnToMoves(game.pgn);
      if (parsed.length > 0) return parsed;
    }
    return game.moves || [];
  }, [game]);

  const totalSteps = moves.length;

  // Reset to initial step when a different game is selected
  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, [game.id]);

  // Build board position at current step
  const getChessAtStep = (step: number): Chess => {
    if (step <= 0 || moves.length === 0) return new Chess();
    const clampedStep = Math.min(step, moves.length);
    const targetMove = moves[clampedStep - 1];

    // Primary: Instant FEN loading (100% accurate, zero latency)
    if (targetMove?.fenAfter) {
      try {
        return new Chess(targetMove.fenAfter);
      } catch (err) {
        console.warn('Failed to load FEN at step', step, err);
      }
    }

    // Fallback: Replay move by move
    const c = new Chess();
    for (let i = 0; i < clampedStep; i++) {
      const m = moves[i];
      if (!m) continue;
      if (m.fenAfter) {
        try {
          c.load(m.fenAfter);
          continue;
        } catch {}
      }
      try {
        c.move(m.san);
      } catch {
        try {
          if (m.from && m.to) {
            c.move({ from: m.from, to: m.to, promotion: 'q' });
          }
        } catch {
          break;
        }
      }
    }
    return c;
  };

  const currentChess = useMemo(() => getChessAtStep(currentStep), [currentStep, moves]);
  const currentMoveAnalysis = currentStep > 0 && currentStep <= moves.length ? moves[currentStep - 1] : null;

  // Step change with sound feedback
  const handleStepChange = (newStep: number) => {
    const clamped = Math.max(0, Math.min(totalSteps, newStep));
    setCurrentStep(clamped);
    if (clamped > 0) {
      chessAudio.playMove();
    }
  };

  // Keyboard controls for convenient arrow stepping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') {
        handleStepChange(currentStep + 1);
      } else if (e.key === 'ArrowLeft') {
        handleStepChange(currentStep - 1);
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, totalSteps]);

  // Autoplay moves loop
  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= totalSteps) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        chessAudio.playMove();
        if (next >= totalSteps) {
          setIsPlaying(false);
        }
        return next;
      });
    }, 1100);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, totalSteps]);

  // Chart data for evaluation
  const chartData = moves.map((m, idx) => ({
    moveNum: Math.floor(idx / 2) + 1,
    san: m.san,
    eval: Math.max(-10, Math.min(10, m.evalAfter / 100)),
    classification: m.classification,
  }));

  const handleSavePuzzle = (idx: number, move: MoveAnalysis) => {
    onSaveBlunderAsPuzzle(move);
    setSavedPuzzles((prev) => new Set([...prev, idx]));
  };

  const getBadge = (cls?: MoveClassification) => {
    switch (cls) {
      case 'brilliant':
        return <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs px-2 py-0.5 rounded-full font-bold">💎 Brilliant</span>;
      case 'best':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2 py-0.5 rounded-full font-bold">⭐ Best</span>;
      case 'inaccuracy':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-2 py-0.5 rounded-full font-bold">?! Inaccuracy</span>;
      case 'mistake':
        return <span className="bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs px-2 py-0.5 rounded-full font-bold">? Mistake</span>;
      case 'blunder':
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs px-2 py-0.5 rounded-full font-bold">?? Blunder</span>;
      default:
        return <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full">Good</span>;
    }
  };

  return (
    <div id="game-review-root" className="space-y-6">
      {/* Top Banner: Accuracy & Match Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Full Game Analysis
              </span>
              <span className="text-xs text-slate-400">{game.date}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                Result: {game.result} ({game.terminationReason})
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-1">
              {game.whitePlayer} vs {game.blackPlayer}
            </h2>
          </div>

          {/* Dual Accuracy Scores */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-xs font-medium text-slate-400 mb-1">White Accuracy</div>
              <div className="text-2xl font-bold font-mono text-slate-100 flex items-center justify-center gap-1">
                {game.whiteAccuracy}%
              </div>
              <div className="text-[10px] text-slate-500">
                {game.whiteBlunders} Blunders • {game.whiteMistakes} Mistakes
              </div>
            </div>

            <div className="h-10 w-px bg-slate-800" />

            <div className="text-center">
              <div className="text-xs font-medium text-slate-400 mb-1">Black Accuracy</div>
              <div className="text-2xl font-bold font-mono text-slate-100 flex items-center justify-center gap-1">
                {game.blackAccuracy}%
              </div>
              <div className="text-[10px] text-slate-500">
                {game.blackBlunders} Blunders • {game.blackMistakes} Mistakes
              </div>
            </div>
          </div>
        </div>

        {/* Evaluation Graph */}
        {chartData.length > 0 && (
          <div className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                Evaluation Trajectory (Centipawns)
              </span>
              <span className="text-[11px] text-slate-500">
                White advantage (&gt; 0) vs Black advantage (&lt; 0)
              </span>
            </div>
            <div className="h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} onClick={(e) => {
                  if (e && e.activeTooltipIndex !== undefined) {
                    setCurrentStep(Number(e.activeTooltipIndex) + 1);
                  }
                }}>
                  <defs>
                    <linearGradient id="evalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="moveNum" hide />
                  <YAxis domain={[-8, 8]} hide />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-950 border border-slate-700 p-2 rounded text-xs text-slate-200">
                            <p className="font-bold">{data.san} ({data.classification})</p>
                            <p className="text-slate-400">Eval: {data.eval > 0 ? `+${data.eval}` : data.eval}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="eval" stroke="#F59E0B" fill="url(#evalGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Main Review Stage: Board + Move Stepper & Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Board */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-[560px] sm:max-w-[620px]">
            <ChessBoard
              chess={currentChess}
              onMove={() => false}
              playerColor={game.playerColor}
              isInteractive={false}
              lastMove={currentMoveAnalysis ? {
                from: currentMoveAnalysis.from as Square,
                to: currentMoveAnalysis.to as Square,
                classification: currentMoveAnalysis.classification,
              } : null}
              evaluation={currentMoveAnalysis ? currentMoveAnalysis.evalAfter : 0}
            />

            {/* Stepper Controls */}
            <div className="flex items-center justify-center gap-2 mt-4 bg-slate-900 border border-slate-800 p-2 rounded-xl">
              <button
                id="btn-step-first"
                onClick={() => handleStepChange(0)}
                disabled={currentStep === 0}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors"
                title="First move (Home)"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                id="btn-step-prev"
                onClick={() => handleStepChange(currentStep - 1)}
                disabled={currentStep === 0}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors"
                title="Previous move (Left Arrow)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                id="btn-step-play"
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                title="Toggle Replay / Autoplay (Space)"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'Pause' : 'Autoplay'}
              </button>
              <button
                id="btn-step-next"
                onClick={() => handleStepChange(currentStep + 1)}
                disabled={currentStep >= totalSteps}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors"
                title="Next move (Right Arrow)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                id="btn-step-last"
                onClick={() => handleStepChange(totalSteps)}
                disabled={currentStep >= totalSteps}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors"
                title="Final position (End)"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-slate-400 ml-3">
                {currentStep} / {totalSteps}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Step Analysis & Move History List */}
        <div className="lg:col-span-5 space-y-4">
          {/* Current Step Analysis Card */}
          {currentMoveAnalysis ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold font-mono text-slate-100">
                    {Math.ceil(currentStep / 2)}. {currentMoveAnalysis.san}
                  </span>
                  {getBadge(currentMoveAnalysis.classification)}
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Eval: {(currentMoveAnalysis.evalAfter / 100).toFixed(1)}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {currentMoveAnalysis.explanation}
              </p>

              {/* Tactical alternative */}
              {currentMoveAnalysis.bestMoveSan && currentMoveAnalysis.bestMoveSan !== currentMoveAnalysis.san && (
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                  <span className="text-slate-400">
                    Grandmaster Choice: <strong className="text-emerald-400 font-mono text-sm">{currentMoveAnalysis.bestMoveSan}</strong>
                  </span>
                </div>
              )}

              {/* Save Blunder Button */}
              {(currentMoveAnalysis.classification === 'blunder' || currentMoveAnalysis.classification === 'mistake') && (
                <div className="pt-2 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => handleSavePuzzle(currentStep - 1, currentMoveAnalysis)}
                    disabled={savedPuzzles.has(currentStep - 1)}
                    className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
                      savedPuzzles.has(currentStep - 1)
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    {savedPuzzles.has(currentStep - 1) ? 'Saved to Practice Puzzles' : 'Save Blunder as Custom Puzzle'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center text-slate-400">
              <Brain className="w-6 h-6 mx-auto mb-2 text-slate-600" />
              <p className="text-xs">Initial position. Use the stepper or click on any move below to analyze.</p>
            </div>
          )}

          {/* Move List Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-lg max-h-[360px] overflow-y-auto">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
              Game Notation & Blunder Marks
            </h4>
            <div className="space-y-1">
              {Array.from({ length: Math.ceil(moves.length / 2) }).map((_, moveIndex) => {
                const whiteMove = moves[moveIndex * 2];
                const blackMove = moves[moveIndex * 2 + 1];
                const whiteStepNum = moveIndex * 2 + 1;
                const blackStepNum = moveIndex * 2 + 2;

                return (
                  <div key={moveIndex} className="grid grid-cols-12 gap-2 text-xs py-1 px-1.5 rounded hover:bg-slate-800/40 items-center font-mono">
                    <span className="col-span-2 text-slate-500">{moveIndex + 1}.</span>

                    {/* White move */}
                    <button
                      onClick={() => handleStepChange(whiteStepNum)}
                      className={`col-span-5 text-left px-2 py-1 rounded flex items-center justify-between transition-colors ${
                        currentStep === whiteStepNum ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-200'
                      }`}
                    >
                      <span>{whiteMove.san}</span>
                      {whiteMove.classification === 'blunder' && <span className="text-[10px] text-rose-400 font-bold">??</span>}
                      {whiteMove.classification === 'mistake' && <span className="text-[10px] text-orange-400 font-bold">?</span>}
                      {whiteMove.classification === 'inaccuracy' && <span className="text-[10px] text-amber-400 font-bold">?!</span>}
                      {whiteMove.classification === 'best' && <span className="text-[10px] text-emerald-400 font-bold">★</span>}
                    </button>

                    {/* Black move */}
                    {blackMove ? (
                      <button
                        onClick={() => handleStepChange(blackStepNum)}
                        className={`col-span-5 text-left px-2 py-1 rounded flex items-center justify-between transition-colors ${
                          currentStep === blackStepNum ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-200'
                        }`}
                      >
                        <span>{blackMove.san}</span>
                        {blackMove.classification === 'blunder' && <span className="text-[10px] text-rose-400 font-bold">??</span>}
                        {blackMove.classification === 'mistake' && <span className="text-[10px] text-orange-400 font-bold">?</span>}
                        {blackMove.classification === 'inaccuracy' && <span className="text-[10px] text-amber-400 font-bold">?!</span>}
                        {blackMove.classification === 'best' && <span className="text-[10px] text-emerald-400 font-bold">★</span>}
                      </button>
                    ) : (
                      <div className="col-span-5" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
