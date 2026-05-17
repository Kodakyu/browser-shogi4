import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  createInitialState, applyGameMove, getLegalMovesForSquare,
  getLegalDropsForPiece, GameState, Move, PieceType, Player,
} from "@/lib/shogi";
import { buildNotation } from "@/lib/kifu";
import { sfenToState, isValidSfen } from "@/lib/sfen";
import { getCPUMove } from "@/lib/cpu";
import { getStrongCPUMove } from "@/lib/cpu-strong";
import { TSUME_PUZZLES, TsumePuzzle } from "@/lib/tsume-puzzles";
import { Board } from "@/components/Board";
import { HandPieces } from "@/components/HandPieces";
import { PromotionDialog } from "@/components/PromotionDialog";
import { GameStatus, CpuStrength } from "@/components/GameStatus";
import { KifuPanel } from "@/components/KifuPanel";
import { SfenPanel } from "@/components/SfenPanel";
import { TsumePanel } from "@/components/TsumePanel";
import { cn } from "@/lib/utils";

const CPU_PLAYER: Player = 1;
const TIMER_SECONDS = 60;

export default function GamePage() {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [history, setHistory] = useState<GameState[]>([]);
  const [kifu, setKifu] = useState<string[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
  const [selectedDropPiece, setSelectedDropPiece] = useState<PieceType | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<Move | null>(null);
  const [cpuStrength, setCpuStrength] = useState<CpuStrength>("off");
  const [cpuThinking, setCpuThinking] = useState(false);
  const [forcedGameOver, setForcedGameOver] = useState<{ winner: Player; reason: string } | null>(null);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [showKifu, setShowKifu] = useState(false);
  const [showSfen, setShowSfen] = useState(false);
  const [showTsumePanel, setShowTsumePanel] = useState(false);
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);

  // Tsume mode
  const [tsumeMode, setTsumeMode] = useState(false);
  const [tsumePuzzle, setTsumePuzzle] = useState<TsumePuzzle | null>(null);
  const [tsumeSolvedIds, setTsumeSolvedIds] = useState<Set<string>>(new Set());
  const [tsumeSolved, setTsumeSolved] = useState(false);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const cpuActive = tsumeMode || cpuStrength !== "off";
  const effectiveCpuStrength: CpuStrength = tsumeMode ? "strong" : cpuStrength;
  const isHumanTurn = !cpuActive || gameState.currentPlayer !== CPU_PLAYER;
  const isOver = gameState.status !== "playing" || forcedGameOver !== null;
  const isReviewing = reviewIndex !== null;

  // Sente move count in tsume mode (each pair of half-moves = 1 for sente, 1 for gote)
  const tsumeMoves = tsumeMode ? Math.ceil(kifu.length / 2) : 0;

  const allPositions: GameState[] = history.length > 0 ? [...history, gameState] : [gameState];
  const displayedState: GameState = isReviewing ? (allPositions[reviewIndex] ?? gameState) : gameState;

  // ── Load from URL ?sfen= ────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sfenParam = params.get("sfen");
    if (sfenParam && isValidSfen(sfenParam)) {
      try {
        setGameState(sfenToState(sfenParam));
        const url = new URL(window.location.href);
        url.searchParams.delete("sfen");
        window.history.replaceState({}, "", url.toString());
      } catch { /* ignore */ }
    }
  }, []);

  // ── Detect tsume solved ─────────────────────────────────────────────────
  useEffect(() => {
    if (!tsumeMode || tsumeSolved) return;
    if (gameState.status === "checkmate" && gameState.winner === 0) {
      setTsumeSolved(true);
      if (tsumePuzzle) {
        setTsumeSolvedIds(prev => new Set([...prev, tsumePuzzle.id]));
      }
    }
  }, [tsumeMode, tsumeSolved, gameState.status, gameState.winner, tsumePuzzle]);

  // ── Timer reset on turn change ──────────────────────────────────────────
  useEffect(() => { setTimeLeft(TIMER_SECONDS); }, [gameState.currentPlayer]);

  // ── Timer countdown ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerEnabled || tsumeMode || isOver || cpuThinking || !isHumanTurn || isReviewing) return;
    if (timeLeft <= 0) {
      const loser = gameStateRef.current.currentPlayer;
      setForcedGameOver({ winner: (1 - loser) as Player, reason: "時間切れ" });
      return;
    }
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timerEnabled, tsumeMode, timeLeft, isOver, cpuThinking, isHumanTurn, isReviewing]);

  // ── CPU move trigger ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!cpuActive || isOver || isReviewing) return;
    if (gameState.currentPlayer !== CPU_PLAYER) return;

    setCpuThinking(true);
    const delay = effectiveCpuStrength === "strong" ? 200 : 500 + Math.random() * 400;

    const timer = setTimeout(() => {
      const move = effectiveCpuStrength === "strong"
        ? getStrongCPUMove(gameState, 3)
        : getCPUMove(gameState);

      if (move) {
        const notation = buildNotation(gameState.board, move, gameState.currentPlayer);
        setKifu(k => [...k, notation]);
        setHistory(h => [...h, gameState]);
        setGameState(applyGameMove(gameState, move));
        setSelectedSquare(null);
        setSelectedDropPiece(null);
        setLegalMoves([]);
      }
      setCpuThinking(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [cpuActive, effectiveCpuStrength, gameState, isOver, isReviewing]);

  // ── Execute a board move ──────────────────────────────────────────────────
  const executeMove = useCallback((move: Move) => {
    const notation = buildNotation(gameState.board, move, gameState.currentPlayer);
    setKifu(k => [...k, notation]);
    setHistory(h => [...h, gameState]);
    setGameState(applyGameMove(gameState, move));
    setSelectedSquare(null);
    setSelectedDropPiece(null);
    setLegalMoves([]);
  }, [gameState]);

  // ── Square click ──────────────────────────────────────────────────────────
  const handleSquareClick = useCallback((row: number, col: number) => {
    if (isOver || !isHumanTurn || cpuThinking || isReviewing) return;

    if (selectedDropPiece) {
      const dropMove = legalMoves.find(m => m.toRow === row && m.toCol === col && m.drop === selectedDropPiece);
      if (dropMove) { executeMove(dropMove); return; }
      setSelectedDropPiece(null);
      setLegalMoves([]);
    }

    const clickedPiece = gameState.board[row][col];

    if (selectedSquare) {
      const movesHere = legalMoves.filter(m => m.toRow === row && m.toCol === col && !m.drop);
      if (movesHere.length > 0) {
        const hasPromote = movesHere.some(m => m.promote === true);
        const hasNoPromote = movesHere.some(m => !m.promote);
        if (hasPromote && hasNoPromote) {
          setPendingPromotion(movesHere[0]);
        } else {
          executeMove(hasPromote ? movesHere.find(m => m.promote)! : movesHere[0]);
        }
        return;
      }
      if (clickedPiece && clickedPiece.player === gameState.currentPlayer) {
        setSelectedSquare([row, col]);
        setLegalMoves(getLegalMovesForSquare(gameState, row, col));
        return;
      }
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    if (clickedPiece && clickedPiece.player === gameState.currentPlayer) {
      setSelectedSquare([row, col]);
      setSelectedDropPiece(null);
      setLegalMoves(getLegalMovesForSquare(gameState, row, col));
    }
  }, [gameState, selectedSquare, selectedDropPiece, legalMoves, isOver, isHumanTurn, cpuThinking, isReviewing, executeMove]);

  const handleDropPieceSelect = useCallback((player: number, pieceType: PieceType) => {
    if (isOver || isReviewing || player !== gameState.currentPlayer || !isHumanTurn || cpuThinking) return;
    setSelectedSquare(null);
    setSelectedDropPiece(pieceType);
    setLegalMoves(getLegalDropsForPiece(gameState, pieceType));
  }, [gameState, isOver, isReviewing, isHumanTurn, cpuThinking]);

  const handlePromotionDecision = useCallback((promote: boolean) => {
    if (!pendingPromotion) return;
    executeMove({ ...pendingPromotion, promote });
    setPendingPromotion(null);
  }, [pendingPromotion, executeMove]);

  const resetBoard = useCallback((state: GameState) => {
    setGameState(state);
    setHistory([]);
    setKifu([]);
    setSelectedSquare(null);
    setSelectedDropPiece(null);
    setLegalMoves([]);
    setPendingPromotion(null);
    setCpuThinking(false);
    setForcedGameOver(null);
    setTimeLeft(TIMER_SECONDS);
    setReviewIndex(null);
    setTsumeSolved(false);
  }, []);

  const handleNewGame = useCallback(() => {
    resetBoard(createInitialState());
    setTsumeMode(false);
    setTsumePuzzle(null);
  }, [resetBoard]);

  const handleResign = useCallback(() => {
    if (isOver) return;
    const loser = gameState.currentPlayer;
    if (!window.confirm(`${loser === 0 ? "先手" : "後手"}が投了しますか？`)) return;
    setForcedGameOver({ winner: (1 - loser) as Player, reason: "投了" });
  }, [gameState.currentPlayer, isOver]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const stepsBack = cpuActive && history.length >= 2 ? 2 : 1;
    const prevState = history[history.length - stepsBack];
    setHistory(h => h.slice(0, -stepsBack));
    setKifu(k => k.slice(0, -stepsBack));
    setGameState(prevState);
    setSelectedSquare(null);
    setSelectedDropPiece(null);
    setLegalMoves([]);
    setPendingPromotion(null);
    setCpuThinking(false);
    setForcedGameOver(null);
    setTimeLeft(TIMER_SECONDS);
    setReviewIndex(null);
    setTsumeSolved(false);
  }, [history, cpuActive]);

  const handleCycleCpu = useCallback(() => {
    if (tsumeMode) return;
    setCpuStrength(prev => prev === "off" ? "weak" : prev === "weak" ? "strong" : "off");
    setSelectedSquare(null);
    setSelectedDropPiece(null);
    setLegalMoves([]);
    setCpuThinking(false);
  }, [tsumeMode]);

  const handleNavigate = useCallback((index: number | null) => {
    setReviewIndex(index);
    setSelectedSquare(null);
    setSelectedDropPiece(null);
    setLegalMoves([]);
  }, []);

  const handleRestorePosition = useCallback(() => {
    if (reviewIndex === null) return;
    const target = allPositions[reviewIndex] ?? gameState;
    setGameState(target);
    setHistory(history.slice(0, reviewIndex));
    setKifu(kifu.slice(0, reviewIndex));
    setSelectedSquare(null);
    setSelectedDropPiece(null);
    setLegalMoves([]);
    setPendingPromotion(null);
    setCpuThinking(false);
    setForcedGameOver(null);
    setTimeLeft(TIMER_SECONDS);
    setReviewIndex(null);
    setTsumeSolved(false);
  }, [reviewIndex, allPositions, gameState, history, kifu]);

  const handleLoadSfen = useCallback((state: GameState) => {
    resetBoard(state);
    setTsumeMode(false);
    setTsumePuzzle(null);
    setShowSfen(false);
  }, [resetBoard]);

  // ── Tsume handlers ────────────────────────────────────────────────────────
  const handleStartTsumePuzzle = useCallback((state: GameState, puzzle: TsumePuzzle) => {
    resetBoard(state);
    setTsumeMode(true);
    setTsumePuzzle(puzzle);
    setShowTsumePanel(false);
  }, [resetBoard]);

  const handleStartCustomTsume = useCallback((state: GameState) => {
    resetBoard(state);
    setTsumeMode(true);
    setTsumePuzzle(null);
    setShowTsumePanel(false);
  }, [resetBoard]);

  const handleExitTsume = useCallback(() => {
    setTsumeMode(false);
    setTsumePuzzle(null);
    setTsumeSolved(false);
    setShowTsumePanel(false);
  }, []);

  const handleNextPuzzle = useCallback(() => {
    if (!tsumePuzzle) return;
    const idx = TSUME_PUZZLES.findIndex(p => p.id === tsumePuzzle.id);
    const next = TSUME_PUZZLES[idx + 1];
    if (next) {
      try {
        const state = sfenToState(next.sfen);
        resetBoard(state);
        setTsumePuzzle(next);
      } catch { /* ignore */ }
    } else {
      // All done
      setTsumeMode(false);
      setTsumePuzzle(null);
      setTsumeSolved(false);
    }
  }, [tsumePuzzle, resetBoard]);

  const goteHandFlipped = !tsumeMode && cpuStrength === "off";

  return (
    <div className="w-full min-h-[100dvh] bg-background text-foreground font-serif flex flex-col items-center gap-2 p-2 box-border">

      {/* Review mode banner */}
      {isReviewing && (
        <div
          className="w-full flex items-center justify-between px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-lg text-sm font-bold text-primary cursor-pointer"
          style={{ maxWidth: "min(calc(100dvh - 13rem), calc(100dvw - 1rem), 660px)" }}
          onClick={() => setShowKifu(true)}
        >
          <span>棋譜閲覧中 — 第{reviewIndex === 0 ? "0（初期局面）" : `${reviewIndex}`}手</span>
          <span className="text-xs font-normal opacity-70">クリックで棋譜を開く</span>
        </div>
      )}

      {/* Status bar */}
      <div className="w-full" style={{ maxWidth: "min(calc(100dvh - 13rem), calc(100dvw - 1rem), 660px)" }}>
        <GameStatus
          gameState={gameState}
          onNewGame={handleNewGame}
          onResign={handleResign}
          onUndo={handleUndo}
          canUndo={history.length > 0 && !cpuThinking && !isReviewing}
          cpuStrength={cpuStrength}
          onCycleCpu={handleCycleCpu}
          cpuThinking={cpuThinking}
          timerEnabled={timerEnabled}
          onToggleTimer={() => setTimerEnabled(t => !t)}
          timeLeft={timeLeft}
          forcedGameOver={forcedGameOver}
          onShowKifu={() => setShowKifu(true)}
          kifuCount={kifu.length}
          onShowSfen={() => setShowSfen(true)}
          onShowTsume={() => setShowTsumePanel(true)}
          tsumeMode={tsumeMode}
          tsumeMoves={tsumeMoves}
        />
      </div>

      {/* Tsume puzzle info bar */}
      {tsumeMode && tsumePuzzle && !tsumeSolved && (
        <div
          className="w-full flex items-center justify-between px-3 py-1.5 bg-violet-50 border border-violet-200 rounded-lg text-sm"
          style={{ maxWidth: "min(calc(100dvh - 13rem), calc(100dvw - 1rem), 660px)" }}
        >
          <span className="font-bold text-violet-800">
            {tsumePuzzle.difficulty}「{tsumePuzzle.title}」
          </span>
          <button
            onClick={handleExitTsume}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            やめる
          </button>
        </div>
      )}

      {/* Gote hand */}
      <div className="w-full" style={{ maxWidth: "min(calc(100dvh - 13rem), calc(100dvw - 1rem), 660px)" }}>
        <HandPieces
          player={1}
          pieces={displayedState.capturedByGote}
          selectedPiece={!isReviewing && gameState.currentPlayer === 1 && !cpuThinking ? selectedDropPiece : null}
          onPieceSelect={type => handleDropPieceSelect(1, type)}
          isActive={!isReviewing && gameState.currentPlayer === 1 && isHumanTurn && !cpuThinking && !isOver}
          rotatePieces={goteHandFlipped}
        />
      </div>

      {/* Board */}
      <div
        className="flex-shrink-0"
        style={{
          width: "min(calc(100dvh - 13rem), calc(100dvw - 1rem), 660px)",
          height: "min(calc(100dvh - 13rem), calc(100dvw - 1rem), 660px)",
        }}
      >
        <Board
          board={displayedState.board}
          selectedSquare={isReviewing ? null : selectedSquare}
          legalMoves={isReviewing ? [] : legalMoves}
          lastMove={displayedState.lastMove}
          onSquareClick={handleSquareClick}
        />
      </div>

      {/* Sente hand */}
      <div className="w-full" style={{ maxWidth: "min(calc(100dvh - 13rem), calc(100dvw - 1rem), 660px)" }}>
        <HandPieces
          player={0}
          pieces={displayedState.capturedBySente}
          selectedPiece={!isReviewing && gameState.currentPlayer === 0 ? selectedDropPiece : null}
          onPieceSelect={type => handleDropPieceSelect(0, type)}
          isActive={!isReviewing && gameState.currentPlayer === 0 && !cpuThinking && !isOver}
          rotatePieces={false}
        />
      </div>

      <PromotionDialog move={pendingPromotion} onDecide={handlePromotionDecision} />

      {/* ── Tsume solved overlay ────────────────────────────────────────── */}
      {tsumeSolved && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 bg-card border border-border rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 font-serif text-center"
            style={{ width: "min(340px, 90vw)" }}>
            <div className="text-5xl">🎉</div>
            <h2 className="text-2xl font-black text-primary tracking-widest">正解！</h2>
            {tsumePuzzle && (
              <p className="text-base font-bold text-foreground">
                {tsumePuzzle.difficulty}「{tsumePuzzle.title}」<br />
                <span className="text-sm font-normal text-muted-foreground">{kifu.length}手で解決</span>
              </p>
            )}
            {!tsumePuzzle && (
              <p className="text-base text-muted-foreground">{kifu.length}手詰みを発見！</p>
            )}
            <div className="flex flex-col gap-2 w-full">
              {tsumePuzzle && TSUME_PUZZLES.findIndex(p => p.id === tsumePuzzle.id) < TSUME_PUZZLES.length - 1 && (
                <button
                  onClick={handleNextPuzzle}
                  className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
                >
                  次の問題へ
                </button>
              )}
              <button
                onClick={() => setShowTsumePanel(true)}
                className="w-full py-2 rounded-lg border border-border bg-card text-foreground font-bold text-sm hover:bg-muted transition-colors"
              >
                問題一覧
              </button>
              <button
                onClick={handleExitTsume}
                className="w-full py-2 rounded-lg border border-border bg-card text-muted-foreground font-bold text-sm hover:bg-muted transition-colors"
              >
                通常対局に戻る
              </button>
            </div>
          </div>
        </div>
      )}

      {showKifu && (
        <KifuPanel
          kifu={kifu}
          reviewIndex={reviewIndex}
          totalPositions={kifu.length}
          onNavigate={handleNavigate}
          onRestorePosition={handleRestorePosition}
          onClose={() => setShowKifu(false)}
        />
      )}

      {showSfen && (
        <SfenPanel
          gameState={gameState}
          onLoadPosition={handleLoadSfen}
          onClose={() => setShowSfen(false)}
        />
      )}

      {showTsumePanel && (
        <TsumePanel
          currentState={gameState}
          onStartPuzzle={handleStartTsumePuzzle}
          onStartCustom={handleStartCustomTsume}
          onClose={() => setShowTsumePanel(false)}
          solvedIds={tsumeSolvedIds}
        />
      )}
    </div>
  );
}
