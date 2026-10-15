// src/app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, KeyRound, Shield, User } from "lucide-react";

import { AppShell, Avatar, useAccount } from "@/components/AppShell";

type Tab = "personal" | "security" | "referral";

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
    { id: "personal", label: "Personal info", icon: User },
    { id: "security", label: "Security", icon: KeyRound },
    { id: "referral", label: "Referral", icon: Shield },
];

// Set NEXT_PUBLIC_REFERRAL_BONUS in .env.local to show the bonus amount
const REFERRAL_BONUS = Number(process.env.NEXT_PUBLIC_REFERRAL_BONUS);

const card = "rounded-3xl border border-white/[0.06] bg-[#111a17]";
const inputClass =
    "w-full rounded-xl border border-white/[0.06] bg-[#0e1512] px-4 py-4 text-[17px] text-white placeholder:text-neutral-600 outline-none transition-colors focus:border-emerald-500/60 disabled:cursor-not-allowed disabled:text-neutral-500";
const labelClass = "mb-2.5 block text-base font-semibold";

function Notice({
    type,
    children,
}: {
    type: "error" | "success";
    children: React.ReactNode;
}) {
    return (
        <div
            role={type === "error" ? "alert" : "status"}
            className={`rounded-xl border px-4 py-3 text-sm ${type === "error"
                ? "border-rose-500/30 bg-rose-950/30 text-rose-300"
                : "border-emerald-500/30 bg-emerald-950/30 text-emerald-300"
                }`}
        >
            {children}
        </div>
    );
}

/* ---------------------------- Personal info ---------------------------- */

function PersonalInfo() {
    const { supabase, user, profile, reload } = useAccount();

    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [country, setCountry] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        setFullName(profile?.full_name ?? user?.metaName ?? "");
        setPhone(profile?.phone ?? "");
        setCountry(profile?.country ?? "");
    }, [profile, user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const { error: updateError } = await supabase
                .from("profiles")
                .update({
                    full_name: fullName.trim(),
                    phone: phone.trim() || null,
                    country: country.trim() || null,
                })
                .eq("id", user.id);

            if (updateError) throw updateError;

            await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
            await reload();
            setSuccess("Your details have been saved.");
        } catch (err: any) {
            setError(err?.message || "Could not save your changes. Try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave} className={`${card} space-y-6 p-6 sm:p-9`}>
            {error && <Notice type="error">{error}</Notice>}
            {success && <Notice type="success">{success}</Notice>}

            <div>
                <label htmlFor="fullName" className={labelClass}>
                    Full name
                </label>
                <input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    required
                    className={inputClass}
                />
            </div>

            <div>
                <label htmlFor="email" className={labelClass}>
                    Email
                </label>
                <input
                    id="email"
                    value={user?.email ?? ""}
                    disabled
                    className={inputClass}
                />
            </div>

            <div>
                <label htmlFor="phone" className={labelClass}>
                    Phone
                </label>
                <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254 7XX XXX XXX"
                    autoComplete="tel"
                    className={inputClass}
                />
            </div>

            <div>
                <label htmlFor="country" className={labelClass}>
                    Country
                </label>
                <input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. Kenya"
                    autoComplete="country-name"
                    className={inputClass}
                />
            </div>

            <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-7 py-4 text-base font-semibold text-[#04110c] shadow-[0_6px_24px_rgba(16,185,129,0.25)] transition hover:from-emerald-400 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {saving ? "Saving..." : "Save changes"}
            </button>
        </form>
    );
}

/* ------------------------------- Security ------------------------------ */

function Security() {
    const { supabase, user } = useAccount();
    const router = useRouter();

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (password !== confirm) {
            setError("Passwords do not match.");
            return;
        }

        setSaving(true);
        const { error: updateError } = await supabase.auth.updateUser({ password });
        setSaving(false);

        if (updateError) {
            setError(updateError.message);
            return;
        }

        setPassword("");
        setConfirm("");
        setSuccess("Your password has been updated.");
    };

    const signOutEverywhere = async () => {
        await supabase.auth.signOut({ scope: "global" });
        router.push("/auth");
        router.refresh();
    };

    const lastSignIn = user?.lastSignInAt
        ? new Date(user.lastSignInAt).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
        })
        : null;

    return (
        <div className="space-y-6">
            <form onSubmit={handleChange} className={`${card} space-y-6 p-6 sm:p-9`}>
                <h2 className="text-xl font-bold">Change password</h2>

                {error && <Notice type="error">{error}</Notice>}
                {success && <Notice type="success">{success}</Notice>}

                <div>
                    <label htmlFor="newPassword" className={labelClass}>
                        New password
                    </label>
                    <input
                        id="newPassword"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        minLength={6}
                        required
                        className={inputClass}
                    />
                </div>

                <div>
                    <label htmlFor="confirmPassword" className={labelClass}>
                        Confirm password
                    </label>
                    <input
                        id="confirmPassword"
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        autoComplete="new-password"
                        minLength={6}
                        required
                        className={inputClass}
                    />
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-7 py-4 text-base font-semibold text-[#04110c] transition hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-60"
                >
                    {saving ? "Updating..." : "Update password"}
                </button>
            </form>

            <div
                className={`${card} flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-9`}
            >
                <div>
                    <h2 className="text-xl font-bold">Sign out everywhere</h2>
                    <p className="mt-1 text-neutral-400">
                        {lastSignIn
                            ? `Last sign-in: ${lastSignIn}.`
                            : "End all active sessions on every device."}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={signOutEverywhere}
                    className="rounded-xl border border-white/[0.08] bg-[#0e1512] px-6 py-3.5 font-semibold hover:bg-[#141d19]"
                >
                    Sign out of all devices
                </button>
            </div>
        </div>
    );
}

/* ------------------------------- Referral ------------------------------ */

function Referral() {
    const { supabase, user, referralCode, currency } = useAccount();

    const [origin, setOrigin] = useState("");
    const [friends, setFriends] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    useEffect(() => {
        if (!user) return;
        supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("referred_by", user.id)
            .then(({ count }) => setFriends(count ?? 0));
    }, [supabase, user]);

    const link =
        origin && referralCode ? `${origin}/auth?ref=${referralCode}` : "";

    const copyLink = async () => {
        if (!link) return;
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* clipboard unavailable */
        }
    };

    return (
        <div className={`${card} space-y-6 p-6 sm:p-9`}>
            <div>
                <h2 className="text-xl font-bold">Your referral link</h2>
                <p className="mt-1.5 text-neutral-400">
                    Share your link. When a friend signs up and makes their first
                    deposit
                    {Number.isFinite(REFERRAL_BONUS)
                        ? `, you get ${currency} ${REFERRAL_BONUS} credited instantly.`
                        : ", you both get rewarded."}
                </p>
            </div>

            {link ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="min-w-0 flex-1 truncate rounded-xl border border-white/[0.05] bg-black/20 px-4 py-3.5 font-mono text-[15px]">
                        {link}
                    </div>
                    <button
                        type="button"
                        onClick={copyLink}
                        className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[#0e1512] px-5 py-3.5 font-semibold hover:bg-[#141d19]"
                    >
                        {copied ? <Check size={17} className="text-emerald-400" /> : <Copy size={17} />}
                        {copied ? "Copied" : "Copy"}
                    </button>
                </div>
            ) : (
                <p className="text-neutral-500">
                    Your referral code isn&apos;t available yet.
                </p>
            )}

            <dl className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/[0.05] bg-black/20 p-5">
                    <dt className="text-sm text-neutral-400">Friends referred</dt>
                    <dd className="mt-2 font-mono text-3xl font-bold">
                        {friends ?? "—"}
                    </dd>
                </div>
                <div className="rounded-2xl border border-white/[0.05] bg-black/20 p-5">
                    <dt className="text-sm text-neutral-400">Your code</dt>
                    <dd className="mt-2 font-mono text-3xl font-bold">
                        {referralCode || "—"}
                    </dd>
                </div>
            </dl>
        </div>
    );
}

/* --------------------------------- Page -------------------------------- */

function ProfileContent() {
    const { user, profile, displayName } = useAccount();
    const [tab, setTab] = useState<Tab>("personal");

    const role = profile?.role ? String(profile.role) : "Trader";

    return (
        <>
            <h1 className="text-4xl font-bold tracking-tight">Profile</h1>
            <p className="mt-1 text-lg text-neutral-400">
                Manage your account details and security.
            </p>

            {/* Identity card */}
            <section className={`${card} mt-8 flex items-center gap-5 p-6 sm:gap-7 sm:p-9`}>
                <Avatar name={displayName} size={96} />
                <div className="min-w-0">
                    <h2 className="truncate text-2xl font-bold">{displayName}</h2>
                    <p className="truncate text-lg text-neutral-400">{user?.email}</p>
                    <span className="mt-2.5 inline-block rounded-full bg-white/[0.08] px-3.5 py-1 text-sm font-semibold capitalize">
                        {role}
                    </span>
                </div>
            </section>

            {/* Tabs */}
            <div
                role="tablist"
                className="mt-6 grid grid-cols-3 rounded-full border border-white/[0.06] bg-[#111a17] p-1.5"
            >
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={tab === id}
                        onClick={() => setTab(id)}
                        className={`flex items-center justify-center gap-2.5 rounded-full py-3.5 text-base font-semibold transition-colors ${tab === id
                            ? "bg-[#0c1411] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                            : "text-neutral-500 hover:text-neutral-300"
                            }`}
                    >
                        <Icon size={17} />
                        <span className="hidden sm:inline">{label}</span>
                        <span className="sm:hidden">{label.split(" ")[0]}</span>
                    </button>
                ))}
            </div>

            <div className="mt-6">
                {tab === "personal" && <PersonalInfo />}
                {tab === "security" && <Security />}
                {tab === "referral" && <Referral />}
            </div>
        </>
    );
}

export default function ProfilePage() {
    return (
        <AppShell>
            <ProfileContent />
        </AppShell>
    );
}