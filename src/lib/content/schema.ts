import { z } from "zod";

// 教材の形の正。説明は docs/content-format.md。
// 読み込み (load.ts) はこの形で確かめ、形が違えばビルドを止める。中身どうしの整合 (リンク先がある、数字が合う) は verify.ts。

export const FIELD_ID = /^[a-z][a-z-]*[a-z]$/;
export const THEME_ID = /^([a-z][a-z-]*[a-z])-(\d{2})$/;
export const CASE_ID = /^case-(cross|[a-z][a-z-]*[a-z])-(\d{2})$/;
/** 問題の ID。テーマかケースの ID の後に /q-名前 */
export const QUESTION_ID = /^(.+)\/q-[a-z0-9]+(?:-[a-z0-9]+)*$/;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付は YYYY-MM-DD で書きます");

export const sourceSchema = z.object({
  title: z.string().min(1),
  url: z.url(),
  /** 確かめた日 */
  checkedAt: isoDate,
});
export type Source = z.infer<typeof sourceSchema>;

export const fieldSchema = z.object({
  id: z.string().regex(FIELD_ID),
  name: z.string().min(1),
  /** 地図に出す短い名前 */
  short: z.string().min(1),
  /** 学ぶ順番。財務 (中心) が 0 */
  order: z.number().int().min(0),
  /** 一言の説明 */
  summary: z.string().min(1),
  /** この分野の判断が、財務3表のどこに表れるか (1文)。地図で使う */
  howItShows: z.string().min(1),
  /** 法務・税務など。テーマに出典と時点が必要 */
  requiresSources: z.boolean().default(false),
});
export type Field = z.infer<typeof fieldSchema>;
export const fieldsFileSchema = z.object({ schemaVersion: z.literal(1), center: z.string(), fields: z.array(fieldSchema) });

/** つながり。to は分野の ID かテーマの ID */
export const connectionSchema = z.object({
  to: z.string().min(1),
  /** その分野ではどう効くか (1〜2 文) */
  note: z.string().min(1),
});
export type Connection = z.infer<typeof connectionSchema>;

export const themeMetaSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().regex(THEME_ID),
  field: z.string().regex(FIELD_ID),
  order: z.number().int().min(1),
  title: z.string().min(1),
  minutes: z.number().int().min(1),
  /** 一覧に出す一言 */
  summary: z.string().min(1),
  connections: z.array(connectionSchema).min(1, "つながりを 1 つ以上書きます"),
  sources: z.array(sourceSchema).default([]),
  /** いつ時点の情報か。法務・税務では必須 (verify.ts で確かめる) */
  asOf: isoDate.optional(),
  status: z.enum(["draft", "reviewed"]),
});
export type ThemeMeta = z.infer<typeof themeMetaSchema>;

const choiceSchema = z.object({ id: z.enum(["a", "b", "c", "d"]), label: z.string().min(1) });

export const questionSchema = z.object({
  id: z.string().regex(QUESTION_ID),
  prompt: z.string().min(1),
  choices: z.array(choiceSchema).min(2).max(4),
  answer: z.enum(["a", "b", "c", "d"]),
  explanation: z.string().min(1),
  /** 間違えたときに読み直す節 (本文の ## 見出し)。ケースの問題では省く */
  reviewSection: z.string().min(1).optional(),
});
export type Question = z.infer<typeof questionSchema>;

export const quizFileSchema = z.object({
  schemaVersion: z.literal(1),
  themeId: z.string().regex(THEME_ID),
  questions: z.array(questionSchema),
});

// ケース

/** 3 表の 1 行。delta の意味は表ごとに違う (docs/content-format.md の「増減表」) */
const plRowSchema = z.object({
  item: z.string().min(1),
  /** 利益への効果 (万円)。費用が増えたら負 */
  delta: z.number(),
  /** 小計・合計の行。上の行 (前の小計から) を足した値と一致させる */
  total: z.boolean().default(false),
  /** 当期純利益の行。BS の利益剰余金と照らす */
  netIncome: z.boolean().default(false),
});
const bsRowSchema = z.object({
  item: z.string().min(1),
  side: z.enum(["asset", "liability", "equity"]),
  /** 残高の増減 (万円) */
  delta: z.number(),
  /** 現金・預金の行。CF の合計と照らす */
  cash: z.boolean().default(false),
  /** 利益剰余金の行。PL の当期純利益と照らす */
  retainedEarnings: z.boolean().default(false),
});
const cfRowSchema = z.object({
  item: z.string().min(1),
  section: z.enum(["operating", "investing", "financing"]),
  delta: z.number(),
});

export const effectsSchema = z.object({
  unit: z.literal("万円"),
  /** いつの時点の効果か (例: 改装後の 1 年目) */
  period: z.string().min(1),
  pl: z.array(plRowSchema).min(1),
  bs: z.array(bsRowSchema).min(1),
  cf: z.array(cfRowSchema).min(1),
  /** 投資の回収期間を出すとき。年数は画面が計算する (書いた数字と食い違わないように) */
  payback: z.object({ investment: z.number().positive(), annualCash: z.number().positive(), note: z.string().min(1) }).optional(),
  /** 数字の前提 (簡単にしたところも書く) */
  assumptions: z.array(z.string().min(1)).min(1),
});
export type Effects = z.infer<typeof effectsSchema>;

export const caseSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().regex(CASE_ID),
  kind: z.enum(["cross", "field"]),
  /** 分野内のケースはその分野。横断ケースは主な分野 */
  field: z.string().regex(FIELD_ID),
  order: z.number().int().min(1),
  title: z.string().min(1),
  /** 架空の会社の紹介 (1 行) */
  company: z.string().min(1),
  situation: z.string().min(1),
  facts: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })).min(1).max(4),
  question: z.string().min(1),
  options: z
    .array(z.object({ id: z.enum(["a", "b", "c"]), label: z.string().min(1), detail: z.string().min(1) }))
    .min(2)
    .max(3),
  /** 複数の分野の目線で順に考える。横断ケースは 3 つ以上 */
  perspectives: z.array(z.object({ field: z.string().regex(FIELD_ID), heading: z.string().min(1), body: z.string().min(1) })).min(1),
  /** 数字で確かめる問題 */
  checks: z.array(questionSchema).default([]),
  effects: effectsSchema.optional(),
  /** 模範の考え方 */
  modelAnswer: z.string().min(1),
  relatedThemes: z.array(z.string().regex(THEME_ID)).default([]),
  sources: z.array(sourceSchema).default([]),
  asOf: isoDate.optional(),
  status: z.enum(["draft", "reviewed"]),
});
export type CaseStudy = z.infer<typeof caseSchema>;
