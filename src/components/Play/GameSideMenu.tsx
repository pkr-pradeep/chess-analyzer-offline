import React from 'react';
import { 
  X, 
  RotateCcw, 
  Swords, 
  FileText, 
  Cpu, 
  Brain, 
  Activity, 
  Palette, 
  Sparkles, 
  Crown,
  Award,
  Settings,
  HelpCircle,
  Flag,
  Handshake
} from 'lucide-react';
import { BotDifficulty, MoveAnalysis, PieceColor } from '../../types/chess';
import { StockfishInfo } from '../../services/stockfishService';
import { ChessPieceTheme } from '../ChessBoard/ChessPiece';
import { CoachPanel } from '../CoachPanel/CoachPanel';
import { Chess, Square } from 'chess.js';

interface GameSideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBot: BotDifficulty;
  onSelectBot: (bot: BotDifficulty) => void;
  botDifficulties: BotDifficulty[];
  engineMode: 'stockfish' | 'minimax';
  onChangeEngineMode: (mode: 'stockfish' | 'minimax') => void;
  playerColor: PieceColor;
  onStartNewGame: (color?: PieceColor, bot?: BotDifficulty) => void;
  onOpenPgnModal: () => void;
  showLiveAnalysis: boolean;
  onToggleLiveAnalysis: (enabled: boolean) => void;
  stockfishInfo: StockfishInfo | null;
  pieceTheme: ChessPieceTheme;
  onChangePieceTheme: (theme: ChessPieceTheme) => void;
  onOpenLoreModal: () => void;
  onResign: () => void;
  onDraw: () => void;
  gameResult: string | null;
  chess: Chess;
  latestPlayerMove: MoveAnalysis | null;
  selectedSquare: Square | null;
  onSaveBlunderAsPuzzle: (move: MoveAnalysis) => void;
  isSavedAsPuzzle: boolean;
}

export const GameSideMenu: React.FC<GameSideMenuProps> = ({
  isOpen,
  onClose,
  selectedBot,
  onSelectBot,
  botDifficulties,
  engineMode,
  onChangeEngineMode,
  playerColor,
  onStartNewGame,
  onOpenPgnModal,
  showLiveAnalysis,
  onToggleLiveAnalysis,
  stockfishInfo,
  pieceTheme,
  onChangePieceTheme,
  onOpenLoreModal,
  onResign,
  onDraw,
  gameResult,
  chess,
  latestPlayerMove,
  selectedSquare,
  onSaveBlunderAsPuzzle,
  isSavedAsPuzzle,
}) => {
  const [activeTab, setActiveTab] = React.useState<'settings' | 'coach'>('settings');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop Overlay */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-out Drawer Container */}
      <div className="relative w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-10 overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Game Options & Menu</h2>
              <p className="text-[11px] text-slate-400">Bot difficulty, AI coach, PGN & settings</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Options vs AI Coach */}
        <div className="p-3 bg-slate-950/50 border-b border-slate-800/80 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Game Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('coach')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'coach'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>AI Coach & Advice</span>
            {showLiveAnalysis && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Drawer Body Scroll Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs">
          {activeTab === 'settings' ? (
            <>
              {/* SECTION: Quick Game Actions */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Game Controls
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onStartNewGame(playerColor, selectedBot);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold border border-slate-700/80 flex items-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-400" />
                    <span>New Match</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onStartNewGame(playerColor === 'w' ? 'b' : 'w', selectedBot);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold border border-slate-700/80 flex items-center gap-2 transition-colors"
                  >
                    <Swords className="w-4 h-4 text-amber-400" />
                    <span>Play as {playerColor === 'w' ? 'Black' : 'White'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenPgnModal();
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold border border-slate-700/80 flex items-center gap-2 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>PGN Import / Export</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onDraw();
                      onClose();
                    }}
                    disabled={Boolean(gameResult)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-semibold border border-slate-700/80 flex items-center gap-2 transition-colors"
                  >
                    <Handshake className="w-4 h-4 text-slate-400" />
                    <span>Offer Draw</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onResign();
                      onClose();
                    }}
                    disabled={Boolean(gameResult)}
                    className="col-span-2 p-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 disabled:opacity-40 text-rose-300 font-semibold border border-rose-500/30 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Flag className="w-4 h-4 text-rose-400" />
                    <span>Resign Current Match</span>
                  </button>
                </div>
              </div>

              {/* SECTION: Bot Difficulty Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Bot Opponent
                  </h3>
                  <span className="text-[11px] text-amber-400 font-mono font-bold">
                    Rating {selectedBot.rating}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {botDifficulties.map((bot) => (
                    <button
                      key={bot.id}
                      type="button"
                      onClick={() => onSelectBot(bot)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                        selectedBot.id === bot.id
                          ? 'bg-amber-500/15 border-amber-500/60 shadow-sm'
                          : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl shrink-0">{bot.avatar}</span>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-100 flex items-center gap-1.5">
                            <span>{bot.name}</span>
                            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                              {bot.rating}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">{bot.description}</p>
                        </div>
                      </div>
                      {selectedBot.id === bot.id && (
                        <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION: Engine Calculation Backend */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Engine Engine Backend
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onChangeEngineMode('stockfish')}
                    className={`p-2.5 rounded-xl border font-semibold text-left transition-all flex flex-col gap-1 ${
                      engineMode === 'stockfish'
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Stockfish 18</span>
                    </div>
                    <span className="text-[10px] opacity-75 font-normal">Official UCI WebAssembly</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeEngineMode('minimax')}
                    className={`p-2.5 rounded-xl border font-semibold text-left transition-all flex flex-col gap-1 ${
                      engineMode === 'minimax'
                        ? 'bg-slate-700/80 border-slate-600 text-slate-100'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" />
                      <span>Minimax</span>
                    </div>
                    <span className="text-[10px] opacity-75 font-normal">Lightweight heuristic</span>
                  </button>
                </div>
              </div>

              {/* SECTION: Piece Theme & Cultural Lore */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Board & Piece Themes
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onChangePieceTheme('classic')}
                    className={`p-2.5 rounded-xl border font-semibold text-left transition-all flex flex-col gap-1 ${
                      pieceTheme === 'classic'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" />
                      <span>Staunton Set</span>
                    </div>
                    <span className="text-[10px] opacity-75 font-normal">Official pieces from Zip</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangePieceTheme('indian')}
                    className={`p-2.5 rounded-xl border font-semibold text-left transition-all flex flex-col gap-1 ${
                      pieceTheme === 'indian'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5" />
                      <span>Ancient Indian</span>
                    </div>
                    <span className="text-[10px] opacity-75 font-normal">Grey & White Board</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onOpenLoreModal();
                    onClose();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center gap-2 font-medium transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Explore Chaturanga Lore & History</span>
                </button>
              </div>

              {/* SECTION: Live Engine Telemetry Stats */}
              {engineMode === 'stockfish' && stockfishInfo && (
                <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                    <Activity className="w-3.5 h-3.5 animate-pulse" />
                    <span>Live Stockfish Telemetry</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 pt-1">
                    <div>Depth: <strong className="text-white">{stockfishInfo.depth || 10}</strong></div>
                    <div>Eval: <strong className="text-amber-400">{stockfishInfo.scoreCp !== undefined ? (stockfishInfo.scoreCp / 100).toFixed(2) : '0.00'}</strong></div>
                    {stockfishInfo.nps && (
                      <div className="col-span-2 text-[10px] text-slate-400">
                        Search Speed: {(stockfishInfo.nps / 1000).toFixed(0)}k nodes/sec
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* COACH TAB CONTENT */
            <div className="space-y-4">
              {/* Master Live Coach Switch */}
              <div className="flex items-center justify-between p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div>
                  <div className="font-bold text-slate-100 flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-amber-400" />
                    <span>Real-Time AI Coach</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Instant tactical advice & blunder alerts</p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={showLiveAnalysis}
                  onClick={() => onToggleLiveAnalysis(!showLiveAnalysis)}
                  className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    showLiveAnalysis ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out flex items-center justify-center text-[9px] font-black ${
                      showLiveAnalysis ? 'translate-x-6 text-amber-600' : 'translate-x-0 text-slate-500'
                    }`}
                  >
                    {showLiveAnalysis ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

              {/* Embedded Coach Panel */}
              <CoachPanel
                chess={chess}
                lastMoveAnalysis={latestPlayerMove}
                selectedSquare={selectedSquare}
                onSaveBlunderAsPuzzle={onSaveBlunderAsPuzzle}
                isSavedAsPuzzle={isSavedAsPuzzle}
                showLiveAnalysis={showLiveAnalysis}
                onToggleLiveAnalysis={onToggleLiveAnalysis}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
