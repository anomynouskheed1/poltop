// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    black: "#0A0A0A",
                    card: "#121212",
                    border: "#27272A",
                    white: "#FAFAFA",
                    muted: "#A1A1AA",
                    red: "#EF4444",
                    redDark: "#991B1B",
                    green: "#22C55E",
                    greenDark: "#166534",
                },
            },
        },
    },
    plugins: [],
};

export default config;