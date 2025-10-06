import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        player: {
          light: "#4ade80",
          dark: "#166534",
        },
        ai: {
          light: "#60a5fa",
          dark: "#1d4ed8",
        },
        neutral: {
          light: "#f3f4f6",
          dark: "#1f2937",
        },
      },
      keyframes: {
        conquer: {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "50%": { transform: "scale(1.05)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(147, 197, 253, 0.6)" },
          "50%": { boxShadow: "0 0 0 6px rgba(147, 197, 253, 0)" },
        },
      },
      animation: {
        conquer: "conquer 300ms ease-out",
        pulseGlow: "pulseGlow 1.2s ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
