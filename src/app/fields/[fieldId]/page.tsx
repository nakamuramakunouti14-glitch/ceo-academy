import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { THEMES_PER_FIELD } from "@/lib/content/index-data";
import { getContent } from "@/lib/content/load";
import { ThemeStatusMark } from "@/features/progress/field-progress";

export function generateStaticParams() {
  return getContent().fields.map((field) => ({ fieldId: field.id }));
}

export async function generateMetadata({ params }: PageProps<"/fields/[fieldId]">): Promise<Metadata> {
  const { fieldId } = await params;
  const field = getContent().fields.find((candidate) => candidate.id === fieldId);
  return { title: field ? `${field.name}｜CEO アカデミー` : "CEO アカデミー" };
}

export default async function FieldPage({ params }: PageProps<"/fields/[fieldId]">) {
  const { fieldId } = await params;
  const content = getContent();
  const field = content.fields.find((candidate) => candidate.id === fieldId);
  if (!field) notFound();
  const themes = content.themes.filter((theme) => theme.meta.field === fieldId);
  const cases = content.cases.filter((item) => item.field === fieldId || item.perspectives.some((perspective) => perspective.field === fieldId));
  const missing = Math.max(0, THEMES_PER_FIELD - themes.length);

  return (
    <main className="px-4 md:px-9">
      <div className="mx-auto flex max-w-[44rem] flex-col gap-8 py-4 md:py-8">
        <header className="flex flex-col gap-2">
          <p className="text-sm text-ink-faint">
            <Link href="/fields" className="underline-offset-4 hover:underline">
              分野
            </Link>
          </p>
          <h1 className="text-[26px] leading-snug font-bold md:text-3xl">{field.name}</h1>
          <p className="text-[15px] leading-relaxed text-ink-soft">{field.summary}</p>
        </header>

        <section aria-labelledby="themes-heading" className="flex flex-col">
          <h2 id="themes-heading" className="mb-2 text-lg font-bold">
            テーマ
          </h2>
          <ol className="flex flex-col">
            {themes.map((theme) => (
              <li key={theme.meta.id} className="border-b border-rule-soft">
                <Link href={`/themes/${theme.meta.id}`} className="flex items-start gap-4 py-4">
                  <span className="tnum pt-0.5 text-sm text-ink-faint">{theme.meta.order}</span>
                  <span className="flex flex-1 flex-col gap-1">
                    <span className="font-semibold text-ink underline-offset-4 hover:underline">{theme.meta.title}</span>
                    <span className="text-sm text-ink-soft">
                      {theme.meta.summary}　約 {theme.meta.minutes} 分
                    </span>
                  </span>
                  <ThemeStatusMark themeId={theme.meta.id} />
                </Link>
              </li>
            ))}
            {Array.from({ length: missing }, (_, i) => (
              <li key={`missing-${i}`} className="flex gap-4 border-b border-dashed border-rule py-4 text-sm text-ink-faint">
                <span className="tnum">{themes.length + i + 1}</span>
                準備中
              </li>
            ))}
          </ol>
        </section>

        {cases.length > 0 && (
          <section aria-labelledby="cases-heading" className="flex flex-col gap-2">
            <h2 id="cases-heading" className="text-lg font-bold">
              この分野が出てくるケース
            </h2>
            <ul className="flex flex-col gap-2">
              {cases.map((item) => (
                <li key={item.id}>
                  <Link href={`/cases/${item.id}`} className="text-teal-deep underline underline-offset-4">
                    {item.kind === "cross" ? "横断ケース" : "ケース"}：{item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
