import React, { useState, useEffect } from 'react';
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
          gradient: 'from-amber-400 via-yellow-300 to-amber-500',
          aura: 'shadow-amber-500/30',
          icon: Trophy,
          barColor: 'bg-gradient-to-r from-amber-400 to-yellow-300',
        };
      case 'happy':
        return {
          title: 'Радуется (Ликует)',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
          gradient: 'from-emerald-400 via-cyan-300 to-teal-400',
          aura: 'shadow-emerald-500/30',
          icon: Sparkles,
          barColor: 'bg-gradient-to-r from-teal-400 to-emerald-400',
        };
      case 'sad':
      case 'defeat':
        return {
          title: 'Переживает (Грустит)',
          badgeBg: 'bg-red-500/20 text-red-300 border-red-400/40',
          gradient: 'from-red-400 via-rose-300 to-orange-400',
          aura: 'shadow-red-500/30',
          icon: AlertTriangle,
          barColor: 'bg-gradient-to-r from-red-500 to-rose-400',
        };
      case 'thinking_bot':
        return {
          title: 'Наблюдает за ботом',
          badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
          gradient: 'from-cyan-400 via-blue-300 to-indigo-400',
          aura: 'shadow-cyan-500/30',
          icon: RefreshCw,
          barColor: 'bg-gradient-to-r from-cyan-400 to-blue-500',
        };
      case 'draw':
      case 'thoughtful':
      default:
        return {
          title: 'Задумчивый (В фокусе)',
          badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
          gradient: 'from-amber-400 via-yellow-200 to-amber-500',
          aura: 'shadow-cyan-500/20',
          icon: HelpCircle,
          barColor: 'bg-gradient-to-r from-amber-400 to-yellow-400',
        };
    }
  };

  const moodConfig = getMoodConfig();
  const IconComponent = moodConfig.icon;

  return (
    <div
      className={`relative w-full rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 p-3 sm:p-3.5 shadow-2xl backdrop-blur-md transition-all duration-300 ${className}`}
    >
      {/* Header with Title and Mood Badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[11px] font-bold tracking-wider text-slate-300 uppercase">
            Талисман
          </span>
        </div>
        <div
          className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold transition-all ${moodConfig.badgeBg}`}
        >
          <IconComponent className="h-3 w-3" />
          <span>{moodConfig.title}</span>
        </div>
      </div>

      {/* Speech Bubble */}
      <div className="relative mb-2.5 rounded-xl border border-slate-700/80 bg-slate-800/90 p-2.5 shadow-lg backdrop-blur">
        <p className="text-xs font-medium leading-relaxed text-slate-100 text-center animate-in fade-in duration-300 select-none">
          «{speech}»
        </p>
        {/* Speech Bubble Arrow */}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 border-r border-b border-slate-700/80 rotate-45" />
      </div>

      {/* Interactive Mascot Pawn Character */}
      <div
        onClick={handlePawnClick}
        title="Нажми на пешку!"
        className={`relative group mx-auto flex flex-col items-center justify-center cursor-pointer select-none transition-transform duration-300 ${
          isBouncing ? 'scale-115 -rotate-6 animate-bounce' : 'hover:scale-105'
        }`}
      >
        {/* Ambient Glow Aura */}
        <div
          className={`absolute -inset-2 rounded-full opacity-30 blur-xl transition-all duration-500 bg-gradient-to-tr ${moodConfig.gradient}`}
        />

        {/* Floating accessory effects based on mood */}
        {mood === 'happy' && (
          <div className="absolute -top-3 flex items-center justify-between w-24 px-1 pointer-events-none animate-pulse">
            <span className="text-sm">✨</span>
            <span className="text-xs">⭐</span>
            <span className="text-sm">✨</span>
          </div>
        )}
        {mood === 'victory' && (
          <div className="absolute -top-4 text-xl animate-bounce pointer-events-none">
            👑
          </div>
        )}
        {mood === 'sad' && (
          <div className="absolute -top-2 flex items-center justify-center w-full pointer-events-none">
            <span className="text-xs opacity-70 animate-pulse">💧</span>
          </div>
        )}
        {mood === 'thoughtful' && (
          <div className="absolute -top-2.5 right-4 text-xs animate-pulse pointer-events-none">
            💭
          </div>
        )}
        {mood === 'thinking_bot' && (
          <div className="absolute -top-2 text-xs animate-spin pointer-events-none">
            ⚙️
          </div>
        )}

        {/* Vector SVG Pawn Mascot */}
        <svg
          viewBox="0 0 100 120"
          className="relative h-28 w-28 drop-shadow-[0_10px_15px_rgba(0,0,0,0.6)]"
        >
          <defs>
            {/* Body Golden / Pearlescent Gradient */}
            <linearGradient id="pawnBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="35%" stopColor="#facc15" />
              <stop offset="70%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>

            {/* Cyan Diamond Core Shine */}
            <radialGradient id="pawnHeadShine" cx="35%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#fef08a" stopOpacity="0.8" />
              <stop offset="85%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#a16207" />
            </radialGradient>

            {/* Base Shadow */}
            <linearGradient id="pawnBaseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
          </defs>

          {/* Pedestal Base */}
          <ellipse cx="50" cy="112" rx="34" ry="7" fill="#0f172a" opacity="0.4" />
          <path
            d="M 22 108 C 22 102, 78 102, 78 108 L 76 114 C 76 117, 24 117, 24 114 Z"
            fill="url(#pawnBaseGrad)"
            stroke="#713f12"
            strokeWidth="1.5"
          />
          <path
            d="M 28 98 C 28 94, 72 94, 72 98 L 74 105 C 74 107, 26 107, 26 105 Z"
            fill="url(#pawnBodyGrad)"
            stroke="#854d0e"
            strokeWidth="1"
          />

          {/* Curvy Pawn Waist & Torso */}
          <path
            d="M 38 68 C 38 78, 29 88, 28 96 L 72 96 C 71 88, 62 78, 62 68 Z"
            fill="url(#pawnBodyGrad)"
            stroke="#854d0e"
            strokeWidth="1.5"
          />

          {/* Neck Ring Collar */}
          <ellipse
            cx="50"
            cy="66"
            rx="16"
            ry="4.5"
            fill="#fef08a"
            stroke="#ca8a04"
            strokeWidth="1.5"
          />

          {/* Spherical Head */}
          <circle
            cx="50"
            cy="42"
            r="23"
            fill="url(#pawnHeadShine)"
            stroke="#854d0e"
            strokeWidth="1.5"
          />

          {/* Cute Rosy Blushing Cheeks */}
          <ellipse
            cx="34"
            cy="48"
            rx="4.5"
            ry="2.5"
            fill="#f43f5e"
            opacity={mood === 'happy' || mood === 'victory' ? 0.7 : 0.35}
          />
          <ellipse
            cx="66"
            cy="48"
            rx="4.5"
            ry="2.5"
            fill="#f43f5e"
            opacity={mood === 'happy' || mood === 'victory' ? 0.7 : 0.35}
          />

          {/* Dynamic Eyes & Face Features based on Mood */}
          {mood === 'happy' || mood === 'victory' ? (
            /* Joyful laughing curved eyes (^ ^) and beaming smile */
            <g>
              {/* Happy curved eyes */}
              <path
                d="M 33 41 Q 40 33 45 41"
                fill="none"
                stroke="#451a03"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <path
                d="M 55 41 Q 60 33 67 41"
                fill="none"
                stroke="#451a03"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              {/* Big open joyful smile */}
              <path
                d="M 40 47 Q 50 60 60 47 Z"
                fill="#881337"
                stroke="#451a03"
                strokeWidth="1.5"
              />
              <path d="M 44 51 Q 50 56 56 51" fill="#fda4af" />
              {/* Arms raised up in joy */}
              <path
                d="M 28 75 Q 16 65 14 55"
                fill="none"
                stroke="#ca8a04"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="13" cy="54" r="3" fill="#fef08a" stroke="#a16207" />
              <path
                d="M 72 75 Q 84 65 86 55"
                fill="none"
                stroke="#ca8a04"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="87" cy="54" r="3" fill="#fef08a" stroke="#a16207" />
            </g>
          ) : mood === 'sad' || mood === 'defeat' ? (
            /* Sad worried droopy eyes and trembling mouth */
            <g>
              {/* Worried eyebrows */}
              <path
                d="M 34 33 L 44 36"
                stroke="#451a03"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M 66 33 L 56 36"
                stroke="#451a03"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Big sad tearful eyes */}
              <circle cx="39" cy="42" r="4.5" fill="#451a03" />
              <circle cx="61" cy="42" r="4.5" fill="#451a03" />
              <circle cx="41" cy="40" r="1.5" fill="#ffffff" />
              <circle cx="63" cy="40" r="1.5" fill="#ffffff" />
              {/* Glistening animated tear drops */}
              <path
                d="M 38 48 C 38 52, 42 54, 42 56 C 42 58, 38 59, 36 56 C 35 54, 38 50, 38 48 Z"
                fill="#38bdf8"
                opacity="0.9"
              />
              {/* Trembling sad downward mouth */}
              <path
                d="M 43 54 Q 50 49 57 54"
                fill="none"
                stroke="#451a03"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Hands holding cheeks in concern */}
              <circle cx="28" cy="56" r="3.5" fill="#fef08a" stroke="#a16207" />
              <circle cx="72" cy="56" r="3.5" fill="#fef08a" stroke="#a16207" />
            </g>
          ) : (
            /* Thoughtful / Contemplative: Eyes looking up & pondering */
            <g>
              {/* Inquisitive eyebrows */}
              <path
                d="M 34 34 Q 40 31 44 35"
                stroke="#451a03"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M 56 35 Q 60 30 66 33"
                stroke="#451a03"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Eyes looking up and slightly to the right */}
              <circle cx="40" cy="41" r="4.2" fill="#451a03" />
              <circle cx="60" cy="41" r="4.2" fill="#451a03" />
              {/* Light glint in eyes */}
              <circle cx="41.5" cy="39.5" r="1.6" fill="#ffffff" />
              <circle cx="61.5" cy="39.5" r="1.6" fill="#ffffff" />
              {/* Subtle curious / thoughtful mouth */}
              <path
                d="M 46 51 Q 50 53 54 50"
                fill="none"
                stroke="#451a03"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              {/* Little cute glasses or hand to chin */}
              <circle
                cx="40"
                cy="41"
                r="7.5"
                fill="none"
                stroke="#ca8a04"
                strokeWidth="1.2"
                opacity="0.7"
              />
              <circle
                cx="60"
                cy="41"
                r="7.5"
                fill="none"
                stroke="#ca8a04"
                strokeWidth="1.2"
                opacity="0.7"
              />
              <line
                x1="47.5"
                y1="41"
                x2="52.5"
                y2="41"
                stroke="#ca8a04"
                strokeWidth="1.2"
                opacity="0.7"
              />
              {/* Hand to chin gesture */}
              <circle cx="56" cy="58" r="3.5" fill="#fef08a" stroke="#a16207" />
            </g>
          )}
        </svg>

        {/* Click prompt note */}
        <span className="mt-1 text-[10px] font-semibold text-slate-400 group-hover:text-amber-300 transition-colors">
          ✨ Нажми на пешку!
        </span>
      </div>

      {/* Win Chance Progress Bar */}
      <div className="mt-3 pt-2.5 border-t border-slate-800">
        <div className="flex items-center justify-between text-[11px] font-bold mb-1">
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
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${moodConfig.barColor}`}
            style={{ width: `${winProbability}%` }}
          />
        </div>
      </div>
    </div>
  );
};
