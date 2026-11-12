import type { MetadataRoute } from "next";
import { withBasePath } from "@/lib/base-path";

// ビルドのときに 1 回だけ作る (静的な置き場所でも配れるように)
export const dynamic = "force-static";

// iPhone のホーム画面や Mac の Dock に置いたとき、ブラウザの枠なしのアプリのように開く
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CEO アカデミー",
    short_name: "CEOアカデミー",
    description: "経営に必要な13分野を、財務3表をものさしにして学ぶ",
    start_url: withBasePath("/"),
    display: "standalone",
    background_color: "#f3f5f1",
    theme_color: "#1f2a44",
    lang: "ja",
    icons: [
      { src: withBasePath("/app-icon/192.png"), sizes: "192x192", type: "image/png" },
      { src: withBasePath("/app-icon/512.png"), sizes: "512x512", type: "image/png" },
      { src: withBasePath("/app-icon/512.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
