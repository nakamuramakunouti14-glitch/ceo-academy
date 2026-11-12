// 進み具合の保存データの形。日時は ISO 形式の文字列で持つ。
// ai-engineering-academy の src/lib/progress を、経営の学習に合わせて絞ったもの (演習とコードの保存は持ってこない)。

export type ThemeStatus = "in-progress" | "done";

export type ThemeProgress = {
  themeId: string;
  status: ThemeStatus;
  updatedAt: string;
};

/** クイズとケースの問題の回答 1 回分 */
export type Attempt = {
  id: string;
  /** 問題の固定 ID (テーマ ID/q-名前、ケース ID/q-名前) */
  itemId: string;
  correct: boolean;
  choiceId: string;
  answeredAt: string;
};

/** ケースを最後まで進めた記録。選んだ案と、模範の考え方と比べた自己判定 */
export type CaseProgress = {
  caseId: string;
  optionId: string;
  /** 自分の考えのメモ (任意) */
  note: string;
  /** 模範の考え方と比べて、考えられていたか */
  selfRating: "close" | "partly" | "missed" | null;
  updatedAt: string;
};

export type LastPosition = { kind: "theme" | "case"; id: string; updatedAt: string };

export type ProgressData = {
  themes: ThemeProgress[];
  attempts: Attempt[];
  cases: CaseProgress[];
  lastPosition: LastPosition | null;
};
