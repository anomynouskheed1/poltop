// src/lib/ticks/useWebSocketTicks.ts
"use client";

import { useEffect, useState, useRef } from "react";
import { Tick, MarketSymbol } from "@/types/trading";

const DERIV_WS_URL = "wss://ws.derivws.com/websockets/v3?app_id=1089"; // Default public app_id

export function useWebSocketTicks(symbol: MarketSymbol) {
    const [ticks, setTicks] = useState<Tick[]>([]);
    const [currentPrice, setCurrentPrice] = useState<number>(0);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        let fallbackInterval: NodeJS.Timeout;

        const connectWebSocket = () => {
            try {
                const ws = new WebSocket(DERIV_WS_URL);
                socketRef.current = ws;

                ws.onopen = () => {
                    setIsConnected(true);
                    // Subscribe to live tick stream for selected symbol
                    ws.send(
                        JSON.stringify({
                            ticks: symbol,
                            subscribe: 1,
                        })
                    );
                };

                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);

                    if (data.msg_type === "tick" && data.tick) {
                        const price = Number(data.tick.quote);
                        const newTick: Tick = {
                            symbol,
                            price,
                            quote: price,
                            timestamp: data.tick.epoch * 1000,
                        };

                        setCurrentPrice(price);
                        setTicks((prev) => [...prev.slice(-49), newTick]);
                    }
                };

                ws.onerror = () => {
                    setIsConnected(false);
                };

                ws.onclose = () => {
                    setIsConnected(false);
                };
            } catch (err) {
                setIsConnected(false);
            }
        };

        connectWebSocket();

        // Fallback simulation if WebSocket fails to connect
        fallbackInterval = setInterval(() => {
            if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
                setCurrentPrice((prevPrice) => {
                    const base = prevPrice || 1250.0;
                    const delta = (Math.random() - 0.49) * 2;
                    const newPrice = Number((base + delta).toFixed(2));
                    const newTick: Tick = {
                        symbol,
                        price: newPrice,
                        quote: newPrice,
                        timestamp: Date.now(),
                    };
                    setTicks((prev) => [...prev.slice(-49), newTick]);
                    return newPrice;
                });
            }
        }, 1000);

        return () => {
            if (socketRef.current) {
                // Forget tick stream subscription on cleanup
                if (socketRef.current.readyState === WebSocket.OPEN) {
                    socketRef.current.send(
                        JSON.stringify({
                            forget_all: "ticks",
                        })
                    );
                }
                socketRef.current.close();
            }
            clearInterval(fallbackInterval);
        };
    }, [symbol]);

    return { currentPrice, ticks, isConnected };
}