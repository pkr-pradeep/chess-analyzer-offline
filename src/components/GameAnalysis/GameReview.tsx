import React, { useState, useEffect, useMemo } from 'react';
import { Chess, Square } from 'chess.js';
import { GameRecord, MoveAnalysis, MoveClassification } from '../../types/chess';
import { ChessBoard } from '../ChessBoard/ChessBoard';
import { parsePgnToMoves, storageService } from '../../services/storage';
import { stockfishService } from '../../services/stockfishService';
import { chessEngine } from '../../services/chessEngine';
import { chessAudio } from '../../utils/chessAudio';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Play, 
  Pause, 
  Sparkles, 
  BookmarkPlus, 
  TrendingUp,
  Brain,
  Filter,
  CheckCircle2,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface GameReviewProps {
  game: GameRecord;
  onSaveBlunderAsPuzzle: (move: MoveAnalysis) => void;
  onClose?: () => void;
}

// Full Chess.com Expected Points Move Categories Metadata
interface CategoryMeta {
  id: MoveClassification;
  symbol: string;
  name: string;
  shortDesc: string;
  badgeClass: string;
  textClass: string;
  borderClass: string;
  dotColor: string;
}

const MOVE_CATEGORIES: CategoryMeta[] = [
  {
    id: 'brilliant',
    symbol: '!!',
    name: 'Brilliant',
    shortDesc: 'A sound, voluntary piece sacrifice that is the optimal or near-optimal move.',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    textClass: 'text-cyan-400',
    borderClass: 'border-cyan-500/30',
    dotColor: '#06b6d4',
  },
  {
    id: 'great',
    symbol: '!',
    name: 'Great',
    shortDesc: 'A critical move that changes the outcome of the game or finds the only saving move.',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-500/30',
    dotColor: '#3b82f6',
  },
  {
    id: 'best',
    symbol: '⭐',
    name: 'Best',
    shortDesc: 'The optimal move chosen by the chess engine.',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
    dotColor: '#10b981',
  },
  {
    id: 'excellent',
    symbol: '👍',
    name: 'Excellent',
    shortDesc: 'A near-top choice that results in only a minimal drop in expected points.',
    badgeClass: 'bg-lime-500/20 text-lime-300 border-lime-500/40',
    textClass: 'text-lime-400',
    borderClass: 'border-lime-500/30',
    dotColor: '#84cc16',
  },
  {
    id: 'good',
    symbol: '✅',
    name: 'Good',
    shortDesc: 'A solid, decent move that keeps the position safe and does not worsen things.',
    badgeClass: 'bg-slate-700/60 text-slate-200 border-slate-600',
    textClass: 'text-slate-300',
    borderClass: 'border-slate-700',
    dotColor: '#94a3b8',
  },
  {
    id: 'book',
    symbol: '📖',
    name: 'Book',
    shortDesc: 'A standard, well-known opening move derived from chess theory.',
    badgeClass: 'bg-amber-600/25 text-amber-300 border-amber-600/40',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-600/30',
    dotColor: '#d97706',
  },
  {
    id: 'inaccuracy',
    symbol: '?!',
    name: 'Inaccuracy',
    shortDesc: 'A weak or dubious move that creates minor positional or tactical weaknesses.',
    badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    textClass: 'text-yellow-400',
    borderClass: 'border-yellow-500/30',
    dotColor: '#eab308',
  },
  {
    id: 'mistake',
    symbol: '?',
    name: 'Mistake',
    shortDesc: 'A bad move that noticeably worsens your position or loses a pawn/advantage.',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-500/30',
    dotColor: '#f97316',
  },
  {
    id: 'miss',
    symbol: 'X',
    name: 'Miss',
    shortDesc: 'Failing to capitalize on an opponent mistake or missing a clear tactical/winning opportunity.',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    textClass: 'text-rose-400',
    borderClass: 'border-rose-500/30',
    dotColor: '#f43f5e',
  },
  {
    id: 'blunder',
    symbol: '??',
    name: 'Blunder',
    shortDesc: 'A severe, game-swinging error that drastically drops your win probability.',
    badgeClass: 'bg-red-600/25 text-red-300 border-red-500/50',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/30',
    dotColor: '#ef4444',
  },
];

export const GameReview: React.FC<GameReviewProps> = ({
  game,
  onSaveBlunderAsPuzzle,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [savedPuzzles, setSavedPuzzles] = useState<Set<number>>(new Set());
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<MoveClassification | 'all'>('all');

  // Reconstruct chess moves reliably from moves or pgn
  const initialMoves: MoveAnalysis[] = useMemo(() => {
    if (game.moves && game.moves.length > 0 && game.moves[0].fenAfter) {
      return game.moves;
    }
    if (game.pgn) {
      const parsed = parsePgnToMoves(game.pgn);
      if (parsed.length > 0) return parsed;
    }
    return game.moves || [];
  }, [game]);

  const [activeMoves, setActiveMoves] = useState<MoveAnalysis[]>(initialMoves);
  const [isStockfishAnalyzing, setIsStockfishAnalyzing] = useState<boolean>(false);
  const [stockfishProgress, setStockfishProgress] = useState<{ current: number; total: number; currentSan?: string } | null>(null);
  const [analyzedWithStockfish, setAnalyzedWithStockfish] = useState<boolean>(false);

  // Sync when game changes
  useEffect(() => {
    setActiveMoves(initialMoves);
    setAnalyzedWithStockfish(false);
    setCurrentStep(0);
    setIsPlaying(false);
    setSelectedFilterCategory('all');
  }, [game.id, initialMoves]);

  const moves = activeMoves;
  const totalSteps = moves.length;

  // Run deep analysis with Stockfish 19 WebAssembly
  const handleRunStockfishAnalysis = async () => {
    if (isStockfishAnalyzing || !game.pgn) return;
    setIsStockfishAnalyzing(true);
    setStockfishProgress({ current: 0, total: moves.length, currentSan: '' });

    try {
      const stockfishResults = await stockfishService.batchAnalyzeGameAsync(
        game.pgn,
        (current, total, currentSan) => {
          setStockfishProgress({ current, total, currentSan });
        },
        10
      );

      if (stockfishResults.length > 0) {
        setActiveMoves(stockfishResults);
        setAnalyzedWithStockfish(true);
        const whiteAcc = chessEngine.calculateAccuracy(stockfishResults, 'w');
        const blackAcc = chessEngine.calculateAccuracy(stockfishResults, 'b');
        const updatedGame: GameRecord = {
          ...game,
          moves: stockfishResults,
          whiteAccuracy: whiteAcc,
          blackAccuracy: blackAcc,
        };
        storageService.saveGame(updatedGame);
      }
    } catch (err) {
      console.error('[Stockfish 19] Analysis failed:', err);
    } finally {
      setIsStockfishAnalyzing(false);
      setStockfishProgress(null);
    }
  };

  const whiteAccuracy = useMemo(() => {
    return chessEngine.calculateAccuracy(moves, 'w');
  }, [moves]);

  const blackAccuracy = useMemo(() => {
    return chessEngine.calculateAccuracy(moves, 'b');
  }, [moves]);

  // Compute tally of all 10 categories dynamically
  const categoryCounts = useMemo(() => {
    const whiteCounts: Record<MoveClassification, number> = {
      brilliant: 0, great: 0, best: 0, excellent: 0, good: 0, book: 0, inaccuracy: 0, mistake: 0, miss: 0, blunder: 0
    };
    const blackCounts: Record<MoveClassification, number> = {
      brilliant: 0, great: 0, best: 0, excellent: 0, good: 0, book: 0, inaccuracy: 0, mistake: 0, miss: 0, blunder: 0
    };

    moves.forEach((m) => {
      const target = m.color === 'w' ? whiteCounts : blackCounts;
      const cls = m.classification || 'good';
      if (target[cls] !== undefined) {
        target[cls]++;
      } else {
        target.good++;
      }
    });

    return { whiteCounts, blackCounts };
  }, [moves]);

  // Build board position at current step
  const getChessAtStep = (step: number): Chess => {
    if (step <= 0 || moves.length === 0) return new Chess();
    const clampedStep = Math.min(step, moves.length);
    const targetMove = moves[clampedStep - 1];

    if (targetMove?.fenAfter) {
      try {
        return new Chess(targetMove.fenAfter);
      } catch (err) {
        console.warn('Failed to load FEN at step', step, err);
      }
    }

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

  const getCategoryBadge = (cls?: MoveClassification) => {
    const meta = MOVE_CATEGORIES.find((c) => c.id === cls) || MOVE_CATEGORIES[4];
    return (
      <span className={`${meta.badgeClass} border text-xs px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1 shadow-xs`}>
        <span>{meta.symbol}</span>
        <span>{meta.name}</span>
      </span>
    );
  };

  const getMoveSymbol = (cls?: MoveClassification) => {
    switch (cls) {
      case 'brilliant': return <span className="text-cyan-400 font-bold">!!</span>;
      case 'great': return <span className="text-blue-400 font-bold">!</span>;
      case 'best': return <span className="text-emerald-400 font-bold">⭐</span>;
      case 'excellent': return <span className="text-lime-400 font-bold">👍</span>;
      case 'good': return <span className="text-slate-400 font-bold">✓</span>;
      case 'book': return <span className="text-amber-400 font-bold">📖</span>;
      case 'inaccuracy': return <span className="text-yellow-400 font-bold">?!</span>;
      case 'mistake': return <span className="text-orange-400 font-bold">?</span>;
      case 'miss': return <span className="text-rose-400 font-bold">✕</span>;
      case 'blunder': return <span className="text-red-500 font-bold">??</span>;
      default: return null;
    }
  };

  return (
    <div id="game-review-root" className="space-y-4 sm:space-y-6">
      {/* Top Banner: Accuracy & Match Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Chess.com Game Review
              </span>
              <span className="text-xs text-slate-400">{game.date}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                Result: {game.result} ({game.terminationReason})
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 mt-1">
              {game.whitePlayer} vs {game.blackPlayer}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Move classification powered by the <strong>Expected Points (CAPS2) Model</strong> measuring win probability changes.
            </p>
          </div>

          {/* Dual Accuracy Scores */}
          <div className="flex items-center gap-4 sm:gap-6 self-start md:self-auto">
            <div className="text-center">
              <div className="text-xs font-medium text-slate-400 mb-1">
                {game.playerColor === 'w' ? (
                  <span className="text-amber-400 font-semibold">Your Accuracy (White)</span>
                ) : (
                  'White Accuracy'
                )}
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-slate-100 flex items-center justify-center gap-1">
                {whiteAccuracy.toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-400">
                <span className={categoryCounts.whiteCounts.blunder > 0 ? 'text-rose-400 font-bold' : ''}>
                  {categoryCounts.whiteCounts.blunder} Blunders
                </span> • {categoryCounts.whiteCounts.miss} Misses
              </div>
            </div>

            <div className="h-10 w-px bg-slate-800" />

            <div className="text-center">
              <div className="text-xs font-medium text-slate-400 mb-1">
                {game.playerColor === 'b' ? (
                  <span className="text-amber-400 font-semibold">Your Accuracy (Black)</span>
                ) : (
                  'Black Accuracy'
                )}
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-slate-100 flex items-center justify-center gap-1">
                {blackAccuracy.toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-400">
                <span className={categoryCounts.blackCounts.blunder > 0 ? 'text-rose-400 font-bold' : ''}>
                  {categoryCounts.blackCounts.blunder} Blunders
                </span> • {categoryCounts.blackCounts.miss} Misses
              </div>
            </div>
          </div>
        </div>

        {/* Stockfish 19 WebAssembly Engine Status & Deep Analysis Trigger */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-b border-slate-800 pb-3.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-200 font-mono flex items-center gap-1.5 font-semibold">
              <Cpu className="w-4 h-4 text-cyan-400" />
              {stockfishService.getEngineName()}
            </span>
            {analyzedWithStockfish && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Stockfish 19 Verified
              </span>
            )}
          </div>

          <button
            onClick={handleRunStockfishAnalysis}
            disabled={isStockfishAnalyzing || !game.pgn}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-medium flex items-center gap-2 shadow-md transition-all cursor-pointer text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isStockfishAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isStockfishAnalyzing ? 'Analyzing with Stockfish 19...' : 'Run Stockfish 19 Deep Analysis'}</span>
          </button>
        </div>

        {/* Live Analysis Progress Bar */}
        {isStockfishAnalyzing && stockfishProgress && (
          <div className="p-3 bg-slate-950/80 rounded-xl border border-cyan-500/30 space-y-1.5 mt-3">
            <div className="flex justify-between text-xs text-slate-300 font-mono">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <Cpu className="w-3.5 h-3.5 animate-pulse" />
                Stockfish 19 WebAssembly evaluating move {stockfishProgress.current} / {stockfishProgress.total} {stockfishProgress.currentSan ? `(${stockfishProgress.currentSan})` : ''}
              </span>
              <span className="font-bold text-cyan-400">
                {Math.round((stockfishProgress.current / Math.max(1, stockfishProgress.total)) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-150"
                style={{ width: `${(stockfishProgress.current / Math.max(1, stockfishProgress.total)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* SECTION: Chess.com 10 Move Categories Breakdown Grid */}
        <div className="pt-4 pb-2">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Move Categories Breakdown (Best to Worst)</span>
            </h3>
            {selectedFilterCategory !== 'all' && (
              <button
                onClick={() => setSelectedFilterCategory('all')}
                className="text-[11px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
              >
                Clear filter (Show all moves)
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5 sm:gap-2">
            {MOVE_CATEGORIES.map((cat) => {
              const whiteVal = categoryCounts.whiteCounts[cat.id];
              const blackVal = categoryCounts.blackCounts[cat.id];
              const isSelected = selectedFilterCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedFilterCategory(isSelected ? 'all' : cat.id)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40 shadow-md'
                      : 'bg-slate-950/70 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                  title={`${cat.name} (${cat.symbol}): ${cat.shortDesc}`}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="text-xs font-bold font-mono">{cat.symbol}</span>
                    <span className="text-[11px] font-semibold text-slate-200">{cat.name}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono px-1 py-0.5 rounded bg-slate-900/90 border border-slate-800/80">
                    <span className="text-slate-300 font-bold" title="White">{whiteVal}</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-400 font-bold" title="Black">{blackVal}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Evaluation Trajectory Graph */}
        {chartData.length > 0 && (
          <div className="pt-3 border-t border-slate-800/80 mt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                Evaluation Trajectory (Centipawns)
              </span>
              <span className="text-[11px] text-slate-500">
                White advantage (&gt; 0) vs Black advantage (&lt; 0)
              </span>
            </div>
            <div className="h-20 w-full">
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
                          <div className="bg-slate-950 border border-slate-700 p-2 rounded text-xs text-slate-200 shadow-xl">
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

      {/* Main Review Stage: Board + Move Stepper & Step Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
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
            <div className="flex items-center justify-center gap-2 mt-3 sm:mt-4 bg-slate-900 border border-slate-800 p-2 rounded-xl shadow-md">
              <button
                id="btn-step-first"
                onClick={() => handleStepChange(0)}
                disabled={currentStep === 0}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors cursor-pointer"
                title="First move (Home)"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                id="btn-step-prev"
                onClick={() => handleStepChange(currentStep - 1)}
                disabled={currentStep === 0}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors cursor-pointer"
                title="Previous move (Left Arrow)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                id="btn-step-play"
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                title="Toggle Replay / Autoplay (Space)"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'Pause' : 'Autoplay'}
              </button>
              <button
                id="btn-step-next"
                onClick={() => handleStepChange(currentStep + 1)}
                disabled={currentStep >= totalSteps}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors cursor-pointer"
                title="Next move (Right Arrow)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                id="btn-step-last"
                onClick={() => handleStepChange(totalSteps)}
                disabled={currentStep >= totalSteps}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors cursor-pointer"
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
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-bold font-mono text-slate-100">
                    {Math.ceil(currentStep / 2)}. {currentMoveAnalysis.san}
                  </span>
                  {getCategoryBadge(currentMoveAnalysis.classification)}
                  {currentMoveAnalysis.tacticalMotive && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {currentMoveAnalysis.tacticalMotive}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-right">
                  {currentMoveAnalysis.winProbabilityAfter !== undefined && (
                    <span className="text-xs font-mono font-semibold text-amber-400" title="Expected Points / Win Probability">
                      Win: {currentMoveAnalysis.winProbabilityAfter}%
                    </span>
                  )}
                  <span className="text-xs font-mono text-slate-400">
                    ({(currentMoveAnalysis.evalAfter / 100).toFixed(1)})
                  </span>
                </div>
              </div>

              {/* Category Explanation Banner */}
              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs">
                <p className="text-slate-200 font-medium leading-relaxed">
                  {currentMoveAnalysis.explanation}
                </p>
                {currentMoveAnalysis.expectedPointsDrop !== undefined && currentMoveAnalysis.expectedPointsDrop > 0 && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Expected Points Drop: <strong className="text-rose-400">-{currentMoveAnalysis.expectedPointsDrop}%</strong> win probability.
                  </p>
                )}
              </div>

              {/* Tactical alternative */}
              {currentMoveAnalysis.bestMoveSan && currentMoveAnalysis.bestMoveSan !== currentMoveAnalysis.san && (
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                  <span className="text-slate-400">
                    Grandmaster Best Move: <strong className="text-emerald-400 font-mono text-sm">{currentMoveAnalysis.bestMoveSan}</strong>
                  </span>
                </div>
              )}

              {/* Save Blunder / Miss as Custom Puzzle */}
              {(currentMoveAnalysis.classification === 'blunder' || currentMoveAnalysis.classification === 'mistake' || currentMoveAnalysis.classification === 'miss') && (
                <div className="pt-2 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => handleSavePuzzle(currentStep - 1, currentMoveAnalysis)}
                    disabled={savedPuzzles.has(currentStep - 1)}
                    className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all cursor-pointer ${
                      savedPuzzles.has(currentStep - 1)
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {savedPuzzles.has(currentStep - 1) ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Saved to Practice Puzzles</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span>Turn {currentMoveAnalysis.classification.toUpperCase()} into Practice Puzzle</span>
                      </>
                    )}
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
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-lg max-h-[340px] overflow-y-auto">
            <div className="flex items-center justify-between mb-2 px-1">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Game Notation & Move Badges
              </h4>
              {selectedFilterCategory !== 'all' && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold flex items-center gap-1">
                  <Filter className="w-2.5 h-2.5" />
                  Filtering: {selectedFilterCategory}
                </span>
              )}
            </div>

            <div className="space-y-1">
              {Array.from({ length: Math.ceil(moves.length / 2) }).map((_, moveIndex) => {
                const whiteMove = moves[moveIndex * 2];
                const blackMove = moves[moveIndex * 2 + 1];
                const whiteStepNum = moveIndex * 2 + 1;
                const blackStepNum = moveIndex * 2 + 2;

                const whiteMatchesFilter = selectedFilterCategory === 'all' || whiteMove?.classification === selectedFilterCategory;
                const blackMatchesFilter = selectedFilterCategory === 'all' || blackMove?.classification === selectedFilterCategory;

                if (!whiteMatchesFilter && !blackMatchesFilter) return null;

                return (
                  <div key={moveIndex} className="grid grid-cols-12 gap-2 text-xs py-1 px-1.5 rounded hover:bg-slate-800/40 items-center font-mono">
                    <span className="col-span-2 text-slate-500">{moveIndex + 1}.</span>

                    {/* White move */}
                    <button
                      onClick={() => handleStepChange(whiteStepNum)}
                      className={`col-span-5 text-left px-2 py-1 rounded flex items-center justify-between transition-colors cursor-pointer ${
                        currentStep === whiteStepNum
                          ? 'bg-amber-500/20 text-amber-300 font-bold ring-1 ring-amber-500/40'
                          : whiteMatchesFilter ? 'text-slate-200' : 'text-slate-500 opacity-40'
                      }`}
                    >
                      <span>{whiteMove.san}</span>
                      <span className="text-[10px] font-bold">
                        {getMoveSymbol(whiteMove.classification)}
                      </span>
                    </button>

                    {/* Black move */}
                    {blackMove ? (
                      <button
                        onClick={() => handleStepChange(blackStepNum)}
                        className={`col-span-5 text-left px-2 py-1 rounded flex items-center justify-between transition-colors cursor-pointer ${
                          currentStep === blackStepNum
                            ? 'bg-amber-500/20 text-amber-300 font-bold ring-1 ring-amber-500/40'
                            : blackMatchesFilter ? 'text-slate-200' : 'text-slate-500 opacity-40'
                        }`}
                      >
                        <span>{blackMove.san}</span>
                        <span className="text-[10px] font-bold">
                          {getMoveSymbol(blackMove.classification)}
                        </span>
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
