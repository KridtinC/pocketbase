"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <pre className="text-sm text-red-600 bg-red-50 rounded-xl p-4 max-w-2xl w-full overflow-auto whitespace-pre-wrap">
        {error.message || "Unknown error"}
        {error.digest && `\n\nDigest: ${error.digest}`}
      </pre>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-sm"
      >
        Try again
      </button>
    </div>
  );
}
