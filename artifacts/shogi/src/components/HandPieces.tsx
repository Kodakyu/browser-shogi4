import React from "react";
import { PieceType, Player } from "@/lib/shogi";
import { PieceDisplay } from "./PieceDisplay";

interface HandPiecesProps {
  player: Player;
  pieces: PieceType[];
  selectedPiece: PieceType | null;
  onPieceSelect: (type: PieceType) => void;
}

export const HandPieces: React.FC<HandPiecesProps> = ({ player, pieces, selectedPiece, onPieceSelect }) => {
  const pieceCounts = pieces.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<PieceType, number>);

  const uniquePieces = Array.from(new Set(pieces));

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-card border border-border shadow-md rounded-md min-h-[5rem] items-center max-w-[500px]">
      <div className="w-full text-sm font-bold mb-2 text-muted-foreground">
        {player === 0 ? "先手 持ち駒" : "後手 持ち駒"}
      </div>
      {uniquePieces.length === 0 && <span className="text-muted-foreground text-sm opacity-50">なし</span>}
      {uniquePieces.map((type) => (
        <div key={type} className="relative w-10 h-12 sm:w-12 sm:h-14">
          <PieceDisplay
            piece={{ type, player }}
            isSelected={selectedPiece === type}
            onClick={() => onPieceSelect(type)}
          />
          {pieceCounts[type] > 1 && (
            <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
              {pieceCounts[type]}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
