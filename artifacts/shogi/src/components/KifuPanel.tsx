import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface KifuPanelProps {
  kifu: string[];
  onClose: () => void;
}

export const KifuPanel: React.FC<KifuPanelProps> = ({ kifu, onClose }) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [kifu]);

  const handleCopy = () => {
    const text = kifu
      .map((n, i) => `${i + 1}. ${n}`)
      .join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 bg-card border border-border rounded-xl shadow-2xl font-serif flex flex-col"
        style={{ width: "min(360px, 92vw)", maxHeight: "80dvh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="font-bold text-lg">棋譜</span>
          <div className="flex gap-2 items-center">
            <button
              onClick={handleCopy}
              className="text-xs font-bold px-3 py-1 rounded-full border border-border hover:bg-muted transition-colors"
              data-testid="button-copy-kifu"
            >
              コピー
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors text-base"
              aria-label="閉じる"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Move list */}
        <div ref={listRef} className="overflow-y-auto flex-1 p-3">
          {kifu.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">まだ指し手がありません</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
              {kifu.map((notation, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-2 text-sm py-0.5 px-1 rounded",
                    i % 2 === 0 ? "col-start-1" : "col-start-2",
                  )}
                >
                  <span className="text-muted-foreground tabular-nums w-6 text-right flex-shrink-0">{i + 1}.</span>
                  <span className={cn(
                    "font-medium",
                    notation.startsWith("▲") ? "text-foreground" : "text-primary",
                  )}>
                    {notation}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
