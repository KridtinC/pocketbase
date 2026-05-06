export const runtime = "edge";

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fetchItem } from "@/lib/api";
import { capitalize } from "@/lib/utils";
import type { Metadata } from "next";

interface Props { params: { name: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const i = await fetchItem(params.name);
    return { title: i.names.en ?? capitalize(i.name) };
  } catch { return { title: "Item" }; }
}

export const dynamic = "force-dynamic";

export default async function ItemDetail({ params }: Props) {
  let item;
  try { item = await fetchItem(params.name); }
  catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("404") || msg.includes("not found")) notFound();
    throw err;
  }

  return (
    <div className="max-w-lg mx-auto">
      <Link href="/items" className="inline-flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-4 transition-colors">
        <ArrowLeft size={16} /> Items
      </Link>

      <div className="rounded-3xl shadow-sm p-6 border border-white/30 dark:border-white/10 backdrop-blur-xl" style={{ background: "var(--glass-bg)" }}>
        <div className="flex items-center gap-4 mb-5">
          {item.image_url ? (
            <Image src={item.image_url} alt={item.names.en ?? item.name} width={64} height={64} className="object-contain" unoptimized />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-white/20" />
          )}
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{item.names.en ?? capitalize(item.name)}</h1>
            <p className="text-sm text-zinc-400 dark:text-zinc-500">{capitalize(item.category.replace(/-/g, " "))}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-2xl px-4 py-3 text-center border border-white/20 dark:border-white/10" style={{ background: "var(--glass-strong)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-1">Cost</p>
            <p className="font-bold text-zinc-900 dark:text-zinc-100">{item.cost > 0 ? `₽${item.cost.toLocaleString()}` : "—"}</p>
          </div>
          <div className="rounded-2xl px-4 py-3 text-center border border-white/20 dark:border-white/10" style={{ background: "var(--glass-strong)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-1">Category</p>
            <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{capitalize(item.category.replace(/-/g, " "))}</p>
          </div>
        </div>

        {item.short_effect && (
          <section className="mb-4">
            <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-2">Summary</h2>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{item.short_effect}</p>
          </section>
        )}

        {item.effect && item.effect !== item.short_effect && (
          <section>
            <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-2">Full Effect</h2>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{item.effect}</p>
          </section>
        )}
      </div>
    </div>
  );
}
