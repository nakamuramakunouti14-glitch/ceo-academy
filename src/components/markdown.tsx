import type { PhrasingContent, RootContent } from "mdast";
import Link from "next/link";
import type { ReactNode } from "react";
import { sectionAnchor } from "@/lib/anchors";
import { parseMarkdown } from "@/lib/content/load";

// 教材の Markdown (mdast) を画面の要素にする。ai-engineering-academy の lesson-markdown.tsx から、コードの実行を除いたもの。
// 決まりの外の要素 (HTML、画像など) が来たらビルドを止めて知らせる。

const LINK_CLASS = "text-teal-deep underline decoration-1 underline-offset-4 hover:text-teal";

function unsupported(node: { type: string }): never {
  throw new Error(`教材の本文に表示できない要素があります: ${node.type} (docs/content-format.md の決まりを確かめてください)`);
}

export function Inline({ nodes }: { nodes: PhrasingContent[] }): ReactNode {
  return nodes.map((node, index) => {
    switch (node.type) {
      case "text":
        return node.value;
      case "inlineCode":
        return (
          <code key={index} className="rounded-sm bg-rule-soft px-1 py-0.5 text-[0.9em]">
            {node.value}
          </code>
        );
      case "strong":
        return (
          <strong key={index} className="font-bold">
            <Inline nodes={node.children} />
          </strong>
        );
      case "emphasis":
        return (
          <em key={index} className="font-bold not-italic">
            <Inline nodes={node.children} />
          </em>
        );
      case "link":
        return node.url.startsWith("/") ? (
          <Link key={index} href={node.url} className={LINK_CLASS}>
            <Inline nodes={node.children} />
          </Link>
        ) : (
          <a key={index} href={node.url} className={LINK_CLASS} target="_blank" rel="noreferrer">
            <Inline nodes={node.children} />
          </a>
        );
      case "break":
        return <br key={index} />;
      default:
        return unsupported(node);
    }
  });
}

/** 列が数字だけなら右に寄せる */
function isNumericCell(text: string): boolean {
  return /^[\s\d,.−\-＋+％%≒約万円億]+$/.test(text) && /\d/.test(text);
}

function cellText(nodes: PhrasingContent[]): string {
  return nodes.map((node) => ("value" in node ? node.value : "children" in node ? cellText(node.children as PhrasingContent[]) : "")).join("");
}

function Block({ node }: { node: RootContent }): ReactNode {
  switch (node.type) {
    case "paragraph":
      return (
        <p>
          <Inline nodes={node.children} />
        </p>
      );
    case "heading":
      if (node.depth === 2) {
        return (
          <h2 id={sectionAnchor(cellText(node.children))} className="scroll-mt-6 pt-6 text-xl leading-snug font-bold text-ink">
            <Inline nodes={node.children} />
          </h2>
        );
      }
      return (
        <h3 className="pt-2 text-base font-bold">
          <Inline nodes={node.children} />
        </h3>
      );
    case "list": {
      const ListTag = node.ordered ? "ol" : "ul";
      return (
        <ListTag className={`flex flex-col gap-2 pl-6 ${node.ordered ? "list-decimal" : "list-disc marker:text-teal"}`}>
          {node.children.map((item, index) => (
            <li key={index}>
              {item.children.length === 1 && item.children[0].type === "paragraph" ? (
                <Inline nodes={item.children[0].children} />
              ) : (
                <div className="flex flex-col gap-2">
                  <Blocks nodes={item.children} />
                </div>
              )}
            </li>
          ))}
        </ListTag>
      );
    }
    case "blockquote":
      return (
        <blockquote className="flex flex-col gap-3 border-l-2 border-gold pl-4 text-ink-soft">
          <Blocks nodes={node.children} />
        </blockquote>
      );
    case "table": {
      const [head, ...rows] = node.children;
      return (
        <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0" tabIndex={0} role="region" aria-label="表">
          <table className="w-full min-w-[30rem] border-collapse text-sm leading-relaxed">
            <thead>
              <tr className="border-b-2 border-ink">
                {head.children.map((cell, cellIndex) => (
                  <th key={cellIndex} scope="col" className="px-3 py-2 text-left align-bottom font-semibold first:pl-0">
                    <Inline nodes={cell.children} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-rule-soft">
                  {row.children.map((cell, cellIndex) => {
                    const numeric = isNumericCell(cellText(cell.children));
                    return (
                      <td key={cellIndex} className={`px-3 py-2 align-top first:pl-0 ${numeric ? "tnum text-right whitespace-nowrap" : ""}`}>
                        <Inline nodes={cell.children} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case "thematicBreak":
      return <hr className="border-rule" />;
    default:
      return unsupported(node);
  }
}

export function Blocks({ nodes }: { nodes: RootContent[] }): ReactNode {
  return nodes.map((node, index) => <Block key={index} node={node} />);
}

/** 教材の短い Markdown の欄 (ケースの本文、模範の考え方など) */
export function MarkdownField({ source }: { source: string }) {
  return <Blocks nodes={parseMarkdown(source).children} />;
}
