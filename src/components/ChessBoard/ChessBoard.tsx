import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Chess, Square, Move, PieceSymbol, Color } from 'chess.js';
import { ChessPiece, ChessPieceTheme } from './ChessPiece';
import { ChaturangaModal } from './ChaturangaModal';
import { MoveClassification, PieceColor } from '../../types/chess';
import { Crown, Sparkles } from 'lucide-react';

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

// Helper for badge icon
function getClassificationBadge(cls?: MoveClassification) {
  switch (cls) {
    case 'brilliant':
      return <span className="bg-cyan-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">💎 Brilliant</span>;
    case 'best':
      return <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">⭐ Best</span>;
    case 'inaccuracy':
      return <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">?! Inaccuracy</span>;
    case 'mistake':
      return <span className="bg-orange-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">? Mistake</span>;
    case 'blunder':
      return <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">?? Blunder</span>;
    default:
      return null;
  }
}

interface BoardSquareProps {
  square: Square;
  rankStr: string;
  fileStr: string;
  fileIndex: number;
  rankIndex: number;
  isLight: boolean;
  piece: { type: PieceSymbol; color: Color } | null;
  isSelected: boolean;
  isLastMoveFrom: boolean;
  isLastMoveTo: boolean;
  isLegalTarget: boolean;
  isCaptureTarget: boolean;
  isKingCheck: boolean;
  isHighlighted: boolean;
  classification?: MoveClassification;
  currentTheme: ChessPieceTheme;
  isInteractive: boolean;
  canDrag: boolean;
  onClick: (square: Square) => void;
  onDragStart: (e: React.DragEvent, square: Square) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, square: Square) => void;
}

/**
 * Individual memoized square. Only re-renders if its own piece, selection,
 * or highlight status changes, eliminating all board-wide screen flickering.
 */
const BoardSquare: React.FC<BoardSquareProps> = React.memo(({
  square,
  rankStr,
  fileStr,
  fileIndex,
  rankIndex,
  isLight,
  piece,
  isSelected,
  isLastMoveFrom,
  isLastMoveTo,
  isLegalTarget,
  isCaptureTarget,
  isKingCheck,
  isHighlighted,
  classification,
  currentTheme,
  canDrag,
  onClick,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  let squareBg = '';
  if (currentTheme === 'indian') {
    // Grey and White board for Ancient Indian chess
    if (isSelected) {
      squareBg = isLight ? 'bg-amber-100 ring-4 ring-amber-500 ring-inset' : 'bg-[#4a505b] ring-4 ring-amber-400 ring-inset';
    } else if (isLastMoveTo || isLastMoveFrom) {
      squareBg = isLight ? 'bg-[#dbe3eb]' : 'bg-[#474d58]';
    } else if (isHighlighted) {
      squareBg = isLight ? 'bg-amber-100' : 'bg-[#4a505b] ring-2 ring-amber-400/80 ring-inset';
    } else {
      squareBg = isLight ? 'bg-white' : 'bg-[#5c626d]';
    }
  } else {
    // Untouched Staunton Board
    if (isSelected) {
      squareBg = isLight ? 'bg-[#baca44]' : 'bg-[#a3b137]';
    } else if (isLastMoveTo || isLastMoveFrom) {
      squareBg = isLight ? 'bg-[#ced26b]' : 'bg-[#aaa23b]';
    } else if (isHighlighted) {
      squareBg = isLight ? 'bg-amber-200' : 'bg-amber-500/60';
    } else {
      squareBg = isLight ? 'bg-[#f0d9b5]' : 'bg-[#b58863]';
    }
  }

  return (
    <div
      id={`square-${square}`}
      onClick={() => onClick(square)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, square)}
      className={`relative flex items-center justify-center cursor-pointer select-none ${squareBg} ${
        isKingCheck ? 'ring-4 ring-rose-500 ring-inset animate-pulse' : ''
      }`}
    >
      {/* Distinctive, clean, eye-friendly bold outline for ONLY the recent move */}
      {isLastMoveTo ? (
        <>
          {/* Destination Cell: Bold 3.5px black frame with inner contrast hairline */}
          <div className="absolute inset-0 pointer-events-none border-[3px] sm:border-[3.5px] border-slate-950 rounded-[2px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45)] z-20" />
          {/* Refined golden corner target accents for clear arrival recognition */}
          <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 border-t-2 border-l-2 border-amber-400 pointer-events-none z-30" />
          <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 border-t-2 border-r-2 border-amber-400 pointer-events-none z-30" />
          <div className="absolute bottom-0.5 left-0.5 w-1.5 h-1.5 border-b-2 border-l-2 border-amber-400 pointer-events-none z-30" />
          <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 border-b-2 border-r-2 border-amber-400 pointer-events-none z-30" />
        </>
      ) : isLastMoveFrom ? (
        <>
          {/* Origin Cell: Bold 3px black frame indicating departure */}
          <div className="absolute inset-0 pointer-events-none border-[3px] border-slate-950/90 rounded-[2px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] z-20" />
          {/* Subtle center departure dot */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-950/35" />
          </div>
        </>
      ) : null}
      {fileIndex === 0 && (
        <span className={`absolute top-0.5 left-1 text-[10px] font-bold ${
          currentTheme === 'indian'
            ? (isLight ? 'text-black' : 'text-white')
            : (isLight ? 'text-[#b58863]' : 'text-[#f0d9b5]')
        } pointer-events-none z-10`}>
          {rankStr}
        </span>
      )}

      {rankIndex === 7 && (
        <span className={`absolute bottom-0.5 right-1 text-[10px] font-bold ${
          currentTheme === 'indian'
            ? (isLight ? 'text-black' : 'text-white')
            : (isLight ? 'text-[#b58863]' : 'text-[#f0d9b5]')
        } pointer-events-none z-10`}>
          {fileStr}
        </span>
      )}

      {isLastMoveTo && classification && (
        <div className="absolute top-1 right-1 z-20 pointer-events-none">
          {getClassificationBadge(classification)}
        </div>
      )}

      {isLegalTarget && !isCaptureTarget && (
        <div className={`absolute w-3.5 h-3.5 rounded-full pointer-events-none ${
          currentTheme === 'indian'
            ? (isLight ? 'bg-black/35' : 'bg-white/45')
            : 'bg-black/25'
        }`} />
      )}

      {isCaptureTarget && (
        <div className={`absolute inset-1 rounded-full border-4 pointer-events-none ${
          currentTheme === 'indian'
            ? (isLight ? 'border-black/40' : 'border-white/50')
            : 'border-black/30'
        }`} />
      )}

      {piece && (
        <div
          draggable={canDrag}
          onDragStart={(e) => onDragStart(e, square)}
          className={`w-full h-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 ${
            canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
          }`}
        >
          {currentTheme === 'indian' ? (
            /* Indian pieces: large, prominent, filling the square */
            <div className="w-full h-full flex items-center justify-center transform scale-110 sm:scale-115 pointer-events-none drop-shadow-sm transition-transform">
              <ChessPiece type={piece.type} color={piece.color} theme={currentTheme} />
            </div>
          ) : (
            /* Staunton pieces: slight gap from cell boundary */
            <div className="w-[84%] h-[84%] flex items-center justify-center pointer-events-none drop-shadow-sm transition-transform">
              <ChessPiece type={piece.type} color={piece.color} theme={currentTheme} />
            </div>
          )}
        </div>
      )}
    </div>
  );
});

interface ChessBoardProps {
  chess: Chess;
  onMove: (move: { from: Square; to: Square; promotion?: PieceSymbol }) => boolean;
  playerColor?: PieceColor;
  isInteractive?: boolean;
  lastMove?: { from: Square; to: Square; classification?: MoveClassification } | null;
  highlightSquares?: Square[];
  bestMoveArrow?: { from: Square; to: Square } | null;
  evaluation?: number; // centipawns
  onPieceSelect?: (square: Square) => void;
  selectedSquare?: Square | null;
  pieceTheme?: ChessPieceTheme;
  onPieceThemeChange?: (theme: ChessPieceTheme) => void;
  showThemeBar?: boolean;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  chess,
  onMove,
  playerColor = 'w',
  isInteractive = true,
  lastMove,
  highlightSquares = [],
  evaluation = 0,
  onPieceSelect,
  selectedSquare: externalSelectedSquare,
  pieceTheme: externalPieceTheme,
  onPieceThemeChange,
  showThemeBar = false,
}) => {
  const [internalSelected, setInternalSelected] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);
  const [isLoreModalOpen, setIsLoreModalOpen] = useState(false);
  const [internalTheme, setInternalTheme] = useState<ChessPieceTheme>(() => {
    const stored = localStorage.getItem('chess_piece_theme');
    if (stored === 'indian' || stored === 'classic') return stored;
    return 'classic';
  });

  const currentTheme = externalPieceTheme || internalTheme;

  const handleThemeChange = (newTheme: ChessPieceTheme) => {
    setInternalTheme(newTheme);
    localStorage.setItem('chess_piece_theme', newTheme);
    onPieceThemeChange?.(newTheme);
  };

  const selectedSquare = externalSelectedSquare !== undefined ? externalSelectedSquare : internalSelected;

  const board = chess.board();
  const isFlipped = playerColor === 'b';
  const turn = chess.turn();

  const displayFiles = useMemo(() => (isFlipped ? [...files].reverse() : files), [isFlipped]);
  const displayRanks = useMemo(() => (isFlipped ? [...ranks].reverse() : ranks), [isFlipped]);

  // Keep legal moves in sync when chess position or selection changes
  useEffect(() => {
    if (selectedSquare) {
      try {
        const moves = chess.moves({ square: selectedSquare, verbose: true });
        setLegalMoves(moves);
      } catch {
        setLegalMoves([]);
      }
    } else {
      setLegalMoves([]);
    }
  }, [chess, selectedSquare]);

  const handleSquareClick = useCallback((square: Square) => {
    if (!isInteractive) return;

    try {
      if (selectedSquare) {
        // If clicking another piece of the current player, switch selection immediately
        const clickedPiece = chess.get(square);
        if (clickedPiece && clickedPiece.color === chess.turn()) {
          setInternalSelected(square);
          try {
            const moves = chess.moves({ square, verbose: true });
            setLegalMoves(moves);
          } catch {
            setLegalMoves([]);
          }
          onPieceSelect?.(square);
          return;
        }

        // Check if clicking a legal move target
        const legalTarget = legalMoves.find((m) => m.to === square);
        if (legalTarget) {
          const isPromotion = legalTarget.piece === 'p' && (square[1] === '8' || square[1] === '1');
          const success = onMove({
            from: selectedSquare,
            to: square,
            promotion: isPromotion ? 'q' : undefined,
          });

          if (success) {
            setInternalSelected(null);
            setLegalMoves([]);
            return;
          }
        }
      }

      // Otherwise select clicked piece if it belongs to current player's turn
      const piece = chess.get(square);
      if (piece && piece.color === chess.turn()) {
        setInternalSelected(square);
        try {
          const moves = chess.moves({ square, verbose: true });
          setLegalMoves(moves);
        } catch {
          setLegalMoves([]);
        }
        onPieceSelect?.(square);
      } else {
        setInternalSelected(null);
        setLegalMoves([]);
      }
    } catch {
      setInternalSelected(null);
      setLegalMoves([]);
    }
  }, [chess, isInteractive, legalMoves, onMove, onPieceSelect, selectedSquare]);

  const handleDragStart = useCallback((e: React.DragEvent, square: Square) => {
    if (!isInteractive) return;
    const piece = chess.get(square);
    if (!piece || piece.color !== chess.turn()) {
      e.preventDefault();
      return;
    }
    setDraggedSquare(square);
    setInternalSelected(square);
    const moves = chess.moves({ square, verbose: true });
    setLegalMoves(moves);
    onPieceSelect?.(square);
    e.dataTransfer.setData('text/plain', square);
  }, [chess, isInteractive, onPieceSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetSquare: Square) => {
    e.preventDefault();
    if (!draggedSquare || !isInteractive) return;

    if (draggedSquare !== targetSquare) {
      const isLegal = legalMoves.some((m) => m.to === targetSquare);
      if (isLegal) {
        const piece = chess.get(draggedSquare);
        const isPromotion = piece?.type === 'p' && (targetSquare[1] === '8' || targetSquare[1] === '1');
        onMove({
          from: draggedSquare,
          to: targetSquare,
          promotion: isPromotion ? 'q' : undefined,
        });
      }
    }

    setDraggedSquare(null);
    setInternalSelected(null);
    setLegalMoves([]);
  }, [chess, draggedSquare, isInteractive, legalMoves, onMove]);

  // Convert evaluation into percentage for visual bar (-1000cp to +1000cp mapped to 0% to 100%)
  const clampedEval = Math.max(-1000, Math.min(1000, evaluation));
  const whitePercent = 50 + (clampedEval / 1000) * 45;
  const evalDisplay = evaluation >= 0 ? `+${(evaluation / 100).toFixed(1)}` : (evaluation / 100).toFixed(1);

  // Is King in check?
  const isCheck = chess.inCheck();
  let kingInCheckSquare: Square | null = null;
  if (isCheck) {
    const currentTurn = chess.turn();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === currentTurn) {
          kingInCheckSquare = `${files[c]}${8 - r}` as Square;
        }
      }
    }
  }

  return (
    <div className="flex flex-col gap-1 w-full items-center justify-center">
      {/* Optional Theme and Heritage Bar (Hidden by default for clean zen view) */}
      {showThemeBar && (
        <div className="flex items-center justify-between px-1 text-xs w-full">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium text-[11px] hidden sm:inline">Theme:</span>
            <div className="inline-flex p-0.5 bg-slate-800/90 rounded-lg border border-slate-700/80">
              <button
                id="btn-theme-staunton"
                type="button"
                onClick={() => handleThemeChange('classic')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all flex items-center gap-1 ${
                  currentTheme === 'classic'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Classic Staunton Pieces (Zip Set)"
              >
                <span>Staunton</span>
              </button>
              <button
                id="btn-theme-indian"
                type="button"
                onClick={() => handleThemeChange('indian')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all flex items-center gap-1 ${
                  currentTheme === 'indian'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Ancient Indian Theme (Cultural motifs)"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Ancient Indian</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsLoreModalOpen(true)}
            className="px-2.5 py-1 text-[11px] font-medium text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Chaturanga Lore</span>
          </button>
        </div>
      )}

      <div id="chess-board-container" className="flex items-stretch gap-1.5 sm:gap-2.5 select-none w-full justify-center">
        {/* Visual Evaluation Bar */}
        <div 
          id="evaluation-bar" 
          className="w-3.5 sm:w-4.5 bg-slate-800 rounded-md sm:rounded-lg overflow-hidden flex flex-col justify-between items-center shadow-inner relative border border-slate-700/60 shrink-0"
          title={`Engine Evaluation: ${evalDisplay}`}
        >
          <div 
            className="w-full bg-slate-900 transition-all duration-300"
            style={{ height: `${100 - (isFlipped ? 100 - whitePercent : whitePercent)}%` }}
          />
          <div 
            className="w-full bg-slate-100 transition-all duration-300"
            style={{ height: `${isFlipped ? 100 - whitePercent : whitePercent}%` }}
          />
          <span className="absolute inset-x-0 bottom-1 text-[8px] sm:text-[9px] font-semibold text-center text-slate-700 mix-blend-difference pointer-events-none">
            {evalDisplay}
          </span>
        </div>

        {/* Main Board Grid */}
        <div 
          id="chess-grid"
          className={`relative aspect-square w-full rounded-lg sm:rounded-xl overflow-hidden shadow-2xl border-2 sm:border-4 ${
            currentTheme === 'indian'
              ? 'border-slate-700/80 bg-[#5c626d]'
              : 'border-amber-950/20 bg-amber-900/10'
          }`}
        >
          <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
            {displayRanks.map((rankStr, rankIndex) =>
              displayFiles.map((fileStr, fileIndex) => {
                const square = `${fileStr}${rankStr}` as Square;
                const isLight = (fileIndex + rankIndex) % 2 === 0;

                const colIndex = fileStr.charCodeAt(0) - 97;
                const rowIndex = 8 - parseInt(rankStr, 10);
                const piece = board[rowIndex][colIndex];

                const isSelected = selectedSquare === square;
                const isLastMoveFrom = lastMove?.from === square;
                const isLastMoveTo = lastMove?.to === square;
                const isLegalTarget = legalMoves.some((m) => m.to === square);
                const isCaptureTarget = isLegalTarget && Boolean(piece);
                const isKingCheck = kingInCheckSquare === square;
                const isHighlighted = highlightSquares.includes(square);
                const canDrag = isInteractive && Boolean(piece && piece.color === turn);

                return (
                  <BoardSquare
                    key={square}
                    square={square}
                    rankStr={rankStr}
                    fileStr={fileStr}
                    fileIndex={fileIndex}
                    rankIndex={rankIndex}
                    isLight={isLight}
                    piece={piece}
                    isSelected={isSelected}
                    isLastMoveFrom={isLastMoveFrom}
                    isLastMoveTo={isLastMoveTo}
                    isLegalTarget={isLegalTarget}
                    isCaptureTarget={isCaptureTarget}
                    isKingCheck={isKingCheck}
                    isHighlighted={isHighlighted}
                    classification={lastMove?.classification}
                    currentTheme={currentTheme}
                    isInteractive={isInteractive}
                    canDrag={canDrag}
                    onClick={handleSquareClick}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Ancient Indian Chaturanga Piece Lore Modal */}
      <ChaturangaModal
        isOpen={isLoreModalOpen}
        onClose={() => setIsLoreModalOpen(false)}
      />
    </div>
  );
};
