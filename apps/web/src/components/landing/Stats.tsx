"use client";

const STATS = [
  { value: "90%", label: "menos tiempo en conciliación contable" },
  { value: "<30s", label: "para pagar a un proveedor internacional" },
  { value: "9% APY", label: "en cash ocioso, automático con CETES" },
  { value: "5x", label: "más rápido el cierre mensual" },
];

export function Stats() {
  return (
    <section className="py-20 px-6" style={{ backgroundColor: "#F5F2EC", borderTop: "1px solid #E5E1DA", borderBottom: "1px solid #E5E1DA" }}>
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-sm mb-12 uppercase tracking-widest" style={{ color: "#9B9690" }}>
          El impacto en números
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center space-y-2">
              <div className="text-4xl md:text-5xl font-bold" style={{ color: "#1A1A1A" }}>
                {s.value}
              </div>
              <p className="text-sm" style={{ color: "#6B675F" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
