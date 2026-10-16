import React, { useState } from 'react';
import { X, Copy, Check, Download, Upload } from 'lucide-react';

interface FenPgnModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFen: string;
  currentPgn: string;
  onLoadFen: (fen: string) => boolean;
}

export const FenPgnModal: React.FC<FenPgnModalProps> = ({
  isOpen,
  onClose,
  currentFen,
  currentPgn,
  onLoadFen,
}) => {
  const [activeTab, setActiveTab] = useState<'fen' | 'pgn'>('fen');
  const [fenInput, setFenInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedFen, setCopiedFen] = useState(false);
  const [copiedPgn, setCopiedPgn] = useState(false);

  if (!isOpen) return null;

  const handleCopyFen = () => {
    navigator.clipboard.writeText(currentFen);
    setCopiedFen(true);
    setTimeout(() => setCopiedFen(false), 2000);
  };

  const handleCopyPgn = () => {
    navigator.clipboard.writeText(currentPgn);
    setCopiedPgn(true);
    setTimeout(() => setCopiedPgn(false), 2000);
  };

  const handleDownloadPgn = () => {
    const blob = new Blob([currentPgn], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chess-game-${new Date().toISOString().slice(0, 10)}.pgn`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyFen = () => {
    setErrorMsg('');
    const trimmed = fenInput.trim();
    if (!trimmed) {
      setErrorMsg('Введите строку FEN');
      return;
    }
    const success = onLoadFen(trimmed);
    if (success) {
      setFenInput('');
      onClose();
    } else {
      setErrorMsg('Некорректная FEN нотация. Проверьте правильность расстановки фигур.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('fen')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === 'fen'
                  ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              FEN Нотация
            </button>
            <button
              onClick={() => setActiveTab('pgn')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === 'pgn'
                  ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              PGN Запись
            </button>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {activeTab === 'fen' ? (
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Текущий FEN (Экспорт)
              </label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={currentFen}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-slate-300 select-all"
                />
                <button
                  onClick={handleCopyFen}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition cursor-pointer"
                >
                  {copiedFen ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  <span>{copiedFen ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Импорт позиции (FEN)
              </label>
              <textarea
                value={fenInput}
                onChange={(e) => setFenInput(e.target.value)}
                placeholder="Вставьте FEN строку, например: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
                rows={3}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs font-mono text-slate-200 focus:border-cyan-400 focus:outline-none"
              />
              {errorMsg && <p className="mt-1 text-xs text-red-400">{errorMsg}</p>}
              <button
                onClick={handleApplyFen}
                className="mt-3 flex items-center justify-center gap-2 w-full rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 transition cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                <span>Загрузить позицию</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                PGN запись партии
              </label>
              <textarea
                readOnly
                value={currentPgn || 'Партия еще не началась.'}
                rows={8}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs font-mono text-slate-300 select-all"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopyPgn}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition cursor-pointer"
              >
                {copiedPgn ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                <span>{copiedPgn ? 'Скопировано' : 'Копировать PGN'}</span>
              </button>
              <button
                onClick={handleDownloadPgn}
                className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 transition cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Скачать .pgn</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
