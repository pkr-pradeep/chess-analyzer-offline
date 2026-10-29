import React from 'react';
import { Lock, ShieldCheck, Database, HardDrive, Cpu, X } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-4 text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Privacy & Data Protection</h3>
              <p className="text-xs text-slate-400">Local-first, client-side data sovereignty</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <HardDrive className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-100 block mb-0.5">100% Client-Side Persistence</strong>
              Your games, move notations, blunder histories, ratings, and custom puzzle collections are stored strictly within your browser's private storage (`localStorage`). No tracking database is used.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <Cpu className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-100 block mb-0.5">Fully Offline Capable Engine</strong>
              The tactical evaluation engine, move validation, blunder detection algorithms, and minimax chess bot run entirely client-side using JavaScript. You can play, practice, and review games with zero internet connection.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <Lock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-100 block mb-0.5">Zero Telemetry & Third-Party Analytics</strong>
              We do not track, profile, monetize, or sell user game habits. Optional AI Grandmaster commentary operates on demand via secure server proxies without storing user identity.
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors"
          >
            I Understand & Accept
          </button>
        </div>
      </div>
    </div>
  );
};
