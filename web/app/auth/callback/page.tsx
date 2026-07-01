"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { setTokens } from "@/lib/auth-token";
import { useAuth } from "@/lib/auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { refetch } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);

    const queryError = query.get("error");
    if (queryError) {
      setError("Sign-in failed. Please try again.");
      return;
    }

    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    const expiresIn = Number(hash.get("expires_in") ?? 0);

    if (!accessToken || !refreshToken || !expiresIn) {
      setError("Sign-in failed. Please try again.");
      return;
    }

    setTokens(accessToken, expiresIn, refreshToken);
    // Strip the token fragment from the URL before navigating away.
    window.history.replaceState(null, "", window.location.pathname);
    refetch().then(() => router.replace("/team"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      {error ? (
        <>
          <p className="text-zinc-700 dark:text-zinc-200 font-medium">{error}</p>
          <a href="/team" className="text-sm text-blue-500 hover:underline">Back to Team Builder</a>
        </>
      ) : (
        <>
          <Loader2 className="animate-spin text-zinc-400" size={28} />
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Signing you in…</p>
        </>
      )}
    </div>
  );
}
