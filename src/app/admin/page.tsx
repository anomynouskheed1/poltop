// src/app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getSystemMetrics, updateSystemSettings, forceSettleTrade } from "@/app/actions/admin";

export default function AdminDashboardPage() {
    const [metrics, setMetrics] = useState<any>(null);
    const [payoutRate, setPayoutRate] = useState<number>(0.95);
    const [maxStake, setMaxStake] = useState<number>(1000);
    const [tradingEnabled, setTradingEnabled] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchMetrics = async () => {
        const res = await getSystemMetrics();
        if (res.success) {
            setMetrics(res);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 3000); // Live sync every 3s
        return () => clearInterval(interval);
    }, []);

    const handleSaveSettings = async () => {
        const res = await updateSystemSettings({
            defaultPayoutRate: payoutRate,
            maxStakePerTrade: maxStake,
            tradingEnabled,
        });
        if (res.success) alert("System settings updated successfully!");
        else alert("Error: " + res.message);
    };

    const handleForceClose = async (tradeId: string, currentEntryPrice: number) => {
        const exitPriceStr = prompt("Enter exit price for forced settlement:", currentEntryPrice.toString());
        if (!exitPriceStr) return;

        const res = await forceSettleTrade(tradeId, Number(exitPriceStr));
        if (res.success) {
            alert(`Trade ${tradeId} forcibly settled as ${res.won ? "WON" : "LOST"}.`);
            fetchMetrics();
        } else {
            alert("Error: " + res.message);
        }
    };

    if (loading) {
        return <div className="p-8 text-white font-mono">Loading Admin Panel...</div>;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 text-white font-sans">
            <h1 className="text-2xl font-bold border-b border-neutral-800 pb-4">
                Platform Risk & Control Dashboard
            </h1>

            {/* Overview Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-neutral-900 border border-neutral-800 p-4 rounded">
                    <span className="text-xs text-neutral-400 block">TOTAL ACTIVE EXPOSURE</span>
                    <span className="text-2xl font-bold font-mono text-amber-400">
                        ${metrics?.totalExposure?.toFixed(2) || "0.00"}
                    </span>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 p-4 rounded">
                    <span className="text-xs text-neutral-400 block">BUY / SELL BIAS</span>
                    <div className="text-sm font-mono mt-1 flex justify-between">
                        <span className="text-emerald-400">BUY: ${metrics?.buyExposure?.toFixed(2)}</span>
                        <span className="text-rose-400">SELL: ${metrics?.sellExposure?.toFixed(2)}</span>
                    </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 p-4 rounded">
                    <span className="text-xs text-neutral-400 block">NET HOUSE PROFIT</span>
                    <span
                        className={`text-2xl font-bold font-mono ${(metrics?.houseProfit || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                            }`}
                    >
                        ${metrics?.houseProfit?.toFixed(2) || "0.00"}
                    </span>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 p-4 rounded">
                    <span className="text-xs text-neutral-400 block">ACTIVE POSITIONS</span>
                    <span className="text-2xl font-bold font-mono text-white">
                        {metrics?.openTradesCount || 0}
                    </span>
                </div>
            </div>

            {/* Risk & Global Controls */}
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded flex flex-col gap-4">
                <h2 className="text-lg font-bold text-neutral-200">Global Risk Parameters</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs text-neutral-400 block mb-1">PAYOUT MULTIPLIER (e.g. 0.95)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={payoutRate}
                            onChange={(e) => setPayoutRate(Number(e.target.value))}
                            className="w-full bg-neutral-950 border border-neutral-800 p-2 rounded text-white font-mono"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-neutral-400 block mb-1">MAX STAKE PER TRADE ($)</label>
                        <input
                            type="number"
                            value={maxStake}
                            onChange={(e) => setMaxStake(Number(e.target.value))}
                            className="w-full bg-neutral-950 border border-neutral-800 p-2 rounded text-white font-mono"
                        />
                    </div>

                    <div className="flex items-end gap-4">
                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                            <input
                                type="checkbox"
                                checked={tradingEnabled}
                                onChange={(e) => setTradingEnabled(e.target.checked)}
                                className="w-4 h-4"
                            />
                            <span className="text-sm font-semibold">Enable Trading Platform</span>
                        </label>
                        <button
                            onClick={handleSaveSettings}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded text-sm mb-1"
                        >
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>

            {/* Active Trades Table */}
            <div className="bg-neutral-900 border border-neutral-800 rounded p-4">
                <h2 className="text-lg font-bold mb-3 text-neutral-200">Live Active Positions</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-sm">
                        <thead className="bg-neutral-950 text-neutral-400 text-xs border-b border-neutral-800">
                            <tr>
                                <th className="p-2">USER ID</th>
                                <th className="p-2">SYMBOL</th>
                                <th className="p-2">DIRECTION</th>
                                <th className="p-2">STAKE</th>
                                <th className="p-2">ENTRY PRICE</th>
                                <th className="p-2">ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {metrics?.openTradesList?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-4 text-center text-neutral-500">
                                        No active positions running currently.
                                    </td>
                                </tr>
                            ) : (
                                metrics?.openTradesList?.map((trade: any) => (
                                    <tr key={trade.id} className="border-b border-neutral-800 hover:bg-neutral-950">
                                        <td className="p-2 text-xs truncate max-w-[100px]">{trade.user_id}</td>
                                        <td className="p-2">{trade.symbol}</td>
                                        <td
                                            className={`p-2 font-bold ${trade.direction === "BUY" ? "text-emerald-400" : "text-rose-400"
                                                }`}
                                        >
                                            {trade.direction}
                                        </td>
                                        <td className="p-2">${Number(trade.stake).toFixed(2)}</td>
                                        <td className="p-2">{Number(trade.entry_price).toFixed(2)}</td>
                                        <td className="p-2">
                                            <button
                                                onClick={() => handleForceClose(trade.id, Number(trade.entry_price))}
                                                className="bg-rose-600/80 hover:bg-rose-600 text-xs px-2 py-1 rounded text-white"
                                            >
                                                Force Settle
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}