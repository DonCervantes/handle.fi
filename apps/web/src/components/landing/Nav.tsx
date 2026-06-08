"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLang } from "../LangProvider";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const { lang, setLang, t } = useLang();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      style={{
        backgroundColor: scrolled ? "rgba(255,255,255,0.92)" : "transparent",
        borderBottom: scrolled ? "1px solid #E5E1DA" : "none",
        backdropFilter: scrolled ? "blur(16px)" : "none",
      }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Logo */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <Image
            src="/logo.png"
            alt="Handle.Fi"
            width={220}
            height={64}
            className="h-10 sm:h-14 w-auto object-contain"
            style={{ mixBlendMode: "multiply" }}
            priority
          />
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
          <a href="#platform" className="hover:text-white transition-colors">{t("nav_platform")}</a>
          <a href="#agents" className="hover:text-white transition-colors">{t("nav_agents")}</a>
          <a href="#security" className="hover:text-white transition-colors">{t("nav_security")}</a>
          <a href="#faq" className="hover:text-white transition-colors">{t("nav_faq")}</a>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Language switcher */}
          <div className="hidden md:flex items-center gap-0.5 bg-white/5 border border-white/10 rounded-lg p-0.5">
            {(["ES", "EN", "PT"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  lang === l
                    ? "bg-[#C9B79C] text-[#1A1A1A]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {l}
              </button>
            ))}
          </div>


          <Link
            href="/demo"
            className="px-3 sm:px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            {t("nav_demo")}
          </Link>
        </div>
      </div>
    </nav>
  );
}
