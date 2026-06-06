"use client";

const PARTNERS = [
  "Arbitrum", "Privy", "Bitso Business", "EtherFuse", "Sumsub",
  "Arbitrum", "Privy", "Bitso Business", "EtherFuse", "Sumsub",
];

const PRESS = ["Forbes México", "El Economista", "Expansión", "TechCrunch", "CoinDesk LatAm"];

export function LogoBar() {
  return (
    <section className="border-y border-white/5 bg-black py-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 space-y-10">
        {/* Partners */}
        <div>
          <p className="text-center text-xs text-gray-600 uppercase tracking-widest mb-6">
            Construido con los mejores
          </p>
          <div className="flex gap-10 overflow-hidden">
            <div className="flex gap-10 animate-[scroll_20s_linear_infinite] whitespace-nowrap">
              {PARTNERS.map((name, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors cursor-default flex-shrink-0">
                  <div className="w-6 h-6 rounded bg-white/5 border border-white/10" />
                  <span className="text-sm font-medium">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <style jsx>{`
        @keyframes scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
