"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";

/* ================= CONFIG: edit content here only ================= */
const BRAND = { first: "Fx", second: "Trades" };
const AUTH_HREF = "/auth";

const navLinks = [
  { label: "Markets", href: "#markets" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" }, // points at the CTA section id below
];

const hero = {
  badge: "Live markets · Real-time pricing",
  titleLead: "Trade global markets with",
  titleAccent: "professional precision.",
  text: `Join thousands of traders who profit daily on ${BRAND.first}${BRAND.second} — real-time forex, synthetic indices, crypto, commodities and stocks. Instant funding, lightning-fast execution, and payouts straight to your phone in minutes. Your edge starts here.`,
  primaryCta: "Open free account",
  secondaryCta: "Sign in",
};

const stats = [
  { value: "200+", label: "Markets" },
  { value: "<25ms", label: "Avg. execution" },
  { value: "99.99%", label: "Uptime" },
];

// change = % vs. open. Live ticks move relative to the open, so initial values match the design.
const ticker = [
  { symbol: "EUR/USD", price: 1.08772, change: 0.11, decimals: 5 },
  { symbol: "BTC/USD", price: 67356.875, change: -0.08, decimals: 3 },
  { symbol: "XAU/USD", price: 2343.783, change: -0.09, decimals: 3 },
  { symbol: "Volatility 75", price: 3894.126, change: 0.05, decimals: 3 },
  { symbol: "AAPL", price: 187.308, change: -0.05, decimals: 3 },
];

const marketsSection = {
  title: "Every market, one platform.",
  subtitle: "Diversify across asset classes from a single account with unified margin.",
};

const markets = [
  { name: "Synthetic Indices", description: "24/7 simulated markets", icon: "bars", value: "20+" },
  { name: "Volatility Indices", description: "Constant volatility exposure", icon: "trend", value: "15+" },
  { name: "Commodities", description: "Gold, silver, oil & more", icon: "chart", value: "12+" },
  { name: "Cryptocurrency", description: "BTC, ETH and top altcoins", icon: "bolt", value: "30+" },
  { name: "Stocks & Indices", description: "Global blue-chip equities", icon: "bars", value: "100+" },
];

const featuresSection = {
  title: "Built for traders who care about execution.",
  subtitle:
    "Every detail — from chart rendering to order routing — is engineered to feel fast, calm and trustworthy.",
};

const features = [
  {
    title: "Instant funding",
    text: "Top up your account in seconds via mobile money or bank — funds reflect immediately.",
    icon: "bolt",
  },
  {
    title: "Pro-grade charts",
    text: "Candlestick charts, multiple timeframes and technical indicators built in.",
    icon: "chart",
  },
  {
    title: "Bank-level security",
    text: "Encrypted sessions, secure authentication and full activity logging.",
    icon: "shield",
  },
  {
    title: "Mobile-first",
    text: "A premium experience on every device — trade from anywhere.",
    icon: "phone",
  },
];

const btcCard = { symbol: "BTC/USD", price: 67374.351, change: -34.26, decimals: 3 };
// chart y-values (0 = top, 125 = bottom) traced from the design
const chartPoints = [88, 70, 79, 53, 62, 36, 48, 17, 29, 8, 21];

const cta = {
  title: "Ready to trade smarter?",
  text: "Create an account in minutes. No KYC required to start — deposit and begin trading instantly.",
  button: "Open your account",
};

const footerNote = "All rights reserved. Trading involves risk.";

/* ================= Icons (inline, no extra deps) ================= */
const iconPaths: Record<string, ReactNode> = {
  trend: (
    <>
      <path d="M22 7l-8.5 8.5-5-5L2 17" />
      <path d="M16 7h6v6" />
    </>
  ),
  bars: (
    <>
      <path d="M3 3v18h18" />
      <path d="M18 17V9M13 17V5M8 17v-3" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v18h18" />
      <path d="M19 9l-5 5-4-4-3 3" />
    </>
  ),
  bolt: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  shield: (
    <>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M12 18h.01" />
    </>
  ),
  wallet: (
    <>
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </>
  ),
  arrow: <path d="M5 12h14M12 5l7 7-7 7" />,
};

function Icon({ name, className = "h-4 w-4" }: { name: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {iconPaths[name]}
    </svg>
  );
}

/* ================= Small pieces ================= */
function Logo({ small = false, onClick }: { small?: boolean; onClick?: () => void }) {
  return (
    <Link href="/" onClick={onClick} className="flex items-center gap-2.5">
      <span
        className={`flex items-center justify-center rounded-full bg-emerald-400 text-[#052018] shadow-[0_0_18px_rgba(0,217,151,0.35)] ${small ? "h-6 w-6" : "h-8 w-8"
          }`}
      >
        <Icon name="trend" className={small ? "h-3 w-3" : "h-4 w-4"} />
      </span>
      <span className={`font-bold tracking-tight ${small ? "text-[15px]" : "text-[18px]"}`}>
        {BRAND.first}
        <span className="text-emerald-400">{BRAND.second}</span>
      </span>
    </Link>
  );
}

function AreaChart({ points }: { points: number[] }) {
  const w = 400;
  const h = 125;
  const step = w / (points.length - 1);
  const line = points.map((y, i) => `${i === 0 ? "M" : "L"}${i * step} ${y}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-[125px] w-full">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00d897" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#00d897" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w} ${h} L0 ${h} Z`} fill="url(#areaFill)" />
      <path d={line} fill="none" stroke="#00d897" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* ================= Page ================= */
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [prices, setPrices] = useState(ticker.map((t) => t.price));
  const [btc, setBtc] = useState(btcCard.price);

  // simulated ticks so the previews feel live (swap for your real feed)
  useEffect(() => {
    const nudge = (p: number) => p * (1 + (Math.random() - 0.5) * 0.0004);
    const id = setInterval(() => {
      setPrices((prev) => prev.map(nudge));
      setBtc(nudge);
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const btcOpen = btcCard.price - btcCard.change;
  const btcChange = btc - btcOpen;
  const btcPct = (btcChange / btcOpen) * 100;

  const btnPrimary =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-500 font-medium text-[#04261c] shadow-[0_0_30px_rgba(0,217,151,0.28)] transition hover:brightness-110";
  const btnGhost =
    "inline-flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] font-medium text-white/90 transition hover:bg-white/[0.07]";
  const card =
    "rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#14201c] to-[#0d1512]";
  const iconBox = "flex items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400";

  return (
    <main className="min-h-screen bg-[#09110f] text-white selection:bg-emerald-400 selection:text-black">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[700px] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_30%_0%,rgba(0,217,151,0.12),transparent_70%)]" />
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-emerald-400/15 bg-[#09110f]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5">
          <Logo onClick={() => setMenuOpen(false)} />

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
            {navLinks.map((l) => (
              <a key={l.label} href={l.href} className="text-sm text-white/55 transition hover:text-white">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <Link href={AUTH_HREF} className="text-xs font-medium text-white/85 transition hover:text-white">
              Sign in
            </Link>
            <Link
              href={AUTH_HREF}
              className="rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-[#04261c] shadow-[0_0_20px_rgba(0,217,151,0.3)] transition hover:bg-emerald-400"
            >
              Get started
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/80 md:hidden"
            aria-label="Open menu"
          >
            <span className="flex flex-col gap-[4px]">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-[1.5px] w-4 bg-current" />
              ))}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <aside className="absolute right-0 top-0 h-full w-[84%] max-w-sm border-l border-white/10 bg-[#09110f] p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <Logo onClick={() => setMenuOpen(false)} />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-xl leading-none text-white/70"
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            <div className="mt-10 space-y-1">
              {navLinks.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-4 py-4 text-sm font-medium text-white/80 transition hover:bg-white/5"
                >
                  {l.label}
                </a>
              ))}
            </div>

            <div className="mt-8 space-y-3 border-t border-white/[0.06] pt-6">
              <Link
                href={AUTH_HREF}
                onClick={() => setMenuOpen(false)}
                className={`${btnGhost} w-full px-4 py-3 text-sm`}
              >
                Sign in
              </Link>
              <Link
                href={AUTH_HREF}
                onClick={() => setMenuOpen(false)}
                className={`${btnPrimary} w-full px-4 py-3 text-sm`}
              >
                Get started
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* Hero */}
      <section className="relative z-10">
        <div className="mx-auto max-w-7xl px-5 pb-24 pt-14 lg:pt-20">
          <div className="grid items-start gap-12 lg:grid-cols-[1fr_373px] lg:gap-16">
            <div className="lg:pt-4">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-1 text-[11px] font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#00d897]" />
                {hero.badge}
              </div>

              <h1 className="max-w-2xl text-5xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                {hero.titleLead} <span className="text-emerald-400">{hero.titleAccent}</span>
              </h1>

              <p className="mt-7 max-w-[38rem] text-base leading-[1.65] text-white/50 sm:text-[17px]">
                {hero.text}
              </p>

              <div className="mt-8 flex flex-wrap gap-2.5">
                <Link href={AUTH_HREF} className={`${btnPrimary} h-11 px-6 text-sm`}>
                  {hero.primaryCta} <Icon name="arrow" className="h-3.5 w-3.5" />
                </Link>
                <Link href={AUTH_HREF} className={`${btnGhost} h-11 px-5 text-sm`}>
                  {hero.secondaryCta}
                </Link>
              </div>

              <div className="mt-12 grid max-w-[480px] grid-cols-3 gap-y-6">
                {stats.map((s) => (
                  <div key={s.label}>
                    <p className="font-mono text-2xl font-semibold tracking-tight">{s.value}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-white/40">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Live markets */}
            <div className={`${card} p-5 shadow-2xl`}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
                  Live markets
                </p>
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#00d897]" />
              </div>

              <ul>
                {ticker.map((t, i) => {
                  const open = t.price / (1 + t.change / 100);
                  const pct = (prices[i] / open - 1) * 100;
                  const up = pct >= 0;
                  return (
                    <li key={t.symbol} className="flex items-center justify-between py-3.5 text-sm">
                      <span className="font-medium">{t.symbol}</span>
                      <span className="flex items-center gap-5 font-mono">
                        <span className="text-white/90">{prices[i].toFixed(t.decimals)}</span>
                        <span className={`w-14 text-right text-[11px] ${up ? "text-emerald-400" : "text-red-400"}`}>
                          {up ? "+" : ""}
                          {pct.toFixed(2)}%
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Markets */}
      <section id="markets" className="relative z-10 scroll-mt-16">
        <div className="mx-auto max-w-7xl px-5 pb-20 pt-4">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{marketsSection.title}</h2>
          <p className="mt-3 text-sm text-white/45 sm:text-base">{marketsSection.subtitle}</p>

          <div className="mt-10 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {markets.map((m) => (
              <div
                key={m.name}
                className={`${card} p-5 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/20`}
              >
                <div className="flex items-start justify-between">
                  <div className={`${iconBox} h-10 w-10`}>
                    <Icon name={m.icon} />
                  </div>
                  <span className="font-mono text-[11px] text-white/35">{m.value}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{m.name}</h3>
                <p className="mt-1 text-sm text-white/40">{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 scroll-mt-16">
        <div className="mx-auto max-w-7xl px-5 py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="max-w-lg text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                {featuresSection.title}
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-white/45 sm:text-base">
                {featuresSection.subtitle}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {features.map((f) => (
                  <div key={f.title} className={`${card} p-[18px]`}>
                    <span className="text-emerald-400">
                      <Icon name={f.icon} />
                    </span>
                    <h3 className="mt-4 text-sm font-semibold">{f.title}</h3>
                    <p className="mt-1.5 text-xs leading-5 text-white/40">{f.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* BTC chart card */}
            <div className="rounded-3xl border border-white/[0.06] bg-[#0b1411] p-2.5 shadow-2xl">
              <div className="overflow-hidden rounded-2xl border border-white/[0.04] bg-gradient-to-b from-[#12201b] to-[#0d1512] p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] tracking-wider text-white/40">{btcCard.symbol}</p>
                    <p className="mt-1 font-mono text-3xl font-semibold tracking-tight">
                      {btc.toFixed(btcCard.decimals)}
                    </p>
                    <p className={`mt-1 font-mono text-xs ${btcChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {btcChange >= 0 ? "+" : ""}
                      {btcChange.toFixed(2)} ({btcPct >= 0 ? "+" : ""}
                      {btcPct.toFixed(2)}%)
                    </p>
                  </div>
                  <span className="text-emerald-500/80">
                    <Icon name="wallet" className="h-7 w-7" />
                  </span>
                </div>
                <div className="mt-6">
                  <AreaChart points={chartPoints} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA (also the target of the "Pricing" nav link) */}
      <section id="pricing" className="relative z-10 scroll-mt-16">
        <div className="mx-auto max-w-7xl px-5 py-20">
          <div className="rounded-3xl border border-emerald-400/10 bg-gradient-to-b from-[#12221c] to-[#0b1411] px-6 py-16 text-center sm:px-10">
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">{cta.title}</h2>
            <p className="mx-auto mt-4 max-w-[34rem] text-sm leading-6 text-white/45 sm:text-base">
              {cta.text}
            </p>
            <Link href={AUTH_HREF} className={`${btnPrimary} mt-7 h-11 px-6 text-sm`}>
              {cta.button} <Icon name="arrow" className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <Logo small />
          <p>
            © {new Date().getFullYear()} {BRAND.first}
            {BRAND.second}. {footerNote}
          </p>
        </div>
      </footer>
    </main>
  );
}