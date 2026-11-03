import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Loader2,
  Trash2,
  Cpu,
  ShieldAlert
} from 'lucide-react';
import { geminiKeyService } from '../services/geminiKeyService';

interface GeminiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeminiKeyModal: React.FC<GeminiKeyModalProps> = ({ isOpen, onClose }) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [hasStoredKey, setHasStoredKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = geminiKeyService.getStoredApiKey();
      if (stored) {
        setApiKeyInput(stored);
        setHasStoredKey(true);
        setStatusMessage({
          type: 'success',
          text: 'Gemini API key is configured. Online Grandmaster AI analysis is active!',
        });
      } else {
        setApiKeyInput('');
        setHasStoredKey(false);
        setStatusMessage(null);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerifyAndSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter a Gemini API key.',
      });
      return;
    }

    setIsVerifying(true);
    setStatusMessage(null);

    const result = await geminiKeyService.verifyKeyOnServer(trimmed);
    setIsVerifying(false);

    if (result.valid) {
      geminiKeyService.setStoredApiKey(trimmed);
      setHasStoredKey(true);
      setStatusMessage({
        type: 'success',
        text: result.message || 'Gemini API Key verified! Online AI analysis is now active.',
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: result.message || 'Verification failed. Please double-check your key.',
      });
    }
  };

  const handleRemoveKey = () => {
    geminiKeyService.clearStoredApiKey();
    setApiKeyInput('');
    setHasStoredKey(false);
    setStatusMessage({
      type: 'info',
      text: 'Key removed. Reverted to offline tactical engine.',
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Gemini AI Tactical Coach</span>
                {hasStoredKey ? (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Online Active
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    Offline Engine
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">
                Online Grandmaster Analysis & Live Tactical Commentary
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs sm:text-sm text-slate-300">
          {/* Explanation Banner */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <p className="text-slate-200 font-medium text-xs leading-relaxed">
              Provide your Gemini API key to enable online deep move analysis during games or in post-game review.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Deep strategic move rationale</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Blunder explanations & tips</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Custom improvement plans</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Stored locally in your browser</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleVerifyAndSave} className="space-y-3">
            <div>
              <label htmlFor="gemini-key-input" className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Gemini API Key
                </span>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1"
                >
                  Get free key <ExternalLink className="w-3 h-3" />
                </a>
              </label>

              <div className="relative">
                <input
                  id="gemini-key-input"
                  type={showKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Paste your Gemini API key here..."
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Status Feedback */}
            {statusMessage && (
              <div
                className={`p-2.5 rounded-xl border flex items-start gap-2 text-xs animate-in fade-in duration-150 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : statusMessage.type === 'error'
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                    : 'bg-blue-950/40 border-blue-500/40 text-blue-300'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <span className="leading-tight">{statusMessage.text}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-between pt-1 gap-2">
              <div>
                {hasStoredKey && (
                  <button
                    type="button"
                    onClick={handleRemoveKey}
                    className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Key</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying || !apiKeyInput.trim()}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Verify & Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
