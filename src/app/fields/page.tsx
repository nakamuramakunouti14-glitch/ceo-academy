import { buildIndex } from "@/lib/content/index-data";
import { getContent } from "@/lib/content/load";
import { FieldProgressList } from "@/features/progress/field-progress";

export const metadata = { title: "分野｜CEO アカデミー" };

export default function FieldsPage() {
  const index = buildIndex(getContent());
  return (
    <main className="px-4 md:px-9">
      <div className="mx-auto flex max-w-[52rem] flex-col gap-4 py-4 md:py-8">
        <h1 className="text-2xl font-bold">分野ごとの進み具合</h1>
        <p className="text-[15px] leading-relaxed text-ink-soft">各分野には、6つか7つのテーマがあります。基礎のテーマと、有名な理論・名著のテーマを、内容の近い順に並べています。テーマのクイズに全部答えると「学習済み」になります。まず財務3表から始めると、ほかの分野で決めたことを数字で確かめられます。</p>
        <FieldProgressList index={index} />
      </div>
    </main>
  );
}
