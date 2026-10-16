import React, { useState } from 'react';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import { PieceSvg } from './PieceSvg';
import type { BoardTheme, MoveAnalysis, PieceStyleId } from '../../types/chess';
import { MOVE_BADGES } from '../../constants/chessData';

interface Chessboard2DProps {
  chess: Chess;
  boardTheme: BoardTheme;
  pieceStyle: PieceStyleId;
  flipped: boolean;
  onMove: (from: Square, to: Square, promotion?: string) => boolean | Promise<boolean>;
  lastAnalysis?: MoveAnalysis;
  disabled?: boolean;
}

export const Chessboard2D: React.FC<Chessboard2DProps> = ({
  chess,
  boardTheme,
  pieceStyle,
  flipped,
  onMove,
  lastAnalysis,
  disabled = false,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<{ to: Square; captured: boolean }[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayFiles = flipped ? [...files].reverse() : files;
  const displayRanks = flipped ? [...ranks].reverse() : ranks;

  // Find checked king square
  const inCheckSquare: Square | null = React.useMemo(() => {
    if (!chess.inCheck()) return null;
    const turn = chess.turn();
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === turn) {
          return `${files[c]}${ranks[r]}` as Square;
        }
      }
    }
    return null;
  }, [chess, chess.fen()]);

  const handleSquareClick = async (square: Square) => {
    if (disabled || pendingPromotion) return;

    // If already selected, check if clicked square is a legal destination
    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      const isLegal = legalMoves.some((m) => m.to === square);
      if (isLegal) {
        // Check for pawn promotion
        const piece = chess.get(selectedSquare);
        if (
          piece &&
          piece.type === 'p' &&
          ((piece.color === 'w' && square.endsWith('8')) || (piece.color === 'b' && square.endsWith('1')))
        ) {
          setPendingPromotion({ from: selectedSquare, to: square });
          setSelectedSquare(null);
          setLegalMoves([]);
          return;
        }

        const success = await onMove(selectedSquare, square);
        if (success) {
          setSelectedSquare(null);
          setLegalMoves([]);
          return;
        }
      }
    }

    // Otherwise, select piece on square if it's the current player's piece
    const piece = chess.get(square);
    if (piece && piece.color === chess.turn()) {
      setSelectedSquare(square);
      const moves = chess.moves({ square, verbose: true });
      setLegalMoves(
        moves.map((m) => ({
          to: m.to as Square,
          captured: !!m.captured,
        }))
      );
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const handlePromotionSelect = async (promoPiece: 'q' | 'r' | 'b' | 'n') => {
    if (pendingPromotion) {
      await onMove(pendingPromotion.from, pendingPromotion.to, promoPiece);
      setPendingPromotion(null);
    }
  };

  return (
    <div className="relative aspect-square w-full max-w-[620px] select-none rounded-xl p-2 shadow-2xl transition-colors duration-300"
         style={{ backgroundColor: boardTheme.boardBorder }}>
      {/* 8x8 Grid */}
      <div className="grid h-full w-full grid-cols-8 grid-rows-8 overflow-hidden rounded-lg">
        {displayRanks.map((rank, rankIdx) =>
          displayFiles.map((file, fileIdx) => {
            const square = `${file}${rank}` as Square;
            const piece = chess.get(square);
            const isLight = (fileIdx + rankIdx) % 2 === (flipped ? 1 : 0);
            const isSelected = selectedSquare === square;
            const legalMove = legalMoves.find((m) => m.to === square);
            const isLastMoveFrom = lastAnalysis && lastAnalysis.from === square;
            const isLastMoveTo = lastAnalysis && lastAnalysis.to === square;
            const isKingInCheck = inCheckSquare === square;

            // Square background color
            let squareBg = isLight ? boardTheme.lightSquare : boardTheme.darkSquare;

            return (
              <div
                key={square}
                onClick={() => handleSquareClick(square)}
                className="relative flex items-center justify-center cursor-pointer transition-all duration-150"
                style={{ backgroundColor: squareBg }}
              >
                {/* Last Move Highlight */}
                {(isLastMoveFrom || isLastMoveTo) && (
                  <div className="absolute inset-0 bg-yellow-400/35 pointer-events-none transition-opacity" />
                )}

                {/* Selected Square Highlight */}
                {isSelected && (
                  <div className="absolute inset-0 bg-cyan-400/40 ring-4 ring-cyan-400/80 ring-inset pointer-events-none" />
                )}

                {/* King in Check Glow */}
                {isKingInCheck && (
                  <div className="absolute inset-0 bg-red-600/50 animate-pulse pointer-events-none" />
                )}

                {/* Piece SVG */}
                {piece && (
                  <div className="z-10 h-[88%] w-[88%] transition-transform duration-150 hover:scale-105">
                    <PieceSvg type={piece.type} color={piece.color} styleId={pieceStyle} />
                  </div>
                )}

                {/* Move Quality Badge on Target Square */}
                {isLastMoveTo && lastAnalysis && (
                  <div
                    className={`absolute -top-1.5 -right-1.5 z-20 flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold shadow-lg animate-bounce ${
                      MOVE_BADGES[lastAnalysis.quality].bg
                    } ${MOVE_BADGES[lastAnalysis.quality].border}`}
                    title={`${MOVE_BADGES[lastAnalysis.quality].label}: ${lastAnalysis.explanation || ''}`}
                  >
                    <span>{MOVE_BADGES[lastAnalysis.quality].icon}</span>
                  </div>
                )}

                {/* Legal Move Indicators */}
                {legalMove && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                    {legalMove.captured || piece ? (
                      <div className="h-full w-full rounded-full border-4 border-black/35 ring-4 ring-white/40 ring-inset" />
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-black/30 ring-2 ring-white/50" />
                    )}
                  </div>
                )}

                {/* Coordinates (Files along bottom, Ranks along left) */}
                {rankIdx === 7 && (
                  <span
                    className="absolute bottom-0.5 right-1 text-[10px] font-bold opacity-60 pointer-events-none"
                    style={{ color: isLight ? boardTheme.darkSquare : boardTheme.lightSquare }}
                  >
                    {file}
                  </span>
                )}
                {fileIdx === 0 && (
                  <span
                    className="absolute top-0.5 left-1 text-[10px] font-bold opacity-60 pointer-events-none"
                    style={{ color: isLight ? boardTheme.darkSquare : boardTheme.lightSquare }}
                  >
                    {rank}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pawn Promotion Modal */}
      {pendingPromotion && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-xl bg-black/75 backdrop-blur-sm p-4">
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl text-center">
            <h3 className="mb-4 text-lg font-bold text-slate-100">Выберите фигуру превращения</h3>
            <div className="flex gap-4">
              {(['q', 'r', 'b', 'n'] as const).map((pType) => (
                <button
                  key={pType}
                  onClick={() => handlePromotionSelect(pType)}
                  className="flex h-16 w-16 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 p-2 hover:scale-110 hover:border-cyan-400 hover:bg-slate-700 transition-transform shadow-lg cursor-pointer"
                >
                  <PieceSvg type={pType} color={chess.turn()} styleId={pieceStyle} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
