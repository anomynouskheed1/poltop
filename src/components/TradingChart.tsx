// src/components/TradingChart.tsx
"use client";

import { useEffect, useRef } from "react";
import { MarketSymbol, Tick, Trade } from "@/types/trading";

interface TradingChartProps {
    symbol: MarketSymbol;
    currentPrice: number;
    ticks: Tick[];
    activeTrades: Trade[];
}

export default function TradingChart({
    symbol,
    currentPrice,
    ticks,
    activeTrades,
}: TradingChartProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Handle high DPI retina screens and container bounding rect
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        if (rect.width === 0 || rect.height === 0) return;

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;

        // Clear canvas background (Dark terminal theme)
        ctx.fillStyle = "#070a0f";
        ctx.fillRect(0, 0, width, height);

        if (!ticks || ticks.length < 2) return;

        // Calculate fixed min/max price bounds with safe type fallbacks
        const prices = ticks.map((t) => t.price ?? 0);
        let minPrice = Math.min(...prices);
        let maxPrice = Math.max(...prices);
        const range = maxPrice - minPrice || 1;
        const padding = range * 0.15; // 15% padding
        minPrice -= padding;
        maxPrice += padding;

        // Gridlines & Price labels on right axis
        ctx.strokeStyle = "#161f2e";
        ctx.lineWidth = 1;
        const gridLines = 6;
        for (let i = 0; i <= gridLines; i++) {
            const y = (height / gridLines) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width - 60, y);
            ctx.stroke();

            const priceAtY = maxPrice - (i / gridLines) * (maxPrice - minPrice);
            ctx.fillStyle = "#64748b";
            ctx.font = "10px monospace";
            ctx.fillText(priceAtY.toFixed(2), width - 52, y + 3);
        }

        const getX = (index: number) => (index / (ticks.length - 1)) * (width - 65);
        const getY = (price: number) =>
            height - ((price - minPrice) / (maxPrice - minPrice)) * height;

        // 1. Draw Candlestick / Bar Visualization
        const barWidth = Math.max(2, (width - 65) / ticks.length - 2);

        ticks.forEach((tick, idx) => {
            const prevTick = ticks[idx - 1] || tick;
            const x = getX(idx);
            const openY = getY(prevTick.price ?? tick.price ?? 0);
            const closeY = getY(tick.price ?? 0);
            const isBullish = (tick.price ?? 0) >= (prevTick.price ?? 0);

            const color = isBullish ? "#22c55e" : "#ef4444";
            ctx.fillStyle = color;
            ctx.strokeStyle = color;

            // Draw Candlestick Body / Bar
            const topY = Math.min(openY, closeY);
            const bodyHeight = Math.max(2, Math.abs(closeY - openY));

            ctx.fillRect(x - barWidth / 2, topY, barWidth, bodyHeight);
        });

        // 2. Draw Price Line Connecting Ticks
        ctx.beginPath();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#38bdf8";
        ticks.forEach((tick, idx) => {
            const x = getX(idx);
            const y = getY(tick.price ?? 0);
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // 3. Active Trade Horizontal Entry Lines
        activeTrades.forEach((trade) => {
            const entryY = getY(trade.entryPrice);
            const isBuy = ["BUY", "EVEN", "OVER"].includes(trade.direction);
            const lineColor = isBuy ? "#22c55e" : "#ef4444";

            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(0, entryY);
            ctx.lineTo(width - 65, entryY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Label badge for trade line
            ctx.fillStyle = lineColor;
            ctx.font = "bold 9px monospace";
            ctx.fillText(
                `${trade.direction} @ ${trade.entryPrice.toFixed(2)}`,
                8,
                entryY - 4
            );
        });

        // 4. Current Spot Marker & Floating Price Tag
        const currentX = getX(ticks.length - 1);
        const currentY = getY(currentPrice);

        // Horizontal dashed spot line
        ctx.strokeStyle = "#38bdf8";
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(0, currentY);
        ctx.lineTo(width - 60, currentY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Glowing point on chart
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(currentX, currentY, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Floating price box on right axis
        ctx.fillStyle = "#0284c7";
        ctx.fillRect(width - 60, currentY - 10, 58, 20);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px monospace";
        ctx.fillText(currentPrice.toFixed(2), width - 54, currentY + 3);
    }, [ticks, currentPrice, activeTrades]);

    return (
        <div className="relative w-full h-full flex flex-col bg-[#070a0f]">
            <div className="relative flex-1 w-full min-h-[280px]">
                <canvas ref={canvasRef} className="w-full h-full block" />
            </div>
        </div>
    );
}