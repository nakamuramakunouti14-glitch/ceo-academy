"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "地図", match: (path: string) => path === "/" },
  { href: "/connections", label: "つながり", match: (path: string) => path.startsWith("/connections") },
  { href: "/fields", label: "分野", match: (path: string) => path.startsWith("/fields") || path.startsWith("/themes") },
  { href: "/cases", label: "ケース", match: (path: string) => path.startsWith("/cases") },
  { href: "/review", label: "復習", match: (path: string) => path.startsWith("/review") },
] as const;

/** PC は上の見出しの横、スマホは画面の下に固定する */
export function SiteNav() {
  const pathname = usePathname();
  return (
    <>
      <nav aria-label="主な画面" className="hidden items-baseline gap-6 text-sm text-ink-soft md:flex">
        {ITEMS.map((item) => {
          const current = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current ? "page" : undefined}
              className={current ? "border-b-2 border-teal pb-1 font-semibold text-ink" : "pb-1 hover:text-ink"}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <nav
        aria-label="主な画面"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-rule bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {ITEMS.map((item) => {
          const current = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 text-xs ${current ? "font-semibold text-teal" : "text-ink-soft"}`}
            >
              <span aria-hidden className={`h-1 w-6 rounded-full ${current ? "bg-teal" : "bg-transparent"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
