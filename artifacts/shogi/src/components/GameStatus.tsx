import React from "react";
import { GameState, Player } from "@/lib/shogi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CpuStrength = "off" | "weak" | "strong";

interface GameStatusProps {
  gameState: GameState;
  onNewGame: () => void;
  onResign: () => void;
  onUndo: () => void;
  canUndo: boolean;
  cpuStrength: CpuStrength;
  onCycleCpu: () => void;
  cpuThinking: boolean;
  timerEnabled: boolean;
  onToggleTimer: () => void;
  timeLeft: number;
  forcedGameOver: { winner: Player; reason: string } | null;
  onShowKifu: () => void;
  kifuCount: number;
  onShowSfen: () => void;
  onShowTsume: () => void;
  tsumeMode: boolean;
  tsumeMoves: number;
}

const CPU_LABELS: Record<CpuStrength, string> = {
  off:    "CPU: 切",
  weak:   "CPU: 弱",
  strong: "CPU: 強",
};

function timerColor(t: number) {
  if (t > 30) return "text-foreground";
  if (t > 10) return "text-amber-600";
  return "text-red-600 animate-pulse";
}

export const GameStatus: React.FC<GameStatusProps> = ({
  gameState, onNewGame, onResign, onUndo, canUndo,
  cpuStrength, onCycleCpu, cpuThinking,
  timerEnabled, onToggleTimer, timeLeft,
  forcedGameOver, onShowKifu, kifuCount, onShowSfen,
  onShowTsume, tsumeMode, tsumeMoves,
}) => {
  const { currentPlayer, status, winner, inCheck } = gameState;
  const isOver = status !== "playing" || forcedGameOver !== null;
  const displayWinner = forcedGameOver?.winner ?? winner;
  const displayReason = forcedGameOver?.reason ?? (status === "checkmate" ? "詰み" : "引き分け");

  return (
    <div className="flex flex-row flex-wrap items-center justify-between gap-2 px-3 py-2 bg-card border border-border rounded-lg shadow-md w-full">
      {/* Left: status */}
      <div className="flex items-center gap-2 min-w-0 flex-wrap">
        {tsumeMode && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-300 whitespace-nowrap">
            詰将棋 {tsumeMoves > 0 ? `${tsumeMoves}手` : ""}
          </span>
        )}
        {isOver ? (
          <>
            <span className="text-base font-black text-destructive tracking-widest">{displayReason}</span>
            {displayWinner !== null && (
              <span className="text-sm font-bold text-primary">
                {displayWinner === 0 ? "先手" : "後手"}の勝ち
              </span>
            )}
          </>
        ) : (
          <>
            <span className="text-base font-bold text-foreground whitespace-nowrap">
              {cpuThinking
                ? <span className="text-primary animate-pulse">CPU思考中...</span>
                : `手番: ${currentPlayer === 0 ? "先手" : "後手"}`}
            </span>
            {inCheck !== null && !cpuThinking && (
              <span className="text-sm font-bold text-destructive animate-pulse">王手！</span>
            )}
            {timerEnabled && !cpuThinking && !tsumeMode && (
              <span className={cn("text-sm font-mono font-bold tabular-nums", timerColor(timeLeft))}>
                {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:{String(timeLeft % 60).padStart(2, "0")}
              </span>
            )}
          </>
        )}
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-1.5 flex-wrap justify-end">
        {!tsumeMode && (
          <button
            onClick={onCycleCpu}
            className={cn(
              "text-xs font-bold px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap",
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
        )}

        {!tsumeMode && (
          <button
            onClick={onToggleTimer}
            className={cn(
              "text-xs font-bold px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap",
              timerEnabled
                ? "bg-blue-100 text-blue-800 border-blue-300"
                : "bg-card text-muted-foreground border-border hover:border-primary/50",
            )}
            data-testid="toggle-timer"
          >
            {timerEnabled ? "秒読: 入" : "秒読: 切"}
          </button>
        )}

        <button
          onClick={onShowKifu}
          className="text-xs font-bold px-2.5 py-1 rounded-full border border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors whitespace-nowrap"
          data-testid="button-show-kifu"
        >
          棋譜{kifuCount > 0 ? `(${kifuCount})` : ""}
        </button>

        <button
          onClick={onShowSfen}
          className="text-xs font-bold px-2.5 py-1 rounded-full border border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors whitespace-nowrap"
          data-testid="button-show-sfen"
          title="SFEN形式で局面を保存・共有"
        >
          共有
        </button>

        <button
          onClick={onShowTsume}
          className={cn(
            "text-xs font-bold px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap",
            tsumeMode
              ? "bg-violet-100 text-violet-800 border-violet-300"
              : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground",
          )}
          data-testid="button-show-tsume"
          title="詰将棋モード"
        >
          詰将棋
        </button>

        {!isOver && (
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={cn(
              "text-xs font-bold px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap",
              canUndo
                ? "bg-card text-foreground border-border hover:border-primary/50 hover:bg-muted"
                : "bg-card text-muted-foreground border-border opacity-40 cursor-not-allowed",
            )}
            data-testid="button-undo"
          >
            待った
          </button>
        )}

        {!isOver && (
          <button
            onClick={onResign}
            className="text-xs font-bold px-2.5 py-1 rounded-full border border-destructive/50 text-destructive hover:bg-destructive/10 transition-colors whitespace-nowrap"
            data-testid="button-resign"
          >
            投了
          </button>
        )}

        <Button
          onClick={onNewGame}
          size="sm"
          className="font-bold tracking-wider text-xs whitespace-nowrap h-7 px-3"
          data-testid="button-new-game"
        >
          新局
        </Button>
      </div>
    </div>
  );
};
