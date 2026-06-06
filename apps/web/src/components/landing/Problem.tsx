"use client";

const PAINS = [
  {
    icon: "💸",
    title: "Pagos internacionales caros y lentos",
    body: "SWIFT tarda 1–5 días, cuesta $25–80 USD por transferencia, y pierdes 1.5–3% en spread de FX. Con 50 proveedores al mes: $3,000 USD perdidos en fees.",
  },
  {
    icon: "📊",
    title: "Cuentas por cobrar sin visibilidad",
    body: "No sabes cuánto te deben, quién está vencido, ni cuándo cobrarás. Persigues a clientes por WhatsApp mientras el contador arma Excel.",
  },
  {
    icon: "📋",
    title: "Conciliación contable manual",
    body: "Cada pago debe cruzar con su CFDI 4.0 y Complemento de Pago. Tus contadores pasan 5 días al mes en esto. Ningún software lo hizo bien.",
  },
  {
    icon: "🏦",
    title: "Cash ocioso que no rinde",
    body: "Tienes $1M MXN en cuenta de cheques ganando 0%. CETES requiere KYC, casa de bolsa, papeleo. Nunca lo haces porque la fricción es demasiada.",
  },
];

export function Problem() {
  return (
    <section className="bg-black py-24 px-6">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <p className="text-violet-400 text-sm font-medium uppercase tracking-widest">El problema</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Las finanzas de tu empresa siguen viviendo
            <br />
            <span className="text-gray-500">en 7 herramientas distintas.</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Banco + Excel + ERP + Deel + WhatsApp con contador + SAT + email.
            Ninguna se habla con las demás. Tu equipo paga el precio.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {PAINS.map((pain) => (
            <div
              key={pain.title}
              className="border border-white/8 rounded-2xl p-6 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group"
            >
              <div className="text-3xl mb-4">{pain.icon}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{pain.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{pain.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
