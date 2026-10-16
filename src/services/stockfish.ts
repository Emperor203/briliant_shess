import { Chess } from 'chess.js';
import { PIECE_VALUES } from '../constants/chessData';

export interface EngineEvaluation {
  score: number; // centipawns from White's perspective (+ is white advantage, - is black advantage)
  depth: number;
  bestMove: string; // e.g. "e2e4"
  mate?: number; // moves to mate if detected (+ for white, - for black)
  pv?: string[];
}

export type EvalCallback = (evaluation: EngineEvaluation) => void;

// Piece-Square Tables for position evaluation
const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];

const BISHOP_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
];

const ROOK_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  5, 10, 10, 10, 10, 10, 10,  5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
  0,  0,  0,  5,  5,  0,  0,  0
];

const KING_TABLE = [
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -20, -30, -30, -40, -40, -30, -30, -20,
  -10, -20, -20, -20, -20, -20, -20, -10,
   20,  20,   0,   0,   0,   0,  20,  20,
   20,  30,  10,   0,   0,  10,  30,  20
];

class StockfishEngineService {
  private onEvalCallbacks: Set<EvalCallback> = new Set();
  private currentEval: EngineEvaluation = { score: 0, depth: 0, bestMove: '' };

  public subscribeEval(callback: EvalCallback): () => void {
    this.onEvalCallbacks.add(callback);
    callback(this.currentEval);
    return () => this.onEvalCallbacks.delete(callback);
  }

  private notifyEval(evaluation: EngineEvaluation) {
    this.currentEval = evaluation;
    this.onEvalCallbacks.forEach((cb) => cb(evaluation));
  }

  // Request best move for bot with specified difficulty
  public async getBotMove(
    fen: string,
    depth: number,
    _skillLevel: number,
    blunderProb: number = 0
  ): Promise<string> {
    const chess = new Chess(fen);
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) return '';

    // 1. Check if we intentionally blunder according to bot difficulty level
    if (blunderProb > 0 && Math.random() < blunderProb) {
      const nonOptimal = moves[Math.floor(Math.random() * moves.length)];
      return nonOptimal.from + nonOptimal.to + (nonOptimal.promotion || '');
    }

    // 2. Try Online Stockfish API (master depth)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2200);

      const targetDepth = Math.min(12, Math.max(5, depth));
      const res = await fetch(
        `https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(fen)}&depth=${targetDepth}`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.bestmove) {
          // Parse "bestmove c7c5 ponder b1c3"
          const match = data.bestmove.match(/bestmove\s+([a-h1-8qrbn]+)/);
          if (match && match[1] && match[1] !== '(none)') {
            const apiMove = match[1];
            // Verify move is legal
            const from = apiMove.slice(0, 2);
            const to = apiMove.slice(2, 4);
            const isLegal = moves.some((m) => m.from === from && m.to === to);
            if (isLegal) {
              // Also update evaluation if available
              if (data.evaluation !== undefined && data.evaluation !== null) {
                const scoreCp = Math.round(data.evaluation * 100);
                this.notifyEval({
                  score: scoreCp,
                  depth: targetDepth,
                  bestMove: apiMove,
                  mate: data.mate ?? undefined,
                });
              }
              return apiMove;
            }
          }
        }
      }
    } catch {
      // Network failed or timed out, fallback gracefully
    }

    // 3. Fallback: Ultra-fast local Minimax engine
    return this.fallbackCalculateMove(fen, Math.min(depth, 2));
  }

  // Evaluate position for eval bar & move analysis
  public async evaluatePosition(fen: string, depth: number = 10): Promise<EngineEvaluation> {
    // 1. Try Online Stockfish API
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1800);

      const res = await fetch(
        `https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(fen)}&depth=${Math.min(10, depth)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          let scoreCp = 0;
          if (data.evaluation !== undefined && data.evaluation !== null) {
            scoreCp = Math.round(data.evaluation * 100);
          }

          let bestMove = '';
          if (data.bestmove) {
            const match = data.bestmove.match(/bestmove\s+([a-h1-8qrbn]+)/);
            if (match) bestMove = match[1];
          }

          const result: EngineEvaluation = {
            score: scoreCp,
            depth: depth,
            bestMove,
            mate: data.mate ?? undefined,
          };
          this.notifyEval(result);
          return result;
        }
      }
    } catch {
      // Fallback
    }

    // 2. Fast local evaluation fallback
    const localScore = this.fallbackEvaluatePosition(fen);
    const localBest = this.fallbackCalculateMove(fen, 2);
    const fallbackRes: EngineEvaluation = {
      score: localScore,
      depth: 3,
      bestMove: localBest,
    };
    this.notifyEval(fallbackRes);
    return fallbackRes;
  }

  // Fast position evaluation using material + piece-square tables + center control
  public fallbackEvaluatePosition(fen: string): number {
    const chess = new Chess(fen);
    if (chess.isGameOver()) {
      if (chess.isCheckmate()) {
        return chess.turn() === 'w' ? -10000 : 10000;
      }
      return 0; // Draw
    }

    let score = 0;
    const board = chess.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;

        const val = PIECE_VALUES[piece.type] || 100;
        let pst = 0;
        const squareIdx = r * 8 + c;
        const flippedIdx = (7 - r) * 8 + c;

        switch (piece.type) {
          case 'p':
            pst = piece.color === 'w' ? PAWN_TABLE[flippedIdx] : PAWN_TABLE[squareIdx];
            break;
          case 'n':
            pst = piece.color === 'w' ? KNIGHT_TABLE[flippedIdx] : KNIGHT_TABLE[squareIdx];
            break;
          case 'b':
            pst = piece.color === 'w' ? BISHOP_TABLE[flippedIdx] : BISHOP_TABLE[squareIdx];
            break;
          case 'r':
            pst = piece.color === 'w' ? ROOK_TABLE[flippedIdx] : ROOK_TABLE[squareIdx];
            break;
          case 'k':
            pst = piece.color === 'w' ? KING_TABLE[flippedIdx] : KING_TABLE[squareIdx];
            break;
          case 'q':
            pst = 0;
            break;
        }

        const total = val + pst;
        score += piece.color === 'w' ? total : -total;
      }
    }

    return score;
  }

  // Alpha-beta search for fast local bot moves
  public fallbackCalculateMove(fen: string, depth: number): string {
    const chess = new Chess(fen);
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) return '';

    const isWhiteTurn = chess.turn() === 'w';
    let bestMove = moves[0];
    let bestScore = isWhiteTurn ? -Infinity : Infinity;

    // Prioritize captures and checks
    moves.sort((a, b) => {
      const aVal = a.captured ? PIECE_VALUES[a.captured] || 100 : 0;
      const bVal = b.captured ? PIECE_VALUES[b.captured] || 100 : 0;
      return bVal - aVal;
    });

    for (const move of moves) {
      chess.move(move);
      const score = this.minimax(chess, depth - 1, -Infinity, Infinity, !isWhiteTurn);
      chess.undo();

      if (isWhiteTurn) {
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
    }

    return bestMove.from + bestMove.to + (bestMove.promotion || '');
  }

  private minimax(chess: Chess, depth: number, alpha: number, beta: number, isMaximizing: boolean): number {
    if (depth === 0 || chess.isGameOver()) {
      return this.fallbackEvaluatePosition(chess.fen());
    }

    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) {
      return this.fallbackEvaluatePosition(chess.fen());
    }

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        chess.move(move);
        const ev = this.minimax(chess, depth - 1, alpha, beta, false);
        chess.undo();
        maxEval = Math.max(maxEval, ev);
        alpha = Math.max(alpha, ev);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        chess.move(move);
        const ev = this.minimax(chess, depth - 1, alpha, beta, true);
        chess.undo();
        minEval = Math.min(minEval, ev);
        beta = Math.min(beta, ev);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }
}

export const stockfish = new StockfishEngineService();
