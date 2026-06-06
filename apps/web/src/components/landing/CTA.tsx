"use client";
import Link from "next/link";

export function CTA() {
  return (
    <section className="bg-white py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative border border-[#E5E1DA] rounded-3xl overflow-hidden bg-[#F5F2EC] p-12 md:p-16 text-center">
          <div className="relative space-y-6">
            <p className="text-[#C9B79C] text-sm font-medium uppercase tracking-widest">
              Empieza hoy
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1A1A1A]">
              ¿Listo para poner tus finanzas
              <br />en piloto automático?
            </h2>
            <p className="text-[#6B675F] max-w-lg mx-auto">
              Demo de 20 minutos. Sin compromiso. Te mostramos el flujo completo con datos reales de tu industria.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/demo"
                style={{ backgroundColor: "#1A1A1A", color: "#FFFFFF" }}
                className="px-8 py-4 font-semibold rounded-xl transition-all hover:scale-105 text-base"
              >
                Agendar demo de 20 min →
              </Link>
              <Link
                href="/dashboard"
                className="px-8 py-4 border border-[#E5E1DA] hover:border-[#C9B79C] text-[#1A1A1A] font-medium rounded-xl transition-all text-base"
              >
                Crear cuenta gratis
              </Link>
            </div>
            <p className="text-[#9B9690] text-xs">
              Sin tarjeta de crédito · Setup en 10 minutos · Soporte en español
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
