import Link from "next/link";
import type { ContentIndex } from "@/lib/content/index-data";
import { resolveConnection } from "@/lib/content/index-data";
import type { Connection } from "@/lib/content/schema";

/** テーマの最後に置く「この判断はほかの分野とのつながり」。関連テーマ・分野へ飛べる */
export function ConnectionsList({ index, connections }: { index: ContentIndex; connections: Connection[] }) {
  return (
    <section aria-labelledby="connections-heading" className="flex flex-col gap-4 border-l-2 border-gold pl-5">
      <h2 id="connections-heading" className="text-xl font-bold">
        ほかの分野とのつながり
      </h2>
      <ul className="flex flex-col gap-4">
        {connections.map((connection) => {
          const target = resolveConnection(index, connection.to);
          if (!target) return null;
          const fieldId = target.kind === "field" ? connection.to : index.themes.find((theme) => theme.id === connection.to)?.field;
          const fieldName = index.fields.find((field) => field.id === fieldId)?.short;
          return (
            <li key={connection.to} className="flex flex-col gap-1 text-[15px] leading-relaxed">
              <Link href={target.href} className="self-start font-semibold text-teal-deep underline decoration-1 underline-offset-4 hover:text-teal">
                <span className="mr-2 text-sm font-bold text-gold-ink no-underline">{fieldName}</span>
                {target.label}
              </Link>
              <span className="text-ink-soft">{connection.note}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
