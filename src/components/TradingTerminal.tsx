// src/components/TradingTerminal.tsx
"use client";

import { useState } from "react";
import TradingChart from "./TradingChart";
import UserSidebar from "@/components/UserSidebar";
import { createTrade, settleTrade } from "@/app/actions/trade";
import { useWebSocketTicks } from "@/lib/ticks/useWebSocketTicks";
import { MarketSymbol, Trade } from "@/types/trading";

// --- Lightweight SVG Icons (No external package needed) ---
const IconMenu = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

const IconPlus = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const IconTrade = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const IconMarkets = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const IconPositions = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
);

const IconWallet = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const IconUser = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

interface TradeNotification {
    id: string;
    type: "WIN" | "LOSS";
    amount: number;
    payout: number;
    symbol: string;
}

interface TradingTerminalProps {
    userId?: string;
    userEmail?: string;
    initialDemoBalance?: number;
    initialRealBalance?: number;
}

export default function TradingTerminal({
    userId = "user_demo",
    userEmail = "trader@example.com",
    initialDemoBalance = 100000,
    initialRealBalance = 0,
}: TradingTerminalProps) {
    const [symbol, setSymbol] = useState<MarketSymbol>("R_100" as MarketSymbol);
    const [stake, setStake] = useState<number>(300);
    const [duration] = useState<number>(10);
    const [timeframe, setTimeframe] = useState<string>("1m");
    const [activeTab, setActiveTab] = useState<string>("trade");
    const [activeTrades, setActiveTrades] = useState<Trade[]>([]);
    const [notification, setNotification] = useState<TradeNotification | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [accountType, setAccountType] = useState<"DEMO" | "REAL">("DEMO");
    const [demoBalance, setDemoBalance] = useState<number>(initialDemoBalance);
    const [realBalance, setRealBalance] = useState<number>(initialRealBalance);

    // REAL LIVE DATA FROM WEBSOCKET STREAM
    const { currentPrice, ticks, isConnected } = useWebSocketTicks(symbol);

    const activeBalance = accountType === "DEMO" ? demoBalance : realBalance;

    const handleExecuteTrade = async (direction: "BUY" | "SELL") => {
        if (!currentPrice) {
            alert("Waiting for live market tick...");
            return;
        }

        if (activeBalance < stake) {
            alert("Insufficient balance!");
            return;
        }

        setIsSubmitting(true);

        const res = await createTrade({
            userId,
            symbol,
            direction,
            stake,
            entryPrice: currentPrice,
            durationSeconds: duration,
            accountType,
        });

        setIsSubmitting(false);

        if (!res.success || !res.trade) {
            alert(res.message || "Failed to place trade.");
            return;
        }

        if (res.newBalance !== undefined && res.newBalance !== null) {
            if (accountType === "DEMO") setDemoBalance(res.newBalance);
            else setRealBalance(res.newBalance);
        }

        const newTrade: Trade = {
            id: res.trade.id,
            symbol: res.trade.symbol as MarketSymbol,
            direction: res.trade.direction,
            entryPrice: Number(res.trade.entry_price),
            stake: Number(res.trade.stake),
            status: res.trade.status || "OPEN",
        } as Trade;

        setActiveTrades((prev) => [...prev, newTrade]);

        setTimeout(async () => {
            const exitPrice = currentPrice;
            const settlementRes = await settleTrade(newTrade.id, exitPrice);

            if (settlementRes.success) {
                if (settlementRes.newBalance !== null && settlementRes.newBalance !== undefined) {
                    if (accountType === "DEMO") setDemoBalance(settlementRes.newBalance);
                    else setRealBalance(settlementRes.newBalance);
                }

                setNotification({
                    id: newTrade.id,
                    type: settlementRes.won ? "WIN" : "LOSS",
                    amount: stake,
                    payout: settlementRes.won ? settlementRes.payout : 0,
                    symbol: symbol,
                });

                setActiveTrades((prev) => prev.filter((t) => t.id !== newTrade.id));

                setTimeout(() => setNotification(null), 4000);
            }
        }, duration * 1000);
    };

    return (
        <div className="flex flex-col h-screen w-full bg-[#070a0f] text-slate-100 font-sans overflow-hidden select-none">
            {/* Floating Trade Notification */}
            {notification && (
                <div className="absolute top-16 left-4 right-4 z-50 animate-bounce">
                    <div
                        className={`flex items-center justify-between p-3.5 rounded-xl border shadow-2xl backdrop-blur-md ${notification.type === "WIN"
                                ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-300"
                                : "bg-rose-950/90 border-rose-500/50 text-rose-300"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{notification.type === "WIN" ? "🎉" : "❌"}</span>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider">
                                    Trade Result: {notification.type}
                                </p>
                                <p className="text-sm font-semibold">
                                    {notification.type === "WIN"
                                        ? `+$${notification.payout.toFixed(2)}`
                                        : `-$${notification.amount.toFixed(2)}`}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setNotification(null)}
                            className="text-xs opacity-70 hover:opacity-100 px-2 py-1"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="flex items-center justify-between px-4 py-2.5 bg-[#0b0f19] border-b border-[#1a2332]">
                <div className="flex items-center gap-3">
                    <button className="text-slate-400 hover:text-white">
                        <IconMenu />
                    </button>
                    <span className="font-bold text-sm tracking-wide text-white">
                        ventitrading
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span
                        className={`h-2.5 w-2.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                            }`}
                        title={isConnected ? "WebSocket Live" : "Connecting..."}
                    />

                    <UserSidebar
                        user={{ id: userId, email: userEmail }}
                        demoBalance={demoBalance}
                        realBalance={realBalance}
                        accountType={accountType}
                        onAccountTypeChange={(type) => setAccountType(type)}
                    />

                    <button className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg flex items-center justify-center">
                        <IconPlus />
                    </button>
                </div>
            </header>

            {/* Asset Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#070a0f] border-b border-[#161f2e]">
                <select
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value as MarketSymbol)}
                    className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer"
                >
                    <option value="R_100" className="bg-[#121824]">VOLATILITY 100 INDEX</option>
                    <option value="R_75" className="bg-[#121824]">VOLATILITY 75 INDEX</option>
                    <option value="R_50" className="bg-[#121824]">VOLATILITY 50 INDEX</option>
                    <option value="1HZ10V" className="bg-[#121824]">VOLATILITY 10 (1S) INDEX</option>
                </select>
                <div className="text-right">
                    <span className="text-base font-mono font-bold text-emerald-400">
                        {currentPrice ? currentPrice.toFixed(2) : "0.00"}
                    </span>
                </div>
            </div>

            {/* Timeframe Selectors */}
            <div className="flex items-center gap-2 px-4 py-1.5 bg-[#070a0f] border-b border-[#161f2e] text-xs font-mono text-slate-400">
                {["5s", "15s", "1m", "5m", "15m"].map((tf) => (
                    <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-2 py-0.5 rounded ${timeframe === tf
                                ? "bg-[#1a2332] text-white font-bold"
                                : "hover:text-slate-200"
                            }`}
                    >
                        {tf}
                    </button>
                ))}
            </div>

            {/* Chart Viewport */}
            <div className="flex-1 w-full relative min-h-0">
                <TradingChart
                    symbol={symbol}
                    currentPrice={currentPrice}
                    ticks={ticks}
                    activeTrades={activeTrades}
                />
            </div>

            {/* Stake & Execution Controls */}
            <div className="p-3 bg-[#0b0f19] border-t border-[#1a2332] flex flex-col gap-2">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>STAKE</span>
                        <span>⏱ {duration}s expiry</span>
                    </div>

                    <div className="flex items-center bg-[#121824] border border-[#1a2332] rounded-lg overflow-hidden">
                        <button
                            onClick={() => setStake((prev) => Math.max(10, prev - 50))}
                            className="px-3 py-2 text-slate-400 hover:text-white bg-[#161f2e]"
                        >
                            -
                        </button>
                        <div className="flex-1 text-center font-mono font-bold text-sm text-white">
                            KSh {stake}
                        </div>
                        <button
                            onClick={() => setStake((prev) => prev + 50)}
                            className="px-3 py-2 text-slate-400 hover:text-white bg-[#161f2e]"
                        >
                            +
                        </button>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
                        {[100, 500, 1000, 5000].map((amount) => (
                            <button
                                key={amount}
                                onClick={() => setStake(amount)}
                                className={`py-1 rounded border transition-colors ${stake === amount
                                        ? "bg-[#1a2332] border-sky-500 text-white font-bold"
                                        : "bg-[#121824] border-[#1a2332] text-slate-400 hover:bg-[#161f2e]"
                                    }`}
                            >
                                {amount.toLocaleString()}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                        disabled={isSubmitting}
                        onClick={() => handleExecuteTrade("BUY")}
                        className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-1 shadow-lg active:scale-95 transition-transform disabled:opacity-50"
                    >
                        ↑ Buy
                    </button>
                    <button
                        disabled={isSubmitting}
                        onClick={() => handleExecuteTrade("SELL")}
                        className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-1 shadow-lg active:scale-95 transition-transform disabled:opacity-50"
                    >
                        ↓ Sell
                    </button>
                </div>
            </div>

            {/* Bottom Navigation Bar */}
            <nav className="flex items-center justify-around bg-[#070a0f] border-t border-[#161f2e] py-2 text-[10px] text-slate-400">
                <button
                    onClick={() => setActiveTab("trade")}
                    className={`flex flex-col items-center gap-0.5 ${activeTab === "trade" ? "text-emerald-400 font-bold" : ""
                        }`}
                >
                    <IconTrade />
                    <span>Trade</span>
                </button>
                <button
                    onClick={() => setActiveTab("markets")}
                    className={`flex flex-col items-center gap-0.5 ${activeTab === "markets" ? "text-emerald-400 font-bold" : ""
                        }`}
                >
                    <IconMarkets />
                    <span>Markets</span>
                </button>
                <button
                    onClick={() => setActiveTab("positions")}
                    className={`flex flex-col items-center gap-0.5 ${activeTab === "positions" ? "text-emerald-400 font-bold" : ""
                        }`}
                >
                    <IconPositions />
                    <span>Positions</span>
                </button>
                <button
                    onClick={() => setActiveTab("wallet")}
                    className={`flex flex-col items-center gap-0.5 ${activeTab === "wallet" ? "text-emerald-400 font-bold" : ""
                        }`}
                >
                    <IconWallet />
                    <span>Wallet</span>
                </button>
                <button
                    onClick={() => setActiveTab("profile")}
                    className={`flex flex-col items-center gap-0.5 ${activeTab === "profile" ? "text-emerald-400 font-bold" : ""
                        }`}
                >
                    <IconUser />
                    <span>Profile</span>
                </button>
            </nav>
        </div>
    );
}