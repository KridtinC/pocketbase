"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function UserMenu() {
  const { user, loading, login, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (loading) {
    return <div className="w-8 h-8 rounded-full bg-zinc-200/60 dark:bg-zinc-700/60 animate-pulse" />;
  }

  if (!user) {
    return (
      <button
        onClick={login}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white transition-colors"
      >
        <LogIn size={14} />
        <span>Sign in</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-full overflow-hidden border border-white/40 dark:border-white/10 flex items-center justify-center bg-zinc-200 dark:bg-zinc-700 shrink-0"
        aria-label="Account menu"
      >
        {user.avatar_url ? (
          <Image src={user.avatar_url} alt={user.name} width={32} height={32} className="object-cover" unoptimized />
        ) : (
          <User size={16} className="text-zinc-500 dark:text-zinc-300" />
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-xl border border-white/30 dark:border-white/10 shadow-xl overflow-hidden z-50"
          style={{ background: "var(--glass-strong)" }}
        >
          <div className="px-3 py-2 border-b border-white/20 dark:border-white/10">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{user.name}</p>
            <p className="text-xs text-zinc-400 truncate">{user.email}</p>
          </div>
          <button
            onClick={() => { setOpen(false); logout(); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
