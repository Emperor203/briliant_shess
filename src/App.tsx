import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import { Chessboard2D } from './components/Chess2D/Chessboard2D';
import { Chessboard3D } from './components/Chess3D/Chessboard3D';
import { EvaluationBar } from './components/EvaluationBar';
import { MoveHistory } from './components/MoveHistory';
import { PlayerCard } from './components/PlayerCard';
import { Navbar } from './components/Navbar';
import { SettingsModal } from './components/SettingsModal';
import { FenPgnModal } from './components/FenPgnModal';
import { GameOverModal } from './components/GameOverModal';
import { CoachReviewBar, CoachReviewControls } from './components/CoachReviewBar';
import { uciToArrow } from './services/reviewService';
import type { GameSettings, MoveAnalysis, PlayerSide, BoardArrow } from './types/chess';
import { BOARD_THEMES, BOT_DIFFICULTIES, PIECE_VALUES, TIME_CONTROLS } from './constants/chessData';
import { sounds } from './services/sound';
import { stockfish } from './services/stockfish';
import type { EngineEvaluation } from './services/stockfish';
import { classifyMove } from './services/classifier';
import { Flag, RotateCcw } from 'lucide-react';
import { PawnPetCompanion } from './components/PawnPetCompanion';

const DEFAULT_SETTINGS: GameSettings = {
  boardTheme: 'classic',
  pieceStyle: 'staunton',
  botLevel: 4,
  playerColor: 'w',
  timeControl: '5+3',
  soundEnabled: true,
  showHints: true,
  showEvalBar: true,
  showArrows: true,
  showPet: true,
  viewMode: '2d',
};

export const App: React.FC = () => {
  // Settings (persisted in LocalStorage)
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('chess_ai_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const saveSettings = (newSettings: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('chess_ai_settings', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  // Game state
  const [chess, setChess] = useState<Chess>(() => new Chess());
  const [history, setHistory] = useState<MoveAnalysis[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [boardFlipped, setBoardFlipped] = useState<boolean>(false);
  const [isBotThinking, setIsBotThinking] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<EngineEvaluation>({ score: 0, depth: 0, bestMove: '' });

  // Clock state
  const [whiteTime, setWhiteTime] = useState<number | undefined>(300);
  const [blackTime, setBlackTime] = useState<number | undefined>(300);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Modals & Review State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFenPgnOpen, setIsFenPgnOpen] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isMobilePetOpen, setIsMobilePetOpen] = useState(false);
  const [gameOver, setGameOver] = useState<{
    isOpen: boolean;
    winner: 'w' | 'b' | 'draw' | null;
    reason: string;
  }>({ isOpen: false, winner: null, reason: '' });

  // Determined actual player color ('w' or 'b')
  const [resolvedPlayerColor, setResolvedPlayerColor] = useState<'w' | 'b'>('w');

  // Ref to true current Chess instance to eliminate stale closure state
  const chessRef = useRef<Chess>(new Chess());

  // Ref to trigger bot response reliably
  const triggerBotResponseRef = useRef<(game: Chess) => Promise<void>>(async () => {});

  // Sync sound manager enabled state
  useEffect(() => {
    sounds.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Subscribe to Stockfish real-time evaluation updates
  useEffect(() => {
    const unsub = stockfish.subscribeEval((ev) => {
      setEvaluation(ev);
    });
    return unsub;
  }, []);

  // Initialize new game
  const startNewGame = useCallback((colorOverride?: PlayerSide) => {
    const targetColor = colorOverride || settings.playerColor;
    let actualColor: 'w' | 'b' = 'w';
    if (targetColor === 'random') {
      actualColor = Math.random() < 0.5 ? 'w' : 'b';
    } else {
      actualColor = targetColor;
    }

    setResolvedPlayerColor(actualColor);
    setBoardFlipped(actualColor === 'b');

    const newChess = new Chess();
    chessRef.current = newChess;
    setChess(newChess);
    setHistory([]);
    setCurrentStepIndex(-1);
    setIsBotThinking(false);
    setIsReviewMode(false);
    setGameOver({ isOpen: false, winner: null, reason: '' });

    // Setup Clocks
    const tc = TIME_CONTROLS.find((t) => t.id === settings.timeControl);
    if (tc && tc.initialSeconds > 0) {
      setWhiteTime(tc.initialSeconds);
      setBlackTime(tc.initialSeconds);
      setIsTimerRunning(true);
    } else {
      setWhiteTime(undefined);
      setBlackTime(undefined);
      setIsTimerRunning(false);
    }

    sounds.playGameStart();

    // Trigger initial eval
    stockfish.evaluatePosition(newChess.fen(), 10);

    // If player is Black, bot plays White and moves first!
    if (actualColor === 'b') {
      setTimeout(() => {
        triggerBotResponseRef.current(newChess);
      }, 500);
    }
  }, [settings.playerColor, settings.timeControl]);

  // Handle game initial mount
  useEffect(() => {
    startNewGame();
  }, []);

  // Clock countdown interval
  useEffect(() => {
    if (!isTimerRunning || chess.isGameOver()) return;

    const timer = setInterval(() => {
      const turn = chess.turn();
      if (turn === 'w') {
        setWhiteTime((prev) => {
          if (prev === undefined) return undefined;
          if (prev <= 1) {
            handleTimeout('w');
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev === undefined) return undefined;
          if (prev <= 1) {
            handleTimeout('b');
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning, chess.turn(), chess.isGameOver()]);

  const handleTimeout = (loser: 'w' | 'b') => {
    const winner = loser === 'w' ? 'b' : 'w';
    setIsTimerRunning(false);
    setGameOver({
      isOpen: true,
      winner,
      reason: loser === 'w' ? 'Белые проиграли по времени' : 'Черные проиграли по времени',
    });
  };

  // Check Game Over conditions
  const checkGameOver = useCallback((game: Chess) => {
    if (game.isGameOver()) {
      setIsTimerRunning(false);
      let winner: 'w' | 'b' | 'draw' = 'draw';
      let reason = 'Ничья';

      if (game.isCheckmate()) {
        winner = game.turn() === 'w' ? 'b' : 'w';
        reason = `Мат! Победа ${winner === 'w' ? 'Белых' : 'Черных'}`;
        sounds.playCheckmate();
      } else if (game.isStalemate()) {
        reason = 'Ничья (Пат)';
      } else if (game.isThreefoldRepetition()) {
        reason = 'Ничья (Троекратное повторение)';
      } else if (game.isInsufficientMaterial()) {
        reason = 'Ничья (Недостаточно материала)';
      }

      setGameOver({ isOpen: true, winner, reason });
      return true;
    }
    return false;
  }, []);

  // Core move execution
  const executeMove = useCallback(
    async (from: Square, to: Square, promotion?: string, isBot: boolean = false): Promise<boolean> => {
      const currentChess = chessRef.current;
      if (currentChess.isGameOver()) return false;
      if (!isBot && isBotThinking) return false;

      // Ensure we are viewing latest position
      if (currentStepIndex !== history.length - 1 && history.length > 0) {
        return false;
      }

      const fenBefore = currentChess.fen();
      const movingPlayerColor = currentChess.turn();
      const evalBefore = movingPlayerColor === 'w' ? evaluation.score : -evaluation.score;

      try {
        const piece = currentChess.get(from);
        const isPromotion = piece && piece.type === 'p' && (to.endsWith('8') || to.endsWith('1'));
        const moveOptions: { from: Square; to: Square; promotion?: string } = { from, to };
        if (isPromotion) {
          moveOptions.promotion = promotion || 'q';
        }

        const moveResult = currentChess.move(moveOptions);
        if (!moveResult) return false;

        // Sound triggers
        if (currentChess.isCheckmate()) {
          sounds.playCheckmate();
        } else if (currentChess.inCheck()) {
          sounds.playCheck();
        } else if (moveResult.captured) {
          sounds.playCapture();
        } else if (moveResult.promotion) {
          sounds.playPromote();
        } else {
          sounds.playMove();
        }

        // Apply clock increment
        const tc = TIME_CONTROLS.find((t) => t.id === settings.timeControl);
        if (tc && tc.incrementSeconds > 0) {
          if (movingPlayerColor === 'w') {
            setWhiteTime((prev) => (prev !== undefined ? prev + tc.incrementSeconds : undefined));
          } else {
            setBlackTime((prev) => (prev !== undefined ? prev + tc.incrementSeconds : undefined));
          }
        }

        // Update state with new board
        const newFen = currentChess.fen();
        setChess(new Chess(newFen));

        // Evaluate new position with Stockfish
        const evalAfterData = await stockfish.evaluatePosition(newFen, 10);
        const evalAfter = movingPlayerColor === 'w' ? evalAfterData.score : -evalAfterData.score;

        // Classify move quality
        const classification = classifyMove(
          new Chess(fenBefore),
          {
            from,
            to,
            piece: moveResult.piece,
            captured: moveResult.captured,
            san: moveResult.san,
            promotion: moveResult.promotion,
          },
          evalBefore,
          evalAfter,
          evaluation.bestMove
        );

        if (classification.quality === 'blunder') {
          sounds.playBlunder();
        }

        const analysisEntry: MoveAnalysis = {
          san: moveResult.san,
          from,
          to,
          piece: moveResult.piece,
          color: moveResult.color,
          captured: moveResult.captured,
          promotion: moveResult.promotion,
          fenBefore,
          fenAfter: newFen,
          evalBefore,
          evalAfter,
          bestMove: evaluation.bestMove,
          quality: classification.quality,
          explanation: classification.explanation,
        };

        const nextHistory = [...history, analysisEntry];
        setHistory(nextHistory);
        setCurrentStepIndex(nextHistory.length - 1);

        // Check if game ended
        const isEnd = checkGameOver(currentChess);

        // If player moved and game continues, trigger bot response!
        if (!isEnd && !isBot && currentChess.turn() !== resolvedPlayerColor) {
          triggerBotResponseRef.current(currentChess);
        }

        return true;
      } catch (err) {
        console.warn('Illegal move attempted:', err);
        return false;
      }
    },
    [isBotThinking, evaluation, settings.timeControl, checkGameOver, resolvedPlayerColor, history, currentStepIndex]
  );

  // Direct bot response handler (immune to effect cancellation)
  const triggerBotResponse = useCallback(
    async (gameInstance: Chess) => {
      if (gameInstance.isGameOver()) return;
      setIsBotThinking(true);

      try {
        const botConfig = BOT_DIFFICULTIES.find((b) => b.level === settings.botLevel) || BOT_DIFFICULTIES[3];
        // Natural thinking pause
        await new Promise((r) => setTimeout(r, 380));

        const currentFen = chessRef.current.fen();
        const moveUci = await stockfish.getBotMove(
          currentFen,
          botConfig.depth,
          botConfig.skillLevel,
          botConfig.blunderProb
        );

        if (moveUci && moveUci.length >= 4) {
          const from = moveUci.slice(0, 2) as Square;
          const to = moveUci.slice(2, 4) as Square;
          const promotion = moveUci.length > 4 ? moveUci[4] : undefined;
          await executeMove(from, to, promotion, true);
        }
      } catch (err) {
        console.error('Bot move failed:', err);
      } finally {
        setIsBotThinking(false);
      }
    },
    [settings.botLevel, executeMove]
  );

  useEffect(() => {
    triggerBotResponseRef.current = triggerBotResponse;
  }, [triggerBotResponse]);

  // Jump to step for interactive replay
  const handleJumpToStep = (index: number) => {
    if (index < 0) {
      // Starting position
      const initialChess = new Chess();
      chessRef.current = initialChess;
      setChess(initialChess);
      setCurrentStepIndex(-1);
    } else if (index < history.length) {
      const step = history[index];
      const stepChess = new Chess(step.fenAfter);
      chessRef.current = stepChess;
      setChess(stepChess);
      setCurrentStepIndex(index);
    }
  };

  // Load custom FEN
  const handleLoadFen = (fen: string): boolean => {
    try {
      const testChess = new Chess(fen);
      chessRef.current = testChess;
      setChess(testChess);
      setHistory([]);
      setCurrentStepIndex(-1);
      stockfish.evaluatePosition(fen, 12);
      return true;
    } catch {
      return false;
    }
  };

  // Compute captured pieces and material imbalance
  const { whiteCaptured, blackCaptured, whiteAdvantage } = React.useMemo(() => {
    const counts: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const curWhiteCounts: Record<string, number> = { p: 0, n: 0, b: 0, r: 0, q: 0 };
    const curBlackCounts: Record<string, number> = { p: 0, n: 0, b: 0, r: 0, q: 0 };

    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (!p || p.type === 'k') continue;
        if (p.color === 'w') curWhiteCounts[p.type] = (curWhiteCounts[p.type] || 0) + 1;
        else curBlackCounts[p.type] = (curBlackCounts[p.type] || 0) + 1;
      }
    }

    const whiteCap: string[] = []; // pieces White has captured (lost by black)
    const blackCap: string[] = []; // pieces Black has captured (lost by white)

    let whiteMaterial = 0;
    let blackMaterial = 0;

    Object.keys(counts).forEach((type) => {
      const wLost = Math.max(0, counts[type] - curWhiteCounts[type]);
      const bLost = Math.max(0, counts[type] - curBlackCounts[type]);
      for (let i = 0; i < bLost; i++) whiteCap.push(type);
      for (let i = 0; i < wLost; i++) blackCap.push(type);

      whiteMaterial += curWhiteCounts[type] * PIECE_VALUES[type];
      blackMaterial += curBlackCounts[type] * PIECE_VALUES[type];
    });

    const matDiff = Math.floor((whiteMaterial - blackMaterial) / 100);

    return {
      whiteCaptured: whiteCap,
      blackCaptured: blackCap,
      whiteAdvantage: matDiff,
    };
  }, [chess.fen()]);

  const activeTheme = BOARD_THEMES[settings.boardTheme] || BOARD_THEMES.classic;
  const currentBot = BOT_DIFFICULTIES.find((b) => b.level === settings.botLevel) || BOT_DIFFICULTIES[3];
  const lastMoveAnalysis = history.length > 0 && currentStepIndex >= 0 ? history[currentStepIndex] : undefined;
  const isBrowsingHistory = history.length > 0 && currentStepIndex < history.length - 1;

  // Active arrows to display on the board
  const boardArrows: BoardArrow[] = React.useMemo(() => {
    const list: BoardArrow[] = [];

    if (isReviewMode && lastMoveAnalysis) {
      const q = lastMoveAnalysis.quality;
      const isError = q === 'mistake' || q === 'blunder' || q === 'inaccuracy';

      if (isError && lastMoveAnalysis.bestMove) {
        // Green arrow showing Stockfish's best move recommendation
        const bestArrow = uciToArrow(lastMoveAnalysis.bestMove, '#22c55e', 'Лучший ход');
        if (bestArrow) list.push(bestArrow);

        // Red arrow highlighting the error/blunder made
        list.push({
          from: lastMoveAnalysis.from,
          to: lastMoveAnalysis.to,
          color: '#ef4444',
        });
      } else {
        // Green or cyan arrow for good/best/brilliant/book moves
        list.push({
          from: lastMoveAnalysis.from,
          to: lastMoveAnalysis.to,
          color: q === 'brilliant' ? '#06b6d4' : '#22c55e',
        });
      }
    } else if (lastMoveAnalysis) {
      // Normal game / history mode: show amber move arrow
      list.push({
        from: lastMoveAnalysis.from,
        to: lastMoveAnalysis.to,
        color: '#f59e0b',
      });
    }

    return list;
  }, [isReviewMode, lastMoveAnalysis]);

  // Bot vs Player cards
  const topPlayer = boardFlipped ? (
    <PlayerCard
      name="Вы"
      color="w"
      isBot={false}
      pieceStyle={settings.pieceStyle}
      timeRemaining={whiteTime}
      isActive={chess.turn() === 'w' && !chess.isGameOver()}
      capturedPieces={whiteCaptured}
      materialDifference={whiteAdvantage > 0 ? whiteAdvantage : 0}
    />
  ) : (
    <PlayerCard
      name={`Stockfish (${currentBot.name})`}
      rating={currentBot.rating}
      color="b"
      isBot={true}
      pieceStyle={settings.pieceStyle}
      timeRemaining={blackTime}
      isActive={chess.turn() === 'b' && !chess.isGameOver()}
      capturedPieces={blackCaptured}
      materialDifference={whiteAdvantage < 0 ? Math.abs(whiteAdvantage) : 0}
    />
  );

  const bottomPlayer = boardFlipped ? (
    <PlayerCard
      name={`Stockfish (${currentBot.name})`}
      rating={currentBot.rating}
      color="b"
      isBot={true}
      pieceStyle={settings.pieceStyle}
      timeRemaining={blackTime}
      isActive={chess.turn() === 'b' && !chess.isGameOver()}
      capturedPieces={blackCaptured}
      materialDifference={whiteAdvantage < 0 ? Math.abs(whiteAdvantage) : 0}
    />
  ) : (
    <PlayerCard
      name="Вы"
      color="w"
      isBot={false}
      pieceStyle={settings.pieceStyle}
      timeRemaining={whiteTime}
      isActive={chess.turn() === 'w' && !chess.isGameOver()}
      capturedPieces={whiteCaptured}
      materialDifference={whiteAdvantage > 0 ? whiteAdvantage : 0}
    />
  );

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-500"
      style={{ backgroundColor: activeTheme.background }}
    >
      {/* Top Navbar */}
      <Navbar
        viewMode={settings.viewMode}
        onToggleViewMode={() => saveSettings({ viewMode: settings.viewMode === '2d' ? '3d' : '2d' })}
        flipped={boardFlipped}
        onFlipBoard={() => setBoardFlipped(!boardFlipped)}
        soundEnabled={settings.soundEnabled}
        onToggleSound={() => saveSettings({ soundEnabled: !settings.soundEnabled })}
        showArrows={settings.showArrows}
        onToggleArrows={() => saveSettings({ showArrows: !settings.showArrows })}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenFenPgn={() => setIsFenPgnOpen(true)}
        onOpenReview={() => {
          setIsReviewMode(true);
          handleJumpToStep(-1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNewGame={() => startNewGame()}
      />

      {/* Main Game Arena */}
      <main className={`flex-1 container mx-auto px-2 sm:px-4 py-1.5 sm:py-2 flex flex-col lg:flex-row items-center justify-center gap-3 lg:gap-5 xl:gap-6 ${isReviewMode ? 'max-w-2xl' : 'max-w-7xl'} h-[calc(100dvh-50px)] overflow-y-auto lg:overflow-hidden`}>
        {/* Left Section: Pawn Pet Mascot (Desktop & Laptop) */}
        {settings.showPet !== false && !isReviewMode && (
          <aside className="hidden lg:flex flex-col items-center justify-center w-[180px] xl:w-[210px] shrink-0 self-center animate-in fade-in slide-in-from-left-4 duration-300">
            <PawnPetCompanion
              evaluation={evaluation}
              playerColor={resolvedPlayerColor}
              isBotThinking={isBotThinking}
              gameOver={gameOver}
              isSoundEnabled={settings.soundEnabled}
            />
          </aside>
        )}

        {/* Left / Center Section: Board + Eval Bar + Player Cards / Coach Review */}
        <div className={`flex flex-col items-center w-full shrink-0 transition-all duration-300 ${isReviewMode ? 'max-w-[min(480px,calc(100dvh-200px))]' : 'max-w-[min(540px,calc(100dvh-150px))]'}`}>
          {/* Top section: Coach Owl Review Card OR Top Player Card */}
          {isReviewMode ? (
            <div className="w-full mb-1.5">
              <CoachReviewBar
                history={history}
                currentStepIndex={currentStepIndex}
                onJumpToStep={handleJumpToStep}
                onExitReview={() => {
                  setIsReviewMode(false);
                  handleJumpToStep(history.length - 1);
                }}
                materialDiff={whiteAdvantage}
              />
            </div>
          ) : (
            <>
              <div className="w-full mb-1.5">{topPlayer}</div>

              {/* Browsing Old Move Notification Banner */}
              {isBrowsingHistory && (
                <div className="w-full mb-1.5 flex items-center justify-between rounded-xl border border-amber-500/50 bg-amber-950/80 px-3 py-1.5 text-xs font-medium text-amber-200 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                    <span>
                      Просмотр истории:{' '}
                      <strong className="text-amber-100">
                        {currentStepIndex >= 0 && history[currentStepIndex]
                          ? `Ход ${Math.floor(currentStepIndex / 2) + 1}. ${history[currentStepIndex].color === 'w' ? 'Белые' : 'Черные'} (${history[currentStepIndex].san})`
                          : 'Начальная позиция'}
                      </strong>
                    </span>
                  </div>
                  <button
                    onClick={() => handleJumpToStep(history.length - 1)}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-md transition cursor-pointer"
                  >
                    <span>Вернуться в игру</span>
                    <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* Board + Side Eval Bar Container */}
          <div className="relative flex items-center justify-center w-full gap-2">
            {/* Live Stockfish Evaluation Bar */}
            {settings.showEvalBar && (
              <EvaluationBar
                evaluation={evaluation}
                flipped={boardFlipped}
                className="w-5 sm:w-6 self-stretch shrink-0"
              />
            )}

            {/* Chessboard (2D or 3D) */}
            <div className="flex-1 flex justify-center">
              {settings.viewMode === '2d' ? (
                <Chessboard2D
                  chess={chess}
                  boardTheme={activeTheme}
                  pieceStyle={settings.pieceStyle}
                  flipped={boardFlipped}
                  onMove={executeMove}
                  lastAnalysis={lastMoveAnalysis}
                  arrows={settings.showArrows ? boardArrows : []}
                  disabled={isBotThinking || isReviewMode || isBrowsingHistory || (chess.turn() !== resolvedPlayerColor && !chess.isGameOver())}
                />
              ) : (
                <Chessboard3D
                  chess={chess}
                  boardTheme={activeTheme}
                  pieceStyle={settings.pieceStyle}
                  flipped={boardFlipped}
                  onMove={executeMove}
                  lastAnalysis={lastMoveAnalysis}
                  disabled={isBotThinking || isReviewMode || isBrowsingHistory || (chess.turn() !== resolvedPlayerColor && !chess.isGameOver())}
                />
              )}
            </div>
          </div>

          {/* Bottom section: Coach Review Controls (Material + Move Ribbon + Nav Buttons) OR Bottom Player Card */}
          {isReviewMode ? (
            <div className="w-full">
              <CoachReviewControls
                history={history}
                currentStepIndex={currentStepIndex}
                onJumpToStep={handleJumpToStep}
                materialDiff={whiteAdvantage}
              />
            </div>
          ) : (
            <div className="w-full mt-1.5">{bottomPlayer}</div>
          )}

          {/* Bot thinking indicator bar */}
          {isBotThinking && (
            <div className="mt-1.5 flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/60 px-3 py-0.5 text-[11px] font-semibold text-cyan-300 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <span>Stockfish рассчитывает глубину {currentBot.depth}...</span>
            </div>
          )}
        </div>

        {/* Right Section: Move History, PGN & Quick Controls (Hidden during Coach Review) */}
        {!isReviewMode && (
          <div className="w-full lg:w-[360px] flex flex-col gap-2.5">
          {/* Move History Table */}
          <MoveHistory
            history={history}
            currentStepIndex={currentStepIndex}
            onJumpToStep={handleJumpToStep}
          />

          {/* Quick Resign / Rematch Bar */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-2 shadow-lg">
            <button
              onClick={() => {
                if (window.confirm('Сдаться в текущей партии?')) {
                  const winner = resolvedPlayerColor === 'w' ? 'b' : 'w';
                  setGameOver({ isOpen: true, winner, reason: 'Сдача партии' });
                }
              }}
              disabled={chess.isGameOver()}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 py-1.5 text-xs font-bold text-slate-300 hover:bg-red-950/40 hover:border-red-500/40 hover:text-red-300 transition disabled:opacity-40 cursor-pointer"
            >
              <Flag className="h-3 w-3" />
              <span>Сдаться</span>
            </button>
            <button
              onClick={() => startNewGame()}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-cyan-600/90 py-1.5 text-xs font-bold text-white hover:bg-cyan-500 shadow-md transition cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Новая партия</span>
            </button>
          </div>

          {/* Engine Quality Badge Guide Banner */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-2 text-xs text-slate-400 space-y-1">
            <h4 className="font-bold text-[11px] text-slate-200">Оценка ходов Stockfish:</h4>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
              <span className="flex items-center gap-1">
                <span>💎</span> <strong className="text-cyan-300">Бриллиантовый</strong>
              </span>
              <span className="flex items-center gap-1">
                <span>⭐️</span> <strong className="text-green-300">Лучший</strong>
              </span>
              <span className="flex items-center gap-1">
                <span>👍</span> <strong className="text-lime-300">Отличный</strong>
              </span>
              <span className="flex items-center gap-1">
                <span>❓</span> <strong className="text-yellow-300">Неточность</strong>
              </span>
              <span className="flex items-center gap-1">
                <span>⚠️</span> <strong className="text-orange-300">Ошибка</strong>
              </span>
              <span className="flex items-center gap-1">
                <span>❌</span> <strong className="text-red-300">Зевок</strong>
              </span>
            </div>
          </div>
        </div>
      )}
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={saveSettings}
        onRestartGame={() => startNewGame()}
      />

      <FenPgnModal
        isOpen={isFenPgnOpen}
        onClose={() => setIsFenPgnOpen(false)}
        currentFen={chess.fen()}
        currentPgn={chess.pgn()}
        onLoadFen={handleLoadFen}
      />

      {/* Mobile Floating Pawn Mascot Trigger */}
      {settings.showPet !== false && !isReviewMode && (
        <div className="lg:hidden fixed bottom-3 left-3 z-30">
          <button
            onClick={() => setIsMobilePetOpen(!isMobilePetOpen)}
            className="flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-slate-900/95 px-3 py-1.5 shadow-2xl backdrop-blur-md text-xs font-bold text-amber-300 cursor-pointer active:scale-95 transition-transform"
          >
            <span className="text-base">♟️</span>
            <span>Талисман</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>
          {isMobilePetOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
              <div className="relative w-full max-w-xs">
                <button
                  onClick={() => setIsMobilePetOpen(false)}
                  className="absolute -top-3 -right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
                >
                  ✕
                </button>
                <PawnPetCompanion
                  evaluation={evaluation}
                  playerColor={resolvedPlayerColor}
                  isBotThinking={isBotThinking}
                  gameOver={gameOver}
                  isSoundEnabled={settings.soundEnabled}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <GameOverModal
        isOpen={gameOver.isOpen}
        onClose={() => setGameOver({ ...gameOver, isOpen: false })}
        winner={gameOver.winner}
        reason={gameOver.reason}
        playerColor={resolvedPlayerColor}
        history={history}
        onRestart={() => startNewGame()}
        onOpenReview={() => {
          setIsReviewMode(true);
          handleJumpToStep(-1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
};

export default App;
