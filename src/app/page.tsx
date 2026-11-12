import { buildIndex } from "@/lib/content/index-data";
import { getContent } from "@/lib/content/load";
import { HomeView, type CasePreview } from "@/features/map/home-view";

export default function HomePage() {
  const content = getContent();
  const index = buildIndex(content);
  const shortName = (id: string) => content.fields.find((field) => field.id === id)?.short ?? id;
  const crossCases: CasePreview[] = content.cases
    .filter((item) => item.kind === "cross")
    .map((item) => ({
      id: item.id,
      title: item.title,
      company: item.company,
      chain: item.perspectives.map((perspective) => ({ field: perspective.field, label: shortName(perspective.field), heading: perspective.heading })),
    }));
  return <HomeView index={index} crossCases={crossCases} />;
}
