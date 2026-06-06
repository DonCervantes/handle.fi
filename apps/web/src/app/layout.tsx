import type { Metadata } from "next";
import "./globals.css";
import { PrivyWrapper } from "@/components/PrivyWrapper";
import { LangProvider } from "@/components/LangProvider";

export const metadata: Metadata = {
  title: "Handle.Fi — Las finanzas de tu empresa, en automático",
  description:
    "Agentes de IA que ejecutan nómina, pagos a proveedores, cobranza y contabilidad. Construido para empresas en LatAm.",
  openGraph: {
    title: "Handle.Fi",
    description: "La plataforma financiera con agentes de IA para empresas en LatAm.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="light">
      <body>
        <LangProvider>
          <PrivyWrapper>{children}</PrivyWrapper>
        </LangProvider>
      </body>
    </html>
  );
}
