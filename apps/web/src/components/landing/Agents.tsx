"use client";

const AGENT_DETAILS = [
  {
    name: "Proveedores Agent",
    tag: "01",
    manual: [
      "Recibir factura por email, WhatsApp o USB",
      "Capturar datos manualmente al ERP",
      "Validar CFDI en portal del SAT",
      "Ruta de aprobación por email/WhatsApp",
      "Ejecutar transferencia desde el banco",
      "Registrar pago y generar complemento",
    ],
    automated: [
      "Recibe factura en cualquier canal automáticamente",
      "Extrae y valida datos con Vision AI",
      "Consulta SAT en tiempo real para validación",
      "Ruta digital de aprobación con 1-click",
      "Pago vía SPEI o USDC desde la plataforma",
      "Genera complemento de pago y póliza contable",
    ],
    steps: ["Recibe factura", "Extrae datos", "Valida CFDI", "Rutea aprobación", "Ejecuta pago", "Registra en contabilidad"],
  },
  {
    name: "Cobranza Agent",
    tag: "02",
    manual: [
      "Buscar manualmente facturas vencidas",
      "Redactar emails de cobro uno por uno",
      "Hacer seguimiento por WhatsApp",
      "Sin sistema de priorización",
      "Reportes de aging en Excel cada semana",
      "Escalar a gerencia sin datos claros",
    ],
    automated: [
      "Monitorea receivables en tiempo real",
      "Prioriza por monto + días vencido + historial",
      "Envía recordatorios personalizados (email + WA)",
      "Escala tono: cordial → firme → legal",
      "Reporte de aging automático con predicción",
      "Escala a humano solo cuando es necesario",
    ],
    steps: ["Detecta vencimiento", "Prioriza por score", "Envía recordatorio", "Escala tono", "Reporta aging", "Escala a humano"],
  },
];

const MORE_AGENTS = [
  { name: "Tesorería Agent", desc: "Mueve tu cash ocioso a CETES tokenizado. Redime antes de pagos grandes. Forecasting a 90 días.", badge: "Beta" },
  { name: "Fiscal Agent", desc: "DIOT, declaraciones mensuales, complementos de pago. Presenta cuando tú apruebas.", badge: "Beta" },
  { name: "Custom Agents", desc: "Define un agente para tus flujos específicos. Políticas, límites y herramientas a tu medida.", badge: "Enterprise" },
];

export function Agents() {
  return (
    <section className="py-24 px-6 space-y-24" style={{ backgroundColor: "#FFFFFF" }}>
      {AGENT_DETAILS.map((agent) => (
        <div key={agent.name} className="max-w-6xl mx-auto space-y-10">
          <div className="flex items-center gap-4">
            <span className="font-mono font-bold text-2xl" style={{ color: "#C9B79C" }}>{agent.tag}</span>
            <div>
              <h3 className="text-3xl font-bold" style={{ color: "#1A1A1A" }}>{agent.name}</h3>
              <p className="text-sm mt-1" style={{ color: "#6B675F" }}>Del proceso manual al flujo autónomo</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Manual */}
            <div style={{ border: "1px solid rgba(165,69,69,0.2)", borderRadius: 16, padding: 24, backgroundColor: "rgba(165,69,69,0.04)" }}>
              <div style={{ fontSize: 11, color: "#A54545", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16, fontWeight: 600 }}>Proceso manual hoy</div>
              <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {agent.manual.map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "#6B675F" }}>
                    <span style={{ color: "#A54545", flexShrink: 0, marginTop: 1, fontWeight: 700 }}>✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* Automated */}
            <div style={{ border: "1px solid #C9B79C", borderRadius: 16, padding: 24, backgroundColor: "rgba(201,183,156,0.08)" }}>
              <div style={{ fontSize: 11, color: "#8A7560", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16, fontWeight: 600 }}>Con Handle.Fi</div>
              <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {agent.automated.map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "#1A1A1A" }}>
                    <span style={{ color: "#2E6F4E", flexShrink: 0, marginTop: 1, fontWeight: 700 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Steps */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 0, flexWrap: "wrap" }}>
            {agent.steps.map((step, i) => (
              <div key={step} style={{ display: "flex", alignItems: "flex-start" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "rgba(201,183,156,0.15)", border: "1px solid #C9B79C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#8A7560" }}>
                    {i + 1}
                  </div>
                  <span style={{ color: "#6B675F", fontSize: 11, textAlign: "center", width: 80 }}>{step}</span>
                </div>
                {i < agent.steps.length - 1 && (
                  <div style={{ width: 32, height: 1, backgroundColor: "#E5E1DA", flexShrink: 0, marginTop: 18 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* More agents */}
      <div className="max-w-6xl mx-auto">
        <h3 className="text-2xl font-bold text-white mb-8">Más agentes</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {MORE_AGENTS.map((a) => (
            <div key={a.name} className="border border-white/8 rounded-2xl p-6 bg-white/[0.02] space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-white font-semibold">{a.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full border border-violet-500/30 text-violet-400">
                  {a.badge}
                </span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
