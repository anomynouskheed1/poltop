// src/components/TradeHistory.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

interface TradeRecord {
    id: string;
    symbol: string;
    direction: string;
    stake: number;
    entry_price: number;
    exit_price?: number;
    status: "OPEN" | "WON" | "LOST";
    payout: number;
    started_at: string;
    ends_at: string;
}

interface TradeHistoryProps {
    userId: string;
    refreshTrigger?: number;
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TradeHistory({ userId, refreshTrigger }: TradeHistoryProps) {
    const [activeTab, setActiveTab] = useState<"OPEN" | "HISTORY">("OPEN");
    const [trades, setTrades] = useState<TradeRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchTradeHistory = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("trades")
            .select("*")
            .eq("user_id", userId)
            .order("started_at", { ascending: false })
            .limit(30);

        if (!error && data) {
            setTrades(data as TradeRecord[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (userId) {
            fetchTradeHistory();
        }
    }, [userId, refreshTrigger]);

    const filteredTrades = trades.filter((t) =>
        activeTab === "OPEN" ? t.status === "OPEN" : t.status !== "OPEN"
    );

    return (
        <div className="bg-brand-card border border-neutral-800 rounded p-4 text-white font-sans">
            {/* Tab Switcher */}
            <div className="flex border-b border-neutral-800 mb-4 gap-4">
                <button
                    onClick={() => setActiveTab("OPEN")}
                    className={`pb-2 text-sm font-semibold transition-colors ${activeTab === "OPEN"
                            ? "border-b-2 border-emerald-500 text-emerald-400"
                            : "text-neutral-400 hover:text-white"
                        }`}
                >
                    Open Positions ({trades.filter((t) => t.status === "OPEN").length})
                </button>
                <button
                    onClick={() => setActiveTab("HISTORY")}
                    className={`pb-2 text-sm font-semibold transition-colors ${activeTab === "HISTORY"
                            ? "border-b-2 border-emerald-500 text-emerald-400"
                            : "text-neutral-400 hover:text-white"
                        }`}
                >
                    Trade History
                </button>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="py-6 text-center text-xs text-neutral-400 font-mono">
                        Loading positions...
                    </div>
                ) : filteredTrades.length === 0 ? (
                    <div className="py-6 text-center text-xs text-neutral-500 font-mono">
                        No {activeTab.toLowerCase()} trades found.
                    </div>
                ) : (
                    <table className="w-full text-left font-mono text-xs">
                        <thead className="bg-neutral-900 text-neutral-400 border-b border-neutral-800">
                            <tr>
                                <th className="p-2.5">SYMBOL</th>
                                <th className="p-2.5">TYPE</th>
                                <th className="p-2.5">STAKE</th>
                                <th className="p-2.5">ENTRY</th>
                                <th className="p-2.5">EXIT</th>
                                <th className="p-2.5">OUTCOME</th>
                                <th className="p-2.5">TIME</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTrades.map((trade) => (
                                <tr
                                    key={trade.id}
                                    className="border-b border-neutral-800/60 hover:bg-neutral-900/50 transition-colors"
                                >
                                    <td className="p-2.5 font-bold text-white">{trade.symbol}</td>
                                    <td
                                        className={`p-2.5 font-bold ${trade.direction === "BUY" || trade.direction === "RISE"
                                                ? "text-emerald-400"
                                                : "text-rose-400"
                                            }`}
                                    >
                                        {trade.direction}
                                    </td>
                                    <td className="p-2.5">${Number(trade.stake).toFixed(2)}</td>
                                    <td className="p-2.5">{Number(trade.entry_price).toFixed(2)}</td>
                                    <td className="p-2.5">
                                        {trade.exit_price ? Number(trade.exit_price).toFixed(2) : "--"}
                                    </td>
                                    <td className="p-2.5">
                                        {trade.status === "OPEN" ? (
                                            <span className="text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded text-[10px]">
                                                RUNNING
                                            </span>
                                        ) : trade.status === "WON" ? (
                                            <span className="text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded text-[10px] font-bold">
                                                +${Number(trade.payout).toFixed(2)}
                                            </span>
                                        ) : (
                                            <span className="text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded text-[10px]">
                                                LOST
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-2.5 text-neutral-400 text-[10px]">
                                        {new Date(trade.started_at).toLocaleTimeString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}