// src/components/AppShell.tsx
"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Bell,
    BellRing,
    CandlestickChart,
    Download,
    History,
    LayoutDashboard,
    LineChart,
    LogOut,
    Menu,
    HelpCircle,
    Settings,
    Upload,
    User,
    Wallet,
    X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

export type AccountType = "DEMO" | "REAL";

export interface AppUser {
    id: string;
    email: string;
    metaName?: string;
    lastSignInAt?: string;
}

interface AccountContextValue {
    supabase: typeof supabase;
    user: AppUser | null;
    profile: Record<string, any> | null;
    displayName: string;
    currency: string;
    demoBalance: number;
    realBalance: number;
    accountType: AccountType;
    setAccountType: (type: AccountType) => void;
    referralCode: string;
    loading: boolean;
    reload: () => Promise<void>;
}

// Starting demo balance for new profiles (set NEXT_PUBLIC_DEMO_START_BALANCE to change)
const DEMO_START_BALANCE = Number(
    process.env.NEXT_PUBLIC_DEMO_START_BALANCE ?? 10000
);

const AccountContext = createContext<AccountContextValue | null>(null);

export function useAccount() {
    const ctx = useContext(AccountContext);
    if (!ctx) throw new Error("useAccount must be used inside <AppShell>");
    return ctx;
}

/* ------------------------------------------------------------------ */
/* Navigation — adjust routes to match your app                        */
/* ------------------------------------------------------------------ */

const NAV = [
    {
        title: "Overview",
        items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
    },
    {
        title: "Trading",
        items: [
            { label: "Candle Trade", href: "/trade", icon: CandlestickChart, hot: true },
            { label: "Pro Trader", href: "/pro-trader", icon: LineChart },
            { label: "Trade History", href: "/history", icon: History },
            { label: "Price Alerts", href: "/alerts", icon: BellRing },
        ],
    },
    {
        title: "Funds",
        items: [
            { label: "Wallet", href: "/wallet", icon: Wallet },
            { label: "Deposit", href: "/deposit", icon: Download },
            { label: "Withdraw", href: "/withdraw", icon: Upload },
        ],
    },
    {
        title: "Account",
        items: [
            { label: "Notifications", href: "/notifications", icon: Bell },
            { label: "Support", href: "/support", icon: HelpCircle },
        ],
    },
];

const ACCOUNT_LINKS = [
    { label: "Profile", href: "/profile", icon: User },
    { label: "Settings", href: "/settings", icon: Settings },
];

const MOBILE_NAV = [
    { label: "Home", href: "/dashboard", icon: LayoutDashboard },
    { label: "🔥 Trade", href: "/trade", icon: CandlestickChart },
    { label: "Deposit", href: "/deposit", icon: Download },
    { label: "Wallet", href: "/wallet", icon: Wallet },
    { label: "Me", href: "/profile", icon: User },
];

/* ------------------------------------------------------------------ */

function Logo() {
    return (
        <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#04110c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                </svg>
            </span>
            <span className="text-xl font-semibold tracking-tight">
                FX <span className="text-emerald-500">Trades</span>
            </span>
        </Link>
    );
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
    return (
        <span
            style={{ width: size, height: size, fontSize: size * 0.4 }}
            className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 font-semibold text-[#04110c] shadow-[0_0_18px_rgba(16,185,129,0.3)]"
        >
            {name.charAt(0).toUpperCase()}
        </span>
    );
}

function SidebarContent({
    displayName,
    roleLabel,
    onNavigate,
    onSignOut,
}: {
    displayName: string;
    roleLabel: string;
    onNavigate?: () => void;
    onSignOut: () => void;
}) {
    const pathname = usePathname();

    const linkClass = (active: boolean) =>
        `flex items-center gap-4 rounded-xl px-4 py-3 text-[15px] font-medium transition-colors ${active
            ? "bg-white/[0.06] text-white"
            : "text-neutral-400 hover:bg-white/[0.03] hover:text-white"
        }`;

    return (
        <div className="flex h-full flex-col">
            <div className="flex h-16 shrink-0 items-center border-b border-white/[0.06] px-5">
                <Logo />
            </div>

            <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
                <Avatar name={displayName} size={44} />
                <div className="min-w-0">
                    <p className="truncate font-semibold">{displayName}</p>
                    <span className="mt-1 inline-block rounded-md bg-white/[0.07] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                        {roleLabel}
                    </span>
                </div>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
                {NAV.map((group) => (
                    <div key={group.title} className="mb-5">
                        <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-600">
                            {group.title}
                        </p>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onNavigate}
                                        className={linkClass(pathname === item.href)}
                                    >
                                        <Icon size={20} />
                                        <span>
                                            {item.label}
                                            {"hot" in item && item.hot && (
                                                <span className="ml-1.5">🔥 HOT</span>
                                            )}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Pinned footer: Profile, Settings and Sign out stay visible while the menu above scrolls */}
            <div className="shrink-0 space-y-1 border-t border-white/[0.06] bg-[#0a110f] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
                {ACCOUNT_LINKS.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={linkClass(pathname === item.href)}
                        >
                            <Icon size={20} />
                            {item.label}
                        </Link>
                    );
                })}

                <button
                    type="button"
                    onClick={onSignOut}
                    className={`${linkClass(false)} w-full`}
                >
                    <LogOut size={20} />
                    Sign out
                </button>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */

export function AppShell({
    children,
    flush = false,
}: {
    children: React.ReactNode;
    /** Remove content padding (used by the full-bleed trade terminal) */
    flush?: boolean;
}) {
    const router = useRouter();
    const pathname = usePathname();

    const [user, setUser] = useState<AppUser | null>(null);
    const [profile, setProfile] = useState<Record<string, any> | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [accountType, setAccountTypeState] = useState<AccountType>("REAL");
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);

    /* Remember Live / Demo across pages */
    useEffect(() => {
        const saved = localStorage.getItem("accountType");
        if (saved === "DEMO" || saved === "REAL") setAccountTypeState(saved);
    }, []);

    const setAccountType = (type: AccountType) => {
        setAccountTypeState(type);
        localStorage.setItem("accountType", type);
    };

    const load = useCallback(async () => {
        const {
            data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
            setUser(null);
            router.replace("/auth");
            return;
        }

        setUser({
            id: authUser.id,
            email: authUser.email ?? "",
            metaName:
                authUser.user_metadata?.full_name ??
                authUser.user_metadata?.name ??
                undefined,
            lastSignInAt: authUser.last_sign_in_at ?? undefined,
        });

        const [profileRes, notifRes] = await Promise.all([
            supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle(),
            supabase
                .from("notifications")
                .select("id", { count: "exact", head: true })
                .eq("user_id", authUser.id)
                .eq("read", false),
        ]);

        let profileRow = profileRes.data ?? null;

        // First sign-in after sign-up (or a missing row): create the profile now
        if (!profileRow) {
            const { data: created } = await supabase
                .from("profiles")
                .upsert(
                    {
                        id: authUser.id,
                        email: authUser.email,
                        full_name:
                            authUser.user_metadata?.full_name ??
                            authUser.user_metadata?.name ??
                            "",
                        demo_balance: DEMO_START_BALANCE,
                        real_balance: 0,
                    },
                    { onConflict: "id" }
                )
                .select("*")
                .maybeSingle();
            profileRow = created ?? null;
        }

        setProfile(profileRow);
        setUnreadCount(notifRes.count ?? 0);
    }, [supabase, router]);

    useEffect(() => {
        load()
            .catch((error) => console.error("Account loading error:", error))
            .finally(() => setLoading(false));
    }, [load]);

    useEffect(() => {
        document.body.style.overflow = drawerOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [drawerOpen]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/auth");
        router.refresh();
    };

    const demoBalance = Number(
        profile?.demo_balance ?? profile?.demoBalance ?? profile?.balance_demo ?? 0
    );
    const realBalance = Number(
        profile?.real_balance ?? profile?.realBalance ?? profile?.balance_real ?? 0
    );
    const currency = String(profile?.currency ?? "KES");
    const balance = accountType === "DEMO" ? demoBalance : realBalance;

    const displayName =
        profile?.full_name || user?.metaName || user?.email.split("@")[0] || "Trader";

    const role = profile?.role ? String(profile.role) : "Trader";

    const money = (value: number) =>
        `${currency} ${value.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    const ctx: AccountContextValue = {
        supabase,
        user,
        profile,
        displayName,
        currency,
        demoBalance,
        realBalance,
        accountType,
        setAccountType,
        referralCode: profile?.referral_code ? String(profile.referral_code) : "",
        loading,
        reload: load,
    };

    if (loading || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#08100d]">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-emerald-500" />
            </div>
        );
    }

    return (
        <AccountContext.Provider value={ctx}>
            <div className="min-h-screen bg-[#08100d] text-white">
                {/* Desktop sidebar */}
                <aside className="fixed inset-y-0 left-0 z-40 hidden w-[280px] border-r border-white/[0.06] bg-[#0a110f] lg:block">
                    <SidebarContent
                        displayName={displayName}
                        roleLabel={role}
                        onSignOut={handleSignOut}
                    />
                </aside>

                {/* Mobile drawer */}
                {drawerOpen && (
                    <div className="fixed inset-x-0 top-0 z-50 h-[100dvh] lg:hidden">
                        <button
                            type="button"
                            aria-label="Close menu"
                            onClick={() => setDrawerOpen(false)}
                            className="absolute inset-0 bg-black/70"
                        />
                        <aside className="absolute inset-y-0 left-0 w-[290px] max-w-[85%] border-r border-white/[0.06] bg-[#0a110f]">
                            <button
                                type="button"
                                aria-label="Close menu"
                                onClick={() => setDrawerOpen(false)}
                                className="absolute right-3 top-3 z-10 rounded-lg p-2 text-neutral-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                            <SidebarContent
                                displayName={displayName}
                                roleLabel={role}
                                onNavigate={() => setDrawerOpen(false)}
                                onSignOut={handleSignOut}
                            />
                        </aside>
                    </div>
                )}

                <div className="lg:pl-[280px]">
                    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.06] bg-[#08100d]/90 px-4 backdrop-blur-xl sm:px-6 lg:px-12">
                        <div className="flex items-center gap-3 lg:hidden">
                            <button
                                type="button"
                                aria-label="Open menu"
                                onClick={() => setDrawerOpen(true)}
                                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.06] bg-[#0e1512]"
                            >
                                <Menu size={20} />
                            </button>
                            <Logo />
                        </div>

                        <div className="ml-auto flex items-center gap-3 sm:gap-4">
                            <Link
                                href="/wallet"
                                className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-[#0e1512] px-4 py-2.5 font-mono text-[15px] font-semibold"
                            >
                                <Wallet size={14} className="text-neutral-400" />
                                {money(balance)}
                            </Link>

                            <button
                                type="button"
                                aria-label="Notifications"
                                className="relative p-2 text-neutral-300 hover:text-white"
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-[#04110c]">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            <Link href="/profile" aria-label="Profile">
                                <Avatar name={displayName} size={44} />
                            </Link>
                        </div>
                    </header>

                    <main
                        className={
                            flush
                                ? "pb-[72px] lg:pb-0"
                                : "px-4 pb-28 pt-8 sm:px-6 lg:px-12 lg:pb-12 lg:pt-10"
                        }
                    >
                        {children}
                    </main>
                </div>

                {/* Mobile bottom nav */}
                <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-[#08100d]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
                    <div className="mx-auto grid h-[72px] max-w-xl grid-cols-5">
                        {MOBILE_NAV.map((item) => {
                            const Icon = item.icon;
                            const active = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex flex-col items-center justify-center gap-1 text-xs font-medium ${active ? "text-emerald-400" : "text-neutral-500"
                                        }`}
                                >
                                    <span
                                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? "bg-emerald-500/15" : ""
                                            }`}
                                    >
                                        <Icon size={20} />
                                    </span>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </div>
        </AccountContext.Provider>
    );
}