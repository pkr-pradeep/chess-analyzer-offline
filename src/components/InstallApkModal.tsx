import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Terminal,
  QrCode
} from 'lucide-react';

interface InstallApkModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstallPrompt: () => void;
}

export const InstallApkModal: React.FC<InstallApkModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallPrompt,
}) => {
  const [activeTab, setActiveTab] = useState<'direct' | 'pwabuilder' | 'cli'>('direct');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // The published/live app URL
  const appUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://ais-pre-bs75nxd7bwndiep4wafoxp-940395642598.asia-southeast1.run.app';

  const pwabuilderUrl = `https://www.pwabuilder.com/?site=${encodeURIComponent(appUrl)}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(appUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        id="install-apk-modal"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Get Android App / APK
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Android
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Install as a standalone native app on your phone or generate an APK package
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-3 border-b border-slate-800 flex gap-2 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('direct')}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'direct'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>1. Instant Android Install (WebAPK)</span>
          </button>
          <button
            onClick={() => setActiveTab('pwabuilder')}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'pwabuilder'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>2. Download APK (PWABuilder)</span>
          </button>
          <button
            onClick={() => setActiveTab('cli')}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'cli'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>3. Developer CLI / TWA</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300">
          {activeTab === 'direct' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/30 rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">
                      Install Directly on Android (Recommended)
                    </h3>
                    <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                      Android automatically packages this certified PWA into a real, signed <strong>WebAPK</strong> file on your device. It runs full-screen with no browser address bar, custom app launcher icon, and full offline Stockfish engine support.
                    </p>
                  </div>
                </div>

                {deferredPrompt ? (
                  <button
                    onClick={() => {
                      onInstallPrompt();
                      onClose();
                    }}
                    className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install App on this Device Now</span>
                  </button>
                ) : (
                  <div className="text-[11px] text-amber-300/80 bg-amber-950/30 border border-amber-500/20 p-2.5 rounded-lg">
                    💡 If viewing this on a desktop, open this link on your Android phone in <strong>Google Chrome</strong> or <strong>Brave</strong> to install in 1 tap.
                  </div>
                )}
              </div>

              {/* Step by step for Android */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-slate-200">How to install on Android phone:</h4>
                <ol className="space-y-2 list-decimal list-inside text-slate-400 text-[11px]">
                  <li className="p-2 bg-slate-950/60 border border-slate-800 rounded-lg">
                    <span className="font-semibold text-slate-200">Open in Chrome/Brave on Android:</span>
                    <div className="mt-1.5 flex items-center gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={appUrl} 
                        className="bg-slate-900 border border-slate-700 text-slate-300 px-2.5 py-1 rounded text-[11px] flex-1 font-mono select-all" 
                      />
                      <button 
                        onClick={handleCopyUrl}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 flex items-center gap-1 shrink-0"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </li>
                  <li className="p-2 bg-slate-950/60 border border-slate-800 rounded-lg">
                    <span className="font-semibold text-slate-200">Tap the browser menu:</span> Tap the three dots (<strong className="text-slate-200">⋮</strong>) at the top right of Chrome.
                  </li>
                  <li className="p-2 bg-slate-950/60 border border-slate-800 rounded-lg">
                    <span className="font-semibold text-slate-200">Tap "Install app" or "Add to Home screen":</span> Android will install the app icon to your home screen and app drawer as an independent application.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'pwabuilder' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">
                      Generate Signed APK with PWABuilder
                    </h3>
                    <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                      <strong>PWABuilder</strong> (maintained by Microsoft & Google) takes this live Web App Manifest, icon assets, and offline service worker to build a production-ready <strong>.apk</strong> or <strong>.aab</strong> package for Android and the Google Play Store.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Target App URL:</span>
                    <span className="font-mono text-amber-400 truncate max-w-xs">{appUrl}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Manifest & Icons:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Ready (192x192, 512x512, Maskable)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Offline Engine:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Service Worker & Stockfish Cached
                    </span>
                  </div>
                </div>

                <a
                  href={pwabuilderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
                >
                  <span>Open in PWABuilder to Download APK</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                <p className="text-[10px] text-slate-500 text-center">
                  In PWABuilder, click "Package for Stores" → Select "Android" → Download APK / AAB.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'cli' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">
                      Build APK with Google's Bubblewrap CLI
                    </h3>
                    <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                      Bubblewrap is Google's official command-line tool that generates an Android Studio project from a PWA URL and compiles an APK/AAB via Trusted Web Activities (TWA).
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2 font-mono text-[11px] text-slate-300">
                  <p className="text-slate-500 text-[10px]"># 1. Initialize Bubblewrap project</p>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 overflow-x-auto text-amber-300">
                    npx @bubblewrap/cli init --manifest={appUrl}/manifest.json
                  </div>
                  <p className="text-slate-500 text-[10px]"># 2. Build the signed Android APK</p>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 overflow-x-auto text-emerald-300">
                    npx @bubblewrap/cli build
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Bubblewrap automatically fetches the application name, icons, and theme color from <code className="text-amber-400">/manifest.json</code> and compiles a native APK ready to side-load or publish to Google Play.
                </p>
              </div>
            </div>
          )}

          {/* Privacy & Safety Note */}
          <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl flex items-center gap-2.5 text-slate-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              The app operates 100% offline with local Stockfish engine capabilities and zero tracking.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex justify-end bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
