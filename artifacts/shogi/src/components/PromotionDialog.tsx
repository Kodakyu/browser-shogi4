import React from "react";
import { Move } from "@/lib/shogi";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PromotionDialogProps {
  move: Move | null;
  onDecide: (promote: boolean) => void;
}

export const PromotionDialog: React.FC<PromotionDialogProps> = ({ move, onDecide }) => {
  return (
    <Dialog open={move !== null} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[400px] bg-card text-card-foreground border-border font-serif">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">成りますか？</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground mt-2">
            敵陣に入りました。駒を成りますか？
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row justify-center space-x-4 mt-6 sm:justify-center">
          <Button
            variant="outline"
            className="w-32 h-16 text-lg border-primary text-primary hover:bg-primary/10 transition-colors"
            onClick={() => onDecide(false)}
          >
            不成
          </Button>
          <Button
            className="w-32 h-16 text-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            onClick={() => onDecide(true)}
          >
            成る
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
