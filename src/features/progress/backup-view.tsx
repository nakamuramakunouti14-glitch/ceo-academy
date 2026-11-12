"use client";

import { useRef, useState } from "react";
import { z } from "zod";
import type { ProgressData } from "@/lib/progress/types";
import { useProgress } from "./progress-context";

// 進み具合の書き出しと読み込み。Mac とスマホで記録を移すための手動の方法 (research/hosting.md の案 1)

const BACKUP_FORMAT = "ceo-academy-progress";
const backupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.literal(1),
  exportedAt: z.string(),
  data: z.object({
    themes: z.array(z.object({ themeId: z.string(), status: z.enum(["in-progress", "done"]), updatedAt: z.string() })),
    attempts: z.array(z.object({ id: z.string(), itemId: z.string(), correct: z.boolean(), choiceId: z.string(), answeredAt: z.string() })),
    cases: z.array(
      z.object({
        caseId: z.string(),
        optionId: z.string(),
        note: z.string(),
        selfRating: z.enum(["close", "partly", "missed"]).nullable(),
        updatedAt: z.string(),
      }),
    ),
    lastPosition: z.object({ kind: z.enum(["theme", "case"]), id: z.string(), updatedAt: z.string() }).nullable(),
  }),
});

export function BackupView() {
  const { data, record } = useProgress();
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const download = () => {
    if (!data) return;
    const body = JSON.stringify({ format: BACKUP_FORMAT, version: 1, exportedAt: new Date().toISOString(), data }, null, 2);
    const url = URL.createObjectURL(new Blob([body], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `ceo-academy-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("記録を書き出しました。");
  };

  const restore = async (file: File) => {
    let parsed: ProgressData;
    try {
      const result = backupSchema.safeParse(JSON.parse(await file.text()));
      if (!result.success) {
        setMessage("このアプリで書き出したファイルではないので、読み込みませんでした。");
        return;
      }
      parsed = result.data.data;
    } catch {
      setMessage("ファイルを読めませんでした。書き出した .json ファイルを選んでください。");
      return;
    }
    if (!window.confirm("今の記録を消して、ファイルの記録に置きかえます。よろしいですか？")) return;
    const ok = await record((repository) => repository.replaceAllData(parsed));
    setMessage(ok ? "記録を読み込みました。" : "記録を読み込めませんでした。");
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">書き出す</h2>
        <p className="text-sm leading-relaxed text-ink-soft">クイズの答え、学習済みのテーマ、ケースの記録を、1つのファイルにまとめます。AirDrop などで、もう一方の端末へ送ってください。</p>
        <button type="button" onClick={download} disabled={!data} className="min-h-11 self-start rounded-lg bg-teal px-5 text-sm font-semibold text-white hover:bg-teal-deep disabled:opacity-40">
          記録を書き出す
        </button>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">読み込む</h2>
        <p className="text-sm leading-relaxed text-ink-soft">この端末の記録は、ファイルの記録に置きかわります（足し合わせません）。</p>
        <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void restore(file); event.target.value = ""; }} />
        <button type="button" onClick={() => fileRef.current?.click()} className="min-h-11 self-start rounded-lg border-[1.5px] border-ink px-5 text-sm font-semibold hover:bg-ink hover:text-ground">
          ファイルを選んで読み込む
        </button>
      </section>
      {message && <p role="status" className="text-sm text-teal-deep">{message}</p>}
    </div>
  );
}
