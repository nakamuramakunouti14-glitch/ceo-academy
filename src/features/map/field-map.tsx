"use client";

import Link from "next/link";
import type { CaseEntry, ContentIndex } from "@/lib/content/index-data";
import { summarizeFields, type FieldSummary } from "@/lib/progress/summary";
import { EMPTY_PROGRESS, useProgress } from "@/features/progress/progress-context";

// ホームの「経営の地図」(案A)。財務3表を真ん中に、ほかの12分野を線でつなぐ。
// 学習済みの分野は緑の塗り、学習中は緑の枠。今日の横断ケースが通る分野へは金色の線を引く。
// PC は横長の楕円、スマホは縦長の2列に組み替える。

type Point = { x: number; y: number };
/** サーバーとブラウザで三角関数の端数が違うと表示が食い違うので、座標は小数 2 桁に丸める */
const round = (value: number) => Math.round(value * 100) / 100;
interface Layout {
  width: number;
  height: number;
  center: Point;
  radius: number;
  /** 金色の線の太さ (viewBox の単位)。スマホは縮んで細く見えるので太くする */
  routeWidth: number;
  points: Point[];
}

/** PC: 真ん中から楕円の上に 12 分野を時計回りに置く (一番上から) */
function wideLayout(count: number): Layout {
  const width = 760;
  const height = 600;
  const center = { x: width / 2, y: height / 2 };
  const points = Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / count;
    return { x: round(center.x + 300 * Math.cos(angle)), y: round(center.y + 245 * Math.sin(angle)) };
  });
  return { width, height, center, radius: 84, routeWidth: 2.5, points };
}

/** スマホ: 右の列を上から下へ、左の列を下から上へ (時計回りの順を保つ) */
function tallLayout(count: number): Layout {
  const width = 360;
  const height = 740;
  const center = { x: width / 2, y: height / 2 };
  const perColumn = Math.ceil(count / 2);
  const rowY = (row: number) => 56 + (row * (height - 112)) / (perColumn - 1);
  const points = Array.from({ length: count }, (_, i) =>
    i < perColumn ? { x: 296, y: rowY(i) } : { x: 64, y: rowY(perColumn - 1 - (i - perColumn)) },
  );
  return { width, height, center, radius: 62, routeWidth: 3.5, points };
}

function nodeClass(summary: FieldSummary | undefined): string {
  if (!summary || summary.availableThemes === 0) return "border-dashed border-rule bg-ground text-ink-faint";
  if (summary.state === "done") return "border-teal bg-teal text-white";
  if (summary.state === "in-progress") return "border-teal bg-paper font-semibold text-teal";
  return "border-rule bg-paper text-ink hover:border-teal";
}

function stateLabel(summary: FieldSummary | undefined): string {
  if (!summary || summary.availableThemes === 0) return "準備中";
  if (summary.state === "done") return "学習済み";
  if (summary.state === "in-progress") return `学習中 ${summary.doneThemes}/${summary.totalThemes}`;
  return "未着手";
}

/** 今日のケースで考える順番の番号 (金色の丸) */
function StepBadge({ step, center = false }: { step: number | undefined; center?: boolean }) {
  if (!step) return null;
  const place = center ? "-top-2.5 left-1/2 -translate-x-1/2" : "-top-2.5 -right-2.5";
  return (
    <span aria-hidden className={`absolute ${place} grid h-5 w-5 place-content-center rounded-full bg-gold text-[11px] font-bold text-white`}>
      {step}
    </span>
  );
}

function MapCanvas({ index, layout, route, steps, summaries, className }: {
  index: ContentIndex;
  layout: Layout;
  route: Set<string>;
  steps: Map<string, number>;
  summaries: Map<string, FieldSummary>;
  className: string;
}) {
  const others = index.fields.filter((field) => field.id !== index.center);
  const center = index.fields.find((field) => field.id === index.center);
  const centerSummary = summaries.get(index.center);
  const { width, height } = layout;
  const pct = (point: Point) => ({ left: `${((point.x / width) * 100).toFixed(3)}%`, top: `${((point.y / height) * 100).toFixed(3)}%` });

  return (
    <div className={`relative ${className}`} style={{ aspectRatio: `${width} / ${height}` }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 h-full w-full" aria-hidden>
        <g stroke="#c3cad3" strokeWidth={1.5} fill="none">
          {others.map((field, i) => (
            <line key={field.id} x1={layout.center.x} y1={layout.center.y} x2={layout.points[i].x} y2={layout.points[i].y} />
          ))}
        </g>
        <g stroke="var(--gold)" strokeWidth={layout.routeWidth} fill="none" className="route-line">
          {others.map((field, i) => {
            if (!route.has(field.id)) return null;
            const target = layout.points[i];
            // 真ん中から少し膨らませた線。まっすぐの灰色の線と重ならないようにする
            const mx = round((layout.center.x + target.x) / 2 + (target.y - layout.center.y) * 0.18);
            const my = round((layout.center.y + target.y) / 2 - (target.x - layout.center.x) * 0.18);
            return <path key={field.id} d={`M${layout.center.x} ${layout.center.y} Q ${mx} ${my} ${target.x} ${target.y}`} />;
          })}
        </g>
      </svg>

      {center && (
        <Link
          href={`/fields/${center.id}`}
          className={`absolute grid -translate-x-1/2 -translate-y-1/2 place-content-center rounded-full text-center text-ground ring-offset-2 ring-offset-ground ${centerSummary?.state === "done" ? "bg-teal" : centerSummary?.state === "in-progress" ? "bg-ink ring-2 ring-teal" : "bg-ink"}`}
          style={{ ...pct(layout.center), width: `${(((layout.radius * 2) / width) * 100).toFixed(3)}%`, aspectRatio: "1" }}
          aria-label={`${center.name}（${stateLabel(centerSummary)}）`}
        >
          <StepBadge step={steps.get(center.id)} center />
          <strong className="block text-base md:text-lg">財務3表</strong>
          <span className="mt-1 block text-[10px] leading-relaxed opacity-80 min-[360px]:text-[11px] md:text-xs">
            PL・BS
            <br />
            キャッシュフロー
          </span>
        </Link>
      )}

      {others.map((field, i) => {
        const summary = summaries.get(field.id);
        return (
          <Link
            key={field.id}
            href={`/fields/${field.id}`}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] px-3 py-1.5 text-xs whitespace-nowrap transition-colors md:px-3.5 md:py-2 md:text-[13px] ${nodeClass(summary)} ${route.has(field.id) ? "shadow-[0_0_0_3px_var(--gold-wash)]" : ""}`}
            style={pct(layout.points[i])}
            aria-label={`${field.name}（${stateLabel(summary)}${steps.has(field.id) ? `、今日のケースで ${steps.get(field.id)} 番目に考える` : ""}）`}
          >
            <StepBadge step={steps.get(field.id)} />
            {field.short}
          </Link>
        );
      })}
    </div>
  );
}

export function FieldMap({ index, todayCase }: { index: ContentIndex; todayCase: (CaseEntry & { steps: string[] }) | null }) {
  const { data } = useProgress();
  const summaries = new Map(summarizeFields(index, data ?? EMPTY_PROGRESS).map((summary) => [summary.fieldId, summary]));
  const route = new Set(todayCase?.fields ?? []);
  const steps = new Map((todayCase?.steps ?? []).map((field, i) => [field, i + 1]));
  const count = index.fields.length - 1;
  return (
    <>
      <MapCanvas index={index} layout={wideLayout(count)} route={route} steps={steps} summaries={summaries} className="hidden w-full md:block" />
      <MapCanvas index={index} layout={tallLayout(count)} route={route} steps={steps} summaries={summaries} className="mx-auto w-full max-w-[420px] md:hidden" />
    </>
  );
}
