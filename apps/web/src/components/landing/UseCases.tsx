"use client";

const CASES = [
  { title: "PyME importadora", desc: "Paga 50 proveedores chinos al mes. Sin SWIFT, sin fees, en minutos.", icon: "🏭" },
  { title: "Startup con equipo global", desc: "Nómina en 6 países. USDC para extranjeros, SPEI para México.", icon: "🌎" },
  { title: "Manufacturera cross-border", desc: "Tesorería multi-moneda con yield en CETES y US Treasuries.", icon: "⚙️" },
  { title: "Despacho contable", desc: "Administra 30 clientes desde una consola. 5x más productivo.", icon: "📊" },
  { title: "Comercio internacional", desc: "Importa de Asia, exporta a US. Conciliación automática.", icon: "🚢" },
  { title: "SaaS B2B", desc: "Burn rate visible en tiempo real. Contratistas en 5 países.", icon: "💻" },
  { title: "Agencia de marketing", desc: "Reembolsos y viáticos de equipo en automático.", icon: "📣" },
  { title: "Constructora", desc: "Pago a subcontratistas y proveedores con flujos de aprobación.", icon: "🏗️" },
];

export function UseCases() {
  return (
    <section className="bg-black py-24 px-6">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <p className="text-violet-400 text-sm font-medium uppercase tracking-widest">Casos de uso</p>
          <h2 className="text-4xl font-bold text-white">
            Para cualquier empresa que opera en LatAm.
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CASES.map((c) => (
            <div key={c.title} className="border border-white/8 rounded-xl p-5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-violet-500/20 transition-all cursor-default group">
              <div className="text-2xl mb-3">{c.icon}</div>
              <div className="text-white text-sm font-medium mb-1 group-hover:text-violet-300 transition-colors">{c.title}</div>
              <div className="text-gray-600 text-xs leading-relaxed">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
