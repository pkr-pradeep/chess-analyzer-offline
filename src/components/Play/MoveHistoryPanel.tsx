import React, { useRef, useEffect } from 'react';
import { MoveAnalysis } from '../../types/chess';
import { 
  History, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Upload, 
  Download, 
  SlidersHorizontal,
  Brain,
  Sparkles,
  Award,
  Play,
  Pause
} from 'lucide-react';

interface MoveHistoryPanelProps {
  moves: MoveAnalysis[];
  activeMoveIndex: number; // -1 = start position, moves.length - 1 = current latest move
  onSelectMoveIndex: (index: number) => void;
  onRewindMove: () => void;
  canRewind: boolean;
  showLiveAnalysis: boolean;
  onToggleLiveAnalysis: (enabled: boolean) => void;
  onOpenPgnModal: () => void;
  whitePlayerName: string;
  blackPlayerName: string;
  isBotThinking?: boolean;
  isReplaying?: boolean;
  onToggleReplay?: () => void;
}

export const MoveHistoryPanel: React.FC<MoveHistoryPanelProps> = ({
  moves,
  activeMoveIndex,
  onSelectMoveIndex,
  onRewindMove,
  canRewind,
  showLiveAnalysis,
  onToggleLiveAnalysis,
  onOpenPgnModal,
  whitePlayerName,
  blackPlayerName,
  isBotThinking = false,
  isReplaying = false,
  onToggleReplay,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Group moves into pairs (White move, Black move)
  const movePairs: { moveNumber: number; white?: MoveAnalysis; whiteIndex: number; black?: MoveAnalysis; blackIndex: number }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: moves[i],
      whiteIndex: i,
      black: moves[i + 1],
      blackIndex: i + 1,
    });
  }

  // Auto-scroll to current active move
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves.length, activeMoveIndex]);

  const totalMoves = moves.length;
  const isAtLatest = activeMoveIndex === totalMoves - 1;
  const isAtStart = activeMoveIndex === -1;

  return (
    <div id="move-history-panel" className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-full overflow-hidden shadow-xl text-slate-200">
      {/* Top Header Bar */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
              Move History
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-slate-800 text-amber-400 border border-slate-700">
                {totalMoves} {totalMoves === 1 ? 'ply' : 'plies'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">{whitePlayerName} vs {blackPlayerName}</p>
          </div>
        </div>

        {/* PGN Actions */}
        <div className="flex items-center gap-1.5">
          <button
            id="btn-open-pgn-modal"
            onClick={onOpenPgnModal}
            className="text-xs px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
            title="Import or Export Game in PGN format"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium">PGN</span>
          </button>
        </div>
      </div>

      {/* Live Analysis Toggle Header Banner */}
      <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className={`w-4 h-4 ${showLiveAnalysis ? 'text-amber-400' : 'text-slate-500'}`} />
          <div>
            <span className="text-xs font-semibold text-slate-200 block leading-tight">Live Analysis & Coach</span>
            <span className="text-[10px] text-slate-400 leading-tight">
              {showLiveAnalysis ? 'Active: real-time tactical evaluation' : 'Off: distraction-free free flow'}
            </span>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          id="toggle-live-analysis"
          type="button"
          role="switch"
          aria-checked={showLiveAnalysis}
          onClick={() => onToggleLiveAnalysis(!showLiveAnalysis)}
          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
            showLiveAnalysis ? 'bg-amber-500' : 'bg-slate-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              showLiveAnalysis ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Scrollable Move History Table */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-1">
        {totalMoves === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
            <History className="w-8 h-8 opacity-30 text-amber-400" />
            <p className="text-xs font-medium">No moves played yet.</p>
            <p className="text-[11px] text-slate-500">Make your first move on the board to begin!</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {movePairs.map((pair) => {
              const isWhiteActive = activeMoveIndex === pair.whiteIndex;
              const isBlackActive = activeMoveIndex === pair.blackIndex;

              return (
                <div
                  key={pair.moveNumber}
                  className="grid grid-cols-12 items-center text-xs py-1 px-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                  {/* Move Number */}
                  <span className="col-span-2 font-mono text-slate-500 text-[11px] font-semibold">
                    {pair.moveNumber}.
                  </span>

                  {/* White Move */}
                  <button
                    type="button"
                    onClick={() => onSelectMoveIndex(pair.whiteIndex)}
                    className={`col-span-5 text-left px-2 py-1 rounded-md font-mono font-medium transition-all ${
                      isWhiteActive
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {pair.white?.san}
                  </button>

                  {/* Black Move */}
                  {pair.black ? (
                    <button
                      type="button"
                      onClick={() => onSelectMoveIndex(pair.blackIndex)}
                      className={`col-span-5 text-left px-2 py-1 rounded-md font-mono font-medium transition-all ${
                        isBlackActive
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {pair.black.san}
                    </button>
                  ) : (
                    <span className="col-span-5 text-slate-600 font-mono italic text-[11px] px-2 py-1">
                      {isBotThinking ? '...' : ''}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Interactive Controls & Rewind Button */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800 space-y-2">
        {/* Navigation buttons: start, prev, replay, next, latest */}
        <div className="flex items-center justify-between gap-1">
          <button
            id="btn-history-start"
            type="button"
            onClick={() => onSelectMoveIndex(-1)}
            disabled={isAtStart || totalMoves === 0}
            className="flex-1 py-1.5 px-2 bg-slate-800/80 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 rounded-lg border border-slate-700/60 flex items-center justify-center transition-colors"
            title="Jump to starting position"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          <button
            id="btn-history-prev"
            type="button"
            onClick={() => onSelectMoveIndex(Math.max(-1, activeMoveIndex - 1))}
            disabled={isAtStart || totalMoves === 0}
            className="flex-1 py-1.5 px-2 bg-slate-800/80 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 rounded-lg border border-slate-700/60 flex items-center justify-center transition-colors"
            title="Step back one move"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {onToggleReplay && (
            <button
              id="btn-history-replay"
              type="button"
              onClick={onToggleReplay}
              disabled={totalMoves === 0}
              className={`flex-1 py-1.5 px-2 rounded-lg border flex items-center justify-center transition-colors font-medium text-xs ${
                isReplaying 
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold' 
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 disabled:opacity-30 disabled:cursor-not-allowed'
              }`}
              title={isReplaying ? "Pause replay" : "Autoplay replay"}
            >
              {isReplaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          )}

          <button
            id="btn-history-next"
            type="button"
            onClick={() => onSelectMoveIndex(Math.min(totalMoves - 1, activeMoveIndex + 1))}
            disabled={isAtLatest || totalMoves === 0}
            className="flex-1 py-1.5 px-2 bg-slate-800/80 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 rounded-lg border border-slate-700/60 flex items-center justify-center transition-colors"
            title="Step forward one move"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            id="btn-history-latest"
            type="button"
            onClick={() => onSelectMoveIndex(totalMoves - 1)}
            disabled={isAtLatest || totalMoves === 0}
            className="flex-1 py-1.5 px-2 bg-slate-800/80 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 rounded-lg border border-slate-700/60 flex items-center justify-center transition-colors"
            title="Jump to latest live move"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Rewind Move (Undo) Button */}
        <button
          id="btn-rewind-move"
          type="button"
          onClick={onRewindMove}
          disabled={!canRewind}
          className="w-full py-2.5 px-3 bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-35 disabled:cursor-not-allowed border border-amber-500/40 text-amber-300 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          title="Rewind the last move (take back)"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
          <span>Rewind Move (Undo)</span>
        </button>
      </div>
    </div>
  );
};
