import React, { useState, useEffect, useRef } from 'react';
import type { EngineEvaluation } from '../services/stockfish';
import { Sparkles, RefreshCw, Trophy, AlertTriangle, HelpCircle } from 'lucide-react';
import { sounds } from '../services/sound';

export type MascotMood = 'happy' | 'thoughtful' | 'sad' | 'victory' | 'defeat' | 'draw' | 'thinking_bot';

interface PawnPetCompanionProps {
  evaluation: EngineEvaluation;
  playerColor: 'w' | 'b';
  isBotThinking: boolean;
  gameOver: {
    isOpen: boolean;
    winner: 'w' | 'b' | 'draw' | null;
    reason: string;
  };
  isSoundEnabled?: boolean;
  className?: string;
}

const HAPPY_QUOTES = [
  'Ураа! Отличные шансы на победу! 🎉',
  'Позиция огонь, дожимаем соперника! 🔥',
  'Ты играешь как будущий гроссмейстер! 💎',
  'У соперника дрожат фигуры! Так держать!',
  'Преимущество на нашей стороне, веди атаку!',
];

const THOUGHTFUL_QUOTES = [
  'Хмм, равная игра. Нужен точный план... 🤔',
  'Позиция в равновесии. Не зеваем фигуры!',
  'Взвешивай каждый ход, спешка ни к чему.',
  'Интересно, какую ловушку задумал бот?..',
  'Пешка — душа шахмат, двигаем грамотно!',
];

const SAD_QUOTES = [
  'Ой-ой-ой... Позиция тяжелая, но не сдавайся! 🛡️',
  'Держись! Срочно ищем защиту и контригру!',
  'Главное не паниковать! В шахматах бывают чудеса!',
  'Защищай короля, ищи ошибку соперника!',
  'Даже гроссмейстеры спасали такие партии!',
];

const CLICK_QUOTES = [
  'Щёлк! +10 к гроссмейстерской интуиции! ✨',
  'Пешка — единственная фигура, которая никогда не отступает назад! ♟️',
  'Я маленькая пешка, но всей душой мечтаю стать ферзём! 👑',
  'Я верю в твой следующий ход! Сделай шедевр!',
  'Сделай рокировку вовремя — сбереги короля!',
];

export const PawnPetCompanion: React.FC<PawnPetCompanionProps> = ({
  evaluation,
  playerColor,
  isBotThinking,
  gameOver,
  isSoundEnabled = true,
  className = '',
}) => {
  // Player centipawns advantage
  const playerAdvantage = playerColor === 'w' ? evaluation.score : -evaluation.score;
  const playerMate =
    evaluation.mate !== undefined
      ? playerColor === 'w'
        ? evaluation.mate
        : -evaluation.mate
      : undefined;

  // Calculate Win Probability (0% to 100%)
  let winProbability = 50;
  if (gameOver.isOpen) {
    if (gameOver.winner === playerColor) winProbability = 100;
    else if (gameOver.winner === 'draw') winProbability = 50;
    else winProbability = 0;
  } else if (playerMate !== undefined) {
    winProbability = playerMate > 0 ? 99 : 1;
  } else {
    // Logistic curve: 1 / (1 + 10^(-cp / 400))
    const p = 1 / (1 + Math.pow(10, -playerAdvantage / 400));
    winProbability = Math.min(99, Math.max(1, Math.round(p * 100)));
  }

  // Determine current Mood
  let mood: MascotMood = 'thoughtful';
  if (gameOver.isOpen) {
    if (gameOver.winner === playerColor) mood = 'victory';
    else if (gameOver.winner === 'draw') mood = 'draw';
    else mood = 'defeat';
  } else if (playerMate !== undefined) {
    mood = playerMate > 0 ? 'happy' : 'sad';
  } else if (playerAdvantage >= 110) {
    mood = 'happy';
  } else if (playerAdvantage <= -110) {
    mood = 'sad';
  } else if (isBotThinking) {
    mood = 'thinking_bot';
  } else {
    mood = 'thoughtful';
  }

  // Quote State
  const [speech, setSpeech] = useState<string>('Привет! Я твой шахматный талисман. Погнали побеждать! ♟️');
  const [isBouncing, setIsBouncing] = useState(false);

  // Mouse Eye Tracking State
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const faceCenterX = rect.left + rect.width * 0.5;
      const faceCenterY = rect.top + rect.height * 0.35; // Head/eyes center

      const deltaX = e.clientX - faceCenterX;
      const deltaY = e.clientY - faceCenterY;
      const dist = Math.hypot(deltaX, deltaY);

      if (dist < 2) {
        setMouseOffset({ x: 0, y: 0 });
        return;
      }

      // Max eye deflection inside the sclera
      const maxShiftX = 2.5;
      const maxShiftY = 2.2;
      const angle = Math.atan2(deltaY, deltaX);
      const intensity = Math.min(1, dist / 280);

      setMouseOffset({
        x: Math.cos(angle) * maxShiftX * intensity,
        y: Math.sin(angle) * maxShiftY * intensity,
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Update speech when mood changes
  useEffect(() => {
    if (gameOver.isOpen) {
      if (gameOver.winner === playerColor) {
        setSpeech('УРААА! БЛЕСТЯЩАЯ ПОБЕДА! Мы сокрушили соперника! 🏆🎉');
      } else if (gameOver.winner === 'draw') {
        setSpeech('Боевая ничья! Отличная партия и крепкая защита! 🤝');
      } else {
        setSpeech('Эх, ничего страшного! Ошибки учат нас побеждать! ❤️');
      }
      return;
    }

    if (mood === 'thinking_bot') {
      setSpeech('Тихо-тихо, бот рассчитывает ход... Что же он ответит? 🤖');
      return;
    }

    let pool = THOUGHTFUL_QUOTES;
    if (mood === 'happy') pool = HAPPY_QUOTES;
    else if (mood === 'sad') pool = SAD_QUOTES;

    const randomQuote = pool[Math.floor(Math.random() * pool.length)];
    setSpeech(randomQuote);
  }, [mood, gameOver.isOpen, gameOver.winner]);

  // Handle Mascot Click interaction
  const handlePawnClick = () => {
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 800);

    if (isSoundEnabled) {
      sounds.playMove();
    }

    const randomClickQuote = CLICK_QUOTES[Math.floor(Math.random() * CLICK_QUOTES.length)];
    setSpeech(randomClickQuote);
  };

  // Color theme by mood
  const getMoodConfig = () => {
    switch (mood) {
      case 'victory':
        return {
          title: 'ПОБЕДА!',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
          glowInner: 'rgba(245, 158, 11, 0.4)',
          glowMid: 'rgba(234, 179, 8, 0.18)',
          icon: Trophy,
          barColor: 'bg-gradient-to-r from-amber-400 to-yellow-300',
        };
      case 'happy':
        return {
          title: 'Радуется (Ликует)',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
          glowInner: 'rgba(16, 185, 129, 0.35)',
          glowMid: 'rgba(6, 182, 212, 0.18)',
          icon: Sparkles,
          barColor: 'bg-gradient-to-r from-teal-400 to-emerald-400',
        };
      case 'sad':
      case 'defeat':
        return {
          title: 'Переживает (Грустит)',
          badgeBg: 'bg-red-500/20 text-red-300 border-red-400/40',
          glowInner: 'rgba(239, 68, 68, 0.35)',
          glowMid: 'rgba(249, 115, 22, 0.18)',
          icon: AlertTriangle,
          barColor: 'bg-gradient-to-r from-red-500 to-rose-400',
        };
      case 'thinking_bot':
        return {
          title: 'Наблюдает за ботом',
          badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
          glowInner: 'rgba(6, 182, 212, 0.35)',
          glowMid: 'rgba(59, 130, 246, 0.18)',
          icon: RefreshCw,
          barColor: 'bg-gradient-to-r from-cyan-400 to-blue-500',
        };
      case 'draw':
      case 'thoughtful':
      default:
        return {
          title: 'Задумчивый (В фокусе)',
          badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
          glowInner: 'rgba(245, 158, 11, 0.3)',
          glowMid: 'rgba(234, 179, 8, 0.14)',
          icon: HelpCircle,
          barColor: 'bg-gradient-to-r from-amber-400 to-yellow-400',
        };
    }
  };

  const moodConfig = getMoodConfig();
  const IconComponent = moodConfig.icon;

  return (
    <div
      className={`relative w-full flex flex-col items-center justify-center select-none transition-all duration-300 ${className}`}
    >
      {/* Mood Badge Pill */}
      <div className="flex items-center justify-center mb-1.5">
        <div
          className={`flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[11px] font-bold shadow-md backdrop-blur-md transition-all ${moodConfig.badgeBg}`}
        >
          <IconComponent className="h-3.5 w-3.5" />
          <span>{moodConfig.title}</span>
        </div>
      </div>

      {/* Speech Bubble */}
      <div className="relative mb-3 max-w-[240px] rounded-2xl bg-slate-800/85 px-3.5 py-2 shadow-xl backdrop-blur-md border border-slate-700/50">
        <p className="text-xs sm:text-sm font-semibold leading-snug text-slate-100 text-center animate-in fade-in duration-300 select-none">
          «{speech}»
        </p>
        {/* Speech Bubble Arrow */}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-slate-800/85 border-r border-b border-slate-700/50 rotate-45" />
      </div>

      {/* Interactive Mascot Pawn Character - BIG & EXPRESSIVE */}
      <div
        onClick={handlePawnClick}
        title="Нажми на пешку!"
        className={`relative group mx-auto flex flex-col items-center justify-center cursor-pointer select-none transition-transform duration-300 ${
          isBouncing ? 'scale-115 -rotate-6 animate-bounce' : 'hover:scale-105 active:scale-95'
        }`}
      >
        {/* Ambient Glow Aura - 100% Circular, naturally feathered with no clipping */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-56 sm:h-56 rounded-full pointer-events-none transition-all duration-700"
          style={{
            background: `radial-gradient(circle, ${moodConfig.glowInner} 0%, ${moodConfig.glowMid} 45%, transparent 70%)`,
          }}
        />

        {/* Floating accessory effects based on mood */}
        {mood === 'happy' && (
          <div className="absolute -top-4 flex items-center justify-between w-32 px-1 pointer-events-none animate-pulse">
            <span className="text-lg">✨</span>
            <span className="text-sm">⭐</span>
            <span className="text-lg">✨</span>
          </div>
        )}
        {mood === 'victory' && (
          <div className="absolute -top-6 text-3xl animate-bounce pointer-events-none">
            👑
          </div>
        )}
        {mood === 'sad' && (
          <div className="absolute -top-3 flex items-center justify-center w-full pointer-events-none">
            <span className="text-base opacity-80 animate-pulse">💧</span>
          </div>
        )}
        {mood === 'thoughtful' && (
          <div className="absolute -top-3 right-4 text-base animate-pulse pointer-events-none">
            💭
          </div>
        )}
        {mood === 'thinking_bot' && (
          <div className="absolute -top-3 text-base animate-spin pointer-events-none">
            ⚙️
          </div>
        )}

        {/* Vector SVG Pawn Mascot (Large & Symmetrical) */}
        <svg
          ref={svgRef}
          viewBox="0 0 100 125"
          className="relative h-44 w-44 sm:h-52 sm:w-52 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
        >
          <defs>
            {/* Body Golden / Amber Gradient */}
            <linearGradient id="pawnBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="35%" stopColor="#facc15" />
              <stop offset="70%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>

            {/* Spherical Head Radial Highlight */}
            <radialGradient id="pawnHeadShine" cx="38%" cy="32%" r="62%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#fef08a" stopOpacity="0.9" />
              <stop offset="75%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#a16207" />
            </radialGradient>

            {/* Base Pedestal Gradient */}
            <linearGradient id="pawnBaseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>

            {/* Feathered Floor Shadow Radial Gradient */}
            <radialGradient id="floorShadowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.45" />
              <stop offset="65%" stopColor="#000000" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Base Floor Shadow - 100% Round and Feathered */}
          <ellipse cx="50" cy="116" rx="36" ry="6" fill="url(#floorShadowGrad)" />

          {/* Bottom Pedestal Ring (Symmetrical) */}
          <path
            d="M 18 111 C 18 106, 82 106, 82 111 L 80 117 C 80 119, 20 119, 20 117 Z"
            fill="url(#pawnBaseGrad)"
            stroke="#78350f"
            strokeWidth="1.5"
          />

          {/* Middle Pedestal Ring (Symmetrical) */}
          <path
            d="M 25 101 C 25 97, 75 97, 75 101 L 78 110 C 78 112, 22 112, 22 110 Z"
            fill="url(#pawnBodyGrad)"
            stroke="#78350f"
            strokeWidth="1.2"
          />

          {/* Hourglass Torso (100% Symmetrical: 50 ± 14 at top, 50 ± 24 at bottom) */}
          <path
            d="M 36 68 C 36 82, 26 93, 26 101 L 74 101 C 74 93, 64 82, 64 68 Z"
            fill="url(#pawnBodyGrad)"
            stroke="#78350f"
            strokeWidth="1.5"
          />

          {/* Torso Light Reflection */}
          <path
            d="M 39 72 C 39 82, 33 90, 31 96 C 34 88, 41 80, 41 72 Z"
            fill="#ffffff"
            opacity="0.3"
          />

          {/* Neck Ring Collar (Symmetrical: centered at 50) */}
          <ellipse
            cx="50"
            cy="68"
            rx="17"
            ry="5"
            fill="url(#pawnBaseGrad)"
            stroke="#78350f"
            strokeWidth="1.5"
          />
          <ellipse
            cx="50"
            cy="66"
            rx="14"
            ry="3.5"
            fill="#fef08a"
            opacity="0.9"
          />

          {/* Spherical Head (Centered at 50, 42) */}
          <circle
            cx="50"
            cy="42"
            r="23"
            fill="url(#pawnHeadShine)"
            stroke="#78350f"
            strokeWidth="1.6"
          />

          {/* Head Specular Highlight Arc */}
          <path
            d="M 37 28 A 18 18 0 0 1 54 22"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Cute Rosy Blushing Cheeks (Symmetrical: 50 ± 16) */}
          <ellipse
            cx="34"
            cy="49"
            rx="4.5"
            ry="2.5"
            fill="#fb7185"
            opacity={mood === 'happy' || mood === 'victory' ? 0.75 : 0.35}
          />
          <ellipse
            cx="66"
            cy="49"
            rx="4.5"
            ry="2.5"
            fill="#fb7185"
            opacity={mood === 'happy' || mood === 'victory' ? 0.75 : 0.35}
          />

          {/* Dynamic Facial Features by Mood */}
          {mood === 'happy' || mood === 'victory' ? (
            /* Joyful laughing arc eyes (^ ^) slightly turning towards cursor and beaming smile */
            <g transform={`translate(${mouseOffset.x * 0.4}, ${mouseOffset.y * 0.4})`}>
              {/* Cheerful curved laughing eyes (Symmetrical: 50 ± 11) */}
              <path
                d="M 33 42 Q 39 34 45 42"
                fill="none"
                stroke="#451a03"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <path
                d="M 55 42 Q 61 34 67 42"
                fill="none"
                stroke="#451a03"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              {/* Happy open smile */}
              <path
                d="M 43 48 Q 50 58 57 48 Z"
                fill="#991b1b"
                stroke="#451a03"
                strokeWidth="1.5"
              />
              <path d="M 46 51 Q 50 55 54 51" fill="#f472b6" />

              {/* Cheerful waving paws */}
              <path
                d="M 30 76 Q 20 68 18 60"
                fill="none"
                stroke="#ca8a04"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="17" cy="59" r="3.5" fill="#fde047" stroke="#78350f" strokeWidth="1" />
              <path
                d="M 70 76 Q 80 68 82 60"
                fill="none"
                stroke="#ca8a04"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="83" cy="59" r="3.5" fill="#fde047" stroke="#78350f" strokeWidth="1" />
            </g>
          ) : mood === 'sad' || mood === 'defeat' ? (
            /* Sad worried eyes looking towards cursor and trembling mouth */
            <g>
              {/* Sad tilted eyebrows */}
              <path
                d="M 33 34 L 43 31"
                fill="none"
                stroke="#78350f"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M 67 34 L 57 31"
                fill="none"
                stroke="#78350f"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              {/* Big teary puppy eyes (Symmetrical: 50 ± 11) */}
              <ellipse cx="39" cy="42" rx="6.5" ry="7.5" fill="#ffffff" stroke="#78350f" strokeWidth="1.5" />
              <ellipse cx="61" cy="42" rx="6.5" ry="7.5" fill="#ffffff" stroke="#78350f" strokeWidth="1.5" />

              {/* Pupils dynamically tracking cursor */}
              <circle cx={39 + mouseOffset.x} cy={43 + mouseOffset.y} r="4.2" fill="#451a03" />
              <circle cx={61 + mouseOffset.x} cy={43 + mouseOffset.y} r="4.2" fill="#451a03" />
              <circle cx={39 + mouseOffset.x - 1} cy={41.5 + mouseOffset.y} r="1.6" fill="#bae6fd" />
              <circle cx={61 + mouseOffset.x - 1} cy={41.5 + mouseOffset.y} r="1.6" fill="#bae6fd" />

              {/* Smooth glistening tear drop on left cheek */}
              <path
                d="M 35 48 C 35 52, 38 54, 38 56 C 38 58, 35 59, 33 56 C 32 54, 35 50, 35 48 Z"
                fill="#38bdf8"
                opacity="0.9"
              />

              {/* Trembling downward sad mouth */}
              <path
                d="M 44 54 Q 50 49 56 54"
                fill="none"
                stroke="#451a03"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </g>
          ) : (
            /* Thoughtful / Contemplative: Eyes dynamically tracking mouse cursor! */
            <g>
              {/* Inquisitive eyebrows */}
              <path
                d="M 33 32 Q 39 29 45 32"
                fill="none"
                stroke="#78350f"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M 55 31 Q 61 27 67 30"
                fill="none"
                stroke="#78350f"
                strokeWidth="2.2"
                strokeLinecap="round"
              />

              {/* Big clean anime-style eyes (Symmetrical: 50 ± 11) */}
              <ellipse cx="39" cy="41" rx="6.5" ry="7.5" fill="#ffffff" stroke="#78350f" strokeWidth="1.5" />
              <ellipse cx="61" cy="41" rx="6.5" ry="7.5" fill="#ffffff" stroke="#78350f" strokeWidth="1.5" />

              {/* Pupils dynamically looking towards the mouse cursor! */}
              <circle cx={39 + mouseOffset.x} cy={41 + mouseOffset.y} r="4.3" fill="#451a03" />
              <circle cx={61 + mouseOffset.x} cy={41 + mouseOffset.y} r="4.3" fill="#451a03" />

              {/* Light glints in eyes moving smoothly with pupils */}
              <circle cx={39 + mouseOffset.x + 1.4} cy={41 + mouseOffset.y - 1.4} r="1.6" fill="#ffffff" />
              <circle cx={61 + mouseOffset.x + 1.4} cy={41 + mouseOffset.y - 1.4} r="1.6" fill="#ffffff" />
              <circle cx={39 + mouseOffset.x - 1.2} cy={41 + mouseOffset.y + 1.4} r="0.8" fill="#ffffff" />
              <circle cx={61 + mouseOffset.x - 1.2} cy={41 + mouseOffset.y + 1.4} r="0.8" fill="#ffffff" />

              {/* Subtle curious slight smile */}
              <path
                d="M 46 51 Q 50 54 54 51"
                fill="none"
                stroke="#451a03"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </g>
          )}
        </svg>

        {/* Click prompt note */}
        <span className="mt-1 text-[10px] font-semibold text-slate-400 group-hover:text-amber-300 transition-colors">
          ✨ Нажми на пешку!
        </span>
      </div>

      {/* Floating Win Chance Progress Bar */}
      <div className="mt-2 w-full max-w-[210px] flex flex-col items-center gap-1">
        <div className="flex items-center justify-between w-full px-1 text-[11px] font-bold">
          <span className="text-slate-400">Шансы на победу</span>
          <span
            className={`font-mono ${
              winProbability > 55
                ? 'text-emerald-400'
                : winProbability < 45
                ? 'text-red-400'
                : 'text-amber-400'
            }`}
          >
            {winProbability}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/80 p-0.5 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${moodConfig.barColor}`}
            style={{ width: `${winProbability}%` }}
          />
        </div>
      </div>
    </div>
  );
};
