"use client";

import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
      className={`
        fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full
        flex items-center justify-center
        border border-white/30 dark:border-white/10
        shadow-lg backdrop-blur-md
        text-zinc-700 dark:text-zinc-200
        hover:scale-110 active:scale-95 transition-all duration-200
        ${visible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"}
      `}
      style={{ background: "var(--glass-strong)" }}
    >
      <ChevronUp size={20} />
    </button>
  );
}
