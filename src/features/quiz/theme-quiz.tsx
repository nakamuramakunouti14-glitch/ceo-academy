"use client";

import { useEffect, useRef } from "react";
import { sectionAnchor } from "@/lib/anchors";
import type { Question } from "@/lib/content/schema";
import { isQuizFinished, latestAttempts } from "@/lib/progress/summary";
import { useProgress } from "@/features/progress/progress-context";
import { QuestionCard, type AnswerResult } from "./question-card";

/** テーマの確認クイズ。開いたら学習中にし、全問に答えたら完了にする */
export function ThemeQuiz({ themeId, questions }: { themeId: string; questions: Question[] }) {
  const { data, record } = useProgress();
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !data) return;
    started.current = true;
    void record(async (repository) => {
      await repository.markThemeStarted(themeId);
      await repository.saveLastPosition("theme", themeId);
    });
  }, [data, record, themeId]);

  const latest = data ? latestAttempts(data.attempts) : new Map();
  const questionIds = questions.map((question) => question.id);
  const answeredCount = questionIds.filter((id) => latest.has(id)).length;
  const correctCount = questionIds.filter((id) => latest.get(id)?.correct).length;

  const onAnswer = (question: Question) => (result: AnswerResult) => {
    void record(async (repository) => {
      await repository.recordAttempt(question.id, result.choiceId, result.correct);
      const attempts = (await repository.exportData()).attempts;
      if (isQuizFinished(questionIds, attempts)) await repository.markThemeDone(themeId);
    });
  };

  return (
    <section aria-labelledby="quiz-heading" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="quiz-heading" className="text-xl font-bold">
          確認クイズ
        </h2>
        <p className="tnum text-sm text-ink-faint" aria-live="polite">
          {answeredCount === questions.length ? `全問回答　正解 ${correctCount}／${questions.length}` : `${answeredCount}／${questions.length} 問回答`}
        </p>
      </div>
      {data === null ? (
        <p className="text-sm text-ink-faint">読み込み中…</p>
      ) : (
        questions.map((question, i) => {
          const previous = latest.get(question.id);
          return (
            <QuestionCard
              key={question.id}
              question={question}
              number={i + 1}
              previous={previous ? { choiceId: previous.choiceId, correct: previous.correct } : undefined}
              onAnswer={onAnswer(question)}
              reviewHref={question.reviewSection ? `#${sectionAnchor(question.reviewSection)}` : undefined}
              reviewLabel={question.reviewSection}
            />
          );
        })
      )}
    </section>
  );
}
