# Handle.Fi — Pitch de 3 minutos

> **Duración total:** 2:55 (margen 5s)
> **Formato:** demo en vivo + narración
> **Audiencia:** jueces de hackathon Web3 LATAM, fundadores Etherfuse / Bitso / Arbitrum / Privy

---

## 🎯 Estructura visual

```
0:00 ───── 0:25 ───── 0:55 ───────────── 2:35 ─── 2:55
  Hook    Solución         Demo en vivo      Cierre
  +Pain   +Stack            (5 momentos)
```

---

## 🎤 Script completo

### **[0:00 – 0:25] HOOK + PROBLEMA**

> *"Hoy una PyME mexicana que paga a 50 proveedores extranjeros pierde **3,000 dólares al mes solo en fees bancarios** — más 5 días de su contador conciliando CFDIs manualmente, mientras su cash ocioso rinde cero."*
>
> *"El problema no es la tecnología. Es que **nadie le ha dado a esos negocios una capa financiera moderna, con compliance mexicano, en una sola plataforma**."*

**Acción visual:** estás en la landing page con el hero "Las finanzas de tu empresa, en automático."

---

### **[0:25 – 0:55] SOLUCIÓN + STACK**

> *"Handle.Fi es la plataforma financiera con agentes de IA para empresas en LATAM. Nuestro stack:*
> - *Privy para auth y wallets embebidas — nuestros usuarios no ven seed phrases."*
> - *Arbitrum One para el smart contract de auditoría — cada decisión queda inmutable on-chain."*
> - *Etherfuse para tokenizar pesos en CETES — 9% APY automático sobre el cash idle."*
> - *Y Llama 3.3 vía Groq para el agente que entiende lenguaje natural."*
>
> *"Vamos a verlo en vivo."*

**Acción visual:** scroll rápido por la sección "Platform" mostrando logos. Cambia a `/demo`.

---

### **[0:55 – 1:25] DEMO PARTE 1 — Onboarding 60s**

> *"Cualquier empresa entra con email vía Privy. Y en 4 pasos completa su perfil:"*

1. Click "Comenzar setup" → mostrás el wizard
2. Llenas rápido: **"Manufacturas del Valle"**, **Manufactura**, **50 empleados**, **$50K MXN/mes**, proveedores intl ✅, $25K USD idle, yield ✅
3. Click "Crear mi cuenta"

> *"Lo que pasa por debajo: nuestro Policy Engine genera reglas a la medida — límite por transacción, límite diario, monedas permitidas — y registra la credencial KYA del agente **on-chain en Arbitrum**. Aquí está la transacción."*

**Acción visual:** clicas en la TX hash verde → se abre Arbiscan. Cierras la pestaña.

---

### **[1:25 – 2:00] DEMO PARTE 2 — Pagos en lenguaje natural**

> *"Ahora el dashboard ya tiene a mis 4 proveedores reales — China, México y Polonia. El CFO le dice al agente:"*

Escribes en el textarea: **"Pay 300 USD to Shenzhen Tech Parts for electronics parts"**

> *"OpenAI compatible vía Llama 3.3 parsea el intento. El Policy Engine — **código determinista, no IA** — evalúa cada regla. Aprobado en menos de un segundo. Y aquí está la nueva transacción on-chain."*

(Sale el card verde APROBADO + TX en Arbiscan)

> *"Ahora intentemos algo que viola la política:"*

Escribes: **"Pay 2000 USD to vendor"**

> *"Rechazado. La razón es explícita. Y lo más importante: **también queda auditado on-chain**. Los jueces pueden ir a Arbiscan y ver cada decisión — aprobada o rechazada — del agente."*

**Acción visual:** card rojo RECHAZADO con la razón.

---

### **[2:00 – 2:35] DEMO PARTE 3 — Treasury con Etherfuse**

> *"El agente de Tesorería detecta cash idle. Mira este panel:"*

Click en "Invertir" con 300 MXN en el panel EtherFuse.

> *"Llamada real al sandbox de Etherfuse. 300 pesos se convierten a CETES tokenizados en **Base** — chain EVM, compatible con nuestro stack de Arbitrum. Aquí ves la order, el CLABE de depósito, el yield acumulándose."*

Esperas 2s a que cargue el resultado.

> *"Y cuando necesite el dinero, **un click** y hace offramp de vuelta al banco vía SPEI."*

Click "🔁 Offramp 50% → MXN al banco"

> *"Ciclo completo: banco → CETES → banco. El cash trabaja mientras espera."*

---

### **[2:35 – 2:55] CIERRE**

> *"En 3 minutos: una empresa mexicana se onboardeó, configuró su agente, hizo un pago internacional aprobado, uno rechazado por política — **todos auditados on-chain** — e invirtió cash idle en CETES que generan yield real."*
>
> *"Esto es Handle.Fi. La capa financiera por defecto para empresas en LATAM."*
>
> *"Gracias."*

---

## 🎬 Guión de demo paso a paso (cheat sheet)

```
ESTADO INICIAL:
  - Tab abierto en http://localhost:3000 (landing)
  - Tab abierto en https://sepolia.arbiscan.io/address/0x783678ec3d8F8baCB1a6ac8eDc021A3B0b8E5344
  - Login Privy NO hecho (deslogear antes de empezar)
  - User en DB limpio (ya está)

DURANTE EL PITCH:

[Hook] - Quédate en landing. Scroll rápido para mostrar diseño.

[Onboarding] - Ve a /demo:
  1. Login Privy (5s)
  2. Click "Comenzar setup"
  3. Step 1: "Manufacturas del Valle" + Manufactura
  4. Step 2: 50 empleados + $50K + ✅ intl
  5. Step 3: $25K USD + ✅ yield
  6. Step 4: Click "Crear mi cuenta"
  7. Step 5: SEÑALA el card verde ON-CHAIN. Click en TX hash.

[Pago aprobado]:
  - Click el botón rápido "Paga $300 USD → China" O escribe manualmente
  - Espera el resultado verde APROBADO
  - Click el TX hash → Arbiscan

[Pago rechazado]:
  - Click "Paga $2,000 USD (RECHAZADO)" O escribe manualmente
  - Señala la razón en rojo

[Treasury]:
  - Panel derecho EtherFuse
  - Pon 300 MXN → "Invertir"
  - Espera ~3s
  - Señala order ID + CLABE
  - Click "Offramp 50% → MXN"

[Cierre] - Vuelve a la landing.
```

---

## 💡 Tips de presentación

### Antes del pitch
- ✅ **Limpiar tu user en DB** para que el wizard arranque fresco
- ✅ **API + frontend corriendo** y probados 5 min antes
- ✅ **Tener 2 ventanas Chrome lado a lado**: una con `/demo`, otra con Arbiscan abierto
- ✅ **Sonido off**, modo cinema si proyectas
- ✅ **Token de Privy vencido?** — pruébalo antes con el email del demo

### Durante
- 🎯 **Hablar mientras tipeas**: nunca silencio incómodo
- 🎯 **Resaltar la palabra ON-CHAIN** cada vez que aparece TX en Arbiscan
- 🎯 **Si algo falla**: di *"esto es sandbox, pero la lógica está aquí"* y sigue
- 🎯 **No leas literal el script** — apréndete los puntos, improvisa el tono

### Trucos pro
- Si tienes 2 personas, **una habla y otra demuestra** (más fluido)
- Acelera el wizard con **valores prellenados** si te da margen (puedes setear defaults en el código antes del pitch)
- Si el deploy de Arbitrum tarda, **abre Arbiscan ANTES** y di "aquí está donde aterriza la TX"

---

## 🏆 Premios a ganar (menciónalos en el cierre si te queda tiempo)

| Sponsor | Track | Nuestra evidencia |
|---|---|---|
| **Etherfuse** | "Ramp in and out of bank accounts" | Ciclo completo MXN → CETES → MXN funcionando en Base sandbox |
| **Arbitrum** | Best use of L2 | HandleRegistry deployado, eventos verificables |
| **Privy** | Best use of embedded wallets | Auth completo + email login + sin seed phrases |
| **Bitso** | MXNB integration | Mock de pagos vía SPEI/USDC (arquitectura lista para sandbox) |

---

## 📦 One-liner final (úsalo en redes después)

> **"Handle.Fi: agentes de IA con identidad on-chain que ejecutan pagos, nómina y tesorería para empresas en LATAM. Privy + Arbitrum + Etherfuse + Bitso. Web3 invisible. LATAM primero."**

---

**Hashtags / tags:** #Web3 #LATAM #AgentAI #Stablebonds #CETES #DeFi #Etherfuse #Privy #Arbitrum #BitsoBusiness
