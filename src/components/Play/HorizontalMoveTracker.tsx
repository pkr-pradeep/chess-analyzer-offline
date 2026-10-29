import React, { useEffect, useRef } from 'react';
import { MoveAnalysis } from '../../types/chess';
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  SkipBack, 
  SkipForward, 
  Play, 
  Pause,
  History
} from 'lucide-react';

interface HorizontalMoveTrackerProps {
  moves: MoveAnalysis[];
  activeMoveIndex: number;
  onSelectMoveIndex: (index: number) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStepBackward: () => void;
  onStepForward: () => void;
  onStepStart: () => void;
  onStepEnd: () => void;
  isReplaying?: boolean;
  onToggleReplay?: () => void;
}

export const HorizontalMoveTracker: React.FC<HorizontalMoveTrackerProps> = ({
  moves,
  activeMoveIndex,
  onSelectMoveIndex,
  isExpanded,
  onToggleExpand,
  onStepBackward,
  onStepForward,
  onStepStart,
  onStepEnd,
  isReplaying = false,
  onToggleReplay,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll the horizontal track to the active move
  useEffect(() => {
    if (activeItemRef.current && scrollContainerRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeMoveIndex, isExpanded]);

  // Group moves into pairs (White & Black)
  const movePairs: { turnNumber: number; white?: { move: MoveAnalysis; index: number }; black?: { move: MoveAnalysis; index: number } }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    const turnNumber = Math.floor(i / 2) + 1;
    movePairs.push({
      turnNumber,
      white: moves[i] ? { move: moves[i], index: i } : undefined,
      black: moves[i + 1] ? { move: moves[i + 1], index: i + 1 } : undefined,
    });
  }

  // Get current active move description for summary
  const currentMoveText = activeMoveIndex >= 0 && moves[activeMoveIndex]
    ? `${Math.floor(activeMoveIndex / 2) + 1}${activeMoveIndex % 2 === 0 ? '.' : '...'} ${moves[activeMoveIndex].san}`
    : moves.length > 0
    ? 'Start position'
    : 'No moves yet';

  const getBadgeSymbol = (cls?: string) => {
    switch (cls) {
      case 'brilliant': return '💎';
      case 'best': return '⭐';
      case 'inaccuracy': return '?!';
      case 'mistake': return '?';
      case 'blunder': return '??';
      default: return null;
    }
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-lg sm:rounded-xl overflow-hidden shadow-lg transition-all">
      {/* Summary / Collapsed Header Bar */}
      <div className="flex items-center justify-between px-2.5 py-1 text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            onClick={onToggleExpand}
            className="flex items-center gap-1 font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse move history' : 'Expand horizontal move history'}
          >
            <History className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-mono text-[11px] text-amber-400/90">
              {moves.length} {moves.length === 1 ? 'move' : 'moves'}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-3 h-3 text-slate-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-slate-400" />
            )}
          </button>

          {/* Current Move Chip */}
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="font-mono text-[10px] sm:text-[11px] text-slate-300 truncate">
            {currentMoveText}
          </span>
        </div>

        {/* Quick Stepper in Collapsed Header */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onStepBackward}
            disabled={activeMoveIndex <= -1}
            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors cursor-pointer"
            title="Step backward (Previous move)"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onStepForward}
            disabled={activeMoveIndex >= moves.length - 1}
            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors cursor-pointer"
            title="Step forward (Next move)"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onToggleExpand}
            className="ml-1 px-1.5 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition-colors cursor-pointer"
          >
            {isExpanded ? 'Hide' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Expanded Horizontal Moves Scroll Strip */}
      {isExpanded && (
        <div className="border-t border-slate-800/80 bg-slate-950/80 p-1.5 space-y-1 animate-in fade-in duration-200">
          {/* Controls Bar for Step / Autoplay */}
          <div className="flex items-center justify-between gap-2 pb-1 text-xs border-b border-slate-800/50">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onStepStart}
                disabled={activeMoveIndex <= -1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors"
                title="Beginning of game"
              >
                <SkipBack className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={onStepBackward}
                disabled={activeMoveIndex <= -1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors"
                title="Previous move"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              {onToggleReplay && (
                <button
                  type="button"
                  onClick={onToggleReplay}
                  disabled={moves.length === 0}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                    isReplaying
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30'
                  }`}
                  title={isReplaying ? 'Pause replay' : 'Auto-play move replay'}
                >
                  {isReplaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span className="text-[10px]">{isReplaying ? 'Pause' : 'Replay'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={onStepForward}
                disabled={activeMoveIndex >= moves.length - 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors"
                title="Next move"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={onStepEnd}
                disabled={activeMoveIndex >= moves.length - 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors"
                title="Latest live move"
              >
                <SkipForward className="w-3 h-3" />
              </button>
            </div>

            <div className="text-[11px] font-mono text-slate-400">
              Position: <strong className="text-amber-400">{activeMoveIndex + 1}</strong> / {moves.length}
            </div>
          </div>

          {/* Horizontal Scrollable Moves Container */}
          <div
            ref={scrollContainerRef}
            className="flex items-center gap-2 overflow-x-auto py-1 scroll-smooth no-scrollbar"
            style={{ scrollbarWidth: 'thin' }}
          >
            {/* Start position button */}
            <button
              type="button"
              onClick={() => onSelectMoveIndex(-1)}
              className={`shrink-0 px-2 py-1 rounded-lg text-[11px] font-mono font-medium transition-all ${
                activeMoveIndex === -1
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400'
              }`}
            >
              Start
            </button>

            {movePairs.map(({ turnNumber, white, black }) => (
              <div
                key={`turn-${turnNumber}`}
                className="shrink-0 flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 gap-1 shadow-xs"
              >
                <span className="text-[10px] font-mono text-slate-500 px-1 font-semibold">
                  {turnNumber}.
                </span>

                {/* White Move */}
                {white && (
                  <button
                    ref={white.index === activeMoveIndex ? activeItemRef : undefined}
                    type="button"
                    onClick={() => onSelectMoveIndex(white.index)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all flex items-center gap-1 cursor-pointer ${
                      white.index === activeMoveIndex
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-200 hover:bg-slate-800'
                    }`}
                    title={white.move.timeSpentSeconds !== undefined ? `Move: ${white.move.san} • Time: ${white.move.timeSpentSeconds}s` : `Move: ${white.move.san}`}
                  >
                    <span>{white.move.san}</span>
                    {white.move.timeSpentSeconds !== undefined && (
                      <span className={`text-[9px] font-normal ${white.index === activeMoveIndex ? 'text-slate-900/80' : 'text-slate-400'}`}>
                        {white.move.timeSpentSeconds}s
                      </span>
                    )}
                    {getBadgeSymbol(white.move.classification) && (
                      <span className="text-[9px] opacity-80">
                        {getBadgeSymbol(white.move.classification)}
                      </span>
                    )}
                  </button>
                )}

                {/* Black Move */}
                {black && (
                  <button
                    ref={black.index === activeMoveIndex ? activeItemRef : undefined}
                    type="button"
                    onClick={() => onSelectMoveIndex(black.index)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all flex items-center gap-1 cursor-pointer ${
                      black.index === activeMoveIndex
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                    title={black.move.timeSpentSeconds !== undefined ? `Move: ${black.move.san} • Time: ${black.move.timeSpentSeconds}s` : `Move: ${black.move.san}`}
                  >
                    <span>{black.move.san}</span>
                    {black.move.timeSpentSeconds !== undefined && (
                      <span className={`text-[9px] font-normal ${black.index === activeMoveIndex ? 'text-slate-900/80' : 'text-slate-400'}`}>
                        {black.move.timeSpentSeconds}s
                      </span>
                    )}
                    {getBadgeSymbol(black.move.classification) && (
                      <span className="text-[9px] opacity-80">
                        {getBadgeSymbol(black.move.classification)}
                      </span>
                    )}
                  </button>
                )}
              </div>
            ))}

            {moves.length === 0 && (
              <span className="text-xs text-slate-500 italic py-1 pl-2">
                Make your first move on the board to begin tracking.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
