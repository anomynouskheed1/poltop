// src/app/auth/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Mode = "LOGIN" | "SIGNUP";

const inputClass =
    "w-full rounded-xl bg-[#101614] border border-white/[0.06] px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-600 outline-none transition-colors focus:border-emerald-500/60 focus:bg-[#141b18]";

function EyeIcon({ open }: { open: boolean }) {
    return open ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
    );
}

export default function AuthPage() {
    const router = useRouter();

    const [mode, setMode] = useState<Mode>("LOGIN");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const isLogin = mode === "LOGIN";

    const changeMode = (next: Mode) => {
        if (next === mode) return;
        setMode(next);
        setErrorMessage(null);
        setSuccessMessage(null);
        setPassword("");
        setConfirmPassword("");
        setShowPassword(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password,
                });

                if (error) throw error;

                router.push("/dashboard ");
                router.refresh();
                return;
            }

            if (password !== confirmPassword) {
                throw new Error("Passwords do not match.");
            }

            const { data, error } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: { full_name: fullName.trim() },
                },
            });

            if (error) throw error;

            /*
             * Create the application profile.
             * The trading system uses separate DEMO and REAL balances.
             */
            if (data.user) {
                const { error: profileError } = await supabase
                    .from("profiles")
                    .upsert(
                        {
                            id: data.user.id,
                            email: data.user.email,
                            demo_balance: 10000,
                            real_balance: 0,
                        },
                        { onConflict: "id" }
                    );

                if (profileError) {
                    console.error("Profile creation error:", profileError);
                }
            }

            /*
             * If email confirmation is disabled, enter the dashboard
             * immediately. Otherwise show the confirmation message.
             */
            if (data.session) {
                router.push("/dashboard");
                router.refresh();
            } else {
                setSuccessMessage(
                    "Account created. Check your email to confirm your account."
                );
            }
        } catch (err: any) {
            setErrorMessage(
                err?.message || "Authentication failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setErrorMessage(null);
        setSuccessMessage(null);

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/` },
        });

        if (error) setErrorMessage(error.message);
    };

    const handleForgotPassword = async () => {
        setErrorMessage(null);
        setSuccessMessage(null);

        if (!email.trim()) {
            setErrorMessage("Enter your email above, then tap Forgot password.");
            return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(
            email.trim(),
            { redirectTo: `${window.location.origin}/auth` }
        );

        if (error) {
            setErrorMessage(error.message);
        } else {
            setSuccessMessage("Password reset link sent. Check your email.");
        }
    };

    return (
        <main className="min-h-screen bg-[#0a100e] text-white font-sans grid lg:grid-cols-2">
            {/* Left brand panel */}
            <section className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#050a08] px-20 py-20">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(ellipse 80% 45% at 40% 0%, rgba(16,185,129,0.14), transparent 70%)",
                    }}
                />

                <Link href="/" className="relative inline-flex items-center gap-3 w-fit">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_24px_rgba(16,185,129,0.35)]">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#04110c" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                            <polyline points="16 7 22 7 22 13" />
                        </svg>
                    </span>
                    <span className="text-[26px] font-semibold tracking-tight">
                        FX<span className="text-emerald-500">Trades</span>
                    </span>
                </Link>

                <div className="relative max-w-[640px]">
                    <h2 className="text-[56px] leading-[1.1] font-bold tracking-tight">
                        Trade with the tools and speed of an institutional desk.
                    </h2>

                    <p className="mt-8 max-w-[600px] text-xl leading-relaxed text-neutral-400">
                        Real markets. Instant payouts. Professional tools built for
                        traders who demand speed, precision and results.
                    </p>

                    <dl className="mt-16 flex gap-14">
                        {[
                            ["200+", "MARKETS"],
                            ["<25ms", "EXECUTION"],
                            ["24/7", "SYNTHETICS"],
                        ].map(([value, label]) => (
                            <div key={label}>
                                <dd className="font-mono text-[28px] font-semibold">{value}</dd>
                                <dt className="mt-2 text-sm tracking-widest text-neutral-500">
                                    {label}
                                </dt>
                            </div>
                        ))}
                    </dl>
                </div>
            </section>

            {/* Right form panel */}
            <section className="flex items-center justify-center bg-[#0b1210] px-6 py-10 sm:px-12">
                <div className="w-full max-w-[560px]">
                    {/* Mobile brand */}
                    <Link href="/" className="mb-8 inline-flex items-center gap-3 lg:hidden">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#04110c" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                                <polyline points="16 7 22 7 22 13" />
                            </svg>
                        </span>
                        <span className="text-2xl font-semibold tracking-tight">
                            Fx<span className="text-emerald-500">trades</span>
                        </span>
                    </Link>

                    {/* Tabs */}
                    <div
                        role="tablist"
                        className="grid grid-cols-2 rounded-full border border-white/[0.06] bg-[#101614] p-1"
                    >
                        {(
                            [
                                ["LOGIN", "Sign in"],
                                ["SIGNUP", "Create account"],
                            ] as [Mode, string][]
                        ).map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                role="tab"
                                aria-selected={mode === value}
                                onClick={() => changeMode(value)}
                                className={`rounded-full py-3.5 text-base font-medium transition-colors ${mode === value
                                    ? "bg-[#0a0f0d] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
                                    : "text-neutral-500 hover:text-neutral-300"
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Heading */}
                    <div className="mt-10">
                        <h1 className="text-[34px] font-bold tracking-tight">
                            {isLogin ? "Welcome back" : "Create your account"}
                        </h1>
                        <p className="mt-2 text-lg text-neutral-400">
                            {isLogin
                                ? "Sign in to your trading account."
                                : "Start trading in minutes — no KYC required."}
                        </p>
                    </div>

                    {/* Google */}
                    <button
                        type="button"
                        onClick={handleGoogle}
                        className="mt-8 flex w-full items-center justify-center gap-4 rounded-xl border border-white/[0.06] bg-[#0e1412] py-4 text-base font-medium transition-colors hover:bg-[#131a17]"
                    >
                        <GoogleIcon />
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="my-7 flex items-center gap-4">
                        <div className="h-px flex-1 bg-white/[0.07]" />
                        <span className="text-sm tracking-widest text-neutral-500">
                            {isLogin ? "OR SIGN IN WITH EMAIL" : "OR WITH EMAIL"}
                        </span>
                        <div className="h-px flex-1 bg-white/[0.07]" />
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {errorMessage && (
                            <div
                                role="alert"
                                className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-sm text-rose-300"
                            >
                                {errorMessage}
                            </div>
                        )}

                        {successMessage && (
                            <div
                                role="status"
                                className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300"
                            >
                                {successMessage}
                            </div>
                        )}

                        {!isLogin && (
                            <div>
                                <label htmlFor="fullName" className="mb-2.5 block text-base font-medium">
                                    Full name
                                </label>
                                <input
                                    id="fullName"
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    autoComplete="name"
                                    required
                                    className={inputClass}
                                />
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="mb-2.5 block text-base font-medium">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <div className="mb-2.5 flex items-center justify-between">
                                <label htmlFor="password" className="text-base font-medium">
                                    Password
                                </label>

                                {isLogin && (
                                    <button
                                        type="button"
                                        onClick={handleForgotPassword}
                                        className="text-sm text-emerald-500 transition-colors hover:text-emerald-400"
                                    >
                                        Forgot password?
                                    </button>
                                )}
                            </div>

                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete={isLogin ? "current-password" : "new-password"}
                                    required
                                    minLength={6}
                                    className={`${inputClass} pr-12`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-white"
                                >
                                    <EyeIcon open={showPassword} />
                                </button>
                            </div>
                        </div>

                        {!isLogin && (
                            <div>
                                <label htmlFor="confirmPassword" className="mb-2.5 block text-base font-medium">
                                    Confirm password
                                </label>
                                <input
                                    id="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                    required
                                    minLength={6}
                                    className={inputClass}
                                />
                            </div>
                        )}

                        {isLogin && (
                            <button
                                type="button"
                                role="checkbox"
                                aria-checked={rememberMe}
                                onClick={() => setRememberMe((v) => !v)}
                                className="flex items-center gap-3 text-base text-neutral-400"
                            >
                                <span
                                    className={`flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${rememberMe
                                        ? "border-emerald-500 bg-emerald-500"
                                        : "border-neutral-600 bg-transparent"
                                        }`}
                                >
                                    {rememberMe && (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#04110c" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </span>
                                Remember me for 30 days
                            </button>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-4 text-base font-semibold text-[#04110c] shadow-[0_8px_30px_rgba(16,185,129,0.25)] transition hover:from-emerald-400 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading
                                ? "Please wait..."
                                : isLogin
                                    ? "Sign in"
                                    : "Create account"}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm leading-relaxed text-neutral-500">
                        By continuing you agree to Fxtrades&apos;s Terms and
                        acknowledge our Privacy Policy.
                    </p>

                    <div className="mt-6 text-center">
                        <Link
                            href="/"
                            className="text-sm text-neutral-500 transition-colors hover:text-neutral-300"
                        >
                            Continue as guest
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}