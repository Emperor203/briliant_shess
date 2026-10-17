import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { MoveAnalysis } from '../types/chess';
import { MOVE_BADGES } from '../constants/chessData';
import { Trophy, RefreshCw, Flag, Award } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  winner: 'w' | 'b' | 'draw' | null;
  reason: string;
  playerColor: 'w' | 'b';
  history: MoveAnalysis[];
  onRestart: () => void;
  onOpenReview: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  onClose,
  winner,
  reason,
  playerColor,
  history,
  onRestart,
  onOpenReview,
}) => {
  const isPlayerWinner = winner === playerColor;
  const isDraw = winner === 'draw';

  useEffect(() => {
    if (isOpen && isPlayerWinner) {
      // Fire confetti
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen, isPlayerWinner]);

  if (!isOpen) return null;

  // Calculate move quality stats for player
  const playerMoves = history.filter((m) => m.color === playerColor);
  const counts: Record<string, number> = {
    brilliant: 0,
    best: 0,
    excellent: 0,
    good: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
  };
  playerMoves.forEach((m) => {
    if (counts[m.quality] !== undefined) {
      counts[m.quality]++;
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-100 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Trophy icon */}
        <div
          className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border shadow-lg ${
            isPlayerWinner
              ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
              : isDraw
              ? 'border-slate-600 bg-slate-800 text-slate-300'
              : 'border-red-500/50 bg-red-500/10 text-red-400'
          }`}
        >
          {isPlayerWinner ? <Trophy className="h-8 w-8" /> : isDraw ? <Award className="h-8 w-8" /> : <Flag className="h-8 w-8" />}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black tracking-tight">
          {isPlayerWinner
            ? 'Великолепная победа!'
            : isDraw
            ? 'Ничейный результат'
            : 'Поражение'}
        </h2>
        <p className="mt-1 text-sm text-slate-400 font-medium">{reason}</p>

        {/* Move Quality Breakdown */}
        {playerMoves.length > 0 && (
          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Анализ вашей точности
            </h4>
            <div className="grid grid-cols-4 gap-2 text-center">
              {(
                [
                  { key: 'brilliant', badge: MOVE_BADGES.brilliant },
                  { key: 'best', badge: MOVE_BADGES.best },
                  { key: 'excellent', badge: MOVE_BADGES.excellent },
                  { key: 'blunder', badge: MOVE_BADGES.blunder },
                ] as const
              ).map(({ key, badge }) => (
                <div key={key} className="rounded-lg bg-slate-900/80 p-1.5 border border-slate-800">
                  <div className="text-base">{badge.icon}</div>
                  <div className="text-sm font-bold text-slate-200">{counts[key]}</div>
                  <div className="text-[10px] text-slate-400 truncate">{badge.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              onClose();
              onOpenReview();
            }}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
          >
            Разбор партии
          </button>
          <button
            onClick={() => {
              onClose();
              onRestart();
            }}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-cyan-600 py-2.5 text-xs font-bold text-white hover:bg-cyan-500 shadow-lg shadow-cyan-900/40 transition cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Новая партия</span>
          </button>
        </div>
      </div>
    </div>
  );
};
