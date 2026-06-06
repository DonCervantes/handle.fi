"use client";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-black border-t border-white/5 py-16 px-6">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Top */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center">
              <img src="/logo.png" alt="Handle.Fi" className="h-11 w-auto object-contain" style={{ mixBlendMode: "multiply" }} />
            </div>
            <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
              La plataforma financiera con agentes de IA para empresas en LatAm.
              Web3 invisible. Construido en México.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.linkedin.com/in/daniel-adrian-elias-cruz-cervantes-13a37a279/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-400 text-sm transition-colors"
              >
                LinkedIn
              </a>
              <a
                href="https://x.com/back_oficina"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-400 text-sm transition-colors"
              >
                X
              </a>
            </div>
          </div>

          {/* Links */}
          {[
            { title: "Producto", links: ["Platform", "Agents", "Security", "Integraciones", "Demo"] },
            { title: "Empresa", links: ["About", "Blog", "Careers", "Press", "Contact"] },
            { title: "Legal", links: ["Privacidad", "Términos", "Cookies", "Compliance"] },
          ].map((col) => (
            <div key={col.title} className="space-y-4">
              <div className="text-white text-sm font-medium">{col.title}</div>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-gray-600 hover:text-gray-400 text-sm transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5">
          <p className="text-gray-700 text-xs">
            © Handle.Fi 2026. Construido en LatAm.
          </p>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <button className="px-2 py-1 rounded hover:text-gray-400 transition-colors">ES</button>
            <span>/</span>
            <button className="px-2 py-1 rounded hover:text-gray-400 transition-colors">EN</button>
            <span>/</span>
            <button className="px-2 py-1 rounded hover:text-gray-400 transition-colors">PT</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
