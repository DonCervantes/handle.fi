"use client";
import { useState } from "react";

const FAQS = [
  { q: "¿Necesito saber de blockchain o crypto?", a: "No. Handle.Fi usa blockchain por debajo para auditoría y pagos, pero nunca verás gas fees, seed phrases ni redes. Es completamente invisible para ti." },
  { q: "¿Es compatible con CFDI 4.0 y el SAT?", a: "Sí, es nativo. Validamos CFDIs en tiempo real contra el SAT, generamos complementos de pago automáticamente y preparamos tus declaraciones fiscales." },
  { q: "¿Cuánto tarda el onboarding?", a: "10 minutos para el KYB (verificación de empresa). 24 horas para conectar tus fuentes de datos y tener el primer agente funcionando." },
  { q: "¿Reemplazan a mi contador?", a: "No. Lo hacen 10x más productivo. Tu contador deja de capturar y conciliar manualmente — los agentes hacen ese trabajo. El criterio y la firma siguen siendo suyos." },
  { q: "¿Cómo protegen mi dinero?", a: "Safe (Gnosis) multisig para tu wallet empresarial. Políticas de firmas por monto. Auditorías de smart contracts. Custodia regulada via Bitso (IFPE)." },
  { q: "¿Mis empleados pueden ver los datos de los demás?", a: "No. Cada portal tiene Row-Level Security. Un empleado solo ve sus propios recibos y peticiones — nunca los de sus compañeros." },
  { q: "¿Qué pasa si hay una caída y no se paga nómina?", a: "SLA de 99.95%, redundancia activa, soporte 24/7 enterprise. Si hay un incidente, el sistema escala inmediatamente al responsable." },
  { q: "¿Tienen licencia o regulación?", a: "Operamos como tecnología sobre rails regulados (Bitso tiene IFPE de CNBV). Estamos registrados como Actividad Vulnerable ante la UIF." },
  { q: "¿Mi data entrena modelos de IA de terceros?", a: "No. Tu data es tuya. Cada empresa es un tenant aislado. Nunca usamos tu información financiera para entrenar modelos externos." },
  { q: "¿Funciona para nómina mexicana con IMSS e INFONAVIT?", a: "Sí. El Agente de Nómina calcula ISR, IMSS, INFONAVIT e ISN, genera recibos CFDI 4.0 y ejecuta vía SPEI. Cumple LFT Art. 101." },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-black py-24 px-6">
      <div className="max-w-3xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <p className="text-violet-400 text-sm font-medium uppercase tracking-widest">FAQ</p>
          <h2 className="text-4xl font-bold text-white">Preguntas frecuentes</h2>
        </div>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i} className="border border-white/8 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-white text-sm font-medium pr-4">{faq.q}</span>
                <span className={`text-gray-500 transition-transform flex-shrink-0 ${open === i ? "rotate-45" : ""}`}>
                  +
                </span>
              </button>
              {open === i && (
                <div className="px-6 pb-4">
                  <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
