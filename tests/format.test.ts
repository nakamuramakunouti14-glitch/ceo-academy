import { describe, expect, it } from "vitest";
import { formatDelta, paybackYears } from "@/features/case/format";

describe("増減の表示", () => {
  it("減った値のとき、表示すると、△ と桁区切りになる", () => {
    expect(formatDelta(-8030)).toBe("△8,030");
    expect(formatDelta(11096)).toBe("＋11,096");
    expect(formatDelta(0)).toBe("±0");
  });

  it("4 億円の投資で毎年 4,970 万円戻るとき、回収期間を求めると、約 8.0 年になる", () => {
    expect(paybackYears(40000, 4970)).toBe(8);
  });
});
