
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { CandlestickChart, Eye, EyeOff, X } from "lucide-react";

type AuthMode = "LOGIN" | "SIGNUP";

type TradeAuthModalProps = {
    open: boolean;
    onClose: () => void;
    initialMode?: AuthMode;
    onAuthenticated?: () => void;
};

const inputClass =
    "w-full rounded-xl border border-white/[0.08] bg-[#101614] px-4 py-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-emerald-500/60";

export default function TradeAuthModal({
    open,
    onClose,
    initialMode = "LOGIN",
    onAuthenticated,
}: TradeAuthModalProps) {
    const [mode, setMode] = useState<AuthMode>(initialMode);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const isLogin = mode === "LOGIN";

    useEffect(() => {
        if (!open) return;

        setMode(initialMode);
        setErrorMessage("");
        setSuccessMessage("");

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !loading) onClose();
        };

        window.addEventListener("keydown", onKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [open, initialMode, onClose, loading]);

    function changeMode(nextMode: AuthMode) {
        setMode(nextMode);
        setErrorMessage("");
        setSuccessMessage("");
        setPassword("");
        setConfirmPassword("");
        setShowPassword(false);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");

        if (!isLogin && password !== confirmPassword) {
            setErrorMessage("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password,
                });

                if (error) throw error;

                onClose();
                onAuthenticated?.();
                return;
            }

            const { data, error } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: { full_name: fullName.trim() },
                    emailRedirectTo: `${window.location.origin}/trade`,
                },
            });

            if (error) throw error;

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
                    throw new Error(
                        "Your account was created, but its profile could not be initialized. Please contact support before trading."
                    );
                }
            }

            if (data.session) {
                onClose();
                onAuthenticated?.();
            } else {
                setSuccessMessage(
                    "Your account has been created. Check your email to confirm your address, then sign in."
                );
                setMode("LOGIN");
                setPassword("");
                setConfirmPassword("");
            }
        } catch (error: unknown) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Authentication failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogle() {
        setErrorMessage("");
        setSuccessMessage("");
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/trade`,
                },
            });

            if (error) throw error;
        } catch (error: unknown) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to continue with Google."
            );
            setLoading(false);
        }
    }

    async function handleForgotPassword() {
        setErrorMessage("");
        setSuccessMessage("");

        if (!email.trim()) {
            setErrorMessage("Enter your email address first.");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(
                email.trim(),
                { redirectTo: `${window.location.origin}/auth` }
            );

            if (error) throw error;

            setSuccessMessage("Password reset link sent. Check your email.");
        } catch (error: unknown) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to send the password reset email."
            );
        } finally {
            setLoading(false);
        }
    }

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md sm:p-5"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !loading) onClose();
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="trade-auth-title"
                className="relative flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b110e] shadow-2xl sm:rounded-3xl"
            >
                <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    aria-label="Close authentication"
                    className="absolute right-3 top-3 z-10 rounded-lg p-2 text-neutral-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                    <X size={20} />
                </button>

                <div className="overflow-y-auto p-5 sm:p-7">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                        <CandlestickChart size={25} />
                    </div>

                    <h2
                        id="trade-auth-title"
                        className="text-2xl font-bold tracking-tight text-white"
                    >
                        {isLogin ? "Welcome back" : "Create your account"}
                    </h2>

                    <p className="mt-2 pr-5 text-sm leading-6 text-neutral-400">
                        {isLogin
                            ? "Sign in to place trades and manage your account. Your market screen will stay right here."
                            : "Create an account to start trading. You can continue exploring the market after closing this window."}
                    </p>

                    <div
                        role="tablist"
                        aria-label="Authentication method"
                        className="mt-6 grid grid-cols-2 rounded-xl border border-white/[0.06] bg-[#101614] p-1"
                    >
                        {(
                            [
                                ["LOGIN", "Sign in"],
                                ["SIGNUP", "Create account"],
                            ] as [AuthMode, string][]
                        ).map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                role="tab"
                                aria-selected={mode === value}
                                onClick={() => changeMode(value)}
                                className={`rounded-lg px-2 py-2.5 text-sm font-semibold transition ${mode === value
                                        ? "bg-emerald-500 text-[#04110c]"
                                        : "text-neutral-400 hover:text-white"
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => void handleGoogle()}
                        disabled={loading}
                        className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.07] disabled:opacity-50"
                    >
                        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="my-5 flex items-center gap-3">
                        <div className="h-px flex-1 bg-white/[0.08]" />
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                            or use email
                        </span>
                        <div className="h-px flex-1 bg-white/[0.08]" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {errorMessage && (
                            <div
                                role="alert"
                                className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-3 text-sm leading-5 text-rose-300"
                            >
                                {errorMessage}
                            </div>
                        )}

                        {successMessage && (
                            <div
                                role="status"
                                className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-3 text-sm leading-5 text-emerald-300"
                            >
                                {successMessage}
                            </div>
                        )}

                        {!isLogin && (
                            <div>
                                <label
                                    htmlFor="trade-auth-name"
                                    className="mb-2 block text-sm font-medium text-neutral-200"
                                >
                                    Full name
                                </label>
                                <input
                                    id="trade-auth-name"
                                    type="text"
                                    autoComplete="name"
                                    value={fullName}
                                    onChange={(event) => setFullName(event.target.value)}
                                    required
                                    className={inputClass}
                                    placeholder="Your full name"
                                />
                            </div>
                        )}

                        <div>
                            <label
                                htmlFor="trade-auth-email"
                                className="mb-2 block text-sm font-medium text-neutral-200"
                            >
                                Email address
                            </label>
                            <input
                                id="trade-auth-email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                required
                                className={inputClass}
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <label
                                    htmlFor="trade-auth-password"
                                    className="text-sm font-medium text-neutral-200"
                                >
                                    Password
                                </label>
                                {isLogin && (
                                    <button
                                        type="button"
                                        onClick={() => void handleForgotPassword()}
                                        disabled={loading}
                                        className="text-xs font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                                    >
                                        Forgot password?
                                    </button>
                                )}
                            </div>

                            <div className="relative">
                                <input
                                    id="trade-auth-password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete={isLogin ? "current-password" : "new-password"}
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    required
                                    minLength={6}
                                    className={`${inputClass} pr-12`}
                                    placeholder={isLogin ? "Your password" : "At least 6 characters"}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((value) => !value)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-400 hover:text-white"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {!isLogin && (
                            <div>
                                <label
                                    htmlFor="trade-auth-confirm-password"
                                    className="mb-2 block text-sm font-medium text-neutral-200"
                                >
                                    Confirm password
                                </label>
                                <input
                                    id="trade-auth-confirm-password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                    required
                                    minLength={6}
                                    className={inputClass}
                                    placeholder="Enter your password again"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-emerald-500 px-4 py-3.5 text-sm font-bold text-[#04110c] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading
                                ? "Please wait..."
                                : isLogin
                                    ? "Sign in and continue"
                                    : "Create account"}
                        </button>
                    </form>

                    <p className="mt-5 text-center text-xs leading-5 text-neutral-500">
                        Authentication happens securely through your existing Supabase
                        project. You can close this window and continue viewing the market.
                    </p>
                </div>
            </section>
        </div>
    );
}
