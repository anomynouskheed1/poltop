// src/app/actions/admin.ts
"use server";

import { createClient } from "@supabase/supabase-js";
import { evaluateTradeOutcome } from "@/lib/trading/settlement";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getSystemMetrics() {
    try {
        // Fetch all open trades
        const { data: openTrades, error: openError } = await supabase
            .from("trades")
            .select("*")
            .eq("status", "OPEN");

        if (openError) throw openError;

        // Fetch settled trades stats
        const { data: settledTrades, error: settledError } = await supabase
            .from("trades")
            .select("stake, payout, status")
            .neq("status", "OPEN");

        if (settledError) throw settledError;

        // Calculate total exposure (Active stakes)
        const totalExposure = (openTrades || []).reduce((acc, t) => acc + Number(t.stake), 0);
        const buyExposure = (openTrades || [])
            .filter((t) => t.direction === "BUY" || t.direction === "RISE")
            .reduce((acc, t) => acc + Number(t.stake), 0);
        const sellExposure = (openTrades || [])
            .filter((t) => t.direction === "SELL" || t.direction === "FALL")
            .reduce((acc, t) => acc + Number(t.stake), 0);

        // House P&L metrics
        const totalVolume = (settledTrades || []).reduce((acc, t) => acc + Number(t.stake), 0);
        const totalPayouts = (settledTrades || []).reduce((acc, t) => acc + Number(t.payout), 0);
        const houseProfit = totalVolume - totalPayouts;

        return {
            success: true,
            openTradesCount: openTrades?.length || 0,
            totalExposure,
            buyExposure,
            sellExposure,
            totalVolume,
            houseProfit,
            openTradesList: openTrades || [],
        };
    } catch (err: any) {
        return { success: false, message: err.message || "Failed to fetch admin metrics." };
    }
}

export async function updateSystemSettings(settings: {
    defaultPayoutRate: number;
    maxStakePerTrade: number;
    tradingEnabled: boolean;
}) {
    try {
        const { error } = await supabase
            .from("system_settings")
            .update({
                default_payout_rate: settings.defaultPayoutRate,
                max_stake_per_trade: settings.maxStakePerTrade,
                trading_enabled: settings.tradingEnabled,
                updated_at: new Date().toISOString(),
            })
            .eq("id", 1);

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        return { success: false, message: err.message || "Failed to update settings." };
    }
}

export async function forceSettleTrade(tradeId: string, exitPrice: number) {
    try {
        const { data: trade, error: fetchError } = await supabase
            .from("trades")
            .select("*")
            .eq("id", tradeId)
            .single();

        if (fetchError || !trade) return { success: false, message: "Trade not found." };
        if (trade.status !== "OPEN") return { success: false, message: "Trade already closed." };

        const { won, payout } = evaluateTradeOutcome(
            trade.direction,
            Number(trade.stake),
            Number(trade.entry_price),
            exitPrice
        );

        if (won && payout > 0) {
            await supabase.rpc("update_user_balance", {
                p_user_id: trade.user_id,
                p_amount: payout,
                p_account_type: trade.account_type,
            });
        }

        const { error: updateError } = await supabase
            .from("trades")
            .update({
                exit_price: exitPrice,
                status: won ? "WON" : "LOST",
                payout,
            })
            .eq("id", tradeId);

        if (updateError) throw updateError;

        return { success: true, won, payout };
    } catch (err: any) {
        return { success: false, message: err.message || "Force settlement failed." };
    }
}