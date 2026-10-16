import type { BoardTheme, BotDifficulty, MoveQuality, TimeControlConfig } from '../types/chess';

export const BOARD_THEMES: Record<string, BoardTheme> = {
  classic: {
    id: 'classic',
    name: 'Классическая (Зеленая)',
    lightSquare: '#eeeed2',
    darkSquare: '#769656',
    lightSquare3D: 0xeeeed2,
    darkSquare3D: 0x769656,
    boardBorder: '#4a6237',
    accent: '#86efac',
    background: '#131b14',
  },
  wood: {
    id: 'wood',
    name: 'Благородное Дерево',
    lightSquare: '#ebd4b0',
    darkSquare: '#a66d40',
    lightSquare3D: 0xebd4b0,
    darkSquare3D: 0xa66d40,
    boardBorder: '#5c3a1e',
    accent: '#f59e0b',
    background: '#1c1510',
  },
  neon: {
    id: 'neon',
    name: 'Киберпанк Неон',
    lightSquare: '#1e293b',
    darkSquare: '#0f172a',
    lightSquare3D: 0x1e293b,
    darkSquare3D: 0x0f172a,
    boardBorder: '#06b6d4',
    accent: '#06b6d4',
    background: '#090d16',
  },
  marble: {
    id: 'marble',
    name: 'Мрамор (Каррара)',
    lightSquare: '#e2e8f0',
    darkSquare: '#64748b',
    lightSquare3D: 0xe2e8f0,
    darkSquare3D: 0x64748b,
    boardBorder: '#334155',
    accent: '#38bdf8',
    background: '#0f172a',
  },
  minimal: {
    id: 'minimal',
    name: 'Минималистичная Темная',
    lightSquare: '#334155',
    darkSquare: '#1e293b',
    lightSquare3D: 0x334155,
    darkSquare3D: 0x1e293b,
    boardBorder: '#0f172a',
    accent: '#a855f7',
    background: '#090a0f',
  },
};

export const BOT_DIFFICULTIES: BotDifficulty[] = [
  { level: 1, name: 'Новичок', depth: 1, skillLevel: 0, blunderProb: 0.35, description: 'Делает частые зевки и случайные ходы', rating: 600 },
  { level: 2, name: 'Любитель', depth: 2, skillLevel: 3, blunderProb: 0.20, description: 'Базовое понимание ценности фигур', rating: 900 },
  { level: 3, name: 'Клубный игрок', depth: 4, skillLevel: 6, blunderProb: 0.10, description: 'Видит тактические комбинации в 1-2 хода', rating: 1200 },
  { level: 4, name: 'Продвинутый', depth: 6, skillLevel: 10, blunderProb: 0.05, description: 'Хорошее развитие фигур и контроль центра', rating: 1500 },
  { level: 5, name: 'Эксперт', depth: 8, skillLevel: 13, blunderProb: 0.02, description: 'Надежная позиционная игра и точные расчеты', rating: 1800 },
  { level: 6, name: 'Мастер', depth: 10, skillLevel: 16, blunderProb: 0.0, description: 'Глубокий расчет и минимизация неточностей', rating: 2100 },
  { level: 7, name: 'Международный мастер', depth: 13, skillLevel: 19, blunderProb: 0.0, description: 'Стратегическое давление и безупречный эндшпиль', rating: 2400 },
  { level: 8, name: 'Гроссмейстер (Stockfish Max)', depth: 16, skillLevel: 20, blunderProb: 0.0, description: 'Максимальная мощь движка Stockfish', rating: 2850 },
];

export const TIME_CONTROLS: TimeControlConfig[] = [
  { id: 'none', name: 'Без времени', initialSeconds: 0, incrementSeconds: 0 },
  { id: '1+0', name: '1 мин (Пуля)', initialSeconds: 60, incrementSeconds: 0 },
  { id: '3+0', name: '3 мин (Блиц)', initialSeconds: 180, incrementSeconds: 0 },
  { id: '5+3', name: '5+3 (Блиц+)', initialSeconds: 300, incrementSeconds: 3 },
  { id: '10+0', name: '10 мин (Рапид)', initialSeconds: 600, incrementSeconds: 0 },
];

export const MOVE_BADGES: Record<MoveQuality, { label: string; icon: string; color: string; bg: string; border: string }> = {
  brilliant: {
    label: 'Бриллиантовый',
    icon: '💎',
    color: '#06b6d4',
    bg: 'bg-cyan-500/20 text-cyan-300',
    border: 'border-cyan-400',
  },
  best: {
    label: 'Лучший',
    icon: '⭐️',
    color: '#22c55e',
    bg: 'bg-green-500/20 text-green-300',
    border: 'border-green-400',
  },
  excellent: {
    label: 'Отличный',
    icon: '👍',
    color: '#84cc16',
    bg: 'bg-lime-500/20 text-lime-300',
    border: 'border-lime-400',
  },
  good: {
    label: 'Хороший',
    icon: '👌',
    color: '#a3e635',
    bg: 'bg-emerald-500/15 text-emerald-300',
    border: 'border-emerald-400',
  },
  inaccuracy: {
    label: 'Неточность',
    icon: '❓',
    color: '#eab308',
    bg: 'bg-yellow-500/20 text-yellow-300',
    border: 'border-yellow-400',
  },
  mistake: {
    label: 'Ошибка',
    icon: '⚠️',
    color: '#f97316',
    bg: 'bg-orange-500/20 text-orange-300',
    border: 'border-orange-400',
  },
  blunder: {
    label: 'Зевок',
    icon: '❌',
    color: '#ef4444',
    bg: 'bg-red-500/20 text-red-300',
    border: 'border-red-400',
  },
};

export const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};
