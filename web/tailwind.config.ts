import type { Config } from "tailwindcss";

// Amelya's design tokens — the single Tailwind encoding of web/DESIGN.md §3.
// Brand palette values are fixed hex (DESIGN.md §3.1); the shadcn/ui semantic
// tokens (background/foreground/primary/...) are CSS variables set in
// app/globals.css so shadcn primitives theme to the brand for free.
const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- Amelya's brand palette (DESIGN.md §3.1) ---
        gold: { DEFAULT: "#a9824b", deep: "#8a6a3a", light: "#c7a268" },
        ink: { DEFAULT: "#2b2723", muted: "#6f685c" },
        cream: { DEFAULT: "#f5f0e4", soft: "#faf7ef" },
        panel: "#fbf8f1",
        line: "#e3dccb",
        sage: { DEFAULT: "#3d4a38", deep: "#2f3a2b" },
        blush: "#ecd9d2",
        // stock states
        "stock-low-bg": "#f3e3c2",
        "stock-low-fg": "#8a5a00",
        "stock-out-bg": "#e6e1d6",
        "stock-out-fg": "#6f685c",
        "state-success-bg": "#4b7a52",
        "state-danger-bg": "#9c4a3c",
        // --- shadcn/ui semantic tokens (themed via CSS vars) ---
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        // DESIGN.md §3.2 — Cinzel (display), Cormorant (editorial), Jost (UI)
        display: ["var(--font-cinzel)", "serif"],
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-jost)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // DESIGN.md §3.2 type scale
        xs: ["0.75rem", { lineHeight: "1.4" }],
        sm: ["0.875rem", { lineHeight: "1.5" }],
        base: ["1rem", { lineHeight: "1.6" }],
        lg: ["1.125rem", { lineHeight: "1.6" }],
        xl: ["1.375rem", { lineHeight: "1.15" }],
        "2xl": ["1.75rem", { lineHeight: "1.15" }],
        "3xl": ["2.5rem", { lineHeight: "1.15" }],
        "4xl": ["3.25rem", { lineHeight: "1.1" }],
      },
      borderRadius: {
        // DESIGN.md §3.3 — brand leans low-radius/editorial
        sm: "4px",
        md: "8px",
        lg: "12px",
        pill: "9999px",
      },
      boxShadow: {
        "elev-sm": "0 1px 2px rgba(43,39,35,.06)",
        "elev-md": "0 6px 22px rgba(43,39,35,.07)",
      },
      maxWidth: {
        content: "1200px",
      },
      letterSpacing: {
        eyebrow: "0.24em",
        caps: "0.16em",
        wordmark: "0.16em",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
