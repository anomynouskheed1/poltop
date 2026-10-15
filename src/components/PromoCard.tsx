// src/components/PromoCard.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Timer, Zap } from "lucide-react";

import { supabase } from "@/lib/supabase";

interface Promo {
    id: string;
    title: string;
    headline: string;
    min_deposit: number;
    max_bonus: number;
    starts_at: string;
    ends_at: string;
}

/**
 * Shows the currently active promotion from the `promotions` table.
 * Renders nothing when there is no active promo or it has ended.
 * Set `showCta` to add the "Deposit Now" button (used on the dashboard).
 */
export function PromoCard({
    currency,
    showCta = false,
    className = "",
}: {
    currency: string;
    showCta?: boolean;
    className?: string;
}) {
    const [promo, setPromo] = useState<Promo | null>(null);
    const [now, setNow] = useState<number | null>(null);

    useEffect(() => {
        let mounted = true;
        const nowIso = new Date().toISOString();

        supabase
            .from("promotions")
            .select("id, title, headline, min_deposit, max_bonus, starts_at, ends_at")
            .eq("is_active", true)
            .lte("starts_at", nowIso)
            .gt("ends_at", nowIso)
            .order("ends_at", { ascending: true })
            .limit(1)
            .maybeSingle()
            .then(({ data }) => {
                if (!mounted || !data) return;
                setPromo({
                    ...data,
                    min_deposit: Number(data.min_deposit ?? 0),
                    max_bonus: Number(data.max_bonus ?? 0),
                });
            });

        return () => {
            mounted = false;
        };
    }, [supabase]);

    useEffect(() => {
        setNow(Date.now());
        const timer = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(timer);
    }, []);

    if (!promo) return null;

    const start = new Date(promo.starts_at).getTime();
    const end = new Date(promo.ends_at).getTime();
    const remaining = now === null ? null : Math.max(0, end - now);

    if (remaining === 0) return null;

    const countdown =
        remaining === null
            ? "—"
            : `${Math.floor(remaining / 86400000)}d ${Math.floor(
                (remaining % 86400000) / 3600000
            )}h ${Math.floor((remaining % 3600000) / 60000)}m`;

    const elapsed =
        now !== null && end > start
            ? Math.min(1, Math.max(0, (now - start) / (end - start)))
            : 0;

    const money = (value: number) => `${currency} ${value.toLocaleString("en-US")}`;

    return (
        <section
            className={`rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/50 via-[#0c1f18] to-[#0a1511] p-6 sm:p-8 ${className}`}
        >
            <div className="flex items-start gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                    <Sparkles size={26} />
                </span>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{promo.title}</h2>
                    <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        ACTIVE
                    </span>
                </div>
            </div>

            <p className="mt-6 rounded-2xl border border-white/[0.05] bg-black/20 px-5 py-4 text-lg leading-relaxed text-neutral-400">
                Deposit more than{" "}
                <strong className="text-white">{money(promo.min_deposit)}</strong> and{" "}
                <strong className="text-emerald-400">{promo.headline}</strong> Maximum
                bonus <strong className="text-white">{money(promo.max_bonus)}</strong>.
            </p>

            <div className="mt-6 flex items-center gap-2.5 text-neutral-400">
                <Timer size={18} />
                <span>Ends in:</span>
                <span className="font-mono font-semibold text-emerald-400">
                    {countdown}
                </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                    className="h-full rounded-full bg-red-500"
                    style={{ width: `${Math.max(4, elapsed * 100)}%` }}
                />
            </div>

            {showCta && (
                <Link
                    href="/deposit"
                    className="mt-6 inline-flex items-center gap-3 rounded-full bg-emerald-500 px-8 py-4 text-lg font-semibold text-[#04110c] hover:bg-emerald-400"
                >
                    <Zap size={20} />
                    Deposit Now
                </Link>
            )}
        </section>
    );
}