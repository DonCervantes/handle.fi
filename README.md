# 🤝 Handle.Fi

> **La capa financiera por defecto para empresas en LATAM.**
> Agentes de IA con identidad on-chain que ejecutan pagos, nómina y tesorería.
> Web3 invisible. AI agéntica. LATAM primero.

[![Built with](https://img.shields.io/badge/Built%20with-Arbitrum%20%7C%20Privy%20%7C%20Etherfuse-1A1A1A?style=for-the-badge)]()

---

## 🎯 ¿Qué es Handle.Fi?

Handle.Fi permite que empresas en Latinoamérica deleguen operaciones financieras (pagos a proveedores, nómina, tesorería) a agentes de IA que actúan bajo permisos verificables on-chain. Cada decisión del agente queda auditada de manera inmutable en Arbitrum.

### Casos de uso

- **PyME importadora**: paga 50 proveedores chinos al mes sin SWIFT
- **Startup con equipo global**: nómina en 6 países en un click
- **Manufacturera cross-border**: tesorería multi-moneda con yield en CETES tokenizado
- **Despacho contable**: administra 30 clientes desde una sola consola

---

## 🛠 Stack técnico

| Capa | Tecnología | Función |
|---|---|---|
| **Frontend** | Next.js 14 + Tailwind | Landing + Dashboard + Wizard |
| **Backend** | Express + TypeScript + Prisma | API + Policy Engine |
| **Auth + Wallets** | [Privy](https://privy.io) | Embedded wallets sin seed phrases |
| **Smart Contract** | Solidity ^0.8.20 en Arbitrum Sepolia | KYA Credentials + Audit Trail |
| **AI** | [Groq](https://groq.com) + Llama 3.3 70B | Intent parser en lenguaje natural |
| **Tesorería** | [Etherfuse](https://etherfuse.com) Ramp API | MXN ↔ CETES en Base EVM |
| **DB** | Neon PostgreSQL | Multi-tenant con Row-Level Security |

---

## 🔗 Contrato en cadena

**HandleRegistry** desplegado en Arbitrum Sepolia:

```
0x783678ec3d8F8baCB1a6ac8eDc021A3B0b8E5344
```

Ver en Arbiscan → [sepolia.arbiscan.io](https://sepolia.arbiscan.io/address/0x783678ec3d8F8baCB1a6ac8eDc021A3B0b8E5344)

---

## 🏗 Arquitectura

```
┌─────────────────────────────────────────────────┐
│ Frontend (Next.js)        ─ Vercel             │
│   /          - Landing                          │
│   /onboarding - Wizard de 4 pasos              │
│   /demo       - Dashboard personalizado        │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│ API (Express + Prisma)    ─ Railway/Render     │
│   /onboarding   - KYC + auto-setup             │
│   /actions      - Pagos vía AI + Policy Engine │
│   /treasury     - Onramp/Offramp Etherfuse     │
│   /vendors      - Catálogo proveedores         │
│   /invoices     - Procesar facturas con AI     │
└─────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────────┐
│ Arbitrum │ │  Privy   │ │  Etherfuse   │
│ Sepolia  │ │  Auth    │ │  Ramp API    │
│ + Audit  │ │+Wallets  │ │  (Base EVM)  │
└──────────┘ └──────────┘ └──────────────┘
```

---

## 🚀 Quick start

```bash
# Clonar
git clone https://github.com/<tu-usuario>/handle.fi
cd handle.fi

# Instalar deps
npm install

# Variables de entorno (copiar y llenar)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local

# Aplicar esquema de DB
cd apps/api && npx prisma db push

# API
cd apps/api && npm run dev   # → http://localhost:3001

# Frontend (en otra terminal)
cd apps/web && npm run dev   # → http://localhost:3000
```

---

## 📦 Estructura del monorepo

```
handle.fi/
├── apps/
│   ├── web/              # Next.js 14
│   └── api/              # Express + Prisma
├── packages/
│   └── contracts/        # Hardhat + Solidity
├── PITCH.md              # Pitch de 3 min para hackathon
└── README.md             # Este archivo
```

---

## 🎬 Demo del flujo

1. **Onboarding** — el usuario entra con email vía Privy → completa wizard de 4 pasos sobre su empresa
2. **Policy generada** — el sistema calcula límites según ingresos/industria
3. **Credencial KYA on-chain** — se registra en HandleRegistry (TX visible en Arbiscan)
4. **Pago aprobado** — escribe "Pay $300 USD to supplier" → AI parsea → Policy Engine aprueba → TX en cadena
5. **Pago rechazado** — escribe "Pay $2,000 USD" → excede límite → TX de rechazo también en cadena
6. **Treasury** — invierte cash idle en CETES (Etherfuse Base) → yield 9.1% APY → offramp cuando se necesita

---

## 🏆 Sponsor tracks

Este proyecto compite por los premios de:

- **Etherfuse** — Integración completa MXN → CETES → MXN en Base sandbox
- **Arbitrum** — Smart contract `HandleRegistry` con events públicos
- **Privy** — Login + embedded wallets con sign de transacciones
- **Bitso** — Arquitectura preparada para SPEI + MXNB on Arbitrum

---

## 👤 Autor

**Daniel Adrián Elías Cruz Cervantes**
- LinkedIn: [linkedin.com/in/daniel-adrian-elias-cruz-cervantes](https://www.linkedin.com/in/daniel-adrian-elias-cruz-cervantes-13a37a279/)
- X: [@back_oficina](https://x.com/back_oficina)

---

## 📄 Licencia

MIT
