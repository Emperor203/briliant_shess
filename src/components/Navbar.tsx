import React from 'react';
import { Volume2, VolumeX, RotateCw, Settings, FileText, Plus, Box, Layers } from 'lucide-react';

interface NavbarProps {
  viewMode: '2d' | '3d';
  onToggleViewMode: () => void;
  flipped: boolean;
  onFlipBoard: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSettings: () => void;
  onOpenFenPgn: () => void;
  onNewGame: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  viewMode,
  onToggleViewMode,
  flipped,
  onFlipBoard,
  soundEnabled,
  onToggleSound,
  onOpenSettings,
  onOpenFenPgn,
  onNewGame,
}) => {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/90 px-4 py-3 backdrop-blur-md">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <img
          src="/logo.jpg"
          alt="Бриллиантовые Шахматы"
          className="h-10 w-10 rounded-xl object-cover shadow-lg shadow-cyan-950/60 ring-2 ring-amber-400/40"
        />
        <div>
          <h1 className="text-base font-bold tracking-tight text-white m-0">
            Бриллиантовые Шахматы
          </h1>
          <p className="text-[11px] text-amber-300/80 font-medium m-0">Stockfish AI & 3D Анализ</p>
        </div>
      </div>

      {/* Action controls */}
      <div className="flex items-center gap-2">
        {/* 2D / 3D Toggle */}
        <button
          onClick={onToggleViewMode}
          className="flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-900/50 transition cursor-pointer shadow-sm"
          title="Быстрое переключение между 2D и 3D режимами"
        >
          {viewMode === '2d' ? (
            <>
              <Box className="h-4 w-4" />
              <span>3D Вид</span>
            </>
          ) : (
            <>
              <Layers className="h-4 w-4" />
              <span>2D Вид</span>
            </>
          )}
        </button>

        {/* Flip Board */}
        <button
          onClick={onFlipBoard}
          className="rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
          title="Повернуть доску"
        >
          <RotateCw className={`h-4 w-4 transition-transform duration-300 ${flipped ? 'rotate-180' : ''}`} />
        </button>

        {/* Sound toggle */}
        <button
          onClick={onToggleSound}
          className="rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
          title={soundEnabled ? 'Отключить звук' : 'Включить звук'}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4 text-cyan-400" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
        </button>

        {/* FEN / PGN */}
        <button
          onClick={onOpenFenPgn}
          className="rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
          title="Экспорт/Импорт FEN & PGN"
        >
          <FileText className="h-4 w-4" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
          title="Настройки игры и тем"
        >
          <Settings className="h-4 w-4" />
        </button>

        {/* New Game */}
        <button
          onClick={onNewGame}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-950/40 hover:from-emerald-500 hover:to-teal-400 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Новая игра</span>
        </button>
      </div>
    </header>
  );
};
