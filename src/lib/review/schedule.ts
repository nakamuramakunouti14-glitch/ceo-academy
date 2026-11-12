import { createEmptyCard, fsrs, Rating, type Card } from "ts-fsrs";
import type { Attempt } from "@/lib/progress/types";
import { QUESTION_ID } from "@/lib/content/schema";

// 復習の予定 (ai-engineering-academy の src/lib/review/schedule.ts を流用)。
// 予定は保存せず、理解度テストの回答の履歴を古い順に FSRS (ts-fsrs) に通して毎回求める。
// - 対象はテーマの確認クイズとケースの確認問題
// - 一度でも間違えた問題が予定に入る。正解なら Good、不正解なら Again
// - 日をまたいだ間隔で予定する (同じ日のうちに何度も出さない)。「今日」は端末の現地時間の日付で区切る

/**
 * 日単位の予定にする (学習の短い間隔 = 数分後の出し直しを使わない)。間隔のゆらぎ (fuzz) も切り、同じ履歴なら同じ予定にする。
 * それ以外は ts-fsrs の既定の値
 */
const scheduler = fsrs({ enable_short_term: false, enable_fuzz: false });

export interface ReviewItem {
  itemId: string;
  /** 次に復習する日時 */
  due: Date;
}

/** 端末の現地時間の日付 (YYYY-MM-DD) */
function localDay(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/**
 * 同じ日の回答を 1 回にまとめる。その日の最初の回答の時刻で、その日に 1 度でも間違えたら不正解とする。
 * 間違えた後に [もう一度解く] ですぐ正解しても、翌日の復習に出す (同じ日のやり直しで予定を先へ延ばさない)
 */
function onePerDay(history: Pick<Attempt, "correct" | "answeredAt">[]): Pick<Attempt, "correct" | "answeredAt">[] {
  const days = new Map<string, Pick<Attempt, "correct" | "answeredAt">>();
  for (const attempt of history) {
    const day = localDay(attempt.answeredAt);
    const current = days.get(day);
    days.set(day, current ? { answeredAt: current.answeredAt, correct: current.correct && attempt.correct } : attempt);
  }
  return [...days.values()];
}

/** 回答の中から、理解度テストの問題 (固定 ID の形は schema.ts の QUESTION_ID。テーマのクイズとケースの確認問題) の回答だけを、問題ごとに古い順に分ける */
function quizAttemptsByItem(attempts: Pick<Attempt, "itemId" | "correct" | "answeredAt">[]) {
  const byItem = new Map<string, Pick<Attempt, "correct" | "answeredAt">[]>();
  for (const attempt of attempts) {
    if (!QUESTION_ID.test(attempt.itemId)) continue;
    const list = byItem.get(attempt.itemId) ?? [];
    list.push(attempt);
    byItem.set(attempt.itemId, list);
  }
  for (const list of byItem.values()) list.sort((a, b) => a.answeredAt.localeCompare(b.answeredAt));
  return byItem;
}

/** 一度でも間違えた問題の、次の復習日を求める */
export function scheduleReviews(attempts: Pick<Attempt, "itemId" | "correct" | "answeredAt">[]): ReviewItem[] {
  const items: ReviewItem[] = [];
  for (const [itemId, history] of quizAttemptsByItem(attempts)) {
    if (history.every((attempt) => attempt.correct)) continue;
    const days = onePerDay(history);
    let card: Card = createEmptyCard(new Date(days[0].answeredAt));
    for (const attempt of days) {
      card = scheduler.next(card, new Date(attempt.answeredAt), attempt.correct ? Rating.Good : Rating.Again).card;
    }
    items.push({ itemId, due: card.due });
  }
  return items.sort((a, b) => a.due.getTime() - b.due.getTime());
}

/** 端末の現地時間で、その日の終わり (23:59:59.999) */
function endOfLocalDay(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
}

/** 今日の復習。次の復習日が今日の終わりまでに来ている問題 */
export function dueToday(attempts: Pick<Attempt, "itemId" | "correct" | "answeredAt">[], now: Date): ReviewItem[] {
  const limit = endOfLocalDay(now).getTime();
  return scheduleReviews(attempts).filter((item) => item.due.getTime() <= limit);
}
