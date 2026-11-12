"use client";

import Link from "next/link";
import type { ContentIndex } from "@/lib/content/index-data";
import { dueToday } from "@/lib/review/schedule";
import { overallRatio, summarizeFields } from "@/lib/progress/summary";
import type { ProgressData } from "@/lib/progress/types";
import { EMPTY_PROGRESS, useProgress } from "@/features/progress/progress-context";
import { FieldMap } from "./field-map";

export interface CasePreview {
  id: string;
  title: string;
  company: string;
  chain: { field: string; label: string; heading: string }[];
}

/** 今日の横断ケース。まだ終えていない最初のケース。全部終えていたら日付で順に回す */
function pickToday(previews: CasePreview[], data: ProgressData, now: Date): CasePreview | null {
  if (previews.length === 0) return null;
  const finished = new Set(data.cases.map((item) => item.caseId));
  const next = previews.find((preview) => !finished.has(preview.id));
  if (next) return next;
  const day = Math.floor(now.getTime() / 86_400_000);
  return previews[day % previews.length];
}

export function HomeView({ index, crossCases }: { index: ContentIndex; crossCases: CasePreview[] }) {
  const { data } = useProgress();
  const progress = data ?? EMPTY_PROGRESS;
  const today = pickToday(crossCases, progress, new Date());
  const found = today ? index.cases.find((item) => item.id === today.id) : undefined;
  const todayEntry = found && today ? { ...found, steps: today.chain.map((step) => step.field) } : null;
  const ratio = overallRatio(summarizeFields(index, progress));
  const reviewCount = data ? dueToday(data.attempts, new Date()).length : 0;
  const last = progress.lastPosition;
  const lastTitle =
    last?.kind === "theme" ? index.themes.find((theme) => theme.id === last.id)?.title : index.cases.find((item) => item.id === last?.id)?.title;

  return (
    <main className="grid flex-1 gap-6 px-4 md:grid-cols-[1fr_340px] md:gap-8 md:px-9 lg:grid-cols-[1fr_360px]">
      <section aria-label="13分野の地図" className="flex flex-col justify-center md:min-h-[560px]">
        <h1 className="sr-only">経営の地図</h1>
        <FieldMap index={index} todayCase={todayEntry} />
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-faint">
          <span>
            <i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-teal align-[-1px]" />
            学習済み
          </span>
          <span>
            <i className="mr-1 inline-block h-2.5 w-2.5 rounded-full border-[1.5px] border-teal align-[-1px]" />
            学習中
          </span>
          <span>
            <i className="mr-1 inline-block h-0.5 w-4 bg-gold align-middle" />
            今日のケースで考える分野（数字は考える順番）
          </span>
        </p>
      </section>

      <aside className="flex flex-col gap-5 pb-4 md:pt-8">
        {today ? (
          <>
            <p className="text-sm leading-relaxed text-ink-soft">
              この地図の見方：真ん中の「財務3表」は、会社のお金の成績表です。まわりの12の分野で決めたことは、最後はみんなこの成績表の数字に表れます。分野を押すと、学ぶテーマが開きます。
            </p>
            <p className="text-sm text-gold-ink">今日の横断ケース</p>
            <h2 className="-mt-3 text-[22px] leading-normal font-bold text-balance">{today.title}</h2>
            <p className="-mt-2 text-sm leading-relaxed text-ink-soft">{today.company}。1つの判断を、地図の金色の番号の順に、分野をまたいで考えます。</p>
            <ol className="grid gap-2.5 border-l-2 border-gold pl-4 text-sm leading-relaxed">
              {today.chain.map((step, i) => (
                <li key={`${step.field}-${i}`}>
                  <em className="mr-1.5 font-bold text-gold-ink not-italic">
                    {i + 1}. {step.label}
                  </em>
                  {step.heading}
                </li>
              ))}
            </ol>
            <Link
              href={`/cases/${today.id}`}
              className="inline-flex min-h-11 items-center self-start rounded-lg bg-teal px-5 text-sm font-semibold text-white hover:bg-teal-deep"
            >
              ケースを始める
            </Link>
          </>
        ) : (
          <p className="text-sm text-ink-soft">横断ケースはまだありません。</p>
        )}

        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-rule pt-4 text-sm">
          <div>
            <dt className="text-xs text-ink-faint">全体の進み具合</dt>
            <dd className="tnum mt-0.5 text-lg font-bold">{Math.round(ratio * 100)}％</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-faint">今日の復習</dt>
            <dd className="mt-0.5">
              <Link href="/review" className="tnum text-lg font-bold text-teal-deep underline-offset-4 hover:underline">
                {reviewCount} 問
              </Link>
            </dd>
          </div>
        </dl>
        {last && lastTitle && (
          <p className="text-sm">
            <span className="text-ink-faint">続きから：</span>
            <Link href={last.kind === "theme" ? `/themes/${last.id}` : `/cases/${last.id}`} className="text-teal-deep underline underline-offset-4">
              {lastTitle}
            </Link>
          </p>
        )}
      </aside>
    </main>
  );
}
