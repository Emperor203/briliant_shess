import React, { useEffect, useRef } from 'react';
import type { MoveAnalysis } from '../types/chess';
import { MOVE_BADGES } from '../constants/chessData';
import { ChevronFirst, ChevronLeft, ChevronRight, ChevronLast } from 'lucide-react';

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

  // Group moves into pairs: [ { turn: 1, white: MoveAnalysis, black?: MoveAnalysis } ]
  const turns: { turn: number; white: MoveAnalysis; whiteIdx: number; black?: MoveAnalysis; blackIdx?: number }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    turns.push({
      turn: Math.floor(i / 2) + 1,
      white: history[i],
      whiteIdx: i,
      black: history[i + 1],
      blackIdx: i + 1 < history.length ? i + 1 : undefined,
    });
  }

  // Auto-scroll to bottom as game progresses
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [history.length, currentStepIndex]);

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-4 py-3">
        <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
          <span>Журнал партии</span>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
            {history.length} {history.length === 1 ? 'ход' : 'ходов'}
          </span>
        </h3>
      </div>

      {/* Move list table */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-sm max-h-[340px]"
      >
        {turns.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-xs text-slate-500 italic">
            Сделайте ход, чтобы начать партию
          </div>
        ) : (
          turns.map((t) => {
            const isWhiteActive = currentStepIndex === t.whiteIdx;
            const isBlackActive = t.blackIdx !== undefined && currentStepIndex === t.blackIdx;

            return (
              <div
                key={t.turn}
                className="grid grid-cols-[38px_1fr_1fr] items-center gap-1 rounded-lg px-2 py-1 hover:bg-slate-800/40 transition-colors"
              >
                {/* Turn number */}
                <span className="text-xs text-slate-500 font-semibold">{t.turn}.</span>

                {/* White Move */}
                <button
                  onClick={() => onJumpToStep(t.whiteIdx)}
                  className={`flex items-center justify-between rounded px-2 py-1 text-left transition ${
                    isWhiteActive
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold ring-1 ring-cyan-400/50'
                      : 'text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  <span>{t.white.san}</span>
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
                    onClick={() => t.blackIdx !== undefined && onJumpToStep(t.blackIdx)}
                    className={`flex items-center justify-between rounded px-2 py-1 text-left transition ${
                      isBlackActive
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold ring-1 ring-cyan-400/50'
                        : 'text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <span>{t.black.san}</span>
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

      {/* Navigation Toolbar */}
      <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/70 p-2">
        <button
          onClick={() => onJumpToStep(-1)}
          disabled={currentStepIndex < 0}
          className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
          title="В начало партии"
        >
          <ChevronFirst className="h-4 w-4" />
        </button>
        <button
          onClick={() => onJumpToStep(Math.max(-1, currentStepIndex - 1))}
          disabled={currentStepIndex < 0}
          className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
          title="Назад на 1 ход"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onJumpToStep(Math.min(history.length - 1, currentStepIndex + 1))}
          disabled={currentStepIndex >= history.length - 1}
          className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
          title="Вперед на 1 ход"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => onJumpToStep(history.length - 1)}
          disabled={currentStepIndex >= history.length - 1}
          className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
          title="В текущую позицию"
        >
          <ChevronLast className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
