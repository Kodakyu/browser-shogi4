import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  createInitialState, applyGameMove, getLegalMovesForSquare,
  getLegalDropsForPiece, GameState, Move, PieceType, Player,
} from "@/lib/shogi";
import { buildNotation } from "@/lib/kifu";
import { getCPUMove } from "@/lib/cpu";
import { getStrongCPUMove } from "@/lib/cpu-strong";
import { Board } from "@/components/Board";
import { HandPieces } from "@/components/HandPieces";
import { PromotionDialog } from "@/components/PromotionDialog";
import { GameStatus, CpuStrength } from "@/components/GameStatus";
import { KifuPanel } from "@/components/KifuPanel";

const CPU_PLAYER: Player = 1;
const TIMER_SECONDS = 60;

export default function GamePage() {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [history, setHistory] = useState<GameState[]>([]);
  const [kifu, setKifu] = useState<string[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
  const [selectedDropPiece, setSelectedDropPiece] = useState<PieceType | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<Move | null>(null);
  const [cpuStrength, setCpuStrength] = useState<CpuStrength>("off");
  const [cpuThinking, setCpuThinking] = useState(false);
  const [forcedGameOver, setForcedGameOver] = useState<{ winner: Player; reason: string } | null>(null);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [showKifu, setShowKifu] = useState(false);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const cpuActive = cpuStrength !== "off";
  const isHumanTurn = !cpuActive || gameState.currentPlayer !== CPU_PLAYER;
  const isOver = gameState.status !== "playing" || forcedGameOver !== null;

  // Reset timer on turn change
  useEffect(() => {
    setTimeLeft(TIMER_SECONDS);
  }, [gameState.currentPlayer]);

  // Timer countdown
  useEffect(() => {
    if (!timerEnabled || isOver || cpuThinking || !isHumanTurn) return;
    if (timeLeft <= 0) {
      const loser = gameStateRef.current.currentPlayer;
      setForcedGameOver({ winner: (1 - loser) as Player, reason: "時間切れ" });
      return;
    }
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timerEnabled, timeLeft, isOver, cpuThinking, isHumanTurn]);

  // CPU move trigger
  useEffect(() => {
    if (!cpuActive || isOver) return;
    if (gameState.currentPlayer !== CPU_PLAYER) return;

    setCpuThinking(true);
    const delay = cpuStrength === "strong" ? 80 : 500 + Math.random() * 400;

    const timer = setTimeout(() => {
      const move = cpuStrength === "strong"
        ? getStrongCPUMove(gameState, 3)
        : getCPUMove(gameState);

      if (move) {
        const notation = buildNotation(gameState.board, move, gameState.currentPlayer);
        setKifu(k => [...k, notation]);
        setHistory(h => [...h, gameState]);
        setGameState(applyGameMove(gameState, move));
        setSelectedSquare(null);
        setSelectedDropPiece(null);
        setLegalMoves([]);
      }
      setCpuThinking(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [cpuActive, cpuStrength, gameState, isOver]);

  // Execute a board move (shared helper)
  const executeMove = useCallback((move: Move) => {
    const notation = buildNotation(gameState.board, move, gameState.currentPlayer);
    setKifu(k => [...k, notation]);
    setHistory(h => [...h, gameState]);
    setGameState(applyGameMove(gameState, move));
    setSelectedSquare(null);
    setSelectedDropPiece(null);
    setLegalMoves([]);
  }, [gameState]);

  // Square click
  const handleSquareClick = useCallback((row: number, col: number) => {
    if (isOver || !isHumanTurn || cpuThinking) return;

    if (selectedDropPiece) {
      const dropMove = legalMoves.find(
        m => m.toRow === row && m.toCol === col && m.drop === selectedDropPiece,
      );
      if (dropMove) { executeMove(dropMove); return; }
      setSelectedDropPiece(null);
      setLegalMoves([]);
    }

    const clickedPiece = gameState.board[row][col];

    if (selectedSquare) {
      const movesHere = legalMoves.filter(m => m.toRow === row && m.toCol === col && !m.drop);
      if (movesHere.length > 0) {
        const hasPromote = movesHere.some(m => m.promote === true);
        const hasNoPromote = movesHere.some(m => !m.promote);
        if (hasPromote && hasNoPromote) {
          setPendingPromotion(movesHere[0]);
        } else {
          executeMove(hasPromote ? movesHere.find(m => m.promote)! : movesHere[0]);
        }
        return;
      }
      if (clickedPiece && clickedPiece.player === gameState.currentPlayer) {
        setSelectedSquare([row, col]);
        setLegalMoves(getLegalMovesForSquare(gameState, row, col));
        return;
      }
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    if (clickedPiece && clickedPiece.player === gameState.currentPlayer) {
      setSelectedSquare([row, col]);
      setSelectedDropPiece(null);
      setLegalMoves(getLegalMovesForSquare(gameState, row, col));
    }
  }, [gameState, selectedSquare, selectedDropPiece, legalMoves, isOver, isHumanTurn, cpuThinking, executeMove]);

  const handleDropPieceSelect = useCallback((player: number, pieceType: PieceType) => {
    if (isOver || player !== gameState.currentPlayer || !isHumanTurn || cpuThinking) return;
    setSelectedSquare(null);
    setSelectedDropPiece(pieceType);
    setLegalMoves(getLegalDropsForPiece(gameState, pieceType));
  }, [gameState, isOver, isHumanTurn, cpuThinking]);

  const handlePromotionDecision = useCallback((promote: boolean) => {
    if (!pendingPromotion) return;
    executeMove({ ...pendingPromotion, promote });
    setPendingPromotion(null);
  }, [pendingPromotion, executeMove]);

  const handleNewGame = useCallback(() => {
    setGameState(createInitialState());
    setHistory([]);
    setKifu([]);
    setSelectedSquare(null);
    setSelectedDropPiece(null);
    setLegalMoves([]);
    setPendingPromotion(null);
    setCpuThinking(false);
    setForcedGameOver(null);
    setTimeLeft(TIMER_SECONDS);
  }, []);

  const handleResign = useCallback(() => {
    if (isOver) return;
    const loser = gameState.currentPlayer;
    if (!window.confirm(`${loser === 0 ? "先手" : "後手"}が投了しますか？`)) return;
    setForcedGameOver({ winner: (1 - loser) as Player, reason: "投了" });
  }, [gameState.currentPlayer, isOver]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const stepsBack = cpuActive && history.length >= 2 ? 2 : 1;
    const prevState = history[history.length - stepsBack];
    setHistory(h => h.slice(0, -stepsBack));
    setKifu(k => k.slice(0, -stepsBack));
    setGameState(prevState);
    setSelectedSquare(null);
    setSelectedDropPiece(null);
    setLegalMoves([]);
    setPendingPromotion(null);
    setCpuThinking(false);
    setForcedGameOver(null);
    setTimeLeft(TIMER_SECONDS);
  }, [history, cpuActive]);

  const handleCycleCpu = useCallback(() => {
    setCpuStrength(prev => prev === "off" ? "weak" : prev === "weak" ? "strong" : "off");
    setSelectedSquare(null);
    setSelectedDropPiece(null);
    setLegalMoves([]);
    setCpuThinking(false);
  }, []);

  const goteHandFlipped = cpuStrength === "off";

  return (
    <div className="w-full min-h-[100dvh] bg-background text-foreground font-serif flex flex-col items-center gap-2 p-2 box-border">

      <div className="w-full" style={{ maxWidth: "min(calc(100dvh - 13rem), calc(100dvw - 1rem), 660px)" }}>
        <GameStatus
          gameState={gameState}
          onNewGame={handleNewGame}
          onResign={handleResign}
          onUndo={handleUndo}
          canUndo={history.length > 0 && !cpuThinking}
          cpuStrength={cpuStrength}
          onCycleCpu={handleCycleCpu}
          cpuThinking={cpuThinking}
          timerEnabled={timerEnabled}
          onToggleTimer={() => setTimerEnabled(t => !t)}
          timeLeft={timeLeft}
          forcedGameOver={forcedGameOver}
          onShowKifu={() => setShowKifu(true)}
          kifuCount={kifu.length}
        />
      </div>

      <div className="w-full" style={{ maxWidth: "min(calc(100dvh - 13rem), calc(100dvw - 1rem), 660px)" }}>
        <HandPieces
          player={1}
          pieces={gameState.capturedByGote}
          selectedPiece={gameState.currentPlayer === 1 && !cpuThinking ? selectedDropPiece : null}
          onPieceSelect={type => handleDropPieceSelect(1, type)}
          isActive={gameState.currentPlayer === 1 && isHumanTurn && !cpuThinking && !isOver}
          rotatePieces={goteHandFlipped}
        />
      </div>

      <div
        className="flex-shrink-0"
        style={{
          width: "min(calc(100dvh - 13rem), calc(100dvw - 1rem), 660px)",
          height: "min(calc(100dvh - 13rem), calc(100dvw - 1rem), 660px)",
        }}
      >
        <Board
          board={gameState.board}
          selectedSquare={selectedSquare}
          legalMoves={legalMoves}
          lastMove={gameState.lastMove}
          onSquareClick={handleSquareClick}
        />
      </div>

      <div className="w-full" style={{ maxWidth: "min(calc(100dvh - 13rem), calc(100dvw - 1rem), 660px)" }}>
        <HandPieces
          player={0}
          pieces={gameState.capturedBySente}
          selectedPiece={gameState.currentPlayer === 0 ? selectedDropPiece : null}
          onPieceSelect={type => handleDropPieceSelect(0, type)}
          isActive={gameState.currentPlayer === 0 && !cpuThinking && !isOver}
          rotatePieces={false}
        />
      </div>

      <PromotionDialog move={pendingPromotion} onDecide={handlePromotionDecision} />
      {showKifu && <KifuPanel kifu={kifu} onClose={() => setShowKifu(false)} />}
    </div>
  );
}
