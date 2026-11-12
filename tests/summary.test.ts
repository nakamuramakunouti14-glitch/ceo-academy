import { describe, expect, it } from "vitest";
import type { ContentIndex } from "@/lib/content/index-data";
import { fieldLinks, linksOfField } from "@/lib/content/index-data";
import { isQuizFinished, overallRatio, summarizeFields } from "@/lib/progress/summary";
import type { ProgressData } from "@/lib/progress/types";

const index: ContentIndex = {
  center: "accounting",
  fields: [
    { id: "accounting", name: "財務", short: "財務3表", order: 0, summary: "", howItShows: "", requiresSources: false },
    { id: "marketing", name: "マーケティング", short: "マーケティング", order: 1, summary: "", howItShows: "", requiresSources: false },
  ],
  themes: [
    { id: "accounting-01", field: "accounting", order: 1, title: "PL", summary: "", minutes: 10, questionIds: ["accounting-01/q-a", "accounting-01/q-b"], connections: [{ to: "marketing", note: "" }] },
    { id: "accounting-02", field: "accounting", order: 2, title: "BS", summary: "", minutes: 10, questionIds: [], connections: [{ to: "accounting-01", note: "" }] },
  ],
  cases: [],
};
const empty: ProgressData = { themes: [], attempts: [], cases: [], lastPosition: null };
const attempt = (itemId: string, correct: boolean, answeredAt: string) => ({ id: itemId + answeredAt, itemId, choiceId: "a", correct, answeredAt });

describe("達成度の計算", () => {
  it("何も学んでいないとき、分野をまとめると、どの分野も未着手で分母は 3", () => {
    const summaries = summarizeFields(index, empty);
    expect(summaries.map((summary) => [summary.state, summary.totalThemes])).toEqual([["not-started", 3], ["not-started", 3]]);
    expect(overallRatio(summaries)).toBe(0);
  });

  it("同じ問題に 2 回答えたとき、分野をまとめると、最後の回答で正解を数える", () => {
    const data: ProgressData = {
      ...empty,
      themes: [{ themeId: "accounting-01", status: "done", updatedAt: "" }],
      attempts: [attempt("accounting-01/q-a", false, "2026-11-01T00:00:00Z"), attempt("accounting-01/q-a", true, "2026-11-02T00:00:00Z")],
    };
    const [accounting] = summarizeFields(index, data);
    expect(accounting).toMatchObject({ state: "in-progress", doneThemes: 1, correct: 1, answered: 1 });
    expect(overallRatio(summarizeFields(index, data))).toBeCloseTo(1 / 6);
  });

  it("1 問だけ答えたとき、クイズの終わりを調べると、まだ終わっていない", () => {
    expect(isQuizFinished(["accounting-01/q-a", "accounting-01/q-b"], [attempt("accounting-01/q-a", true, "x")])).toBe(false);
  });

  it("テーマが別の分野へつながっているとき、分野のつながりを出すと、1 本だけになる", () => {
    expect(fieldLinks(index)).toEqual([["accounting", "marketing"]]);
  });
});

describe("分野のつながり", () => {
  it("財務のテーマがマーケティングへつながるとき、マーケティングを選ぶと、入ってくるつながりとして出る", () => {
    const groups = linksOfField(index, "marketing");
    expect(groups).toEqual([{ fieldId: "accounting", links: [{ fromThemeId: "accounting-01", toId: "marketing", note: "", direction: "in" }] }]);
  });

  it("同じ分野の中だけのつながりのとき、その分野を選ぶと、一覧に自分は出ない", () => {
    expect(linksOfField(index, "accounting").map((group) => group.fieldId)).toEqual(["marketing"]);
  });
});
