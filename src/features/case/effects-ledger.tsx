import type { ReactNode } from "react";
import type { Effects } from "@/lib/content/schema";
import { formatDelta, paybackYears } from "./format";

// 案B「決算書ノート」: 判断の結果を PL・BS・CF の増減で見せる。増は黒、減は赤 (会計の慣習)。
// 小計や照合の数字は教材に書いた値を出す。教材の検証 (verify.ts) が、計算が合っていることを確かめている。

function Amount({ value, strong = false }: { value: number; strong?: boolean }) {
  return <span className={`tnum whitespace-nowrap ${value < 0 ? "text-loss" : "text-ink"} ${strong ? "font-bold" : "font-semibold"}`}>{formatDelta(value)}</span>;
}

function Row({ label, value, total = false, indent = false }: { label: ReactNode; value: number; total?: boolean; indent?: boolean }) {
  return (
    <div className={`flex min-h-9 items-center justify-between gap-3 border-b border-ledger-line text-sm ${total ? "border-t-[3px] border-double border-ink font-bold" : ""} ${indent ? "pl-3" : ""}`}>
      <span className="leading-snug">{label}</span>
      <Amount value={value} strong={total} />
    </div>
  );
}

function Sheet({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section className="ledger flex flex-col border border-[#c6d6c9] px-4 pb-3" aria-label={title}>
      <h3 className="border-b-[3px] border-double border-ink py-2 font-[family-name:var(--font-ledger)] text-base font-semibold">{title}</h3>
      <p className="py-1.5 text-xs leading-relaxed text-ink-soft">{note}</p>
      {children}
    </section>
  );
}

const SIDE_LABEL = { asset: "資産", liability: "負債", equity: "純資産" } as const;
const SECTION_LABEL = { operating: "営業 CF", investing: "投資 CF", financing: "財務 CF" } as const;

export function EffectsLedger({ effects }: { effects: Effects }) {
  const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
  const assets = sum(effects.bs.filter((row) => row.side === "asset").map((row) => row.delta));
  const claims = sum(effects.bs.filter((row) => row.side !== "asset").map((row) => row.delta));
  const cashTotal = sum(effects.cf.map((row) => row.delta));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-soft">
        {effects.period}。単位は{effects.unit}です。
      </p>
      <div className="grid gap-4 lg:grid-cols-3">
        <Sheet title="損益計算書 PL" note="利益が増えるか減るかで書いています。費用が増えると利益は減るので △（赤）です">
          {effects.pl.map((row) => (
            <Row key={row.item} label={row.item} value={row.delta} total={row.total} />
          ))}
        </Sheet>
        <Sheet title="貸借対照表 BS" note="1年の終わりに、持っているもの・借りているものがどれだけ増えたか減ったか">
          {(["asset", "liability", "equity"] as const).map((side) => {
            const rows = effects.bs.filter((row) => row.side === side);
            if (rows.length === 0) return null;
            return (
              <div key={side} className="flex flex-col">
                <p className="pt-1 text-xs text-ink-faint">{SIDE_LABEL[side]}</p>
                {rows.map((row) => (
                  <Row key={row.item} label={row.item} value={row.delta} indent />
                ))}
              </div>
            );
          })}
          <Row label="資産の増減" value={assets} total />
          <Row label="負債＋純資産の増減" value={claims} total />
        </Sheet>
        <Sheet title="キャッシュフロー" note="1年間に、現金がどれだけ入って、どれだけ出たか">
          {(["operating", "investing", "financing"] as const).map((section) => {
            const rows = effects.cf.filter((row) => row.section === section);
            return (
              <div key={section} className="flex flex-col">
                <Row label={SECTION_LABEL[section]} value={sum(rows.map((row) => row.delta))} />
                {rows.map((row) => (
                  <div key={row.item} className="flex min-h-7 items-center justify-between border-b border-ledger-line pl-3 text-xs text-ink-soft">
                    <span>{row.item}</span>
                    <span className={`tnum ${row.delta < 0 ? "text-loss" : ""}`}>{formatDelta(row.delta)}</span>
                  </div>
                ))}
              </div>
            );
          })}
          <Row label="現金の増減" value={cashTotal} total />
          {effects.payback && (
            <div className="flex min-h-9 items-center justify-between text-sm">
              <span>回収期間</span>
              <span className="tnum font-semibold">約 {paybackYears(effects.payback.investment, effects.payback.annualCash).toFixed(1)} 年</span>
            </div>
          )}
        </Sheet>
      </div>
      <p className="text-sm leading-relaxed text-ink-soft">
        3つの表のつながり：PL の最後に残った利益（当期純利益）は、BS の「利益剰余金」に足されます。キャッシュフローの合計（{formatDelta(cashTotal)}）は、BS の現金の増減と同じ数字になります。
        {effects.payback && `回収期間（使ったお金を何年で取り戻せるか）は、${effects.payback.note}。`}
      </p>
      <details className="text-sm leading-relaxed text-ink-soft">
        <summary className="min-h-11 cursor-pointer py-2 font-semibold text-ink">数字の前提（計算のときに決めたこと）</summary>
        <ul className="flex list-disc flex-col gap-1 pl-6">
          {effects.assumptions.map((assumption) => (
            <li key={assumption}>{assumption}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
