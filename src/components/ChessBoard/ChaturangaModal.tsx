import React, { useState } from 'react';
import { X, Shield, Sparkles, BookOpen, Crown } from 'lucide-react';
import { IndianChessPiece } from './IndianChessPiece';
import { PieceSymbol } from 'chess.js';

interface ChaturangaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PieceInfo {
  type: PieceSymbol;
  sanskritName: string;
  englishTitle: string;
  role: string;
  symbolism: string;
  artDetails: string;
}

const PIECE_LORE: PieceInfo[] = [
  {
    type: 'k',
    sanskritName: 'Raja (राजा)',
    englishTitle: 'The King / Sovereign',
    role: 'The heart of the army. Ancient texts state when the Raja falls, the battle concludes.',
    symbolism: 'Dharma, patience, leadership, and unyielding dignity under pressure.',
    artDetails: 'Imperial sovereignty depicted atop a sacred green lotus leaf foundation, adorned with gold filigree, dual ruby gemstones, and a crowned royal kalasha finial.',
  },
  {
    type: 'q',
    sanskritName: 'Rani / Mantri (रानी / मंत्री)',
    englishTitle: 'The Queen / Chief Counselor',
    role: 'The supreme military adviser and commanding presence across the 64 squares (Ashtapada).',
    symbolism: 'Swift tactical intellect, far-reaching influence, and decisive action.',
    artDetails: 'Sculpted five-petal lotus mukut crown studded with brilliant ruby gemstones and golden lotus bezels resting gracefully on a verdant lotus leaf base.',
  },
  {
    type: 'b',
    sanskritName: 'Guru / Purohit (गुरु / पुरोहित)',
    englishTitle: 'The Bishop / Royal Sage',
    role: 'Strategic mentor commanding the long diagonal corridors with visionary clarity.',
    symbolism: 'Spiritual foresight, tactical wisdom, and the guiding flame of knowledge.',
    artDetails: 'Sacred lotus bud shikhara crowned with a golden teardrop bezel framing a luminous sapphire/ruby gem on an ornamental lotus petal plinth.',
  },
  {
    type: 'n',
    sanskritName: 'Ashva / Yoddha (अश्व / योद्धा)',
    englishTitle: 'The Knight / Cavalry Warrior',
    role: 'Leaps over fortifications and obstacles, executing surgical forks and flanking maneuvers.',
    symbolism: 'Agility, courage, unconstrained geometry, and battlefield surprise.',
    artDetails: 'Spirited royal warhorse with sculpted mane, ornate golden harness, and regal emerald lotus leaf ground.',
  },
  {
    type: 'r',
    sanskritName: 'Ratha / Kota (रथ / कोट)',
    englishTitle: 'The Rook / Citadel Bastion',
    role: 'Heavy battle tower and fortress dominating files, ranks, and endgames.',
    symbolism: 'Impenetrable fortress defenses, structural solidarity, and decisive late-game dominance.',
    artDetails: 'Towering fortified bastion turret with four distinct lotus-crested battlements, gold-ringed waist, and sacred lotus leaf footer.',
  },
  {
    type: 'p',
    sanskritName: 'Sainik / Padati (सैनिक / पदाति)',
    englishTitle: 'The Pawn / Foot Soldier',
    role: 'The soul of chess (Philidor) and the frontline foundation of every campaign.',
    symbolism: 'Perseverance, discipline, promotion through dedication, and selfless duty.',
    artDetails: 'Polished spherical jewel head nestled in a blooming lotus blossom on a ribbed pedestal and green water-lily pad base.',
  },
];

export const ChaturangaModal: React.FC<ChaturangaModalProps> = ({ isOpen, onClose }) => {
  const [selectedColor, setSelectedColor] = useState<'w' | 'b'>('w');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Ancient Motto */}
        <div className="px-6 py-5 border-b border-amber-500/20 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-wide text-amber-300">
                  Ancient Indian Chess Heritage
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Chaturanga Set
                </span>
              </div>
              <p className="text-xs text-amber-200/70 font-medium tracking-wider">
                TRADITION • STRATEGY • WISDOM • VICTORY — SAME ROOTS, DIFFERENT BATTLES
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Color Army Selector */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Army Palette:</span>
            <div className="inline-flex p-0.5 bg-slate-800 rounded-lg border border-slate-700">
              <button
                onClick={() => setSelectedColor('w')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                  selectedColor === 'w'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-600" />
                White / Gold Army (Saffron & Crimson)
              </button>
              <button
                onClick={() => setSelectedColor('b')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                  selectedColor === 'b'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-blue-300" />
                Black / Sapphire Blue Army (Navy & Gold)
              </button>
            </div>
          </div>

          <span className="text-xs text-slate-400 hidden sm:inline">
            Directly from your uploaded theme design
          </span>
        </div>

        {/* Pieces Showcase Grid */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PIECE_LORE.map((piece) => (
              <div
                key={piece.type}
                className="flex gap-4 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-amber-500/40 transition-colors"
              >
                {/* Visual Piece Icon */}
                <div className="w-20 h-20 shrink-0 p-1 bg-slate-950/80 rounded-xl border border-slate-700 flex items-center justify-center shadow-inner">
                  <IndianChessPiece type={piece.type} color={selectedColor} className="w-full h-full" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-1">
                    <h3 className="text-sm font-bold text-amber-400">
                      {piece.sanskritName}
                    </h3>
                    <span className="text-[11px] font-medium text-slate-400">
                      {piece.englishTitle}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                    {piece.role}
                  </p>

                  <div className="pt-2 border-t border-slate-700/50 flex flex-col gap-1 text-[11px]">
                    <div className="text-slate-400">
                      <span className="text-amber-300/90 font-semibold">Symbolism: </span>
                      {piece.symbolism}
                    </div>
                    <div className="text-slate-400/90">
                      <span className="text-slate-300 font-semibold">Artwork: </span>
                      {piece.artDetails}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Historical Note Footer */}
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-300">The Roots of Chess (Chaturanga): </span>
              In 6th-century India during the Gupta Empire, the game was known as <em>Chaturanga</em> (चतुरङ्ग, meaning "four limbs of the army" — infantry, cavalry, elephants, and chariots). It traveled along trade routes to Persia as <em>Shatranj</em> and then to Europe, evolving into modern chess. These pieces celebrate the original ancient Indian tactical martial tradition.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium tracking-wide">
            DISCIPLINE • STRATEGY • A BRIGHTER TOMORROW
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors"
          >
            Apply & Play With Theme
          </button>
        </div>
      </div>
    </div>
  );
};
