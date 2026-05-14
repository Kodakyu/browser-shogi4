import React from "react";
import { Board as BoardType, Move, PieceType, Player } from "@/lib/shogi";
import { PieceDisplay } from "./PieceDisplay";
import { cn } from "@/lib/utils";

interface BoardProps {
  board: BoardType;
  selectedSquare: [number, number] | null;
  legalMoves: Move[];
  lastMove: Move | null;
  onSquareClick: (row: number, col: number) => void;
}

export const Board: React.FC<BoardProps> = ({ board, selectedSquare, legalMoves, lastMove, onSquareClick }) => {
  const renderSquare = (row: number, col: number) => {
    const square = board[row][col];
    const isSelected = selectedSquare?.[0] === row && selectedSquare?.[1] === col;
    const isLegalMove = legalMoves.some(m => m.toRow === row && m.toCol === col);
    const isLastMove = lastMove?.toRow === row && lastMove?.toCol === col;
    const isLastMoveFrom = lastMove?.fromRow === row && lastMove?.fromCol === col;

    return (
      <div
        key={`${row}-${col}`}
        className={cn(
          "relative border-[1.5px] border-[#8B5A2B]/40 flex items-center justify-center cursor-pointer transition-colors aspect-square",
          isLastMove || isLastMoveFrom ? "bg-primary/20" : "hover:bg-primary/10"
        )}
        onClick={() => onSquareClick(row, col)}
      >
        {isLegalMove && !square && (
          <div className="absolute w-3 h-3 rounded-full bg-primary/60" />
        )}
        {isLegalMove && square && (
          <div className="absolute inset-0 bg-destructive/20" />
        )}
        {square && (
          <div className="w-[85%] h-[90%] flex items-center justify-center">
            <PieceDisplay piece={square} isSelected={isSelected} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col select-none">
      {/* Column labels (9 to 1) */}
      <div className="flex pl-8 pr-2">
        {Array.from({ length: 9 }).map((_, col) => (
          <div key={`col-${col}`} className="flex-1 text-center font-bold text-[#4a3525]">
            {9 - col}
          </div>
        ))}
      </div>

      <div className="flex">
        {/* Row labels right */}
        <div className="flex-1 max-w-fit pr-2 pl-1 order-2">
          {["一", "二", "三", "四", "五", "六", "七", "八", "九"].map((kanji, row) => (
            <div key={`row-${row}`} className="h-[calc(100%/9)] flex items-center justify-center font-bold text-[#4a3525]">
              {kanji}
            </div>
          ))}
        </div>

        {/* Board grid */}
        <div className="grid grid-cols-9 flex-1 bg-[#F5ECD5] border-[4px] border-[#5C4033] shadow-xl p-1 relative w-full aspect-square max-w-[80vmin]">
          {board.map((rowArr, row) =>
            rowArr.map((_, col) => renderSquare(row, col))
          )}
          
          {/* subtle decorative dots for 3x3 intersections */}
          <div className="absolute top-[33.33%] left-[33.33%] w-2 h-2 rounded-full bg-[#5C4033] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute top-[33.33%] right-[33.33%] w-2 h-2 rounded-full bg-[#5C4033] translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-[33.33%] left-[33.33%] w-2 h-2 rounded-full bg-[#5C4033] -translate-x-1/2 translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-[33.33%] right-[33.33%] w-2 h-2 rounded-full bg-[#5C4033] translate-x-1/2 translate-y-1/2 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};
