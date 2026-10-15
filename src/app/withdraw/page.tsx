"use client";

import { FormEvent, useEffect, useState } from "react";
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

const MIN_WITHDRAWAL = 500;
const MAX_WITHDRAWAL = 300000;

type Status = "idle" | "processing" | "success" | "error";

function formatAmount(value: number) {
    return new Intl.NumberFormat("en-KE", {
        maximumFractionDigits: 0,
    }).format(value);
}

function normalizePhone(phone: string) {
    let value = phone.trim().replace(/\s+/g, "").replace(/^\+/, "");

    if (value.startsWith("0")) {
        value = "254" + value.slice(1);
    }

    return value;
}

function isValidKenyanPhone(phone: string) {
    return /^254\d{9}$/.test(phone);
}

export default function WithdrawPage() {
    return (
        <AppShell>
            <WithdrawContent />
        </AppShell>
    );
}

function WithdrawContent() {
    const { profile } = useAccount();

    const [phone, setPhone] = useState("");
    const [amount, setAmount] = useState("");
    const [showPhone, setShowPhone] = useState(true);

    const [status, setStatus] = useState<Status>("idle");
    const [message, setMessage] = useState("");

    /*
     * Withdrawals MUST use real_balance.
     * Demo balance must never be withdrawable.
     */
    const realBalance = Number(
        (profile as any)?.real_balance ??
        0
    );

    useEffect(() => {
        const profilePhone = (profile as any)?.phone;

        if (profilePhone) {
            setPhone(String(profilePhone));
        }
    }, [profile]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setStatus("idle");
        setMessage("");

        const numericAmount = Number(amount);
        const normalizedPhone = normalizePhone(phone);

        /*
         * PHONE VALIDATION
         */
        if (!phone.trim()) {
            setStatus("error");
            setMessage("Enter your M-Pesa number.");
            return;
        }

        if (!isValidKenyanPhone(normalizedPhone)) {
            setStatus("error");
            setMessage(
                "Enter a valid Kenyan M-Pesa number, e.g. 0712345678."
            );
            return;
        }

        /*
         * AMOUNT VALIDATION
         */
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            setStatus("error");
            setMessage("Enter a valid withdrawal amount.");
            return;
        }

        /*
         * MINIMUM WITHDRAWAL
         */
        if (numericAmount < MIN_WITHDRAWAL) {
            setStatus("error");
            setMessage(
                `Minimum withdrawal amount is KES ${formatAmount(
                    MIN_WITHDRAWAL
                )}.`
            );
            return;
        }

        /*
         * MAXIMUM WITHDRAWAL
         */
        if (numericAmount > MAX_WITHDRAWAL) {
            setStatus("error");
            setMessage(
                `Maximum withdrawal amount is KES ${formatAmount(
                    MAX_WITHDRAWAL
                )}.`
            );
            return;
        }

        /*
         * BALANCE CHECK
         *
         * Only REAL balance can be withdrawn.
         */
        if (numericAmount > realBalance) {
            setStatus("error");
            setMessage(
                `Insufficient balance. Your available balance is KES ${formatAmount(
                    realBalance
                )}.`
            );
            return;
        }

        /*
         * REQUEST ACCEPTED
         *
         * CloudPay payout API will be connected here later.
         */
        setStatus("processing");
        setMessage("Your withdrawal is being processed...");

        /*
         * Temporary processing step.
         * This represents the withdrawal request being accepted
         * by the application until the real payout provider is connected.
         */
        await new Promise((resolve) => setTimeout(resolve, 2200));

        setStatus("success");
        setMessage(
            `Withdrawal of KES ${formatAmount(
                numericAmount
            )} has been submitted successfully.`
        );
    }

    function resetForm() {
        setStatus("idle");
        setMessage("");
        setAmount("");
    }

    return (
        <div className="min-h-full px-4 py-8 sm:px-6 lg:px-10">
            <div className="mx-auto w-full max-w-3xl">

                {/* HEADER */}
                <div className="mb-8">
                    <Link
                        href="/wallet"
                        className="mb-5 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
                    >
                        <ArrowLeft size={18} />
                        Back
                    </Link>

                    <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Withdraw funds
                    </h1>

                    <p className="mt-1 text-base text-white/50">
                        Send money to your M-Pesa account.
                    </p>
                </div>

                {/* CARD */}
                <div className="mx-auto max-w-2xl rounded-[26px] border border-white/[0.07] bg-[#111b17] p-5 shadow-2xl sm:p-8">

                    {/* INFORMATION */}
                    <div className="mb-8 flex gap-3 rounded-2xl bg-[#0d1713] p-4">
                        <Info
                            size={20}
                            className="mt-0.5 shrink-0 text-[#00d084]"
                        />

                        <p className="text-sm leading-6 text-white/55">
                            Withdrawals are automatically reviewed and
                            dispatched directly to your M-Pesa number.
                            Minimum KES 500.
                        </p>
                    </div>

                    {/* AVAILABLE BALANCE */}
                    <div className="mb-6 rounded-2xl border border-white/[0.06] bg-[#0d1713] px-4 py-4">
                        <p className="text-sm text-white/45">
                            Available balance
                        </p>

                        <p className="mt-1 text-2xl font-semibold text-white">
                            KES {formatAmount(realBalance)}
                        </p>
                    </div>

                    {/* SUCCESS MESSAGE */}
                    {status === "success" && (
                        <div className="mb-6 rounded-2xl border border-[#00d084]/20 bg-[#00d084]/[0.08] p-5">
                            <div className="flex items-start gap-3">
                                <CheckCircle2
                                    size={24}
                                    className="mt-0.5 shrink-0 text-[#00d084]"
                                />

                                <div>
                                    <h3 className="font-semibold text-white">
                                        Withdrawal submitted
                                    </h3>

                                    <p className="mt-1 text-sm leading-6 text-white/60">
                                        {message}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={resetForm}
                                className="mt-4 text-sm font-medium text-[#00d084] transition hover:text-[#00e89a]"
                            >
                                Make another withdrawal
                            </button>
                        </div>
                    )}

                    {/* ERROR MESSAGE */}
                    {status === "error" && message && (
                        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3">
                            <p className="text-sm text-red-300">
                                {message}
                            </p>
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >

                        {/* M-PESA NUMBER */}
                        <div>
                            <label
                                htmlFor="withdraw-phone"
                                className="mb-3 block text-base font-semibold text-white"
                            >
                                M-Pesa number
                            </label>

                            <div className="relative">
                                <input
                                    id="withdraw-phone"
                                    type={showPhone ? "tel" : "password"}
                                    inputMode="tel"
                                    value={phone}
                                    onChange={(e) => {
                                        setPhone(e.target.value);

                                        if (status !== "idle") {
                                            setStatus("idle");
                                            setMessage("");
                                        }
                                    }}
                                    placeholder="0712 345 678"
                                    disabled={
                                        status === "processing" ||
                                        status === "success"
                                    }
                                    className="h-[62px] w-full rounded-2xl border border-white/[0.08] bg-transparent px-4 pr-14 text-base text-white outline-none placeholder:text-white/30 transition focus:border-[#00d084]/50 focus:ring-2 focus:ring-[#00d084]/10 disabled:cursor-not-allowed disabled:opacity-60"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPhone((value) => !value)
                                    }
                                    disabled={
                                        status === "processing" ||
                                        status === "success"
                                    }
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/45 transition hover:text-white disabled:opacity-40"
                                    aria-label={
                                        showPhone
                                            ? "Hide phone number"
                                            : "Show phone number"
                                    }
                                >
                                    {showPhone ? (
                                        <EyeOff size={20} />
                                    ) : (
                                        <Eye size={20} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* AMOUNT */}
                        <div>
                            <label
                                htmlFor="withdraw-amount"
                                className="mb-3 block text-base font-semibold text-white"
                            >
                                Amount (KES)
                            </label>

                            <input
                                id="withdraw-amount"
                                type="number"
                                inputMode="numeric"
                                min={MIN_WITHDRAWAL}
                                max={MAX_WITHDRAWAL}
                                step="1"
                                value={amount}
                                onChange={(e) => {
                                    setAmount(e.target.value);

                                    if (status !== "idle") {
                                        setStatus("idle");
                                        setMessage("");
                                    }
                                }}
                                placeholder="500"
                                disabled={
                                    status === "processing" ||
                                    status === "success"
                                }
                                className="h-[62px] w-full rounded-2xl border border-white/[0.08] bg-transparent px-4 text-base text-white outline-none placeholder:text-white/30 transition focus:border-[#00d084]/50 focus:ring-2 focus:ring-[#00d084]/10 disabled:cursor-not-allowed disabled:opacity-60"
                            />

                            <p className="mt-2 text-sm text-white/45">
                                Min KES {formatAmount(MIN_WITHDRAWAL)} - Max
                                KES {formatAmount(MAX_WITHDRAWAL)}
                            </p>
                        </div>

                        {/* SUBMIT */}
                        {status !== "success" && (
                            <button
                                type="submit"
                                disabled={status === "processing"}
                                className="flex h-[64px] w-full items-center justify-center gap-2 rounded-2xl bg-[#00c98a] text-base font-semibold text-black shadow-[0_0_25px_rgba(0,208,132,0.18)] transition hover:bg-[#00d894] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {status === "processing" ? (
                                    <>
                                        <Loader2
                                            size={20}
                                            className="animate-spin"
                                        />
                                        Processing withdrawal...
                                    </>
                                ) : (
                                    "Submit withdrawal"
                                )}
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}