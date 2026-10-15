// src/types/trading.ts

export type MarketSymbol = "VOL_10" | "VOL_25" | "VOL_50" | "VOL_75" | "VOL_100";
export type TradeDirection =
    | "BUY"
    | "SELL"
    | "RISE"
    | "FALL"
    | "EVEN"
    | "ODD"
    | "OVER"
    | "UNDER";
export type TradeStatus = "OPEN" | "WON" | "LOST";

export interface CreateTradeParams {
    userId: string;
    symbol: string;
    direction: TradeDirection;
    stake: number;
    entryPrice: number;
    durationSeconds: number;
    accountType: "DEMO" | "REAL";
    stopLoss?: number;
    takeProfit?: number;
}

export interface Tick {
    timestamp: number;
    quote: number;
    price?: number;
    symbol: MarketSymbol;
}

export interface Candle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
}

// Aliases to support useMarketTicks
export type TickData = Tick;
export type CandleData = Candle;

export interface Trade {
    id: string;
    userId?: string;
    userEmail?: string;
    symbol: MarketSymbol;
    direction: TradeDirection;
    stake: number;
    entryPrice: number;
    exitPrice?: number;
    durationSeconds?: number;
    startedAt?: number;
    endsAt?: number;
    startTime?: number;
    endTime?: number;
    status: TradeStatus;
    payout?: number;
    stopLoss?: number;
    takeProfit?: number;
}

export interface ManagedUser {
    id: string;
    name: string;
    email: string;
    balance: number;
    isFavored: boolean;
    forcedWinRate: number; // e.g. 100 for 100% forced win, 50 for normal
    totalTrades: number;
    winCount: number;
    joinedDate: string;
}