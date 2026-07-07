import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#fffdf9",
        ink: "#111111",
        muted: "#66615b",
        line: "#e8e1d8",
        forge: "#ff7514",
        "forge-soft": "#ffe0ca",
      },
      boxShadow: {
        card: "0 18px 54px rgba(17, 17, 17, 0.06)",
        hero: "0 24px 80px rgba(17, 17, 17, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
