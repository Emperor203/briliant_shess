import React from 'react';
import type { GameSettings, BoardThemeId, PieceStyleId, PlayerSide } from '../types/chess';
import { BOARD_THEMES, BOT_DIFFICULTIES, TIME_CONTROLS } from '../constants/chessData';
import { X, Volume2, VolumeX, Eye, Palette, Cpu, Clock, Navigation, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onRestartGame: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onRestartGame,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-bold">Настройки игры</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Bot Difficulty */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <span>Уровень сложности бота</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BOT_DIFFICULTIES.map((bot) => (
                <button
                  key={bot.level}
                  onClick={() => onUpdateSettings({ botLevel: bot.level })}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs transition cursor-pointer ${
                    settings.botLevel === bot.level
                      ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300 ring-1 ring-cyan-400/50'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  <span className="font-bold text-sm">Ур. {bot.level}</span>
                  <span className="truncate max-w-full text-[11px] opacity-80">{bot.name}</span>
                  <span className="font-mono text-[10px] text-cyan-400">{bot.rating}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Player Side */}
          <div>
            <label className="text-sm font-semibold text-slate-300 block mb-2">Выбор стороны</label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'w', label: 'Белые', icon: '⚪' },
                  { id: 'random', label: 'Случайно', icon: '🎲' },
                  { id: 'b', label: 'Черные', icon: '⚫' },
                ] as const
              ).map((side) => (
                <button
                  key={side.id}
                  onClick={() => onUpdateSettings({ playerColor: side.id as PlayerSide })}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition cursor-pointer ${
                    settings.playerColor === side.id
                      ? 'border-cyan-400 bg-cyan-950/50 text-cyan-300'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span>{side.icon}</span>
                  <span>{side.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Time Control */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span>Контроль времени</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TIME_CONTROLS.map((tc) => (
                <button
                  key={tc.id}
                  onClick={() => onUpdateSettings({ timeControl: tc.id })}
                  className={`rounded-xl border p-2 text-xs font-semibold transition cursor-pointer text-center ${
                    settings.timeControl === tc.id
                      ? 'border-cyan-400 bg-cyan-950/50 text-cyan-300'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {tc.name}
                </button>
              ))}
            </div>
          </div>

          {/* Board Themes */}
          <div>
            <label className="text-sm font-semibold text-slate-300 block mb-2">Тема доски</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(BOARD_THEMES).map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => onUpdateSettings({ boardTheme: theme.id as BoardThemeId })}
                  className={`flex items-center gap-3 rounded-xl border p-2.5 text-xs font-semibold transition cursor-pointer ${
                    settings.boardTheme === theme.id
                      ? 'border-cyan-400 bg-cyan-950/50 text-cyan-300'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex h-5 w-5 shrink-0 overflow-hidden rounded border border-slate-700">
                    <div className="w-1/2 h-full" style={{ backgroundColor: theme.lightSquare }} />
                    <div className="w-1/2 h-full" style={{ backgroundColor: theme.darkSquare }} />
                  </div>
                  <span className="truncate">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Piece Styles */}
          <div>
            <label className="text-sm font-semibold text-slate-300 block mb-2">Стиль фигур</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'staunton', label: 'Staunton' },
                  { id: 'neo', label: 'Neo' },
                  { id: 'pixel', label: 'Pixel Art' },
                  { id: 'wood', label: 'Wood Carved' },
                ] as const
              ).map((style) => (
                <button
                  key={style.id}
                  onClick={() => onUpdateSettings({ pieceStyle: style.id as PieceStyleId })}
                  className={`rounded-xl border p-2.5 text-xs font-semibold text-center transition cursor-pointer ${
                    settings.pieceStyle === style.id
                      ? 'border-cyan-400 bg-cyan-950/50 text-cyan-300'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300 flex items-center gap-2">
                {settings.soundEnabled ? <Volume2 className="h-4 w-4 text-cyan-400" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
                Звуковые эффекты
              </span>
              <button
                onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`h-6 w-11 rounded-full p-0.5 transition-colors cursor-pointer ${
                  settings.soundEnabled ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
                    settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300 flex items-center gap-2">
                <Eye className="h-4 w-4 text-cyan-400" />
                Отображать шкалу оценки (Eval Bar)
              </span>
              <button
                onClick={() => onUpdateSettings({ showEvalBar: !settings.showEvalBar })}
                className={`h-6 w-11 rounded-full p-0.5 transition-colors cursor-pointer ${
                  settings.showEvalBar ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
                    settings.showEvalBar ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm text-slate-300 flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-cyan-400" />
                  Стрелки ходов на доске
                </span>
                <span className="text-[11px] text-slate-500 ml-6">
                  Показывать стрелки перемещения и рекомендаций
                </span>
              </div>
              <button
                onClick={() => onUpdateSettings({ showArrows: !settings.showArrows })}
                className={`h-6 w-11 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                  settings.showArrows ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
                    settings.showArrows ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm text-slate-300 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Шахматный питомец (Пешка-талисман)
                </span>
                <span className="text-[11px] text-slate-500 ml-6">
                  Анимированная пешка, реагирующая на перевес и ход игры
                </span>
              </div>
              <button
                onClick={() => onUpdateSettings({ showPet: !settings.showPet })}
                className={`h-6 w-11 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                  settings.showPet !== false ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
                    settings.showPet !== false ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            onClick={() => {
              onClose();
              onRestartGame();
            }}
            className="rounded-xl border border-red-500/50 bg-red-950/40 px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-900/50 transition cursor-pointer"
          >
            Применить и начать новую партию
          </button>
          <button
            onClick={onClose}
            className="rounded-xl bg-cyan-600 px-5 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition cursor-pointer"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
