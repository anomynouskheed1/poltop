// src/components/TradeCountdown.tsx
"use client";

import { useState, useEffect } from "react";

interface TradeCountdownProps {
    endTime: number;
    durationSeconds: number;
}

export default function TradeCountdown({ endTime, durationSeconds }: TradeCountdownProps) {
    const [timeLeft, setTimeLeft] = useState<number>(() => {
        const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        return remaining;
    });

    useEffect(() => {
        const timer = setInterval(() => {
            const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
            setTimeLeft(remaining);

            if (remaining <= 0) {
                clearInterval(timer);
            }
        }, 200);

        return () => clearInterval(timer);
    }, [endTime]);

    const progressPercent = Math.min(
        100,
        Math.max(0, ((durationSeconds - timeLeft) / durationSeconds) * 100)
    );

    return (
        <div className="flex flex-col gap-1 min-w-[90px]">
            <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-amber-400 font-bold animate-pulse">{timeLeft}s left</span>
            </div>
            <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div
                    className="bg-amber-400 h-full transition-all duration-300 ease-linear"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
        </div>
    );
}