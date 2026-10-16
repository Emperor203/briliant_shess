import React from 'react';
import type { EngineEvaluation } from '../services/stockfish';

interface EvaluationBarProps {
  evaluation: EngineEvaluation;
  flipped: boolean;
  className?: string;
}

export const EvaluationBar: React.FC<EvaluationBarProps> = ({ evaluation, flipped, className = '' }) => {
  // Convert centipawns to percentage (0% to 100% white share)
  let whitePercentage = 50;
  let label = '0.0';

  if (evaluation.mate !== undefined) {
    if (evaluation.mate > 0) {
      whitePercentage = 100;
      label = `M${evaluation.mate}`;
    } else {
      whitePercentage = 0;
      label = `-M${Math.abs(evaluation.mate)}`;
    }
  } else {
    // Normal centipawn evaluation
    const cp = evaluation.score;
    // Map [-1200, 1200] centipawns smoothly to [5%, 95%]
    const clamped = Math.max(-1200, Math.min(1200, cp));
    whitePercentage = 50 + (clamped / 1200) * 45;

    const formattedCp = (cp / 100).toFixed(1);
    label = cp > 0 ? `+${formattedCp}` : formattedCp;
  }

  // If flipped, invert vertical layout
  const topPercentage = flipped ? whitePercentage : 100 - whitePercentage;
  const isWhiteAdvantage = evaluation.score >= 0;

  return (
    <div className={`relative flex flex-col items-center justify-between overflow-hidden rounded-lg bg-slate-900 border border-slate-700 shadow-xl select-none ${className}`}>
      {/* Black's section (Dark bar) */}
      <div
        className="w-full bg-[#181a1f] transition-all duration-500 ease-out flex items-start justify-center pt-1.5"
        style={{ height: `${topPercentage}%` }}
      >
        {!flipped && !isWhiteAdvantage && (
          <span className="text-[11px] font-black tracking-tight text-slate-300 drop-shadow">
            {label}
          </span>
        )}
        {flipped && isWhiteAdvantage && (
          <span className="text-[11px] font-black tracking-tight text-slate-300 drop-shadow">
            {label}
          </span>
        )}
      </div>

      {/* Divider Line */}
      <div className="w-full h-[1px] bg-cyan-400/30 z-10 shrink-0" />

      {/* White's section (Light bar) */}
      <div
        className="w-full bg-[#f8fafc] transition-all duration-500 ease-out flex items-end justify-center pb-1.5"
        style={{ height: `${100 - topPercentage}%` }}
      >
        {!flipped && isWhiteAdvantage && (
          <span className="text-[11px] font-black tracking-tight text-slate-800 drop-shadow">
            {label}
          </span>
        )}
        {flipped && !isWhiteAdvantage && (
          <span className="text-[11px] font-black tracking-tight text-slate-800 drop-shadow">
            {label}
          </span>
        )}
      </div>

      {/* Depth badge tooltip */}
      <div
        className="absolute bottom-1 text-[9px] font-mono text-slate-500 pointer-events-none opacity-60"
        title={`Глубина анализа Stockfish: ${evaluation.depth}`}
      >
        d{evaluation.depth || 1}
      </div>
    </div>
  );
};
