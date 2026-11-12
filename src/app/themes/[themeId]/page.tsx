import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConnectionsList } from "@/components/connections-list";
import { Blocks } from "@/components/markdown";
import { buildIndex } from "@/lib/content/index-data";
import { getContent } from "@/lib/content/load";
import { ThemeQuiz } from "@/features/quiz/theme-quiz";

export function generateStaticParams() {
  return getContent().themes.map((theme) => ({ themeId: theme.meta.id }));
}

export async function generateMetadata({ params }: PageProps<"/themes/[themeId]">): Promise<Metadata> {
  const { themeId } = await params;
  const theme = getContent().themes.find((candidate) => candidate.meta.id === themeId);
  return { title: theme ? `${theme.meta.title}｜CEO アカデミー` : "CEO アカデミー" };
}

export default async function ThemePage({ params }: PageProps<"/themes/[themeId]">) {
  const { themeId } = await params;
  const content = getContent();
  const theme = content.themes.find((candidate) => candidate.meta.id === themeId);
  if (!theme) notFound();
  const index = buildIndex(content);
  const field = content.fields.find((candidate) => candidate.id === theme.meta.field);
  const siblings = content.themes.filter((candidate) => candidate.meta.field === theme.meta.field);
  const position = siblings.findIndex((candidate) => candidate.meta.id === themeId);
  const next = siblings[position + 1];
  const cases = content.cases.filter((item) => item.relatedThemes.includes(themeId));

  return (
    <main className="px-4 md:px-9">
      <article className="mx-auto flex max-w-[42rem] flex-col gap-10 py-4 md:py-8">
        <header className="flex flex-col gap-3">
          <p className="text-sm text-ink-faint">
            <Link href={`/fields/${field?.id}`} className="underline-offset-4 hover:underline">
              {field?.name}
            </Link>
            <span className="tnum ml-3">
              テーマ {theme.meta.order}／{Math.max(3, siblings.length)}　約 {theme.meta.minutes} 分
            </span>
          </p>
          <h1 className="text-[26px] leading-snug font-bold text-balance md:text-3xl">{theme.meta.title}</h1>
          {theme.meta.asOf && <p className="text-sm text-ink-soft">{theme.meta.asOf} 時点の情報</p>}
        </header>

        <div className="flex flex-col gap-4 text-base leading-[1.9]">
          <Blocks nodes={theme.body.children} />
        </div>

        <ConnectionsList index={index} connections={theme.meta.connections} />

        <ThemeQuiz themeId={theme.meta.id} questions={theme.questions} />

        {theme.meta.sources.length > 0 && (
          <section aria-labelledby="sources-heading" className="flex flex-col gap-2 text-sm text-ink-soft">
            <h2 id="sources-heading" className="text-base font-bold text-ink">
              出典
            </h2>
            <ul className="flex flex-col gap-1">
              {theme.meta.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                    {source.title}
                  </a>
                  （{source.checkedAt} 確認）
                </li>
              ))}
            </ul>
          </section>
        )}

        <nav aria-label="次に進む" className="flex flex-col gap-3 border-t border-rule pt-6 text-[15px]">
          {cases.map((item) => (
            <Link key={item.id} href={`/cases/${item.id}`} className="self-start text-teal-deep underline underline-offset-4">
              {item.kind === "cross" ? "横断ケース" : "ケース"}：{item.title}
            </Link>
          ))}
          {next ? (
            <Link href={`/themes/${next.meta.id}`} className="self-start font-semibold text-teal-deep underline underline-offset-4">
              次のテーマ：{next.meta.title}
            </Link>
          ) : (
            <Link href={`/fields/${field?.id}`} className="self-start text-teal-deep underline underline-offset-4">
              {field?.name}のテーマ一覧へ
            </Link>
          )}
        </nav>
      </article>
    </main>
  );
}
