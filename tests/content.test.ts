import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadContent } from "@/lib/content/load";
import { verifyContent } from "@/lib/content/verify";

// 本物の教材 (content/) を読み、形と整合 (リンク先、問題数、3 表の数字) を確かめる
describe("教材", () => {
  it("content/ を読むと、整合の誤りが 1 つもない", () => {
    const content = loadContent(path.join(process.cwd(), "content"));
    expect(verifyContent(content)).toEqual([]);
  });

  it("content/ を読むと、SPEC の初版の分量（13 分野 × 3 テーマ以上、各分野のケース、横断ケース 5 問以上）がそろっている", () => {
    const content = loadContent(path.join(process.cwd(), "content"));
    expect(content.fields).toHaveLength(13);
    for (const field of content.fields) {
      expect(content.themes.filter((theme) => theme.meta.field === field.id).length, field.id).toBeGreaterThanOrEqual(3);
      expect(content.cases.some((item) => item.kind === "field" && item.field === field.id), `${field.id} のケース`).toBe(true);
    }
    expect(content.cases.filter((item) => item.kind === "cross").length).toBeGreaterThanOrEqual(5);
  });
});
