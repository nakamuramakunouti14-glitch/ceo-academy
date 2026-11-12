import type { Content } from "./load";
import type { CaseStudy, Effects, Question } from "./schema";

// 教材どうしの整合を確かめる。誤りの一覧を返す (空なら合格)。
// npm test (tests/content.test.ts) が本物の教材に対して動かす。

/** 1 テーマの確認クイズの問題数 (SPEC の「完成の条件」) */
export const QUESTIONS_PER_THEME = 5;
/** 横断ケースが通る分野の数の下限 */
export const MIN_CROSS_PERSPECTIVES = 3;
/** 本文に必ず置く節 */
export const REQUIRED_SECTIONS = ["要点"] as const;

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
/** 万円の小数の計算の誤差を許す幅 */
const EPSILON = 1e-6;
const same = (a: number, b: number) => Math.abs(a - b) < EPSILON;

export function verifyEffects(effects: Effects, label: string): string[] {
  const errors: string[] = [];

  // PL: 小計の行は、それより上の (小計でない) 行を全部足した値
  let running = 0;
  for (const row of effects.pl) {
    if (row.total) {
      if (!same(row.delta, running)) errors.push(`${label}: PL の「${row.item}」は ${row.delta} ですが、上の行の合計は ${running} です`);
    } else {
      running += row.delta;
    }
    if (row.netIncome && !row.total) errors.push(`${label}: PL の当期純利益の行「${row.item}」は小計の行にします`);
  }
  const netIncomeRows = effects.pl.filter((row) => row.netIncome);
  if (netIncomeRows.length !== 1) errors.push(`${label}: PL に当期純利益の行を 1 つ置きます (今は ${netIncomeRows.length} 個)`);

  // BS: 資産の増減 = 負債の増減 + 純資産の増減
  const assets = sum(effects.bs.filter((row) => row.side === "asset").map((row) => row.delta));
  const claims = sum(effects.bs.filter((row) => row.side !== "asset").map((row) => row.delta));
  if (!same(assets, claims)) errors.push(`${label}: BS の資産の増減 ${assets} と、負債・純資産の増減 ${claims} が合いません`);

  // BS の現金 = CF の合計
  const cashRows = effects.bs.filter((row) => row.cash);
  const cashFlow = sum(effects.cf.map((row) => row.delta));
  if (cashRows.length !== 1) errors.push(`${label}: BS に現金の行を 1 つ置きます (今は ${cashRows.length} 個)`);
  else if (!same(cashRows[0].delta, cashFlow)) {
    errors.push(`${label}: BS の現金の増減 ${cashRows[0].delta} と、CF の合計 ${cashFlow} が合いません`);
  }
  if (cashRows.some((row) => row.side !== "asset")) errors.push(`${label}: 現金の行は資産 (asset) にします`);

  // 利益剰余金 = 当期純利益 (配当はしない前提)
  const retained = effects.bs.filter((row) => row.retainedEarnings);
  if (retained.length > 1) errors.push(`${label}: 利益剰余金の行は 1 つにします`);
  if (retained.length === 1 && netIncomeRows.length === 1 && !same(retained[0].delta, netIncomeRows[0].delta)) {
    errors.push(`${label}: 利益剰余金の増減 ${retained[0].delta} が当期純利益 ${netIncomeRows[0].delta} と合いません`);
  }
  if (retained.some((row) => row.side !== "equity")) errors.push(`${label}: 利益剰余金の行は純資産 (equity) にします`);

  for (const section of ["operating", "investing", "financing"] as const) {
    if (!effects.cf.some((row) => row.section === section)) errors.push(`${label}: CF に ${section} の行がありません`);
  }
  return errors;
}

function verifyQuestions(questions: Question[], ownerId: string, sections: string[] | null, label: string): string[] {
  const errors: string[] = [];
  for (const question of questions) {
    if (!question.id.startsWith(`${ownerId}/q-`)) errors.push(`${label}: 問題 ${question.id} の ID は ${ownerId}/q- で始めます`);
    const ids = question.choices.map((choice) => choice.id);
    const expected = ["a", "b", "c", "d"].slice(0, ids.length);
    if (ids.join() !== expected.join()) errors.push(`${label}: ${question.id} の選択肢は表示順に ${expected.join("、")} と付けます`);
    if (!ids.includes(question.answer)) errors.push(`${label}: ${question.id} の正解 ${question.answer} が選択肢にありません`);
    if (sections) {
      if (!question.reviewSection) errors.push(`${label}: ${question.id} に reviewSection (読み直す節) を書きます`);
      else if (!sections.includes(question.reviewSection)) {
        errors.push(`${label}: ${question.id} の reviewSection「${question.reviewSection}」が本文の ## 見出しにありません`);
      }
    }
  }
  return errors;
}

/** 選択問題の正解の位置が偏っていないか。同じ位置の正解を半数以下にする */
function verifyAnswerBalance(questions: Question[], label: string): string[] {
  if (questions.length < 4) return [];
  const counts = new Map<string, number>();
  for (const question of questions) counts.set(question.answer, (counts.get(question.answer) ?? 0) + 1);
  return [...counts]
    .filter(([, count]) => count > questions.length / 2)
    .map(([position, count]) => `${label}: 正解が ${position} に偏っています (${questions.length} 問中 ${count} 問)`);
}

function verifyCase(item: CaseStudy, content: Content, themeIds: Set<string>, fieldIds: Set<string>): string[] {
  const label = `ケース ${item.id}`;
  const errors: string[] = [];
  const fieldPart = item.id.match(/^case-(.+)-\d{2}$/)?.[1];
  if (item.kind === "cross" && fieldPart !== "cross") errors.push(`${label}: 横断ケースの ID は case-cross-NN にします`);
  if (item.kind === "field" && fieldPart !== item.field) errors.push(`${label}: 分野内のケースの ID は case-${item.field}-NN にします`);
  if (!fieldIds.has(item.field)) errors.push(`${label}: 分野 ${item.field} がありません`);
  for (const perspective of item.perspectives) {
    if (!fieldIds.has(perspective.field)) errors.push(`${label}: 目線の分野 ${perspective.field} がありません`);
  }
  if (item.kind === "cross") {
    const distinct = new Set(item.perspectives.map((perspective) => perspective.field));
    if (distinct.size < MIN_CROSS_PERSPECTIVES) errors.push(`${label}: 横断ケースは ${MIN_CROSS_PERSPECTIVES} 分野以上の目線で考えます (今は ${distinct.size})`);
    if (!item.effects) errors.push(`${label}: 横断ケースには 3 表への効果 (effects) を書きます`);
  }
  if (item.effects) errors.push(...verifyEffects(item.effects, label));
  for (const themeId of item.relatedThemes) {
    if (!themeIds.has(themeId)) errors.push(`${label}: 関連テーマ ${themeId} がありません`);
  }
  errors.push(...verifyQuestions(item.checks, item.id, null, label));
  const field = content.fields.find((candidate) => candidate.id === item.field);
  if (field?.requiresSources && (item.sources.length === 0 || !item.asOf)) errors.push(`${label}: ${field.name}のケースには出典と時点 (asOf) を書きます`);
  return errors;
}

export function verifyContent(content: Content): string[] {
  const errors: string[] = [];
  const fieldIds = new Set(content.fields.map((field) => field.id));
  const themeIds = new Set(content.themes.map((theme) => theme.meta.id));

  if (!fieldIds.has(content.center)) errors.push(`fields.yaml: 中心の分野 ${content.center} がありません`);
  if (fieldIds.size !== content.fields.length) errors.push("fields.yaml: 分野の ID が重なっています");

  const allIds = [
    ...content.themes.flatMap((theme) => [theme.meta.id, ...theme.questions.map((question) => question.id)]),
    ...content.cases.flatMap((item) => [item.id, ...item.checks.map((question) => question.id)]),
  ];
  const seen = new Set<string>();
  for (const id of allIds) {
    if (seen.has(id)) errors.push(`ID ${id} が重なっています`);
    seen.add(id);
  }

  for (const theme of content.themes) {
    const { meta } = theme;
    const label = `テーマ ${meta.id}`;
    const field = content.fields.find((candidate) => candidate.id === meta.field);
    if (!field) {
      errors.push(`${label}: 分野 ${meta.field} がありません`);
      continue;
    }
    if (!meta.id.startsWith(`${meta.field}-`)) errors.push(`${label}: ID は分野の ID (${meta.field}-) で始めます`);
    // ID の番号は作った順。並び順は order で決める (基礎と専門を混ぜて並べるため、番号とそろえない)
    const sameOrder = content.themes.filter((other) => other.meta.field === meta.field && other.meta.order === meta.order);
    if (sameOrder.length > 1) errors.push(`${label}: 同じ分野に order ${meta.order} が重なっています`);
    for (const section of REQUIRED_SECTIONS) {
      if (!theme.sections.includes(section)) errors.push(`${label}: 本文に「## ${section}」の節がありません`);
    }
    for (const connection of meta.connections) {
      if (connection.to === meta.id || connection.to === meta.field) errors.push(`${label}: 自分自身へのつながり ${connection.to} があります`);
      else if (!fieldIds.has(connection.to) && !themeIds.has(connection.to)) errors.push(`${label}: つながりの先 ${connection.to} がありません`);
    }
    if (field.requiresSources) {
      if (meta.sources.length === 0) errors.push(`${label}: ${field.name}のテーマには出典を書きます`);
      if (!meta.asOf) errors.push(`${label}: ${field.name}のテーマには時点 (asOf) を書きます`);
    }
    if (theme.questions.length !== QUESTIONS_PER_THEME) {
      errors.push(`${label}: 確認クイズは ${QUESTIONS_PER_THEME} 問にします (今は ${theme.questions.length} 問)`);
    }
    errors.push(...verifyQuestions(theme.questions, meta.id, theme.sections, label));
  }

  for (const field of content.fields) {
    const questions = content.themes.filter((theme) => theme.meta.field === field.id).flatMap((theme) => theme.questions);
    errors.push(...verifyAnswerBalance(questions, `分野 ${field.id}`));
  }

  for (const item of content.cases) errors.push(...verifyCase(item, content, themeIds, fieldIds));
  return errors;
}
