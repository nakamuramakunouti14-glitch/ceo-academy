import Link from "next/link";
import { getContent } from "@/lib/content/load";
import { CaseStatusMark } from "@/features/case/case-status";

export const metadata = { title: "ケース｜CEO アカデミー" };

export default function CasesPage() {
  const content = getContent();
  const name = (id: string) => content.fields.find((field) => field.id === id)?.short ?? id;
  const groups = [
    { kind: "cross" as const, title: "横断ケース", note: "1つの判断を、いくつかの分野の目で順に考えます。最後に、3つの表（PL・BS・キャッシュフロー）がどう変わるかを数字で確かめます。" },
    { kind: "field" as const, title: "分野のケース", note: "1つの分野で学んだことを、ホテルや飲食店の場面で使ってみます。" },
  ];
  return (
    <main className="px-4 md:px-9">
      <div className="mx-auto flex max-w-[48rem] flex-col gap-10 py-4 md:py-8">
        <h1 className="text-2xl font-bold">ケーススタディ</h1>
        {groups.map((group) => {
          const cases = content.cases.filter((item) => item.kind === group.kind);
          return (
            <section key={group.kind} aria-labelledby={`${group.kind}-heading`} className="flex flex-col gap-3">
              <h2 id={`${group.kind}-heading`} className="text-lg font-bold">
                {group.title}
              </h2>
              <p className="text-sm text-ink-soft">{group.note}</p>
              {cases.length === 0 ? (
                <p className="text-sm text-ink-faint">準備中</p>
              ) : (
                <ol className="flex flex-col">
                  {cases.map((item) => (
                    <li key={item.id} className="border-b border-rule-soft">
                      <Link href={`/cases/${item.id}`} className="flex flex-col gap-1.5 py-4">
                        <span className="flex items-start justify-between gap-3">
                          <span className="font-semibold underline-offset-4 hover:underline">{item.title}</span>
                          <CaseStatusMark caseId={item.id} />
                        </span>
                        <span className="text-sm text-ink-soft">{item.company}</span>
                        <span className="flex flex-wrap gap-1.5">
                          {[...new Set([item.field, ...item.perspectives.map((perspective) => perspective.field)])].map((field) => (
                            <span key={field} className="rounded-full border border-gold/50 bg-gold-wash px-2.5 py-0.5 text-xs text-gold-ink">
                              {name(field)}
                            </span>
                          ))}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
