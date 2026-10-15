// src/app/actions/trade.ts
"use server";

import { createClient } from "@supabase/supabase-js";
import { evaluateTradeOutcome } from "@/lib/trading/settlement";
import { CreateTradeParams } from "@/types/trading";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createTrade(params: CreateTradeParams) {
    try {
        const {
            userId,
            symbol,
            direction,
            stake,
            entryPrice,
            durationSeconds,
            accountType,
        } = params;

        // Basic validation
        if (!userId) {
            return {
                success: false,
                message: "User session not found.",
            };
        }

        if (!symbol || !direction) {
            return {
                success: false,
                message: "Invalid trade parameters.",
            };
        }

        if (!Number.isFinite(Number(stake)) || Number(stake) <= 0) {
            return {
                success: false,
                message: "Invalid trade stake.",
            };
        }

        if (
            !Number.isFinite(Number(entryPrice)) ||
            Number(entryPrice) <= 0
        ) {
            return {
                success: false,
                message: "Invalid entry price.",
            };
        }

        if (
            !Number.isInteger(Number(durationSeconds)) ||
            Number(durationSeconds) <= 0
        ) {
            return {
                success: false,
                message: "Invalid trade duration.",
            };
        }

        if (accountType !== "DEMO" && accountType !== "REAL") {
            return {
                success: false,
                message: "Invalid account type.",
            };
        }

        const numericStake = Number(stake);

        // ---------------------------------------------------------
        // 1. Deduct stake
        // ---------------------------------------------------------

        const { data: newBalance, error: balanceError } =
            await supabase.rpc("update_user_balance", {
                p_user_id: userId,
                p_amount: -numericStake,
                p_account_type: accountType,
            });

        if (balanceError) {
            return {
                success: false,
                message:
                    "Unable to deduct trade stake: " +
                    balanceError.message,
            };
        }

        // ---------------------------------------------------------
        // 2. Create OPEN trade
        // ---------------------------------------------------------

        const startedAt = new Date();
        const endsAt = new Date(
            startedAt.getTime() + Number(durationSeconds) * 1000
        );

        const { data: trade, error: tradeError } = await supabase
            .from("trades")
            .insert({
                user_id: userId,
                symbol,
                direction,
                stake: numericStake,
                entry_price: Number(entryPrice),
                duration_seconds: Number(durationSeconds),
                account_type: accountType,
                status: "OPEN",
                started_at: startedAt.toISOString(),
                ends_at: endsAt.toISOString(),
                payout: 0,
            })
            .select()
            .single();

        // ---------------------------------------------------------
        // 3. Refund stake if trade creation fails
        // ---------------------------------------------------------

        if (tradeError) {
            const { error: refundError } = await supabase.rpc(
                "update_user_balance",
                {
                    p_user_id: userId,
                    p_amount: numericStake,
                    p_account_type: accountType,
                }
            );

            if (refundError) {
                console.error(
                    "CRITICAL: Trade failed and refund failed:",
                    refundError
                );
            }

            return {
                success: false,
                message:
                    "Trade creation failed. Your stake has been refunded.",
            };
        }

        return {
            success: true,
            trade,
            newBalance,
        };
    } catch (err: any) {
        return {
            success: false,
            message:
                err?.message || "An unexpected error occurred.",
        };
    }
}

// =============================================================
// SETTLE TRADE
// =============================================================

export async function settleTrade(
    tradeId: string,
    exitPrice: number
) {
    try {
        if (!tradeId) {
            return {
                success: false,
                message: "Trade ID is required.",
            };
        }

        if (!Number.isFinite(Number(exitPrice))) {
            return {
                success: false,
                message: "Invalid exit price.",
            };
        }

        // ---------------------------------------------------------
        // 1. Fetch OPEN trade
        // ---------------------------------------------------------

        const { data: trade, error: fetchError } = await supabase
            .from("trades")
            .select("*")
            .eq("id", tradeId)
            .single();

        if (fetchError || !trade) {
            return {
                success: false,
                message: "Trade not found.",
            };
        }

        if (trade.status !== "OPEN") {
            return {
                success: false,
                message: "Trade already settled.",
            };
        }

        const numericExitPrice = Number(exitPrice);
        const numericStake = Number(trade.stake);
        const numericEntryPrice = Number(trade.entry_price);

        // ---------------------------------------------------------
        // 2. Evaluate trade
        // ---------------------------------------------------------

        const { won, payout } = evaluateTradeOutcome(
            trade.direction,
            numericStake,
            numericEntryPrice,
            numericExitPrice
        );

        // ---------------------------------------------------------
        // 3. Credit payout if WON
        // ---------------------------------------------------------

        let updatedBalance: number | null = null;

        if (won && payout > 0) {
            const {
                data: balanceData,
                error: payoutError,
            } = await supabase.rpc("update_user_balance", {
                p_user_id: trade.user_id,
                p_amount: payout,
                p_account_type: trade.account_type,
            });

            if (payoutError) {
                return {
                    success: false,
                    message:
                        "Trade won but payout could not be credited: " +
                        payoutError.message,
                };
            }

            updatedBalance = balanceData;
        }

        // ---------------------------------------------------------
        // 4. Update trade
        // ---------------------------------------------------------

        const { error: updateError } = await supabase
            .from("trades")
            .update({
                exit_price: numericExitPrice,
                status: won ? "WON" : "LOST",
                payout: payout,
            })
            .eq("id", tradeId)
            .eq("status", "OPEN");

        if (updateError) {
            // If payout was already credited, don't attempt a second
            // automatic reversal here. Log it for investigation.
            console.error(
                "Trade settlement update failed:",
                updateError
            );

            return {
                success: false,
                message:
                    "Payout was processed but trade settlement could not be completed.",
            };
        }

        return {
            success: true,
            won,
            payout,
            newBalance: updatedBalance,
        };
    } catch (err: any) {
        return {
            success: false,
            message:
                err?.message || "Settlement execution failed.",
        };
    }
}