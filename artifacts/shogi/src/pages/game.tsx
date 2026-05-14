import React, { useState, useEffect } from "react";
import { 
  createInitialState, applyGameMove, getAllLegalMoves,
  getLegalMovesForSquare, getLegalDropsForPiece,
  GameState, Move, PieceType 
} from "@/lib/shogi";
import { Board } from "@/components/Board";
import { HandPieces } from "@/components/HandPieces";
import { PromotionDialog } from "@/components/PromotionDialog";
import { GameStatus } from "@/components/GameStatus";

export default function GamePage() {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
  const [selectedDropPiece, setSelectedDropPiece] = useState<PieceType | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<Move | null>(null);

  const handleSquareClick = (row: number, col: number) => {
    if (gameState.status !== "playing") return;

    // 1. If we have a drop piece selected
    if (selectedDropPiece) {
      const dropMove = legalMoves.find(m => m.toRow === row && m.toCol === col && m.drop === selectedDropPiece);
      if (dropMove) {
        setGameState(applyGameMove(gameState, dropMove));
        setSelectedDropPiece(null);
        setLegalMoves([]);
        return;
      }
      setSelectedDropPiece(null); // deselect if clicked elsewhere
      setLegalMoves([]);
    }

    const clickedPiece = gameState.board[row][col];

    // 2. Clicked a square that is a legal move for currently selected piece
    if (selectedSquare) {
      const move = legalMoves.find(m => m.toRow === row && m.toCol === col && !m.drop);
      
      if (move) {
        // check if promotion is possible
        const hasPromoteOption = legalMoves.some(m => m.toRow === row && m.toCol === col && m.promote === true);
        const hasNonPromoteOption = legalMoves.some(m => m.toRow === row && m.toCol === col && m.promote === false || m.promote === undefined);

        if (hasPromoteOption && hasNonPromoteOption) {
          // Ask user
          setPendingPromotion(move);
        } else {
          // Either must promote, or cannot promote. The engine returned only one of them.
          const actualMove = hasPromoteOption ? legalMoves.find(m => m.toRow === row && m.toCol === col && m.promote === true)! : move;
          setGameState(applyGameMove(gameState, actualMove));
          setSelectedSquare(null);
          setLegalMoves([]);
        }
        return;
      }
    }

    // 3. Select a piece of current player
    if (clickedPiece && clickedPiece.player === gameState.currentPlayer) {
      setSelectedSquare([row, col]);
      setSelectedDropPiece(null);
      setLegalMoves(getLegalMovesForSquare(gameState, row, col));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const handleDropPieceSelect = (player: number, pieceType: PieceType) => {
    if (gameState.status !== "playing" || player !== gameState.currentPlayer) return;
    setSelectedSquare(null);
    setSelectedDropPiece(pieceType);
    setLegalMoves(getLegalDropsForPiece(gameState, pieceType));
  };

  const handlePromotionDecision = (promote: boolean) => {
    if (pendingPromotion) {
      const move = { ...pendingPromotion, promote };
      setGameState(applyGameMove(gameState, move));
      setPendingPromotion(null);
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const handleNewGame = () => {
    setGameState(createInitialState());
    setSelectedSquare(null);
    setSelectedDropPiece(null);
    setLegalMoves([]);
    setPendingPromotion(null);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground font-serif flex flex-col items-center py-8 px-4 overflow-x-hidden">
      <div className="max-w-7xl w-full flex flex-col lg:flex-row gap-8 justify-center items-center lg:items-stretch">
        
        {/* Left side / Top side: Game Status and Gote Hand */}
        <div className="flex flex-col gap-6 items-center lg:items-end flex-1">
          <GameStatus gameState={gameState} onNewGame={handleNewGame} />
          
          <div className="w-full flex justify-end">
            <HandPieces 
              player={1} 
              pieces={gameState.capturedByGote} 
              selectedPiece={gameState.currentPlayer === 1 ? selectedDropPiece : null}
              onPieceSelect={(type) => handleDropPieceSelect(1, type)}
            />
          </div>
        </div>

        {/* Center: Board */}
        <div className="flex-none flex justify-center w-full max-w-[600px]">
          <Board 
            board={gameState.board}
            selectedSquare={selectedSquare}
            legalMoves={legalMoves}
            lastMove={gameState.lastMove}
            onSquareClick={handleSquareClick}
          />
        </div>

        {/* Right side / Bottom side: Sente Hand */}
        <div className="flex flex-col gap-6 justify-end items-center lg:items-start flex-1">
          <div className="w-full flex justify-start">
            <HandPieces 
              player={0} 
              pieces={gameState.capturedBySente} 
              selectedPiece={gameState.currentPlayer === 0 ? selectedDropPiece : null}
              onPieceSelect={(type) => handleDropPieceSelect(0, type)}
            />
          </div>
        </div>

      </div>

      <PromotionDialog 
        move={pendingPromotion} 
        onDecide={handlePromotionDecision} 
      />
    </div>
  );
}
