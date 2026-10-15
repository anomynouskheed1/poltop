// src/app/deposit/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    CheckCircle2,
    Eye,
    EyeOff,
    Info,
    Loader2,
} from "lucide-react";

import { AppShell, useAccount } from "@/components/AppShell";
import { PromoCard } from "@/components/PromoCard";

// Optional limits — set NEXT_PUBLIC_MIN_DEPOSIT / NEXT_PUBLIC_MAX_DEPOSIT in .env.local
// (the server route should enforce the same limits)
const MIN_DEPOSIT = Number(process.env.NEXT_PUBLIC_MIN_DEPOSIT ?? 100);
const MAX_DEPOSIT = process.env.NEXT_PUBLIC_MAX_DEPOSIT
    ? Number(process.env.NEXT_PUBLIC_MAX_DEPOSIT)
    : null;

const card = "rounded-3xl border border-white/[0.06] bg-[#111a17]";
const inputClass =
    "w-full rounded-xl border border-white/[0.06] bg-[#0e1512] px-4 py-4 text-[17px] text-white placeholder:text-neutral-600 outline-none transition-colors focus:border-emerald-500/60";

function DepositContent() {
    const { profile, currency } = useAccount();

    const [amount, setAmount] = useState<string>("");
    const [phoneNumber, setPhoneNumber] = useState<string>("");
    const [hidePhone, setHidePhone] = useState(false);
    const [loading, setLoading] = useState<boolean>(false);

    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    // Pre-fill with the phone number saved on the profile
    useEffect(() => {
        if (profile?.phone) {
            setPhoneNumber((current) => current || String(profile.phone));
        }
    }, [profile]);

    const fmt = (value: number) => value.toLocaleString("en-US");

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        const cleanedPhone = phoneNumber.replace(/\s+/g, "").trim();

        if (!cleanedPhone || !/^(\+?254|0)[17]\d{8}$/.test(cleanedPhone)) {
            setMessage({
                type: "error",
                text: "Enter a valid M-Pesa number, e.g. 0712345678 or 254712345678.",
            });
            return;
        }

        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount) || numericAmount < MIN_DEPOSIT) {
            setMessage({
                type: "error",
                text: `Minimum deposit amount is ${currency} ${fmt(MIN_DEPOSIT)}.`,
            });
            return;
        }

        if (MAX_DEPOSIT !== null && numericAmount > MAX_DEPOSIT) {
            setMessage({
                type: "error",
                text: `Maximum deposit amount is ${currency} ${fmt(MAX_DEPOSIT)}.`,
            });
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/payments/cloudpay/stkpush", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    phone: cleanedPhone,
                    amount: numericAmount,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(
                    data?.error || "Failed to initiate M-Pesa STK Push."
                );
            }

            setMessage({
                type: "success",
                text: "M-Pesa prompt sent. Check your phone and enter your M-Pesa PIN to complete the deposit.",
            });
        } catch (err: any) {
            setMessage({
                type: "error",
                text:
                    err?.message ||
                    "Something went wrong while starting the payment.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-[672px]">
            {/* Heading */}
            <div className="flex items-start gap-5">
                <Link
                    href="/"
                    aria-label="Back to dashboard"
                    className="mt-3 text-neutral-300 transition-colors hover:text-white"
                >
                    <ArrowLeft size={20} />
                </Link>

                <div>
                    <h1 className="text-4xl font-bold tracking-tight">
                        Deposit funds
                    </h1>
                    <p className="mt-1 text-lg text-neutral-400">
                        Fund your account via M-Pesa.
                    </p>
                </div>
            </div>

            {/* Active promotion (renders only when one is running) */}
            <PromoCard currency={currency} className="mt-8" />

            {/* Form */}
            <form
                onSubmit={handleDeposit}
                className={`${card} mt-6 p-6 sm:p-9`}
            >
                {message && (
                    <div
                        role={message.type === "error" ? "alert" : "status"}
                        className={`mb-6 flex gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed ${message.type === "success"
                            ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-300"
                            : "border-rose-500/30 bg-rose-950/30 text-rose-300"
                            }`}
                    >
                        {message.type === "success" && (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        )}
                        <p>{message.text}</p>
                    </div>
                )}

                <div className="mb-8 flex gap-3 rounded-2xl border border-white/[0.05] bg-black/20 px-4 py-4 text-[15px] leading-relaxed text-neutral-400">
                    <Info className="mt-0.5 h-[18px] w-[18px] shrink-0 text-emerald-400" />
                    <p>
                        An M-Pesa STK push prompt will be sent to your phone.
                        Enter your PIN within{" "}
                        <strong className="text-white">90 seconds</strong> to
                        complete the deposit.
                        <br />
                        <span className="mt-1.5 inline-block">
                            Works with both 07XX and 01XX Safaricom numbers.
                        </span>
                    </p>
                </div>

                {/* Phone */}
                <div className="mb-6">
                    <label
                        htmlFor="phone"
                        className="mb-2.5 block text-base font-semibold"
                    >
                        M-Pesa number
                    </label>

                    <div className="relative">
                        <input
                            id="phone"
                            type="tel"
                            inputMode="numeric"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="07XX or 01XX XXX XXX"
                            autoComplete="tel"
                            required
                            style={
                                hidePhone
                                    ? ({
                                        WebkitTextSecurity: "disc",
                                    } as React.CSSProperties)
                                    : undefined
                            }
                            className={`${inputClass} pr-12`}
                        />
                        <button
                            type="button"
                            onClick={() => setHidePhone((v) => !v)}
                            aria-label={
                                hidePhone ? "Show number" : "Hide number"
                            }
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-white"
                        >
                            {hidePhone ? (
                                <EyeOff size={20} />
                            ) : (
                                <Eye size={20} />
                            )}
                        </button>
                    </div>
                </div>

                {/* Amount */}
                <div className="mb-6">
                    <label
                        htmlFor="amount"
                        className="mb-2.5 block text-base font-semibold"
                    >
                        Amount ({currency})
                    </label>

                    <input
                        id="amount"
                        type="number"
                        inputMode="numeric"
                        min={MIN_DEPOSIT}
                        max={MAX_DEPOSIT ?? undefined}
                        step="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={String(MIN_DEPOSIT)}
                        required
                        className={inputClass}
                    />

                    <p className="mt-2.5 text-[15px] text-neutral-400">
                        Min {currency} {fmt(MIN_DEPOSIT)}
                        {MAX_DEPOSIT !== null &&
                            ` · Max ${currency} ${fmt(MAX_DEPOSIT)}`}
                    </p>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-4 text-base font-semibold text-[#04110c] shadow-[0_8px_30px_rgba(16,185,129,0.25)] transition hover:from-emerald-400 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Sending STK Prompt...
                        </>
                    ) : (
                        "Deposit via M-Pesa"
                    )}
                </button>

                <p className="mt-6 text-center text-[15px] text-neutral-500">
                    Powered by{" "}
                    <span className="font-semibold text-neutral-300">
                        FxTrades
                    </span>{" "}
                    · Secure Payments
                </p>
            </form>
        </div>
    );
}

export default function DepositPage() {
    return (
        <AppShell>
            <DepositContent />
        </AppShell>
    );
}