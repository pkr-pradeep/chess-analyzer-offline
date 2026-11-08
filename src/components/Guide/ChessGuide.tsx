import React, { useState } from 'react';
import { Chess } from 'chess.js';
import { CHESS_GUIDE_CHAPTERS, GuideChapter, GuideLesson } from '../../data/guideLessons';
import { ChessBoard } from '../ChessBoard/ChessBoard';
import { 
  BookOpen, 
  Swords, 
  Crown, 
  Compass, 
  Flame, 
  Shield, 
  Award, 
  CheckCircle, 
  Quote, 
  ChevronRight, 
  ChevronLeft,
  Play, 
  RotateCcw,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface ChessGuideProps {
  onNavigateToPuzzles?: (theme?: string) => void;
  onNavigateToPlay?: () => void;
}

export const ChessGuide: React.FC<ChessGuideProps> = ({
  onNavigateToPuzzles,
  onNavigateToPlay,
}) => {
  const [selectedChapterId, setSelectedChapterId] = useState<string>(CHESS_GUIDE_CHAPTERS[0].id);
  const activeChapter: GuideChapter = CHESS_GUIDE_CHAPTERS.find(c => c.id === selectedChapterId) || CHESS_GUIDE_CHAPTERS[0];
  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number>(0);
  const activeLesson: GuideLesson = activeChapter.lessons[selectedLessonIndex] || activeChapter.lessons[0];

  // Interactive sample moves stepper state
  const [stepIndex, setStepIndex] = useState<number>(0);

  // Derive board state for the active lesson
  const lessonChess = React.useMemo(() => {
    const c = new Chess(activeLesson.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    if (activeLesson.sampleMoves && stepIndex > 0) {
      for (let i = 0; i < stepIndex && i < activeLesson.sampleMoves.length; i++) {
        try {
          c.move(activeLesson.sampleMoves[i]);
        } catch {
          // ignore illegal move in demo
        }
      }
    }
    return c;
  }, [activeLesson.fen, activeLesson.sampleMoves, stepIndex]);

  // Handle lesson change
  const handleSelectLesson = (idx: number) => {
    setSelectedLessonIndex(idx);
    setStepIndex(0);
  };

  // Chapter icon mapper
  const renderChapterIcon = (iconName: string) => {
    switch (iconName) {
      case 'Swords': return <Swords className="w-4 h-4 text-rose-400" />;
      case 'Crown': return <Crown className="w-4 h-4 text-amber-400" />;
      case 'Compass': return <Compass className="w-4 h-4 text-sky-400" />;
      case 'Flame': return <Flame className="w-4 h-4 text-orange-400" />;
      case 'Shield': return <Shield className="w-4 h-4 text-emerald-400" />;
      case 'BookOpen': return <BookOpen className="w-4 h-4 text-purple-400" />;
      default: return <BookOpen className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div id="chess-guide-root" className="w-full space-y-6 pb-12">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wide">
                Masterclass & Literature Rules
              </span>
              <span className="text-xs text-slate-400">Dr. Dave Regis • Zlatanovic • Chernev • Emms • FIDE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight mt-1.5 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-amber-400" />
              Comprehensive Chess Guide & Master Lessons
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Explore tactical motifs, central strategy, opening blueprints, checkmate formulas, and FIDE laws synthesized from classic chess manuals and grandmaster treatises.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            {onNavigateToPuzzles && (
              <button
                onClick={() => onNavigateToPuzzles(activeLesson.puzzleThemeLink)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Practice Puzzles</span>
              </button>
            )}
            {onNavigateToPlay && (
              <button
                onClick={onNavigateToPlay}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>Play Match</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chapter Tabs Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        {CHESS_GUIDE_CHAPTERS.map((ch) => {
          const isActive = ch.id === selectedChapterId;
          return (
            <button
              key={ch.id}
              onClick={() => {
                setSelectedChapterId(ch.id);
                setSelectedLessonIndex(0);
                setStepIndex(0);
              }}
              className={`px-3 py-2 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              {renderChapterIcon(ch.iconName)}
              <span>{ch.title}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area: Left Column Lesson List & Right Column Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Lessons in this Chapter */}
        <div className="lg:col-span-4 space-y-2">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md">
            <div className="px-2 py-1.5 border-b border-slate-800/80 mb-2">
              <span className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider block">
                {activeChapter.author}
              </span>
              <p className="text-xs text-slate-400 mt-0.5 leading-snug">{activeChapter.tagline}</p>
            </div>

            <div className="space-y-1.5">
              {activeChapter.lessons.map((lesson, idx) => {
                const isCurrent = idx === selectedLessonIndex;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => handleSelectLesson(idx)}
                    className={`w-full text-left p-2.5 rounded-lg transition-all flex items-start gap-2.5 cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300'
                        : 'bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-transparent'
                    }`}
                  >
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold mt-0.5 shrink-0 ${
                      isCurrent ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-200 leading-snug truncate">
                        {lesson.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {lesson.subtitle}
                      </div>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 mt-1 ${isCurrent ? 'text-amber-400' : 'text-slate-600'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Active Lesson Reader & Interactive Diagram */}
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6">
            {/* Lesson Title & Citation */}
            <div className="border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {activeChapter.title}
                </span>
                <span className="text-xs text-slate-400">Lesson {selectedLessonIndex + 1} of {activeChapter.lessons.length}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100 mt-2">
                {activeLesson.title}
              </h2>
              <p className="text-sm text-amber-300/90 font-medium mt-0.5">
                {activeLesson.subtitle}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Source: {activeLesson.bookCitation}</span>
              </div>
            </div>

            {/* Board Diagram / Interactive Move Stepper (if FEN present) */}
            {activeLesson.fen && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-5 shadow-inner">
                <div className="w-full max-w-[280px] sm:max-w-[320px] shrink-0">
                  <ChessBoard
                    chess={lessonChess}
                    onMove={() => false}
                    playerColor={lessonChess.turn()}
                    isInteractive={false}
                  />
                </div>

                <div className="flex-1 space-y-3 w-full">
                  <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
                    <span>Position Diagram</span>
                    <span className="text-amber-400 font-bold">
                      {lessonChess.turn() === 'w' ? 'White' : 'Black'} to move
                    </span>
                  </div>

                  {activeLesson.sampleMoves && activeLesson.sampleMoves.length > 0 && (
                    <div className="space-y-2 bg-slate-900/90 border border-slate-800 p-3 rounded-lg">
                      <div className="text-xs text-slate-300 font-medium flex items-center justify-between">
                        <span>Demonstration Sequence:</span>
                        <span className="text-[11px] font-mono text-slate-400">
                          Step {stepIndex} of {activeLesson.sampleMoves.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {activeLesson.sampleMoves.map((m, mIdx) => (
                          <span
                            key={mIdx}
                            className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                              mIdx < stepIndex
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {m}
                          </span>
                        ))}
                      </div>

                      {/* Stepper controls */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => setStepIndex(0)}
                          disabled={stepIndex === 0}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs text-slate-300 flex items-center gap-1 cursor-pointer"
                          title="Reset to initial position"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                        <button
                          onClick={() => setStepIndex(prev => Math.max(0, prev - 1))}
                          disabled={stepIndex === 0}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs text-slate-300 flex items-center gap-1 cursor-pointer"
                        >
                          <ChevronLeft className="w-3 h-3" />
                          <span>Back</span>
                        </button>
                        <button
                          onClick={() => setStepIndex(prev => Math.min(activeLesson.sampleMoves!.length, prev + 1))}
                          disabled={stepIndex >= activeLesson.sampleMoves.length}
                          className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-xs text-slate-950 font-bold flex items-center gap-1 cursor-pointer ml-auto"
                        >
                          <span>Step Move</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {activeLesson.puzzleThemeLink && onNavigateToPuzzles && (
                    <button
                      onClick={() => onNavigateToPuzzles(activeLesson.puzzleThemeLink)}
                      className="w-full text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 p-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Solve Related {activeLesson.theme.replace(/_/g, ' ')} Puzzles</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Core Teaching Content */}
            <div className="space-y-3 text-slate-300 text-xs sm:text-sm leading-relaxed">
              {activeLesson.content.map((p, pIdx) => (
                <p key={pIdx} className="leading-relaxed">
                  {p}
                </p>
              ))}
            </div>

            {/* Quote Card (if available) */}
            {activeLesson.quote && (
              <div className="p-4 bg-gradient-to-r from-amber-500/10 to-transparent border-l-4 border-amber-500 rounded-r-xl space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                  <Quote className="w-3.5 h-3.5 shrink-0" />
                  <span>Grandmaster Wisdom:</span>
                </div>
                <blockquote className="text-xs sm:text-sm text-slate-200 italic leading-relaxed">
                  "{activeLesson.quote}"
                </blockquote>
                {activeLesson.quoteAuthor && (
                  <p className="text-[11px] text-amber-400/90 font-medium text-right">— {activeLesson.quoteAuthor}</p>
                )}
              </div>
            )}

            {/* Key Rules / Golden Rules Box */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Coach's Key Takeaways & Golden Rules</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {activeLesson.keyRules.map((rule, rIdx) => (
                  <li key={rIdx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Navigation Stepper between lessons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                onClick={() => handleSelectLesson(Math.max(0, selectedLessonIndex - 1))}
                disabled={selectedLessonIndex === 0}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-20 text-xs text-slate-300 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Lesson</span>
              </button>

              <button
                onClick={() => handleSelectLesson(Math.min(activeChapter.lessons.length - 1, selectedLessonIndex + 1))}
                disabled={selectedLessonIndex >= activeChapter.lessons.length - 1}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-20 text-xs text-slate-950 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Next Lesson</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
