import type { ContentIndex } from "../content/index-data";
import { THEMES_PER_FIELD } from "../content/index-data";
import type { Attempt, ProgressData } from "./types";

// 保存した進み具合から、画面に出す数字 (分野ごとの達成度、正答率) を求める。保存データは書き換えない。

export type FieldState = "not-started" | "in-progress" | "done";

export interface FieldSummary {
  fieldId: string;
  /** 完了したテーマの数 */
  doneThemes: number;
  /** 分母。書いたテーマが THEMES_PER_FIELD より多ければその数 */
  totalThemes: number;
  /** 書き終わっているテーマの数 (まだ書いていないものは開けない) */
  availableThemes: number;
  /** 問題ごとに最後の回答で数えた正解の数と、答えた問題の数 */
  correct: number;
  answered: number;
  state: FieldState;
}

/** 問題ごとの最後の回答 */
export function latestAttempts(attempts: Attempt[]): Map<string, Attempt> {
  const latest = new Map<string, Attempt>();
  for (const attempt of attempts) {
    const current = latest.get(attempt.itemId);
    if (!current || current.answeredAt <= attempt.answeredAt) latest.set(attempt.itemId, attempt);
  }
  return latest;
}

export function themeStatus(data: ProgressData, themeId: string): "not-started" | "in-progress" | "done" {
  return data.themes.find((theme) => theme.themeId === themeId)?.status ?? "not-started";
}

export function summarizeFields(index: ContentIndex, data: ProgressData): FieldSummary[] {
  const latest = latestAttempts(data.attempts);
  return index.fields.map((field) => {
    const themes = index.themes.filter((theme) => theme.field === field.id);
    const statuses = themes.map((theme) => themeStatus(data, theme.id));
    const doneThemes = statuses.filter((status) => status === "done").length;
    const questionIds = themes.flatMap((theme) => theme.questionIds);
    const answeredAttempts = questionIds.map((id) => latest.get(id)).filter((attempt) => attempt !== undefined);
    const totalThemes = Math.max(THEMES_PER_FIELD, themes.length);
    const state: FieldState =
      doneThemes >= totalThemes ? "done" : statuses.some((status) => status !== "not-started") ? "in-progress" : "not-started";
    return {
      fieldId: field.id,
      doneThemes,
      totalThemes,
      availableThemes: themes.length,
      correct: answeredAttempts.filter((attempt) => attempt.correct).length,
      answered: answeredAttempts.length,
      state,
    };
  });
}

/** 全体の達成度 (0〜1)。完了したテーマ ÷ 全分野の分母の合計 */
export function overallRatio(summaries: FieldSummary[]): number {
  const total = summaries.reduce((sum, summary) => sum + summary.totalThemes, 0);
  const done = summaries.reduce((sum, summary) => sum + summary.doneThemes, 0);
  return total === 0 ? 0 : done / total;
}

/** テーマのクイズを全部答え終えたか (正解かどうかは問わない) */
export function isQuizFinished(questionIds: string[], attempts: Attempt[]): boolean {
  const answered = new Set(attempts.map((attempt) => attempt.itemId));
  return questionIds.length > 0 && questionIds.every((id) => answered.has(id));
}
