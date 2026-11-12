import { ImageResponse } from "next/og";
import { APP_ICON_SVG } from "@/lib/app-icon/svg";

// ホーム画面・Dock に置くときのアイコン (PNG)。ビルドのときに 1 回だけ作る。
// URL を .png で終わらせ、静的な置き場所 (GitHub Pages) でも画像として配られるようにする
const SIZES = ["180.png", "192.png", "512.png"] as const;

export function generateStaticParams() {
  return SIZES.map((size) => ({ size }));
}

export const dynamic = "force-static";

export async function GET(_request: Request, { params }: RouteContext<"/app-icon/[size]">) {
  const { size } = await params;
  const pixels = SIZES.includes(size as (typeof SIZES)[number]) ? Number.parseInt(size, 10) : 512;
  const src = `data:image/svg+xml;base64,${Buffer.from(APP_ICON_SVG).toString("base64")}`;
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element -- ImageResponse の中では img を使う
    <img src={src} width={pixels} height={pixels} alt="" />,
    { width: pixels, height: pixels },
  );
}
