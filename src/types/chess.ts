import type { Square, PieceSymbol, Color } from 'chess.js';

export type MoveQuality = 'brilliant' | 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | 'book';

export interface MoveAnalysis {
  san: string;
  from: Square;
  to: Square;
  piece: PieceSymbol;
  color: Color;
  captured?: PieceSymbol;
  promotion?: string;
  fenBefore: string;
  fenAfter: string;
  evalBefore: number; // centipawns from current player perspective
  evalAfter: number;
  bestMove?: string;
  quality: MoveQuality;
  explanation?: string;
}

export interface BoardArrow {
  from: Square;
  to: Square;
  color: string;
  label?: string;
}

export interface PlayerAccuracyStats {
  accuracy: number; // percentage 0-100
  performanceRating: number;
  book?: number;
  brilliant: number;
  best: number;
  excellent: number;
  good: number;
  inaccuracy: number;
  mistake: number;
  blunder: number;
  totalMoves: number;
}

export interface GameReviewReport {
  white: PlayerAccuracyStats;
  black: PlayerAccuracyStats;
  evalTimeline: {
    ply: number;
    moveNumber: number;
    turn: Color;
    scoreCp: number; // From White perspective
    san: string;
    quality: MoveQuality;
  }[];
}

export type BoardThemeId = 'classic' | 'wood' | 'neon' | 'marble' | 'minimal';
export type PieceStyleId = 'staunton' | 'neo' | 'pixel' | 'wood';

export interface BoardTheme {
  id: BoardThemeId;
  name: string;
  lightSquare: string;
  darkSquare: string;
  lightSquare3D: number;
  darkSquare3D: number;
  boardBorder: string;
  accent: string;
  background: string;
}

export interface BotDifficulty {
  level: number;
  name: string;
  depth: number;
  skillLevel: number; // 0-20
  blunderProb: number; // 0-1
  description: string;
  rating: number;
}

export interface TimeControlConfig {
  id: string;
  name: string;
  initialSeconds: number; // 0 for unlimited
  incrementSeconds: number;
}

export type PlayerSide = 'w' | 'b' | 'random';

export interface GameSettings {
  boardTheme: BoardThemeId;
  pieceStyle: PieceStyleId;
  botLevel: number;
  playerColor: PlayerSide;
  timeControl: string;
  soundEnabled: boolean;
  showHints: boolean;
  showEvalBar: boolean;
  showArrows: boolean;
  showPet: boolean;
  showChessRain: boolean;
  viewMode: '2d' | '3d';
}
