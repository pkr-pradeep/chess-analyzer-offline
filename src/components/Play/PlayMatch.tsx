import React, { useState, useEffect, useRef } from 'react';
import { Chess, Square, Move, PieceSymbol } from 'chess.js';
import { ChessBoard } from '../ChessBoard/ChessBoard';
import { PgnModal } from './PgnModal';
import { HorizontalMoveTracker } from './HorizontalMoveTracker';
import { GameSideMenu } from './GameSideMenu';
import { ChaturangaModal } from '../ChessBoard/ChaturangaModal';
import { ErrorBoundary } from '../ErrorBoundary';
import { chessEngine } from '../../services/chessEngine';
import { stockfishService, StockfishInfo } from '../../services/stockfishService';
import { chessAudio } from '../../utils/chessAudio';
import { ChessPieceTheme } from '../ChessBoard/ChessPiece';
import { 
  BotDifficulty, 
  GameRecord, 
  MoveAnalysis, 
  PieceColor 
} from '../../types/chess';
import { 
  Undo2, 
  RotateCcw, 
  Flag, 
  Handshake, 
  Menu, 
  Sparkles, 
  Award, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown,
  Timer,
  Clock,
  Zap
} from 'lucide-react';

const BOT_DIFFICULTIES: BotDifficulty[] = [
  { id: 'novice', name: 'Novice Bot', rating: 800, depth: 1, randomness: 45, description: 'Casual beginner, makes periodic tactical blunders', avatar: '♟️' },
  { id: 'casual', name: 'Casual Bot', rating: 1200, depth: 3, randomness: 18, description: 'Solid fundamentals, misses deep tactical sequences', avatar: '♞' },
  { id: 'club', name: 'Stockfish Club', rating: 1750, depth: 8, randomness: 0, description: 'Stockfish Level 8, sharp tactical calculation & defense', avatar: '⚡' },
  { id: 'master', name: 'Stockfish Grandmaster', rating: 2600, depth: 14, randomness: 0, description: 'Stockfish Level 20, world-class positional mastery', avatar: '👑' },
];

export type EngineMode = 'stockfish' | 'minimax';

interface PlayMatchProps {
  onGameCompleted: (game: GameRecord) => void;
  onSaveBlunderAsPuzzle: (move: MoveAnalysis) => void;
  onNavigateToReview: (game: GameRecord) => void;
  userRating: number;
}

export const PlayMatch: React.FC<PlayMatchProps> = ({
  onGameCompleted,
  onSaveBlunderAsPuzzle,
  onNavigateToReview,
  userRating,
}) => {
  const [chess, setChess] = useState<Chess>(() => new Chess());
  const [playerColor, setPlayerColor] = useState<PieceColor>('w');
  const [selectedBot, setSelectedBot] = useState<BotDifficulty>(BOT_DIFFICULTIES[1]); // Casual default
  const [engineMode, setEngineMode] = useState<EngineMode>('stockfish');
  const [stockfishInfo, setStockfishInfo] = useState<StockfishInfo | null>(null);
  const [movesHistory, setMovesHistory] = useState<MoveAnalysis[]>([]);
  const movesHistoryRef = useRef<MoveAnalysis[]>([]);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square; classification?: any } | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [currentEval, setCurrentEval] = useState<number>(0);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [terminationText, setTerminationText] = useState<string>('');
  const [isBotThinking, setIsBotThinking] = useState<boolean>(false);
  const [savedPuzzleIds, setSavedPuzzleIds] = useState<Set<string>>(new Set());

  // Move Timer State to help identify impulsive playing
  const moveStartTimeRef = useRef<number>(Date.now());
  const [currentMoveSeconds, setCurrentMoveSeconds] = useState<number>(0);
  const [lastPlayerMoveTime, setLastPlayerMoveTime] = useState<number | null>(null);
  const [playerMoveTimes, setPlayerMoveTimes] = useState<number[]>([]);

  // UI state for clean, distraction-free board
  const [isSideMenuOpen, setIsSideMenuOpen] = useState<boolean>(false);
  const [isMovesExpanded, setIsMovesExpanded] = useState<boolean>(false); // Collapsed by default as requested
  const [isPgnModalOpen, setIsPgnModalOpen] = useState<boolean>(false);
  const [isLoreModalOpen, setIsLoreModalOpen] = useState<boolean>(false);
  const [showLiveAnalysis, setShowLiveAnalysis] = useState<boolean>(false);
  const [activeMoveIndex, setActiveMoveIndex] = useState<number>(-1);
  const [pieceTheme, setPieceTheme] = useState<ChessPieceTheme>(() => {
    return (localStorage.getItem('chess_piece_theme') as ChessPieceTheme) || 'classic';
  });

  const botTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Is it currently the player's turn to think?
  const isPlayerTurn = chess.turn() === playerColor && !gameResult && !isBotThinking;

  // Move Timer Interval: ticks live when player is thinking
  useEffect(() => {
    if (!isPlayerTurn) {
      setCurrentMoveSeconds(0);
      return;
    }

    moveStartTimeRef.current = Date.now();
    setCurrentMoveSeconds(0);

    const timerInterval = setInterval(() => {
      const elapsed = Math.max(0, (Date.now() - moveStartTimeRef.current) / 1000);
      setCurrentMoveSeconds(Number(elapsed.toFixed(1)));
    }, 200);

    return () => clearInterval(timerInterval);
  }, [isPlayerTurn, movesHistory.length]);

  // Player move pace analytics
  const avgPlayerMoveTime = React.useMemo(() => {
    if (playerMoveTimes.length === 0) return null;
    const sum = playerMoveTimes.reduce((a, b) => a + b, 0);
    return Number((sum / playerMoveTimes.length).toFixed(1));
  }, [playerMoveTimes]);

  const impulsiveMovesCount = React.useMemo(() => {
    return playerMoveTimes.filter((t) => t < 2.5).length;
  }, [playerMoveTimes]);

  // Keep movesHistoryRef in sync
  useEffect(() => {
    movesHistoryRef.current = movesHistory;
  }, [movesHistory]);

  const handlePieceThemeChange = (newTheme: ChessPieceTheme) => {
    setPieceTheme(newTheme);
    localStorage.setItem('chess_piece_theme', newTheme);
  };

  // Safe move stepping with sound feedback
  const handleStepMoveIndex = (idx: number) => {
    const clamped = Math.max(-1, Math.min(movesHistory.length - 1, idx));
    setSelectedSquare(null);
    setActiveMoveIndex(clamped);
    if (clamped >= 0) {
      chessAudio.playMove();
    }
  };

  // Autoplay match replay loop
  useEffect(() => {
    if (!isReplaying) return;
    if (activeMoveIndex >= movesHistory.length - 1) {
      setIsReplaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setActiveMoveIndex((prev) => {
        const next = prev + 1;
        chessAudio.playMove();
        if (next >= movesHistory.length - 1) {
          setIsReplaying(false);
        }
        return next;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [isReplaying, activeMoveIndex, movesHistory.length]);

  // Subscribe to Stockfish real-time engine telemetry (throttled for 60fps stability)
  useEffect(() => {
    let lastUpdate = 0;
    const unsubscribe = stockfishService.subscribe((info) => {
      const now = performance.now();
      if (!info.isThinking || now - lastUpdate > 250) {
        lastUpdate = now;
        setStockfishInfo(info);
        if (info.scoreCp !== undefined) {
          setCurrentEval(info.scoreCp);
        }
      }
    });

    stockfishService.initWorker();

    return () => {
      unsubscribe();
      stockfishService.stop();
    };
  }, []);

  // Initialize new match
  const startNewGame = (color: PieceColor = playerColor, bot: BotDifficulty = selectedBot) => {
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    stockfishService.stop();
    const newChess = new Chess();
    setChess(newChess);
    setPlayerColor(color);
    setSelectedBot(bot);
    movesHistoryRef.current = [];
    setMovesHistory([]);
    setActiveMoveIndex(-1);
    setIsReplaying(false);
    setLastMove(null);
    setSelectedSquare(null);
    setCurrentEval(0);
    setGameResult(null);
    setTerminationText('');
    setIsBotThinking(false);
    moveStartTimeRef.current = Date.now();
    setCurrentMoveSeconds(0);
    setLastPlayerMoveTime(null);
    setPlayerMoveTimes([]);

    if (color === 'b') {
      botTimeoutRef.current = setTimeout(() => {
        triggerBotMove(newChess, bot, engineMode);
      }, 300);
    }
  };

  const triggerBotMove = async (
    currentChessInstance: Chess,
    bot: BotDifficulty,
    mode: EngineMode = engineMode
  ) => {
    setIsBotThinking(true);

    try {
      if (currentChessInstance.isGameOver()) {
        setIsBotThinking(false);
        return;
      }

      let moveSan = '';
      let from: Square;
      let to: Square;
      let promotion: PieceSymbol | undefined;

      if (mode === 'stockfish') {
        let skillLevel = 5;
        let searchDepth = 4;
        let movetimeMs = 100;

        if (bot.id === 'novice') {
          skillLevel = 1;
          searchDepth = 2;
          movetimeMs = 70;
        } else if (bot.id === 'casual') {
          skillLevel = 5;
          searchDepth = 4;
          movetimeMs = 100;
        } else if (bot.id === 'club') {
          skillLevel = 10;
          searchDepth = 6;
          movetimeMs = 120;
        } else if (bot.id === 'master') {
          skillLevel = 20;
          searchDepth = 8;
          movetimeMs = 160;
        }

        const bestMoveResult = await stockfishService.getBestMove(
          currentChessInstance.fen(),
          skillLevel,
          searchDepth,
          movetimeMs
        );

        from = bestMoveResult.from;
        to = bestMoveResult.to;
        promotion = (bestMoveResult.promotion as PieceSymbol) || undefined;

        const fenBefore = currentChessInstance.fen();
        const appliedMove = currentChessInstance.move({
          from,
          to,
          promotion: promotion || 'q',
        });

        if (appliedMove) {
          moveSan = appliedMove.san;
          const nextChess = new Chess(currentChessInstance.fen());

          if (appliedMove.captured) {
            chessAudio.playCapture();
          } else if (nextChess.inCheck()) {
            chessAudio.playCheck();
          } else {
            chessAudio.playMove();
          }

          let analysis: MoveAnalysis;
          if (showLiveAnalysis) {
            analysis = chessEngine.analyzeMove(
              fenBefore,
              moveSan,
              from,
              to,
              nextChess.turn() === 'w' ? 'b' : 'w'
            );
          } else {
            const evalBefore = currentEval;
            const evalAfter = bestMoveResult.evalCp ?? chessEngine.evaluatePosition(nextChess);
            analysis = {
              san: moveSan,
              from,
              to,
              color: nextChess.turn() === 'w' ? 'b' : 'w',
              fenBefore,
              fenAfter: nextChess.fen(),
              evalBefore,
              evalAfter,
              evalDelta: 0,
              classification: 'good',
              explanation: '',
            };
          }

          const updatedMoves = [...movesHistoryRef.current, analysis];
          movesHistoryRef.current = updatedMoves;

          setChess(nextChess);
          setLastMove({
            from,
            to,
            classification: showLiveAnalysis ? analysis.classification : undefined,
          });
          setCurrentEval(bestMoveResult.evalCp || analysis.evalAfter);
          setMovesHistory(updatedMoves);
          setActiveMoveIndex(updatedMoves.length - 1);
          checkGameOver(nextChess, updatedMoves);
        }
      } else {
        const botMove = chessEngine.getBotMove(currentChessInstance, bot);
        if (botMove) {
          const fenBefore = currentChessInstance.fen();
          from = botMove.from;
          to = botMove.to;
          moveSan = botMove.san;

          currentChessInstance.move(botMove);
          const nextChess = new Chess(currentChessInstance.fen());

          if (botMove.captured) {
            chessAudio.playCapture();
          } else if (nextChess.inCheck()) {
            chessAudio.playCheck();
          } else {
            chessAudio.playMove();
          }

          let analysis: MoveAnalysis;
          if (showLiveAnalysis) {
            analysis = chessEngine.analyzeMove(
              fenBefore,
              moveSan,
              from,
              to,
              nextChess.turn() === 'w' ? 'b' : 'w'
            );
          } else {
            const evalBefore = currentEval;
            const evalAfter = chessEngine.evaluatePosition(nextChess);
            analysis = {
              san: moveSan,
              from,
              to,
              color: nextChess.turn() === 'w' ? 'b' : 'w',
              fenBefore,
              fenAfter: nextChess.fen(),
              evalBefore,
              evalAfter,
              evalDelta: 0,
              classification: 'good',
              explanation: '',
            };
          }

          const updatedMoves = [...movesHistoryRef.current, analysis];
          movesHistoryRef.current = updatedMoves;

          setChess(nextChess);
          setLastMove({
            from,
            to,
            classification: showLiveAnalysis ? analysis.classification : undefined,
          });
          setCurrentEval(analysis.evalAfter);
          setMovesHistory(updatedMoves);
          setActiveMoveIndex(updatedMoves.length - 1);
          checkGameOver(nextChess, updatedMoves);
        }
      }
    } catch (err) {
      console.error('Error during bot move execution:', err);
    } finally {
      setIsBotThinking(false);
      moveStartTimeRef.current = Date.now();
      setCurrentMoveSeconds(0);
    }
  };

  const checkGameOver = (currentChess: Chess, currentMoves: MoveAnalysis[]) => {
    if (!currentChess.isGameOver()) return;

    let result = '1/2-1/2';
    let reason = 'Draw';

    if (currentChess.isCheckmate()) {
      if (currentChess.turn() === 'w') {
        result = '0-1';
        reason = playerColor === 'w' ? 'Bot won by Checkmate' : 'You won by Checkmate!';
      } else {
        result = '1-0';
        reason = playerColor === 'w' ? 'You won by Checkmate!' : 'Bot won by Checkmate';
      }
    } else if (currentChess.isDraw()) {
      if (currentChess.isStalemate()) reason = 'Draw by Stalemate';
      else if (currentChess.isThreefoldRepetition()) reason = 'Draw by Threefold Repetition';
      else if (currentChess.isInsufficientMaterial()) reason = 'Draw by Insufficient Material';
      else reason = 'Draw by 50-move rule';
    }

    setGameResult(result);
    setTerminationText(reason);
    finishGame(result, reason, currentMoves);
  };

  const finishGame = (result: string, reason: string, finalMoves: MoveAnalysis[]) => {
    const isPlayerWin = (result === '1-0' && playerColor === 'w') || (result === '0-1' && playerColor === 'b');
    const isDraw = result === '1/2-1/2';

    if (isPlayerWin) chessAudio.playVictory();
    else if (!isDraw) chessAudio.playDefeat();

    let ratingDelta = 0;
    if (isPlayerWin) {
      ratingDelta = selectedBot.id === 'master' ? 25 : selectedBot.id === 'club' ? 18 : selectedBot.id === 'casual' ? 12 : 8;
    } else if (!isDraw) {
      ratingDelta = selectedBot.id === 'novice' ? -15 : -8;
    }

    const whiteAccuracy = chessEngine.calculateAccuracy(finalMoves, 'w');
    const blackAccuracy = chessEngine.calculateAccuracy(finalMoves, 'b');

    let whiteB = 0, blackB = 0, whiteM = 0, blackM = 0, whiteI = 0, blackI = 0;
    finalMoves.forEach((m) => {
      if (m.color === 'w') {
        if (m.classification === 'blunder') whiteB++;
        else if (m.classification === 'mistake') whiteM++;
        else if (m.classification === 'inaccuracy') whiteI++;
      } else {
        if (m.classification === 'blunder') blackB++;
        else if (m.classification === 'mistake') blackM++;
        else if (m.classification === 'inaccuracy') blackI++;
      }
    });

    const avgMoveSec = playerMoveTimes.length > 0 
      ? Number((playerMoveTimes.reduce((a, b) => a + b, 0) / playerMoveTimes.length).toFixed(1))
      : undefined;
    const impulsiveMoves = playerMoveTimes.filter((t) => t < 2.5).length;

    const gameRecord: GameRecord = {
      id: `game-${Date.now()}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      whitePlayer: playerColor === 'w' ? 'You' : selectedBot.name,
      blackPlayer: playerColor === 'b' ? 'You' : selectedBot.name,
      playerColor,
      botLevel: selectedBot.name,
      result: result as any,
      terminationReason: reason,
      pgn: chess.pgn(),
      moves: finalMoves,
      whiteAccuracy,
      blackAccuracy,
      whiteBlunders: whiteB,
      blackBlunders: blackB,
      whiteMistakes: whiteM,
      blackMistakes: blackM,
      whiteInaccuracies: whiteI,
      blackInaccuracies: blackI,
      ratingBefore: userRating,
      ratingAfter: userRating + ratingDelta,
      avgPlayerMoveTime: avgMoveSec,
      impulsiveMoveCount: impulsiveMoves,
    };

    onGameCompleted(gameRecord);
  };

  // Handle Player move on board with instantaneous optimistic execution
  const handlePlayerMove = ({ from, to, promotion }: { from: Square; to: Square; promotion?: PieceSymbol }): boolean => {
    if (gameResult || isBotThinking) return false;
    if (chess.turn() !== playerColor) return false;

    const fenBefore = chess.fen();
    
    // 1. Instantly apply move to chess instance
    const moveResult = chess.move({ from, to, promotion: promotion || 'q' });
    if (!moveResult) return false;

    const nextChessInstance = new Chess(chess.fen());

    // Immediate tactile sound feedback
    if (moveResult.captured) {
      chessAudio.playCapture();
    } else if (nextChessInstance.inCheck()) {
      chessAudio.playCheck();
    } else {
      chessAudio.playMove();
    }

    // 2. Compute classification / evaluation
    let analysis: MoveAnalysis;
    const moveDuration = Math.max(0.1, Number(((Date.now() - moveStartTimeRef.current) / 1000).toFixed(1)));
    setLastPlayerMoveTime(moveDuration);
    setPlayerMoveTimes((prev) => [...prev, moveDuration]);

    if (showLiveAnalysis) {
      analysis = chessEngine.analyzeMove(
        fenBefore,
        moveResult.san,
        from,
        to,
        playerColor
      );

      if (analysis.classification === 'blunder') {
        chessAudio.playBlunder();
      }
    } else {
      const evalBefore = currentEval;
      const evalAfter = chessEngine.evaluatePosition(nextChessInstance);
      analysis = {
        san: moveResult.san,
        from,
        to,
        color: playerColor,
        fenBefore,
        fenAfter: nextChessInstance.fen(),
        evalBefore,
        evalAfter,
        evalDelta: (playerColor === 'w' ? 1 : -1) * (evalAfter - evalBefore),
        classification: 'good',
        explanation: '',
      };
    }

    analysis.timeSpentSeconds = moveDuration;

    const updatedMoves = [...movesHistoryRef.current, analysis];
    movesHistoryRef.current = updatedMoves;

    // 3. Batched single atomic React state update
    setChess(nextChessInstance);
    setSelectedSquare(null);
    setLastMove({
      from,
      to,
      classification: showLiveAnalysis ? analysis.classification : undefined,
    });
    setCurrentEval(analysis.evalAfter);
    setMovesHistory(updatedMoves);
    setActiveMoveIndex(updatedMoves.length - 1);

    // 4. Check if player's move ended game, else schedule bot
    if (nextChessInstance.isGameOver()) {
      checkGameOver(nextChessInstance, updatedMoves);
    } else {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
      botTimeoutRef.current = setTimeout(() => {
        triggerBotMove(nextChessInstance, selectedBot, engineMode);
      }, 120);
    }

    return true;
  };

  const handleResign = () => {
    if (gameResult) return;
    const result = playerColor === 'w' ? '0-1' : '1-0';
    const reason = 'Resignation';
    setGameResult(result);
    setTerminationText(reason);
    finishGame(result, reason, movesHistory);
  };

  const handleDraw = () => {
    if (gameResult) return;
    const result = '1/2-1/2';
    const reason = 'Draw by mutual agreement';
    setGameResult(result);
    setTerminationText(reason);
    finishGame(result, reason, movesHistory);
  };

  const handleSaveBlunder = (move: MoveAnalysis) => {
    onSaveBlunderAsPuzzle(move);
    setSavedPuzzleIds((prev) => new Set([...prev, move.san]));
  };

  // Rewind last move (Take Back)
  const handleRewindMove = () => {
    if (isBotThinking) {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
      stockfishService.stop();
      setIsBotThinking(false);
    }

    if (movesHistory.length === 0) return;

    moveStartTimeRef.current = Date.now();
    setCurrentMoveSeconds(0);
    setPlayerMoveTimes((prev) => prev.slice(0, Math.max(0, prev.length - 1)));
    setLastPlayerMoveTime(null);

    const undoCount = (chess.turn() === playerColor && movesHistory.length >= 2) ? 2 : 1;
    const remainingMoves = movesHistory.slice(0, Math.max(0, movesHistory.length - undoCount));

    let newChess: Chess;
    if (remainingMoves.length === 0) {
      newChess = new Chess();
    } else {
      const last = remainingMoves[remainingMoves.length - 1];
      if (last?.fenAfter) {
        try {
          newChess = new Chess(last.fenAfter);
        } catch {
          newChess = new Chess();
          for (const m of remainingMoves) {
            try { newChess.move(m.san); } catch {}
          }
        }
      } else {
        newChess = new Chess();
        for (const m of remainingMoves) {
          try { newChess.move(m.san); } catch {}
        }
      }
    }

    setChess(newChess);
    movesHistoryRef.current = remainingMoves;
    setMovesHistory(remainingMoves);
    setActiveMoveIndex(remainingMoves.length - 1);
    setSelectedSquare(null);
    setGameResult(null);
    setTerminationText('');

    if (remainingMoves.length > 0) {
      const last = remainingMoves[remainingMoves.length - 1];
      setLastMove({
        from: last.from as Square,
        to: last.to as Square,
        classification: showLiveAnalysis ? last.classification : undefined,
      });
      setCurrentEval(last.evalAfter ?? 0);
    } else {
      setLastMove(null);
      setCurrentEval(0);
    }

    chessAudio.playMove();
  };

  // Rewind game to currently previewed history position
  const handleRewindToPreview = () => {
    if (activeMoveIndex < -1 || activeMoveIndex >= movesHistory.length - 1) return;
    if (isBotThinking) {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
      stockfishService.stop();
      setIsBotThinking(false);
    }

    const remainingMoves = activeMoveIndex === -1 ? [] : movesHistory.slice(0, activeMoveIndex + 1);
    let newChess: Chess;
    if (remainingMoves.length === 0) {
      newChess = new Chess();
    } else {
      const last = remainingMoves[remainingMoves.length - 1];
      if (last?.fenAfter) {
        try {
          newChess = new Chess(last.fenAfter);
        } catch {
          newChess = new Chess();
          for (const m of remainingMoves) {
            try { newChess.move(m.san); } catch {}
          }
        }
      } else {
        newChess = new Chess();
        for (const m of remainingMoves) {
          try { newChess.move(m.san); } catch {}
        }
      }
    }

    setChess(newChess);
    movesHistoryRef.current = remainingMoves;
    setMovesHistory(remainingMoves);
    setActiveMoveIndex(remainingMoves.length - 1);
    setSelectedSquare(null);
    setGameResult(null);
    setTerminationText('');

    if (remainingMoves.length > 0) {
      const last = remainingMoves[remainingMoves.length - 1];
      setLastMove({
        from: last.from as Square,
        to: last.to as Square,
        classification: showLiveAnalysis ? last.classification : undefined,
      });
      setCurrentEval(last.evalAfter ?? 0);
    } else {
      setLastMove(null);
      setCurrentEval(0);
    }

    chessAudio.playMove();
  };

  // Import PGN game and resume/play
  const handleImportPgn = (pgnString: string): boolean => {
    try {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
      stockfishService.stop();
      setIsBotThinking(false);

      const importedChess = new Chess();
      importedChess.loadPgn(pgnString);

      const historyMoves = importedChess.history({ verbose: true });
      const newHistory: MoveAnalysis[] = [];
      const stepChess = new Chess();

      for (const m of historyMoves) {
        const fenBefore = stepChess.fen();
        const evalBefore = chessEngine.evaluatePosition(stepChess);
        stepChess.move(m);
        const fenAfter = stepChess.fen();
        const evalAfter = chessEngine.evaluatePosition(stepChess);

        newHistory.push({
          san: m.san,
          from: m.from,
          to: m.to,
          color: m.color,
          fenBefore,
          fenAfter,
          evalBefore,
          evalAfter,
          evalDelta: (m.color === 'w' ? 1 : -1) * (evalAfter - evalBefore),
          classification: 'good',
          explanation: '',
        });
      }

      setChess(importedChess);
      movesHistoryRef.current = newHistory;
      setMovesHistory(newHistory);
      setActiveMoveIndex(newHistory.length - 1);
      setSelectedSquare(null);
      setGameResult(importedChess.isGameOver() ? (importedChess.turn() === 'w' ? '0-1' : '1-0') : null);

      if (historyMoves.length > 0) {
        const last = historyMoves[historyMoves.length - 1];
        setLastMove({ from: last.from as Square, to: last.to as Square });
        setCurrentEval(chessEngine.evaluatePosition(importedChess));
      } else {
        setLastMove(null);
        setCurrentEval(0);
      }

      chessAudio.playMove();
      return true;
    } catch {
      return false;
    }
  };

  // Preview past move position on board
  const isPreviewingPast = activeMoveIndex >= -1 && movesHistory.length > 0 && activeMoveIndex < movesHistory.length - 1;
  const displayedChess = React.useMemo(() => {
    try {
      if (movesHistory.length === 0) return chess;
      if (activeMoveIndex <= -1) return new Chess();
      if (activeMoveIndex >= movesHistory.length - 1 && !gameResult) return chess;

      const target = movesHistory[activeMoveIndex];
      if (target?.fenAfter) {
        try {
          return new Chess(target.fenAfter);
        } catch (e) {
          console.warn('Error loading FEN for preview:', e);
        }
      }

      const temp = new Chess();
      for (let i = 0; i <= activeMoveIndex && i < movesHistory.length; i++) {
        const m = movesHistory[i];
        if (m?.fenAfter) {
          try {
            temp.load(m.fenAfter);
            continue;
          } catch {}
        }
        if (m) {
          try {
            temp.move(m.san);
          } catch {
            try {
              if (m.from && m.to) {
                temp.move({ from: m.from, to: m.to, promotion: 'q' });
              }
            } catch {}
          }
        }
      }
      return temp;
    } catch (err) {
      console.error('Critical error in displayedChess:', err);
      return chess;
    }
  }, [chess, activeMoveIndex, movesHistory, gameResult]);

  const effectiveMoveIndex = activeMoveIndex >= 0 ? activeMoveIndex : movesHistory.length - 1;

  const displayedLastMove = React.useMemo(() => {
    if (effectiveMoveIndex >= 0 && movesHistory[effectiveMoveIndex]) {
      const m = movesHistory[effectiveMoveIndex];
      return {
        from: m.from as Square,
        to: m.to as Square,
        classification: showLiveAnalysis ? m.classification : undefined,
      };
    }
    return !isPreviewingPast ? lastMove : null;
  }, [isPreviewingPast, lastMove, effectiveMoveIndex, movesHistory, showLiveAnalysis]);

  const displayedEval = React.useMemo(() => {
    if (activeMoveIndex >= 0 && activeMoveIndex < movesHistory.length && movesHistory[activeMoveIndex]) {
      return movesHistory[activeMoveIndex].evalAfter ?? 0;
    }
    return !isPreviewingPast ? currentEval : 0;
  }, [isPreviewingPast, currentEval, activeMoveIndex, movesHistory]);

  const latestPlayerMove = [...movesHistory].reverse().find((m) => m.color === playerColor) || null;

  return (
    <div id="play-match-root" className="w-full h-full max-h-full flex flex-col items-center justify-center overflow-hidden">
      {/* Central Focused Chess Board Area with Viewport-Fit Dynamic Scaling */}
      <div 
        className="w-full flex flex-col items-center justify-center space-y-1 sm:space-y-1.5 max-h-full relative"
        style={{ width: 'min(100%, min(520px, calc(100dvh - 175px)))' }}
      >
        {/* Opponent Info Strip */}
        <div className="flex items-center justify-between px-2.5 py-1 sm:py-1.5 bg-slate-900 border border-slate-800 rounded-lg sm:rounded-xl shadow-xs w-full">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg sm:text-xl shrink-0">{selectedBot.avatar}</span>
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-xs font-bold text-slate-100 truncate">{selectedBot.name}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/20 shrink-0">
                {selectedBot.rating}
              </span>
              {isBotThinking && (
                <span className="text-[10px] text-amber-400 animate-pulse flex items-center gap-1 font-mono shrink-0">
                  <Sparkles className="w-2.5 h-2.5" /> Thinking...
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-mono text-slate-400 font-medium">
              {playerColor === 'w' ? 'Black' : 'White'}
            </span>
            {/* Three Bars Menu Button in Opponent Header (Clicking same icon closes window) */}
            <button
              id="btn-open-side-menu-header"
              type="button"
              onClick={() => setIsSideMenuOpen((prev) => !prev)}
              className={`p-1 sm:p-1.5 rounded-lg transition-colors border cursor-pointer ${
                isSideMenuOpen
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border-slate-700'
              }`}
              title={isSideMenuOpen ? 'Close Side Menu' : 'Open Game Options & Menu (Three Bars)'}
            >
              <Menu className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Interactive Chess Board with Error Boundary */}
        <div className="w-full relative flex items-center justify-center">
          <ErrorBoundary
            fallbackTitle="Board Position Recovery"
            onReset={() => {
              setActiveMoveIndex(movesHistory.length - 1);
              setSelectedSquare(null);
            }}
          >
            <ChessBoard
              chess={displayedChess}
              onMove={handlePlayerMove}
              playerColor={playerColor}
              isInteractive={!gameResult && !isBotThinking && !isPreviewingPast}
              lastMove={displayedLastMove}
              evaluation={displayedEval}
              onPieceSelect={(sq) => setSelectedSquare(sq)}
              selectedSquare={selectedSquare}
              pieceTheme={pieceTheme}
              onPieceThemeChange={handlePieceThemeChange}
              showThemeBar={false}
            />
          </ErrorBoundary>

          {/* Game Over In-Place Overlay Modal (Maintains 100% Zero-Scroll Viewport) */}
          {gameResult && (
            <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 rounded-lg sm:rounded-xl animate-in fade-in zoom-in-95 duration-200">
              <div className="p-3.5 sm:p-4 bg-slate-900 border border-amber-500/40 rounded-xl sm:rounded-2xl shadow-2xl space-y-2 sm:space-y-3 text-center max-w-xs sm:max-w-sm w-full">
                <div className="text-sm sm:text-base font-bold text-amber-300 flex items-center justify-center gap-1.5">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                  Match Finished: {gameResult}
                </div>
                <p className="text-[11px] sm:text-xs text-slate-300">{terminationText}</p>

                {/* Move Timer Pacing Summary */}
                {avgPlayerMoveTime !== null && (
                  <div className="text-[10px] sm:text-[11px] font-mono text-slate-300 bg-slate-950/70 py-1.5 px-2.5 rounded-lg border border-slate-800 flex items-center justify-center gap-2">
                    <span className="flex items-center gap-1">
                      <Timer className="w-3 h-3 text-amber-400" />
                      Avg Move: <strong className="text-amber-300">{avgPlayerMoveTime}s</strong>
                    </span>
                    <span className="text-slate-600">•</span>
                    {impulsiveMovesCount > 0 ? (
                      <span className="text-amber-400 flex items-center gap-0.5">
                        <Zap className="w-3 h-3 text-amber-400" />
                        {impulsiveMovesCount} impulsive {impulsiveMovesCount === 1 ? 'move' : 'moves'} (&lt;2.5s)
                      </span>
                    ) : (
                      <span className="text-emerald-400">✓ Well-paced thinking</span>
                    )}
                  </div>
                )}

                <div className="pt-1 flex flex-col sm:flex-row justify-center gap-2">
                  <button
                    type="button"
                    id="btn-launch-review"
                    onClick={() => {
                      const finalRecord: GameRecord = {
                        id: `game-${Date.now()}`,
                        date: new Date().toLocaleDateString(),
                        whitePlayer: playerColor === 'w' ? 'You' : selectedBot.name,
                        blackPlayer: playerColor === 'b' ? 'You' : selectedBot.name,
                        playerColor,
                        botLevel: selectedBot.name,
                        result: gameResult as any,
                        terminationReason: terminationText,
                        pgn: chess.pgn(),
                        moves: movesHistory,
                        whiteAccuracy: chessEngine.calculateAccuracy(movesHistory, 'w'),
                        blackAccuracy: chessEngine.calculateAccuracy(movesHistory, 'b'),
                        whiteBlunders: movesHistory.filter((m) => m.color === 'w' && m.classification === 'blunder').length,
                        blackBlunders: movesHistory.filter((m) => m.color === 'b' && m.classification === 'blunder').length,
                        whiteMistakes: movesHistory.filter((m) => m.color === 'w' && m.classification === 'mistake').length,
                        blackMistakes: movesHistory.filter((m) => m.color === 'b' && m.classification === 'mistake').length,
                        whiteInaccuracies: movesHistory.filter((m) => m.color === 'w' && m.classification === 'inaccuracy').length,
                        blackInaccuracies: movesHistory.filter((m) => m.color === 'b' && m.classification === 'inaccuracy').length,
                        ratingBefore: userRating,
                        ratingAfter: userRating + (gameResult === '1-0' && playerColor === 'w' ? 15 : -10),
                        avgPlayerMoveTime: avgPlayerMoveTime ?? undefined,
                        impulsiveMoveCount: impulsiveMovesCount,
                      };
                      onNavigateToReview(finalRecord);
                    }}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Full Analysis
                  </button>
                  <button
                    type="button"
                    onClick={() => startNewGame(playerColor, selectedBot)}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Rematch
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Player Info Strip with Move Timer & Impulsive Pace Diagnostics */}
        <div className="flex items-center justify-between px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg sm:rounded-xl shadow-xs w-full">
          {/* Player Identity */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[10px] font-bold text-amber-400 shrink-0">
              You
            </div>
            <span className="text-xs font-bold text-slate-200">Player</span>
            <span className="text-[11px] font-mono text-amber-400 font-semibold">({userRating})</span>
          </div>

          {/* Simple Move Timer (shows seconds per move to detect impulsive habits) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {isPlayerTurn ? (
              <div 
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-mono transition-all ${
                  currentMoveSeconds < 2.5
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                    : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                }`}
                title={
                  currentMoveSeconds < 2.5
                    ? 'Move Timer: Under 2.5s. Careful: playing too fast can lead to impulsive blunders!'
                    : 'Move Timer: Steady & thoughtful move calculation.'
                }
              >
                <Timer className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="font-bold">{currentMoveSeconds.toFixed(1)}s</span>
                {currentMoveSeconds < 2.5 ? (
                  <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-500/25 text-amber-300 uppercase tracking-tight flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5" /> Fast
                  </span>
                ) : (
                  <span className="text-[9px] font-semibold text-emerald-400 hidden sm:inline">
                    Paced
                  </span>
                )}
              </div>
            ) : lastPlayerMoveTime !== null ? (
              <div 
                className="flex items-center gap-1 text-[11px] font-mono text-slate-400"
                title={`Last move took ${lastPlayerMoveTime}s. ${avgPlayerMoveTime ? `Average pace: ${avgPlayerMoveTime}s.` : ''}`}
              >
                <Clock className="w-3 h-3 text-slate-500" />
                <span>
                  Last: <strong className={lastPlayerMoveTime < 2.5 ? 'text-amber-400' : 'text-slate-200'}>{lastPlayerMoveTime}s</strong>
                </span>
                {lastPlayerMoveTime < 2.5 && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/20">
                    Impulsive
                  </span>
                )}
                {avgPlayerMoveTime !== null && (
                  <span className="text-slate-500 hidden md:inline text-[10px]">
                    (avg {avgPlayerMoveTime}s)
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                <Clock className="w-3 h-3 text-slate-600" />
                <span className="text-[10px]">Timer Ready</span>
              </div>
            )}
          </div>

          <span className="text-[11px] font-mono text-slate-400 font-medium shrink-0">
            {playerColor === 'w' ? 'White' : 'Black'}
          </span>
        </div>

        {/* Past Move Preview Banner */}
        {isPreviewingPast && (
          <div className="flex items-center justify-between px-2.5 py-1 bg-amber-950/40 border border-amber-500/30 rounded-lg text-xs text-amber-200 animate-in fade-in w-full">
            <div className="flex items-center gap-1.5 font-medium text-[11px]">
              <span>
                Viewing move {activeMoveIndex === -1 ? '0' : `${activeMoveIndex + 1}/${movesHistory.length}`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleRewindToPreview}
                className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold rounded-md border border-amber-500/40 transition-colors text-[10px]"
              >
                Rewind Here
              </button>
              <button
                type="button"
                onClick={() => setActiveMoveIndex(movesHistory.length - 1)}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-md border border-slate-700 transition-colors text-[10px]"
              >
                Live
              </button>
            </div>
          </div>
        )}

        {/* Essential In-Game Action Bar Directly Under Board */}
        <div className="flex items-center justify-between gap-1.5 pt-0.5 w-full">
          {/* Rewind Icon Button (Handy right below board) */}
          <button
            id="btn-rewind-action-bar"
            type="button"
            onClick={handleRewindMove}
            disabled={movesHistory.length === 0 || isBotThinking}
            className="px-2.5 py-1.5 rounded-lg sm:rounded-xl bg-slate-800/90 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-amber-300 font-semibold border border-amber-500/30 flex items-center gap-1 text-[11px] sm:text-xs transition-colors shadow-xs cursor-pointer"
            title="Rewind previous move"
          >
            <Undo2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Rewind</span>
          </button>

          {/* Quick Stepper Controls & Flip */}
          <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 rounded-lg sm:rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => handleStepMoveIndex(activeMoveIndex - 1)}
              disabled={activeMoveIndex <= -1}
              className="p-1 sm:p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors cursor-pointer"
              title="Previous move"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleStepMoveIndex(activeMoveIndex + 1)}
              disabled={activeMoveIndex >= movesHistory.length - 1}
              className="p-1 sm:p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors cursor-pointer"
              title="Next move"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPlayerColor((prev) => (prev === 'w' ? 'b' : 'w'))}
              className="p-1 sm:p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Flip board"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Essential In-Game Buttons & Three Bars Menu */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={handleDraw}
              disabled={Boolean(gameResult)}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30 text-slate-300 border border-slate-700/80 transition-colors cursor-pointer"
              title="Offer / Claim Draw"
            >
              <Handshake className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleResign}
              disabled={Boolean(gameResult)}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-rose-950/40 hover:bg-rose-900/60 disabled:opacity-30 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
              title="Resign Match"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>

            {/* Consolidated Three Bars Menu Button (Clicking same icon closes window) */}
            <button
              id="btn-open-side-menu-bar"
              type="button"
              onClick={() => setIsSideMenuOpen((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-lg sm:rounded-xl border flex items-center gap-1 text-[11px] sm:text-xs font-semibold transition-colors shadow-xs cursor-pointer ${
                isSideMenuOpen
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 border-slate-700'
              }`}
              title={isSideMenuOpen ? 'Close Side Section' : 'Open Side Section with All Menus & Settings'}
            >
              <Menu className={`w-3.5 h-3.5 ${isSideMenuOpen ? 'text-slate-950' : 'text-amber-400'}`} />
              <span className="hidden sm:inline">{isSideMenuOpen ? 'Close' : 'Menu'}</span>
            </button>
          </div>
        </div>

        {/* Horizontal Move Tracker (Horizontal, Collapsible, Collapsed by Default) */}
        <HorizontalMoveTracker
          moves={movesHistory}
          activeMoveIndex={activeMoveIndex}
          onSelectMoveIndex={(idx) => {
            setIsReplaying(false);
            handleStepMoveIndex(idx);
          }}
          isExpanded={isMovesExpanded}
          onToggleExpand={() => setIsMovesExpanded((prev) => !prev)}
          onStepBackward={() => handleStepMoveIndex(activeMoveIndex - 1)}
          onStepForward={() => handleStepMoveIndex(activeMoveIndex + 1)}
          onStepStart={() => handleStepMoveIndex(-1)}
          onStepEnd={() => handleStepMoveIndex(movesHistory.length - 1)}
          isReplaying={isReplaying}
          onToggleReplay={() => {
            if (movesHistory.length === 0) return;
            if (activeMoveIndex >= movesHistory.length - 1) {
              setActiveMoveIndex(-1);
            }
            setIsReplaying((prev) => !prev);
          }}
        />
      </div>

      {/* Consolidated Side Menu Drawer (Opened via Three Bars icon) */}
      <GameSideMenu
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        selectedBot={selectedBot}
        onSelectBot={(bot) => {
          setSelectedBot(bot);
          startNewGame(playerColor, bot);
        }}
        botDifficulties={BOT_DIFFICULTIES}
        engineMode={engineMode}
        onChangeEngineMode={setEngineMode}
        playerColor={playerColor}
        onStartNewGame={startNewGame}
        onOpenPgnModal={() => setIsPgnModalOpen(true)}
        showLiveAnalysis={showLiveAnalysis}
        onToggleLiveAnalysis={setShowLiveAnalysis}
        stockfishInfo={stockfishInfo}
        pieceTheme={pieceTheme}
        onChangePieceTheme={handlePieceThemeChange}
        onOpenLoreModal={() => setIsLoreModalOpen(true)}
        onResign={handleResign}
        onDraw={handleDraw}
        gameResult={gameResult}
        chess={displayedChess}
        latestPlayerMove={latestPlayerMove}
        selectedSquare={selectedSquare}
        onSaveBlunderAsPuzzle={handleSaveBlunder}
        isSavedAsPuzzle={latestPlayerMove ? savedPuzzleIds.has(latestPlayerMove.san) : false}
      />

      {/* PGN Import / Export Modal */}
      <PgnModal
        isOpen={isPgnModalOpen}
        onClose={() => setIsPgnModalOpen(false)}
        currentPgn={chess.pgn()}
        onImportPgn={handleImportPgn}
        whitePlayerName={playerColor === 'w' ? 'You' : selectedBot.name}
        blackPlayerName={playerColor === 'b' ? 'You' : selectedBot.name}
      />

      {/* Chaturanga Lore Modal */}
      <ChaturangaModal
        isOpen={isLoreModalOpen}
        onClose={() => setIsLoreModalOpen(false)}
      />
    </div>
  );
};
