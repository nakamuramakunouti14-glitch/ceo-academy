"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { StorageUnavailableError } from "@/lib/progress/errors";
import { createProgressRepository, type ProgressRepository } from "@/lib/progress/repository";
import type { ProgressData } from "@/lib/progress/types";

// 進み具合の保存 (src/lib/progress) を画面につなぐ。保存先はブラウザの IndexedDB。
// ai-engineering-academy の progress-context.tsx と同じ形: ここで 1 回読み、書き込むたびに読み直す。書き込みは 1 つずつ順に行う。

interface ProgressContextValue {
  /** 読み終わるまで (とサーバーの描画では) null */
  data: ProgressData | null;
  /** 書き込む。失敗しても例外を投げず、知らせの行を出して false を返す */
  record: (write: (repository: ProgressRepository) => Promise<unknown>) => Promise<boolean>;
  failure: string | null;
  clearFailure: () => void;
}

export const EMPTY_PROGRESS: ProgressData = { themes: [], attempts: [], cases: [], lastPosition: null };

const ProgressContext = createContext<ProgressContextValue | null>(null);

function failureMessage(error: unknown): string {
  return error instanceof StorageUnavailableError ? error.message : "進み具合を保存できませんでした。ページを読み込み直してください。";
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [repository, setRepository] = useState<ProgressRepository | null>(null);
  const [version, setVersion] = useState(0);
  const [data, setData] = useState<ProgressData | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    const created = createProgressRepository();
    queueMicrotask(() => setRepository(created));
    return () => created.close();
  }, []);

  useEffect(() => {
    if (!repository) return;
    let cancelled = false;
    repository.exportData().then(
      (loaded) => {
        if (!cancelled) setData(loaded);
      },
      (error: unknown) => {
        console.error("進み具合を読み込めませんでした", error);
        if (cancelled) return;
        setData(EMPTY_PROGRESS);
        setFailure(failureMessage(error));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [repository, version]);

  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const record = useCallback(
    (write: (repository: ProgressRepository) => Promise<unknown>) => {
      if (!repository) return Promise.resolve(false);
      const run = async () => {
        try {
          await write(repository);
          setVersion((current) => current + 1);
          return true;
        } catch (error) {
          console.error("進み具合を保存できませんでした", error);
          setFailure(failureMessage(error));
          return false;
        }
      };
      const next = queueRef.current.then(run, run);
      queueRef.current = next;
      return next;
    },
    [repository],
  );

  const value = useMemo(() => ({ data, record, failure, clearFailure: () => setFailure(null) }), [data, record, failure]);
  return <ProgressContext value={value}>{children}</ProgressContext>;
}

export function useProgress(): ProgressContextValue {
  const value = useContext(ProgressContext);
  if (!value) throw new Error("ProgressProvider の中で使ってください");
  return value;
}

/** 保存できなかったことを知らせる 1 行 */
export function ProgressFailureNotice() {
  const { failure, clearFailure } = useProgress();
  if (!failure) return null;
  return (
    <div role="alert" className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-rule bg-paper px-4 py-2 text-sm text-loss md:px-8">
      <span className="mr-auto">{failure}</span>
      <button type="button" onClick={clearFailure} className="min-h-11 text-ink underline underline-offset-4">
        閉じる
      </button>
    </div>
  );
}
