"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    BarChart3,
    Bell,
    ChevronDown,
    Copy,
    Gift,
    Home,
    LogOut,
    Menu,
    RefreshCw,
    Settings,
    Share2,
    UserRound,
    Wallet as WalletIcon,
    ArrowDownToLine,
    ArrowUpFromLine,
    Sparkles,
    Users,
    Clock3,
    LayoutDashboard,
    CandlestickChart,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Profile = {
    id: string;
    email?: string | null;
    full_name?: string | null;
    real_balance?: number | null;
    demo_balance?: number | null;
};

export default function WalletPage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [mobileMenu, setMobileMenu] = useState(false);

    useEffect(() => {
        loadWallet();
    }, []);

    async function loadWallet() {
        setLoading(true);

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setLoading(false);
            return;
        }

        const { data } = await supabase
            .from("profiles")
            .select("id, email, full_name, real_balance, demo_balance")
            .eq("id", user.id)
            .maybeSingle();

        if (data) {
            setProfile(data);
        } else {
            setProfile({
                id: user.id,
                email: user.email,
                real_balance: 0,
                demo_balance: 10000,
            });
        }

        setLoading(false);
    }

    const balance = Number(profile?.real_balance ?? 0);

    const displayName =
        profile?.full_name ||
        profile?.email?.split("@")[0] ||
        "Trader";

    const initials =
        displayName
            .split(" ")
            .map((part) => part.charAt(0))
            .join("")
            .slice(0, 2)
            .toUpperCase() || "E";

    const referralLink = `https://fxtrades.com/auth?ref=${profile?.id?.slice(
        0,
        8
    ) || "TRADER"}`;

    async function copyReferral() {
        try {
            await navigator.clipboard.writeText(referralLink);
            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch {
            setCopied(false);
        }
    }

    async function signOut() {
        await supabase.auth.signOut();
        window.location.href = "/auth";
    }

    return (
        <main className="min-h-screen bg-[#070c0a] text-white font-sans">
            {/* DESKTOP SIDEBAR */}
            <aside className="fixed left-0 top-0 bottom-0 z-40 hidden w-[260px] border-r border-white/[0.05] bg-[#050907] lg:flex lg:flex-col">
                {/* Brand */}
                <div className="flex h-[65px] items-center border-b border-white/[0.05] px-6">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
                            <span className="text-xs font-black text-black">FX</span>
                        </div>

                        <span className="text-[17px] font-black tracking-tight">
                            FX<span className="text-emerald-400">Trades</span>
                        </span>
                    </Link>
                </div>

                {/* User */}
                <div className="border-b border-white/[0.05] px-4 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-black">
                            {initials}
                        </div>

                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-white">
                                {displayName}
                            </p>

                            <span className="mt-1 inline-flex rounded-full bg-[#18211e] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-neutral-400">
                                TRADER
                            </span>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto px-3 py-5">
                    <NavLabel label="OVERVIEW" />

                    <SidebarLink
                        href="/dashboard"
                        icon={<LayoutDashboard size={17} />}
                        label="Dashboard"
                    />

                    <NavLabel label="TRADING" />

                    <SidebarLink
                        href="/trade"
                        icon={<CandlestickChart size={17} />}
                        label="Candle Trade"
                        badge="🔥 HOT"
                    />

                    <SidebarLink
                        href="/trade"
                        icon={<BarChart3 size={17} />}
                        label="Pro Trader"
                    />

                    <SidebarLink
                        href="/trade"
                        icon={<Clock3 size={17} />}
                        label="Trade History"
                    />

                    <SidebarLink
                        href="/trade"
                        icon={<Bell size={17} />}
                        label="Price Alerts"
                    />

                    <NavLabel label="FUNDS" />

                    <SidebarLink
                        href="/wallet"
                        icon={<WalletIcon size={17} />}
                        label="Wallet"
                        active
                    />

                    <div className="my-4 border-t border-white/[0.05]" />

                    <SidebarLink
                        href="/profile"
                        icon={<UserRound size={17} />}
                        label="Profile"
                    />

                    <SidebarLink
                        href="/profile"
                        icon={<Settings size={17} />}
                        label="Settings"
                    />

                    <button
                        onClick={signOut}
                        className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-neutral-400 transition hover:bg-white/[0.04] hover:text-white"
                    >
                        <LogOut size={17} />
                        <span>Sign out</span>
                    </button>
                </div>
            </aside>

            {/* MAIN */}
            <div className="lg:pl-[260px]">
                {/* TOP HEADER */}
                <header className="sticky top-0 z-30 flex h-[65px] items-center justify-between border-b border-white/[0.05] bg-[#070c0a]/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3 lg:hidden">
                        <button
                            onClick={() => setMobileMenu(!mobileMenu)}
                            className="rounded-lg p-2 text-neutral-400 hover:bg-white/[0.05] hover:text-white"
                        >
                            <Menu size={20} />
                        </button>

                        <span className="text-sm font-black">
                            FX<span className="text-emerald-400">Trades</span>
                        </span>
                    </div>

                    <div className="hidden lg:block" />

                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-[#0c1310] px-3 py-2">
                            <WalletIcon size={13} className="text-neutral-500" />

                            <span className="text-xs font-bold">
                                KES{" "}
                                {balance.toLocaleString("en-KE", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </span>
                        </div>

                        <button className="relative hidden h-9 w-9 items-center justify-center rounded-full text-neutral-400 hover:bg-white/[0.05] hover:text-white sm:flex">
                            <Bell size={18} />

                            <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[8px] font-black text-black">
                                1
                            </span>
                        </button>

                        <Link
                            href="/profile"
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-black"
                        >
                            {initials}
                        </Link>
                    </div>
                </header>

                {/* MOBILE MENU */}
                {mobileMenu && (
                    <div className="fixed inset-0 z-50 bg-[#050907] lg:hidden">
                        <div className="flex h-[65px] items-center justify-between border-b border-white/[0.05] px-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
                                    <span className="text-xs font-black text-black">FX</span>
                                </div>

                                <span className="font-black">
                                    FX<span className="text-emerald-400">Trades</span>
                                </span>
                            </div>

                            <button
                                onClick={() => setMobileMenu(false)}
                                className="text-neutral-400"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-4">
                            <MobileMenuLink
                                href="/dashboard"
                                icon={<Home size={18} />}
                                label="Dashboard"
                            />

                            <MobileMenuLink
                                href="/trade"
                                icon={<BarChart3 size={18} />}
                                label="Trade"
                            />

                            <MobileMenuLink
                                href="/wallet"
                                icon={<WalletIcon size={18} />}
                                label="Wallet"
                                active
                            />

                            <MobileMenuLink
                                href="/profile"
                                icon={<UserRound size={18} />}
                                label="Profile"
                            />

                            <button
                                onClick={signOut}
                                className="mt-5 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-neutral-400"
                            >
                                <LogOut size={18} />
                                Sign out
                            </button>
                        </div>
                    </div>
                )}

                {/* PAGE CONTENT */}
                <section className="mx-auto max-w-[900px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
                    {/* TITLE */}
                    <div className="mb-5 flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                                Wallet
                            </h1>

                            <p className="mt-1 text-sm text-neutral-500">
                                Balance and transactions.
                            </p>
                        </div>

                        <button
                            onClick={loadWallet}
                            disabled={loading}
                            className="rounded-lg p-2 text-neutral-400 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-40"
                        >
                            <RefreshCw
                                size={18}
                                className={loading ? "animate-spin" : ""}
                            />
                        </button>
                    </div>

                    {/* PROMO */}
                    <div className="mb-4 overflow-hidden rounded-[22px] border border-emerald-500/50 bg-gradient-to-br from-[#063e2c] via-[#092c22] to-[#09130f] p-5 shadow-[0_0_40px_rgba(16,185,129,0.08)] sm:p-6">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                                <Sparkles size={20} />
                            </div>

                            <div>
                                <h2 className="text-lg font-black sm:text-xl">
                                    Deposit Doubling Promo is LIVE!
                                </h2>

                                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                    Active
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 rounded-2xl bg-black/15 px-4 py-3 text-sm leading-6 text-neutral-400">
                            Deposit more than{" "}
                            <span className="font-bold text-white">KES 500</span> and{" "}
                            <span className="font-bold text-emerald-400">
                                get double your deposit amount instantly!
                            </span>{" "}
                            Maximum bonus{" "}
                            <span className="font-bold text-white">KES 25,000</span>.
                        </div>

                        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400">
                            <Clock3 size={15} />
                            <span>Ends in:</span>
                            <span className="font-bold">5d 10h 35m</span>
                        </div>

                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                            <div className="h-full w-[9%] rounded-full bg-rose-500" />
                        </div>

                        <Link
                            href="/deposit"
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-black transition hover:bg-emerald-400"
                        >
                            <ArrowDownToLine size={17} />
                            Deposit Now
                        </Link>
                    </div>

                    {/* REFERRAL */}
                    <div className="mb-4 rounded-[22px] border border-white/[0.05] bg-gradient-to-br from-[#17211d] to-[#0c1411] p-5 sm:p-6">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                                <Gift size={20} />
                            </div>

                            <div>
                                <h2 className="text-base font-black sm:text-lg">
                                    Referral Bonus — Earn KES 100 per friend!
                                </h2>

                                <p className="mt-1 text-xs leading-5 text-neutral-500">
                                    Share your personal link. When a friend signs up and makes
                                    their first deposit, you both win — you get KES 100 credited
                                    instantly.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 flex items-center gap-2 text-xs text-neutral-500">
                            <Users size={15} />
                            <span>0 friends referred</span>
                        </div>

                        <div className="mt-3 flex gap-2">
                            <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-white/[0.05] bg-[#0b1210] px-3 py-3">
                                <p className="truncate font-mono text-[10px] text-neutral-300 sm:text-xs">
                                    {referralLink}
                                </p>
                            </div>

                            <button
                                onClick={copyReferral}
                                className="flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.05] bg-[#101815] px-4 text-xs font-bold text-white transition hover:bg-[#17211d]"
                            >
                                <Copy size={15} />
                                <span className="hidden sm:inline">
                                    {copied ? "Copied" : "Copy"}
                                </span>
                            </button>
                        </div>

                        <button className="mx-auto mt-4 flex items-center gap-2 text-xs font-bold text-neutral-300 transition hover:text-emerald-400">
                            <Share2 size={15} />
                            Share now
                        </button>
                    </div>

                    {/* BALANCE CARD */}
                    <div className="mb-4 rounded-[22px] border border-emerald-500/60 bg-gradient-to-br from-[#14231e] to-[#0d1713] p-5 shadow-[0_0_35px_rgba(16,185,129,0.07)] sm:p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-500">
                                    Available Balance
                                </p>

                                <p className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                                    KES{" "}
                                    {loading
                                        ? "..."
                                        : balance.toLocaleString("en-KE", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                </p>

                                <p className="mt-1 text-xs text-neutral-500">
                                    Kenyan Shillings
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                                <WalletIcon size={20} />
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-2">
                            <Link
                                href="/deposit"
                                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-black text-black transition hover:bg-emerald-400"
                            >
                                <ArrowDownToLine size={17} />
                                Deposit
                            </Link>

                            <Link
                                href="/withdraw"
                                className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.05] bg-[#101815] py-3 text-sm font-black text-white transition hover:bg-[#17211d]"
                            >
                                <ArrowUpFromLine size={17} />
                                Withdraw
                            </Link>
                        </div>
                    </div>

                    {/* TRANSACTIONS */}
                    <div className="overflow-hidden rounded-[22px] border border-white/[0.05] bg-gradient-to-br from-[#151e1a] to-[#0b120f]">
                        <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-4">
                            <h2 className="text-sm font-black">Transactions</h2>

                            <span className="text-xs text-neutral-500">0 records</span>
                        </div>

                        <div className="flex min-h-[240px] flex-col items-center justify-center px-5 py-10 text-center">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white/[0.03] text-neutral-600">
                                <WalletIcon size={27} />
                            </div>

                            <p className="text-sm font-bold text-neutral-400">
                                No transactions yet
                            </p>

                            <p className="mt-1 text-xs text-neutral-600">
                                Make your first deposit to get started.
                            </p>

                            <Link
                                href="/deposit"
                                className="mt-5 text-xs font-bold text-emerald-400 hover:text-emerald-300"
                            >
                                Make a deposit →
                            </Link>
                        </div>
                    </div>
                </section>
            </div>

            {/* MOBILE BOTTOM NAV */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.05] bg-[#070c0a]/95 backdrop-blur-xl lg:hidden">
                <div className="grid h-[68px] grid-cols-4">
                    <BottomNavItem
                        href="/"
                        icon={<Home size={19} />}
                        label="HOME"
                    />

                    <BottomNavItem
                        href="/trade"
                        icon={<BarChart3 size={19} />}
                        label="TRADE"
                    />

                    <BottomNavItem
                        href="/wallet"
                        icon={<WalletIcon size={19} />}
                        label="WALLET"
                        active
                    />

                    <BottomNavItem
                        href="/profile"
                        icon={<UserRound size={19} />}
                        label="PROFILE"
                    />
                </div>
            </nav>

            {/* MOBILE BOTTOM SPACE */}
            <div className="h-[68px] lg:hidden" />
        </main>
    );
}

/* ---------------- COMPONENTS ---------------- */

function NavLabel({ label }: { label: string }) {
    return (
        <p className="mb-2 mt-5 px-3 text-[10px] font-black tracking-[0.14em] text-neutral-600 first:mt-0">
            {label}
        </p>
    );
}

function SidebarLink({
    href,
    icon,
    label,
    active = false,
    badge,
}: {
    href: string;
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    badge?: string;
}) {
    return (
        <Link
            href={href}
            className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active
                ? "bg-[#121c18] font-bold text-white"
                : "text-neutral-400 hover:bg-white/[0.035] hover:text-white"
                }`}
        >
            <span className={active ? "text-emerald-400" : "text-neutral-500"}>
                {icon}
            </span>

            <span>{label}</span>

            {badge && (
                <span className="text-[9px] font-bold text-orange-400">
                    {badge}
                </span>
            )}
        </Link>
    );
}

function MobileMenuLink({
    href,
    icon,
    label,
    active = false,
}: {
    href: string;
    icon: React.ReactNode;
    label: string;
    active?: boolean;
}) {
    return (
        <Link
            href={href}
            className={`mb-2 flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${active
                ? "bg-emerald-500/10 font-bold text-emerald-400"
                : "text-neutral-400"
                }`}
        >
            {icon}
            {label}
        </Link>
    );
}

function BottomNavItem({
    href,
    icon,
    label,
    active = false,
}: {
    href: string;
    icon: React.ReactNode;
    label: string;
    active?: boolean;
}) {
    return (
        <Link
            href={href}
            className={`flex flex-col items-center justify-center gap-1 ${active
                ? "text-emerald-400"
                : "text-neutral-600 hover:text-neutral-300"
                }`}
        >
            {icon}

            <span className="text-[8px] font-black tracking-wider">
                {label}
            </span>
        </Link>
    );
}