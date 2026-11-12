"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Question } from "@/lib/content/schema";
import { dueToday } from "@/lib/review/schedule";
import { latestAttempts } from "@/lib/progress/summary";
import type { ProgressData } from "@/lib/progress/types";
import { useProgress } from "@/features/progress/progress-context";
import { QuestionCard } from "@/features/quiz/question-card";

export interface ReviewQuestion {
  question: Question;
  ownerTitle: string;
  ownerHref: string;
}

type Lists = { due: string[]; wrong: string[] };

/** 今日の復習 (FSRS の予定) と、最後の回答が不正解のままの問題 */
function buildLists(data: ProgressData, known: Set<string>): Lists {
  const due = dueToday(data.attempts, new Date()).map((item) => item.itemId).filter((id) => known.has(id));
  const wrong = [...latestAttempts(data.attempts).values()]
    .filter((attempt) => !attempt.correct && known.has(attempt.itemId) && !due.includes(attempt.itemId))
    .map((attempt) => attempt.itemId);
  return { due, wrong };
}

/** 画面を開いた時点の一覧を固定し、答えても一覧からは消さない (答えた結果を見られるように) */
export function ReviewView({ questions }: { questions: ReviewQuestion[] }) {
  const { data, record } = useProgress();
  const [lists, setLists] = useState<Lists | null>(null);
  const known = new Map(questions.map((item) => [item.question.id, item]));

  useEffect(() => {
    if (data && !lists) setLists(buildLists(data, new Set(questions.map((item) => item.question.id))));
  }, [data, lists, questions]);

  if (!lists) return <p className="text-sm text-ink-faint">読み込み中…</p>;

  const render = (ids: string[]) =>
    ids.map((id, i) => {
      const item = known.get(id);
      if (!item) return null;
      return (
        <div key={id} className="flex flex-col gap-1">
          <QuestionCard
            question={item.question}
            number={i + 1}
            onAnswer={(result) => void record((repository) => repository.recordAttempt(id, result.choiceId, result.correct))}
          />
          <Link href={item.ownerHref} className="self-start pt-1 text-sm text-ink-faint underline underline-offset-4">
            出題元：{item.ownerTitle}
          </Link>
        </div>
      );
    });

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="due-heading" className="flex flex-col gap-5">
        <h2 id="due-heading" className="text-lg font-bold">
          今日の復習 <span className="tnum text-base font-normal text-ink-faint">{lists.due.length} 問</span>
        </h2>
        {lists.due.length === 0 ? <p className="text-sm text-ink-soft">今日の復習はありません。間違えた問題は、日をあけてここに出てきます。</p> : render(lists.due)}
      </section>
      {lists.wrong.length > 0 && (
        <section aria-labelledby="wrong-heading" className="flex flex-col gap-5">
          <h2 id="wrong-heading" className="text-lg font-bold">
            まだ間違えたままの問題 <span className="tnum text-base font-normal text-ink-faint">{lists.wrong.length} 問</span>
          </h2>
          {render(lists.wrong)}
        </section>
      )}
    </div>
  );
}
