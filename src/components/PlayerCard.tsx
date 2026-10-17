import React from 'react';
import { Bot, User, Clock } from 'lucide-react';
import { PieceSvg } from './Chess2D/PieceSvg';
import type { PieceStyleId } from '../types/chess';

interface PlayerCardProps {
  name: string;
  rating?: number;
  isBot: boolean;
  color: 'w' | 'b';
  pieceStyle: PieceStyleId;
  timeRemaining?: number; // seconds, undefined if unlimited
  isActive: boolean;
  capturedPieces: string[]; // piece letters e.g. ['p', 'p', 'n']
  materialDifference?: number;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  rating,
  isBot,
  color,
  pieceStyle,
  timeRemaining,
  isActive,
  capturedPieces,
  materialDifference = 0,
}) => {
  // Format seconds to mm:ss
  const formatTime = (secs?: number) => {
    if (secs === undefined || secs === null || secs <= 0 && secs !== 0) return '∞';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeRemaining !== undefined && timeRemaining <= 20 && timeRemaining > 0;

  return (
    <div
      className={`flex items-center justify-between rounded-xl border py-1 sm:py-1.5 px-2 sm:px-3 transition-all duration-200 ${
        isActive
          ? 'border-cyan-500/60 bg-slate-800/95 shadow-lg shadow-cyan-950/40 ring-2 ring-cyan-500/30'
          : 'border-slate-700/80 bg-slate-800/85 text-slate-300'
      }`}
    >
      {/* Player identity */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 mr-2">
        <div
          className={`relative flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg border shadow-inner ${
            isBot
              ? 'border-cyan-500/40 bg-cyan-950/60 text-cyan-400'
              : 'border-emerald-500/40 bg-emerald-950/60 text-emerald-400'
          }`}
        >
          {isBot ? <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          {/* Color marker tag */}
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border border-slate-700 shadow-sm ${
              color === 'w' ? 'bg-white' : 'bg-slate-900 ring-1 ring-white/50'
            }`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs sm:text-sm text-slate-100 truncate">{name}</span>
            {rating && (
              <span className="shrink-0 rounded bg-slate-700/80 border border-slate-600/50 px-1 sm:px-1.5 py-0.2 sm:py-0.5 text-[10px] sm:text-[11px] font-mono text-slate-300">
                {rating}
              </span>
            )}
          </div>

          {/* Captured pieces tray */}
          <div className="mt-0.5 flex items-center gap-1 min-h-[18px] sm:min-h-[22px]">
            {capturedPieces.length > 0 ? (
              <div className="flex items-center gap-0.5 rounded-lg bg-slate-900/90 border border-slate-700/80 px-1.5 sm:px-2 py-0.5 shadow-inner max-w-[125px] sm:max-w-none overflow-x-auto no-scrollbar">
                {capturedPieces.map((p, idx) => (
                  <div key={idx} className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 drop-shadow-sm hover:scale-125 transition-transform shrink-0">
                    <PieceSvg type={p} color={color === 'w' ? 'b' : 'w'} styleId={pieceStyle} />
                  </div>
                ))}
                {materialDifference > 0 && (
                  <span className="ml-1 text-[10px] sm:text-[11px] font-bold text-amber-400 shrink-0">+{materialDifference}</span>
                )}
              </div>
            ) : (
              <span className="hidden sm:inline text-[11px] text-slate-400/80 font-medium italic">Нет взятых фигур</span>
            )}
          </div>
        </div>
      </div>

      {/* Clock display */}
      {timeRemaining !== undefined && (
        <div
          className={`flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-2.5 py-1 font-mono text-xs sm:text-sm font-bold shrink-0 transition-colors ${
            isLowTime
              ? 'animate-pulse bg-red-950/80 text-red-400 border border-red-800'
              : isActive
              ? 'bg-slate-800 text-slate-100 border border-slate-700'
              : 'bg-slate-900/60 text-slate-400 border border-transparent'
          }`}
        >
          <Clock className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${isLowTime ? 'text-red-400' : 'text-slate-400'}`} />
          <span>{formatTime(timeRemaining)}</span>
        </div>
      )}
    </div>
  );
};
