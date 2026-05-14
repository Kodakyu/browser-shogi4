import React from "react";
import { GameState } from "@/lib/shogi";
import { Button } from "@/components/ui/button";

interface GameStatusProps {
  gameState: GameState;
  onNewGame: () => void;
}

export const GameStatus: React.FC<GameStatusProps> = ({ gameState, onNewGame }) => {
  const { currentPlayer, status, winner, inCheck } = gameState;

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-card border border-border rounded-lg shadow-lg w-full max-w-sm">
      <div className="text-2xl font-bold text-foreground">
        {status === "playing" ? (
          <span>手番: {currentPlayer === 0 ? "先手" : "後手"}</span>
        ) : status === "checkmate" ? (
          <span className="text-destructive text-3xl font-black tracking-widest">詰み</span>
        ) : (
          <span>千日手</span>
        )}
      </div>

      {status === "checkmate" && winner !== null && (
        <div className="text-xl font-bold text-primary">
          勝者: {winner === 0 ? "先手" : "後手"}
        </div>
      )}

      {status === "playing" && inCheck !== null && (
        <div className="text-xl font-bold text-destructive animate-pulse">
          王手！
        </div>
      )}

      <Button
        onClick={onNewGame}
        className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8 py-6 text-lg tracking-wider"
      >
        新しいゲーム
      </Button>
    </div>
  );
};
