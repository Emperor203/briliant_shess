import React, { useEffect, useRef } from 'react';
import type { MoveAnalysis } from '../types/chess';
import { MOVE_BADGES } from '../constants/chessData';
import { ChevronLeft, ChevronRight, X, RotateCcw } from 'lucide-react';

interface CoachReviewBarProps {
  history: MoveAnalysis[];
  currentStepIndex: number;
  onJumpToStep: (index: number) => void;
  onExitReview: () => void;
  materialDiff: number; // Positive = White advantage, Negative = Black
}

// Coach Owl Mascot Vector SVG
export const CoachOwlSvg: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none">
    {/* Body */}
    <circle cx="32" cy="34" r="24" fill="#059669" />
    <ellipse cx="32" cy="40" rx="14" ry="16" fill="#10b981" />
    {/* Ears */}
    <polygon points="16,14 26,20 18,28" fill="#047857" />
    <polygon points="48,14 38,20 46,28" fill="#047857" />
    {/* Glasses frames */}
    <circle cx="23" cy="30" r="10" stroke="#f59e0b" strokeWidth="2.5" fill="#ffffff" />
    <circle cx="41" cy="30" r="10" stroke="#f59e0b" strokeWidth="2.5" fill="#ffffff" />
    <line x1="33" y1="30" x2="31" y2="30" stroke="#f59e0b" strokeWidth="2.5" />
    {/* Eyes */}
    <circle cx="23" cy="30" r="4.5" fill="#0f172a" />
    <circle cx="41" cy="30" r="4.5" fill="#0f172a" />
    {/* Eye sparkles */}
    <circle cx="21.5" cy="28.5" r="1.5" fill="#ffffff" />
    <circle cx="39.5" cy="28.5" r="1.5" fill="#ffffff" />
    {/* Beak */}
    <polygon points="29,35 35,35 32,41" fill="#f59e0b" />
    {/* Graduation / Professor Cap tassel */}
    <polygon points="32,6 48,12 32,18 16,12" fill="#1e293b" />
    <polygon points="48,12 51,20 49,20 47,12" fill="#eab308" />
  </svg>
);

export const CoachReviewBar: React.FC<CoachReviewBarProps> = ({
  history,
  currentStepIndex,
  onJumpToStep,
  onExitReview,
}) => {
  const activeMove: MoveAnalysis | undefined =
    currentStepIndex >= 0 && currentStepIndex < history.length
      ? history[currentStepIndex]
      : undefined;

  // Determine Coach Speech text
  const getCoachSpeech = () => {
    if (currentStepIndex < 0 || !activeMove) {
      return 'Каждая партия чему-то учит. Посмотрим, что произошло.';
    }

    // Opening book moves
    if (currentStepIndex <= 3 || activeMove.quality === 'book') {
      return '📖 Начало партии по дебютной книге.';
    }

    switch (activeMove.quality) {
      case 'brilliant':
        return '💎 Фантастический ход! Жертва материала ради решающего перевеса.';
      case 'best':
        return '⭐️ Идеальный ход по первой линии движка.';
      case 'excellent':
      case 'good':
        return '👍 Сильное и надежное решение.';
      case 'inaccuracy':
        return '❓ Не самый точный ход, позиция немного усложнилась.';
      case 'mistake':
      case 'blunder': {
        const recommendation = activeMove.bestMove
          ? `пойти ${activeMove.bestMove}`
          : 'найти более надежное продолжение';
        return `⚠️ Опасный зевок фигуры! Лучше было ${recommendation}.`;
      }
      default:
        return '⭐️ Идеальный ход по первой линии движка.';
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onJumpToStep(Math.max(-1, currentStepIndex - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onJumpToStep(Math.min(history.length - 1, currentStepIndex + 1));
      } else if (e.key === 'Escape') {
        onExitReview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStepIndex, history.length, onJumpToStep, onExitReview]);

  return (
    <div className="w-full flex flex-col gap-3">
      {/* 1. TOP: Coach Owl Speech Card */}
      <div className="relative flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md">
        {/* Coach Owl Mascot */}
        <div className="relative shrink-0 flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-1 shadow-lg shadow-emerald-950/40">
          <CoachOwlSvg className="h-full w-full drop-shadow-md" />
        </div>

        {/* White Speech Bubble */}
        <div className="relative flex-1 rounded-2xl bg-white px-4 py-3 text-slate-900 shadow-md border border-slate-200">
          {/* Bubble pointer tail */}
          <div className="absolute top-4 -left-2 h-3.5 w-3.5 rotate-45 bg-white border-l border-b border-slate-200" />

          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">
              Тренер Сова
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {currentStepIndex >= 0
                ? `Ход ${Math.floor(currentStepIndex / 2) + 1} из ${Math.max(1, Math.ceil(history.length / 2))}`
                : 'Начало партии'}
            </span>
          </div>

          <p className="text-xs sm:text-sm font-semibold leading-snug text-slate-800">
            {getCoachSpeech()}
          </p>
        </div>

        {/* Exit Review Button */}
        <button
          onClick={onExitReview}
          className="shrink-0 flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:bg-red-950/40 hover:border-red-500/50 hover:text-red-300 transition cursor-pointer"
          title="Завершить разбор и вернуться к игре (Esc)"
        >
          <X className="h-4 w-4" />
          <span className="hidden sm:inline">Выйти</span>
        </button>
      </div>
    </div>
  );
};

// Bottom controls component (rendered directly beneath the chessboard)
interface CoachReviewControlsProps {
  history: MoveAnalysis[];
  currentStepIndex: number;
  onJumpToStep: (index: number) => void;
  materialDiff: number;
}

export const CoachReviewControls: React.FC<CoachReviewControlsProps> = ({
  history,
  currentStepIndex,
  onJumpToStep,
  materialDiff,
}) => {
  const ribbonRef = useRef<HTMLDivElement>(null);
  const activeChipRef = useRef<HTMLButtonElement | null>(null);

  const canGoPrev = currentStepIndex > -1;
  const canGoNext = currentStepIndex < history.length - 1;

  // Auto-scroll active move in horizontal ribbon
  useEffect(() => {
    if (activeChipRef.current) {
      activeChipRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    } else if (ribbonRef.current && currentStepIndex < 0) {
      ribbonRef.current.scrollLeft = 0;
    }
  }, [currentStepIndex]);

  // Format material badge string
  const formatMaterial = () => {
    if (materialDiff === 0) return 'Материал =';
    if (materialDiff > 0) return `+${materialDiff} Белые`;
    return `+${Math.abs(materialDiff)} Черные`;
  };

  return (
    <div className="w-full flex flex-col gap-2.5 mt-2.5">
      {/* Material Balance Pill */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/90 px-3.5 py-1 text-xs font-bold text-slate-200 shadow-md">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>{formatMaterial()}</span>
        </div>
      </div>

      {/* Horizontal Scrollable Move Ribbon (1. 📖 d4  📖 Nf6  2. ⭐️ e4 ...) */}
      <div
        ref={ribbonRef}
        className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 rounded-xl border border-slate-800 bg-slate-900/80 shadow-inner scroll-smooth no-scrollbar"
        style={{ scrollbarWidth: 'none' }}
      >
        {/* Start Position Chip */}
        <button
          onClick={() => onJumpToStep(-1)}
          className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-mono font-bold transition cursor-pointer ${
            currentStepIndex === -1
              ? 'bg-blue-600 text-white ring-2 ring-blue-400 shadow-md'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          Начало
        </button>

        {history.map((move, idx) => {
          const isActive = currentStepIndex === idx;
          const turnNumber = Math.floor(idx / 2) + 1;
          const isWhite = move.color === 'w';

          // Use book badge for early moves if classified as best/good
          const effectiveQuality =
            idx <= 3 && (move.quality === 'best' || move.quality === 'good' || move.quality === 'excellent')
              ? 'book'
              : move.quality;

          const badge = MOVE_BADGES[effectiveQuality] || MOVE_BADGES.best;

          return (
            <React.Fragment key={idx}>
              {/* Turn prefix before white move */}
              {isWhite && (
                <span className="text-xs font-semibold text-slate-500 ml-1">
                  {turnNumber}.
                </span>
              )}

              <button
                ref={isActive ? activeChipRef : null}
                onClick={() => onJumpToStep(idx)}
                className={`shrink-0 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-mono transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-300 shadow-lg scale-105'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                }`}
              >
                <span className="text-[11px]">{badge.icon}</span>
                <span className="font-semibold">{move.san}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Bottom Navigation Buttons: ‹ Назад (gray) and Далее › (big bright blue) */}
      <div className="flex items-center gap-3 pt-1">
        {/* ‹ Назад Button */}
        <button
          onClick={() => onJumpToStep(Math.max(-1, currentStepIndex - 1))}
          disabled={!canGoPrev}
          className="flex items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-bold text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer shadow-md min-w-[110px]"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Назад</span>
        </button>

        {/* Далее › Button (Big bright blue) */}
        {canGoNext ? (
          <button
            onClick={() => onJumpToStep(Math.min(history.length - 1, currentStepIndex + 1))}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] px-6 py-3 text-sm font-bold text-white shadow-xl shadow-blue-900/50 transition cursor-pointer"
          >
            <span>Далее</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => onJumpToStep(-1)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-emerald-950/40 transition cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>В начало разбора</span>
          </button>
        )}
      </div>
    </div>
  );
};
