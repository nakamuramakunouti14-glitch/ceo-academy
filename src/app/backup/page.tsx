import { BackupView } from "@/features/progress/backup-view";

export const metadata = { title: "記録の書き出しと読み込み｜CEO アカデミー" };

export default function BackupPage() {
  return (
    <main className="px-4 md:px-9">
      <div className="mx-auto flex max-w-[42rem] flex-col gap-6 py-4 md:py-8">
        <h1 className="text-2xl font-bold">記録の書き出しと読み込み</h1>
        <p className="text-[15px] leading-relaxed text-ink-soft">記録は、この端末のブラウザの中だけに保存しています。Mac とスマホで記録をそろえるときや、控えを取っておきたいときに使います。</p>
        <BackupView />
      </div>
    </main>
  );
}
