"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    ArrowDownToLine,
    ArrowUpFromLine,
    BarChart3,
    Bell,
    CandlestickChart,
    ChevronDown,
    Clock3,
    Copy,
    Home,
    LayoutDashboard,
    LogOut,
    Menu,
    Search,
    Settings,
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
import { MarketSymbol, Trade } from "@/types/trading";

type WatchItem = {
    name: string;
    category: string;
    symbol: MarketSymbol;
    price: number;
    change: number;
    favorite?: boolean;
};

const markets: WatchItem[] = [
    {
        name: "EUR/USD",
        category: "Forex",
        symbol: "VOL_10",
        price: 1.08701,
        change: -0.2,
        favorite: true,
    },
    {
        name: "GBP/USD",
        category: "Forex",
        symbol: "VOL_25",
        price: 1.27075,
        change: -0.07,
    },
    {
        name: "USD/JPY",
        category: "Forex",
        symbol: "VOL_50",
        price: 149.849,
        change: 0.16,
    },
    {
        name: "AUD/USD",
        category: "Forex",
        symbol: "VOL_75",
        price: 0.65863,
        change: 0.14,
    },
    {
        name: "USD/CAD",
        category: "Forex",
        symbol: "VOL_100",
        price: 1.3647,
        change: -0.12,
    },
    {
        name: "USD/CHF",
        category: "Forex",
        symbol: "VOL_10",
        price: 0.89802,
        change: 0.03,
    },
    {
        name: "NZD/USD",
        category: "Forex",
        symbol: "VOL_25",
        price: 0.60304,
        change: 0.14,
    },
    {
        name: "Volatility 10",
        category: "Synthetic",
        symbol: "VOL_10",
        price: 783.176,
        change: -0.17,
    },
    {
        name: "Volatility 25",
        category: "Synthetic",
        symbol: "VOL_25",
        price: 1298.499,
        change: 0.22,
    },
    {
        name: "Volatility 50",
        category: "Synthetic",
        symbol: "VOL_50",
        price: 5411.252,
        change: -0.21,
    },
    {
        name: "Volatility 75",
        category: "Synthetic",
        symbol: "VOL_75",
        price: 3883.785,
        change: -0.21,
    },
    {
        name: "Volatility 100",
        category: "Synthetic",
        symbol: "VOL_100",
        price: 9241.294,
        change: 0.34,
    },
    {
        name: "BTC/USD",
        category: "Crypto",
        symbol: "VOL_100",
        price: 67201.174,
        change: -0.15,
        favorite: true,
    },
    {
        name: "ETH/USD",
        category: "Crypto",
        symbol: "VOL_75",
        price: 3504.711,
        change: 0.78,
    },
    {
        name: "SOL/USD",
        category: "Crypto",
        symbol: "VOL_50",
        price: 184.139,
        change: 0.87,
    },
    {
        name: "XRP/USD",
        category: "Crypto",
        symbol: "VOL_25",
        price: 0.6237,
        change: 0.23,
    },
    {
        name: "XAU/USD",
        category: "Commodity",
        symbol: "VOL_100",
        price: 2339.403,
        change: -0.23,
        favorite: true,
    },
    {
        name: "XAG/USD",
        category: "Commodity",
        symbol: "VOL_50",
        price: 29.808,
        change: 0.37,
    },
    {
        name: "WTI/USD",
        category: "Commodity",
        symbol: "VOL_75",
        price: 78.334,
        change: -0.05,
    },
    {
        name: "AAPL",
        category: "Stock",
        symbol: "VOL_10",
        price: 187.535,
        change: 0.14,
    },
    {
        name: "MSFT",
        category: "Stock",
        symbol: "VOL_25",
        price: 413.3,
        change: 0.18,
    },
    {
        name: "TSLA",
        category: "Stock",
        symbol: "VOL_50",
        price: 248.586,
        change: 0.15,
    },
    {
        name: "GOOGL",
        category: "Stock",
        symbol: "VOL_75",
        price: 174.574,
        change: -0.18,
    },
    {
        name: "US500",
        category: "Index",
        symbol: "VOL_100",
        price: 5221.535,
        change: -0.39,
    },
    {
        name: "US30",
        category: "Index",
        symbol: "VOL_75",
        price: 38761.275,
        change: -0.09,
    },
    {
        name: "GER40",
        category: "Index",
        symbol: "VOL_50",
        price: 18332.224,
        change: 0.03,
    },
];

const timeframes = ["M1", "M5", "M15", "H1", "H4", "D1"];

export default function ProTraderPage() {
    const [selectedMarket, setSelectedMarket] = useState<WatchItem>(
        markets[0]
    );

    const [search, setSearch] = useState("");
    const [timeframe, setTimeframe] = useState("M1");
    const [mobileWatchlist, setMobileWatchlist] = useState(false);
    const [mobileOrder, setMobileOrder] = useState(false);

    const [user, setUser] = useState<any>(null);
    const [balance, setBalance] = useState(0);

    const [side, setSide] = useState<"BUY" | "SELL">("BUY");
    const [lotSize, setLotSize] = useState("0.01");
    const [takeProfit, setTakeProfit] = useState("");
    const [stopLoss, setStopLoss] = useState("");
    const [placing, setPlacing] = useState(false);

    const [openTrades, setOpenTrades] = useState<Trade[]>([]);

    const {
        ticks,
        candles,
        currentPrice,
        priceChange,
    } = useMarketTicks(selectedMarket.symbol);

    useEffect(() => {
        loadAccount();
    }, []);

    async function loadAccount() {
        const {
            data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!currentUser) return;

        setUser(currentUser);

        const { data: profile } = await supabase
            .from("profiles")
            .select("real_balance, demo_balance")
            .eq("id", currentUser.id)
            .maybeSingle();

        if (profile) {
            setBalance(Number(profile.real_balance ?? 0));
        }

        const { data: trades } = await supabase
            .from("trades")
            .select("*")
            .eq("user_id", currentUser.id)
            .eq("status", "OPEN")
            .order("started_at", { ascending: false });

        if (trades) {
            setOpenTrades(
                trades.map((trade: any) => ({
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
                    durationSeconds: trade.duration_seconds,
                    startTime: new Date(trade.started_at).getTime(),
                    endTime: new Date(trade.ends_at).getTime(),
                    status: trade.status,
                    payout: Number(trade.payout || 0),
                }))
            );
        }
    }

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
        currentPrice || selectedMarket.price;

    const displayChange =
        priceChange !== 0
            ? priceChange
            : selectedMarket.change;

    async function handleOrder(orderSide: "BUY" | "SELL") {
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
         * The current trade backend accepts a monetary stake.
         * We use the lot size as the order stake for now.
         */
        const stake = parsedLot;

        if (stake > balance) {
            toast.error("Insufficient real balance.");
            return;
        }

        if (!currentPrice) {
            toast.error("Waiting for market price...");
            return;
        }

        setSide(orderSide);
        setPlacing(true);

        const result = await createTrade({
            userId: user.id,
            symbol: selectedMarket.symbol,
            direction: orderSide,
            stake,
            entryPrice: currentPrice,
            durationSeconds: 60,
            accountType: "REAL",
        });

        if (!result.success || !result.trade) {
            toast.error(
                result.message || "Unable to place order."
            );
            setPlacing(false);
            return;
        }

        setBalance(
            result.newBalance !== undefined
                ? result.newBalance
                : balance - stake
        );

        const newTrade: Trade = {
            id: result.trade.id,
            userId: user.id,
            userEmail: user.email || "",
            symbol: selectedMarket.symbol,
            direction: orderSide,
            stake,
            entryPrice: currentPrice,
            durationSeconds: 60,
            startTime: new Date(
                result.trade.started_at
            ).getTime(),
            endTime: new Date(
                result.trade.ends_at
            ).getTime(),
            status: "OPEN",
            payout: 0,
        };

        setOpenTrades((previous) => [
            newTrade,
            ...previous,
        ]);

        toast.success(
            `${orderSide} ${selectedMarket.name} order opened`
        );

        setPlacing(false);

        setTimeout(async () => {
            const settleResult = await settleTrade(
                result.trade!.id,
                currentPrice
            );

            if (!settleResult.success) return;

            if (
                settleResult.newBalance !== null &&
                settleResult.newBalance !== undefined
            ) {
                setBalance(Number(settleResult.newBalance));
            }

            setOpenTrades((previous) =>
                previous.map((trade) =>
                    trade.id === result.trade!.id
                        ? {
                            ...trade,
                            status: settleResult.won
                                ? "WON"
                                : "LOST",
                            payout: settleResult.payout ?? 0,
                            exitPrice: currentPrice,
                        }
                        : trade
                )
            );

            if (settleResult.won) {
                toast.success(
                    `Trade won +$${Number(
                        settleResult.payout || 0
                    ).toFixed(2)}`
                );
            } else {
                toast.error("Trade closed at a loss.");
            }
        }, 60000);
    }

    async function signOut() {
        await supabase.auth.signOut();
        window.location.href = "/auth";
    }

    return (
        <main className="min-h-screen bg-[#050908] text-white font-sans overflow-hidden">
            <Toaster position="top-right" />

            {/* DESKTOP SIDEBAR */}
            <aside className="fixed left-0 top-0 bottom-0 z-40 hidden w-[230px] border-r border-white/[0.05] bg-[#050908] lg:flex lg:flex-col">
                <div className="flex h-[58px] items-center border-b border-white/[0.05] px-5">
                    <Link
                        href="/"
                        className="flex items-center gap-3"
                    >
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500">
                            <span className="text-[10px] font-black text-black">
                                FX
                            </span>
                        </div>

                        <span className="text-[16px] font-black">
                            FX<span className="text-emerald-400">Trades</span>
                        </span>
                    </Link>
                </div>

                <div className="border-b border-white/[0.05] px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-black">
                            {user?.email?.charAt(0).toUpperCase() || "E"}
                        </div>

                        <div>
                            <p className="text-xs font-bold">
                                {user?.user_metadata?.full_name ||
                                    "Eugene Mwanga"}
                            </p>

                            <span className="text-[8px] text-neutral-500">
                                TRADER
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-4">
                    <SidebarSection title="OVERVIEW" />

                    <SidebarItem
                        href="/"
                        icon={<LayoutDashboard size={16} />}
                        label="Dashboard"
                    />

                    <SidebarSection title="TRADING" />

                    <SidebarItem
                        href="/trade"
                        icon={<CandlestickChart size={16} />}
                        label="Candle Trade"
                        badge="🔥 HOT"
                    />

                    <SidebarItem
                        href="/pro-trader"
                        icon={<BarChart3 size={16} />}
                        label="Pro Trader"
                        active
                    />

                    <SidebarItem
                        href="/trade"
                        icon={<Clock3 size={16} />}
                        label="Trade History"
                    />

                    <SidebarItem
                        href="/trade"
                        icon={<Bell size={16} />}
                        label="Price Alerts"
                    />

                    <SidebarSection title="FUNDS" />

                    <SidebarItem
                        href="/wallet"
                        icon={<Wallet size={16} />}
                        label="Wallet"
                    />

                    <div className="my-3 border-t border-white/[0.05]" />

                    <SidebarItem
                        href="/profile"
                        icon={<UserRound size={16} />}
                        label="Profile"
                    />

                    <SidebarItem
                        href="/profile"
                        icon={<Settings size={16} />}
                        label="Settings"
                    />

                    <button
                        onClick={signOut}
                        className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-neutral-400 hover:bg-white/[0.03] hover:text-white"
                    >
                        <LogOut size={16} />
                        Sign out
                    </button>
                </div>
            </aside>

            {/* MAIN */}
            <div className="lg:pl-[230px]">
                {/* TOP BAR */}
                <header className="flex h-[58px] items-center justify-between border-b border-white/[0.05] bg-[#070c0a] px-4 sm:px-5">
                    <div className="flex items-center gap-3 lg:hidden">
                        <Link href="/">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500">
                                <span className="text-[9px] font-black text-black">
                                    FX
                                </span>
                            </div>
                        </Link>

                        <button
                            onClick={() =>
                                setMobileWatchlist(true)
                            }
                            className="text-neutral-400"
                        >
                            <Menu size={19} />
                        </button>
                    </div>

                    <div className="hidden lg:block" />

                    <div className="flex items-center gap-2">
                        <Link
                            href="/wallet"
                            className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-[#0d1411] px-3 py-2 text-[11px] font-bold"
                        >
                            <Wallet
                                size={13}
                                className="text-neutral-500"
                            />

                            KES{" "}
                            {balance.toLocaleString("en-KE", {
                                minimumFractionDigits: 2,
                            })}
                        </Link>

                        <button className="relative hidden h-8 w-8 items-center justify-center text-neutral-400 sm:flex">
                            <Bell size={17} />

                            <span className="absolute right-0 top-0 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[7px] font-black text-black">
                                1
                            </span>
                        </button>

                        <Link
                            href="/profile"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-black"
                        >
                            {user?.email?.charAt(0).toUpperCase() ||
                                "E"}
                        </Link>
                    </div>
                </header>

                {/* TERMINAL */}
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
                                        <span className="text-sm font-black">
                                            Markets
                                        </span>

                                        <button
                                            onClick={() =>
                                                setMobileWatchlist(false)
                                            }
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                )}

                                {/* SEARCH */}
                                <div className="border-b border-white/[0.05] p-3">
                                    <div className="flex items-center gap-2 rounded-xl bg-[#101714] px-3 py-2">
                                        <Search
                                            size={14}
                                            className="text-neutral-600"
                                        />

                                        <input
                                            value={search}
                                            onChange={(event) =>
                                                setSearch(event.target.value)
                                            }
                                            placeholder="Search..."
                                            className="w-full bg-transparent text-[11px] text-white outline-none placeholder:text-neutral-600"
                                        />
                                    </div>
                                </div>

                                {/* MARKETS */}
                                <div className="flex-1 overflow-y-auto">
                                    {filteredMarkets.map(
                                        (market, index) => {
                                            const active =
                                                market.name ===
                                                selectedMarket.name;

                                            return (
                                                <button
                                                    key={`${market.name}-${index}`}
                                                    onClick={() => {
                                                        setSelectedMarket(market);
                                                        setMobileWatchlist(false);
                                                    }}
                                                    className={`group flex w-full items-center justify-between border-b border-white/[0.025] px-3 py-2.5 text-left transition ${active
                                                        ? "bg-[#111b17]"
                                                        : "hover:bg-white/[0.025]"
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
                                                            {market.price.toFixed(
                                                                market.price < 10
                                                                    ? 5
                                                                    : 3
                                                            )}
                                                        </p>

                                                        <p
                                                            className={`text-[8px] font-bold ${market.change >= 0
                                                                ? "text-emerald-500"
                                                                : "text-rose-500"
                                                                }`}
                                                        >
                                                            {market.change >= 0
                                                                ? "+"
                                                                : ""}
                                                            {market.change.toFixed(2)}%
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        }
                                    )}
                                </div>
                            </div>
                        </aside>

                        {/* CENTER */}
                        <div className="min-w-0 bg-[#080d0b]">
                            {/* MARKET HEADER */}
                            <div className="flex h-[43px] items-center justify-between border-b border-white/[0.05] px-3">
                                <div className="flex min-w-0 items-center gap-2">
                                    <span className="truncate text-xs font-black">
                                        {selectedMarket.name}
                                    </span>

                                    <span className="hidden text-[10px] text-neutral-600 sm:inline">
                                        {selectedMarket.category}
                                    </span>

                                    <span className="font-mono text-xs font-black">
                                        {displayPrice.toFixed(2)}
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

                                {/* TIMEFRAMES */}
                                <div className="flex items-center gap-0.5">
                                    {timeframes.map((frame) => (
                                        <button
                                            key={frame}
                                            onClick={() =>
                                                setTimeframe(frame)
                                            }
                                            className={`rounded px-2 py-1 text-[9px] font-bold transition ${timeframe === frame
                                                ? "bg-emerald-500 text-black"
                                                : "text-neutral-500 hover:bg-white/[0.04] hover:text-white"
                                                }`}
                                        >
                                            {frame}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* CHART */}
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

                        {/* ORDER PANEL */}
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
                            />
                        </aside>
                    </div>
                </section>
            </div>

            {/* MOBILE ORDER BUTTON */}
            <div className="fixed bottom-[68px] left-0 right-0 z-30 grid grid-cols-2 gap-2 border-t border-white/[0.05] bg-[#070c0a]/95 p-2 backdrop-blur lg:hidden">
                <button
                    onClick={() => handleOrder("SELL")}
                    disabled={placing}
                    className="rounded-xl bg-rose-500/10 py-3 text-xs font-black text-rose-400 border border-rose-500/20"
                >
                    SELL {displayPrice.toFixed(2)}
                </button>

                <button
                    onClick={() => handleOrder("BUY")}
                    disabled={placing}
                    className="rounded-xl bg-emerald-500 py-3 text-xs font-black text-black"
                >
                    BUY {displayPrice.toFixed(2)}
                </button>
            </div>

            {/* MOBILE BOTTOM NAV */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.05] bg-[#070c0a]/95 backdrop-blur-xl lg:hidden">
                <div className="grid h-[68px] grid-cols-4">
                    <BottomItem
                        href="/"
                        icon={<Home size={18} />}
                        label="HOME"
                    />

                    <BottomItem
                        href="/trade"
                        icon={<BarChart3 size={18} />}
                        label="TRADE"
                        active
                    />

                    <BottomItem
                        href="/wallet"
                        icon={<Wallet size={18} />}
                        label="WALLET"
                    />

                    <BottomItem
                        href="/profile"
                        icon={<UserRound size={18} />}
                        label="PROFILE"
                    />
                </div>
            </nav>
        </main>
    );
}

/* ---------------- ORDER PANEL ---------------- */

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
}) {
    const buyPrice = price + 0.0005;
    const sellPrice = price - 0.0005;

    function decreaseLot() {
        const value = Math.max(
            0.01,
            Number(lotSize) - 0.01
        );

        setLotSize(value.toFixed(2));
    }

    function increaseLot() {
        const value = Number(lotSize) + 0.01;
        setLotSize(value.toFixed(2));
    }

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
                <span className="text-xs font-black">
                    New Order
                </span>

                <Link
                    href="/wallet"
                    className="text-[9px] font-bold text-emerald-400 hover:text-emerald-300"
                >
                    Deposit funds →
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
                {/* SIDE */}
                <div className="grid grid-cols-2 gap-1.5">
                    <button
                        onClick={() => setSide("SELL")}
                        className={`rounded-xl border py-3 ${side === "SELL"
                            ? "border-rose-500/30 bg-rose-500/10"
                            : "border-white/[0.05] bg-[#0d1411]"
                            }`}
                    >
                        <span className="block text-[8px] text-neutral-500">
                            SELL
                        </span>

                        <span className="mt-1 block font-mono text-xs font-black text-rose-400">
                            {sellPrice.toFixed(5)}
                        </span>
                    </button>

                    <button
                        onClick={() => setSide("BUY")}
                        className={`rounded-xl border py-3 ${side === "BUY"
                            ? "border-emerald-500/30 bg-emerald-500/10"
                            : "border-white/[0.05] bg-[#0d1411]"
                            }`}
                    >
                        <span className="block text-[8px] text-neutral-500">
                            BUY
                        </span>

                        <span className="mt-1 block font-mono text-xs font-black text-emerald-400">
                            {buyPrice.toFixed(5)}
                        </span>
                    </button>
                </div>

                {/* LOT SIZE */}
                <div className="mt-5">
                    <label className="mb-2 block text-[9px] text-neutral-500">
                        Lot size
                    </label>

                    <div className="grid grid-cols-[34px_1fr_34px] gap-1.5">
                        <button
                            onClick={decreaseLot}
                            className="rounded-lg border border-white/[0.05] bg-[#0d1411] text-neutral-300 hover:bg-white/[0.04]"
                        >
                            −
                        </button>

                        <input
                            value={lotSize}
                            onChange={(event) =>
                                setLotSize(event.target.value)
                            }
                            className="w-full rounded-lg border border-white/[0.05] bg-[#0d1411] px-3 text-center font-mono text-xs font-bold outline-none focus:border-emerald-500/40"
                        />

                        <button
                            onClick={increaseLot}
                            className="rounded-lg border border-white/[0.05] bg-[#0d1411] text-neutral-300 hover:bg-white/[0.04]"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* TP / SL */}
                <div className="mt-5 grid grid-cols-2 gap-2">
                    <div>
                        <label className="mb-2 block text-[9px] text-neutral-500">
                            Take Profit
                        </label>

                        <input
                            value={takeProfit}
                            onChange={(event) =>
                                setTakeProfit(event.target.value)
                            }
                            placeholder="optional"
                            className="w-full rounded-lg border border-white/[0.05] bg-[#0d1411] px-3 py-2.5 font-mono text-[10px] outline-none placeholder:text-neutral-700 focus:border-emerald-500/40"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-[9px] text-neutral-500">
                            Stop Loss
                        </label>

                        <input
                            value={stopLoss}
                            onChange={(event) =>
                                setStopLoss(event.target.value)
                            }
                            placeholder="optional"
                            className="w-full rounded-lg border border-white/[0.05] bg-[#0d1411] px-3 py-2.5 font-mono text-[10px] outline-none placeholder:text-neutral-700 focus:border-emerald-500/40"
                        />
                    </div>
                </div>

                {/* BALANCE */}
                <div className="mt-5 flex items-center justify-between border-t border-white/[0.05] pt-4">
                    <span className="text-[9px] text-neutral-600">
                        Available
                    </span>

                    <span className="font-mono text-[10px] font-bold text-neutral-300">
                        KES{" "}
                        {balance.toLocaleString("en-KE", {
                            minimumFractionDigits: 2,
                        })}
                    </span>
                </div>

                {/* ORDER BUTTON */}
                <button
                    onClick={() => onOrder(side)}
                    disabled={placing}
                    className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${side === "BUY"
                        ? "bg-emerald-500 text-black hover:bg-emerald-400"
                        : "bg-rose-500 text-white hover:bg-rose-400"
                        }`}
                >
                    <BarChart3 size={16} />

                    {placing
                        ? "PLACING ORDER..."
                        : `${side} ${selectedMarket.name}`}
                </button>
            </div>

            {/* BOTTOM POSITION AREA */}
            <div className="border-t border-white/[0.05] p-3">
                <div className="mb-3 flex items-center gap-4">
                    <button className="border-b border-emerald-500 pb-2 text-[10px] font-bold text-emerald-400">
                        Open
                    </button>

                    <button className="pb-2 text-[10px] text-neutral-600">
                        Closed
                    </button>
                </div>

                <p className="text-center text-[9px] text-neutral-600">
                    Open positions will appear here.
                </p>
            </div>
        </div>
    );
}

/* ---------------- SIDEBAR ---------------- */

function SidebarSection({
    title,
}: {
    title: string;
}) {
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
            <span
                className={
                    active
                        ? "text-emerald-400"
                        : "text-neutral-500"
                }
            >
                {icon}
            </span>

            <span>{label}</span>

            {badge && (
                <span className="text-[8px] text-orange-400">
                    {badge}
                </span>
            )}
        </Link>
    );
}

/* ---------------- MOBILE NAV ---------------- */

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
            className={`flex flex-col items-center justify-center gap-1 ${active
                ? "text-emerald-400"
                : "text-neutral-600"
                }`}
        >
            {icon}

            <span className="text-[8px] font-black tracking-wider">
                {label}
            </span>
        </Link>
    );
}