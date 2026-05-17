export interface TsumePuzzle {
  id: string;
  title: string;
  difficulty: "1手詰め" | "3手詰め" | "5手詰め";
  sfen: string;
  hint?: string;
}

export const TSUME_PUZZLES: TsumePuzzle[] = [
  {
    id: "tsume-001",
    title: "基本 金打ち",
    difficulty: "1手詰め",
    sfen: "7gk/7R1/7K1/9/9/9/9/9/9 b G 1",
    hint: "後手玉は1一に追い詰められています。何を打てば詰みますか？",
  },
  {
    id: "tsume-002",
    title: "端玉を追う",
    difficulty: "1手詰め",
    sfen: "kG7/2S6/1K7/9/9/9/9/9/9 b G 1",
    hint: "後手玉は9一の端にいます。逃げ場を塞ぐには？",
  },
  {
    id: "tsume-003",
    title: "二段ロケット",
    difficulty: "3手詰め",
    sfen: "8k/6G2/6K2/9/9/9/9/9/9 b GS 1",
    hint: "まず1二に駒を打って王手。王が逃げた先で金を打ちましょう。",
  },
];
