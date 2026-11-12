import { IDBFactory, IDBKeyRange } from "fake-indexeddb";
import { afterEach, describe, expect, it } from "vitest";
import { InvalidProgressInputError } from "@/lib/progress/errors";
import { createProgressRepository, type ProgressRepository } from "@/lib/progress/repository";

let repository: ProgressRepository;
const open = () => {
  repository = createProgressRepository({ indexedDB: new IDBFactory(), IDBKeyRange, now: () => new Date("2026-11-07T09:00:00Z") });
  return repository;
};
afterEach(() => repository?.close());

describe("進み具合の保存", () => {
  it("完了したテーマのとき、もう一度開いて学習中にしようとすると、完了のまま残る", async () => {
    const repo = open();
    await repo.markThemeDone("accounting-01");
    await repo.markThemeStarted("accounting-01");
    const data = await repo.exportData();
    expect(data.themes).toEqual([{ themeId: "accounting-01", status: "done", updatedAt: "2026-11-07T09:00:00.000Z" }]);
  });

  it("問題に答えたとき、回答を読み出すと、選んだ選択肢と正誤が残っている", async () => {
    const repo = open();
    await repo.recordAttempt("accounting-01/q-operating-profit", "b", true);
    const [attempt] = (await repo.exportData()).attempts;
    expect(attempt).toMatchObject({ itemId: "accounting-01/q-operating-profit", choiceId: "b", correct: true });
  });

  it("形の合わない ID のとき、回答を保存しようとすると、入力の誤りになり何も残らない", async () => {
    const repo = open();
    await expect(repo.recordAttempt("accounting-01", "a", true)).rejects.toBeInstanceOf(InvalidProgressInputError);
    expect((await repo.exportData()).attempts).toEqual([]);
  });

  it("書き出したデータのとき、別の端末に復元すると、同じ中身になる", async () => {
    const repo = open();
    await repo.markThemeStarted("accounting-02");
    await repo.saveCase({ caseId: "case-cross-01", optionId: "c", note: "まず試す", selfRating: "close" });
    await repo.saveLastPosition("case", "case-cross-01");
    const exported = await repo.exportData();
    repo.close();

    const other = open();
    await other.recordAttempt("accounting-03/q-link", "a", false);
    await other.replaceAllData(exported);
    expect(await other.exportData()).toEqual(exported);
  });
});
