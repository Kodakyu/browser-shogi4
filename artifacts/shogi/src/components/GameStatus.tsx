import React from "react";
import { GameState } from "@/lib/shogi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CpuStrength = "off" | "weak" | "strong";

interface GameStatusProps {
  gameState: GameState;
  onNewGame: () => void;
  cpuStrength: CpuStrength;
  onCycleCpu: () => void;
  cpuThinking: boolean;
}

const CPU_LABELS: Record<CpuStrength, string> = {
  off:    "CPU: 切",
  weak:   "CPU: 弱",
  strong: "CPU: 強",
};

export const GameStatus: React.FC<GameStatusProps> = ({
  gameState, onNewGame, cpuStrength, onCycleCpu, cpuThinking,
}) => {
  const { currentPlayer, status, winner, inCheck } = gameState;

  return (
    <div className="flex flex-row flex-wrap items-center justify-between gap-2 px-3 py-2 bg-card border border-border rounded-lg shadow-md w-full">
      <div className="flex items-center gap-3 min-w-0">
        <div className="text-base font-bold text-foreground whitespace-nowrap">
          {status === "playing" ? (
            cpuThinking
              ? <span className="text-primary animate-pulse">CPU思考中...</span>
              : <span>手番: {currentPlayer === 0 ? "先手" : "後手"}</span>
          ) : status === "checkmate" ? (
            <span className="text-destructive font-black tracking-widest">詰み</span>
          ) : (
            <span>引き分け</span>
          )}
        </div>
        {status === "checkmate" && winner !== null && (
          <div className="text-sm font-bold text-primary whitespace-nowrap">
            {winner === 0 ? "先手" : "後手"}の勝ち
          </div>
        )}
        {status === "playing" && inCheck !== null && !cpuThinking && (
          <div className="text-sm font-bold text-destructive animate-pulse whitespace-nowrap">王手！</div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onCycleCpu}
          className={cn(
            "text-xs font-bold px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap",
            cpuStrength === "off"
              ? "bg-card text-muted-foreground border-border hover:border-primary/50"
              : cpuStrength === "weak"
              ? "bg-amber-100 text-amber-800 border-amber-300"
              : "bg-red-100 text-red-800 border-red-300",
          )}
          data-testid="toggle-cpu-mode"
        >
          {CPU_LABELS[cpuStrength]}
        </button>

        <Button
          onClick={onNewGame}
          size="sm"
          className="font-bold tracking-wider whitespace-nowrap"
          data-testid="button-new-game"
        >
          新しいゲーム
        </Button>
      </div>
    </div>
  );
};
