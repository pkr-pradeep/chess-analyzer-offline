import React, { useState } from 'react';
import { Chess, Square } from 'chess.js';
import { MoveAnalysis, MoveClassification } from '../../types/chess';
import { chessEngine, TacticalThreat } from '../../services/chessEngine';
import { coachService, CoachResponse } from '../../services/coachService';
import { 
  ShieldAlert, 
  Lightbulb, 
  Brain, 
  HelpCircle, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  BookmarkPlus, 
  Lock,
  ChevronRight
} from 'lucide-react';

interface CoachPanelProps {
  chess: Chess;
  lastMoveAnalysis?: MoveAnalysis | null;
  selectedSquare: Square | null;
  onSaveBlunderAsPuzzle?: (move: MoveAnalysis) => void;
  isSavedAsPuzzle?: boolean;
  showLiveAnalysis?: boolean;
  onToggleLiveAnalysis?: (enabled: boolean) => void;
}

export const CoachPanel: React.FC<CoachPanelProps> = ({
  chess,
  lastMoveAnalysis,
  selectedSquare,
  onSaveBlunderAsPuzzle,
  isSavedAsPuzzle = false,
  showLiveAnalysis = true,
  onToggleLiveAnalysis,
}) => {
  const [activeTab, setActiveTab] = useState<'blunder' | 'piece_why' | 'threats' | 'ask_coach'>('blunder');
  const [coachAnswer, setCoachAnswer] = useState<CoachResponse | null>(null);
  const [loadingCoach, setLoadingCoach] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');

  // Selected piece offline brief (memoized)
  const pieceBrief = React.useMemo(() => {
    return selectedSquare ? chessEngine.explainWhyMovePiece(chess, selectedSquare) : null;
  }, [chess, selectedSquare]);

  // Active threats (only computed when threats tab is viewed)
  const threats: TacticalThreat[] = React.useMemo(() => {
    if (activeTab !== 'threats') return [];
    return chessEngine.scanPositionTactics(chess);
  }, [chess, activeTab]);

  // Suggested move (computed only on demand to prevent render freezing)
  const [hintActive, setHintActive] = useState(false);
  const bestMove = React.useMemo(() => {
    if (!hintActive) return null;
    return chessEngine.findBestMove(chess, 2).bestMove;
  }, [chess, hintActive]);

  const handleAskPreset = async (promptText: string) => {
    setLoadingCoach(true);
    try {
      const resp = await coachService.askCoachQuestion(promptText, chess.fen());
      setCoachAnswer(resp);
      setActiveTab('ask_coach');
    } finally {
      setLoadingCoach(false);
    }
  };

  const handleCustomQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuestion.trim()) return;
    setLoadingCoach(true);
    try {
      const resp = await coachService.askCoachQuestion(userQuestion, chess.fen());
      setCoachAnswer(resp);
      setUserQuestion('');
      setActiveTab('ask_coach');
    } finally {
      setLoadingCoach(false);
    }
  };

  return (
    <div id="coach-panel-root" className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-full overflow-hidden shadow-xl text-slate-200">
      {/* Header bar */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
              Tactical Coach & Analysis
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> 100% Private & Offline Capable
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Real-time blunder detection & piece motives</p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {onToggleLiveAnalysis && (
            <button
              id="btn-coach-toggle-off"
              type="button"
              onClick={() => onToggleLiveAnalysis(!showLiveAnalysis)}
              className={`text-xs px-2.5 py-1 font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                showLiveAnalysis
                  ? 'bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300'
              }`}
              title={showLiveAnalysis ? "Stop Live Analysis and return to Move History" : "Resume Live Coach analysis"}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>{showLiveAnalysis ? 'Stop Coach' : 'Resume Coach'}</span>
            </button>
          )}

          {/* Best move suggestion chip */}
          {hintActive && bestMove ? (
            <button
              id="btn-best-move-hint"
              onClick={() => handleAskPreset(`Why is ${bestMove.san} the optimal move here?`)}
              className="text-xs bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5"
              title="Click to see why the engine recommends this move"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              Hint: <span className="font-bold text-amber-200">{bestMove.san}</span>
            </button>
          ) : (
            <button
              id="btn-request-hint"
              onClick={() => setHintActive(true)}
              className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5"
              title="Calculate tactical hint for this position"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Hint</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 px-3 pt-2 gap-1 text-xs">
        <button
          id="tab-blunder-radar"
          onClick={() => setActiveTab('blunder')}
          className={`px-3 py-1.5 rounded-t-md font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === 'blunder'
              ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Move Analysis
          {lastMoveAnalysis?.classification === 'blunder' && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          )}
        </button>

        <button
          id="tab-why-piece"
          onClick={() => setActiveTab('piece_why')}
          className={`px-3 py-1.5 rounded-t-md font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === 'piece_why'
              ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          Why Move Piece?
        </button>

        <button
          id="tab-threats"
          onClick={() => setActiveTab('threats')}
          className={`px-3 py-1.5 rounded-t-md font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === 'threats'
              ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Threat Radar ({threats.length})
        </button>

        <button
          id="tab-ask-coach"
          onClick={() => setActiveTab('ask_coach')}
          className={`px-3 py-1.5 rounded-t-md font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === 'ask_coach'
              ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Ask Coach
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        {/* Tab 1: Real-Time Blunder & Move Analysis */}
        {activeTab === 'blunder' && (
          <div className="space-y-3">
            {lastMoveAnalysis ? (
              <div>
                {/* Status card */}
                <div className={`p-3.5 rounded-xl border ${
                  lastMoveAnalysis.classification === 'blunder'
                    ? 'bg-rose-950/40 border-rose-600/40 text-rose-100'
                    : lastMoveAnalysis.classification === 'mistake'
                    ? 'bg-orange-950/40 border-orange-500/40 text-orange-100'
                    : lastMoveAnalysis.classification === 'inaccuracy'
                    ? 'bg-amber-950/30 border-amber-500/30 text-amber-100'
                    : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-100'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-sm flex items-center gap-1.5">
                      {lastMoveAnalysis.classification === 'blunder' && <ShieldAlert className="w-4 h-4 text-rose-400" />}
                      {lastMoveAnalysis.classification === 'mistake' && <AlertTriangle className="w-4 h-4 text-orange-400" />}
                      {lastMoveAnalysis.classification === 'inaccuracy' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                      {(lastMoveAnalysis.classification === 'best' || lastMoveAnalysis.classification === 'brilliant') && (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      )}
                      Last Move: <span className="font-mono font-bold">{lastMoveAnalysis.san}</span>
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-black/40">
                      {lastMoveAnalysis.classification}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-300">
                    {lastMoveAnalysis.explanation}
                  </p>

                  {/* Best move comparison */}
                  {lastMoveAnalysis.bestMoveSan && lastMoveAnalysis.bestMoveSan !== lastMoveAnalysis.san && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        Better alternative: <strong className="text-emerald-400 font-mono text-sm">{lastMoveAnalysis.bestMoveSan}</strong>
                      </span>
                      <button
                        onClick={() => handleAskPreset(`Explain why ${lastMoveAnalysis.bestMoveSan} is better than ${lastMoveAnalysis.san}`)}
                        className="text-[11px] text-amber-400 hover:underline flex items-center gap-0.5"
                      >
                        Deep dive <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Turn Blunder into Custom Practice Puzzle Button */}
                  {(lastMoveAnalysis.classification === 'blunder' || lastMoveAnalysis.classification === 'mistake') && onSaveBlunderAsPuzzle && (
                    <div className="mt-3 pt-2 border-t border-slate-800 flex justify-end">
                      <button
                        id="btn-save-blunder-puzzle"
                        disabled={isSavedAsPuzzle}
                        onClick={() => onSaveBlunderAsPuzzle(lastMoveAnalysis)}
                        className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
                          isSavedAsPuzzle
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 shadow-sm'
                        }`}
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        {isSavedAsPuzzle ? 'Saved to Custom Puzzles' : 'Turn Blunder into Practice Puzzle'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 bg-slate-950/30 rounded-xl border border-slate-800/80">
                <Brain className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-medium text-slate-300">Ready to analyze your moves</p>
                <p className="text-xs text-slate-500 mt-1">Make a move on the board to see real-time tactical classifications and blunder alerts.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Why Move Specific Piece */}
        {activeTab === 'piece_why' && (
          <div className="space-y-3">
            {selectedSquare ? (
              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400">
                    Piece Brief: Square <span className="uppercase font-mono text-sm text-slate-100">{selectedSquare}</span>
                  </span>
                  <button
                    onClick={() => handleAskPreset(`What is the grandmaster plan for the piece on ${selectedSquare}?`)}
                    className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" /> GM plan
                  </button>
                </div>
                <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                  {pieceBrief}
                </div>
              </div>
            ) : (
              <div className="p-5 text-center text-slate-400 bg-slate-950/30 rounded-xl border border-slate-800/80">
                <Lightbulb className="w-7 h-7 mx-auto mb-2 text-amber-400/60" />
                <p className="text-sm font-medium text-slate-300">Select any piece on the board</p>
                <p className="text-xs text-slate-500 mt-1">
                  Click on any pawn, knight, bishop, rook, or queen to inspect its tactical purpose, squares controlled, and active threats.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Threat Radar */}
        {activeTab === 'threats' && (
          <div className="space-y-2">
            {threats.length > 0 ? (
              threats.map((t, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                    t.threatType === 'check'
                      ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                      : t.threatType === 'hanging'
                      ? 'bg-orange-950/30 border-orange-500/40 text-orange-200'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <span className="font-semibold block">{t.threatType.replace('_', ' ').toUpperCase()} on {t.square}</span>
                    <span className="text-slate-400 leading-normal">{t.description}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-5 text-center text-slate-400 bg-slate-950/30 rounded-xl border border-slate-800/80">
                <CheckCircle className="w-7 h-7 mx-auto mb-2 text-emerald-400" />
                <p className="text-sm font-medium text-slate-200">No Immediate Hanging Pieces</p>
                <p className="text-xs text-slate-500 mt-1">Both sides maintain tactical balance. Focus on piece coordination and center control.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Ask Coach & Questions */}
        {activeTab === 'ask_coach' && (
          <div className="space-y-3">
            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => handleAskPreset('What is my main tactical or positional plan in this position?')}
                className="text-[11px] bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded border border-slate-700 text-slate-300"
              >
                What's my plan here?
              </button>
              <button
                onClick={() => handleAskPreset('Is my King safe, and should I castle now?')}
                className="text-[11px] bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded border border-slate-700 text-slate-300"
              >
                Is King safe?
              </button>
              <button
                onClick={() => handleAskPreset('What are the critical squares to fight for in this position?')}
                className="text-[11px] bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded border border-slate-700 text-slate-300"
              >
                Key squares
              </button>
            </div>

            {/* Answer Display */}
            {loadingCoach ? (
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-xs text-amber-400">
                <Sparkles className="w-4 h-4 animate-spin" />
                Consulting Grandmaster Engine...
              </div>
            ) : coachAnswer ? (
              <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-amber-400 flex items-center gap-1">
                    <Brain className="w-3.5 h-3.5" />
                    {coachAnswer.source === 'ai' ? 'Gemini Grandmaster Coach' : 'Offline Tactical Engine'}
                  </span>
                  {coachAnswer.isOffline && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">Offline Mode</span>
                  )}
                </div>
                <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                  {coachAnswer.content}
                </div>
              </div>
            ) : null}

            {/* Form */}
            <form onSubmit={handleCustomQuestionSubmit} className="flex gap-2">
              <input
                type="text"
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                placeholder="Ask any chess question..."
                className="flex-1 text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={loadingCoach || !userQuestion.trim()}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 px-3 py-2 rounded-lg font-semibold text-xs flex items-center gap-1"
              >
                Ask <ArrowRight className="w-3 h-3" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
