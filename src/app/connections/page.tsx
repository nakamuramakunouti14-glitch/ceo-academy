import { buildIndex } from "@/lib/content/index-data";
import { getContent } from "@/lib/content/load";
import { ConnectionMap, type CaseFlow } from "@/features/map/connection-map";

export const metadata = { title: "つながりの地図｜CEO アカデミー" };

export default function ConnectionsPage() {
  const content = getContent();
  const index = buildIndex(content);
  const flows: CaseFlow[] = content.cases
    .filter((item) => item.kind === "cross")
    .map((item) => ({ id: item.id, title: item.title, steps: item.perspectives.map((perspective) => ({ field: perspective.field, heading: perspective.heading })) }));
  return (
    <main className="px-4 md:px-9">
      <div className="mx-auto flex max-w-[68rem] flex-col gap-6 py-4 md:py-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">つながりの地図</h1>
          <p className="text-[15px] leading-relaxed text-ink-soft">経営の判断は、1つの分野だけでは終わりません。ある分野で決めたことが、ほかの分野にどう効くかを見ていきましょう。</p>
        </header>
        <ConnectionMap index={index} flows={flows} />
      </div>
    </main>
  );
}
