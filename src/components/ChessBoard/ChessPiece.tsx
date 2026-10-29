import React from 'react';
import { PieceSymbol, Color } from 'chess.js';
import { IndianChessPiece } from './IndianChessPiece';
import { StauntonChessPiece } from './StauntonChessPiece';

export type ChessPieceTheme = 'indian' | 'classic';

interface ChessPieceProps {
  type: PieceSymbol;
  color: Color;
  className?: string;
  theme?: ChessPieceTheme;
}

export const ChessPiece: React.FC<ChessPieceProps> = React.memo(({ 
  type, 
  color, 
  className = 'w-full h-full',
  theme = 'classic' 
}) => {
  if (theme === 'indian') {
    return <IndianChessPiece type={type} color={color} className={className} />;
  }

  // Classic / Staunton theme using the pieces from the attached zip archive
  return <StauntonChessPiece type={type} color={color} className={className} />;
});

