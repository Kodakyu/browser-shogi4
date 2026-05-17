import React from "react";
import { PieceType, Player } from "@/lib/shogi";
import { PieceDisplay } from "./PieceDisplay";
import { cn } from "@/lib/utils";

interface HandPiecesProps {
  player: Player;
  pieces: PieceType[];
  selectedPiece: PieceType | null;
  onPieceSelect: (type: PieceType) => void;
  isActive: boolean;
  rotatePieces?: boolean;
}

export const HandPieces: React.FC<HandPiecesProps> = ({
  player, pieces, selectedPiece, onPieceSelect, isActive, rotatePieces = false,
}) => {
  const pieceCounts = pieces.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<PieceType, number>);

  const uniquePieces = Array.from(new Set(pieces));

  return (
    <div className={cn(
      "flex flex-row flex-wrap gap-1.5 px-3 py-2 rounded-md border min-h-[3rem] items-center",
      "bg-card border-border shadow-sm",
      isActive ? "ring-1 ring-primary/50" : "opacity-80",
    )}>
      <span className="text-[0.65rem] font-bold text-muted-foreground mr-1 whitespace-nowrap">
        {player === 0 ? "先手持駒" : "後手持駒"}
      </span>
      {uniquePieces.length === 0 && (
        <span className="text-muted-foreground text-xs opacity-50">なし</span>
      )}
      {uniquePieces.map(type => (
        <button
          key={type}
          className={cn(
            "relative cursor-pointer focus:outline-none",
            selectedPiece === type && "ring-2 ring-primary ring-offset-1 rounded-sm",
            !isActive && "cursor-default",
          )}
          style={{ width: "clamp(1.8rem, 4vmin, 2.5rem)", height: "clamp(2.1rem, 4.7vmin, 2.9rem)" }}
          onClick={() => isActive && onPieceSelect(type)}
          data-testid={`hand-piece-${player}-${type}`}
        >
          {/* rotatePieces shows pieces upside-down (from opponent's perspective in 2-player mode) */}
          <div style={{ transform: rotatePieces ? "rotate(180deg)" : undefined, width: "100%", height: "100%" }}>
            <PieceDisplay piece={{ type, player }} isSelected={selectedPiece === type} small />
          </div>
          {pieceCounts[type] > 1 && (
            <div
              className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[0.55rem] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow"
              style={{ transform: rotatePieces ? "rotate(180deg)" : undefined }}
            >
              {pieceCounts[type]}
            </div>
          )}
        </button>
      ))}
    </div>
  );
};
