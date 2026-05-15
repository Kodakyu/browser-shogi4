import React from "react";
import { GameState, Player } from "@/lib/shogi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GameStatusProps {
  gameState: GameState;
  onNewGame: () => void;
  cpuMode: boolean;
  cpuPlayer: Player;
  onToggleCpuMode: () => void;
  cpuThinking: boolean;
}

export const GameStatus: React.FC<GameStatusProps> = ({
  gameState, onNewGame, cpuMode, cpuPlayer, onToggleCpuMode, cpuThinking,
}) => {
  const { currentPlayer, status, winner, inCheck } = gameState;

  return (
    <div className="flex flex-row flex-wrap items-center justify-between gap-3 px-4 py-3 bg-card border border-border rounded-lg shadow-md w-full">
      {/* Turn / Result */}
      <div className="flex items-center gap-3">
        <div className="text-lg font-bold text-foreground">
          {status === "playing" ? (
            cpuThinking ? (
              <span className="text-primary animate-pulse">CPU思考中...</span>
            ) : (
              <span>手番: {currentPlayer === 0 ? "先手" : "後手"}</span>
            )
          ) : status === "checkmate" ? (
            <span className="text-destructive font-black tracking-widest">詰み</span>
          ) : (
            <span>引き分け</span>
          )}
        </div>

        {status === "checkmate" && winner !== null && (
          <div className="text-base font-bold text-primary">
            {winner === 0 ? "先手" : "後手"}の勝ち
          </div>
        )}

        {status === "playing" && inCheck !== null && !cpuThinking && (
          <div className="text-base font-bold text-destructive animate-pulse">王手！</div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* CPU mode toggle */}
        <button
          onClick={onToggleCpuMode}
          className={cn(
            "text-xs font-bold px-3 py-1.5 rounded-full border transition-colors",
            cpuMode
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:border-primary/50",
          )}
          data-testid="toggle-cpu-mode"
        >
          {cpuMode ? `CPU (${cpuPlayer === 1 ? "後手" : "先手"})` : "CPU: 切"}
        </button>

        <Button
          onClick={onNewGame}
          size="sm"
          className="font-bold tracking-wider"
          data-testid="button-new-game"
        >
          新しいゲーム
        </Button>
      </div>
    </div>
  );
};
