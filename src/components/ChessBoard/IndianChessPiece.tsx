import React from 'react';
import { PieceSymbol, Color } from 'chess.js';
import { LotusChessPiece } from './LotusChessPieces';

export interface IndianChessPieceProps {
  type: PieceSymbol;
  color: Color;
  className?: string;
  variant?: 1 | 2;
}

/**
 * Ancient Indian Lotus Chess Piece Set
 * Directly replaced with the exact pieces from the user-provided lotus_chess_full_set zip archive.
 * Rendered as pure vector SVG React components for zero-latency, 60fps smooth rendering.
 */
export const IndianChessPiece: React.FC<IndianChessPieceProps> = React.memo(({
  type,
  color,
  className = 'w-full h-full',
}) => {
  return <LotusChessPiece type={type} color={color} className={className} />;
});
