import fs from "node:fs";
import path from "node:path";
import type { Root } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { parse as parseYaml } from "yaml";
import type { z } from "zod";
import {
  caseSchema,
  fieldsFileSchema,
  quizFileSchema,
  themeMetaSchema,
  type CaseStudy,
  type Field,
  type Question,
  type ThemeMeta,
} from "./schema";

// content/ の教材を読む。サーバー側 (ビルドのとき) とテストだけで使う。
// 形が違えば、どのファイルの何がおかしいかを書いて投げ、ビルドを止める。

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n?/;

export interface Theme {
  meta: ThemeMeta;
  /** 本文 (Markdown を読んだ木)。## 見出しが節 */
  body: Root;
  /** ## 見出しの文字 */
  sections: string[];
  questions: Question[];
}

export interface Content {
  center: string;
  fields: Field[];
  themes: Theme[];
  cases: CaseStudy[];
}

function describe(file: string, root: string): string {
  return path.relative(root, file);
}

function parseWith<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new Error(`${label}: 形が違います\n${result.error.message}`);
  return result.data;
}

export function parseMarkdown(source: string): Root {
  return unified().use(remarkParse).use(remarkGfm).parse(source) as Root;
}

function headingText(node: Root["children"][number]): string {
  if (node.type !== "heading") return "";
  return node.children.map((child) => ("value" in child ? child.value : "")).join("");
}

function readTheme(dir: string, root: string): Theme {
  const file = path.join(dir, "theme.md");
  const source = fs.readFileSync(file, "utf8");
  const match = source.match(FRONTMATTER);
  if (!match) throw new Error(`${describe(file, root)}: frontmatter がありません`);
  const meta = parseWith(themeMetaSchema, parseYaml(match[1]), describe(file, root));
  const body = parseMarkdown(source.slice(match[0].length));
  const sections = body.children.filter((node) => node.type === "heading" && node.depth === 2).map(headingText);

  const quizFile = path.join(dir, "quiz.yaml");
  const quiz = fs.existsSync(quizFile)
    ? parseWith(quizFileSchema, parseYaml(fs.readFileSync(quizFile, "utf8")), describe(quizFile, root))
    : null;
  if (quiz && quiz.themeId !== meta.id) throw new Error(`${describe(quizFile, root)}: themeId が theme.md の id と違います`);
  return { meta, body, sections, questions: quiz?.questions ?? [] };
}

function findThemeDirs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const full = path.join(dir, entry.name);
      return fs.existsSync(path.join(full, "theme.md")) ? [full] : findThemeDirs(full);
    })
    .sort();
}

export function loadContent(root = path.join(process.cwd(), "content")): Content {
  const fieldsFile = path.join(root, "fields.yaml");
  const fieldsFileData = parseWith(fieldsFileSchema, parseYaml(fs.readFileSync(fieldsFile, "utf8")), "fields.yaml");
  const fields = [...fieldsFileData.fields].sort((a, b) => a.order - b.order);

  const themes = findThemeDirs(path.join(root, "themes")).map((dir) => readTheme(dir, root));
  themes.sort((a, b) => a.meta.field.localeCompare(b.meta.field) || a.meta.order - b.meta.order);

  const casesDir = path.join(root, "cases");
  const cases = fs.existsSync(casesDir)
    ? fs
        .readdirSync(casesDir)
        .filter((name) => name.endsWith(".yaml"))
        .sort()
        .map((name) => {
          const file = path.join(casesDir, name);
          return parseWith(caseSchema, parseYaml(fs.readFileSync(file, "utf8")), describe(file, root));
        })
    : [];
  cases.sort((a, b) => (a.kind === b.kind ? a.order - b.order : a.kind === "cross" ? -1 : 1));

  return { center: fieldsFileData.center, fields, themes, cases };
}

let cached: Content | null = null;
/** 画面から使う。ビルドの中では 1 回だけ読む */
export function getContent(): Content {
  if (process.env.NODE_ENV === "development") return loadContent();
  cached ??= loadContent();
  return cached;
}
