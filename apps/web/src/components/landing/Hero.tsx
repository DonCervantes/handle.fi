"use client";
import Link from "next/link";
import { useLang } from "../LangProvider";

export function Hero() {
  const { t } = useLang();
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center bg-black overflow-hidden pt-16">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6 sm:space-y-8">
        {/* Badge */}
        <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-[10px] sm:text-xs font-medium max-w-full">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse flex-shrink-0" />
          <span className="truncate sm:whitespace-normal">Construido para LatAm · Arbitrum · Privy · Bitso · EtherFuse</span>
        </div>

        {/* H1 */}
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.05] break-words">
          Las finanzas de tu empresa,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
            en automático.
          </span>
        </h1>

        {/* Subhead */}
        <p className="text-sm sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed px-2">
          {t("hero_sub")}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full max-w-md mx-auto sm:max-w-none">
          <Link
            href="/demo"
            className="px-6 sm:px-8 py-3 sm:py-4 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all hover:scale-105 text-sm sm:text-base text-center"
          >
            {t("hero_cta1")}
          </Link>
          <a
            href="#platform"
            className="px-6 sm:px-8 py-3 sm:py-4 border border-white/15 hover:border-white/30 text-white font-medium rounded-xl transition-all text-sm sm:text-base text-center"
          >
            {t("hero_cta2")}
          </a>
        </div>

        {/* Dashboard mock — solo desktop */}
        <div className="hidden md:block mt-16 relative max-w-4xl mx-auto">
          <div style={{ border: "1px solid #E5E1DA", borderRadius: "16px", backgroundColor: "#FFFFFF", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}>
            {/* Mock browser bar */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderBottom: "1px solid #E5E1DA", backgroundColor: "#F5F2EC" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#E5E1DA" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#E5E1DA" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#E5E1DA" }} />
              <div style={{ flex: 1, marginLeft: 12, backgroundColor: "#FFFFFF", border: "1px solid #E5E1DA", borderRadius: 6, padding: "3px 12px", fontSize: 11, color: "#9B9690" }}>
                app.handle.fi/dashboard
              </div>
            </div>
            {/* Mock dashboard content */}
            <div style={{ padding: 20, display: "grid", gridTemplateColumns: "120px 1fr", gap: 16 }}>
              {/* Sidebar */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {["Dashboard", "Pagos", "Nómina", "Cobranza", "Tesorería", "Fiscal"].map((item, i) => (
                  <div key={item} style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    fontSize: 11,
                    backgroundColor: i === 0 ? "rgba(201,183,156,0.15)" : "transparent",
                    color: i === 0 ? "#8A7560" : "#9B9690",
                    fontWeight: i === 0 ? 600 : 400,
                  }}>
                    {item}
                  </div>
                ))}
              </div>
              {/* Main */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                  {[
                    { label: "Cash total", value: "$2.4M MXN", change: "+4.2%" },
                    { label: "Por pagar", value: "$380K", change: "12 facturas" },
                    { label: "Por cobrar", value: "$1.1M", change: "8 clientes" },
                    { label: "Yield activo", value: "$125K", change: "9.1% APY" },
                  ].map((s) => (
                    <div key={s.label} style={{ backgroundColor: "#F5F2EC", border: "1px solid #E5E1DA", borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ color: "#9B9690", fontSize: 10 }}>{s.label}</div>
                      <div style={{ color: "#1A1A1A", fontWeight: 600, fontSize: 13, marginTop: 2 }}>{s.value}</div>
                      <div style={{ color: "#C9B79C", fontSize: 10, marginTop: 2 }}>{s.change}</div>
                    </div>
                  ))}
                </div>
                {/* Agent activity */}
                <div style={{ backgroundColor: "#F5F2EC", border: "1px solid #E5E1DA", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ color: "#9B9690", fontSize: 10, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Actividad de agentes — hoy</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { agent: "Proveedores", action: "Validó y programó pago de 14 facturas", status: "done", time: "09:42" },
                      { agent: "Tesorería", action: "Movió $200K MXN a CETES tokenizado (EtherFuse)", status: "done", time: "09:15" },
                      { agent: "Cobranza", action: "Envió recordatorio a 3 clientes con +15 días vencido", status: "done", time: "08:00" },
                      { agent: "Nómina", action: "Calculando quincena — esperando aprobación", status: "pending", time: "En proceso" },
                    ].map((a) => (
                      <div key={a.action} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, backgroundColor: a.status === "done" ? "#2E6F4E" : "#A67C2E" }} />
                        <span style={{ color: "#8A7560", fontWeight: 600, width: 72, flexShrink: 0 }}>{a.agent}</span>
                        <span style={{ color: "#6B675F", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.action}</span>
                        <span style={{ color: "#B5AEA4" }}>{a.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
