"use client";

const SOR_LOGOS = [
  "Banorte", "BBVA", "Banamex", "SAT", "Aspel", "CONTPAQi",
  "SAP B1", "Bitso", "SPEI", "PIX", "USDC", "MXNB",
];

const AGENTS = [
  { name: "Nómina", desc: "Calcula, paga y genera CFDI", color: "violet" },
  { name: "Proveedores", desc: "Recibe factura, valida, paga", color: "indigo" },
  { name: "Cobranza", desc: "Persigue clientes con el tono correcto", color: "purple" },
  { name: "Conciliación", desc: "Cruza banco + CFDI + ERP", color: "violet" },
  { name: "Tesorería", desc: "Invierte cash en CETES tokenizado", color: "indigo" },
  { name: "Fiscal / SAT", desc: "DIOT, declaraciones, complementos", color: "purple" },
  { name: "Custom Agents", desc: "Diseña tu propio agente", color: "gray" },
];

export function Platform() {
  return (
    <section id="platform" className="bg-black py-24 px-6">
      <div className="max-w-6xl mx-auto space-y-20">
        {/* Header */}
        <div className="text-center space-y-4">
          <p className="text-violet-400 text-sm font-medium uppercase tracking-widest">Platform</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Dos capas. Una plataforma.
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Una base de datos conectada a todo tu ecosistema, y agentes de IA que ejecutan sobre ella.
          </p>
        </div>

        {/* 01 — SOR */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <span className="text-violet-400 font-mono font-bold">01</span>
              <span className="h-px w-8 bg-violet-400/40" />
              <span className="uppercase tracking-widest text-xs">System of Record</span>
            </div>
            <h3 className="text-3xl font-bold text-white">
              Una base de verdad conectada a todo tu ecosistema
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Handle.Fi se conecta via APIs y Computer Use a tus bancos, portales del SAT, ERPs y
              plataformas de pago. Toda tu data financiera en un solo lugar, siempre actualizada.
            </p>
            <div className="flex flex-wrap gap-2">
              {SOR_LOGOS.map((logo) => (
                <span
                  key={logo}
                  className="px-3 py-1.5 text-xs border border-white/10 rounded-full text-gray-400 bg-white/[0.02] hover:border-violet-500/40 hover:text-violet-300 transition-colors"
                >
                  {logo}
                </span>
              ))}
            </div>
          </div>
          {/* Visual */}
          <div className="border border-white/10 rounded-2xl bg-[#0d0d14] p-6 space-y-3">
            <div className="text-xs text-gray-600 uppercase tracking-wider mb-4">Fuentes conectadas</div>
            {[
              { name: "SAT / CFDI", status: "Sincronizado", count: "1,247 registros" },
              { name: "Banorte Business", status: "En tiempo real", count: "$2.4M MXN" },
              { name: "Bitso Business", status: "Activo", count: "SPEI + USDC" },
              { name: "CONTPAQi", status: "Última sync: 09:00", count: "380 pólizas" },
              { name: "EtherFuse", status: "Activo", count: "$125K en CETES" },
            ].map((s) => (
              <div key={s.name} className="flex items-center justify-between text-sm py-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-white">{s.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-gray-500 text-xs">{s.status}</div>
                  <div className="text-violet-400 text-xs">{s.count}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 02 — Agents */}
        <div id="agents" className="grid md:grid-cols-2 gap-10 items-center">
          <div className="border border-white/10 rounded-2xl bg-[#0d0d14] p-6 grid grid-cols-2 gap-3 order-2 md:order-1">
            {AGENTS.map((a) => (
              <div
                key={a.name}
                className={`border rounded-xl p-4 transition-colors cursor-default
                  ${a.color === "gray"
                    ? "border-white/5 bg-white/[0.01] col-span-2"
                    : "border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10"
                  }`}
              >
                <div className={`text-sm font-medium ${a.color === "gray" ? "text-gray-500" : "text-white"}`}>
                  {a.name}
                </div>
                <div className="text-xs text-gray-600 mt-1">{a.desc}</div>
              </div>
            ))}
          </div>
          <div className="space-y-6 order-1 md:order-2">
            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <span className="text-violet-400 font-mono font-bold">02</span>
              <span className="h-px w-8 bg-violet-400/40" />
              <span className="uppercase tracking-widest text-xs">Vertical Agents</span>
            </div>
            <h3 className="text-3xl font-bold text-white">
              Agentes que ejecutan workflows end-to-end
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Cada agente conoce su dominio en profundidad: reglas fiscales mexicanas, compliance
              de nómina, protocolos de cobranza. Ejecutan autónomamente y escalan cuando necesitan
              tu juicio.
            </p>
            <ul className="space-y-3 text-sm text-gray-400">
              {[
                "Acciones verificables y auditables en blockchain",
                "Políticas configurables por monto, tipo y destinatario",
                "Escalan al humano cuando es necesario, nunca cuando no lo es",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-violet-400 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
