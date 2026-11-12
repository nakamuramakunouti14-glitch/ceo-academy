"use client";

import Link from "next/link";
import type { ContentIndex } from "@/lib/content/index-data";
import { summarizeFields, themeStatus } from "@/lib/progress/summary";
import { EMPTY_PROGRESS, useProgress } from "./progress-context";

/** 分野ごとの進み具合の一覧 (SPEC「分野ごとの進み具合が一覧で見られる」) */
export function FieldProgressList({ index }: { index: ContentIndex }) {
  const { data } = useProgress();
  const summaries = summarizeFields(index, data ?? EMPTY_PROGRESS);
  return (
    <ol className="flex flex-col">
      {index.fields.map((field) => {
        const summary = summaries.find((candidate) => candidate.fieldId === field.id);
        if (!summary) return null;
        const ratio = summary.doneThemes / summary.totalThemes;
        return (
          <li key={field.id} className="border-b border-rule-soft">
            <Link href={`/fields/${field.id}`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 py-3.5 hover:bg-paper/60 md:grid-cols-[14rem_1fr_9rem]">
              <span className="font-semibold">
                {field.name}
                {field.id === index.center && <span className="ml-2 text-xs font-normal text-gold-ink">共通のものさし</span>}
              </span>
              <span className="tnum text-right text-sm text-ink-soft md:order-last">
                {summary.availableThemes === 0
                  ? "準備中"
                  : `${summary.doneThemes}／${summary.totalThemes} テーマ${summary.answered > 0 ? `　正答 ${Math.round((summary.correct / summary.answered) * 100)}％` : ""}`}
              </span>
              <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-rule-soft md:col-span-1" aria-hidden>
                <span className="block h-full rounded-full bg-teal" style={{ width: `${ratio * 100}%` }} />
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

/** 分野の画面のテーマ一覧。完了・学習中の印を付ける */
export function ThemeStatusMark({ themeId }: { themeId: string }) {
  const { data } = useProgress();
  const status = data ? themeStatus(data, themeId) : "not-started";
  if (status === "done") return <span className="rounded-full bg-teal px-2.5 py-0.5 text-xs text-white">学習済み</span>;
  if (status === "in-progress") return <span className="rounded-full border border-teal px-2.5 py-0.5 text-xs text-teal">学習中</span>;
  return null;
}
