import React, { useMemo, useState } from 'react';
import type { MoveAnalysis, BoardArrow } from '../types/chess';
import { generateGameReview, uciToArrow } from '../services/reviewService';
import { MOVE_BADGES } from '../constants/chessData';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertTriangle,
  Lightbulb,
  Award,
  Zap,
} from 'lucide-react';

interface GameReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: MoveAnalysis[];
  botRating?: number;
  currentStepIndex: number;
  onJumpToStep: (index: number) => void;
  onShowBestMoveArrow: (arrow: BoardArrow | null) => void;
}

export const GameReviewModal: React.FC<GameReviewModalProps> = ({
  isOpen,
  onClose,
  history,
  botRating = 1500,
  currentStepIndex,
  onJumpToStep,
  onShowBestMoveArrow,
}) => {
  const [showBestArrow, setShowBestArrow] = useState<boolean>(true);

  // Generate complete review statistics
  const review = useMemo(() => {
    return generateGameReview(history, botRating);
  }, [history, botRating]);

  // Current active move in review
  const activeMove: MoveAnalysis | undefined =
    currentStepIndex >= 0 && currentStepIndex < history.length
      ? history[currentStepIndex]
      : history[history.length - 1];

  const activeIndex =
    currentStepIndex >= 0 && currentStepIndex < history.length
      ? currentStepIndex
      : history.length - 1;

  // Handle best move arrow display whenever step changes or toggle changes
  React.useEffect(() => {
    if (!isOpen) {
      onShowBestMoveArrow(null);
      return;
    }

    if (showBestArrow && activeMove && activeMove.bestMove) {
      const isGood =
        activeMove.quality === 'brilliant' ||
        activeMove.quality === 'best' ||
        activeMove.quality === 'excellent';
      const arrow = uciToArrow(
        activeMove.bestMove,
        isGood ? '#22c55e' : '#38bdf8',
        'Лучший ход'
      );
      onShowBestMoveArrow(arrow);
    } else {
      onShowBestMoveArrow(null);
    }
  }, [isOpen, showBestArrow, activeIndex, activeMove, onShowBestMoveArrow]);

  if (!isOpen) return null;

  // Jump helpers
  const handlePrev = () => {
    if (activeIndex > 0) {
      onJumpToStep(activeIndex - 1);
    }
  };

  const handleNext = () => {
    if (activeIndex < history.length - 1) {
      onJumpToStep(activeIndex + 1);
    }
  };

  const handleNextBlunder = () => {
    for (let i = activeIndex + 1; i < history.length; i++) {
      const q = history[i].quality;
      if (q === 'blunder' || q === 'mistake' || q === 'inaccuracy') {
        onJumpToStep(i);
        return;
      }
    }
    // Loop around if not found
    for (let i = 0; i <= activeIndex; i++) {
      const q = history[i].quality;
      if (q === 'blunder' || q === 'mistake' || q === 'inaccuracy') {
        onJumpToStep(i);
        return;
      }
    }
  };

  // SVG Evaluation Graph Dimensions & points
  const graphWidth = 560;
  const graphHeight = 110;
  const paddingX = 20;
  const paddingY = 10;
  const effectiveW = graphWidth - paddingX * 2;
  const effectiveH = graphHeight - paddingY * 2;
  const midY = paddingY + effectiveH / 2;

  // Map cp score to Y coordinate (clamp score -800 to +800 cp)
  const scoreToY = (cp: number) => {
    const clamped = Math.max(-800, Math.min(800, cp));
    // cp > 0 means White advantage -> moves upwards (lower Y)
    return midY - (clamped / 800) * (effectiveH / 2);
  };

  const timeline = review.evalTimeline;
  const count = Math.max(1, timeline.length - 1);

  const points = timeline.map((pt, idx) => {
    const x = paddingX + (idx / count) * effectiveW;
    const y = scoreToY(pt.scoreCp);
    return { x, y, pt, idx };
  });

  const svgPathD =
    points.length > 0
      ? `M ${points[0].x} ${points[0].y} ` +
        points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')
      : '';

  // Filled area under the curve
  const areaD =
    points.length > 0
      ? `${svgPathD} L ${points[points.length - 1].x} ${midY} L ${points[0].x} ${midY} Z`
      : '';

  const getAccuracyColor = (acc: number) => {
    if (acc >= 90) return 'text-emerald-400';
    if (acc >= 80) return 'text-cyan-400';
    if (acc >= 70) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const categories = [
    { key: 'brilliant', label: 'Бриллиантовые', icon: '💎', color: 'text-cyan-400' },
    { key: 'best', label: 'Лучшие ходы', icon: '⭐️', color: 'text-emerald-400' },
    { key: 'excellent', label: 'Отличные', icon: '👍', color: 'text-lime-400' },
    { key: 'good', label: 'Хорошие', icon: '👌', color: 'text-blue-400' },
    { key: 'inaccuracy', label: 'Неточности', icon: '❓', color: 'text-yellow-400' },
    { key: 'mistake', label: 'Ошибки', icon: '⚠️', color: 'text-orange-400' },
    { key: 'blunder', label: 'Зевки', icon: '❌', color: 'text-red-400' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-600 to-amber-400 text-white shadow-md">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                Анализ партии • Stockfish
              </h2>
              <p className="text-[11px] text-slate-400">
                Точность ходов, оценка преимуществ и разбор ключевых моментов
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onShowBestMoveArrow(null);
              onClose();
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Accuracy & Performance Rating Comparison */}
          <div className="grid grid-cols-2 gap-3">
            {/* White Stats */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 shadow-sm text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-300">
                <span className="h-3 w-3 rounded-full bg-slate-100 border border-slate-400 shadow-sm inline-block" />
                <span>Белые</span>
              </div>
              <div className={`mt-1 text-2xl sm:text-3xl font-black ${getAccuracyColor(review.white.accuracy)}`}>
                {review.white.accuracy}%
              </div>
              <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                Рейтинг: <span className="text-slate-200 font-bold">{review.white.performanceRating}</span>
              </div>
            </div>

            {/* Black Stats */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 shadow-sm text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-300">
                <span className="h-3 w-3 rounded-full bg-slate-900 border border-slate-600 shadow-sm inline-block" />
                <span>Черные</span>
              </div>
              <div className={`mt-1 text-2xl sm:text-3xl font-black ${getAccuracyColor(review.black.accuracy)}`}>
                {review.black.accuracy}%
              </div>
              <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                Рейтинг: <span className="text-slate-200 font-bold">{review.black.performanceRating}</span>
              </div>
            </div>
          </div>

          {/* Evaluation Advantage Graph */}
          {timeline.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 shadow-inner">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1 px-1">
                <span className="text-slate-200">График преимущества (Белые ▲ / Черные ▼)</span>
                <span className="text-xs text-cyan-400 font-mono">
                  {activeMove ? (activeMove.evalAfter >= 0 ? `+${(activeMove.evalAfter / 100).toFixed(1)}` : `${(activeMove.evalAfter / 100).toFixed(1)}`) : '0.0'}
                </span>
              </div>
              <div className="relative w-full overflow-hidden rounded-lg bg-slate-900/60 border border-slate-800/80">
                <svg
                  viewBox={`0 0 ${graphWidth} ${graphHeight}`}
                  className="w-full h-24 sm:h-28 overflow-visible"
                >
                  {/* Zero reference line */}
                  <line
                    x1={paddingX}
                    y1={midY}
                    x2={graphWidth - paddingX}
                    y2={midY}
                    stroke="#475569"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />

                  {/* Shaded Area */}
                  {areaD && (
                    <path
                      d={areaD}
                      fill="url(#eval-gradient)"
                      opacity="0.35"
                    />
                  )}

                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="eval-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="50%" stopColor="#64748b" />
                      <stop offset="100%" stopColor="#f43f5e" />
                    </linearGradient>
                  </defs>

                  {/* Main Line */}
                  {svgPathD && (
                    <path
                      d={svgPathD}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Move points & Active move indicator */}
                  {points.map((p) => {
                    const isActive = p.idx === activeIndex;
                    const isMistake =
                      p.pt.quality === 'mistake' || p.pt.quality === 'blunder';

                    return (
                      <g key={p.idx} onClick={() => onJumpToStep(p.idx)} className="cursor-pointer">
                        {isActive && (
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="6"
                            fill="#f59e0b"
                            className="animate-ping opacity-75"
                          />
                        )}
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={isActive ? 5 : isMistake ? 3.5 : 2}
                          fill={isActive ? '#fbbf24' : isMistake ? '#ef4444' : '#94a3b8'}
                          stroke={isActive ? '#ffffff' : 'none'}
                          strokeWidth="1.5"
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}

          {/* Move Classification Matrix (White vs Black) */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Классификация ходов
            </h4>
            <div className="space-y-1.5">
              {categories.map((cat) => {
                const whiteCount = review.white[cat.key];
                const blackCount = review.black[cat.key];
                return (
                  <div
                    key={cat.key}
                    className="flex items-center justify-between rounded-lg bg-slate-900/60 px-3 py-1.5 text-xs font-medium border border-slate-800/60"
                  >
                    <div className="w-10 text-left font-bold text-slate-200">
                      {whiteCount}
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span className={`font-semibold ${cat.color}`}>{cat.label}</span>
                    </div>
                    <div className="w-10 text-right font-bold text-slate-200">
                      {blackCount}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step-by-Step Coach Review Box */}
          {activeMove ? (
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300">
                    {Math.floor(activeIndex / 2) + 1}
                  </span>
                  <span className="font-mono text-base font-bold text-slate-100">
                    {activeMove.color === 'w' ? 'Белые:' : 'Черные:'} {activeMove.san}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold border ${
                      MOVE_BADGES[activeMove.quality].bg
                    } ${MOVE_BADGES[activeMove.quality].border}`}
                  >
                    <span>{MOVE_BADGES[activeMove.quality].icon}</span>
                    <span>{MOVE_BADGES[activeMove.quality].label}</span>
                  </span>
                </div>

                {/* Best move arrow toggle */}
                <button
                  onClick={() => setShowBestArrow(!showBestArrow)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer border ${
                    showBestArrow
                      ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
                      : 'border-slate-700 bg-slate-800 text-slate-400'
                  }`}
                  title="Показать стрелку лучшего хода на доске"
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Лучший ход</span>
                </button>
              </div>

              {/* Coach Explanation */}
              <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-2.5 text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                <Zap className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <p>
                    {activeMove.explanation ||
                      (activeMove.quality === 'best' || activeMove.quality === 'brilliant'
                        ? 'Отличный позиционный ход, укрепляющий инициативу.'
                        : 'Ход уступает сильнейшей линии движка.')}
                  </p>
                  {activeMove.bestMove && (
                    <p className="mt-1 text-emerald-400 font-semibold font-mono">
                      Рекомендация движка: {activeMove.bestMove}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-slate-500">
              Сделайте ходы в партии для появления анализа
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="border-t border-slate-800 bg-slate-950/70 p-3 sm:px-5 flex items-center justify-between gap-2">
          {/* Jump to first */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onJumpToStep(-1)}
              disabled={activeIndex <= -1}
              className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 disabled:opacity-30 transition cursor-pointer"
              title="В начало партии"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handlePrev}
              disabled={activeIndex <= 0}
              className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 disabled:opacity-30 transition cursor-pointer"
              title="Предыдущий ход"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Jump to next mistake */}
          <button
            onClick={handleNextBlunder}
            disabled={history.length === 0}
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-950/30 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-900/40 transition disabled:opacity-40 cursor-pointer"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <span>След. ошибка</span>
          </button>

          {/* Step forwards & jump to last */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleNext}
              disabled={activeIndex >= history.length - 1}
              className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 disabled:opacity-30 transition cursor-pointer"
              title="Следующий ход"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => onJumpToStep(history.length - 1)}
              disabled={activeIndex >= history.length - 1}
              className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 disabled:opacity-30 transition cursor-pointer"
              title="В конец партии"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
