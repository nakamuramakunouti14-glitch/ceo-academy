"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { CaseStudy } from "@/lib/content/schema";
import { latestAttempts } from "@/lib/progress/summary";
import type { CaseProgress } from "@/lib/progress/types";
import { useProgress } from "@/features/progress/progress-context";
import { QuestionCard } from "@/features/quiz/question-card";
import { EffectsLedger } from "./effects-ledger";

// ケースの進め方: 場面 → あなたならどうする (案を選ぶ) → 分野ごとの目線 → 数字で確かめる → 3表の増減表 → お手本の考え方と比べる。
// 本文 (Markdown) はサーバーで描いたものを受け取る。

const RATINGS: { id: NonNullable<CaseProgress["selfRating"]>; label: string }[] = [
  { id: "close", label: "ほぼ同じ考えだった" },
  { id: "partly", label: "一部は考えられた" },
  { id: "missed", label: "考えつかなかった" },
];

export function CasePlayer({
  item,
  fieldNames,
  perspectiveBodies,
  modelAnswer,
}: {
  item: CaseStudy;
  fieldNames: Record<string, string>;
  perspectiveBodies: ReactNode[];
  modelAnswer: ReactNode;
}) {
  const { data, record } = useProgress();
  const saved = data?.cases.find((candidate) => candidate.caseId === item.id);
  const [optionId, setOptionId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [committed, setCommitted] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [rating, setRating] = useState<CaseProgress["selfRating"]>(null);
  const loaded = useRef(false);

  // 前に進めたケースは、選んだ案から続ける
  useEffect(() => {
    if (loaded.current || !data) return;
    loaded.current = true;
    if (saved) {
      setOptionId(saved.optionId);
      setNote(saved.note);
      setCommitted(true);
      setRating(saved.selfRating);
      setShowLedger(true);
    }
    void record((repository) => repository.saveLastPosition("case", item.id));
  }, [data, saved, record, item.id]);

  const latest = data ? latestAttempts(data.attempts) : new Map();
  const allChecked = item.checks.every((question) => latest.has(question.id));
  const ledgerOpen = showLedger || allChecked;
  const chosen = item.options.find((option) => option.id === optionId);

  const commit = () => {
    if (!optionId) return;
    setCommitted(true);
    void record((repository) => repository.saveCase({ caseId: item.id, optionId, note, selfRating: rating }));
  };
  /** 案と理由を選び直す。前の記録は、次に [この案で考える] を押したときに上書きする */
  const restart = () => {
    setCommitted(false);
    setShowLedger(false);
    setRating(null);
    setOptionId(null);
    setNote("");
  };
  const rate = (next: NonNullable<CaseProgress["selfRating"]>) => {
    setRating(next);
    if (optionId) void record((repository) => repository.saveCase({ caseId: item.id, optionId, note, selfRating: next }));
  };

  return (
    <div className="flex flex-col gap-12">
      <section aria-labelledby="decide-heading" className="flex flex-col gap-4">
        <h2 id="decide-heading" className="text-xl font-bold">
          {item.question}
        </h2>
        <div className="flex flex-col gap-2.5" role="radiogroup" aria-labelledby="decide-heading">
          {item.options.map((option) => (
            <label
              key={option.id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border-[1.5px] px-4 py-3.5 ${optionId === option.id ? "border-teal bg-teal-wash" : "border-rule bg-paper hover:border-ink-faint"} ${committed ? "cursor-default" : ""}`}
            >
              <input
                type="radio"
                name="case-option"
                value={option.id}
                checked={optionId === option.id}
                disabled={committed}
                onChange={() => setOptionId(option.id)}
                className="mt-1.5 accent-teal"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-[15px] font-semibold">{option.label}</span>
                <span className="text-sm text-ink-soft">{option.detail}</span>
              </span>
            </label>
          ))}
        </div>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink-soft">そう考えた理由（書かなくても大丈夫です。あとでお手本の考え方と比べます）</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={committed}
            rows={3}
            maxLength={1000}
            className="rounded-lg border-[1.5px] border-rule bg-paper px-3 py-2 text-[15px] leading-relaxed disabled:bg-ground"
          />
        </label>
        {committed ? (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-soft">
            <p>
              あなたの案：<strong className="text-ink">{chosen?.label}</strong>。次に、分野ごとの目で考えてみましょう。
            </p>
            <button type="button" onClick={restart} className="min-h-11 underline underline-offset-4">
              最初から考え直す
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={commit}
            disabled={!optionId}
            className="min-h-11 self-start rounded-lg bg-teal px-5 text-sm font-semibold text-white hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            この案で考える
          </button>
        )}
      </section>

      {committed && (
        <>
          <section aria-labelledby="lens-heading" className="flex flex-col gap-6">
            <h2 id="lens-heading" className="text-xl font-bold">
              分野ごとの目で考える
            </h2>
            <ol className="flex flex-col gap-7 border-l-2 border-gold pl-5">
              {item.perspectives.map((perspective, i) => (
                <li key={perspective.heading} className="flex flex-col gap-2">
                  <p className="text-sm font-bold text-gold-ink">
                    <span className="tnum mr-2">{i + 1}</span>
                    {fieldNames[perspective.field]}
                  </p>
                  <h3 className="text-lg leading-snug font-bold">{perspective.heading}</h3>
                  <div className="flex flex-col gap-3 text-[15px] leading-[1.9]">{perspectiveBodies[i]}</div>
                </li>
              ))}
            </ol>
          </section>

          {item.checks.length > 0 && (
            <section aria-labelledby="checks-heading" className="flex flex-col gap-6">
              <h2 id="checks-heading" className="text-xl font-bold">
                数字で確かめる
              </h2>
              {item.checks.map((question, i) => {
                const previous = latest.get(question.id);
                return (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    number={i + 1}
                    previous={previous ? { choiceId: previous.choiceId, correct: previous.correct } : undefined}
                    onAnswer={(result) => void record((repository) => repository.recordAttempt(question.id, result.choiceId, result.correct))}
                  />
                );
              })}
            </section>
          )}

          {item.effects && (
            <section aria-labelledby="ledger-heading" className="flex flex-col gap-4">
              <h2 id="ledger-heading" className="text-xl font-bold">
                3つの表はこう動く
              </h2>
              {ledgerOpen ? (
                <EffectsLedger effects={item.effects} />
              ) : (
                <div className="flex flex-wrap items-center gap-4 text-sm text-ink-soft">
                  <p>上の問題に答えると、表が開きます。</p>
                  <button type="button" onClick={() => setShowLedger(true)} className="min-h-11 underline underline-offset-4">
                    答えずに表を見る
                  </button>
                </div>
              )}
            </section>
          )}

          {ledgerOpen && (
            <section aria-labelledby="model-heading" className="flex flex-col gap-4">
              <h2 id="model-heading" className="text-xl font-bold">
                お手本の考え方と比べる
              </h2>
              {note && (
                <blockquote className="border-l-2 border-rule pl-4 text-[15px] leading-relaxed text-ink-soft">
                  あなたの理由：{note}
                </blockquote>
              )}
              <div className="flex flex-col gap-3 text-[15px] leading-[1.9]">{modelAnswer}</div>
              <fieldset className="flex flex-col gap-2 pt-2">
                <legend className="mb-2 text-sm font-semibold">自分の考えと比べて、どうでしたか？</legend>
                <div className="flex flex-wrap gap-2">
                  {RATINGS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={rating === option.id}
                      onClick={() => rate(option.id)}
                      className={`min-h-11 rounded-full border-[1.5px] px-4 text-sm ${rating === option.id ? "border-teal bg-teal text-white" : "border-rule bg-paper hover:border-teal"}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {rating && <p className="text-sm text-teal-deep" role="status">記録しました。</p>}
              </fieldset>
            </section>
          )}
        </>
      )}
    </div>
  );
}
