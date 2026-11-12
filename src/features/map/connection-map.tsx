"use client";

import Link from "next/link";
import { useState } from "react";
import type { ContentIndex } from "@/lib/content/index-data";
import { linksOfField, resolveConnection } from "@/lib/content/index-data";
import { themeStatus } from "@/lib/progress/summary";
import { EMPTY_PROGRESS, useProgress } from "@/features/progress/progress-context";

// つながりの地図。全部の線を一度に引くと読めないので、選んだ 1 つの分野を真ん中に置き、
// つながっている分野だけをまわりに並べる。図の番号と、下の説明の番号をそろえる。

/** サーバーとブラウザで三角関数の端数が違うと表示が食い違うので、座標は小数 2 桁に丸める */
const round = (value: number) => Math.round(value * 100) / 100;

function statusLabel(status: "not-started" | "in-progress" | "done") {
  return status === "done" ? "学習済み" : status === "in-progress" ? "学習中" : "まだ";
}

/** 選んだ分野を真ん中に、つながる分野をまわりに置いた図 */
function FocusDiagram({ index, fieldId, groups }: { index: ContentIndex; fieldId: string; groups: ReturnType<typeof linksOfField> }) {
  const width = 360;
  const height = 300;
  const cx = width / 2;
  const cy = height / 2;
  const center = index.fields.find((field) => field.id === fieldId);
  const max = Math.max(1, ...groups.map((group) => group.links.length));
  const points = groups.map((group, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(groups.length, 1);
    return { group, x: round(cx + 135 * Math.cos(angle)), y: round(cy + 112 * Math.sin(angle)) };
  });
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mx-auto h-auto w-full max-w-[520px]" role="img" aria-label={`${center?.name}とつながる分野の図`}>
      {points.map(({ group, x, y }) => (
        <line key={group.fieldId} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--gold)" strokeWidth={round(1.5 + (group.links.length / max) * 3)} strokeOpacity={0.85} />
      ))}
      <circle cx={cx} cy={cy} r={48} fill="var(--ink)" />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={(center?.short.length ?? 0) > 5 ? 11 : 14} fontWeight={700} fill="var(--ground)">
        {center?.short}
      </text>
      {points.map(({ group, x, y }, i) => {
        const field = index.fields.find((candidate) => candidate.id === group.fieldId);
        return (
          <g key={group.fieldId}>
            <circle cx={x} cy={y} r={13} fill="var(--paper)" stroke="var(--gold)" strokeWidth={2} />
            <text x={x} y={y + 4.5} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--gold-ink)">
              {i + 1}
            </text>
            <text x={x} y={y + (y < cy ? -19 : 29)} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="var(--ink)" paintOrder="stroke" stroke="var(--ground)" strokeWidth={4}>
              {field?.short}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export interface CaseFlow {
  id: string;
  title: string;
  steps: { field: string; heading: string }[];
}

export function ConnectionMap({ index, flows }: { index: ContentIndex; flows: CaseFlow[] }) {
  const [fieldId, setFieldId] = useState(index.center);
  const { data } = useProgress();
  const progress = data ?? EMPTY_PROGRESS;
  const groups = linksOfField(index, fieldId);
  const field = index.fields.find((candidate) => candidate.id === fieldId);
  const short = (id: string) => index.fields.find((candidate) => candidate.id === id)?.short ?? id;
  const themeTitle = (id: string) => index.themes.find((theme) => theme.id === id)?.title ?? id;
  const ownThemes = index.themes.filter((theme) => theme.field === fieldId);

  return (
    <div className="flex flex-col gap-12">
      <section aria-labelledby="focus-heading" className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h2 id="focus-heading" className="text-xl font-bold">
            分野を1つ選んで、つながりを見る
          </h2>
          <p className="text-[15px] leading-relaxed text-ink-soft">選んだ分野が真ん中に来ます。まわりの番号は、下の説明の番号と同じです。線が太いほど、つながりが多い分野です。</p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="分野を選ぶ">
          {index.fields.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              aria-pressed={candidate.id === fieldId}
              onClick={() => setFieldId(candidate.id)}
              className={`min-h-10 rounded-full border-[1.5px] px-3.5 text-sm ${candidate.id === fieldId ? "border-ink bg-ink font-semibold text-ground" : "border-rule bg-paper hover:border-ink-faint"}`}
            >
              {candidate.short}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
          <div className="flex flex-col gap-4">
            <FocusDiagram index={index} fieldId={fieldId} groups={groups} />
            <div className="rounded-xl border border-rule bg-paper px-4 py-3.5">
              <p className="text-sm font-bold">{field?.name}</p>
              <p className="mt-1 text-[15px] leading-relaxed text-ink-soft">{field?.howItShows}</p>
              <ul className="mt-3 flex flex-col gap-1.5 text-sm">
                {ownThemes.map((theme) => (
                  <li key={theme.id} className="flex items-baseline gap-2">
                    <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${themeStatus(progress, theme.id) === "done" ? "bg-teal" : "border-[1.5px] border-ink-faint"}`} aria-hidden />
                    <Link href={`/themes/${theme.id}`} className="text-teal-deep underline underline-offset-4">
                      {theme.title}
                    </Link>
                    <span className="sr-only">（{statusLabel(themeStatus(progress, theme.id))}）</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <ol className="flex flex-col gap-4">
            {groups.map((group, i) => {
              const other = index.fields.find((candidate) => candidate.id === group.fieldId);
              return (
                <li key={group.fieldId} className="flex gap-3">
                  <span className="tnum mt-0.5 grid h-7 w-7 shrink-0 place-content-center rounded-full border-2 border-gold bg-paper text-sm font-bold text-gold-ink" aria-hidden>
                    {i + 1}
                  </span>
                  <div className="flex flex-1 flex-col gap-2">
                    <button type="button" onClick={() => setFieldId(group.fieldId)} className="self-start text-left font-bold underline-offset-4 hover:underline">
                      {other?.name}
                    </button>
                    <ul className="flex flex-col gap-2.5">
                      {group.links.map((link) => {
                        const target = resolveConnection(index, link.toId);
                        return (
                          <li key={`${link.fromThemeId}-${link.toId}`} className="flex flex-col gap-1 border-l-2 border-gold/60 pl-3 leading-relaxed">
                            <span className="text-[15px] text-ink">
                              <span className="mr-1.5 rounded bg-gold-wash px-1.5 py-0.5 text-xs font-bold text-gold-ink">
                                {link.direction === "out" ? `${short(fieldId)} → ${short(group.fieldId)}` : `${short(group.fieldId)} → ${short(fieldId)}`}
                              </span>
                              {link.note}
                            </span>
                            <span className="text-xs text-ink-faint">
                              くわしく：
                              <Link href={`/themes/${link.fromThemeId}`} className="underline underline-offset-2">
                                {themeTitle(link.fromThemeId)}
                              </Link>
                              {target?.kind === "theme" && (
                                <>
                                  {"、"}
                                  <Link href={target.href} className="underline underline-offset-2">
                                    {target.label}
                                  </Link>
                                </>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section aria-labelledby="flow-heading" className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h2 id="flow-heading" className="text-xl font-bold">
            1つの判断が、分野をどう通るか
          </h2>
          <p className="text-[15px] leading-relaxed text-ink-soft">横断ケースで考える順番です。1つの判断が、いくつもの分野を通って、最後に財務3表の数字になります。</p>
        </div>
        <ol className="flex flex-col gap-5">
          {flows.map((flow) => (
            <li key={flow.id} className="flex flex-col gap-3 border-b border-rule-soft pb-5">
              <Link href={`/cases/${flow.id}`} className="self-start font-bold text-teal-deep underline underline-offset-4">
                {flow.title}
              </Link>
              <ol className="flex flex-wrap items-stretch gap-x-1 gap-y-2">
                {flow.steps.map((step, i) => (
                  <li key={`${step.field}-${i}`} className="flex items-center gap-1">
                    <span className="flex max-w-[13rem] flex-col rounded-lg border border-gold/50 bg-gold-wash px-3 py-1.5">
                      <span className="text-xs font-bold text-gold-ink">
                        {i + 1}. {short(step.field)}
                      </span>
                      <span className="text-[13px] leading-snug text-ink">{step.heading}</span>
                    </span>
                    {i < flow.steps.length - 1 && (
                      <span aria-hidden className="px-0.5 text-gold">
                        ▶
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
