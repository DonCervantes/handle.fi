"use client";
import { createContext, useContext, useState } from "react";

type Lang = "ES" | "EN" | "PT";

const translations = {
  ES: {
    nav_platform: "Platform",
    nav_agents: "Agents",
    nav_security: "Seguridad",
    nav_faq: "FAQ",
    nav_demo: "Ver Demo",
    hero_badge: "Construido para empresas en LatAm · Arbitrum · Privy · Bitso · EtherFuse",
    hero_h1a: "Las finanzas de tu empresa,",
    hero_h1b: "en automático.",
    hero_sub: "Agentes de IA que ejecutan nómina, pagos a proveedores, cobranza y contabilidad. Web3 invisible. Construido para empresas en LatAm.",
    hero_cta1: "Solicitar demo →",
    hero_cta2: "Ver cómo funciona",
  },
  EN: {
    nav_platform: "Platform",
    nav_agents: "Agents",
    nav_security: "Security",
    nav_faq: "FAQ",
    nav_demo: "See Demo",
    hero_badge: "Built for LatAm companies · Arbitrum · Privy · Bitso · EtherFuse",
    hero_h1a: "Your company's finances,",
    hero_h1b: "on autopilot.",
    hero_sub: "AI agents that execute payroll, vendor payments, collections and accounting. Invisible Web3. Built for LatAm companies operating in multiple currencies.",
    hero_cta1: "Request demo →",
    hero_cta2: "See how it works",
  },
  PT: {
    nav_platform: "Plataforma",
    nav_agents: "Agentes",
    nav_security: "Segurança",
    nav_faq: "FAQ",
    nav_demo: "Ver Demo",
    hero_badge: "Construído para empresas na LatAm · Arbitrum · Privy · Bitso · EtherFuse",
    hero_h1a: "As finanças da sua empresa,",
    hero_h1b: "no automático.",
    hero_sub: "Agentes de IA que executam folha de pagamento, pagamentos a fornecedores, cobranças e contabilidade. Web3 invisível. Construído para empresas na LatAm.",
    hero_cta1: "Solicitar demo →",
    hero_cta2: "Ver como funciona",
  },
};

type TranslationKey = keyof typeof translations.ES;

const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}>({
  lang: "ES",
  setLang: () => {},
  t: (k) => translations.ES[k],
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("ES");
  const t = (key: TranslationKey) => translations[lang][key] ?? translations.ES[key];
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
