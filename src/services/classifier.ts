import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import type { MoveQuality } from '../types/chess';
import { PIECE_VALUES } from '../constants/chessData';

export function classifyMove(
  chessBefore: Chess,
  moveDetails: {
    from: Square;
    to: Square;
    piece: string;
    captured?: string;
    san: string;
    promotion?: string;
  },
  evalBefore: number, // from moving player perspective (centipawns)
  evalAfter: number, // from moving player perspective (centipawns)
  topEngineMove?: string
): { quality: MoveQuality; explanation: string } {
  const uciMove = moveDetails.from + moveDetails.to + (moveDetails.promotion || '');
  const isTopMove = topEngineMove && topEngineMove.toLowerCase().startsWith(uciMove.toLowerCase());
  
  // evalDrop: how much advantage the player lost by making this move (higher is worse)
  // evalBefore and evalAfter are both normalized to the moving player's perspective
  const evalDrop = evalBefore - evalAfter;

  // 1. Check for Brilliant Move (💎)
  // A sacrifice of material (Knight, Bishop, Rook, Queen) where eval remains clearly winning or very strong (> +120 cp)
  const pieceVal = PIECE_VALUES[moveDetails.piece.toLowerCase()] || 0;
  const capturedVal = moveDetails.captured ? (PIECE_VALUES[moveDetails.captured.toLowerCase()] || 0) : 0;
  const isSacrifice = pieceVal >= 300 && pieceVal > capturedVal + 150;

  // Check if target square is attacked by opponent
  const testChess = new Chess(chessBefore.fen());
  const opponentColor = chessBefore.turn() === 'w' ? 'b' : 'w';
  const isTargetAttacked = testChess.isAttacked(moveDetails.to, opponentColor);

  if ((isSacrifice || (isTargetAttacked && pieceVal >= 300)) && evalAfter >= 150 && evalDrop <= 30) {
    return {
      quality: 'brilliant',
      explanation: 'Жертва материала с сохранением решающего перевеса!',
    };
  }

  // 2. Best Move (⭐️)
  if (isTopMove || evalDrop <= 12) {
    return {
      quality: 'best',
      explanation: 'Лучший ход по первой линии движка.',
    };
  }

  // 3. Excellent (👍)
  if (evalDrop <= 35) {
    return {
      quality: 'excellent',
      explanation: 'Очень сильный и точный ход.',
    };
  }

  // 4. Good (👌)
  if (evalDrop <= 70) {
    return {
      quality: 'good',
      explanation: 'Хороший ход, удерживающий позицию.',
    };
  }

  // 5. Inaccuracy (❓)
  if (evalDrop <= 150) {
    return {
      quality: 'inaccuracy',
      explanation: 'Неточность: упущена часть позиционного преимущества.',
    };
  }

  // 6. Mistake (⚠️)
  if (evalDrop <= 280) {
    return {
      quality: 'mistake',
      explanation: 'Ошибка: существенное ухудшение позиции.',
    };
  }

  // 7. Blunder (❌)
  return {
    quality: 'blunder',
    explanation: 'Грубый зевок: потеря материала или упущенная победа.',
  };
}
