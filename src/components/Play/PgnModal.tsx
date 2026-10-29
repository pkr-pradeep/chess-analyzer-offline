import React, { useState } from 'react';
import { Chess } from 'chess.js';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Upload, 
  FileText, 
  AlertCircle,
  BookOpen
} from 'lucide-react';

interface PgnModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPgn: string;
  onImportPgn: (pgn: string) => boolean;
  whitePlayerName?: string;
  blackPlayerName?: string;
}

const SAMPLE_PGNS = [
  {
    title: 'Ruy Lopez: Morphy Defense',
    pgn: `[Event "Casual Match"]
[Site "AI Studio Royal Chess"]
[Date "2025.01.15"]
[White "Player"]
[Black "Stockfish Casual"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 *`
  },
  {
    title: 'Sicilian Defense: Najdorf',
    pgn: `[Event "Casual Match"]
[Site "AI Studio Royal Chess"]
[Date "2025.01.15"]
[White "Stockfish Club"]
[Black "Player"]
[Result "*"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 8. f3 Be7 9. Qd2 O-O 10. O-O-O Nbd7 *`
  },
  {
    title: "Queen's Gambit Declined",
    pgn: `[Event "Casual Match"]
[Site "AI Studio Royal Chess"]
[Date "2025.01.15"]
[White "Player"]
[Black "Stockfish Casual"]
[Result "*"]

1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 Nbd7 7. Qc2 c5 8. cxd5 exd5 9. Bd3 c4 10. Bf5 a6 *`
  }
];

export const PgnModal: React.FC<PgnModalProps> = ({
  isOpen,
  onClose,
  currentPgn,
  onImportPgn,
  whitePlayerName = 'White',
  blackPlayerName = 'Black',
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Format export PGN with standard headers if not present
  const fullExportPgn = currentPgn.includes('[Event')
    ? currentPgn
    : `[Event "AI Studio Royal Chess Match"]
[Site "Google AI Studio"]
[Date "${new Date().toISOString().slice(0, 10).replace(/-/g, '.')}"]
[Round "1"]
[White "${whitePlayerName}"]
[Black "${blackPlayerName}"]
[Result "*"]

${currentPgn || '1. e4'}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullExportPgn);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    const blob = new Blob([fullExportPgn], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chess_match_${Date.now()}.pgn`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExecuteImport = () => {
    setImportError(null);
    const trimmed = importText.trim();
    if (!trimmed) {
      setImportError('Please paste or type PGN text to import.');
      return;
    }

    try {
      const testChess = new Chess();
      testChess.loadPgn(trimmed);

      const success = onImportPgn(trimmed);
      if (success) {
        onClose();
      } else {
        setImportError('Could not load game from this PGN.');
      }
    } catch (err: any) {
      setImportError(err?.message || 'Failed to parse PGN. Check move notation.');
    }
  };

  const handleLoadSample = (samplePgn: string) => {
    setImportText(samplePgn);
    setImportError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div 
        id="pgn-modal-content" 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">PGN Notation Manager</h3>
              <p className="text-[11px] text-slate-400">Import and export standard chess Portable Game Notation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-5 pt-2 bg-slate-900/90 gap-2">
          <button
            id="tab-pgn-export"
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === 'export'
                ? 'border-amber-400 text-amber-400 bg-slate-800/80'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Export PGN
          </button>
          <button
            id="tab-pgn-import"
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === 'import'
                ? 'border-amber-400 text-amber-400 bg-slate-800/80'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Import PGN
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'export' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Current Game Notation:</span>
                <span className="text-[11px] text-slate-500 font-mono">Standard PGN Format</span>
              </div>

              <textarea
                readOnly
                value={fullExportPgn}
                rows={9}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-hidden resize-none select-all selection:bg-amber-500/30"
              />

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  id="btn-copy-pgn"
                  onClick={handleCopy}
                  className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied to Clipboard!' : 'Copy PGN'}
                </button>

                <button
                  id="btn-download-pgn"
                  onClick={handleDownload}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download File
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="import-pgn-textarea" className="text-xs text-slate-400 font-medium">
                  Paste PGN Text to load game:
                </label>
              </div>

              <textarea
                id="import-pgn-textarea"
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  setImportError(null);
                }}
                placeholder="Paste standard PGN notation here, e.g.&#10;1. e4 e5 2. Nf3 Nc6 3. Bb5 a6..."
                rows={7}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-hidden focus:border-amber-500/50 resize-none"
              />

              {importError && (
                <div className="flex items-center gap-2 p-2.5 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Sample Games Picker */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-amber-400" />
                  Or load standard opening preset:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_PGNS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleLoadSample(sample.pgn)}
                      className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700/80 transition-colors"
                    >
                      {sample.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-import-pgn"
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={!importText.trim()}
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Load Game & Position
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
