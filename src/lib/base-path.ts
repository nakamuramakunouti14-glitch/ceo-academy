/** 置き場所の下の階層 (GitHub Pages では /ceo-academy、Vercel では空)。next/link を通らない URL に付ける */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}
