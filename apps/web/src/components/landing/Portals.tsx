"use client";

const PORTALS = [
  {
    name: "Portal del Proveedor",
    icon: "📦",
    desc: "Tus proveedores entran con su email. Ven sus facturas, el status de pago y cuándo cobrarán. Suben facturas nuevas sin enviarte emails.",
    features: ["Status de cada factura en tiempo real", "Historial de pagos descargable", "Actualizar wallet o cuenta bancaria", "Subir facturas desde el portal"],
    tag: "Gratis para tu proveedor",
  },
  {
    name: "Portal del Cliente",
    icon: "🤝",
    desc: "Tus clientes ven lo que te deben y pagan con un click. Tú dejas de perseguirlos por teléfono.",
    features: ["Ver facturas pendientes y vencidas", "Pagar vía SPEI, tarjeta o USDC", "Descargar CFDI y complementos", "Solicitar extensión de pago"],
    tag: "Cobra más rápido",
  },
  {
    name: "Portal del Empleado",
    icon: "👤",
    desc: "Tu equipo entra con su email corporativo. Ve sus recibos, levanta peticiones y actualiza su método de pago sin molestar a RH.",
    features: ["Recibos de nómina CFDI descargables", "Solicitar reembolso con foto del ticket", "Adelanto de sueldo en 1-click", "Actualizar wallet o cuenta"],
    tag: "Tu equipo más feliz",
  },
];

export function Portals() {
  return (
    <section className="bg-black py-24 px-6">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <p className="text-violet-400 text-sm font-medium uppercase tracking-widest">Multi-portal</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Tus proveedores, clientes y empleados
            <br />
            <span className="text-gray-500">también entran.</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Cada uno con su propio login — solo su email. Ve solo lo suyo.
            Tú ves todo. Sin mezclar información entre partes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PORTALS.map((p) => (
            <div key={p.name} className="border border-white/8 rounded-2xl overflow-hidden bg-white/[0.02] flex flex-col">
              <div className="p-6 flex-1 space-y-4">
                <div className="text-3xl">{p.icon}</div>
                <div>
                  <h3 className="text-white font-semibold text-lg">{p.name}</h3>
                  <span className="inline-block mt-1 text-xs text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded-full border border-violet-400/20">
                    {p.tag}
                  </span>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">{p.desc}</p>
                <ul className="space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                      <span className="text-violet-400 text-xs">→</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Inbox */}
        <div className="border border-white/8 rounded-2xl bg-white/[0.02] overflow-hidden">
          <div className="p-8 md:grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-4 mb-8 md:mb-0">
              <p className="text-violet-400 text-sm font-medium uppercase tracking-widest">Inbox unificado</p>
              <h3 className="text-3xl font-bold text-white">Todas las peticiones en un solo lugar.</h3>
              <p className="text-gray-400 leading-relaxed">
                Reembolsos de empleados, facturas nuevas de proveedores, disputas de clientes, solicitudes
                de adelanto. Todo llega aquí. Apruebas desde tu teléfono con un click.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                {["Políticas de aprobación por monto", "Notificaciones email + WhatsApp", "Audit log con timestamps"].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-violet-400">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
            {/* Mock inbox */}
            <div className="border border-white/10 rounded-xl bg-black p-4 space-y-2">
              {[
                { type: "Reembolso", from: "Ana M. (Empleada)", amount: "$450 MXN", priority: "Normal", status: "Pendiente" },
                { type: "Factura nueva", from: "Proveedor Tech SRL", amount: "$28,000 MXN", priority: "Alta", status: "Pendiente" },
                { type: "Adelanto", from: "Carlos R. (Empleado)", amount: "$5,000 MXN", priority: "Normal", status: "Aprobado" },
                { type: "Extensión de pago", from: "Cliente ABC", amount: "$120,000 MXN", priority: "Alta", status: "Revisión" },
              ].map((req) => (
                <div key={req.from} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5 text-xs">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    req.status === "Aprobado" ? "bg-green-400" :
                    req.priority === "Alta" ? "bg-yellow-400" : "bg-gray-600"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium">{req.type}</div>
                    <div className="text-gray-600 truncate">{req.from}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-violet-400">{req.amount}</div>
                    <div className={`text-xs ${req.status === "Aprobado" ? "text-green-400" : "text-gray-600"}`}>{req.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
