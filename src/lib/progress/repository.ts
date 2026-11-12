import Dexie from "dexie";
import { CASE_ID, QUESTION_ID, THEME_ID } from "../content/schema";
import { DEFAULT_DATABASE_NAME, POSITION_KEY, ProgressDatabase } from "./database";
import { InvalidProgressInputError, StorageUnavailableError } from "./errors";
import type { Attempt, CaseProgress, LastPosition, ProgressData, ThemeProgress } from "./types";

/** 画面が進み具合を読み書きする唯一の窓口。将来クラウドの保存先へ差し替えても、画面は変えない。 */
export interface ProgressRepository {
  /** 保存しているものをすべて読む (1 つの読み取りのトランザクション) */
  exportData(): Promise<ProgressData>;
  /** 学習中にする。完了済みは学習中に戻さない */
  markThemeStarted(themeId: string): Promise<ThemeProgress>;
  markThemeDone(themeId: string): Promise<ThemeProgress>;
  recordAttempt(itemId: string, choiceId: string, correct: boolean): Promise<Attempt>;
  saveCase(progress: Omit<CaseProgress, "updatedAt">): Promise<CaseProgress>;
  saveLastPosition(kind: LastPosition["kind"], id: string): Promise<LastPosition>;
  /** 復元。今の進み具合をすべて消し、渡したデータで置き換える。途中で失敗したら何も変えない */
  replaceAllData(data: ProgressData): Promise<void>;
  close(): void;
}

export type ProgressRepositoryOptions = {
  databaseName?: string;
  /** テストでは fake-indexeddb を渡す。省略するとブラウザの IndexedDB を使う */
  indexedDB?: IDBFactory;
  IDBKeyRange?: typeof IDBKeyRange;
  /** 現在時刻。テストで日時を固定するために差し替える */
  now?: () => Date;
};

function createId(): string {
  // randomUUID は安全な接続 (HTTPS か localhost) でしか使えないので、getRandomValues から作る
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function isStorageFailure(error: unknown): boolean {
  return error instanceof Dexie.DexieError || error instanceof DOMException;
}

/** 保存先の失敗を専用のエラーに置き換える。入力の誤りはそのまま返す */
async function guardStorage<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isStorageFailure(error)) throw new StorageUnavailableError(error);
    throw error;
  }
}

function requireId(id: string, pattern: RegExp, label: string): void {
  if (!pattern.test(id)) throw new InvalidProgressInputError(`${label}の ID の形が合いません: ${JSON.stringify(id)}`);
}

export function createProgressRepository(options: ProgressRepositoryOptions = {}): ProgressRepository {
  // 未指定の項目を undefined のまま渡すと、Dexie の既定 (ブラウザの IndexedDB) を上書きしてしまうので、指定したものだけ渡す
  const db = new ProgressDatabase(options.databaseName ?? DEFAULT_DATABASE_NAME, {
    ...(options.indexedDB ? { indexedDB: options.indexedDB } : {}),
    ...(options.IDBKeyRange ? { IDBKeyRange: options.IDBKeyRange } : {}),
  });
  const now = options.now ?? (() => new Date());
  const timestamp = () => now().toISOString();

  function updateTheme(themeId: string, next: (current: ThemeProgress | undefined) => ThemeProgress["status"]) {
    return guardStorage(() => {
      requireId(themeId, THEME_ID, "テーマ");
      return db.transaction("rw", db.themeProgress, async () => {
        const current = await db.themeProgress.get(themeId);
        const status = next(current);
        if (current && current.status === status) return current;
        const record: ThemeProgress = { themeId, status, updatedAt: timestamp() };
        await db.themeProgress.put(record);
        return record;
      });
    });
  }

  return {
    exportData: () =>
      guardStorage(() =>
        db.transaction("r", [db.themeProgress, db.attempts, db.caseProgress, db.position], async () => {
          const [themes, attempts, cases, record] = await Promise.all([
            db.themeProgress.toArray(),
            db.attempts.toArray(),
            db.caseProgress.toArray(),
            db.position.get(POSITION_KEY),
          ]);
          const lastPosition = record ? { kind: record.kind, id: record.id, updatedAt: record.updatedAt } : null;
          return { themes, attempts, cases, lastPosition };
        }),
      ),
    markThemeStarted: (themeId) => updateTheme(themeId, (current) => (current?.status === "done" ? "done" : "in-progress")),
    markThemeDone: (themeId) => updateTheme(themeId, () => "done"),
    recordAttempt: (itemId, choiceId, correct) =>
      guardStorage(async () => {
        requireId(itemId, QUESTION_ID, "問題");
        const attempt: Attempt = { id: createId(), itemId, choiceId, correct, answeredAt: timestamp() };
        await db.attempts.add(attempt);
        return attempt;
      }),
    saveCase: (progress) =>
      guardStorage(async () => {
        requireId(progress.caseId, CASE_ID, "ケース");
        const record: CaseProgress = { ...progress, updatedAt: timestamp() };
        await db.caseProgress.put(record);
        return record;
      }),
    saveLastPosition: (kind, id) =>
      guardStorage(async () => {
        requireId(id, kind === "theme" ? THEME_ID : CASE_ID, kind === "theme" ? "テーマ" : "ケース");
        const position: LastPosition = { kind, id, updatedAt: timestamp() };
        await db.position.put({ key: POSITION_KEY, ...position });
        return position;
      }),
    replaceAllData: (data) =>
      guardStorage(() =>
        db.transaction("rw", [db.themeProgress, db.attempts, db.caseProgress, db.position], async () => {
          await Promise.all([db.themeProgress.clear(), db.attempts.clear(), db.caseProgress.clear(), db.position.clear()]);
          await db.themeProgress.bulkPut(data.themes);
          await db.attempts.bulkPut(data.attempts);
          await db.caseProgress.bulkPut(data.cases);
          if (data.lastPosition) await db.position.put({ key: POSITION_KEY, ...data.lastPosition });
        }),
      ),
    close: () => db.close(),
  };
}
