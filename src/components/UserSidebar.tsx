
"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import {
    Menu,
    X,
    User,
    Wallet,
    ArrowDownToLine,
    ArrowUpFromLine,
    LogOut,
    ChevronRight,
    BarChart3,
} from "lucide-react";

interface UserSidebarProps {
    user: {
        id: string;
        email?: string;
        fullName?: string;
    } | null;
    demoBalance: number;
    realBalance: number;
    accountType: "DEMO" | "REAL";
    onAccountTypeChange: (type: "DEMO" | "REAL") => void;
}

export default function UserSidebar({
    user,
    demoBalance,
    realBalance,
    accountType,
    onAccountTypeChange,
}: UserSidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    if (!user) return null;

    const currentBalance =
        accountType === "DEMO" ? demoBalance : realBalance;

    const displayName =
        user.fullName ||
        user.email?.split("@")[0] ||
        "Trader";

    const initial =
        displayName.charAt(0).toUpperCase() || "U";

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/auth");
        router.refresh();
    };

    const navigate = (path: string) => {
        setIsOpen(false);
        router.push(path);
    };

    return (
        <>
            {/* =========================================================
                HEADER MENU TRIGGER
            ========================================================== */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                aria-label="Open account menu"
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-[#050709] hover:bg-neutral-900 transition-colors"
            >
                {/* Balance */}
                <div className="flex flex-col items-end leading-tight">
                    <span className="text-[9px] font-bold uppercase tracking-wide text-neutral-500">
                        {accountType}
                    </span>

                    <span
                        className={`text-xs font-bold font-mono ${accountType === "DEMO"
                            ? "text-emerald-400"
                            : "text-amber-400"
                            }`}
                    >
                        $
                        {currentBalance.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </span>
                </div>

                {/* Avatar */}
                <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <span className="text-[10px] font-black">
                        {initial}
                    </span>
                </div>

                {/* Menu icon */}
                <Menu
                    size={17}
                    strokeWidth={2}
                    className="text-neutral-400"
                />
            </button>

            {/* =========================================================
                BACKDROP
            ========================================================== */}
            {isOpen && (
                <button
                    type="button"
                    aria-label="Close account menu"
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 bg-black/70 backdrop-blur-[2px] z-[60] cursor-default"
                />
            )}

            {/* =========================================================
                SIDEBAR
            ========================================================== */}
            <aside
                className={`fixed top-0 right-0 h-[100dvh] w-[min(88vw,380px)] bg-[#080a0d] border-l border-neutral-800 z-[70] flex flex-col shadow-2xl transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                {/* =====================================================
                    SIDEBAR HEADER
                ====================================================== */}
                <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                            <BarChart3
                                size={17}
                                className="text-emerald-400"
                            />
                        </div>

                        <div>
                            <p className="text-sm font-black tracking-wide text-white">
                                FX TRADES
                            </p>

                            <p className="text-[9px] uppercase tracking-widest text-neutral-500">
                                Trading Terminal
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close menu"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* =====================================================
                    SCROLLABLE CONTENT
                ====================================================== */}
                <div className="flex-1 overflow-y-auto">
                    {/* PROFILE */}
                    <div className="px-5 pt-5">
                        <div className="rounded-xl border border-neutral-800 bg-[#0d1117] p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                    <span className="font-black">
                                        {initial}
                                    </span>
                                </div>

                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-white truncate">
                                        {displayName}
                                    </p>

                                    <p className="text-[10px] text-neutral-500 truncate">
                                        {user.email}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between">
                                <span className="text-[10px] uppercase tracking-wider text-neutral-500">
                                    Available Balance
                                </span>

                                <span
                                    className={`text-sm font-black font-mono ${accountType === "DEMO"
                                        ? "text-emerald-400"
                                        : "text-amber-400"
                                        }`}
                                >
                                    $
                                    {currentBalance.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ACCOUNT MODE */}
                    <div className="px-5 pt-5">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 mb-2">
                            Account Mode
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    onAccountTypeChange("DEMO")
                                }
                                className={`rounded-lg border py-3 transition-colors ${accountType === "DEMO"
                                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                                    : "bg-[#0d1117] border-neutral-800 text-neutral-500 hover:text-white"
                                    }`}
                            >
                                <span className="block text-[10px] font-black">
                                    DEMO
                                </span>

                                <span className="block mt-1 text-[10px] font-mono">
                                    $
                                    {demoBalance.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    onAccountTypeChange("REAL")
                                }
                                className={`rounded-lg border py-3 transition-colors ${accountType === "REAL"
                                    ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                                    : "bg-[#0d1117] border-neutral-800 text-neutral-500 hover:text-white"
                                    }`}
                            >
                                <span className="block text-[10px] font-black">
                                    REAL
                                </span>

                                <span className="block mt-1 text-[10px] font-mono">
                                    $
                                    {realBalance.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* NAVIGATION */}
                    <div className="px-5 pt-6">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 mb-2">
                            Account
                        </p>

                        <div className="space-y-1">
                            <button
                                type="button"
                                onClick={() => navigate("/dashboard")}
                                className="w-full flex items-center justify-between px-3 py-3 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors"
                            >
                                <span className="flex items-center gap-3 text-xs font-semibold">
                                    <BarChart3
                                        size={16}
                                        className="text-neutral-500"
                                    />
                                    Trading Terminal
                                </span>

                                <ChevronRight
                                    size={15}
                                    className="text-neutral-600"
                                />
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/profile")}
                                className="w-full flex items-center justify-between px-3 py-3 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors"
                            >
                                <span className="flex items-center gap-3 text-xs font-semibold">
                                    <User
                                        size={16}
                                        className="text-neutral-500"
                                    />
                                    Profile
                                </span>

                                <ChevronRight
                                    size={15}
                                    className="text-neutral-600"
                                />
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/wallet")}
                                className="w-full flex items-center justify-between px-3 py-3 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors"
                            >
                                <span className="flex items-center gap-3 text-xs font-semibold">
                                    <Wallet
                                        size={16}
                                        className="text-neutral-500"
                                    />
                                    Wallet
                                </span>

                                <ChevronRight
                                    size={15}
                                    className="text-neutral-600"
                                />
                            </button>
                        </div>
                    </div>

                    {/* MONEY ACTIONS */}
                    <div className="px-5 pt-6">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 mb-2">
                            Funds
                        </p>

                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => navigate("/deposit")}
                                className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black transition-colors"
                            >
                                <span className="flex items-center gap-3 text-xs font-black">
                                    <ArrowDownToLine size={16} />
                                    Deposit Funds
                                </span>

                                <ChevronRight size={15} />
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/withdraw")}
                                className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-[#0d1117] border border-neutral-800 hover:border-neutral-700 text-white transition-colors"
                            >
                                <span className="flex items-center gap-3 text-xs font-bold">
                                    <ArrowUpFromLine
                                        size={16}
                                        className="text-neutral-400"
                                    />
                                    Withdraw Funds
                                </span>

                                <ChevronRight
                                    size={15}
                                    className="text-neutral-600"
                                />
                            </button>
                        </div>
                    </div>

                    {/* ACCOUNT ID */}
                    <div className="px-5 pt-6 pb-6">
                        <div className="rounded-lg bg-[#050709] border border-neutral-800 p-3">
                            <p className="text-[9px] uppercase tracking-widest text-neutral-600">
                                Account ID
                            </p>

                            <p className="mt-1 text-[9px] font-mono text-neutral-500 break-all">
                                {user.id}
                            </p>
                        </div>
                    </div>
                </div>

                {/* =====================================================
                    LOGOUT
                ====================================================== */}
                <div className="p-5 border-t border-neutral-800 bg-[#080a0d]">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-rose-900/50 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 transition-colors text-xs font-bold"
                    >
                        <LogOut size={15} />
                        LOG OUT
                    </button>
                </div>
            </aside>
        </>
    );
}