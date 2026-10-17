import type { MoveAnalysis, PlayerAccuracyStats, GameReviewReport, BoardArrow } from '../types/chess';

// Standard win probability formula used by Lichess and Chess.com
// Win% from centipawns: W = 50 + 50 * (2 / (1 + exp(-0.003682 * cp)) - 1)
function cpToWinProb(cp: number): number {
  return 50 + 50 * (2 / (1 + Math.exp(-0.003682 * cp)) - 1);
}

// Calculate Accuracy for a single move based on win probability loss
function calculateMoveAccuracy(evalBefore: number, evalAfter: number): number {
  const winBefore = cpToWinProb(evalBefore);
  const winAfter = cpToWinProb(evalAfter);
  const loss = Math.max(0, winBefore - winAfter);
  
  // Exponential accuracy decay
  const acc = 103.1668 * Math.exp(-0.04354 * loss) - 3.1668;
  return Math.min(100, Math.max(0, acc));
}

export function generateGameReview(
  history: MoveAnalysis[],
  botRating: number = 1500
): GameReviewReport {
  const whiteMoves = history.filter((m) => m.color === 'w');
  const blackMoves = history.filter((m) => m.color === 'b');

  const calcStats = (moves: MoveAnalysis[]): PlayerAccuracyStats => {
    if (moves.length === 0) {
      return {
        accuracy: 100,
        performanceRating: botRating,
        brilliant: 0,
        best: 0,
        excellent: 0,
        good: 0,
        inaccuracy: 0,
        mistake: 0,
        blunder: 0,
        totalMoves: 0,
      };
    }

    let sumAcc = 0;
    const counts: Record<string, number> = {
      book: 0,
      brilliant: 0,
      best: 0,
      excellent: 0,
      good: 0,
      inaccuracy: 0,
      mistake: 0,
      blunder: 0,
    };

    moves.forEach((m) => {
      const acc = calculateMoveAccuracy(m.evalBefore, m.evalAfter);
      sumAcc += acc;
      if (counts[m.quality] !== undefined) {
        counts[m.quality]++;
      }
    });

    const avgAccuracy = Math.round((sumAcc / moves.length) * 10) / 10;
    // Estimate performance rating based on accuracy
    const performanceRating = Math.round(
      Math.max(600, Math.min(2900, botRating + (avgAccuracy - 75) * 35))
    );

    return {
      accuracy: avgAccuracy,
      performanceRating,
      book: counts.book,
      brilliant: counts.brilliant,
      best: counts.best,
      excellent: counts.excellent,
      good: counts.good,
      inaccuracy: counts.inaccuracy,
      mistake: counts.mistake,
      blunder: counts.blunder,
      totalMoves: moves.length,
    };
  };

  const evalTimeline = history.map((m, idx) => {
    // Score from White's perspective
    const scoreWhite = m.color === 'w' ? m.evalAfter : -m.evalAfter;
    return {
      ply: idx,
      moveNumber: Math.floor(idx / 2) + 1,
      turn: m.color,
      scoreCp: scoreWhite,
      san: m.san,
      quality: m.quality,
    };
  });

  return {
    white: calcStats(whiteMoves),
    black: calcStats(blackMoves),
    evalTimeline,
  };
}

// Convert UCI move string (e.g. "e2e4") into BoardArrow
export function uciToArrow(uci: string, color: string = '#22c55e', label?: string): BoardArrow | null {
  if (!uci || uci.length < 4) return null;
  const from = uci.slice(0, 2) as any;
  const to = uci.slice(2, 4) as any;
  return { from, to, color, label };
}
