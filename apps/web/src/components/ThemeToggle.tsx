"use client";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        theme === "light" ? "bg-[#1A1A1A]" : "bg-[#2A2A2A]"
      }`}
    >
      <span
        className={`inline-flex h-4 w-4 items-center justify-center rounded-full shadow transition-transform ${
          theme === "light"
            ? "translate-x-6 bg-[#F5F2EC]"
            : "translate-x-1 bg-[#C9B79C]"
        }`}
      >
        <span className="text-[9px]">{theme === "light" ? "☀️" : "🌙"}</span>
      </span>
    </button>
  );
}
