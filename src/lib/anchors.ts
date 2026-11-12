/** ## 見出しの飛び先。クイズの「読み直す節」から使う */
export function sectionAnchor(heading: string): string {
  return `s-${heading.replace(/\s+/g, "-")}`;
}
