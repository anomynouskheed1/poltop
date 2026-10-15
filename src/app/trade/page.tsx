
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import confetti from "canvas-confetti";
import TradeAuthModal from "@/components/TradeAuthModal";
import {
  BarChart3,
  CandlestickChart,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  HelpCircle,
  History,
  Radio,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import MarketChart from "@/components/MarketChart";
import TradeCountdown from "@/components/TradeCountdown";
import { AppShell, useAccount } from "@/components/AppShell";
import { useMarketTicks } from "@/hooks/useMarketTicks";
import { MarketSymbol, TradeDirection, Trade } from "@/types/trading";
import { playWinSound, playLossSound } from "@/lib/sounds";
import { createTrade, settleTrade } from "@/app/actions/trade";

type TradeType = "RISE_FALL" | "EVEN_ODD" | "OVER_UNDER";

const MARKETS: { value: MarketSymbol; label: string }[] = [
  { value: "VOL_10", label: "Volatility 10 Index" },
  { value: "VOL_25", label: "Volatility 25 Index" },
  { value: "VOL_50", label: "Volatility 50 Index" },
  { value: "VOL_75", label: "Volatility 75 Index" },
  { value: "VOL_100", label: "Volatility 100 Index" },
];

const STAKE_PRESETS = [100, 200, 500, 1000];
const DURATIONS = [5, 15, 30, 60];
const UP_DIRECTIONS = ["BUY", "EVEN", "OVER"];

const CONTRACTS: Record<
  TradeType,
  {
    label: string;
    up: { direction: string; label: string; hint: string };
    down: { direction: string; label: string; hint: string };
  }
> = {
  RISE_FALL: {
    label: "Rise / Fall",
    up: { direction: "BUY", label: "BUY", hint: "Candle goes green" },
    down: { direction: "SELL", label: "SELL", hint: "Candle goes red" },
  },
  EVEN_ODD: {
    label: "Even / Odd",
    up: { direction: "EVEN", label: "EVEN", hint: "Predict even" },
    down: { direction: "ODD", label: "ODD", hint: "Predict odd" },
  },
  OVER_UNDER: {
    label: "Over / Under",
    up: { direction: "OVER", label: "OVER 5", hint: "Predict over 5" },
    down: { direction: "UNDER", label: "UNDER 5", hint: "Predict under 5" },
  },
};

const howToSteps = (duration: number) => [
  {
    title: "Instant Funding",
    text: "Top up your account using your preferred payment method.",
  },
  {
    title: "Pick Your Forecast",
    text: "Predict whether the price will rise or fall after the trade window closes.",
  },
  {
    title: "Enter Your Trade",
    text: "Set your amount and select the direction that matches your prediction.",
  },
  {
    title: "Wait for Processing",
    text: `Your trade is locked for ${duration} seconds while the contract resolves.`,
  },
  {
    title: "Claim Your Payout",
    text: "Winnings are credited to your wallet when a trade wins.",
  },
  {
    title: "Support",
    text: "Contact support from your dashboard if you need assistance.",
  },
];

function HowToTradeModal({
  open,
  onClose,
  duration,
}: {
  open: boolean;
  onClose: () => void;
  duration: number;
}) {
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-to-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b1411] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h2 id="how-to-title" className="flex items-center gap-2 text-lg font-bold">
            <HelpCircle size={20} className="text-emerald-400" />
            How to Trade
          </h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={21} className="text-neutral-400" />
          </button>
        </div>

        <ol className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {howToSteps(duration).map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 font-bold text-emerald-400">
                {i + 1}
              </span>
              <div>
                <h3 className="font-bold">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-400">
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="flex gap-2 border-t border-white/[0.06] p-4">
          <Link
            href="/deposit"
            className="flex-1 rounded-xl bg-emerald-500 px-3 py-3 text-center text-sm font-bold text-[#04110c]"
          >
            Deposit funds
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 px-3 py-3 text-sm font-semibold"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

function RecentWin({ currency }: { currency: string }) {
  const { supabase } = useAccount();
  const [win, setWin] = useState<{
    name: string;
    payout: number;
    created_at: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchWin = async () => {
      const { data } = await supabase
        .from("recent_wins")
        .select("name, payout, created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (mounted) {
        setWin(data ? { ...data, payout: Number(data.payout) } : null);
      }
    };

    void fetchWin();
    const timer = setInterval(() => void fetchWin(), 30000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [supabase]);

  if (!win) return null;

  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(win.created_at).getTime()) / 60000)
  );

  const ago =
    minutes < 2
      ? "Just won"
      : minutes < 60
        ? `Won ${minutes}m ago`
        : minutes < 1440
          ? `Won ${Math.floor(minutes / 60)}h ago`
          : `Won ${Math.floor(minutes / 1440)}d ago`;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-950/30 px-3 py-3">
      <span className="text-xl">🎉</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{win.name}</p>
        <p className="text-xs text-neutral-400">{ago}</p>
      </div>
      <p className="shrink-0 font-mono text-sm font-bold text-emerald-400">
        +{currency} {win.payout.toLocaleString("en-US")}
      </p>
    </div>
  );
}

function TradeContent() {
  const {
    supabase,
    user,
    accountType,
    setAccountType,
    demoBalance,
    realBalance,
    currency,
    reload,
  } = useAccount();

  const [selectedSymbol, setSelectedSymbol] = useState<MarketSymbol>("VOL_100");
  const [tradeType, setTradeType] = useState<TradeType>("RISE_FALL");
  const [stake, setStake] = useState<number>(100);
  const [duration, setDuration] = useState<number>(15);
  const [activeTrades, setActiveTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [authMode, setAuthMode] = useState<"LOGIN" | "SIGNUP">("LOGIN");

  const closeAuthOverlay = useCallback(() => {
    setShowAuthOverlay(false);
  }, []);


  const { ticks, candles, currentPrice } = useMarketTicks(selectedSymbol);

  const priceRef = useRef<number | null>(null);

  useEffect(() => {
    priceRef.current = currentPrice ?? null;
  }, [currentPrice]);

  const openRef = useRef<{ symbol: string; price: number } | null>(null);

  useEffect(() => {
    openRef.current = null;
  }, [selectedSymbol]);

  useEffect(() => {
    if (currentPrice && !openRef.current) {
      openRef.current = { symbol: selectedSymbol, price: currentPrice };
    }
  }, [currentPrice, selectedSymbol]);

  const change =
    openRef.current && currentPrice
      ? ((currentPrice - openRef.current.price) / openRef.current.price) * 100
      : null;

  const activeBalance = accountType === "DEMO" ? demoBalance : realBalance;

  const money = (value: number) =>
    `${currency} ${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const loadTrades = useCallback(async () => {
    if (!user) return;

    const { data: trades } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false });

    if (trades) {
      setActiveTrades(
        trades.map((t: any) => ({
          id: t.id,
          userId: t.user_id,
          userEmail: user.email || "",
          symbol: t.symbol,
          direction: t.direction,
          stake: Number(t.stake),
          entryPrice: Number(t.entry_price),
          exitPrice:
            t.exit_price !== null && t.exit_price !== undefined
              ? Number(t.exit_price)
              : undefined,
          durationSeconds: t.duration_seconds,
          startTime: new Date(t.started_at).getTime(),
          endTime: new Date(t.ends_at).getTime(),
          status: t.status,
          payout: Number(t.payout || 0),
        }))
      );
    }
  }, [supabase, user]);

  useEffect(() => {
    void loadTrades();
  }, [loadTrades]);

  const refreshHistory = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadTrades(), reload()]);
    } finally {
      setRefreshing(false);
    }
  };

  async function handlePlaceTrade(direction: string) {
    if (!user) {
      setShowAuthOverlay(true);
      return;
    }

    if (!Number.isFinite(stake) || stake <= 0) {
      toast.error("Enter a valid stake amount.");
      return;
    }

    if (stake > activeBalance) {
      toast.error(`Insufficient ${accountType} balance.`);
      return;
    }

    if (!currentPrice) {
      toast.error("Waiting for market price...");
      return;
    }

    setLoading(true);

    try {
      const res = await createTrade({
        userId: user.id,
        symbol: selectedSymbol,
        direction: direction as TradeDirection,
        stake,
        entryPrice: currentPrice,
        durationSeconds: duration,
        accountType,
      });

      if (!res.success || !res.trade) {
        toast.error(res.message || "Trade placement failed.");
        return;
      }

      const tradeId = res.trade.id;
      const entryPrice = currentPrice;

      void reload();

      const newTradeObj: Trade = {
        id: tradeId,
        userId: user.id,
        userEmail: user.email,
        symbol: selectedSymbol,
        direction: direction as TradeDirection,
        stake,
        entryPrice,
        durationSeconds: duration,
        startTime: new Date(res.trade.started_at).getTime(),
        endTime: new Date(res.trade.ends_at).getTime(),
        status: "OPEN",
        payout: 0,
      };

      setActiveTrades((prev) => [newTradeObj, ...prev]);

      window.setTimeout(async () => {
        const exitPrice = priceRef.current ?? entryPrice;
        const settleRes = await settleTrade(tradeId, exitPrice);

        if (!settleRes.success) {
          toast.error("Unable to confirm trade settlement. Refresh your history.");
          return;
        }

        void reload();

        if (settleRes.won) {
          playWinSound();
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });

          toast.success(
            `WIN! + ${currency} ${(settleRes.payout ?? 0).toFixed(2)} credited`,
            {
              style: {
                background: "#064e3b",
                color: "#34d399",
                border: "1px solid #10b981",
              },
            }
          );
        } else {
          playLossSound();
          toast.error("LOSS! Contract expired out of profit", {
            style: {
              background: "#4c0519",
              color: "#f87171",
              border: "1px solid #f43f5e",
            },
          });
        }

        setActiveTrades((prev) =>
          prev.map((trade) =>
            trade.id === tradeId
              ? {
                ...trade,
                status: settleRes.won ? "WON" : "LOST",
                payout: settleRes.payout ?? 0,
                exitPrice,
              }
              : trade
          )
        );
      }, duration * 1000);
    } catch (error) {
      console.error("Trade placement error:", error);
      toast.error("Something went wrong placing the trade.");
    } finally {
      setLoading(false);
    }
  }

  const contract = CONTRACTS[tradeType];
  const marketLabel =
    MARKETS.find((m) => m.value === selectedSymbol)?.label ?? selectedSymbol;

  const pill = (active: boolean) =>
    `whitespace-nowrap rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors sm:px-3 sm:text-sm ${active
      ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40"
      : "bg-[#0e1512] text-neutral-300 ring-1 ring-white/[0.06] hover:text-white"
    }`;

  return (
    <div className="min-h-[calc(100vh-4rem)] min-w-0 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
      <Toaster position="top-center" />

      <HowToTradeModal
        open={howToOpen}
        onClose={() => setHowToOpen(false)}
        duration={duration}
      />
      <TradeAuthModal
        open={showAuthOverlay && !user}
        onClose={closeAuthOverlay}
        initialMode={authMode}
        onAuthenticated={() => {
          void reload();
          void loadTrades();
        }}
      />

      <div className="min-w-0">
        {/* Trading shortcuts */}
        <div className="border-b border-white/[0.06] px-3 py-2.5 sm:px-5 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex shrink-0 items-center rounded-lg border border-white/[0.06] bg-[#0e1512] p-0.5">
                <button
                  type="button"
                  onClick={() => setAccountType("REAL")}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-2 text-xs font-bold sm:px-3 ${accountType === "REAL"
                    ? "bg-emerald-500 text-[#04110c]"
                    : "text-neutral-400"
                    }`}
                >
                  <Radio size={13} />
                  Live
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType("DEMO")}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-2 text-xs font-bold sm:px-3 ${accountType === "DEMO"
                    ? "bg-emerald-500 text-[#04110c]"
                    : "text-neutral-400"
                    }`}
                >
                  <FlaskConical size={13} />
                  Demo
                </button>
              </div>

              <button
                type="button"
                onClick={() => setHowToOpen(true)}
                className="flex h-9 items-center gap-1 rounded-lg border border-white/[0.06] bg-[#0e1512] px-2 text-xs font-semibold text-neutral-300 sm:px-3"
              >
                <HelpCircle size={14} />
                How to
              </button>
            </div>

            <button
              type="button"
              aria-label="Toggle trade history"
              onClick={() => {
                setHistoryOpen((v) => !v);
                void loadTrades();
              }}
              className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-white/[0.06] px-2.5 text-xs font-semibold sm:px-3 ${historyOpen
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-[#0e1512] text-neutral-300"
                }`}
            >
              <History size={15} />
              History
            </button>
          </div>
        </div>

        {/* Market information */}
        <section className="px-3 pb-2 pt-3 sm:px-5 sm:pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 sm:h-11 sm:w-11">
                <BarChart3 size={20} />
              </span>
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-1.5">
                  <select
                    value={selectedSymbol}
                    onChange={(e) =>
                      setSelectedSymbol(e.target.value as MarketSymbol)
                    }
                    aria-label="Select market"
                    className="min-w-0 max-w-[205px] cursor-pointer truncate bg-transparent text-sm font-bold outline-none sm:max-w-none sm:text-lg"
                  >
                    {MARKETS.map((market) => (
                      <option
                        key={market.value}
                        value={market.value}
                        className="bg-[#0b1411]"
                      >
                        {market.label}
                      </option>
                    ))}
                  </select>
                  <span className="flex shrink-0 items-center gap-1 text-[10px] text-neutral-400 sm:text-xs">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${currentPrice ? "bg-emerald-400" : "bg-neutral-600"
                        }`}
                    />
                    Live
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-neutral-500 sm:text-sm">
                  {marketLabel} · {duration}s contract
                </p>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <p
                className={`font-mono text-lg font-bold sm:text-2xl ${change !== null && change < 0
                  ? "text-rose-400"
                  : "text-emerald-400"
                  }`}
              >
                {currentPrice ? currentPrice.toFixed(5) : "—"}
              </p>
              {change !== null && (
                <p
                  className={`flex items-center justify-end gap-1 font-mono text-[11px] sm:text-sm ${change < 0 ? "text-rose-400" : "text-emerald-400"
                    }`}
                >
                  {change < 0 ? (
                    <TrendingDown size={13} />
                  ) : (
                    <TrendingUp size={13} />
                  )}
                  {change >= 0 ? "+" : ""}
                  {change.toFixed(3)}%
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Contract and duration ABOVE the live market */}
        <section className="space-y-3 px-3 py-2 sm:px-5">
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 sm:text-xs">
              Contract
            </p>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {(Object.keys(CONTRACTS) as TradeType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTradeType(type)}
                  className={`min-w-0 rounded-lg px-1.5 py-2.5 text-[11px] font-semibold transition-colors sm:px-3 sm:text-sm ${tradeType === type
                    ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border border-white/[0.06] bg-[#0e1512] text-neutral-300 hover:text-white"
                    }`}
                >
                  {CONTRACTS[type].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 sm:text-xs">
              Duration
            </p>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {DURATIONS.map((seconds) => (
                <button
                  key={seconds}
                  type="button"
                  onClick={() => setDuration(seconds)}
                  className={pill(duration === seconds)}
                >
                  {seconds}s
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Live market chart */}
        <section className="px-3 pt-1 sm:px-5 sm:pt-2">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 sm:text-xs">
              Live Market
            </p>
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 sm:text-xs">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Market feed
            </span>
          </div>

          <div className="h-[210px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#070b10] p-1 sm:h-[300px] sm:rounded-2xl sm:p-2 lg:h-[340px]">
            <MarketChart
              ticks={ticks}
              candles={candles}
              symbol={selectedSymbol}
              activeTrades={activeTrades}
            />
          </div>
        </section>

        {/* BUY / SELL immediately below the chart */}
        <section className="px-3 pt-2.5 sm:px-5 sm:pt-3">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => void handlePlaceTrade(contract.up.direction)}
              disabled={loading}
              className="flex min-h-[58px] items-center justify-center gap-2 rounded-xl border border-emerald-400/50 bg-emerald-600 py-2.5 text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[68px] sm:rounded-2xl"
            >
              <ChevronUp size={22} />
              <span className="min-w-0 text-center">
                <span className="block text-sm font-extrabold sm:text-lg">
                  {loading ? "Please wait..." : contract.up.label}
                </span>
                <span className="hidden text-[10px] text-emerald-100/80 sm:block">
                  {contract.up.hint}
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => void handlePlaceTrade(contract.down.direction)}
              disabled={loading}
              className="flex min-h-[58px] items-center justify-center gap-2 rounded-xl border border-rose-400/50 bg-rose-700 py-2.5 text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[68px] sm:rounded-2xl"
            >
              <ChevronDown size={22} />
              <span className="min-w-0 text-center">
                <span className="block text-sm font-extrabold sm:text-lg">
                  {loading ? "Please wait..." : contract.down.label}
                </span>
                <span className="hidden text-[10px] text-rose-100/80 sm:block">
                  {contract.down.hint}
                </span>
              </span>
            </button>
          </div>
        </section>

        {/* Compact trade amount: input and presets on one row */}
        <section className="px-3 pb-4 pt-3 sm:px-5 sm:pt-4">
          <div className="rounded-xl border border-white/[0.07] bg-[#101914] p-3 sm:rounded-2xl sm:p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide sm:text-sm">
                  Trade amount
                </p>
                <p className="mt-0.5 text-[10px] text-neutral-500 sm:text-xs">
                  Balance: {money(activeBalance)}
                </p>
              </div>
              <Link
                href="/deposit"
                className="shrink-0 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 sm:text-xs"
              >
                Add funds +
              </Link>
            </div>

            <div className="grid grid-cols-[minmax(0,1.25fr)_repeat(4,minmax(0,1fr))] gap-1.5 sm:gap-2">
              <input
                type="number"
                min={1}
                step="1"
                value={stake}
                onChange={(e) => {
                  const value = e.target.value;
                  setStake(value === "" ? 0 : Number(value));
                }}
                onBlur={() => {
                  if (!Number.isFinite(stake) || stake < 1) setStake(1);
                }}
                aria-label="Trade amount"
                className="h-10 w-full min-w-0 rounded-lg border border-white/10 bg-[#0a110f] px-2 text-center font-mono text-xs font-bold outline-none focus:border-emerald-500 sm:h-11 sm:text-sm"
              />

              {STAKE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setStake(preset)}
                  className={`h-10 min-w-0 rounded-lg px-0.5 font-mono text-[11px] font-bold transition-colors sm:h-11 sm:text-sm ${stake === preset
                    ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/50"
                    : "bg-[#0a110f] text-neutral-300 ring-1 ring-white/[0.06] hover:ring-white/20"
                    }`}
                >
                  {preset >= 1000 ? `${preset / 1000}k` : preset}
                </button>
              ))}
            </div>

            <p className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-neutral-500 sm:text-xs">
              <ShieldCheck size={13} className="shrink-0" />
              Secured by <span className="font-semibold text-neutral-300">FX Trades</span>
            </p>
          </div>
        </section>
      </div>

      {/* Trade history: sidebar on desktop, expandable below on mobile */}
      <aside
        className={`relative min-h-[300px] border-white/[0.06] bg-[#0c1411] lg:block lg:border-l ${historyOpen
          ? "block border-t"
          : "hidden"
          }`}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 sm:px-5">
          <h2 className="flex items-center gap-2 text-base font-bold">
            <History size={18} className="text-emerald-400" />
            Trade History
          </h2>
          <button
            type="button"
            onClick={() => void refreshHistory()}
            aria-label="Refresh trade history"
            className="rounded-lg p-2 text-neutral-400 transition hover:text-white"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
          </button>
        </div>

        <ul className="max-h-[60vh] divide-y divide-white/[0.05] overflow-y-auto px-4 pb-4 lg:max-h-[calc(100vh-12rem)]">
          {activeTrades.length === 0 && (
            <li className="py-12 text-center text-sm text-neutral-500">
              No trades yet. Place your first trade.
            </li>
          )}

          {activeTrades.map((trade) => {
            const up = UP_DIRECTIONS.includes(trade.direction);
            const won = trade.status === "WON";
            const lost = trade.status === "LOST";
            const started = new Date(trade.startTime ?? 0);

            return (
              <li
                key={trade.id}
                className="flex items-center justify-between gap-2 py-3.5"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${won
                      ? "bg-emerald-500/15 text-emerald-400"
                      : lost
                        ? "bg-rose-500/15 text-rose-400"
                        : "bg-amber-500/15 text-amber-400"
                      }`}
                  >
                    {won ? "W" : lost ? "L" : "•"}
                  </span>

                  <div className="min-w-0">
                    <p
                      className={`text-sm font-bold ${up ? "text-emerald-400" : "text-rose-400"
                        }`}
                    >
                      {up ? "▲" : "▼"} {trade.direction}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      {started.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      ·{" "}
                      {started.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {trade.status === "OPEN" ? (
                    <div className="font-mono text-sm font-bold text-amber-400">
                      <TradeCountdown
                        endTime={trade.endTime ?? trade.endsAt ?? 0}
                        durationSeconds={trade.durationSeconds ?? 5}
                      />
                    </div>
                  ) : (
                    <p
                      className={`font-mono text-sm font-bold ${won ? "text-emerald-400" : "text-rose-400"
                        }`}
                    >
                      {won
                        ? `+${money(trade.payout ?? 0)}`
                        : `-${money(trade.stake)}`}
                    </p>
                  )}
                  <p className="text-[11px] text-neutral-500">
                    {money(trade.stake)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="px-4 pb-4">
          <RecentWin currency={currency} />
        </div>
      </aside>
    </div>
  );
}

export default function TradePage() {
  return (
    <AppShell flush>
      <TradeContent />
    </AppShell>
  );
}
