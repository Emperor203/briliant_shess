import React, { useEffect, useRef } from 'react';
import type { MoveAnalysis } from '../types/chess';
import { MOVE_BADGES } from '../constants/chessData';
import { ChevronLeft, ChevronRight, X, RotateCcw } from 'lucide-react';

interface CoachReviewBarProps {
  history: MoveAnalysis[];
  currentStepIndex: number;
  onJumpToStep: (index: number) => void;
  onExitReview: () => void;
  materialDiff: number; // Positive = White advantage, Negative = Black
}

// Chess Professor (Grandfather in Tweed Jacket) Vector SVG
export const ChessProfessorSvg: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none">
    {/* Background Soft Glow */}
    <circle cx="32" cy="32" r="30" fill="#451a03" opacity="0.3" />

    {/* Tweed Jacket Shoulders */}
    <path
      d="M 10 62 C 10 46, 18 40, 25 38 L 39 38 C 46 40, 54 46, 54 62 Z"
      fill="#78350f"
      stroke="#451a03"
      strokeWidth="1.5"
    />

    {/* Tweed Herringbone Pattern Highlights */}
    <path
      d="M 14 56 L 18 52 M 16 60 L 20 56 M 46 52 L 50 56 M 44 56 L 48 60 M 18 48 L 22 44"
      stroke="#92400e"
      strokeWidth="1.2"
      strokeLinecap="round"
      opacity="0.6"
    />

    {/* Crisp Cream Shirt Collar */}
    <polygon points="26,38 38,38 32,49" fill="#fef3c7" stroke="#d97706" strokeWidth="0.8" />

    {/* Classic Burgundy Bow Tie */}
    <polygon points="27,42 37,45 37,42 27,45" fill="#991b1b" />
    <circle cx="32" cy="43.5" r="1.8" fill="#7f1d1d" stroke="#f59e0b" strokeWidth="0.5" />

    {/* Tweed Jacket Lapels */}
    <path
      d="M 23 39 L 29 55 L 32 46 L 35 55 L 41 39"
      fill="none"
      stroke="#451a03"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Mechanical Pocket Watch & Golden Chain */}
    <path
      d="M 33 53 Q 40 58 45 52"
      fill="none"
      stroke="#f59e0b"
      strokeWidth="1.4"
      strokeDasharray="1.5 1.5"
    />
    <circle cx="46" cy="51" r="3.2" fill="#fef08a" stroke="#b45309" strokeWidth="1" />
    <line x1="46" y1="49.5" x2="46" y2="51" stroke="#b45309" strokeWidth="0.8" />
    <line x1="46" y1="51" x2="47.2" y2="51" stroke="#b45309" strokeWidth="0.8" />

    {/* Leather Notepad in Breast Pocket */}
    <rect
      x="16"
      y="47"
      width="7.5"
      height="10"
      rx="1.2"
      fill="#3e2312"
      stroke="#78350f"
      strokeWidth="0.8"
      transform="rotate(-8 19 52)"
    />
    <line x1="17" y1="46" x2="17" y2="50" stroke="#dc2626" strokeWidth="1.2" />

    {/* Grandfather Head */}
    <ellipse cx="32" cy="24" rx="13" ry="14" fill="#fed7aa" stroke="#78350f" strokeWidth="1.2" />

    {/* Distinguished Silver Hair */}
    <path
      d="M 19 23 C 18 13, 23 8, 32 8 C 41 8, 46 13, 45 23 C 43 14, 38 12, 32 12 C 26 12, 21 14, 19 23 Z"
      fill="#e2e8f0"
      stroke="#94a3b8"
      strokeWidth="1"
    />
    {/* Courtyard Grandfather Classic Flat Cap (Кепка-восьмиклинка деда Михалыча) */}
    <ellipse cx="32" cy="13.5" rx="14.5" ry="6.5" fill="#475569" stroke="#1e293b" strokeWidth="1.2" />
    <path d="M 18 14 Q 32 8.5 46 14 Q 32 17.5 18 14 Z" fill="#64748b" />
    <path d="M 20 15.5 Q 32 20 44 15.5 Q 32 17 20 15.5 Z" fill="#334155" />
    <circle cx="32" cy="11.5" r="1.4" fill="#1e293b" />
    {/* Hair volume on sides */}
    <path d="M 19 22 C 17 25, 18 31, 20 33" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M 45 22 C 47 25, 46 31, 44 33" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />

    {/* Friendly Eyebrows */}
    <path d="M 23 18 Q 27 16 30 19" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
    <path d="M 41 18 Q 37 16 34 19" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />

    {/* Round Wire-rimmed Glasses */}
    <circle cx="26.5" cy="23.5" r="5" stroke="#d97706" strokeWidth="1.6" fill="#ffffff" fillOpacity="0.4" />
    <circle cx="37.5" cy="23.5" r="5" stroke="#d97706" strokeWidth="1.6" fill="#ffffff" fillOpacity="0.4" />
    <line x1="31.5" y1="23.5" x2="32.5" y2="23.5" stroke="#d97706" strokeWidth="1.6" />

    {/* Wise Eyes with sparkles */}
    <circle cx="26.5" cy="23.5" r="2.2" fill="#1e293b" />
    <circle cx="37.5" cy="23.5" r="2.2" fill="#1e293b" />
    <circle cx="25.6" cy="22.6" r="0.8" fill="#ffffff" />
    <circle cx="36.6" cy="22.6" r="0.8" fill="#ffffff" />

    {/* Cheerful Grandfather Mustache */}
    <path
      d="M 24 30 Q 32 30 32 33 Q 32 30 40 30 Q 37 34 32 34 Q 27 34 24 30 Z"
      fill="#f1f5f9"
      stroke="#cbd5e1"
      strokeWidth="0.8"
    />
  </svg>
);

// Backward compatibility alias
export const CoachOwlSvg = ChessProfessorSvg;

export const CoachReviewBar: React.FC<CoachReviewBarProps> = ({
  history,
  currentStepIndex,
  onJumpToStep,
  onExitReview,
}) => {
  const activeMove: MoveAnalysis | undefined =
    currentStepIndex >= 0 && currentStepIndex < history.length
      ? history[currentStepIndex]
      : undefined;

  // Determine Coach Speech text (Дед Михалыч со двора)
  const getCoachSpeech = () => {
    if (currentStepIndex < 0 || !activeMove) {
      return '«Здорово, салага! Присаживайся за столик, я тут газетку постелил, чайку из термоса налил. Давай разберём твои дворовые баталии по-нашему!»';
    }

    const san = activeMove.san || '';
    const isMate = san.includes('#');
    const isCheck = san.includes('+');
    const isCastle = san.startsWith('O-O');
    const isKnight = san.startsWith('N');
    const isBishop = san.startsWith('B');
    const isRook = san.startsWith('R');

    // Contextual seed for stable variety per move
    const seed = (currentStepIndex * 17 + (san.charCodeAt(0) || 7) + san.length * 3) % 100;

    // 1. Checkmate
    if (isMate) {
      if (activeMove.quality === 'blunder' || activeMove.quality === 'mistake') {
        return '❌ «Мат тебе, суши вёсла! Я ж орал: короля прячь, а не ворон считай! Всё, иди мужикам за квасом.»';
      }
      return '🏆 «Шах и мат! Ай да шлёпнул фигурой! Вся лавочка встала и аплодирует, ай красава!»';
    }

    // 2. Castling
    if (isCastle) {
      const castlePhrases = [
        '🏰 «Рокировочка! Забился монарх в угол, как кот под "Жигули" от дождя. Зато цел будет!»',
        '🏰 «Правильно, короля в домик, ладью в драку. У нас во дворе без рокировки до пятого хода не доживают!»',
        '🏰 «Забаррикадировался дедовским методом! Теперь пусть супостат попробует до тебя докопаться.»'
      ];
      return castlePhrases[seed % castlePhrases.length];
    }

    // 3. Early Opening book moves
    if (currentStepIndex <= 3 || activeMove.quality === 'book') {
      const bookPhrases = [
        '📖 «Ну, пошла родимая! По нашей старой дворовой книжке шпаришь, одобряю.»',
        '📖 «Пешку в центр, коня на волю — классика нашего двора с 1978 года!»',
        '📖 «Начало бодрое, салага! Главное теперь — дойти до середины партии без синяков.»',
        '📖 «Дебют по нотам. Михалыч на первенстве завода точь-в-точь так же за белых начинал!»'
      ];
      return bookPhrases[seed % bookPhrases.length];
    }

    // 4. Check
    if (isCheck && (activeMove.quality === 'best' || activeMove.quality === 'brilliant' || activeMove.quality === 'good' || activeMove.quality === 'excellent')) {
      const checkPhrases = [
        `⚔️ «Шах! Принимай подарочек от Михалыча (${san})! Не давай ему очухаться, крути гайки!»`,
        `⚔️ «Шах тебе! Смотри, как засуетился супостат, заёрзал на табуретке!»`,
        `⚔️ «Шажок! Проверяем нервишки соперника на прочность, классический дворовый наезд!»`
      ];
      return checkPhrases[seed % checkPhrases.length];
    }

    const rec = activeMove.bestMove ? ` Надо было ${activeMove.bestMove} ходить!` : '';

    switch (activeMove.quality) {
      case 'brilliant': {
        const brilliantPhrases = [
          '💎 «Ёлы-палы, вот это шлёпнул так шлёпнул! Я такую красоту только в "Советском спорте" за 82-й год видел!»',
          '💎 «Браво, салага! Пожертвовал фигуру, как последнюю мелочь на мороженое, и разнёс всё в щепки!»',
          '💎 «Вот за такие ходы я шахматы во дворе сорок лет и уважаю! Снимаю кепку, чистый гений!»',
          '💎 «Обалдеть! Сам Таль во дворе так не крутил! За такой ход тебе положена двойная порция чая!»'
        ];
        return brilliantPhrases[seed % brilliantPhrases.length];
      }

      case 'best': {
        let bestPhrases = [
          '⭐️ «Лошадью ходи, говоришь? А сам-то сыграл идеально! Железный ход, не подкопаешься.»',
          '⭐️ «Точно в яблочко! Мужики на соседней лавке одобрительно кивнули — ход высший сорт!»',
          '⭐️ «Ай, молодца! Сильно, строго, по-дворовому солидно. Занял центр и держишь мёртвой хваткой.»',
          '⭐️ «Ни убавить, ни прибавить. Твой компьютер полчаса пыхтел бы, а дед Михалыч сразу видит силу!»',
          '⭐️ «Красота! Фигуры стоят ровно, как "Волги" у обкома партии — любо-дорого смотреть.»'
        ];
        if (isKnight) {
          bestPhrases.push('⭐️ «Конь в центре встал, как дворовый сторож у ворот! Никого не пропустит!»');
        } else if (isBishop) {
          bestPhrases.push('⭐️ «Слон режет доску по диагонали, как огурец к обеду! Отличный ход!»');
        } else if (isRook) {
          bestPhrases.push('⭐️ «Ладья на открытой линии встала! Теперь супостату мало не покажется!»');
        }
        return bestPhrases[seed % bestPhrases.length];
      }

      case 'excellent':
      case 'good': {
        const goodPhrases = [
          '👍 «Добротно шлёпнул. Позиция крепкая, как советский верстак, нигде не люфтит.»',
          '👍 «По уму сыграно. Главное — не суетиться, как первоклашка у доски, партия сама придёт.»',
          '👍 «Одобряю! Фигурки потихоньку ползут вперёд, берут супостата в клещи.»',
          '👍 «Хороший, рабочий ход. Без выкрутасов, зато надёжно, по-нашему.»',
          '👍 «Нормально-нормально, каша варится. Держи строй, салага!»'
        ];
        return goodPhrases[seed % goodPhrases.length];
      }

      case 'inaccuracy': {
        const inaccuracyPhrases = [
          `❓ «Хм... Зачем так-то? Сам себе подножку ставишь на ровном асфальте.${rec}»`,
          `❓ «Слабовато, дружище. Чуть-чуть не дожал, отдал кусок инициативы.${rec}»`,
          `❓ «Поспешил — мужиков на лавке насмешил! Тут подумать надо было, а ты рукой махнул.${rec}»`,
          `❓ «Эх, ни два ни полтора ход. Зачем инициативу супостату за просто так отдавать?${rec}»`,
          `❓ «Взялся — ходи, но головой-то крути! Позиция начинает подтекать, как старый кран.${rec}»`
        ];
        return inaccuracyPhrases[seed % inaccuracyPhrases.length];
      }

      case 'mistake': {
        const mistakePhrases = [
          `⚠️ «Эх ты, голова садовая! Кто ж так играет?! Мы ж во дворе это сто раз разбирали!${rec}»`,
          `⚠️ «Куда потянул фигуру?! Её ж там сейчас на запчасти разберут дворовые коты!${rec}»`,
          `⚠️ «Опасное дело затеял! Позицию раскурочил так, что хоть караул кричи!${rec}»`,
          `⚠️ «Вот молодёжь пошла... Всё бы шашкой махать сломя голову! Считать надо!${rec}»`,
          `⚠️ «Ай-яй-яй, отдал важное поле! Теперь придётся в глухой обороне пыхтеть!${rec}»`
        ];
        return mistakePhrases[seed % mistakePhrases.length];
      }

      case 'blunder': {
        const blunderPhrases = [
          `❌ «Батюшки-светы, зевок века! Ты кем в детстве быть хотел — благотворителем?!${rec}»`,
          `❌ «Ох, держите меня семеро! За такой ход у нас во дворе чай без сахара наливают!${rec}»`,
          `❌ «Катастрофа районного масштаба! Король голый, фигуры висят... Ну куда ты лезешь?!${rec}»`,
          `❌ «Эх, салага... Век учи, всё равно зевнёшь. Срочно пей водички, горим ведь синим пламенем!${rec}»`,
          `❌ «Зевок на весь двор! Мужики с соседнего стола уже хихикают. Соберись, тряпка!${rec}»`
        ];
        return blunderPhrases[seed % blunderPhrases.length];
      }

      default:
        return '⭐️ «Сильный дворовый ход. Держим оборону!»';
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onJumpToStep(Math.max(-1, currentStepIndex - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onJumpToStep(Math.min(history.length - 1, currentStepIndex + 1));
      } else if (e.key === 'Escape') {
        onExitReview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStepIndex, history.length, onJumpToStep, onExitReview]);

  return (
    <div className="w-full flex flex-col gap-2 sm:gap-3">
      {/* 1. TOP: Professor Speech Card */}
      <div className="relative flex items-center gap-2 sm:gap-3 rounded-2xl border border-amber-900/40 bg-slate-900/95 p-2 sm:p-3.5 shadow-2xl backdrop-blur-md">
        {/* Professor Mascot Avatar */}
        <div className="relative shrink-0 flex items-center justify-center h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-amber-900 via-amber-800 to-amber-700 p-0.5 sm:p-1 shadow-lg shadow-amber-950/40 border border-amber-600/30">
          <ChessProfessorSvg className="h-full w-full drop-shadow-md" />
        </div>

        {/* White Speech Bubble */}
        <div className="relative flex-1 rounded-xl sm:rounded-2xl bg-white px-2.5 sm:px-4 py-2 sm:py-3 text-slate-900 shadow-md border border-slate-200 min-w-0">
          {/* Bubble pointer tail */}
          <div className="absolute top-3.5 -left-1.5 sm:top-4 sm:-left-2 h-3 w-3 sm:h-3.5 sm:w-3.5 rotate-45 bg-white border-l border-b border-slate-200" />

          <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5 truncate">
              <span>👴🏼</span>
              <span className="truncate">Дед Михалыч (со двора)</span>
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono shrink-0">
              {currentStepIndex >= 0
                ? `Ход ${Math.floor(currentStepIndex / 2) + 1} из ${Math.max(1, Math.ceil(history.length / 2))}`
                : 'Начало'}
            </span>
          </div>

          <p className="text-[11px] sm:text-sm font-semibold leading-snug text-slate-800">
            {getCoachSpeech()}
          </p>
        </div>

        {/* Action Buttons inside Coach Card */}
        <div className="shrink-0 flex items-center gap-1 sm:gap-1.5">
          <button
            onClick={() => onJumpToStep(Math.max(-1, currentStepIndex - 1))}
            disabled={currentStepIndex <= -1}
            className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer shadow-sm"
            title="Назад на 1 ход (←)"
          >
            <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
          <button
            onClick={() => onJumpToStep(Math.min(history.length - 1, currentStepIndex + 1))}
            disabled={currentStepIndex >= history.length - 1}
            className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer shadow-md shadow-blue-900/40"
            title="Далее (→)"
          >
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
          <button
            onClick={onExitReview}
            className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-slate-700 bg-slate-800/80 text-slate-400 hover:bg-red-950/40 hover:border-red-500/50 hover:text-red-300 transition cursor-pointer ml-0.5 sm:ml-1"
            title="Завершить разбор и вернуться к игре (Esc)"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Bottom controls component (rendered directly beneath the chessboard)
interface CoachReviewControlsProps {
  history: MoveAnalysis[];
  currentStepIndex: number;
  onJumpToStep: (index: number) => void;
  materialDiff: number;
}

export const CoachReviewControls: React.FC<CoachReviewControlsProps> = ({
  history,
  currentStepIndex,
  onJumpToStep,
  materialDiff,
}) => {
  const ribbonRef = useRef<HTMLDivElement>(null);
  const activeChipRef = useRef<HTMLButtonElement | null>(null);

  const canGoPrev = currentStepIndex > -1;
  const canGoNext = currentStepIndex < history.length - 1;

  // Auto-scroll active move in horizontal ribbon
  useEffect(() => {
    if (activeChipRef.current) {
      activeChipRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    } else if (ribbonRef.current && currentStepIndex < 0) {
      ribbonRef.current.scrollLeft = 0;
    }
  }, [currentStepIndex]);

  // Format material badge string
  const formatMaterial = () => {
    if (materialDiff === 0) return 'Материал =';
    if (materialDiff > 0) return `+${materialDiff} Белые`;
    return `+${Math.abs(materialDiff)} Черные`;
  };

  return (
    <div className="w-full flex flex-col gap-2.5 mt-2.5">
      {/* Material Balance Pill */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/90 px-3.5 py-1 text-xs font-bold text-slate-200 shadow-md">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>{formatMaterial()}</span>
        </div>
      </div>

      {/* Horizontal Scrollable Move Ribbon (1. 📖 d4  📖 Nf6  2. ⭐️ e4 ...) */}
      <div
        ref={ribbonRef}
        className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 rounded-xl border border-slate-800 bg-slate-900/80 shadow-inner scroll-smooth no-scrollbar"
        style={{ scrollbarWidth: 'none' }}
      >
        {/* Start Position Chip */}
        <button
          onClick={() => onJumpToStep(-1)}
          className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-mono font-bold transition cursor-pointer ${
            currentStepIndex === -1
              ? 'bg-blue-600 text-white ring-2 ring-blue-400 shadow-md'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          Начало
        </button>

        {history.map((move, idx) => {
          const isActive = currentStepIndex === idx;
          const turnNumber = Math.floor(idx / 2) + 1;
          const isWhite = move.color === 'w';

          // Use book badge for early moves if classified as best/good
          const effectiveQuality =
            idx <= 3 && (move.quality === 'best' || move.quality === 'good' || move.quality === 'excellent')
              ? 'book'
              : move.quality;

          const badge = MOVE_BADGES[effectiveQuality] || MOVE_BADGES.best;

          return (
            <React.Fragment key={idx}>
              {/* Turn prefix before white move */}
              {isWhite && (
                <span className="text-xs font-semibold text-slate-500 ml-1">
                  {turnNumber}.
                </span>
              )}

              <button
                ref={isActive ? activeChipRef : null}
                onClick={() => onJumpToStep(idx)}
                className={`shrink-0 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-mono transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-300 shadow-lg scale-105'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                }`}
              >
                <span className="text-[11px]">{badge.icon}</span>
                <span className="font-semibold">{move.san}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Bottom Navigation Buttons: ‹ Назад (gray) and Далее › (big bright blue) */}
      <div className="flex items-center gap-3 pt-1">
        {/* ‹ Назад Button */}
        <button
          onClick={() => onJumpToStep(Math.max(-1, currentStepIndex - 1))}
          disabled={!canGoPrev}
          className="flex items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-bold text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer shadow-md min-w-[110px]"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Назад</span>
        </button>

        {/* Далее › Button (Big bright blue) */}
        {canGoNext ? (
          <button
            onClick={() => onJumpToStep(Math.min(history.length - 1, currentStepIndex + 1))}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] px-6 py-3 text-sm font-bold text-white shadow-xl shadow-blue-900/50 transition cursor-pointer"
          >
            <span>Далее</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => onJumpToStep(-1)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-emerald-950/40 transition cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>В начало разбора</span>
          </button>
        )}
      </div>
    </div>
  );
};
