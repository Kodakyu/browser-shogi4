import React, { useState, useEffect, useCallback } from "react";
import {
  createInitialState, applyGameMove, getLegalMovesForSquare,
  getLegalDropsForPiece, GameState, Move, PieceType, Player,
} from "@/lib/shogi";
import { getCPUMove } from "@/lib/cpu";
import { Board } from "@/components/Board";
import { HandPieces } from "@/components/HandPieces";
import { PromotionDialog } from "@/components/PromotionDialog";
import { GameStatus } from "@/components/GameStatus";

const CPU_PLAYER: Player = 1; // CPU plays as Gote (後手)

export default function GamePage() {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
  const [selectedDropPiece, setSelectedDropPiece] = useState<PieceType | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<Move | null>(null);
  const [cpuMode, setCpuMode] = useState(false);
  const [cpuThinking, setCpuThinking] = useState(false);

  // CPU move trigger
  useEffect(() => {
    if (!cpuMode) return;
    if (gameState.status !== "playing") return;
    if (gameState.currentPlayer !== CPU_PLAYER) return;

    setCpuThinking(true);
    const timer = setTimeout(() => {
      const move = getCPUMove(gameState);
      if (move) {
        setGameState(prev => applyGameMove(prev, move));
        setSelectedSquare(null);
        setSelectedDropPiece(null);
        setLegalMoves([]);
      }
      setCpuThinking(false);
    }, 500 + Math.random() * 400); // 500–900ms delay feels natural

    return () => clearTimeout(timer);
  }, [cpuMode, gameState]);

  const isHumanTurn = !cpuMode || gameState.currentPlayer !== CPU_PLAYER;

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (gameState.status !== "playing") return;
    if (!isHumanTurn || cpuThinking) return;

    // 1. Drop piece selected — try to place it
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
      // fall through to try selecting a piece
    }

    const clickedPiece = gameState.board[row][col];

    // 2. Legal move destination for selected piece
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

      // Clicked own piece — reselect
      if (clickedPiece && clickedPiece.player === gameState.currentPlayer) {
        setSelectedSquare([row, col]);
        setLegalMoves(getLegalMovesForSquare(gameState, row, col));
        return;
      }

      // Clicked elsewhere — deselect
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    // 3. Select current player's piece
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
    const move = { ...pendingPromotion, promote };
    setGameState(applyGameMove(gameState, move));
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

  const handleToggleCpuMode = useCallback(() => {
    setCpuMode(prev => !prev);
    setSelectedSquare(null);
    setSelectedDropPiece(null);
    setLegalMoves([]);
    setCpuThinking(false);
  }, []);

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground font-serif flex flex-col items-center p-3 gap-2 overflow-hidden">
      {/* Status bar */}
      <div className="w-full max-w-[700px]">
        <GameStatus
          gameState={gameState}
          onNewGame={handleNewGame}
          cpuMode={cpuMode}
          cpuPlayer={CPU_PLAYER}
          onToggleCpuMode={handleToggleCpuMode}
          cpuThinking={cpuThinking}
        />
      </div>

      {/* Gote hand (後手持ち駒) */}
      <div className="w-full max-w-[700px]">
        <HandPieces
          player={1}
          pieces={gameState.capturedByGote}
          selectedPiece={gameState.currentPlayer === 1 && !cpuThinking ? selectedDropPiece : null}
          onPieceSelect={type => handleDropPieceSelect(1, type)}
          isActive={gameState.currentPlayer === 1 && isHumanTurn && !cpuThinking}
        />
      </div>

      {/* Board — fills remaining space */}
      <div
        className="flex-1 w-full max-w-[700px] min-h-0"
        style={{ aspectRatio: "10/10" }}
      >
        <div className="w-full h-full" style={{ maxHeight: "min(calc(100dvh - 14rem), 700px)" }}>
          <Board
            board={gameState.board}
            selectedSquare={selectedSquare}
            legalMoves={legalMoves}
            lastMove={gameState.lastMove}
            onSquareClick={handleSquareClick}
          />
        </div>
      </div>

      {/* Sente hand (先手持ち駒) */}
      <div className="w-full max-w-[700px]">
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
