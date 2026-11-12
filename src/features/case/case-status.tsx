"use client";

import { useProgress } from "@/features/progress/progress-context";

export function CaseStatusMark({ caseId }: { caseId: string }) {
  const { data } = useProgress();
  const saved = data?.cases.find((item) => item.caseId === caseId);
  if (!saved) return null;
  return saved.selfRating ? (
    <span className="shrink-0 rounded-full bg-teal px-2.5 py-0.5 text-xs text-white">考え済み</span>
  ) : (
    <span className="shrink-0 rounded-full border border-teal px-2.5 py-0.5 text-xs text-teal">途中</span>
  );
}
