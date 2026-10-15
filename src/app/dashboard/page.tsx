// src/app/page.tsx
"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import {
  Copy,
  Download,
  FlaskConical,
  Gift,
  Radio,
  Share2,
  Upload,
  Users,
  Wallet,
} from "lucide-react";

import { AppShell, useAccount } from "@/components/AppShell";
import { PromoCard } from "@/components/PromoCard";
import { useMarketTicks } from "@/hooks/useMarketTicks";
import { MarketSymbol } from "@/types/trading";

type AccountType = "DEMO" | "REAL";

interface RecentTrade {
  id: string;
  symbol: string;
  direction: string;
  stake: number;
  payout: number;
  status: string;
  created_at: string;
  account_type: AccountType;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

// Same markets as the trade page, so the dashboard shows the same live prices
const MARKETS: { value: MarketSymbol; label: string }[] = [
  { value: "VOL_10", label: "Volatility 10" },
  { value: "VOL_25", label: "Volatility 25" },
  { value: "VOL_50", label: "Volatility 50" },
  { value: "VOL_75", label: "Volatility 75" },
  { value: "VOL_100", label: "Volatility 100" },
];

// Set NEXT_PUBLIC_REFERRAL_BONUS in .env.local to show the bonus amount
const REFERRAL_BONUS = Number(process.env.NEXT_PUBLIC_REFERRAL_BONUS);

const card = "rounded-3xl border border-white/[0.06] bg-[#111a17]";

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function EquityChart({
  series,
  negative,
}: {
  series: number[];
  negative: boolean;
}) {
  const id = useId();
  const w = 600;
  const h = 200;
  const pad = 6;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;

  const points = series.map((v, i) => [
    (i / Math.max(series.length - 1, 1)) * w,
    h - pad - ((v - min) / range) * (h - pad * 2),
  ]);
  const line = points
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const color = negative ? "#ef4444" : "#10b981";

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="h-[200px] w-full"
      role="img"
      aria-label="30-day balance history"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** One market row, driven by the same hook as the trade page */
function MarketRow({
  symbol,
  label,
  onLive,
}: {
  symbol: MarketSymbol;
  label: string;
  onLive: (symbol: string, live: boolean) => void;
}) {
  const { currentPrice } = useMarketTicks(symbol);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (currentPrice && open === null) setOpen(currentPrice);
  }, [currentPrice, open]);

  useEffect(() => {
    onLive(symbol, !!currentPrice);
  }, [symbol, currentPrice, onLive]);

  const change =
    open && currentPrice ? ((currentPrice - open) / open) * 100 : null;

  return (
    <li className="flex items-center justify-between">
      <span className="font-semibold">{label}</span>
      <span className="flex items-baseline gap-3 font-mono">
        <span className="text-[17px]">
          {currentPrice ? currentPrice.toFixed(2) : "—"}
        </span>
        <span
          className={`w-16 text-right text-sm ${change === null
              ? "text-neutral-600"
              : change >= 0
                ? "text-emerald-400"
                : "text-red-500"
            }`}
        >
          {change === null
            ? "—"
            : `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`}
        </span>
      </span>
    </li>
  );
}

function MarketsCard() {
  const [live, setLive] = useState<Record<string, boolean>>({});

  const onLive = useMemo(
    () => (symbol: string, isLive: boolean) =>
      setLive((prev) =>
        prev[symbol] === isLive ? prev : { ...prev, [symbol]: isLive }
      ),
    []
  );

  const anyLive = Object.values(live).some(Boolean);

  return (
    <div className={`${card} p-6 sm:p-7`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Markets</h2>
        <span
          title={anyLive ? "Live" : "Connecting…"}
          className={`h-2.5 w-2.5 rounded-full ${anyLive ? "bg-emerald-500" : "bg-neutral-600"
            }`}
        />
      </div>

      <ul className="mt-5 space-y-4">
        {MARKETS.map((m) => (
          <MarketRow
            key={m.value}
            symbol={m.value}
            label={m.label}
            onLive={onLive}
          />
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

function DashboardContent() {
  const {
    supabase,
    user,
    displayName,
    currency,
    demoBalance,
    realBalance,
    accountType,
    setAccountType,
    referralCode,
  } = useAccount();

  const userId = user?.id;

  const [trades, setTrades] = useState<RecentTrade[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ledger, setLedger] = useState<{
    trades: RecentTrade[];
    tx: Transaction[];
  }>({ trades: [], tx: [] });
  const [friendsReferred, setFriendsReferred] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!userId) return;
    let mounted = true;

    const toTrade = (t: any): RecentTrade => ({
      id: t.id,
      symbol: t.symbol,
      direction: t.direction,
      stake: Number(t.stake ?? 0),
      payout: Number(t.payout ?? 0),
      status: t.status,
      created_at: t.started_at,
      account_type: t.account_type === "REAL" ? "REAL" : "DEMO",
    });

    const tradeColumns =
      "id, symbol, direction, stake, payout, status, started_at, account_type";

    const load = async () => {
      const since = new Date(Date.now() - 31 * 86400000).toISOString();

      const [recentRes, txRes, refRes, ledgerTradesRes, ledgerTxRes] =
        await Promise.all([
          supabase
            .from("trades")
            .select(tradeColumns)
            .eq("user_id", userId)
            .order("started_at", { ascending: false })
            .limit(5),
          supabase
            .from("transactions")
            .select("id, type, amount, status, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("referred_by", userId),
          supabase
            .from("trades")
            .select(tradeColumns)
            .eq("user_id", userId)
            .gte("started_at", since)
            .in("status", ["WON", "LOST"]),
          supabase
            .from("transactions")
            .select("id, type, amount, status, created_at")
            .eq("user_id", userId)
            .gte("created_at", since),
        ]);

      if (!mounted) return;

      const toTx = (t: any): Transaction => ({
        ...t,
        amount: Number(t.amount ?? 0),
      });

      setTrades((recentRes.data ?? []).map(toTrade));
      setTransactions((txRes.data ?? []).map(toTx));
      setFriendsReferred(refRes.count ?? 0);
      setLedger({
        trades: (ledgerTradesRes.data ?? []).map(toTrade),
        tx: (ledgerTxRes.data ?? [])
          .filter(
            (t: any) =>
              !["PENDING", "FAILED", "REJECTED", "CANCELLED"].includes(
                String(t.status).toUpperCase()
              )
          )
          .map(toTx),
      });
      setDataLoading(false);
    };

    load().catch((error) => {
      console.error("Dashboard data error:", error);
      if (mounted) setDataLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [supabase, userId]);

  const firstName = displayName.split(" ")[0];
  const currentBalance = accountType === "DEMO" ? demoBalance : realBalance;

  /* Equity history, rebuilt backwards from today's balance using the ledger */
  const equity = useMemo(() => {
    const DAYS = 30;
    const dayKey = (d: Date) => d.toISOString().slice(0, 10);
    const change: Record<string, number> = {};
    const add = (date: string, value: number) => {
      const key = dayKey(new Date(date));
      change[key] = (change[key] ?? 0) + value;
    };

    ledger.trades
      .filter((t) => t.account_type === accountType)
      .forEach((t) => {
        if (t.status === "WON") add(t.created_at, t.payout);
        if (t.status === "LOST") add(t.created_at, -t.stake);
      });

    if (accountType === "REAL") {
      ledger.tx.forEach((t) => {
        const type = String(t.type).toUpperCase();
        if (type === "DEPOSIT") add(t.created_at, t.amount);
        if (type === "WITHDRAWAL" || type === "WITHDRAW")
          add(t.created_at, -t.amount);
      });
    }

    const series: number[] = [];
    let running = currentBalance;
    for (let i = 0; i < DAYS; i++) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      series.unshift(running);
      running -= change[dayKey(d)] ?? 0;
    }
    return series;
  }, [ledger, accountType, currentBalance]);

  const periodChange = currentBalance - (equity[0] ?? currentBalance);
  const periodPct = equity[0] > 0 ? (periodChange / equity[0]) * 100 : null;

  const money = (value: number) =>
    `${currency} ${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const shortDate = (date: string) => {
    const d = new Date(date);
    return Number.isNaN(d.getTime())
      ? "—"
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  /* Referral */
  const referralLink =
    origin && referralCode ? `${origin}/auth?ref=${referralCode}` : "";
  const hasBonus = Number.isFinite(REFERRAL_BONUS);

  const copyLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const shareLink = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on FX Trades",
          url: referralLink,
        });
        return;
      } catch {
        /* cancelled */
      }
    }
    copyLink();
  };

  const toggleClass = (active: boolean) =>
    `flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${active
      ? "bg-emerald-500 text-[#04110c]"
      : "text-neutral-400 hover:text-white"
    }`;

  return (
    <>
      {/* Welcome row */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[34px] font-bold leading-tight tracking-tight sm:text-4xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-lg text-neutral-400">
            Here&apos;s your account snapshot.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/deposit"
            className="flex items-center gap-3 rounded-xl border border-emerald-400/30 bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3.5 text-base font-semibold text-[#04110c] shadow-[0_6px_24px_rgba(16,185,129,0.3)] hover:from-emerald-400 hover:to-emerald-500"
          >
            <Download size={18} />
            Deposit
          </Link>

          <Link
            href="/withdraw"
            className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0e1512] px-6 py-3.5 text-base font-semibold hover:bg-[#141d19]"
          >
            <Upload size={18} />
            Withdraw
          </Link>

          <div className="flex rounded-xl border border-white/[0.06] bg-[#0e1512] p-1">
            <button
              type="button"
              onClick={() => setAccountType("REAL")}
              className={toggleClass(accountType === "REAL")}
            >
              <Radio size={15} />
              Live
            </button>
            <button
              type="button"
              onClick={() => setAccountType("DEMO")}
              className={toggleClass(accountType === "DEMO")}
            >
              <FlaskConical size={15} />
              Demo
            </button>
          </div>
        </div>
      </div>

      {/* Active promotion (renders only when one is running) */}
      <PromoCard currency={currency} showCta className="mt-8" />

      {/* Referral */}
      <section className={`${card} mt-6 p-5 sm:p-7`}>
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
            <Gift size={26} />
          </span>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {hasBonus
                ? `Referral Bonus — Earn ${currency} ${REFERRAL_BONUS} per friend!`
                : "Referral Bonus — Earn rewards for every friend!"}
            </h2>
            <p className="mt-1.5 text-neutral-400">
              Share your personal link. When a friend signs up and makes their
              first deposit, you both win
              {hasBonus
                ? ` — you get ${currency} ${REFERRAL_BONUS} credited instantly.`
                : "."}
            </p>
          </div>
        </div>

        <p className="mt-5 flex items-center gap-2 text-neutral-400">
          <Users size={16} />
          {friendsReferred} friends referred
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="min-w-0 flex-1 truncate rounded-xl border border-white/[0.05] bg-black/20 px-4 py-3.5 font-mono text-[15px]">
            {referralLink || "https://fxtrades.com/auth?ref=907e7757"}
          </div>
          <button
            type="button"
            onClick={copyLink}
            disabled={!referralLink}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[#0e1512] px-5 py-3.5 font-semibold hover:bg-[#141d19] disabled:opacity-50"
          >
            <Copy size={17} />
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <button
          type="button"
          onClick={shareLink}
          disabled={!referralLink}
          className="mx-auto mt-5 flex items-center gap-2.5 font-semibold text-white hover:text-emerald-400 disabled:opacity-50"
        >
          <Share2 size={17} />
          Share now
        </button>
      </section>

      {/* Balance */}
      <section className="mt-6 max-w-[470px]">
        <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-[#12241d] to-[#0d1713] p-6 shadow-[0_0_30px_rgba(16,185,129,0.12)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-neutral-400">
                Balance
              </p>
              <p className="mt-3 font-mono text-4xl font-bold">
                {money(currentBalance)}
              </p>
              <p
                className={`mt-2 ${periodChange > 0
                    ? "text-emerald-400"
                    : periodChange < 0
                      ? "text-red-500"
                      : "text-neutral-400"
                  }`}
              >
                {periodChange === 0
                  ? "No change in the last 30 days"
                  : `${periodChange > 0 ? "+" : "-"}${money(
                    Math.abs(periodChange)
                  )}${periodPct !== null
                    ? ` (${periodPct > 0 ? "+" : ""}${periodPct.toFixed(1)}%)`
                    : ""
                  } in 30 days`}
              </p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <Wallet size={22} />
            </span>
          </div>
        </div>
      </section>

      {/* Equity + Markets */}
      <section className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className={`${card} flex min-h-[340px] flex-col p-6 sm:p-7`}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">Portfolio equity</h2>
              <p className="mt-1 text-neutral-400">30-day balance history</p>
            </div>
            <span
              className={periodChange < 0 ? "text-red-500" : "text-emerald-400"}
            >
              {periodPct === null
                ? "–"
                : `${periodPct > 0 ? "+" : ""}${periodPct.toFixed(1)}%`}
            </span>
          </div>
          <div className="mt-auto pt-6">
            <EquityChart series={equity} negative={periodChange < 0} />
          </div>
        </div>

        <MarketsCard />
      </section>

      {/* Recent trades + transactions */}
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className={`${card} flex min-h-[250px] flex-col p-6 sm:p-7`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent trades</h2>
            <Link
              href="/history"
              className="text-sm text-emerald-400 hover:text-emerald-300"
            >
              View all
            </Link>
          </div>

          {dataLoading ? (
            <p className="m-auto text-neutral-500">Loading…</p>
          ) : trades.length === 0 ? (
            <p className="m-auto text-center text-lg text-neutral-400">
              No trades yet.{" "}
              <Link
                href="/trade"
                className="text-emerald-400 hover:text-emerald-300"
              >
                Start trading →
              </Link>
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-white/[0.05]">
              {trades.map((t) => {
                const won = t.status === "WON";
                const lost = t.status === "LOST";
                return (
                  <li
                    key={t.id}
                    className="flex items-center justify-between py-3.5"
                  >
                    <div>
                      <p className="font-semibold">
                        {t.symbol}{" "}
                        <span className="ml-1 text-xs font-bold text-neutral-400">
                          {t.direction}
                        </span>
                      </p>
                      <p className="mt-0.5 text-sm text-neutral-500">
                        {shortDate(t.created_at)} · {t.account_type} · Stake{" "}
                        {money(t.stake)}
                      </p>
                    </div>
                    <p
                      className={`font-mono font-semibold ${won
                          ? "text-emerald-400"
                          : lost
                            ? "text-red-500"
                            : "text-amber-400"
                        }`}
                    >
                      {won
                        ? `+${money(t.payout)}`
                        : lost
                          ? `-${money(t.stake)}`
                          : t.status}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className={`${card} flex min-h-[250px] flex-col p-6 sm:p-7`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent transactions</h2>
            <Link
              href="/wallet"
              className="text-sm text-emerald-400 hover:text-emerald-300"
            >
              View all
            </Link>
          </div>

          {dataLoading ? (
            <p className="m-auto text-neutral-500">Loading…</p>
          ) : transactions.length === 0 ? (
            <p className="m-auto text-center text-lg text-neutral-400">
              No transactions yet.{" "}
              <Link
                href="/deposit"
                className="text-emerald-400 hover:text-emerald-300"
              >
                Make a deposit →
              </Link>
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-white/[0.05]">
              {transactions.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between py-3.5"
                >
                  <div>
                    <p className="font-semibold capitalize">
                      {String(t.type).toLowerCase()}
                    </p>
                    <p className="mt-0.5 text-sm text-neutral-500">
                      {shortDate(t.created_at)} · {t.status}
                    </p>
                  </div>
                  <p className="font-mono font-semibold">{money(t.amount)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}

export default function HomePage() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}