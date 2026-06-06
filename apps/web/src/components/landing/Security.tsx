"use client";

const PILLARS = [
  { num: "01", title: "Encriptación end-to-end", desc: "AES-256 en reposo, TLS 1.3 en tránsito. PII encriptado a nivel columna con AWS KMS. Tus datos nunca viajan en texto plano." },
  { num: "02", title: "Multi-firma para tu tesorería", desc: "Safe (Gnosis) multisig para la wallet de tu empresa. Políticas de firmas por monto. 1-de-1 para pagos pequeños, 2-de-3 para los grandes." },
  { num: "03", title: "Aislamiento total entre portales", desc: "Tenant isolation via Row-Level Security en Postgres. Un proveedor que trabaja con 3 empresas nunca cruza su información entre ellas." },
  { num: "04", title: "Cumplimiento LFPIORPI y CNBV", desc: "Registro como Actividad Vulnerable, reportes UIF, compliance AML. Operamos sobre rails regulados (Bitso IFPE). Sin licencia propia requerida." },
];

export function Security() {
  return (
    <section id="security" className="bg-[#07070f] border-y border-white/5 py-24 px-6">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <p className="text-violet-400 text-sm font-medium uppercase tracking-widest">Seguridad</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Tus datos, protegidos por diseño.
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            No es una capa encima — la seguridad está en la arquitectura desde el primer día.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {PILLARS.map((p) => (
            <div key={p.num} className="border border-white/8 rounded-2xl p-6 bg-white/[0.02] space-y-3 hover:border-violet-500/20 transition-colors">
              <span className="text-violet-400 font-mono text-sm font-bold">{p.num}</span>
              <h3 className="text-white font-semibold text-lg">{p.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap gap-4 justify-center">
          {["Arbitrum Verified", "Privy MPC", "Safe Multisig", "SOC 2 (en progreso)", "ISO 27001 (roadmap)"].map((b) => (
            <div key={b} className="px-4 py-2 border border-white/10 rounded-full text-xs text-gray-500 bg-white/[0.02]">
              {b}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
