import React, { useEffect, useRef, useState } from 'react';
import type { MoveAnalysis } from '../types/chess';
import { MOVE_BADGES } from '../constants/chessData';
import {
  ChevronFirst,
  ChevronLeft,
  ChevronRight,
  ChevronLast,
  Play,
  Pause,
  Eye,
  RotateCcw,
} from 'lucide-react';

interface MoveHistoryProps {
  history: MoveAnalysis[];
  currentStepIndex: number;
  onJumpToStep: (index: number) => void;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  history,
  currentStepIndex,
  onJumpToStep,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const activeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Group moves into pairs: [ { turn: 1, white: MoveAnalysis, black?: MoveAnalysis } ]
  const turns: {
    turn: number;
    white: MoveAnalysis;
    whiteIdx: number;
    black?: MoveAnalysis;
    blackIdx?: number;
  }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    turns.push({
      turn: Math.floor(i / 2) + 1,
      white: history[i],
      whiteIdx: i,
      black: history[i + 1],
      blackIdx: i + 1 < history.length ? i + 1 : undefined,
    });
  }

  // Active move data
  const activeMove =
    currentStepIndex >= 0 && currentStepIndex < history.length
      ? history[currentStepIndex]
      : undefined;

  const isBrowsingHistory =
    history.length > 0 && currentStepIndex < history.length - 1;

  // Autoplay replay loop
  useEffect(() => {
    let intervalId: any;
    if (isPlaying) {
      intervalId = setInterval(() => {
        if (currentStepIndex < history.length - 1) {
          onJumpToStep(currentStepIndex + 1);
        } else {
          setIsPlaying(false);
        }
      }, 900);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPlaying, currentStepIndex, history.length, onJumpToStep]);

  // Keyboard navigation (Left / Right arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIsPlaying(false);
        onJumpToStep(Math.max(-1, currentStepIndex - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setIsPlaying(false);
        onJumpToStep(Math.min(history.length - 1, currentStepIndex + 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setIsPlaying(false);
        onJumpToStep(-1);
      } else if (e.key === 'End') {
        e.preventDefault();
        setIsPlaying(false);
        onJumpToStep(history.length - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStepIndex, history.length, onJumpToStep]);

  // Scroll active move into view
  useEffect(() => {
    if (activeBtnRef.current) {
      activeBtnRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    } else if (scrollContainerRef.current && currentStepIndex === history.length - 1) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [currentStepIndex, history.length]);

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-4 py-2.5">
        <h3 className="font-bold text-slate-200 text-xs sm:text-sm flex items-center gap-2">
          <span>История ходов</span>
          <span className="rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300 font-mono">
            {history.length} {history.length === 1 ? 'ход' : 'ходов'}
          </span>
        </h3>

        {/* Live / Replay badge */}
        {isBrowsingHistory ? (
          <button
            onClick={() => onJumpToStep(history.length - 1)}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-500/50 px-2 py-0.5 text-[11px] font-bold text-amber-300 hover:bg-amber-500/30 transition cursor-pointer"
            title="Вернуться к последнему ходу"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Вернуться к игре</span>
          </button>
        ) : (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Прямой эфир</span>
          </div>
        )}
      </div>

      {/* Move list table */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-1.5 space-y-0.5 font-mono text-xs max-h-[140px] sm:max-h-[240px] select-none"
      >
        {turns.length === 0 ? (
          <div className="flex h-20 sm:h-32 flex-col items-center justify-center gap-1 text-xs text-slate-500 italic">
            <span>Сделайте ход на доске,</span>
            <span>чтобы появилась история</span>
          </div>
        ) : (
          turns.map((t) => {
            const isWhiteActive = currentStepIndex === t.whiteIdx;
            const isBlackActive =
              t.blackIdx !== undefined && currentStepIndex === t.blackIdx;

            return (
              <div
                key={t.turn}
                className="grid grid-cols-[34px_1fr_1fr] items-center gap-1.5 rounded-lg px-2 py-0.5 hover:bg-slate-800/40 transition-colors"
              >
                {/* Turn number */}
                <span className="text-xs text-slate-500 font-semibold">{t.turn}.</span>

                {/* White Move */}
                <button
                  ref={isWhiteActive ? activeBtnRef : null}
                  onClick={() => {
                    setIsPlaying(false);
                    onJumpToStep(t.whiteIdx);
                  }}
                  className={`flex items-center justify-between rounded-lg px-2 py-1 text-left transition cursor-pointer ${
                    isWhiteActive
                      ? 'bg-amber-500/25 text-amber-200 font-bold ring-2 ring-amber-400/80 shadow-md'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-semibold">{t.white.san}</span>
                  <span
                    className={`ml-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                      MOVE_BADGES[t.white.quality].bg
                    }`}
                    title={`${MOVE_BADGES[t.white.quality].label}: ${t.white.explanation || ''}`}
                  >
                    {MOVE_BADGES[t.white.quality].icon}
                  </span>
                </button>

                {/* Black Move */}
                {t.black ? (
                  <button
                    ref={isBlackActive ? activeBtnRef : null}
                    onClick={() => {
                      setIsPlaying(false);
                      if (t.blackIdx !== undefined) onJumpToStep(t.blackIdx);
                    }}
                    className={`flex items-center justify-between rounded-lg px-2 py-1 text-left transition cursor-pointer ${
                      isBlackActive
                        ? 'bg-amber-500/25 text-amber-200 font-bold ring-2 ring-amber-400/80 shadow-md'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="font-semibold">{t.black.san}</span>
                    <span
                      className={`ml-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                        MOVE_BADGES[t.black.quality].bg
                      }`}
                      title={`${MOVE_BADGES[t.black.quality].label}: ${t.black.explanation || ''}`}
                    >
                      {MOVE_BADGES[t.black.quality].icon}
                    </span>
                  </button>
                ) : (
                  <span />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Active Move Detail Banner */}
      {activeMove && (
        <div className="border-t border-slate-800 bg-slate-950/80 px-3 py-1.5 text-xs flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-bold text-slate-100">
              {Math.floor(currentStepIndex / 2) + 1}.{' '}
              {activeMove.color === 'w' ? 'Белые' : 'Черные'} ({activeMove.san})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                MOVE_BADGES[activeMove.quality].bg
              } ${MOVE_BADGES[activeMove.quality].border}`}
            >
              {MOVE_BADGES[activeMove.quality].label}
            </span>
            <span className="font-mono text-[11px] text-cyan-300">
              {activeMove.evalAfter >= 0
                ? `+${(activeMove.evalAfter / 100).toFixed(1)}`
                : `${(activeMove.evalAfter / 100).toFixed(1)}`}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Toolbar */}
      <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/90 p-2 gap-1">
        {/* Jump First */}
        <button
          onClick={() => {
            setIsPlaying(false);
            onJumpToStep(-1);
          }}
          disabled={currentStepIndex < 0}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
          title="В начало (Home)"
        >
          <ChevronFirst className="h-4 w-4" />
        </button>

        {/* Step Prev */}
        <button
          onClick={() => {
            setIsPlaying(false);
            onJumpToStep(Math.max(-1, currentStepIndex - 1));
          }}
          disabled={currentStepIndex < 0}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
          title="Назад (Стрелка влево ←)"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Play / Pause Replay */}
        <button
          onClick={() => {
            if (isPlaying) {
              setIsPlaying(false);
            } else {
              if (currentStepIndex >= history.length - 1) {
                onJumpToStep(-1);
              }
              setIsPlaying(true);
            }
          }}
          disabled={history.length === 0}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer border ${
            isPlaying
              ? 'border-amber-500 bg-amber-500/20 text-amber-300'
              : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
          } disabled:opacity-30`}
          title={isPlaying ? 'Пауза автовоспроизведения' : 'Воспроизвести партию ход за ходом'}
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          <span>{isPlaying ? 'Пауза' : 'Авто'}</span>
        </button>

        {/* Step Next */}
        <button
          onClick={() => {
            setIsPlaying(false);
            onJumpToStep(Math.min(history.length - 1, currentStepIndex + 1));
          }}
          disabled={currentStepIndex >= history.length - 1}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
          title="Вперед (Стрелка вправо →)"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Jump Last */}
        <button
          onClick={() => {
            setIsPlaying(false);
            onJumpToStep(history.length - 1);
          }}
          disabled={currentStepIndex >= history.length - 1}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
          title="В текущую позицию (End)"
        >
          <ChevronLast className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
