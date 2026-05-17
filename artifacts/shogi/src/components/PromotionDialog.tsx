import React from "react";
import { Move } from "@/lib/shogi";
import { Button } from "@/components/ui/button";

interface PromotionDialogProps {
  move: Move | null;
  onDecide: (promote: boolean) => void;
}

export const PromotionDialog: React.FC<PromotionDialogProps> = ({ move, onDecide }) => {
  if (!move) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onDecide(false)}
      />
      {/* Dialog box */}
      <div className="relative z-10 bg-card border border-border rounded-xl shadow-2xl font-serif p-6 min-w-[280px] flex flex-col items-center gap-4">
        {/* Close button */}
        <button
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-lg leading-none"
          onClick={() => onDecide(false)}
          aria-label="閉じる"
        >
          ✕
        </button>

        <div className="text-2xl font-bold text-foreground">成りますか？</div>
        <div className="text-sm text-muted-foreground">敵陣に入りました。成りますか？</div>

        <div className="flex gap-4 mt-2">
          <Button
            variant="outline"
            className="w-28 h-14 text-lg border-primary text-primary hover:bg-primary/10"
            onClick={() => onDecide(false)}
            data-testid="button-no-promote"
          >
            不成
          </Button>
          <Button
            className="w-28 h-14 text-lg bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onDecide(true)}
            data-testid="button-promote"
          >
            成る
          </Button>
        </div>
      </div>
    </div>
  );
};
