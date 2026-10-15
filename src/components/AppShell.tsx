
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
    ChevronRight,
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

const DEMO_START_BALANCE = Number(
    process.env.NEXT_PUBLIC_DEMO_START_BALANCE ?? 10000
);

const AccountContext = createContext<AccountContextValue | null>(null);

export function useAccount() {
    const ctx = useContext(AccountContext);
    if (!ctx) throw new Error("useAccount must be used inside <AppShell>");
    return ctx;
}

const NAV = [
    {
        title: "Overview",
        items: [
            { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        ],
    },
    {
        title: "Trading",
        items: [
            { label: "Candle Trade", href: "/trade", icon: CandlestickChart },
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
        title: "More",
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

function Logo() {
    return (
        <Link href="/trade" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#04110c"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                </svg>
            </span>
            <span className="text-lg font-bold tracking-tight sm:text-xl">
                Pol<span className="text-emerald-400">top</span>
            </span>
        </Link>
    );
}

export function Avatar({
    name,
    size = 40,
}: {
    name: string;
    size?: number;
}) {
    return (
        <span
            style={{ width: size, height: size, fontSize: size * 0.4 }}
            className="flex shrink-0 items-center justify-center rounded-full border border-emerald-400/20 bg-gradient-to-br from-emerald-400 to-emerald-600 font-bold text-[#04110c]"
        >
            {(name || "T").charAt(0).toUpperCase()}
        </span>
    );
}

function SidebarContent({
    displayName,
    roleLabel,
    onNavigate,
    onSignOut,
    authenticated,
}: {
    displayName: string;
    roleLabel: string;
    onNavigate: () => void;
    onSignOut: () => void;
    authenticated: boolean;
}) {
    const pathname = usePathname();

    const linkClass = (active: boolean) =>
        `flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${active
            ? "bg-emerald-500/10 text-emerald-300"
            : "text-neutral-400 hover:bg-white/[0.05] hover:text-white"
        }`;

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-white/[0.07] px-5">
                <Logo />
                <button
                    type="button"
                    aria-label="Close navigation"
                    onClick={onNavigate}
                    className="rounded-lg p-2 text-neutral-400 hover:bg-white/[0.06] hover:text-white"
                >
                    <X size={19} />
                </button>
            </div>

            <div className="flex shrink-0 items-center gap-3 border-b border-white/[0.07] px-5 py-4">
                <Avatar name={displayName} size={42} />
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                        {displayName}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                        {authenticated ? roleLabel : "Guest access"}
                    </p>
                </div>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
                {NAV.map((group) => (
                    <div key={group.title} className="mb-5">
                        <p className="mb-2 px-3.5 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600">
                            {group.title}
                        </p>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const active = pathname === item.href;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onNavigate}
                                        className={linkClass(active)}
                                    >
                                        <Icon size={18} />
                                        <span className="flex-1">{item.label}</span>
                                        {active && (
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}

                <div className="mb-4">
                    <p className="mb-2 px-3.5 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600">
                        Account
                    </p>
                    <div className="space-y-1">
                        {ACCOUNT_LINKS.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={onNavigate}
                                    className={linkClass(pathname === item.href)}
                                >
                                    <Icon size={18} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>

            <div className="shrink-0 border-t border-white/[0.07] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                {authenticated ? (
                    <button
                        type="button"
                        onClick={onSignOut}
                        className={`${linkClass(false)} text-rose-300 hover:bg-rose-500/10 hover:text-rose-200`}
                    >
                        <LogOut size={18} />
                        Sign out
                    </button>
                ) : (
                    <Link
                        href="/auth"
                        onClick={onNavigate}
                        className="flex w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-[#04110c] transition hover:bg-emerald-400"
                    >
                        Sign in to your account
                    </Link>
                )}
            </div>
        </div>
    );
}

export function AppShell({
    children,
    flush = false,
}: {
    children: React.ReactNode;
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
    const [profileOpen, setProfileOpen] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("accountType");
        if (saved === "DEMO" || saved === "REAL") {
            setAccountTypeState(saved);
        }
    }, []);

    const setAccountType = (type: AccountType) => {
        setAccountTypeState(type);
        localStorage.setItem("accountType", type);
    };

    const load = useCallback(async () => {
        const {
            data: { user: authUser },
            error,
        } = await supabase.auth.getUser();

        if (error) {
            console.error("Authentication check failed:", error);
        }

        if (!authUser) {
            setUser(null);
            setProfile(null);
            setUnreadCount(0);

            if (pathname !== "/trade") {
                router.replace("/auth");
            }
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
            supabase
                .from("profiles")
                .select("*")
                .eq("id", authUser.id)
                .maybeSingle(),
            supabase
                .from("notifications")
                .select("id", { count: "exact", head: true })
                .eq("user_id", authUser.id)
                .eq("read", false),
        ]);

        let profileRow = profileRes.data ?? null;

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
    }, [router, pathname]);

    useEffect(() => {
        let active = true;

        setLoading(true);
        load()
            .catch((error) => console.error("Account loading error:", error))
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [load]);

    useEffect(() => {
        document.body.style.overflow =
            drawerOpen || profileOpen ? "hidden" : "";

        return () => {
            document.body.style.overflow = "";
        };
    }, [drawerOpen, profileOpen]);

    useEffect(() => {
        setDrawerOpen(false);
        setProfileOpen(false);
    }, [pathname]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setDrawerOpen(false);
                setProfileOpen(false);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setDrawerOpen(false);
        setProfileOpen(false);
        router.replace("/auth");
        router.refresh();
    };

    const demoBalance = Number(
        profile?.demo_balance ??
        profile?.demoBalance ??
        profile?.balance_demo ??
        0
    );

    const realBalance = Number(
        profile?.real_balance ??
        profile?.realBalance ??
        profile?.balance_real ??
        0
    );

    const currency = String(profile?.currency ?? "KES");
    const balance = accountType === "DEMO" ? demoBalance : realBalance;

    const displayName =
        profile?.full_name ||
        user?.metaName ||
        user?.email.split("@")[0] ||
        "Trader";

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
        referralCode: profile?.referral_code
            ? String(profile.referral_code)
            : "",
        loading,
        reload: load,
    };

    if (loading || (!user && pathname !== "/trade")) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#08100d]">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-emerald-500" />
            </div>
        );
    }

    return (
        <AccountContext.Provider value={ctx}>
            <div className="min-h-screen bg-[#08100d] text-white">
                {/* Slide-out navigation works on desktop and mobile */}
                {drawerOpen && (
                    <div className="fixed inset-0 z-[60]">
                        <button
                            type="button"
                            aria-label="Close navigation backdrop"
                            onClick={() => setDrawerOpen(false)}
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        />
                        <aside className="absolute inset-y-0 left-0 flex w-[310px] max-w-[88vw] flex-col border-r border-white/[0.08] bg-[#0a110f] shadow-2xl">
                            <SidebarContent
                                displayName={displayName}
                                roleLabel={role}
                                authenticated={Boolean(user)}
                                onNavigate={() => setDrawerOpen(false)}
                                onSignOut={handleSignOut}
                            />
                        </aside>
                    </div>
                )}

                {/* Profile popup backdrop */}
                {profileOpen && (
                    <button
                        type="button"
                        aria-label="Close profile menu"
                        onClick={() => setProfileOpen(false)}
                        className="fixed inset-0 z-[45] cursor-default bg-black/30"
                    />
                )}

                <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-white/[0.07] bg-[#08100d]/95 px-3 backdrop-blur-xl sm:px-5 lg:px-8">
                    <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
                        <button
                            type="button"
                            aria-label="Open navigation menu"
                            aria-expanded={drawerOpen}
                            onClick={() => {
                                setProfileOpen(false);
                                setDrawerOpen(true);
                            }}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[#0e1512] text-neutral-200 transition hover:border-emerald-500/30 hover:text-emerald-300"
                        >
                            <Menu size={20} />
                        </button>
                        <Logo />
                    </div>

                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        {user && (
                            <>
                                <Link
                                    href="/wallet"
                                    title="Open wallet"
                                    className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0e1512] px-2.5 py-2 sm:px-3.5"
                                >
                                    <Wallet
                                        size={15}
                                        className="text-emerald-400"
                                    />
                                    <span className="font-mono text-xs font-bold sm:text-sm">
                                        {money(balance)}
                                    </span>
                                </Link>

                                <Link
                                    href="/notifications"
                                    aria-label="Notifications"
                                    className="relative flex h-10 w-10 items-center justify-center rounded-xl text-neutral-300 transition hover:bg-white/[0.05] hover:text-white"
                                >
                                    <Bell size={19} />
                                    {unreadCount > 0 && (
                                        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-[#04110c]">
                                            {unreadCount > 99 ? "99+" : unreadCount}
                                        </span>
                                    )}
                                </Link>
                            </>
                        )}

                        <button
                            type="button"
                            aria-label="Open profile menu"
                            aria-expanded={profileOpen}
                            onClick={() => {
                                setDrawerOpen(false);
                                setProfileOpen((open) => !open);
                            }}
                            className={`flex items-center gap-2 rounded-xl border p-1.5 pr-2 transition ${profileOpen
                                    ? "border-emerald-500/30 bg-emerald-500/10"
                                    : "border-transparent hover:border-white/10 hover:bg-white/[0.04]"
                                }`}
                        >
                            <Avatar name={displayName} size={34} />
                            <span className="hidden max-w-28 truncate text-sm font-semibold sm:block">
                                {user ? displayName : "Guest"}
                            </span>
                        </button>
                    </div>
                </header>

                {/* Profile dropdown stays on the current page */}
                {profileOpen && (
                    <div className="fixed right-3 top-[72px] z-[50] w-[min(320px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-white/10 bg-[#0d1511] shadow-2xl sm:right-5 lg:right-8">
                        <div className="flex items-center gap-3 border-b border-white/[0.07] p-4">
                            <Avatar name={displayName} size={46} />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold">
                                    {displayName}
                                </p>
                                <p className="truncate text-xs text-neutral-500">
                                    {user?.email ?? "Browsing as a guest"}
                                </p>
                                <span className="mt-1 inline-flex rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                    {user ? role : "Guest"}
                                </span>
                            </div>
                        </div>

                        {user && (
                            <div className="border-b border-white/[0.07] p-3">
                                <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-600">
                                    Active balance
                                </p>
                                <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3">
                                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                                        <Wallet size={17} />
                                        {accountType === "DEMO" ? "Demo" : "Live"}
                                    </div>
                                    <span className="font-mono text-sm font-bold text-emerald-300">
                                        {money(balance)}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-1 p-2">
                            {user ? (
                                <>
                                    {ACCOUNT_LINKS.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setProfileOpen(false)}
                                                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-neutral-300 transition hover:bg-white/[0.05] hover:text-white"
                                            >
                                                <Icon size={18} />
                                                <span className="flex-1">{item.label}</span>
                                                <ChevronRight size={16} className="text-neutral-600" />
                                            </Link>
                                        );
                                    })}

                                    <Link
                                        href="/wallet"
                                        onClick={() => setProfileOpen(false)}
                                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-neutral-300 transition hover:bg-white/[0.05] hover:text-white"
                                    >
                                        <Wallet size={18} />
                                        <span className="flex-1">Wallet</span>
                                        <ChevronRight size={16} className="text-neutral-600" />
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={handleSignOut}
                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-rose-300 transition hover:bg-rose-500/10"
                                    >
                                        <LogOut size={18} />
                                        Sign out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/auth"
                                        onClick={() => setProfileOpen(false)}
                                        className="flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-[#04110c] transition hover:bg-emerald-400"
                                    >
                                        Sign in
                                    </Link>
                                    <Link
                                        href="/auth?mode=signup"
                                        onClick={() => setProfileOpen(false)}
                                        className="flex items-center justify-center rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
                                    >
                                        Create account
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}

                <main
                    className={
                        flush
                            ? "min-w-0 pb-0"
                            : "min-w-0 px-3 pb-8 pt-5 sm:px-5 sm:pt-7 lg:px-8 lg:pt-8"
                    }
                >
                    {children}
                </main>
            </div>
        </AccountContext.Provider>
    );
}
