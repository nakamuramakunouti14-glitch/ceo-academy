import { describe, expect, it } from "vitest";
import type { Effects } from "@/lib/content/schema";
import { verifyEffects } from "@/lib/content/verify";

const balanced: Effects = {
  unit: "万円",
  period: "1 年目",
  pl: [
    { item: "売上高", delta: 1000, total: false, netIncome: false },
    { item: "人件費", delta: -400, total: false, netIncome: false },
    { item: "当期純利益", delta: 600, total: true, netIncome: true },
  ],
  bs: [
    { item: "現金", side: "asset", delta: 600, cash: true, retainedEarnings: false },
    { item: "利益剰余金", side: "equity", delta: 600, cash: false, retainedEarnings: true },
  ],
  cf: [
    { item: "当期純利益", section: "operating", delta: 600 },
    { item: "設備", section: "investing", delta: 0 },
    { item: "借入", section: "financing", delta: 0 },
  ],
  assumptions: ["前提"],
};

describe("3 表の数字の確かめ", () => {
  it("釣り合った増減表のとき、確かめると、誤りがない", () => {
    expect(verifyEffects(balanced, "例")).toEqual([]);
  });

  it("小計が上の行の合計と違うとき、確かめると、PL の誤りを知らせる", () => {
    const broken = { ...balanced, pl: balanced.pl.map((row) => (row.total ? { ...row, delta: 700 } : row)) };
    expect(verifyEffects(broken, "例").join()).toContain("PL の「当期純利益」は 700");
  });

  it("BS の左右が合わないとき、確かめると、資産と負債・純資産の差を知らせる", () => {
    const broken = { ...balanced, bs: [...balanced.bs, { item: "建物", side: "asset" as const, delta: 100, cash: false, retainedEarnings: false }] };
    expect(verifyEffects(broken, "例").join()).toContain("BS の資産の増減 700");
  });

  it("CF の合計と現金の増減が違うとき、確かめると、CF の誤りを知らせる", () => {
    const broken = { ...balanced, cf: balanced.cf.map((row) => (row.section === "investing" ? { ...row, delta: -50 } : row)) };
    expect(verifyEffects(broken, "例").join()).toContain("CF の合計 550");
  });
});
