// src/lib/trading/settlement.ts

export interface SettlementResult {
    won: boolean;
    payout: number;
}

export function evaluateTradeOutcome(
    direction: string,
    stake: number,
    entryPrice: number,
    exitPrice: number,
    payoutMultiplier: number = 0.95 // 95% payout rate
): SettlementResult {
    let won = false;

    const lastDigitExit = Math.floor((exitPrice * 100) % 10);

    switch (direction) {
        case "BUY":
        case "RISE":
            won = exitPrice > entryPrice;
            break;

        case "SELL":
        case "FALL":
            won = exitPrice < entryPrice;
            break;

        case "EVEN":
            won = lastDigitExit % 2 === 0;
            break;

        case "ODD":
            won = lastDigitExit % 2 !== 0;
            break;

        case "OVER":
            won = lastDigitExit > 5;
            break;

        case "UNDER":
            won = lastDigitExit < 5;
            break;

        default:
            won = false;
    }

    const payout = won ? stake + stake * payoutMultiplier : 0;

    return { won, payout };
}