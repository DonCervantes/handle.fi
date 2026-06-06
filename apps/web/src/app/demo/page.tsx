"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { api } from "@/lib/api";

const DEMO_AGENT_ID = process.env.NEXT_PUBLIC_DEMO_AGENT_ID ?? "demo-agent-treasurybot";

const VENDORS = [
  { id: "demo-vendor-shenzhen-tech-parts-co.", name: "Shenzhen Tech Parts", country: "🇨🇳 China", method: "USDC", amount: 300, currency: "USD" },
  { id: "demo-vendor-carlos-rodríguez-dev", name: "Carlos Rodríguez Dev", country: "🇲🇽 México", method: "SPEI", amount: 8500, currency: "MXN" },
  { id: "demo-vendor-anna-kowalski-design", name: "Anna Kowalski Design", country: "🇵🇱 Polonia", method: "USDC", amount: 450, currency: "USD" },
  { id: "demo-vendor-acero-industrial-mx", name: "Acero Industrial MX", country: "🇲🇽 México", method: "SPEI", amount: 2000, currency: "MXN" },
  { id: "demo-vendor-global-logistics-us", name: "Global Logistics US", country: "🇺🇸 EE.UU.", method: "WIRE", amount: 1500, currency: "USD" },
];

const QUICK_ACTIONS = [
  { label: "Paga $300 USD → China", value: "Pay $300 USD to Shenzhen supplier for parts" },
  { label: "Paga $8,500 MXN → México", value: "Pay $8500 MXN to Carlos Rodriguez for development services" },
  { label: "Paga $2,000 USD (RECHAZADO)", value: "Send $2000 USD to vendor" },
  { label: "Transfer $150 USDC → Polonia", value: "Transfer $150 USDC to Anna Kowalski for design work" },
];

interface ActionResult {
  action: { id: string; status: string; actionType: string };
  intent: { actionType: string; amount?: number; currency?: string; recipient?: string; confidence: number };
  decision: { approved: boolean; reason: string; checkedRules: string[] };
  audit: { txHash: string | null; arbiscanUrl: string | null; actionHash: string | null };
  bitso: { transactionId: string; status: string; amount: number } | null;
}

// ── Login Gate ─────────────────────────────────────────────────
function LoginGate({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <a href="/" className="flex justify-center">
            <img src="/logo.png" alt="Handle.Fi" className="h-12 w-auto object-contain" style={{ mixBlendMode: "multiply" }} />
          </a>
          <p className="text-gray-500 text-sm mt-1">Demo en vivo</p>
        </div>

        <div className="border border-white/10 rounded-2xl p-8 bg-white/[0.02] space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Accede al demo</h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              Inicia sesión para ver cómo una PyME mexicana paga a 5 contratistas
              en 3 países en menos de 2 minutos — con auditoría en blockchain.
            </p>
          </div>

          <div className="space-y-3 text-left text-sm">
            {[
              "Policy Engine determinista en tiempo real",
              "Auditoría verificable en Arbitrum Sepolia",
              "Pagos multi-moneda vía Bitso Business",
              "Wallet embebida automática con Privy",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-gray-400">
                <span className="text-violet-400">✓</span> {f}
              </div>
            ))}
          </div>

          <button
            onClick={onLogin}
            className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors"
          >
            Entrar con email o wallet →
          </button>

          <p className="text-gray-600 text-xs">
            Powered by Privy · Sin seed phrases · Wallet creada automáticamente
          </p>
        </div>

        <a href="/" className="text-gray-600 text-sm hover:text-gray-400 transition-colors block">
          ← Volver al inicio
        </a>
      </div>
    </div>
  );
}

// ── User context types ──
interface UserContext {
  organization: { name: string; industry: string; country: string } | null;
  agent: { id: string; name: string; description: string | null } | null;
  policy: { maxTransactionAmount: number; dailyLimit: number; allowedCurrencies: string[]; allowedActionTypes: string[] } | null;
  vendors: Array<{ id: string; name: string; country: string; currency: string; paymentMethod: string }>;
  employees: Array<{ id: string; name: string; role: string; country: string; salary: number; currency: string }>;
}

const COUNTRY_FLAGS: Record<string, string> = {
  MX: "🇲🇽", CN: "🇨🇳", US: "🇺🇸", PL: "🇵🇱", AR: "🇦🇷", CO: "🇨🇴",
  BR: "🇧🇷", JP: "🇯🇵", DE: "🇩🇪", IN: "🇮🇳", FR: "🇫🇷", ES: "🇪🇸",
};

function suggestedAmount(currency: string): number {
  if (currency === "MXN") return 8500;
  if (currency === "USDC") return 450;
  return 300; // USD default
}

// ── Demo App ───────────────────────────────────────────────────
function DemoApp({ userEmail, ctx }: { userEmail?: string; ctx: UserContext }) {
  const { logout, getAccessToken } = usePrivy();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ActionResult[]>([]);
  const [payingAll, setPayingAll] = useState(false);
  const [batchResults, setBatchResults] = useState<{ vendor: string; result: ActionResult }[]>([]);

  const agentId = ctx.agent?.id ?? DEMO_AGENT_ID;
  const orgName = ctx.organization?.name ?? "TreasuryBot";
  const agentName = ctx.agent?.name ?? "TreasuryBot";
  const policy = ctx.policy ?? { maxTransactionAmount: 500, dailyLimit: 1500, allowedCurrencies: ["USD", "MXN", "USDC"], allowedActionTypes: ["PAYMENT", "TRANSFER"] };
  const vendors = ctx.vendors.length > 0 ? ctx.vendors : VENDORS as any;

  async function fetchToken(): Promise<string | undefined> {
    try { return (await getAccessToken()) ?? undefined; } catch { return undefined; }
  }

  async function handleSubmit(text?: string) {
    const query = text ?? input;
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const token = await fetchToken();
      const data = await api.post<ActionResult>("/actions", {
        agentId,
        naturalLanguage: query,
      }, token);
      setResult(data);
      setHistory((h) => [data, ...h].slice(0, 10));
    } catch (err: any) {
      setError(err.message ?? "Error al procesar");
    } finally {
      setLoading(false);
    }
  }

  async function handlePayAll() {
    setPayingAll(true);
    setBatchResults([]);
    const token = await fetchToken();
    for (const vendor of vendors) {
      try {
        const amount = (vendor as any).amount ?? suggestedAmount(vendor.currency);
        const data = await api.post<ActionResult>("/actions", {
          agentId,
          naturalLanguage: `Pay ${amount} ${vendor.currency} to ${vendor.name}`,
        }, token);
        setBatchResults((prev) => [...prev, { vendor: vendor.name, result: data }]);
        await new Promise((r) => setTimeout(r, 700));
      } catch {}
    }
    setPayingAll(false);
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <a href="/">
          <img src="/logo.png" alt="Handle.Fi" className="h-12 w-auto object-contain" style={{ mixBlendMode: "multiply" }} />
        </a>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 border border-white/10 px-2 py-1 rounded-full">Arbitrum Sepolia</span>
          {userEmail && <span className="text-xs text-gray-500 hidden md:block">{userEmail}</span>}
          <button onClick={logout} className="text-xs text-gray-500 hover:text-white transition-colors">Salir</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Demo en vivo — agente real · blockchain real · IA real
          </div>
          <h1 className="text-3xl font-bold text-white">{agentName}</h1>
          <p className="text-gray-400 mt-1">
            {ctx.organization
              ? `${orgName} · ${ctx.vendors.length} proveedores en ${[...new Set(ctx.vendors.map((v) => v.country))].length} países`
              : "Una PyME mexicana paga a 5 contratistas en 3 países — en menos de 2 minutos."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            {/* Policy */}
            <div className="border border-white/10 rounded-xl p-5 bg-white/[0.02] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Política activa — {agentName}</span>
                <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">Activa</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div><div className="text-gray-500">Límite por tx</div><div className="text-white font-mono font-semibold mt-0.5">${policy.maxTransactionAmount.toLocaleString()} USD</div></div>
                <div><div className="text-gray-500">Límite diario</div><div className="text-white font-mono font-semibold mt-0.5">${policy.dailyLimit.toLocaleString()} USD</div></div>
                <div><div className="text-gray-500">Monedas</div><div className="text-white font-mono font-semibold mt-0.5">{policy.allowedCurrencies.join(" · ")}</div></div>
                <div><div className="text-gray-500">Acciones</div><div className="text-white font-mono font-semibold mt-0.5">{policy.allowedActionTypes.slice(0, 2).join(" · ")}</div></div>
              </div>
            </div>

            {/* Vendors */}
            <div className="border border-white/10 rounded-xl p-5 bg-white/[0.02] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 uppercase tracking-wider">
                  Contratistas — {[...new Set(vendors.map((v: any) => v.country))].length} {[...new Set(vendors.map((v: any) => v.country))].length === 1 ? "país" : "países"}
                </span>
                <button
                  onClick={handlePayAll}
                  disabled={payingAll}
                  className="text-xs px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {payingAll ? "Procesando..." : "Pagar todos →"}
                </button>
              </div>
              <div className="space-y-2">
                {vendors.map((v: any, i: number) => {
                  const br = batchResults.find((r) => r.vendor === v.name);
                  const amount = v.amount ?? suggestedAmount(v.currency);
                  const flag = COUNTRY_FLAGS[v.country] ?? "🌐";
                  return (
                    <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 text-sm">
                      <span className="text-lg">{flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium">{v.name}</div>
                        <div className="text-gray-500 text-xs">{v.country} · {v.paymentMethod ?? v.method}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-violet-400 font-mono text-xs">{v.currency} {amount.toLocaleString()}</div>
                        {br && (
                          <div className={`text-xs mt-0.5 ${br.result.decision.approved ? "text-green-400" : "text-red-400"}`}>
                            {br.result.decision.approved ? "✓ PAGADO" : "✗ RECHAZADO"}
                          </div>
                        )}
                        {payingAll && !br && (
                          <div className="text-xs text-gray-600 mt-0.5 animate-pulse">esperando...</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.value}
                  onClick={() => { setInput(a.value); handleSubmit(a.value); }}
                  className="text-xs px-3 py-1.5 border border-white/10 rounded-full hover:border-violet-500/50 hover:text-violet-300 transition-colors"
                >
                  {a.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="space-y-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                placeholder='Ej: "Pay $300 USD to Shenzhen supplier for electronics parts"'
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 resize-none focus:outline-none focus:border-violet-500/50 transition-colors text-sm"
              />
              <button
                onClick={() => handleSubmit()}
                disabled={loading || !input.trim()}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? "Procesando con IA..." : "Ejecutar →"}
              </button>
            </div>

            {error && <div className="border border-red-500/30 bg-red-500/10 rounded-xl p-4 text-red-400 text-sm">{error}</div>}
            {result && <ResultCard result={result} />}
          </div>

          {/* Right: Audit + Treasury */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Audit Trail — Arbitrum</h2>
              <span className="text-xs text-gray-600">{history.length + batchResults.length} txs</span>
            </div>

            {history.length === 0 && batchResults.length === 0 ? (
              <div className="border border-white/5 rounded-xl p-8 text-center text-gray-600 text-xs">
                Cada acción genera una transacción verificable en Arbitrum Sepolia.
              </div>
            ) : (
              <div className="space-y-2">
                {[...batchResults.map((b) => b.result), ...history].slice(0, 12).map((h, i) => (
                  <AuditItem key={i} result={h} />
                ))}
              </div>
            )}

            {/* EtherFuse Treasury — REAL onramp/offramp on Base */}
            <EtherfusePanel />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page Entry ─────────────────────────────────────────────────
export default function DemoPage() {
  const { ready, authenticated, login, user, getAccessToken } = usePrivy();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [userCtx, setUserCtx] = useState<UserContext | null>(null);

  useEffect(() => {
    if (!ready || !authenticated) {
      setCheckingOnboarding(false);
      return;
    }
    (async () => {
      try {
        const token = await getAccessToken();
        const status = await api.get<{ onboarded: boolean }>("/onboarding/status", token ?? undefined);
        if (status.onboarded) {
          // Load full context for personalized dashboard
          const ctx = await api.get<UserContext>("/onboarding/me", token ?? undefined);
          setUserCtx(ctx);
        } else {
          setNeedsOnboarding(true);
        }
      } catch (err) {
        console.error("Onboarding check failed", err);
      } finally {
        setCheckingOnboarding(false);
      }
    })();
  }, [ready, authenticated]);

  if (!ready || checkingOnboarding) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 24, height: 24, border: "2px solid #C9B79C", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginGate onLogin={login} />;
  }

  if (needsOnboarding) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 }}>Bienvenido a Handle.Fi</h1>
          <p style={{ fontSize: 14, color: "#6B675F", marginBottom: 32, lineHeight: 1.6 }}>
            Antes de empezar necesitamos conocer tu empresa para configurar tu agente de IA con
            las políticas correctas, vendors y treasury según tu industria.
          </p>
          <a
            href="/onboarding"
            style={{
              display: "inline-block",
              padding: "12px 28px",
              backgroundColor: "#1A1A1A",
              color: "#FFFFFF",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Comenzar setup (60s) →
          </a>
          <div style={{ fontSize: 11, color: "#9B9690", marginTop: 16 }}>
            4 preguntas · KYC ficticio para el demo
          </div>
        </div>
      </div>
    );
  }

  const email = user?.email?.address ?? user?.wallet?.address?.slice(0, 10) + "...";
  const fallbackCtx: UserContext = {
    organization: null,
    agent: null,
    policy: null,
    vendors: [],
    employees: [],
  };
  return <DemoApp userEmail={email} ctx={userCtx ?? fallbackCtx} />;
}

// ── Sub-components ─────────────────────────────────────────────
function ResultCard({ result }: { result: ActionResult }) {
  const approved = result.decision.approved;
  return (
    <div className={`border rounded-xl p-5 space-y-4 ${approved ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
      <div className={`text-2xl font-black ${approved ? "text-green-400" : "text-red-400"}`}>
        {approved ? "✓ APROBADO" : "✗ RECHAZADO"}
      </div>
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <div className="text-gray-500 uppercase tracking-wider mb-1">Intent detectado</div>
          <div className="font-mono bg-black/40 rounded p-2 space-y-1">
            <div><span className="text-gray-500">tipo:</span> <span className="text-white">{result.intent.actionType}</span></div>
            {result.intent.amount && <div><span className="text-gray-500">monto:</span> <span className="text-white">${result.intent.amount} {result.intent.currency}</span></div>}
            {result.intent.recipient && <div><span className="text-gray-500">destinatario:</span> <span className="text-white truncate block">{result.intent.recipient}</span></div>}
          </div>
        </div>
        <div>
          <div className="text-gray-500 uppercase tracking-wider mb-1">Reglas verificadas</div>
          <div className="space-y-1">
            {result.decision.checkedRules.map((r) => (
              <div key={r} className="flex items-center gap-1 text-gray-400">
                <span className={approved ? "text-green-400" : "text-red-400"}>✓</span> {r}
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className={`text-sm ${approved ? "text-green-300" : "text-red-300"}`}>{result.decision.reason}</p>
      {result.audit.txHash && (
        <a href={result.audit.arbiscanUrl!} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-violet-400 hover:text-violet-300">
          <span className="w-2 h-2 rounded-full bg-violet-400" />
          Ver en Arbiscan → {result.audit.txHash.slice(0, 18)}...
        </a>
      )}
      {result.bitso && (
        <div className="text-xs text-gray-500 border-t border-white/5 pt-3">
          Bitso Business: <span className="text-white font-mono">{result.bitso.transactionId}</span> — {result.bitso.status}
        </div>
      )}
    </div>
  );
}

function AuditItem({ result }: { result: ActionResult }) {
  const approved = result.decision.approved;
  return (
    <div className="border border-white/5 rounded-lg p-3 bg-white/[0.02] space-y-1">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${approved ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
          {approved ? "✓" : "✗"} {result.action.status}
        </span>
        <span className="text-xs text-gray-600">{result.intent.actionType}</span>
      </div>
      {result.intent.amount && (
        <div className="text-xs text-gray-400">${result.intent.amount} {result.intent.currency}{result.intent.recipient ? ` · ${result.intent.recipient}` : ""}</div>
      )}
      {result.audit.txHash && (
        <a href={result.audit.arbiscanUrl!} target="_blank" rel="noopener noreferrer"
          className="text-xs text-violet-500 font-mono truncate block hover:text-violet-400">
          {result.audit.txHash.slice(0, 22)}...
        </a>
      )}
    </div>
  );
}

// ── EtherFuse Panel ─────────────────────────────────────────────
interface EfState {
  loading: boolean;
  step: "idle" | "quoting" | "onramping" | "offramping" | "done";
  amount: number;
  quote?: any;
  onrampResult?: any;
  offrampResult?: any;
  error?: string;
}

function EtherfusePanel() {
  const [amount, setAmount] = useState(300);
  const [state, setState] = useState<EfState>({ loading: false, step: "idle", amount: 300 });
  const [yieldEarned, setYieldEarned] = useState(0);

  // Animate yield accrual when we have a position
  useEffect(() => {
    if (state.step !== "done" || !state.onrampResult) return;
    const cetes = parseFloat(state.onrampResult.etherfuse?.destinationCETES ?? "0");
    const apyDaily = 9.1 / 365 / 100;
    const interval = setInterval(() => {
      setYieldEarned((prev) => prev + cetes * apyDaily / 86400 * 5);
    }, 5000);
    return () => clearInterval(interval);
  }, [state.step, state.onrampResult]);

  async function runOnramp() {
    setState({ loading: true, step: "quoting", amount, error: undefined });
    try {
      const data = await api.post<any>("/treasury/onramp", { amountMXN: amount });
      setState({ loading: false, step: "done", amount, onrampResult: data });
    } catch (err: any) {
      setState({ loading: false, step: "idle", amount, error: err.message ?? "Error" });
    }
  }

  async function runOfframp() {
    if (!state.onrampResult) return;
    setState((s) => ({ ...s, loading: true, step: "offramping", error: undefined }));
    try {
      const cetesAmount = Math.max(50, Math.floor(parseFloat(state.onrampResult.etherfuse?.destinationCETES ?? "100") * 0.5));
      const data = await api.post<any>("/treasury/offramp", { amountCETES: cetesAmount });
      setState((s) => ({ ...s, loading: false, step: "done", offrampResult: data }));
    } catch (err: any) {
      setState((s) => ({ ...s, loading: false, error: err.message ?? "Error" }));
    }
  }

  function reset() {
    setState({ loading: false, step: "idle", amount });
    setYieldEarned(0);
  }

  const hasOnramp = !!state.onrampResult;
  const hasOfframp = !!state.offrampResult;

  return (
    <div
      style={{ border: "1px solid #E5E1DA", borderRadius: 14, backgroundColor: "#FFFFFF", marginTop: 16 }}
      className="p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 11, color: "#8A7560", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              EtherFuse Treasury
            </span>
            <span style={{ fontSize: 9, color: "#2E6F4E", backgroundColor: "rgba(46,111,78,0.10)", padding: "2px 6px", borderRadius: 99, border: "1px solid rgba(46,111,78,0.2)" }}>
              ● LIVE on Base
            </span>
          </div>
          <div style={{ fontSize: 10, color: "#9B9690", marginTop: 2 }}>
            CETES tokenizado · APY 9.1% · Sandbox
          </div>
        </div>
        {hasOnramp && (
          <button onClick={reset} style={{ fontSize: 10, color: "#9B9690" }}>↻ Reset</button>
        )}
      </div>

      {/* Step 1: Onramp form */}
      {!hasOnramp && (
        <div className="space-y-2">
          <div style={{ fontSize: 11, color: "#6B675F" }}>
            TreasuryBot va a invertir cash idle en CETES via EtherFuse Ramp API
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={10}
              max={500}
              value={amount}
              onChange={(e) => setAmount(Math.min(500, Math.max(10, parseInt(e.target.value) || 0)))}
              style={{ width: 80, padding: "6px 8px", fontSize: 12, border: "1px solid #E5E1DA", borderRadius: 6, color: "#1A1A1A" }}
            />
            <span style={{ fontSize: 11, color: "#6B675F" }}>MXN → CETES</span>
            <button
              onClick={runOnramp}
              disabled={state.loading || amount > 500}
              style={{
                marginLeft: "auto",
                padding: "6px 14px",
                fontSize: 11,
                fontWeight: 600,
                backgroundColor: state.loading ? "#C9B79C" : "#1A1A1A",
                color: "#FFFFFF",
                borderRadius: 8,
                cursor: state.loading ? "wait" : "pointer",
              }}
            >
              {state.loading && state.step === "quoting" ? "Procesando..." : "Invertir →"}
            </button>
          </div>
          <div style={{ fontSize: 10, color: "#9B9690" }}>
            Sandbox max: 500 MXN. Quote real desde EtherFuse API.
          </div>
        </div>
      )}

      {/* Step 2: Onramp result */}
      {hasOnramp && (
        <div className="space-y-2">
          <div style={{ backgroundColor: "#F5F2EC", border: "1px solid #E5E1DA", borderRadius: 8, padding: 10 }}>
            <div className="flex items-center justify-between" style={{ fontSize: 11 }}>
              <span style={{ color: "#6B675F" }}>Posición CETES</span>
              <span style={{ color: "#1A1A1A", fontWeight: 600, fontFamily: "monospace" }}>
                {parseFloat(state.onrampResult.etherfuse?.destinationCETES ?? "0").toFixed(2)} CETES
              </span>
            </div>
            <div className="flex items-center justify-between mt-1" style={{ fontSize: 10 }}>
              <span style={{ color: "#9B9690" }}>Invertido</span>
              <span style={{ color: "#6B675F", fontFamily: "monospace" }}>
                {amount} MXN @ {state.onrampResult.etherfuse?.exchangeRate}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1" style={{ fontSize: 10 }}>
              <span style={{ color: "#9B9690" }}>Yield acumulado</span>
              <span style={{ color: "#2E6F4E", fontWeight: 600, fontFamily: "monospace" }}>
                +{yieldEarned.toFixed(4)} CETES
              </span>
            </div>
          </div>

          {/* Order details */}
          <details style={{ fontSize: 10 }}>
            <summary style={{ color: "#9B9690", cursor: "pointer" }}>Ver order ID + CLABE</summary>
            <div style={{ marginTop: 6, padding: 8, backgroundColor: "#F5F2EC", borderRadius: 6, fontFamily: "monospace", color: "#6B675F", wordBreak: "break-all" }}>
              <div>Order: {state.onrampResult.etherfuse?.orderId}</div>
              <div>CLABE: {state.onrampResult.etherfuse?.depositClabe}</div>
              <div>Status: {state.onrampResult.etherfuse?.status}</div>
              <div>Fee: {state.onrampResult.etherfuse?.feeBps} bps</div>
            </div>
          </details>

          {/* Offramp action */}
          {!hasOfframp && (
            <button
              onClick={runOfframp}
              disabled={state.loading}
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: 11,
                fontWeight: 600,
                backgroundColor: state.loading ? "#C9B79C" : "#FFFFFF",
                color: "#1A1A1A",
                border: "1px solid #1A1A1A",
                borderRadius: 8,
                cursor: state.loading ? "wait" : "pointer",
              }}
            >
              {state.loading && state.step === "offramping" ? "Procesando offramp..." : "🔁 Offramp 50% → MXN al banco"}
            </button>
          )}

          {/* Offramp result */}
          {hasOfframp && (
            <div style={{ backgroundColor: "rgba(46,111,78,0.08)", border: "1px solid rgba(46,111,78,0.25)", borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 10, color: "#2E6F4E", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 4 }}>
                ✓ Offramp completado
              </div>
              <div className="flex items-center justify-between" style={{ fontSize: 11 }}>
                <span style={{ color: "#6B675F" }}>Retorno al banco</span>
                <span style={{ color: "#1A1A1A", fontWeight: 600, fontFamily: "monospace" }}>
                  {parseFloat(state.offrampResult.etherfuse?.destinationMXN ?? "0").toFixed(2)} MXN
                </span>
              </div>
              <div style={{ fontSize: 10, color: "#9B9690", marginTop: 4 }}>
                Order: {state.offrampResult.etherfuse?.orderId?.slice(0, 18)}...
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {state.error && (
        <div style={{ fontSize: 10, color: "#A54545", backgroundColor: "rgba(165,69,69,0.06)", padding: 6, borderRadius: 6 }}>
          {state.error}
        </div>
      )}

      <div style={{ paddingTop: 6, borderTop: "1px solid #E5E1DA", fontSize: 9, color: "#9B9690" }}>
        Real API calls → EtherFuse sandbox · Chain: Base EVM · CETES: 0xcC77c...cE29
      </div>
    </div>
  );
}
