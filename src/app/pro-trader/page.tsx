
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    BarChart3,
    Bell,
    Menu,
    Search,
    Star,
    UserRound,
    Wallet,
    X,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import MarketChart from "@/components/MarketChart";
import { useMarketTicks } from "@/hooks/useMarketTicks";
import { supabase } from "@/lib/supabase";
import { createTrade, settleTrade } from "@/app/actions/trade";
import type { MarketSymbol, Trade } from "@/types/trading";

type WatchItem = {
    name: string;
    category: string;
    symbol: MarketSymbol;
    price: number;
    change: number;
    favorite?: boolean;
};

const markets: WatchItem[] = [
    { name: "EUR/USD", category: "Forex", symbol: "VOL_10", price: 1.08701, change: -0.2, favorite: true },
    { name: "GBP/USD", category: "Forex", symbol: "VOL_25", price: 1.27075, change: -0.07 },
    { name: "USD/JPY", category: "Forex", symbol: "VOL_50", price: 149.849, change: 0.16 },
    { name: "AUD/USD", category: "Forex", symbol: "VOL_75", price: 0.65863, change: 0.14 },
    { name: "USD/CAD", category: "Forex", symbol: "VOL_100", price: 1.3647, change: -0.12 },
    { name: "USD/CHF", category: "Forex", symbol: "VOL_10", price: 0.89802, change: 0.03 },
    { name: "NZD/USD", category: "Forex", symbol: "VOL_25", price: 0.60304, change: 0.14 },
    { name: "Volatility 10", category: "Synthetic", symbol: "VOL_10", price: 783.176, change: -0.17 },
    { name: "Volatility 25", category: "Synthetic", symbol: "VOL_25", price: 1298.499, change: 0.22 },
    { name: "Volatility 50", category: "Synthetic", symbol: "VOL_50", price: 5411.252, change: -0.21 },
    { name: "Volatility 75", category: "Synthetic", symbol: "VOL_75", price: 3883.785, change: -0.21 },
    { name: "Volatility 100", category: "Synthetic", symbol: "VOL_100", price: 9241.294, change: 0.34 },
    { name: "BTC/USD", category: "Crypto", symbol: "VOL_100", price: 67201.174, change: -0.15, favorite: true },
    { name: "ETH/USD", category: "Crypto", symbol: "VOL_75", price: 3504.711, change: 0.78 },
    { name: "SOL/USD", category: "Crypto", symbol: "VOL_50", price: 184.139, change: 0.87 },
    { name: "XRP/USD", category: "Crypto", symbol: "VOL_25", price: 0.6237, change: 0.23 },
    { name: "XAU/USD", category: "Commodity", symbol: "VOL_100", price: 2339.403, change: -0.23, favorite: true },
    { name: "XAG/USD", category: "Commodity", symbol: "VOL_50", price: 29.808, change: 0.37 },
    { name: "WTI/USD", category: "Commodity", symbol: "VOL_75", price: 78.334, change: -0.05 },
    { name: "AAPL", category: "Stock", symbol: "VOL_10", price: 187.535, change: 0.14 },
    { name: "MSFT", category: "Stock", symbol: "VOL_25", price: 413.3, change: 0.18 },
    { name: "TSLA", category: "Stock", symbol: "VOL_50", price: 248.586, change: 0.15 },
    { name: "GOOGL", category: "Stock", symbol: "VOL_75", price: 174.574, change: -0.18 },
    { name: "US500", category: "Index", symbol: "VOL_100", price: 5221.535, change: -0.39 },
    { name: "US30", category: "Index", symbol: "VOL_75", price: 38761.275, change: -0.09 },
    { name: "GER40", category: "Index", symbol: "VOL_50", price: 18332.224, change: 0.03 },
];

const timeframes = ["M1", "M5", "M15", "H1", "H4", "D1"];

type PositionTab = "OPEN" | "CLOSED";

function formatMoney(value: number) {
    return Number(value || 0).toLocaleString("en-KE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatPrice(value: number) {
    if (!Number.isFinite(value)) return "—";
    return value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: value < 10 ? 5 : 3,
    });
}

export default function ProTraderPage() {
    const [selectedMarket, setSelectedMarket] = useState<WatchItem>(markets[0]);
    const [search, setSearch] = useState("");
    const [timeframe, setTimeframe] = useState("M1");
    const [mobileWatchlist, setMobileWatchlist] = useState(false);

    const [user, setUser] = useState<any>(null);
    const [balance, setBalance] = useState(0);
    const [side, setSide] = useState<"BUY" | "SELL">("BUY");
    const [lotSize, setLotSize] = useState("0.01");
    const [takeProfit, setTakeProfit] = useState("");
    const [stopLoss, setStopLoss] = useState("");
    const [placing, setPlacing] = useState(false);
    const [positionTab, setPositionTab] = useState<PositionTab>("OPEN");
    const [openTrades, setOpenTrades] = useState<Trade[]>([]);
    const [closedTrades, setClosedTrades] = useState<Trade[]>([]);

    const latestPrices = useRef<Record<string, number>>({});
    const placingRef = useRef(false);

    const { ticks, candles, currentPrice, priceChange } =
        useMarketTicks(selectedMarket.symbol);

    useEffect(() => {
        if (Number.isFinite(currentPrice) && currentPrice > 0) {
            latestPrices.current[selectedMarket.symbol] = currentPrice;
        }
    }, [currentPrice, selectedMarket.symbol]);

    useEffect(() => {
        let cancelled = false;

        async function loadAccount() {
            try {
                const {
                    data: { user: currentUser },
                    error: authError,
                } = await supabase.auth.getUser();

                if (cancelled) return;

                if (authError || !currentUser) {
                    setUser(null);
                    return;
                }

                setUser(currentUser);

                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("real_balance")
                    .eq("id", currentUser.id)
                    .maybeSingle();

                if (!cancelled && !profileError && profile) {
                    setBalance(Number(profile.real_balance ?? 0));
                }

                const { data: trades, error: tradesError } = await supabase
                    .from("trades")
                    .select("*")
                    .eq("user_id", currentUser.id)
                    .eq("account_type", "REAL")
                    .order("started_at", { ascending: false });

                if (cancelled || tradesError || !trades) return;

                const mappedTrades: Trade[] = trades.map((trade: any) => ({
                    id: trade.id,
                    userId: trade.user_id,
                    userEmail: currentUser.email || "",
                    symbol: trade.symbol,
                    direction: trade.direction,
                    stake: Number(trade.stake),
                    entryPrice: Number(trade.entry_price),
                    exitPrice:
                        trade.exit_price != null
                            ? Number(trade.exit_price)
                            : undefined,
                    durationSeconds: Number(trade.duration_seconds),
                    startTime: new Date(trade.started_at).getTime(),
                    endTime: new Date(trade.ends_at).getTime(),
                    status: trade.status,
                    payout: Number(trade.payout ?? 0),
                }));

                setOpenTrades(
                    mappedTrades.filter((trade) => trade.status === "OPEN")
                );
                setClosedTrades(
                    mappedTrades.filter((trade) => trade.status !== "OPEN")
                );
            } catch (error) {
                console.error("Failed to load Pro Trader account:", error);
                if (!cancelled) {
                    toast.error("Unable to load your trading account.");
                }
            }
        }

        void loadAccount();

        return () => {
            cancelled = true;
        };
    }, []);

    const filteredMarkets = useMemo(() => {
        const value = search.trim().toLowerCase();
        if (!value) return markets;

        return markets.filter(
            (market) =>
                market.name.toLowerCase().includes(value) ||
                market.category.toLowerCase().includes(value)
        );
    }, [search]);

    const displayPrice =
        Number.isFinite(currentPrice) && currentPrice > 0
            ? currentPrice
            : selectedMarket.price;

    const displayChange = priceChange !== 0 ? priceChange : selectedMarket.change;

    async function handleOrder(orderSide: "BUY" | "SELL") {
        if (placingRef.current) return;

        if (!user) {
            window.location.href = "/auth";
            return;
        }

        const parsedLot = Number(lotSize);

        if (!Number.isFinite(parsedLot) || parsedLot <= 0) {
            toast.error("Enter a valid lot size.");
            return;
        }

        /*
         * IMPORTANT:
         * The existing backend accepts a monetary stake, not a true
         * leveraged lot-size contract. This keeps the existing behaviour:
         * the entered value is treated as the stake in the account currency.
         */
        const stake = parsedLot;

        if (stake > balance) {
            toast.error("Insufficient real balance.");
            return;
        }

        const entryPrice = Number(currentPrice);

        if (!Number.isFinite(entryPrice) || entryPrice <= 0) {
            toast.error("Waiting for a valid market price...");
            return;
        }

        placingRef.current = true;
        setPlacing(true);
        setSide(orderSide);

        try {
            const result = await createTrade({
                userId: user.id,
                symbol: selectedMarket.symbol,
                direction: orderSide,
                stake,
                entryPrice,
                durationSeconds: 60,
                accountType: "REAL",
            });

            if (!result.success || !result.trade) {
                toast.error(result.message || "Unable to place order.");
                return;
            }

            const tradeId = result.trade.id;
            const startedAt = result.trade.started_at;
            const endsAt = result.trade.ends_at;

            setBalance(
                result.newBalance !== undefined
                    ? Number(result.newBalance)
                    : (previous) => Math.max(0, previous - stake)
            );

            const newTrade: Trade = {
                id: tradeId,
                userId: user.id,
                userEmail: user.email || "",
                symbol: selectedMarket.symbol,
                direction: orderSide,
                stake,
                entryPrice,
                durationSeconds: 60,
                startTime: new Date(startedAt).getTime(),
                endTime: new Date(endsAt).getTime(),
                status: "OPEN",
                payout: 0,
            };

            setOpenTrades((previous) => [newTrade, ...previous]);
            setPositionTab("OPEN");
            toast.success(`${orderSide} ${selectedMarket.name} order opened`);

            /*
             * Keep the current backend settlement flow.
             * The settlement price is the latest price this page has observed
             * for the traded symbol. If the market has not been observed again,
             * the entry price is used as a fallback.
             */
            window.setTimeout(async () => {
                try {
                    const exitPrice =
                        latestPrices.current[newTrade.symbol] ?? entryPrice;

                    const settleResult = await settleTrade(tradeId, exitPrice);

                    if (!settleResult.success) {
                        toast.error(
                            settleResult.message || "Trade settlement failed."
                        );
                        return;
                    }

                    if (
                        settleResult.newBalance !== null &&
                        settleResult.newBalance !== undefined
                    ) {
                        setBalance(Number(settleResult.newBalance));
                    }

                    const finishedTrade: Trade = {
                        ...newTrade,
                        status: settleResult.won ? "WON" : "LOST",
                        payout: Number(settleResult.payout ?? 0),
                        exitPrice,
                    };

                    setOpenTrades((previous) =>
                        previous.filter((trade) => trade.id !== tradeId)
                    );
                    setClosedTrades((previous) => [
                        finishedTrade,
                        ...previous.filter((trade) => trade.id !== tradeId),
                    ]);

                    if (settleResult.won) {
                        toast.success(
                            `Trade won. Payout: ${formatMoney(
                                Number(settleResult.payout ?? 0)
                            )}`
                        );
                    } else {
                        toast.error("Trade closed at a loss.");
                    }
                } catch (error) {
                    console.error("Trade settlement error:", error);
                    toast.error("Could not settle the trade. Please refresh and check history.");
                }
            }, 60000);
        } catch (error) {
            console.error("Order placement error:", error);
            toast.error("Something went wrong while placing the order.");
        } finally {
            placingRef.current = false;
            setPlacing(false);
        }
    }

    async function signOut() {
        try {
            await supabase.auth.signOut();
        } finally {
            window.location.href = "/auth";
        }
    }

    const visibleTrades = positionTab === "OPEN" ? openTrades : closedTrades;

    return (
        <main className="min-h-screen overflow-hidden bg-[#050908] font-sans text-white">
            <Toaster position="top-right" />



            {/* MAIN */}
            <div className="w-full">
                <header className="flex h-[58px] items-center justify-between border-b border-white/[0.05] bg-[#070c0a] px-4 sm:px-5">

                    {/* LEFT: BACK BUTTON + MOBILE MARKETS */}
                    <div className="flex items-center gap-3">
                        <Link
                            href="/trade"
                            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-neutral-300 transition hover:border-emerald-500/30 hover:text-emerald-400"
                        >
                            <ArrowLeft size={15} />
                            <span>Back to Trade</span>
                        </Link>

                        <button
                            type="button"
                            onClick={() => setMobileWatchlist(true)}
                            className="flex items-center gap-1.5 text-neutral-400 hover:text-white lg:hidden"
                            aria-label="Open markets"
                        >
                            <Menu size={18} />
                            <span className="text-xs">Markets</span>
                        </button>
                    </div>

                    {/* RIGHT: KEEP YOUR EXISTING WALLET, NOTIFICATIONS AND PROFILE */}
                    <div className="flex items-center gap-2">
                        {/* Keep your existing wallet Link here */}
                        {/* Keep your existing notifications button here */}
                        {/* Keep your existing profile Link here */}
                    </div>
                </header>

                {/* TRADING TERMINAL */}
                <section className="h-[calc(100vh-58px)] min-h-[650px]">
                    <div className="grid h-full grid-cols-1 lg:grid-cols-[215px_minmax(0,1fr)_225px]">
                        {/* WATCHLIST */}
                        <aside
                            className={`${mobileWatchlist
                                ? "fixed inset-y-0 left-0 z-[60] block w-[300px]"
                                : "hidden"
                                } border-r border-white/[0.05] bg-[#070c0a] lg:block`}
                        >
                            <div className="flex h-full flex-col">
                                {mobileWatchlist && (
                                    <div className="flex items-center justify-between border-b border-white/[0.05] p-4 lg:hidden">
                                        <span className="text-sm font-black">Markets</span>
                                        <button
                                            onClick={() => setMobileWatchlist(false)}
                                            aria-label="Close markets"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                )}

                                <div className="border-b border-white/[0.05] p-3">
                                    <div className="flex items-center gap-2 rounded-xl bg-[#101714] px-3 py-2">
                                        <Search size={14} className="text-neutral-600" />
                                        <input
                                            value={search}
                                            onChange={(event) => setSearch(event.target.value)}
                                            placeholder="Search markets..."
                                            className="w-full bg-transparent text-[11px] text-white outline-none placeholder:text-neutral-600"
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    {filteredMarkets.map((market) => {
                                        const active = market.name === selectedMarket.name;

                                        return (
                                            <button
                                                key={market.name}
                                                onClick={() => {
                                                    setSelectedMarket(market);
                                                    setMobileWatchlist(false);
                                                }}
                                                className={`group flex w-full items-center justify-between border-b border-white/[0.025] px-3 py-2.5 text-left transition ${active ? "bg-[#111b17]" : "hover:bg-white/[0.025]"
                                                    }`}
                                            >
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="truncate text-[11px] font-bold">
                                                            {market.name}
                                                        </span>
                                                        {market.favorite && (
                                                            <Star
                                                                size={10}
                                                                className="fill-emerald-400 text-emerald-400"
                                                            />
                                                        )}
                                                    </div>
                                                    <p className="mt-0.5 text-[8px] text-neutral-600">
                                                        {market.category}
                                                    </p>
                                                </div>

                                                <div className="ml-2 text-right">
                                                    <p className="font-mono text-[10px] font-bold text-neutral-300">
                                                        {formatPrice(market.price)}
                                                    </p>
                                                    <p
                                                        className={`text-[8px] font-bold ${market.change >= 0
                                                            ? "text-emerald-500"
                                                            : "text-rose-500"
                                                            }`}
                                                    >
                                                        {market.change >= 0 ? "+" : ""}
                                                        {market.change.toFixed(2)}%
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}

                                    {filteredMarkets.length === 0 && (
                                        <p className="p-4 text-center text-xs text-neutral-500">
                                            No markets found.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </aside>

                        {/* CHART */}
                        <div className="min-w-0 bg-[#080d0b]">
                            <div className="flex h-[43px] items-center justify-between gap-2 border-b border-white/[0.05] px-3">
                                <div className="flex min-w-0 items-center gap-2">
                                    <span className="truncate text-xs font-black">
                                        {selectedMarket.name}
                                    </span>
                                    <span className="hidden text-[10px] text-neutral-600 sm:inline">
                                        {selectedMarket.category}
                                    </span>
                                    <span className="font-mono text-xs font-black">
                                        {formatPrice(displayPrice)}
                                    </span>
                                    <span
                                        className={`hidden text-[9px] font-bold sm:inline ${displayChange >= 0
                                            ? "text-emerald-500"
                                            : "text-rose-500"
                                            }`}
                                    >
                                        {displayChange >= 0 ? "+" : ""}
                                        {displayChange.toFixed(2)}%
                                    </span>
                                </div>

                                <div className="flex shrink-0 items-center gap-0.5">
                                    {timeframes.map((frame) => (
                                        <button
                                            key={frame}
                                            onClick={() => setTimeframe(frame)}
                                            className={`rounded px-1.5 py-1 text-[9px] font-bold transition sm:px-2 ${timeframe === frame
                                                ? "bg-emerald-500 text-black"
                                                : "text-neutral-500 hover:bg-white/[0.04] hover:text-white"
                                                }`}
                                        >
                                            {frame}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="h-[calc(100%-43px)] min-h-0 p-2">
                                <div className="h-full min-h-0 overflow-hidden border border-white/[0.04] bg-[#0d1117]">
                                    <MarketChart
                                        ticks={ticks}
                                        candles={candles}
                                        symbol={selectedMarket.symbol}
                                        activeTrades={openTrades}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* DESKTOP ORDER PANEL */}
                        <aside className="hidden border-l border-white/[0.05] bg-[#070c0a] lg:block">
                            <OrderPanel
                                selectedMarket={selectedMarket}
                                price={displayPrice}
                                side={side}
                                setSide={setSide}
                                lotSize={lotSize}
                                setLotSize={setLotSize}
                                takeProfit={takeProfit}
                                setTakeProfit={setTakeProfit}
                                stopLoss={stopLoss}
                                setStopLoss={setStopLoss}
                                placing={placing}
                                onOrder={handleOrder}
                                balance={balance}
                                openTrades={openTrades}
                                closedTrades={closedTrades}
                                positionTab={positionTab}
                                setPositionTab={setPositionTab}
                            />
                        </aside>
                    </div>
                </section>
            </div>

            {/* MOBILE BUY / SELL */}
            <div className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-2 gap-2 border-t border-white/[0.05] bg-[#070c0a]/95 p-2 backdrop-blur lg:hidden">
                <button
                    onClick={() => void handleOrder("SELL")}
                    disabled={placing}
                    className="rounded-xl border border-rose-500/20 bg-rose-500/10 py-3 text-xs font-black text-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {placing && side === "SELL" ? "PLACING..." : `SELL ${formatPrice(displayPrice)}`}
                </button>
                <button
                    onClick={() => void handleOrder("BUY")}
                    disabled={placing}
                    className="rounded-xl bg-emerald-500 py-3 text-xs font-black text-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {placing && side === "BUY" ? "PLACING..." : `BUY ${formatPrice(displayPrice)}`}
                </button>
            </div>

            {/* MOBILE NAV */}

        </main>
    );
}

function OrderPanel({
    selectedMarket,
    price,
    side,
    setSide,
    lotSize,
    setLotSize,
    takeProfit,
    setTakeProfit,
    stopLoss,
    setStopLoss,
    placing,
    onOrder,
    balance,
    openTrades,
    closedTrades,
    positionTab,
    setPositionTab,
}: {
    selectedMarket: WatchItem;
    price: number;
    side: "BUY" | "SELL";
    setSide: (side: "BUY" | "SELL") => void;
    lotSize: string;
    setLotSize: (value: string) => void;
    takeProfit: string;
    setTakeProfit: (value: string) => void;
    stopLoss: string;
    setStopLoss: (value: string) => void;
    placing: boolean;
    onOrder: (side: "BUY" | "SELL") => void;
    balance: number;
    openTrades: Trade[];
    closedTrades: Trade[];
    positionTab: PositionTab;
    setPositionTab: (tab: PositionTab) => void;
}) {
    const buyPrice = price;
    const sellPrice = price;
    const visibleTrades = positionTab === "OPEN" ? openTrades : closedTrades;

    function decreaseLot() {
        const current = Number(lotSize);
        const value = Math.max(0.01, (Number.isFinite(current) ? current : 0.01) - 0.01);
        setLotSize(value.toFixed(2));
    }

    function increaseLot() {
        const current = Number(lotSize);
        const value = (Number.isFinite(current) && current >= 0.01 ? current : 0.01) + 0.01;
        setLotSize(value.toFixed(2));
    }

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
                <span className="text-xs font-black">New Order</span>
                <Link
                    href="/wallet"
                    className="text-[9px] font-bold text-emerald-400 hover:text-emerald-300"
                >
                    Deposit funds →
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
                <div className="grid grid-cols-2 gap-1.5">
                    <button
                        type="button"
                        onClick={() => setSide("SELL")}
                        className={`rounded-xl border py-3 ${side === "SELL"
                            ? "border-rose-500/30 bg-rose-500/10"
                            : "border-white/[0.05] bg-[#0d1411]"
                            }`}
                    >
                        <span className="block text-[8px] text-neutral-500">SELL</span>
                        <span className="mt-1 block font-mono text-xs font-black text-rose-400">
                            {formatPrice(sellPrice)}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setSide("BUY")}
                        className={`rounded-xl border py-3 ${side === "BUY"
                            ? "border-emerald-500/30 bg-emerald-500/10"
                            : "border-white/[0.05] bg-[#0d1411]"
                            }`}
                    >
                        <span className="block text-[8px] text-neutral-500">BUY</span>
                        <span className="mt-1 block font-mono text-xs font-black text-emerald-400">
                            {formatPrice(buyPrice)}
                        </span>
                    </button>
                </div>

                <div className="mt-5">
                    <label htmlFor="lot-size" className="mb-2 block text-[9px] text-neutral-500">
                        Lot size / stake
                    </label>
                    <div className="grid grid-cols-[34px_1fr_34px] gap-1.5">
                        <button
                            type="button"
                            onClick={decreaseLot}
                            className="rounded-lg border border-white/[0.05] bg-[#0d1411] text-neutral-300 hover:bg-white/[0.04]"
                            aria-label="Decrease lot size"
                        >
                            −
                        </button>
                        <input
                            id="lot-size"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={lotSize}
                            onChange={(event) => setLotSize(event.target.value)}
                            className="w-full rounded-lg border border-white/[0.05] bg-[#0d1411] px-3 py-2 text-center font-mono text-xs font-bold outline-none focus:border-emerald-500/40"
                        />
                        <button
                            type="button"
                            onClick={increaseLot}
                            className="rounded-lg border border-white/[0.05] bg-[#0d1411] text-neutral-300 hover:bg-white/[0.04]"
                            aria-label="Increase lot size"
                        >
                            +
                        </button>
                    </div>
                    <p className="mt-1 text-[8px] text-neutral-600">
                        The current backend treats this value as the stake amount.
                    </p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                    <div>
                        <label htmlFor="take-profit" className="mb-2 block text-[9px] text-neutral-500">
                            Take Profit
                        </label>
                        <input
                            id="take-profit"
                            type="number"
                            min="0"
                            value={takeProfit}
                            onChange={(event) => setTakeProfit(event.target.value)}
                            placeholder="Optional"
                            className="w-full rounded-lg border border-white/[0.05] bg-[#0d1411] px-2 py-2.5 font-mono text-[10px] outline-none placeholder:text-neutral-700 focus:border-emerald-500/40"
                        />
                    </div>
                    <div>
                        <label htmlFor="stop-loss" className="mb-2 block text-[9px] text-neutral-500">
                            Stop Loss
                        </label>
                        <input
                            id="stop-loss"
                            type="number"
                            min="0"
                            value={stopLoss}
                            onChange={(event) => setStopLoss(event.target.value)}
                            placeholder="Optional"
                            className="w-full rounded-lg border border-white/[0.05] bg-[#0d1411] px-2 py-2.5 font-mono text-[10px] outline-none placeholder:text-neutral-700 focus:border-emerald-500/40"
                        />
                    </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-white/[0.05] pt-4">
                    <span className="text-[9px] text-neutral-600">Available</span>
                    <span className="font-mono text-[10px] font-bold text-neutral-300">
                        KES {formatMoney(balance)}
                    </span>
                </div>

                <button
                    type="button"
                    onClick={() => onOrder(side)}
                    disabled={placing}
                    className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${side === "BUY"
                        ? "bg-emerald-500 text-black hover:bg-emerald-400"
                        : "bg-rose-500 text-white hover:bg-rose-400"
                        }`}
                >
                    <BarChart3 size={16} />
                    {placing ? "PLACING ORDER..." : `${side} ${selectedMarket.name}`}
                </button>
            </div>

            <div className="border-t border-white/[0.05] p-3">
                <div className="mb-3 flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => setPositionTab("OPEN")}
                        className={`border-b pb-2 text-[10px] font-bold ${positionTab === "OPEN"
                            ? "border-emerald-500 text-emerald-400"
                            : "border-transparent text-neutral-600"
                            }`}
                    >
                        Open ({openTrades.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setPositionTab("CLOSED")}
                        className={`border-b pb-2 text-[10px] font-bold ${positionTab === "CLOSED"
                            ? "border-emerald-500 text-emerald-400"
                            : "border-transparent text-neutral-600"
                            }`}
                    >
                        Closed ({closedTrades.length})
                    </button>
                </div>

                <div className="max-h-40 space-y-2 overflow-y-auto">
                    {visibleTrades.length === 0 ? (
                        <p className="py-3 text-center text-[9px] text-neutral-600">
                            No {positionTab.toLowerCase()} positions.
                        </p>
                    ) : (
                        visibleTrades.map((trade) => (
                            <div
                                key={trade.id}
                                className="rounded-lg border border-white/[0.05] bg-[#0d1411] p-2"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-bold">
                                        {trade.symbol}
                                    </span>
                                    <span
                                        className={`text-[9px] font-black ${trade.direction === "BUY"
                                            ? "text-emerald-400"
                                            : "text-rose-400"
                                            }`}
                                    >
                                        {trade.direction}
                                    </span>
                                </div>
                                <div className="mt-1 flex items-center justify-between text-[9px] text-neutral-500">
                                    <span>Stake: {formatMoney(Number(trade.stake))}</span>
                                    <span>{trade.status}</span>
                                </div>
                                <div className="mt-1 text-[9px] text-neutral-600">
                                    Entry: {formatPrice(Number(trade.entryPrice))}
                                    {trade.exitPrice != null
                                        ? ` · Exit: ${formatPrice(Number(trade.exitPrice))}`
                                        : ""}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function SidebarSection({ title }: { title: string }) {
    return (
        <p className="mb-2 mt-4 px-3 text-[9px] font-black tracking-[0.15em] text-neutral-600 first:mt-0">
            {title}
        </p>
    );
}

function SidebarItem({
    href,
    icon,
    label,
    active = false,
    badge,
}: {
    href: string;
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    badge?: string;
}) {
    return (
        <Link
            href={href}
            className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition ${active
                ? "bg-[#121b17] font-bold text-white"
                : "text-neutral-400 hover:bg-white/[0.03] hover:text-white"
                }`}
        >
            <span className={active ? "text-emerald-400" : "text-neutral-500"}>
                {icon}
            </span>
            <span>{label}</span>
            {badge && <span className="text-[8px] text-orange-400">{badge}</span>}
        </Link>
    );
}

function BottomItem({
    href,
    icon,
    label,
    active = false,
}: {
    href: string;
    icon: React.ReactNode;
    label: string;
    active?: boolean;
}) {
    return (
        <Link
            href={href}
            className={`flex flex-col items-center justify-center gap-1 ${active ? "text-emerald-400" : "text-neutral-600"
                }`}
        >
            {icon}
            <span className="text-[8px] font-black tracking-wider">{label}</span>
        </Link>
    );
}
