// src/hooks/useMarketTicks.ts
import { useState, useEffect } from "react";
import { MarketSymbol, Tick as TickData, Candle as CandleData } from "@/types/trading";

export function useMarketTicks(symbol: MarketSymbol) {
    const [ticks, setTicks] = useState<TickData[]>([]);
    const [candles, setCandles] = useState<CandleData[]>([]);
    const [currentPrice, setCurrentPrice] = useState<number>(1000.0);
    const [priceChange, setPriceChange] = useState<number>(0);

    useEffect(() => {
        let basePrice = 1000;
        const now = Math.floor(Date.now() / 1000);
        const intervalSeconds = 5; // 5-second candles

        // 1. Generate seed data for line & candlestick charts
        const initialTicks: TickData[] = [];
        const initialCandles: CandleData[] = [];

        for (let i = 60; i >= 0; i--) {
            const candleStartTime = (now - i * intervalSeconds) * 1000;
            const open = basePrice;
            let high = open;
            let low = open;

            for (let t = 0; t < intervalSeconds; t++) {
                const delta = (Math.random() - 0.49) * 2.5;
                basePrice = Math.max(10, basePrice + delta);
                if (basePrice > high) high = basePrice;
                if (basePrice < low) low = basePrice;

                const formattedPrice = Number(basePrice.toFixed(2));

                initialTicks.push({
                    price: formattedPrice,
                    quote: formattedPrice,
                    symbol,
                    timestamp: candleStartTime + t * 1000,
                });
            }

            initialCandles.push({
                time: Math.floor(candleStartTime / 1000), // Lightweight charts expects Unix seconds
                open: Number(open.toFixed(2)),
                high: Number(high.toFixed(2)),
                low: Number(low.toFixed(2)),
                close: Number(basePrice.toFixed(2)),
            });
        }

        setTicks(initialTicks);
        setCandles(initialCandles);
        setCurrentPrice(initialTicks[initialTicks.length - 1].price || 1000);

        // 2. Real-time ticker stream
        const intervalId = setInterval(() => {
            const delta = (Math.random() - 0.49) * 2.5;
            basePrice = Math.max(10, basePrice + delta);
            const formattedPrice = Number(basePrice.toFixed(2));
            const currentTime = Date.now();

            setCurrentPrice(formattedPrice);
            setPriceChange(Number(delta.toFixed(2)));

            // Construct tick conforming to TickData
            const newTick: TickData = {
                price: formattedPrice,
                quote: formattedPrice,
                symbol,
                timestamp: currentTime,
            };

            // Update Ticks
            setTicks((prev) => [...prev.slice(-49), newTick]);

            // Update / Create Candlesticks
            setCandles((prev) => {
                if (prev.length === 0) return prev;
                const lastCandle = prev[prev.length - 1];
                const currentTimeSec = Math.floor(currentTime / 1000);
                const isNewCandle = currentTimeSec - lastCandle.time >= intervalSeconds;

                if (isNewCandle) {
                    const newCandle: CandleData = {
                        time: currentTimeSec,
                        open: formattedPrice,
                        high: formattedPrice,
                        low: formattedPrice,
                        close: formattedPrice,
                    };
                    return [...prev.slice(-29), newCandle];
                } else {
                    const updatedCandle: CandleData = {
                        ...lastCandle,
                        high: Math.max(lastCandle.high, formattedPrice),
                        low: Math.min(lastCandle.low, formattedPrice),
                        close: formattedPrice,
                    };
                    return [...prev.slice(0, -1), updatedCandle];
                }
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, [symbol]);

    return { ticks, candles, currentPrice, priceChange };
}