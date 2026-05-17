import React, { useState, useEffect, useCallback } from "react";
import {
  createInitialState, applyGameMove, getLegalMovesForSquare,
  getLegalDropsForPiece, GameState, Move, PieceType, Player,
} from "@/lib/shogi";
import { getCPUMove } from "@/lib/cpu";
import { getStrongCPUMove } from "@/lib/cpu-strong";
import { Board } from "@/components/Board";
import { HandPieces } from "@/components/HandPieces";
import { PromotionDialog } from "@/components/PromotionDialog";
import { GameStatus, CpuStrength } from "@/components/GameStatus";

const CPU_PLAYER: Player = 1;

export default function GamePage() {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
  const [selectedDropPiece, setSelectedDropPiece] = useState<PieceType | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<Move | null>(null);
  const [cpuStrength, setCpuStrength] = useState<CpuStrength>("off");
  const [cpuThinking, setCpuThinking] = useState(false);

  const cpuActive = cpuStrength !== "off";

  useEffect(() => {
    if (!cpuActive) return;
    if (gameState.status !== "playing") return;
    if (gameState.currentPlayer !== CPU_PLAYER) return;

    setCpuThinking(true);

    // Use setTimeout so the UI can render "CPU思考中..." before blocking computation
    const timer = setTimeout(() => {
      const move = cpuStrength === "strong"
        ? getStrongCPUMove(gameState, 3)
        : getCPUMove(gameState);

      if (move) {
        setGameState(prev => applyGameMove(prev, move));
        setSelectedSquare(null);
        setSelectedDropPiece(null);
        setLegalMoves([]);
      }
      setCpuThinking(false);
    }, cpuStrength === "strong" ? 80 : 500 + Math.random() * 400);

    return () => clearTimeout(timer);
  }, [cpuActive, cpuStrength, gameState]);

  const isHumanTurn = !cpuActive || gameState.currentPlayer !== CPU_PLAYER;

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (gameState.status !== "playing") return;
    if (!isHumanTurn || cpuThinking) return;

    if (selectedDropPiece) {
      const dropMove = legalMoves.find(
        m => m.toRow === row && m.toCol === col && m.drop === selectedDropPiece,
      );
      if (dropMove) {
        setGameState(applyGameMove(gameState, dropMove));
        setSelectedDropPiece(null);
        setLegalMoves([]);
        return;
      }
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
          const move = hasPromote ? movesHere.find(m => m.promote)! : movesHere[0];
          setGameState(applyGameMove(gameState, move));
          setSelectedSquare(null);
          setLegalMoves([]);
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
  }, [gameState, selectedSquare, selectedDropPiece, legalMoves, isHumanTurn, cpuThinking]);

  const handleDropPieceSelect = useCallback((player: number, pieceType: PieceType) => {
    if (gameState.status !== "playing") return;
    if (player !== gameState.currentPlayer) return;
    if (!isHumanTurn || cpuThinking) return;
    setSelectedSquare(null);
    setSelectedDropPiece(pieceType);
    setLegalMoves(getLegalDropsForPiece(gameState, pieceType));
  }, [gameState, isHumanTurn, cpuThinking]);

  const handlePromotionDecision = useCallback((promote: boolean) => {
    if (!pendingPromotion) return;
    setGameState(applyGameMove(gameState, { ...pendingPromotion, promote }));
    setPendingPromotion(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [pendingPromotion, gameState]);

  const handleNewGame = useCallback(() => {
    setGameState(createInitialState());
    setSelectedSquare(null);
    setSelectedDropPiece(null);
    setLegalMoves([]);
    setPendingPromotion(null);
    setCpuThinking(false);
  }, []);

  const handleCycleCpu = useCallback(() => {
    setCpuStrength(prev =>
      prev === "off" ? "weak" : prev === "weak" ? "strong" : "off"
    );
    setSelectedSquare(null);
    setSelectedDropPiece(null);
    setLegalMoves([]);
    setCpuThinking(false);
  }, []);

  return (
    <div className="w-full min-h-[100dvh] bg-background text-foreground font-serif flex flex-col items-center gap-2 p-2 box-border">

      {/* Status bar */}
      <div className="w-full" style={{ maxWidth: "var(--board-size, 660px)" }}>
        <GameStatus
          gameState={gameState}
          onNewGame={handleNewGame}
          cpuStrength={cpuStrength}
          onCycleCpu={handleCycleCpu}
          cpuThinking={cpuThinking}
        />
      </div>

      {/* Gote hand */}
      <div className="w-full" style={{ maxWidth: "var(--board-size, 660px)" }}>
        <HandPieces
          player={1}
          pieces={gameState.capturedByGote}
          selectedPiece={gameState.currentPlayer === 1 && !cpuThinking ? selectedDropPiece : null}
          onPieceSelect={type => handleDropPieceSelect(1, type)}
          isActive={gameState.currentPlayer === 1 && isHumanTurn && !cpuThinking}
        />
      </div>

      {/* Board — always square, sized to fit viewport */}
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

      {/* Sente hand */}
      <div className="w-full" style={{ maxWidth: "var(--board-size, 660px)" }}>
        <HandPieces
          player={0}
          pieces={gameState.capturedBySente}
          selectedPiece={gameState.currentPlayer === 0 ? selectedDropPiece : null}
          onPieceSelect={type => handleDropPieceSelect(0, type)}
          isActive={gameState.currentPlayer === 0 && !cpuThinking}
        />
      </div>

      <PromotionDialog move={pendingPromotion} onDecide={handlePromotionDecision} />
    </div>
  );
}
