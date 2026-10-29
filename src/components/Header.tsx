import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Gamepad2, 
  Search, 
  Puzzle, 
  Target, 
  BarChart3, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  Wifi, 
  WifiOff,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Sparkles,
  PlayCircle,
  TrendingUp
} from 'lucide-react';
import { chessAudio } from '../utils/chessAudio';

interface HeaderProps {
  activeTab: 'play' | 'review' | 'puzzles' | 'plan' | 'dashboard';
  onSelectTab: (tab: 'play' | 'review' | 'puzzles' | 'plan' | 'dashboard') => void;
  onOpenPrivacy: () => void;
  onOpenInstallApk?: () => void;
  isPrivacyOpen?: boolean;
  isInstallOpen?: boolean;
  rating: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenPrivacy,
  onOpenInstallApk,
  isPrivacyOpen = false,
  isInstallOpen = false,
  rating,
}) => {
  const [isMuted, setIsMuted] = useState(!chessAudio.isSoundEnabled());
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isRibbonExpanded, setIsRibbonExpanded] = useState<boolean>(false); // Office-style ribbon expansion toggle

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    chessAudio.setSoundEnabled(!next);
  };

  const navItems = [
    { 
      id: 'play' as const, 
      label: 'Play & Coach', 
      shortLabel: 'Play', 
      icon: Gamepad2,
      tagline: 'Bot Match & Live Blunder Coach',
      shortcut: 'Match Arena'
    },
    { 
      id: 'review' as const, 
      label: 'Game Review', 
      shortLabel: 'Review', 
      icon: Search,
      tagline: 'Move Analysis & Accuracy Stats',
      shortcut: 'Blunder Check'
    },
    { 
      id: 'puzzles' as const, 
      label: 'Custom Puzzles', 
      shortLabel: 'Puzzles', 
      icon: Puzzle,
      tagline: 'Tactics Generated from Your Mistakes',
      shortcut: 'Tactics Gym'
    },
    { 
      id: 'plan' as const, 
      label: 'Improvement Plan', 
      shortLabel: 'Plan', 
      icon: Target,
      tagline: 'Adaptive AI Training Roadmap',
      shortcut: 'Study Regimen'
    },
    { 
      id: 'dashboard' as const, 
      label: 'Progress Dashboard', 
      shortLabel: 'Stats', 
      icon: BarChart3,
      tagline: 'Rating Trends & Offline Database',
      shortcut: 'Performance'
    },
  ];

  return (
    <header className="shrink-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-2.5 sm:px-6 py-1 sm:py-1.5 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold tracking-tight text-slate-100 flex items-center gap-1">
              <span>Chess Bot</span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                GM
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 hidden lg:block leading-none">
              Rating: <strong className="text-amber-400 font-mono">{rating}</strong>
            </p>
          </div>
        </div>

        {/* Microsoft Office Style Static Horizontal Icon Bar (No Scrolling!) */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 sm:p-1 shadow-inner">
          <nav className="flex items-center gap-0.5 sm:gap-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => {
                    if (isRibbonExpanded) {
                      setIsRibbonExpanded(false);
                    }
                    onSelectTab(item.id);
                  }}
                  className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg font-medium flex items-center gap-1.5 transition-all text-[11px] sm:text-xs cursor-pointer select-none relative group ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                  title={isActive ? `Click to close ${item.label}` : `${item.label} - ${item.tagline}`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="hidden sm:inline font-medium">{item.shortLabel}</span>

                  {/* Office-style Active Indicator Underline */}
                  {isActive && (
                    <span className="absolute bottom-0 inset-x-2 h-0.5 bg-slate-950/70 rounded-full" />
                  )}

                  {/* Tooltip on Hover */}
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-slate-200 text-[10px] py-0.5 px-2 rounded shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 hidden sm:block">
                    {isActive ? `Close ${item.label} (Return to board)` : item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Microsoft Office Ribbon Expand / Collapse Toggle Button */}
          <div className="h-4 w-px bg-slate-800 mx-1 hidden xs:block" />
          <button
            id="btn-toggle-ribbon"
            type="button"
            onClick={() => setIsRibbonExpanded(!isRibbonExpanded)}
            className={`p-1 sm:p-1.5 rounded-md transition-all cursor-pointer flex items-center gap-0.5 text-[10px] font-semibold ${
              isRibbonExpanded
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={isRibbonExpanded ? 'Close / Fold Ribbon View' : 'Expand Ribbon View with Full Details'}
          >
            {isRibbonExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            <span className="hidden md:inline text-[10px] text-slate-400">
              {isRibbonExpanded ? 'Fold' : 'Expand'}
            </span>
          </button>
        </div>

        {/* Desktop & Mobile Utility Controls */}
        <div className="flex items-center gap-1 sm:gap-2 text-xs shrink-0">
          {/* Online/Offline Badge */}
          <div 
            className={`hidden md:flex px-2 py-0.5 rounded-full border items-center gap-1 text-[10px] font-medium ${
              isOnline
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-950/40 border-amber-500/30 text-amber-400'
            }`}
            title={isOnline ? 'Online: Hybrid AI active' : 'Offline: Local Engine active'}
          >
            {isOnline ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
            <span>{isOnline ? 'AI' : 'Offline'}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-1 sm:p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title={isMuted ? 'Unmute chess sounds' : 'Mute chess sounds'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-500" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
          </button>

          {/* Install / APK Button (Clicking same icon closes window) */}
          <button
            id="btn-header-install-apk"
            onClick={onOpenInstallApk}
            className={`p-1 sm:px-2.5 sm:py-1 rounded-lg border font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
              isInstallOpen
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300'
            }`}
            title={isInstallOpen ? 'Close APK Window' : 'Download APK or Install on Android'}
          >
            <Smartphone className={`w-3.5 h-3.5 ${isInstallOpen ? 'text-slate-950' : 'text-amber-400'}`} />
            <span className="hidden sm:inline text-[11px]">{isInstallOpen ? 'Close' : 'APK'}</span>
          </button>

          {/* Privacy Button (Clicking same icon closes window) */}
          <button
            onClick={onOpenPrivacy}
            className={`p-1 sm:px-2 sm:py-1 rounded-lg border transition-colors flex items-center gap-1 font-medium cursor-pointer ${
              isPrivacyOpen
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                : 'bg-emerald-950/40 hover:bg-emerald-950/60 border-emerald-500/30 text-emerald-400 hover:text-emerald-300'
            }`}
            title={isPrivacyOpen ? 'Close Privacy Window' : 'View Data Privacy Guarantee'}
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${isPrivacyOpen ? 'text-slate-950' : ''}`} />
            <span className="hidden lg:inline text-[11px]">{isPrivacyOpen ? 'Close' : 'Privacy'}</span>
          </button>
        </div>
      </div>

      {/* Expanded Microsoft Office Ribbon Strip (Appears on expand, zero page shift) */}
      {isRibbonExpanded && (
        <div className="absolute top-full left-0 right-0 z-50 bg-slate-900/98 backdrop-blur-xl border-b border-amber-500/30 shadow-2xl animate-in slide-in-from-top-2 duration-150 py-2.5 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full md:w-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={`ribbon-${item.id}`}
                    onClick={() => {
                      onSelectTab(item.id);
                      setIsRibbonExpanded(false);
                    }}
                    className={`flex flex-col items-start p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500/15 border-amber-500/50 text-slate-100 ring-1 ring-amber-500/30'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 w-full">
                      <div className={`p-1 rounded-md ${isActive ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-400'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold truncate">{item.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">{item.tagline}</span>
                    <span className="text-[9px] font-mono text-amber-400/80 mt-0.5">{item.shortcut}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Ribbon Status & Close */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end pt-1 md:pt-0 border-t md:border-t-0 border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">
                Rating: <strong className="text-amber-400 font-mono">{rating}</strong> • GM Bot Level
              </div>
              <button
                type="button"
                onClick={() => setIsRibbonExpanded(false)}
                className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 cursor-pointer"
              >
                Close Ribbon
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
