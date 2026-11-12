import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownField } from "@/components/markdown";
import { getContent } from "@/lib/content/load";
import { CasePlayer } from "@/features/case/case-player";

export function generateStaticParams() {
  return getContent().cases.map((item) => ({ caseId: item.id }));
}

export async function generateMetadata({ params }: PageProps<"/cases/[caseId]">): Promise<Metadata> {
  const { caseId } = await params;
  const item = getContent().cases.find((candidate) => candidate.id === caseId);
  return { title: item ? `${item.title}｜CEO アカデミー` : "CEO アカデミー" };
}

export default async function CasePage({ params }: PageProps<"/cases/[caseId]">) {
  const { caseId } = await params;
  const content = getContent();
  const item = content.cases.find((candidate) => candidate.id === caseId);
  if (!item) notFound();
  const fieldNames = Object.fromEntries(content.fields.map((field) => [field.id, field.short]));
  const crossCases = content.cases.filter((candidate) => candidate.kind === item.kind);
  const position = crossCases.findIndex((candidate) => candidate.id === caseId) + 1;
  const related = content.themes.filter((theme) => item.relatedThemes.includes(theme.meta.id));

  return (
    <main className="px-4 md:px-9">
      <article className="mx-auto flex max-w-[60rem] flex-col gap-10 py-4 md:py-8">
        <header className="grid gap-6 rounded-2xl bg-ink px-5 py-7 text-ground md:grid-cols-[1.4fr_1fr] md:px-9 md:py-9">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-[#d9b36a]">
              {item.kind === "cross" ? "横断ケース" : "ケース"} {position}／{crossCases.length}　あなたは{item.company}の社長
            </p>
            <h1 className="text-2xl leading-normal font-bold text-balance md:text-[28px]">{item.title}</h1>
            <div className="flex flex-col gap-3 text-[15px] leading-[1.9] text-[#cfd6e2]">
              <MarkdownField source={item.situation} />
            </div>
          </div>
          <dl className="grid grid-cols-2 content-end gap-x-6 gap-y-4 border-t border-white/15 pt-5 md:border-t-0 md:border-l md:pt-0 md:pl-8">
            {item.facts.map((fact) => (
              <div key={fact.label} className="flex flex-col-reverse">
                <dt className="text-xs text-[#aab4c6]">{fact.label}</dt>
                <dd className="tnum text-[22px] font-bold text-white">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </header>

        <div className="mx-auto w-full max-w-[44rem] lg:max-w-none">
          <CasePlayer
            item={item}
            fieldNames={fieldNames}
            perspectiveBodies={item.perspectives.map((perspective) => (
              <MarkdownField key={perspective.heading} source={perspective.body} />
            ))}
            modelAnswer={<MarkdownField source={item.modelAnswer} />}
          />
        </div>

        {related.length > 0 && (
          <nav aria-label="関連テーマ" className="flex flex-col gap-2 border-t border-rule pt-6 text-[15px]">
            <p className="text-sm text-ink-faint">このケースの土台になるテーマ</p>
            {related.map((theme) => (
              <Link key={theme.meta.id} href={`/themes/${theme.meta.id}`} className="self-start text-teal-deep underline underline-offset-4">
                {theme.meta.title}
              </Link>
            ))}
          </nav>
        )}
      </article>
    </main>
  );
}
