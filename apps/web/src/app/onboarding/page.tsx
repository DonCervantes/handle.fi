"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { api } from "@/lib/api";

const INDUSTRIES = [
  { id: "manufacturing", label: "Manufactura", icon: "🏭", desc: "Producción, ensamble, importación" },
  { id: "tech_saas", label: "Tech / SaaS", icon: "💻", desc: "Software, equipo distribuido" },
  { id: "commerce", label: "Comercio", icon: "🛒", desc: "Retail, e-commerce, distribución" },
  { id: "services", label: "Servicios", icon: "💼", desc: "Consultoría, profesionales" },
  { id: "agency", label: "Agencia", icon: "🎨", desc: "Marketing, creatividad" },
  { id: "construction", label: "Construcción", icon: "🏗️", desc: "Obra civil, materiales" },
];

const REVENUE_RANGES = [
  { value: 5000, label: "Menos de $5K USD/mes", desc: "Startup o PyME pequeña" },
  { value: 25000, label: "$5K–$50K USD/mes", desc: "PyME en crecimiento" },
  { value: 100000, label: "$50K–$200K USD/mes", desc: "Mid-market" },
  { value: 500000, label: "Más de $200K USD/mes", desc: "Empresa establecida" },
];

const IDLE_CASH_RANGES = [
  { value: 0, label: "Casi nada", desc: "Pago todo el flujo" },
  { value: 10000, label: "$5K–$25K USD", desc: "Reserva operativa" },
  { value: 50000, label: "$25K–$100K USD", desc: "Treasury moderada" },
  { value: 250000, label: "Más de $100K USD", desc: "Cash ocioso significativo" },
];

interface FormData {
  name: string;
  rfc: string;
  industry: string;
  country: string;
  employeeCount: number;
  monthlyRevenueUSD: number;
  hasIntlVendors: boolean;
  operatingCountries: string[];
  idleCashUSD: number;
  preferYield: boolean;
}

interface SetupResult {
  organization: { name: string; industry: string };
  agent: { id: string; name: string };
  policy: { maxTransactionAmount: number; dailyLimit: number; allowedCurrencies: string[] };
  vendors: Array<{ name: string; country: string; currency: string }>;
  employees: Array<{ name: string; role: string; salary: number; currency: string }>;
  treasurySuggestion: { amountMXN: number; apy: number; estimatedYearlyYield: string } | null;
  onChain: { credentialTxHash: string; arbiscanUrl: string; contract: string } | null;
  summary: { vendorsCreated: number; employeesCreated: number; policyTxLimit: number; policyDailyLimit: number };
}

export default function OnboardingPage() {
  const { ready, authenticated, login, getAccessToken } = usePrivy();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SetupResult | null>(null);
  const [form, setForm] = useState<FormData>({
    name: "",
    rfc: "",
    industry: "tech_saas",
    country: "MX",
    employeeCount: 25,
    monthlyRevenueUSD: 25000,
    hasIntlVendors: true,
    operatingCountries: ["MX", "US"],
    idleCashUSD: 10000,
    preferYield: true,
  });

  // Redirect if already onboarded
  useEffect(() => {
    if (!ready || !authenticated) return;
    (async () => {
      try {
        const token = await getAccessToken();
        const status = await api.get<{ onboarded: boolean }>("/onboarding/status", token ?? undefined);
        if (status.onboarded) router.push("/demo");
      } catch {}
    })();
  }, [ready, authenticated]);

  function next() { setStep((s) => Math.min(4, s + 1)); }
  function back() { setStep((s) => Math.max(1, s - 1)); }

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const data = await api.post<SetupResult>("/onboarding", form, token ?? undefined);
      setResult(data);
      setStep(5);
    } catch (err: any) {
      setError(err.message ?? "Error al configurar");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 24, height: 24, border: "2px solid #C9B79C", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ maxWidth: 400, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, color: "#1A1A1A", marginBottom: 12, fontWeight: 600 }}>Inicia sesión primero</h1>
          <p style={{ fontSize: 14, color: "#6B675F", marginBottom: 24 }}>Necesitas autenticarte antes de comenzar el setup.</p>
          <button onClick={login} style={{ padding: "10px 24px", backgroundColor: "#1A1A1A", color: "#FFFFFF", borderRadius: 8, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>
            Entrar →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid #E5E1DA", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/">
          <img src="/logo.png" alt="Handle.Fi" style={{ height: 36, mixBlendMode: "multiply" }} />
        </a>
        <span style={{ fontSize: 12, color: "#9B9690" }}>Paso {Math.min(step, 4)} de 4</span>
      </header>

      {/* Progress bar */}
      <div style={{ height: 3, backgroundColor: "#F5F2EC", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(Math.min(step, 4) / 4) * 100}%`, backgroundColor: "#1A1A1A", transition: "width 0.4s ease" }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ maxWidth: 640, width: "100%" }}>

          {/* STEP 1 — Company info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <div style={{ fontSize: 11, color: "#8A7560", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 8 }}>Paso 1 · Empresa</div>
                <h1 style={{ fontSize: 32, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>Cuéntanos de tu empresa</h1>
                <p style={{ fontSize: 14, color: "#6B675F" }}>Esta información se queda en tu cuenta — la usamos para configurar tu agente IA.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label style={{ fontSize: 13, color: "#1A1A1A", fontWeight: 500, display: "block", marginBottom: 6 }}>Nombre de la empresa</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej: Manufacturas Monterrey SA"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, color: "#1A1A1A", fontWeight: 500, display: "block", marginBottom: 6 }}>RFC <span style={{ color: "#9B9690" }}>(opcional)</span></label>
                  <input
                    type="text"
                    value={form.rfc}
                    onChange={(e) => setForm({ ...form, rfc: e.target.value.toUpperCase() })}
                    placeholder="MME900101AB1"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, color: "#1A1A1A", fontWeight: 500, display: "block", marginBottom: 10 }}>Industria</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                    {INDUSTRIES.map((ind) => (
                      <button
                        key={ind.id}
                        onClick={() => setForm({ ...form, industry: ind.id })}
                        style={{
                          padding: 14,
                          border: form.industry === ind.id ? "2px solid #1A1A1A" : "1px solid #E5E1DA",
                          backgroundColor: form.industry === ind.id ? "#F5F2EC" : "#FFFFFF",
                          borderRadius: 10,
                          cursor: "pointer",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <span style={{ fontSize: 22 }}>{ind.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{ind.label}</div>
                          <div style={{ fontSize: 11, color: "#9B9690" }}>{ind.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button onClick={next} disabled={!form.name.trim()} style={primaryBtn(loading || !form.name.trim())}>
                  Siguiente →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 — Operation */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <div style={{ fontSize: 11, color: "#8A7560", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 8 }}>Paso 2 · Operación</div>
                <h1 style={{ fontSize: 32, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>¿Cómo opera tu empresa?</h1>
                <p style={{ fontSize: 14, color: "#6B675F" }}>Usamos esto para generar tu política de pagos automáticamente.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label style={{ fontSize: 13, color: "#1A1A1A", fontWeight: 500, display: "block", marginBottom: 6 }}>Número de empleados</label>
                  <input
                    type="number"
                    value={form.employeeCount}
                    onChange={(e) => setForm({ ...form, employeeCount: parseInt(e.target.value) || 0 })}
                    min={0}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, color: "#1A1A1A", fontWeight: 500, display: "block", marginBottom: 10 }}>Ingresos mensuales aproximados</label>
                  <div style={{ display: "grid", gap: 6 }}>
                    {REVENUE_RANGES.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setForm({ ...form, monthlyRevenueUSD: r.value })}
                        style={radioCardStyle(form.monthlyRevenueUSD === r.value)}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{r.label}</div>
                        <div style={{ fontSize: 11, color: "#9B9690", marginTop: 2 }}>{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, border: "1px solid #E5E1DA", borderRadius: 8, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={form.hasIntlVendors}
                      onChange={(e) => setForm({ ...form, hasIntlVendors: e.target.checked })}
                      style={{ accentColor: "#1A1A1A" }}
                    />
                    <div>
                      <div style={{ fontSize: 13, color: "#1A1A1A", fontWeight: 600 }}>Tengo proveedores internacionales</div>
                      <div style={{ fontSize: 11, color: "#9B9690" }}>Habilitamos pagos en USDC y wire internacional</div>
                    </div>
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <button onClick={back} style={secondaryBtn}>← Atrás</button>
                <button onClick={next} style={primaryBtn(false)}>Siguiente →</button>
              </div>
            </div>
          )}

          {/* STEP 3 — Treasury preference */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <div style={{ fontSize: 11, color: "#8A7560", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 8 }}>Paso 3 · Tesorería</div>
                <h1 style={{ fontSize: 32, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>¿Cuánto cash ocioso tienes?</h1>
                <p style={{ fontSize: 14, color: "#6B675F" }}>Lo invertimos automáticamente en CETES tokenizado (9.1% APY) hasta que lo necesites para pagos.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label style={{ fontSize: 13, color: "#1A1A1A", fontWeight: 500, display: "block", marginBottom: 10 }}>Cash promedio en cuenta</label>
                  <div style={{ display: "grid", gap: 6 }}>
                    {IDLE_CASH_RANGES.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setForm({ ...form, idleCashUSD: r.value })}
                        style={radioCardStyle(form.idleCashUSD === r.value)}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{r.label}</div>
                        <div style={{ fontSize: 11, color: "#9B9690", marginTop: 2 }}>{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, border: "1px solid #E5E1DA", borderRadius: 8, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={form.preferYield}
                      onChange={(e) => setForm({ ...form, preferYield: e.target.checked })}
                      style={{ accentColor: "#1A1A1A" }}
                    />
                    <div>
                      <div style={{ fontSize: 13, color: "#1A1A1A", fontWeight: 600 }}>Quiero generar yield con mi cash ocioso</div>
                      <div style={{ fontSize: 11, color: "#9B9690" }}>El agente de Tesorería moverá fondos a CETES automáticamente</div>
                    </div>
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <button onClick={back} style={secondaryBtn}>← Atrás</button>
                <button onClick={next} style={primaryBtn(false)}>Siguiente →</button>
              </div>
            </div>
          )}

          {/* STEP 4 — Confirm */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <div style={{ fontSize: 11, color: "#8A7560", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 8 }}>Paso 4 · Confirmación</div>
                <h1 style={{ fontSize: 32, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>Revisa y confirma</h1>
                <p style={{ fontSize: 14, color: "#6B675F" }}>Vamos a generar tu agente, política de pagos y catálogo inicial.</p>
              </div>

              <div style={{ backgroundColor: "#F5F2EC", borderRadius: 12, padding: 20, fontSize: 13 }}>
                <SummaryRow label="Empresa" value={form.name} />
                <SummaryRow label="Industria" value={INDUSTRIES.find((i) => i.id === form.industry)?.label ?? "—"} />
                <SummaryRow label="Empleados" value={form.employeeCount.toString()} />
                <SummaryRow label="Ingresos mensuales" value={`~$${form.monthlyRevenueUSD.toLocaleString()} USD`} />
                <SummaryRow label="Proveedores internacionales" value={form.hasIntlVendors ? "Sí" : "No"} />
                <SummaryRow label="Cash idle promedio" value={`~$${form.idleCashUSD.toLocaleString()} USD`} />
                <SummaryRow label="Yield automático en CETES" value={form.preferYield ? "Sí — 9.1% APY" : "No"} />
              </div>

              {error && (
                <div style={{ backgroundColor: "rgba(165,69,69,0.06)", border: "1px solid rgba(165,69,69,0.2)", borderRadius: 8, padding: 12, fontSize: 12, color: "#A54545" }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <button onClick={back} disabled={loading} style={secondaryBtn}>← Atrás</button>
                <button onClick={submit} disabled={loading} style={primaryBtn(loading)}>
                  {loading ? "Configurando..." : "Crear mi cuenta →"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5 — Success */}
          {step === 5 && result && (
            <div className="space-y-6">
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
                <h1 style={{ fontSize: 32, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>¡{result.organization.name} está listo!</h1>
                <p style={{ fontSize: 14, color: "#6B675F" }}>Tu agente ya tiene todo configurado.</p>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                {result.onChain && (
                  <a
                    href={result.onChain.arbiscanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block",
                      padding: 16,
                      backgroundColor: "rgba(46,111,78,0.06)",
                      borderRadius: 10,
                      border: "1px solid rgba(46,111,78,0.25)",
                      textDecoration: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#2E6F4E", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      <span>● ON-CHAIN</span>
                      <span style={{ color: "#9B9690", fontWeight: 400 }}>· Arbitrum Sepolia</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginBottom: 2 }}>
                      🔗 Credencial KYA registrada en blockchain
                    </div>
                    <div style={{ fontSize: 10, color: "#6B675F", fontFamily: "monospace", wordBreak: "break-all" }}>
                      {result.onChain.credentialTxHash}
                    </div>
                    <div style={{ fontSize: 10, color: "#9B9690", marginTop: 4 }}>
                      Click para ver en Arbiscan →
                    </div>
                  </a>
                )}
                <ResultCard
                  title="🤖 Agente creado"
                  body={result.agent.name}
                  detail={`Política: máx $${result.summary.policyTxLimit.toLocaleString()} USD por tx · $${result.summary.policyDailyLimit.toLocaleString()} diario`}
                />
                <ResultCard
                  title={`📦 ${result.summary.vendorsCreated} proveedores agregados`}
                  body={result.vendors.map((v) => v.name).slice(0, 3).join(" · ")}
                  detail={`Países: ${[...new Set(result.vendors.map((v) => v.country))].join(", ")}`}
                />
                {result.summary.employeesCreated > 0 && (
                  <ResultCard
                    title={`👥 ${result.summary.employeesCreated} empleados de muestra`}
                    body={result.employees.map((e) => `${e.name} (${e.role})`).slice(0, 2).join(" · ")}
                    detail={`Nómina lista para procesar`}
                  />
                )}
                {result.treasurySuggestion && (
                  <ResultCard
                    title="💰 Sugerencia de Tesorería"
                    body={`Invierte $${result.treasurySuggestion.amountMXN.toLocaleString()} MXN en CETES`}
                    detail={`Yield estimado: $${result.treasurySuggestion.estimatedYearlyYield} MXN/año @ ${result.treasurySuggestion.apy}% APY`}
                  />
                )}
              </div>

              <button
                onClick={() => router.push("/demo")}
                style={{ ...primaryBtn(false), width: "100%", padding: "14px 20px", fontSize: 14 }}
              >
                Ir a mi dashboard →
              </button>
            </div>
          )}

        </div>
      </div>

      <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ── Styles ──
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  fontSize: 14,
  border: "1px solid #E5E1DA",
  borderRadius: 8,
  color: "#1A1A1A",
  backgroundColor: "#FFFFFF",
  outline: "none",
};

function primaryBtn(disabled: boolean): React.CSSProperties {
  return {
    padding: "10px 24px",
    fontSize: 14,
    fontWeight: 600,
    backgroundColor: disabled ? "#C9B79C" : "#1A1A1A",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 8,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

const secondaryBtn: React.CSSProperties = {
  padding: "10px 24px",
  fontSize: 14,
  fontWeight: 500,
  backgroundColor: "#FFFFFF",
  color: "#1A1A1A",
  border: "1px solid #E5E1DA",
  borderRadius: 8,
  cursor: "pointer",
};

function radioCardStyle(selected: boolean): React.CSSProperties {
  return {
    padding: 14,
    border: selected ? "2px solid #1A1A1A" : "1px solid #E5E1DA",
    backgroundColor: selected ? "#F5F2EC" : "#FFFFFF",
    borderRadius: 10,
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
  };
}

// ── Sub-components ──
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
      <span style={{ color: "#6B675F" }}>{label}</span>
      <span style={{ color: "#1A1A1A", fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function ResultCard({ title, body, detail }: { title: string; body: string; detail: string }) {
  return (
    <div style={{ padding: 16, backgroundColor: "#F5F2EC", borderRadius: 10, border: "1px solid #E5E1DA" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: "#6B675F" }}>{body}</div>
      <div style={{ fontSize: 11, color: "#9B9690", marginTop: 4 }}>{detail}</div>
    </div>
  );
}
