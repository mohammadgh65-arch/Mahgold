/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        card: "hsl(var(--card) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        accent: "hsl(var(--accent) / <alpha-value>)",
        "accent-foreground": "hsl(var(--accent-foreground) / <alpha-value>)",
        "muted-foreground": "hsl(var(--muted-foreground) / <alpha-value>)",
        gold: "hsl(var(--gold) / <alpha-value>)",
        "gold-deep": "hsl(var(--gold-deep) / <alpha-value>)",
        "gold-light": "hsl(var(--gold-light) / <alpha-value>)",
        ink: "hsl(var(--ink) / <alpha-value>)",
        "ink-foreground": "hsl(var(--ink-foreground) / <alpha-value>)",
        "ink-muted": "hsl(var(--ink-muted) / <alpha-value>)",
        sand: "hsl(var(--sand) / <alpha-value>)"
      },
      fontFamily: {
        sans: ["Shabnam", "Tahoma", "sans-serif"],
        serif: ["Cormorant Garamond", "Georgia", "serif"]
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(115deg, #9f722b 0%, #e7cc82 48%, #b4863d 100%)",
        "sand-gradient": "linear-gradient(145deg, #fbf7ed 0%, #eee5d4 100%)"
      },
      boxShadow: { gold: "0 8px 28px rgba(180, 134, 61, .22)" },
      keyframes: {
        rise: { "0%": { opacity: "0", transform: "translateY(14px)" }, "100%": { opacity: "1", transform: "translateY(0)" } }
      },
      animation: { rise: "rise .65s ease-out both" }
    }
  },
  plugins: []
};
