import Dexie, { type DexieOptions, type EntityTable } from "dexie";
import type { Attempt, CaseProgress, LastPosition, ThemeProgress } from "./types";

export const DEFAULT_DATABASE_NAME = "ceo-academy-progress";
export const POSITION_KEY = "last";

export type PositionRecord = LastPosition & { key: typeof POSITION_KEY };

/**
 * 表や索引を足す・変えるときは版を上げ、移し替えはその版の upgrade で行う (ai-engineering-academy と同じ決まり)。
 */
export class ProgressDatabase extends Dexie {
  // Dexie が表を割り当てるので、クラスのフィールドとして初期化しない (declare にする)
  declare themeProgress: EntityTable<ThemeProgress, "themeId">;
  declare attempts: EntityTable<Attempt, "id">;
  declare caseProgress: EntityTable<CaseProgress, "caseId">;
  declare position: EntityTable<PositionRecord, "key">;

  constructor(name: string, options?: DexieOptions) {
    super(name, options);
    this.version(1).stores({
      themeProgress: "themeId",
      attempts: "id, itemId",
      caseProgress: "caseId",
      position: "key",
    });
  }
}
