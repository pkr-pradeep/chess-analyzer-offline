import React from 'react';
import { PieceSymbol, Color } from 'chess.js';
import { ZipChessPiece } from './ZipChessPieces';

export interface StauntonChessPieceProps {
  type: PieceSymbol;
  color: Color;
  className?: string;
  variant?: 1 | 2;
}

/**
 * Staunton Chess Piece component displaying the exact vector piece icons
 * from the attached chess_pieces zip archive.
 * Rendered as pure inline vector SVG React components for zero-latency,
 * flicker-free, 60fps buttery smooth gameplay identical to lichess & chess.com.
 */
export const StauntonChessPiece: React.FC<StauntonChessPieceProps> = React.memo(({
  type,
  color,
  className = 'w-full h-full',
}) => {
  return <ZipChessPiece type={type} color={color} className={className} />;
});
