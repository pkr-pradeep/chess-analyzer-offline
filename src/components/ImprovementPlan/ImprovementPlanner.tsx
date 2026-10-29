import React, { useState } from 'react';
import { ImprovementPlan } from '../../types/chess';
import { 
  Target, 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  Sparkles, 
  BookOpen, 
  Flame, 
  ShieldCheck, 
  Calendar,
  Lock,
  ArrowRight
} from 'lucide-react';

interface ImprovementPlannerProps {
  plan: ImprovementPlan;
  onUpdatePlan: (updatedPlan: ImprovementPlan) => void;
  onRegenerateAI: () => Promise<void>;
  isGeneratingAI: boolean;
}

export const ImprovementPlanner: React.FC<ImprovementPlannerProps> = ({
  plan,
  onUpdatePlan,
  onRegenerateAI,
  isGeneratingAI,
}) => {
  const toggleDrill = (phaseNum: number, drillId: string) => {
    const updatedPhases = plan.phases.map((phase) => {
      if (phase.phaseNumber === phaseNum) {
        return {
          ...phase,
          drills: phase.drills.map((d) => (d.id === drillId ? { ...d, completed: !d.completed } : d)),
        };
      }
      return phase;
    });

    onUpdatePlan({
      ...plan,
      phases: updatedPhases,
    });
  };

  // Calculate overall plan progress
  let totalDrills = 0;
  let completedDrills = 0;
  plan.phases.forEach((p) => {
    p.drills.forEach((d) => {
      totalDrills++;
      if (d.completed) completedDrills++;
    });
  });
  const progressPercent = totalDrills > 0 ? Math.round((completedDrills / totalDrills) * 100) : 0;

  return (
    <div id="improvement-planner-root" className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Personalized Chess Roadmap
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" /> 100% Private to Your Device
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100">
              Your Targeted Improvement Plan
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Constructed from your real-time blunder logs, game inaccuracies, and current rating ({plan.playerRating}).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-regen-plan"
              onClick={onRegenerateAI}
              disabled={isGeneratingAI}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              {isGeneratingAI ? 'Synthesizing...' : 'Refresh Coach Plan'}
            </button>
          </div>
        </div>

        {/* Progress Bar & Mantra */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5 items-center">
          <div className="md:col-span-1 bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-300">Drill Completion</span>
              <span className="font-mono text-amber-400 font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-2 block">
              {completedDrills} of {totalDrills} training drills completed
            </span>
          </div>

          <div className="md:col-span-2 bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 p-4 rounded-xl">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> Grandmaster Mindset Rule
            </span>
            <p className="text-sm font-medium text-slate-200 mt-1 italic">
              {plan.grandmasterMantra}
            </p>
          </div>
        </div>
      </div>

      {/* Weakness Diagnostics */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Primary Leak Diagnostics (Detected from Match History)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {plan.primaryWeaknesses.map((w, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                w.severity === 'high'
                  ? 'bg-rose-950/25 border-rose-600/30 text-rose-200'
                  : 'bg-amber-950/20 border-amber-600/30 text-amber-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100">{w.theme}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/40 uppercase font-bold tracking-wider">
                  {w.severity} priority
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">{w.description}</p>
              <span className="text-[11px] text-slate-400 block pt-1">
                Impacted {w.frequency} recorded moves
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3-Phase Roadmap */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          Three-Phase Actionable Training Schedule
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plan.phases.map((phase) => (
            <div
              key={phase.phaseNumber}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Phase {phase.phaseNumber}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {phase.duration}
                  </span>
                </div>

                <h4 className="font-bold text-slate-100 text-sm mb-1">{phase.title}</h4>
                <p className="text-xs text-slate-400 mb-4">{phase.focus}</p>

                {/* Drill checklist */}
                <div className="space-y-2.5">
                  {phase.drills.map((drill) => (
                    <div
                      key={drill.id}
                      onClick={() => toggleDrill(phase.phaseNumber, drill.id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                        drill.completed
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-400'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="mt-0.5">
                        {drill.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className={`font-semibold block ${drill.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                          {drill.title}
                        </span>
                        <span className="text-[11px] text-slate-400 leading-normal">{drill.goal}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended openings */}
              {phase.phaseNumber === 2 && plan.recommendedOpenings && (
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                    Recommended Openings:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {plan.recommendedOpenings.map((op, i) => (
                      <span key={i} className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                        {op}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
