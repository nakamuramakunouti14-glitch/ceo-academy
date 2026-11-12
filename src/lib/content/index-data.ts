import type { Content } from "./load";
import type { Connection, Field } from "./schema";

// 画面のどこでも使う、軽い目次。本文や解説は入れない (クライアントに渡すので小さく保つ)。

/** 各分野の入門編のテーマ数 (SPEC の「完成の条件」)。まだ書いていないテーマも、達成度の分母に入れる */
export const THEMES_PER_FIELD = 3;

export interface ThemeEntry {
  id: string;
  field: string;
  order: number;
  title: string;
  summary: string;
  minutes: number;
  questionIds: string[];
  connections: Connection[];
}

export interface CaseEntry {
  id: string;
  kind: "cross" | "field";
  field: string;
  order: number;
  title: string;
  /** 目線の分野 (重なりなし、登場順) */
  fields: string[];
  questionIds: string[];
}

export interface ContentIndex {
  center: string;
  fields: Field[];
  themes: ThemeEntry[];
  cases: CaseEntry[];
}

export function buildIndex(content: Content): ContentIndex {
  return {
    center: content.center,
    fields: content.fields,
    themes: content.themes.map(({ meta, questions }) => ({
      id: meta.id,
      field: meta.field,
      order: meta.order,
      title: meta.title,
      summary: meta.summary,
      minutes: meta.minutes,
      questionIds: questions.map((question) => question.id),
      connections: meta.connections,
    })),
    cases: content.cases.map((item) => ({
      id: item.id,
      kind: item.kind,
      field: item.field,
      order: item.order,
      title: item.title,
      fields: [...new Set([item.field, ...item.perspectives.map((perspective) => perspective.field)])],
      questionIds: item.checks.map((question) => question.id),
    })),
  };
}

/** つながりの先の名前と行き先。to は分野かテーマの ID */
export function resolveConnection(index: ContentIndex, to: string): { label: string; href: string; kind: "field" | "theme" } | null {
  const theme = index.themes.find((candidate) => candidate.id === to);
  if (theme) return { label: theme.title, href: `/themes/${theme.id}`, kind: "theme" };
  const field = index.fields.find((candidate) => candidate.id === to);
  if (field) return { label: field.name, href: `/fields/${field.id}`, kind: "field" };
  return null;
}

/** テーマのつながりから、分野どうしのつながり (重なりなし) を出す。地図の線に使う */
export function fieldLinks(index: ContentIndex): [string, string][] {
  const fieldOf = (id: string) => index.themes.find((theme) => theme.id === id)?.field ?? (index.fields.some((field) => field.id === id) ? id : null);
  const links = new Map<string, [string, string]>();
  for (const theme of index.themes) {
    for (const connection of theme.connections) {
      const other = fieldOf(connection.to);
      if (!other || other === theme.field) continue;
      const pair = [theme.field, other].sort() as [string, string];
      links.set(pair.join("|"), pair);
    }
  }
  return [...links.values()];
}

/** 選んだ分野と、別の分野とのつながり 1 本 */
export interface FieldLink {
  /** つながりを書いたテーマ */
  fromThemeId: string;
  /** つながりの先 (テーマか分野の ID) */
  toId: string;
  note: string;
  /** 選んだ分野から出ていく (from が選んだ分野) か、ほかの分野から入ってくるか */
  direction: "out" | "in";
}

/**
 * 選んだ分野と、つながっているほかの分野の一覧。つながりの本数の多い順。
 * テーマに書いたつながりを、出ていく向きと入ってくる向きの両方から集める
 */
export function linksOfField(index: ContentIndex, fieldId: string): { fieldId: string; links: FieldLink[] }[] {
  const fieldOf = (id: string) => index.themes.find((theme) => theme.id === id)?.field ?? id;
  const groups = new Map<string, FieldLink[]>();
  const add = (other: string, link: FieldLink) => {
    if (other === fieldId) return;
    groups.set(other, [...(groups.get(other) ?? []), link]);
  };
  for (const theme of index.themes) {
    for (const connection of theme.connections) {
      const target = fieldOf(connection.to);
      if (theme.field === fieldId) add(target, { fromThemeId: theme.id, toId: connection.to, note: connection.note, direction: "out" });
      else if (target === fieldId) add(theme.field, { fromThemeId: theme.id, toId: connection.to, note: connection.note, direction: "in" });
    }
  }
  const order = new Map(index.fields.map((field, i) => [field.id, i]));
  return [...groups.entries()]
    .map(([id, links]) => ({ fieldId: id, links }))
    .sort((a, b) => b.links.length - a.links.length || (order.get(a.fieldId) ?? 0) - (order.get(b.fieldId) ?? 0));
}
