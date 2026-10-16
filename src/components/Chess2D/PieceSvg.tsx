import React from 'react';
import type { PieceStyleId } from '../../types/chess';

interface PieceSvgProps {
  type: string;
  color: 'w' | 'b';
  styleId?: PieceStyleId;
  className?: string;
}

export const PieceSvg: React.FC<PieceSvgProps> = ({ type, color, styleId = 'staunton', className = 'w-full h-full' }) => {
  const isWhite = color === 'w';

  // 1. Neo Style
  if (styleId === 'neo') {
    const accentFill = isWhite ? '#38bdf8' : '#f43f5e';
    const bgFill = isWhite ? '#1e293b' : '#0f172a';
    return (
      <svg viewBox="0 0 45 45" className={className}>
        <circle cx="22.5" cy="22.5" r="19" fill={bgFill} stroke={accentFill} strokeWidth="2.5" />
        <text
          x="22.5"
          y="28"
          textAnchor="middle"
          fontSize="18"
          fontWeight="900"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fill={isWhite ? '#ffffff' : accentFill}
        >
          {type.toUpperCase()}
        </text>
        <circle cx="22.5" cy="8.5" r="3" fill={accentFill} />
      </svg>
    );
  }

  // 2. Pixel Art Style
  if (styleId === 'pixel') {
    const pFill = isWhite ? '#f8fafc' : '#1e293b';
    const pStroke = isWhite ? '#334155' : '#020617';
    return (
      <svg viewBox="0 0 45 45" className={className} shapeRendering="crispEdges">
        <g fill={pFill} stroke={pStroke} strokeWidth="1.5">
          {type === 'p' && (
            <>
              <rect x="18" y="9" width="9" height="9" />
              <rect x="15" y="18" width="15" height="6" />
              <rect x="18" y="24" width="9" height="9" />
              <rect x="12" y="33" width="21" height="6" />
            </>
          )}
          {type === 'n' && (
            <>
              <rect x="15" y="8" width="15" height="7" />
              <rect x="11" y="15" width="22" height="8" />
              <rect x="17" y="23" width="16" height="8" />
              <rect x="12" y="31" width="21" height="8" />
              <circle cx="16" cy="18" r="1.5" fill={isWhite ? '#020617' : '#f8fafc'} />
            </>
          )}
          {type === 'b' && (
            <>
              <circle cx="22.5" cy="9" r="3" fill={pFill} />
              <rect x="17" y="12" width="11" height="15" />
              <rect x="19" y="27" width="7" height="6" />
              <rect x="13" y="33" width="19" height="6" />
            </>
          )}
          {type === 'r' && (
            <>
              <rect x="12" y="9" width="6" height="7" />
              <rect x="20" y="9" width="5" height="7" />
              <rect x="27" y="9" width="6" height="7" />
              <rect x="14" y="16" width="17" height="15" />
              <rect x="11" y="31" width="23" height="8" />
            </>
          )}
          {type === 'q' && (
            <>
              <circle cx="12" cy="10" r="2.5" />
              <circle cx="22.5" cy="8" r="3" />
              <circle cx="33" cy="10" r="2.5" />
              <polygon points="12,14 33,14 28,26 17,26" />
              <rect x="16" y="26" width="13" height="7" />
              <rect x="11" y="33" width="23" height="6" />
            </>
          )}
          {type === 'k' && (
            <>
              <rect x="21" y="5" width="3" height="9" />
              <rect x="18" y="8" width="9" height="3" />
              <circle cx="22.5" cy="18" r="6" />
              <rect x="16" y="24" width="13" height="8" />
              <rect x="11" y="32" width="23" height="7" />
            </>
          )}
        </g>
      </svg>
    );
  }

  // 3. Classic Staunton (Universal gold standard cburnett vector set)
  return renderStauntonPiece(type.toLowerCase(), isWhite, className);
};

function renderStauntonPiece(type: string, isWhite: boolean, className: string) {
  const fill = isWhite ? '#ffffff' : '#1e1e1e';
  const stroke = isWhite ? '#000000' : '#000000';
  const innerLine = isWhite ? '#000000' : '#ffffff';

  switch (type) {
    case 'p':
      // Pawn
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <path
            d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 1.47,-1.19 2.41,-3 2.41,-5.03 0,-2.41 -1.33,-4.5 -3.28,-5.62 c 0.49,-0.67 0.78,-1.49 0.78,-2.38 0,-2.21 -1.79,-4 -4,-4 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'r':
      // Rook
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,39 L 36,39 L 36,36 L 9,36 z" />
            <path d="M 12,36 L 12,32 L 33,32 L 33,36 z" />
            <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 z" />
            <path d="M 34,14 L 31,17 L 14,17 L 11,14 z" />
            <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17 z" />
            <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5 z" />
            <path d="M 11,14 L 34,14" fill="none" stroke={stroke} strokeWidth="1" />
          </g>
          {!isWhite && (
            <path d="M 12,35.5 L 33,35.5 M 13,31.5 L 32,31.5 M 14,16.5 L 31,16.5" fill="none" stroke="#fff" strokeWidth="1" />
          )}
        </svg>
      );

    case 'n':
      // Knight (Standard beautiful horse)
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" />
            <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,7.4 17.07,8.07 18,9 C 18.06,8.5 19.38,6.8 20.5,8 C 21.62,9.2 21.25,10.1 22,10 z" />
            <path
              d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z"
              fill={isWhite ? '#000' : '#fff'}
              stroke={isWhite ? '#000' : '#fff'}
            />
            <path
              d="M 15 15.5 A 0.5 1.5 0 1 1 14,15.5 A 0.5 1.5 0 1 1 15 15.5 z"
              transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)"
              fill={isWhite ? '#000' : '#fff'}
              stroke={isWhite ? '#000' : '#fff'}
            />
          </g>
          {!isWhite && (
            <path
              d="M 24.55,10.4 C 24.19,10 23.47,9.85 22.84,10.11 C 22.21,10.37 21.82,10.97 21.82,11.66 C 22.1,12.63 23.48,13.22 24.08,12.2 C 24.68,11.18 24.91,10.8 24.55,10.4 z"
              fill="#fff"
            />
          )}
        </svg>
      );

    case 'b':
      // Bishop
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 z" />
            <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
            <path d="M 25 8 A 2.5 2.5 0 1 1 20,8 A 2.5 2.5 0 1 1 25 8 z" />
            {/* Cross inside bishop */}
            <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" stroke={innerLine} strokeWidth="1" />
          </g>
        </svg>
      );

    case 'q':
      // Queen
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9 13 A 2 2 0 1 1 5,13 A 2 2 0 1 1 9 13 z" />
            <path d="M 16 9.5 A 2 2 0 1 1 12,9.5 A 2 2 0 1 1 16 9.5 z" />
            <path d="M 24.5 8 A 2 2 0 1 1 20.5,8 A 2 2 0 1 1 24.5 8 z" />
            <path d="M 33 9.5 A 2 2 0 1 1 29,9.5 A 2 2 0 1 1 33 9.5 z" />
            <path d="M 40 13 A 2 2 0 1 1 36,13 A 2 2 0 1 1 40 13 z" />
            <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,14.5 L 31,25 L 22.5,10 L 14,25 L 6.5,14.5 z" />
            <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 L 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 z" />
            <path d="M 11,38.5 L 34,38.5" />
            <path d="M 11,29 A 35 35 0 0 0 34,29" fill="none" stroke={innerLine} strokeWidth="1" />
            <path d="M 12.5,31.5 A 35 35 0 0 0 32.5,31.5" fill="none" stroke={innerLine} strokeWidth="1" />
            <path d="M 11.5,34.5 A 35 35 0 0 0 33.5,34.5" fill="none" stroke={innerLine} strokeWidth="1" />
          </g>
        </svg>
      );

    case 'k':
      // King
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Maltese Cross */}
            <path d="M 22.5,11.63 L 22.5,6 M 20,8 L 25,8" stroke={stroke} strokeWidth="1.5" />
            <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" />
            <path d="M 11.5,37 C 17,40.5 28,40.5 33.5,37 C 33.5,37 36,37 36,30 C 36,24 29,20.5 29,20.5 C 29,20.5 27.5,19 22.5,19 C 17.5,19 16,20.5 16,20.5 C 16,20.5 9,24 9,30 C 9,37 11.5,37 11.5,37 z" />
            <path d="M 11.5,30 C 17,27 28,27 33.5,30" fill="none" stroke={innerLine} strokeWidth="1" />
            <path d="M 11.5,33.5 C 17,30.5 28,30.5 33.5,33.5" fill="none" stroke={innerLine} strokeWidth="1" />
            <path d="M 11.5,37 C 17,34 28,34 33.5,37" fill="none" stroke={innerLine} strokeWidth="1" />
          </g>
        </svg>
      );

    default:
      return null;
  }
}
