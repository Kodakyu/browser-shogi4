import React from "react";
import { PieceType, Player, Piece, PIECE_DISPLAY, PROMOTED_PIECE } from "@/lib/shogi";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PieceDisplayProps {
  piece: Piece;
  className?: string;
  onClick?: () => void;
  isSelected?: boolean;
}

const isPromoted = (type: PieceType): boolean => {
  return ["prook", "pbishop", "psilver", "pknight", "plance", "ppawn"].includes(type);
};

export const PieceDisplay: React.FC<PieceDisplayProps> = ({ piece, className, onClick, isSelected }) => {
  const isGote = piece.player === 1;
  const promoted = isPromoted(piece.type);
  const display = PIECE_DISPLAY[piece.type][isGote ? 1 : 0];

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
      className={cn(
        "relative flex items-center justify-center w-full h-full text-[clamp(1rem,4vmin,2.5rem)] font-bold select-none cursor-pointer piece-drop-shadow transition-colors",
        "bg-[#d4b58a] text-[#2c1d11]", // Piece wood color
        isGote && "rotate-180",
        promoted && "text-destructive",
        isSelected && "ring-2 ring-primary bg-[#e6ceab]",
        className
      )}
      style={{
        clipPath: "polygon(50% 0%, 100% 20%, 90% 100%, 10% 100%, 0% 20%)", // Basic shogi piece shape
      }}
    >
      <span className="leading-none">{display}</span>
    </motion.button>
  );
};
