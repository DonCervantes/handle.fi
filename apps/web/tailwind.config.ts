import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", "html.light"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdf4",
          500: "#22c55e",
          600: "#16a34a",
          900: "#14532d",
        },
      },
    },
  },
  plugins: [],
};

export default config;
