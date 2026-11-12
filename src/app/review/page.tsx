import Link from "next/link";
import { getContent } from "@/lib/content/load";
import { ReviewView, type ReviewQuestion } from "@/features/review/review-view";

export const metadata = { title: "復習｜CEO アカデミー" };

export default function ReviewPage() {
  const content = getContent();
  const questions: ReviewQuestion[] = [
    ...content.themes.flatMap((theme) =>
      theme.questions.map((question) => ({ question, ownerTitle: theme.meta.title, ownerHref: `/themes/${theme.meta.id}` })),
    ),
    ...content.cases.flatMap((item) => item.checks.map((question) => ({ question, ownerTitle: item.title, ownerHref: `/cases/${item.id}` }))),
  ];
  return (
    <main className="px-4 md:px-9">
      <div className="mx-auto flex max-w-[42rem] flex-col gap-6 py-4 md:py-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">復習</h1>
          <p className="text-[15px] leading-relaxed text-ink-soft">間違えた問題を、忘れかけたころにもう一度出します。正解が続くほど、次に出るまでの日にちがあきます。</p>
        </header>
        <ReviewView questions={questions} />
        <p className="border-t border-rule pt-5 text-sm text-ink-soft">
          Mac とスマホで記録を移すときは
          <Link href="/backup" className="mx-1 text-teal-deep underline underline-offset-4">
            記録の書き出しと読み込み
          </Link>
          を使います。
        </p>
      </div>
    </main>
  );
}
