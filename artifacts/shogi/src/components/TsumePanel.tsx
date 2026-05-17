import React from "react";
import { TSUME_PUZZLES, TsumePuzzle } from "@/lib/tsume-puzzles";
import { sfenToState } from "@/lib/sfen";
import { GameState } from "@/lib/shogi";
import { cn } from "@/lib/utils";

interface TsumePanelProps {
  currentState: GameState;
  onStartPuzzle: (state: GameState, puzzle: TsumePuzzle) => void;
  onStartCustom: (state: GameState) => void;
  onClose: () => void;
  solvedIds: Set<string>;
}

const DIFF_COLOR: Record<string, string> = {
  "1手詰め": "bg-green-100 text-green-800 border-green-300",
  "3手詰め": "bg-amber-100 text-amber-800 border-amber-300",
  "5手詰め": "bg-red-100 text-red-800 border-red-300",
};

export const TsumePanel: React.FC<TsumePanelProps> = ({
  currentState, onStartPuzzle, onStartCustom, onClose, solvedIds,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative z-10 bg-card border border-border rounded-xl shadow-2xl font-serif flex flex-col"
        style={{ width: "min(400px, 94vw)", maxHeight: "82dvh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div>
            <p className="font-bold text-base">詰将棋</p>
            <p className="text-xs text-muted-foreground">先手番で詰みを見つけよう</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Puzzle list */}
        <div className="overflow-y-auto flex-1 p-3 flex flex-col gap-2">
          {TSUME_PUZZLES.map((puzzle) => {
            const solved = solvedIds.has(puzzle.id);
            return (
              <button
                key={puzzle.id}
                onClick={() => {
                  const state = sfenToState(puzzle.sfen);
                  onStartPuzzle(state, puzzle);
                }}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-colors flex items-center gap-3",
                  solved
                    ? "bg-primary/5 border-primary/30 hover:bg-primary/10"
                    : "bg-card border-border hover:bg-muted",
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={cn(
                        "text-xs font-bold px-1.5 py-0.5 rounded border",
                        DIFF_COLOR[puzzle.difficulty],
                      )}
                    >
                      {puzzle.difficulty}
                    </span>
                    {solved && (
                      <span className="text-xs font-bold text-primary">✓ 解答済み</span>
                    )}
                  </div>
                  <p className="font-bold text-sm">{puzzle.title}</p>
                  {puzzle.hint && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                      {puzzle.hint}
                    </p>
                  )}
                </div>
                <span className="text-muted-foreground text-lg flex-shrink-0">›</span>
              </button>
            );
          })}

          {/* Divider */}
          <div className="border-t border-border/60 my-1" />

          {/* Custom position */}
          <button
            onClick={() => onStartCustom(currentState)}
            className="w-full text-left p-3 rounded-lg border border-dashed border-border hover:bg-muted transition-colors flex items-center gap-3"
          >
            <div className="flex-1">
              <p className="font-bold text-sm">現在の局面で解く</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                現在の盤面を詰将棋として挑戦。SFENで局面を読み込んでから使うのがおすすめです。
              </p>
            </div>
            <span className="text-muted-foreground text-lg flex-shrink-0">›</span>
          </button>
        </div>

        <div className="px-4 py-3 border-t border-border/60 flex-shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            詰将棋モードでは先手がCPUと対局します（後手はCPU強）
          </p>
        </div>
      </div>
    </div>
  );
};
