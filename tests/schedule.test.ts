import { describe, expect, it } from "vitest";
import { dueToday, scheduleReviews } from "@/lib/review/schedule";

const attempt = (itemId: string, correct: boolean, answeredAt: string) => ({ itemId, correct, answeredAt });

describe("復習の予定", () => {
  it("全部正解した問題のとき、予定を求めると、復習に入らない", () => {
    expect(scheduleReviews([attempt("accounting-01/q-a", true, "2026-11-01T09:00:00")])).toEqual([]);
  });

  it("間違えた問題のとき、翌日の予定を見ると、今日の復習に入っている", () => {
    const attempts = [attempt("case-cross-01/q-cash", false, "2026-11-01T09:00:00")];
    expect(dueToday(attempts, new Date("2026-11-01T10:00:00"))).toEqual([]);
    expect(dueToday(attempts, new Date("2026-11-02T10:00:00")).map((item) => item.itemId)).toEqual(["case-cross-01/q-cash"]);
  });

  it("問題でない ID の回答のとき、予定を求めると、無視する", () => {
    expect(scheduleReviews([attempt("accounting-01", false, "2026-11-01T09:00:00")])).toEqual([]);
  });
});
