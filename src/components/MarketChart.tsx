// src/components/MarketChart.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
    createChart,
    IChartApi,
    ISeriesApi,
    AreaSeries,
    CandlestickSeries,
    LineStyle,
} from "lightweight-charts";
import { Tick, Candle, MarketSymbol, Trade } from "@/types/trading";

interface MarketChartProps {
    ticks: Tick[];
    candles: Candle[];
    symbol: MarketSymbol;
    activeTrades?: Trade[];
}

export default function MarketChart({
    ticks,
    candles,
    symbol,
    activeTrades = [],
}: MarketChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<
        ISeriesApi<"Area"> | ISeriesApi<"Candlestick"> | null
    >(null);

    const priceLinesRef = useRef<any[]>([]);

    const [chartType, setChartType] = useState<"area" | "candlestick">(
        "candlestick"
    );

    /*
     * ---------------------------------------------------------
     * CREATE / DESTROY CHART
     * ---------------------------------------------------------
     */
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const container = chartContainerRef.current;

        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
            seriesRef.current = null;
        }

        const chart = createChart(container, {
            width: container.clientWidth,
            height: container.clientHeight,

            layout: {
                background: {
                    color: "#0d1117",
                },
                textColor: "#8b949e",
                fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            },

            grid: {
                vertLines: {
                    color: "#161b22",
                    style: 0,
                },
                horzLines: {
                    color: "#161b22",
                    style: 0,
                },
            },

            crosshair: {
                mode: 1,
                vertLine: {
                    color: "#6b7280",
                    width: 1,
                    style: LineStyle.Dashed,
                    labelBackgroundColor: "#111827",
                },
                horzLine: {
                    color: "#6b7280",
                    width: 1,
                    style: LineStyle.Dashed,
                    labelBackgroundColor: "#111827",
                },
            },

            rightPriceScale: {
                borderColor: "#21262d",
                textColor: "#9ca3af",
                autoScale: true,
                scaleMargins: {
                    top: 0.08,
                    bottom: 0.08,
                },
            },

            timeScale: {
                borderColor: "#21262d",
                timeVisible: true,
                secondsVisible: true,
                rightOffset: 5,
                barSpacing: 8,
                minBarSpacing: 3,
            },

            localization: {
                priceFormatter: (price: number) => price.toFixed(2),
            },

            handleScroll: {
                mouseWheel: true,
                pressedMouseMove: true,
                horzTouchDrag: true,
                vertTouchDrag: true,
            },

            handleScale: {
                axisPressedMouseMove: true,
                mouseWheel: true,
                pinch: true,
            },
        });

        if (chartType === "candlestick") {
            seriesRef.current = chart.addSeries(CandlestickSeries, {
                upColor: "#10b981",
                downColor: "#f43f5e",
                borderUpColor: "#10b981",
                borderDownColor: "#f43f5e",
                wickUpColor: "#10b981",
                wickDownColor: "#f43f5e",
                borderVisible: true,
                priceLineVisible: true,
                lastValueVisible: true,
            });
        } else {
            seriesRef.current = chart.addSeries(AreaSeries, {
                lineColor: "#10b981",
                lineWidth: 2,

                topColor: "rgba(16, 185, 129, 0.20)",
                bottomColor: "rgba(16, 185, 129, 0.00)",

                priceLineVisible: true,
                lastValueVisible: true,
            });
        }

        chartRef.current = chart;

        /*
         * Resize chart with its container.
         */
        const resizeObserver = new ResizeObserver(() => {
            if (!chartRef.current || !chartContainerRef.current) return;

            chartRef.current.applyOptions({
                width: chartContainerRef.current.clientWidth,
                height: chartContainerRef.current.clientHeight,
            });
        });

        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();

            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
                seriesRef.current = null;
            }
        };
    }, [chartType]);

    /*
     * ---------------------------------------------------------
     * UPDATE MARKET DATA
     * ---------------------------------------------------------
     */
    useEffect(() => {
        if (!seriesRef.current) return;

        if (chartType === "area") {
            if (!ticks.length) return;

            const timeMap = new Map<number, number>();

            ticks.forEach((tick) => {
                const timestamp = Math.floor(tick.timestamp / 1000);
                const price = Number(tick.quote ?? tick.price ?? 0);

                if (Number.isFinite(price) && price > 0) {
                    timeMap.set(timestamp, price);
                }
            });

            const formattedTicks = Array.from(timeMap.entries())
                .map(([time, value]) => ({
                    time: time as any,
                    value,
                }))
                .sort((a, b) => Number(a.time) - Number(b.time));

            if (!formattedTicks.length) return;

            const series = seriesRef.current as ISeriesApi<"Area">;

            series.setData(formattedTicks);

            chartRef.current?.timeScale().fitContent();

            return;
        }

        /*
         * Candlestick mode
         */
        if (!candles.length) return;

        const candleMap = new Map<number, Candle>();

        candles.forEach((candle) => {
            candleMap.set(Number(candle.time), candle);
        });

        const formattedCandles = Array.from(candleMap.values())
            .filter(
                (candle) =>
                    Number.isFinite(Number(candle.open)) &&
                    Number.isFinite(Number(candle.high)) &&
                    Number.isFinite(Number(candle.low)) &&
                    Number.isFinite(Number(candle.close))
            )
            .map((candle) => ({
                time: Number(candle.time) as any,
                open: Number(candle.open),
                high: Number(candle.high),
                low: Number(candle.low),
                close: Number(candle.close),
            }))
            .sort(
                (a, b) =>
                    Number(a.time) - Number(b.time)
            );

        if (!formattedCandles.length) return;

        const series =
            seriesRef.current as ISeriesApi<"Candlestick">;

        series.setData(formattedCandles);

        chartRef.current?.timeScale().fitContent();
    }, [ticks, candles, chartType]);

    /*
     * ---------------------------------------------------------
     * ACTIVE TRADE ENTRY LINES
     * ---------------------------------------------------------
     */
    useEffect(() => {
        if (!seriesRef.current) return;

        /*
         * Remove old price lines.
         */
        priceLinesRef.current.forEach((line) => {
            try {
                seriesRef.current?.removePriceLine(line);
            } catch {
                // Ignore detached chart lines.
            }
        });

        priceLinesRef.current = [];

        /*
         * Only display currently OPEN trades.
         */
        const openTrades = activeTrades.filter(
            (trade) => trade.status === "OPEN"
        );

        openTrades.forEach((trade) => {
            let lineColor = "#10b981";

            if (
                trade.direction === "SELL" ||
                trade.direction === "FALL" ||
                trade.direction === "ODD" ||
                trade.direction === "UNDER"
            ) {
                lineColor = "#f43f5e";
            }

            const line = seriesRef.current?.createPriceLine({
                price: Number(trade.entryPrice),

                color: lineColor,

                lineWidth: 2,

                lineStyle: LineStyle.Dashed,

                axisLabelVisible: true,

                title: `${trade.direction} ${Number(
                    trade.entryPrice
                ).toFixed(2)}`,
            });

            if (line) {
                priceLinesRef.current.push(line);
            }
        });

        return () => {
            priceLinesRef.current.forEach((line) => {
                try {
                    seriesRef.current?.removePriceLine(line);
                } catch {
                    // Ignore cleanup errors.
                }
            });

            priceLinesRef.current = [];
        };
    }, [activeTrades, chartType]);

    /*
     * ---------------------------------------------------------
     * UI
     * ---------------------------------------------------------
     */
    return (
        <div className="w-full h-full min-h-0 flex flex-col">
            {/* Chart toolbar */}
            <div className="flex items-center justify-between gap-3 pb-2 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />

                    <span className="text-[10px] sm:text-xs font-bold text-neutral-300 tracking-wider">
                        {symbol}
                    </span>

                    <span className="text-[9px] text-neutral-600">
                        /
                    </span>

                    <span className="text-[9px] text-neutral-500 uppercase">
                        {chartType === "candlestick"
                            ? "Candles"
                            : "Live Ticks"}
                    </span>
                </div>

                {/* Chart mode selector */}
                <div className="flex items-center bg-[#050709] border border-neutral-800 rounded-md p-0.5">
                    <button
                        type="button"
                        onClick={() => setChartType("candlestick")}
                        className={`px-2.5 py-1 text-[9px] font-bold rounded transition-all ${chartType === "candlestick"
                            ? "bg-neutral-800 text-white border border-neutral-700"
                            : "text-neutral-500 hover:text-neutral-300"
                            }`}
                    >
                        CANDLES
                    </button>

                    <button
                        type="button"
                        onClick={() => setChartType("area")}
                        className={`px-2.5 py-1 text-[9px] font-bold rounded transition-all ${chartType === "area"
                            ? "bg-neutral-800 text-white border border-neutral-700"
                            : "text-neutral-500 hover:text-neutral-300"
                            }`}
                    >
                        TICKS
                    </button>
                </div>
            </div>

            {/* Chart */}
            <div
                ref={chartContainerRef}
                className="flex-1 min-h-0 w-full relative overflow-hidden"
            />

            {/* Bottom status strip */}
            <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-neutral-900 shrink-0">
                <span className="text-[8px] text-neutral-600 uppercase tracking-wider">
                    {chartType === "candlestick"
                        ? "LIVE MARKET DATA"
                        : "REAL-TIME TICK STREAM"}
                </span>

                <span className="flex items-center gap-1.5 text-[8px] text-emerald-500">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE
                </span>
            </div>
        </div>
    );
}