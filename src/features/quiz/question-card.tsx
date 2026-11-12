"use client";

import { useId, useState } from "react";
import type { Question } from "@/lib/content/schema";

// 選択問題 1 問。選んで [答える] を押すと、正誤と解説を出す。ai-engineering-academy の quiz-card.tsx を、選択問題だけに絞ったもの

export interface AnswerResult {
  choiceId: string;
  correct: boolean;
}

export function QuestionCard({
  question,
  number,
  previous,
  onAnswer,
  reviewHref,
  reviewLabel,
}: {
  question: Question;
  /** 表示の番号 (1 から)。問題の並びの中の位置 */
  number: number;
  /** すでに答えた結果。あれば解説を開いた状態で出す */
  previous?: AnswerResult;
  onAnswer: (result: AnswerResult) => void;
  reviewHref?: string;
  reviewLabel?: string;
}) {
  const name = useId();
  const [selected, setSelected] = useState<string | null>(previous?.choiceId ?? null);
  const [result, setResult] = useState<AnswerResult | null>(previous ?? null);

  const submit = () => {
    if (!selected) return;
    const next = { choiceId: selected, correct: selected === question.answer };
    setResult(next);
    onAnswer(next);
  };
  const retry = () => {
    setResult(null);
    setSelected(null);
  };

  return (
    <fieldset className="flex flex-col gap-3 border-t border-rule pt-5">
      <legend className="float-left mb-3 w-full text-base leading-relaxed font-semibold">
        <span className="tnum mr-2 text-ink-faint">問{number}</span>
        {question.prompt}
      </legend>
      <div className="clear-both flex flex-col gap-2">
        {question.choices.map((choice) => {
          const isAnswer = result && choice.id === question.answer;
          const isWrongPick = result && !result.correct && choice.id === result.choiceId;
          return (
            <label
              key={choice.id}
              className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border-[1.5px] px-3.5 py-2.5 text-[15px] leading-relaxed ${
                isAnswer
                  ? "border-teal bg-teal-wash"
                  : isWrongPick
                    ? "border-loss bg-paper"
                    : selected === choice.id
                      ? "border-ink bg-paper"
                      : "border-rule bg-paper hover:border-ink-faint"
              } ${result ? "cursor-default" : ""}`}
            >
              <input
                type="radio"
                name={name}
                value={choice.id}
                checked={selected === choice.id}
                disabled={result !== null}
                onChange={() => setSelected(choice.id)}
                className="mt-1.5 accent-teal"
              />
              <span>{choice.label}</span>
            </label>
          );
        })}
      </div>
      {result ? (
        <div role="status" className="flex flex-col gap-2 text-[15px] leading-relaxed">
          <p className={`font-bold ${result.correct ? "text-teal-deep" : "text-loss"}`}>{result.correct ? "正解" : "不正解"}</p>
          <p className="text-ink-soft">{question.explanation}</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            {!result.correct && reviewHref && (
              <a href={reviewHref} className="text-teal-deep underline underline-offset-4">
                読み直す：{reviewLabel}
              </a>
            )}
            <button type="button" onClick={retry} className="min-h-11 text-ink-soft underline underline-offset-4">
              もう一度解く
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={submit}
          disabled={!selected}
          className="min-h-11 self-start rounded-lg border-[1.5px] border-ink px-5 text-sm font-semibold hover:bg-ink hover:text-ground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink"
        >
          答える
        </button>
      )}
    </fieldset>
  );
}
