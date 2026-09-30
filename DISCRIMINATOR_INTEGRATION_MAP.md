# 🗺️ X402-TSWP Discriminator Integration Map & Estate Audit
**Specification:** RFC-0402 / `draft-shabazz-http-x402-tswp-01`  
**Author:** Abdul Shabazz (`veritasvaultone@gmail.com`)  
**Typed Source of Truth (SSOT):** `apps/x402-tswp/src/discriminators.mjs` & `discriminators.d.ts`  
**Date:** September 30, 2026  
**Status:** Canonical Reference for Client & Server Agents (`root@delta` / `/opt/synapticchain`)  

---

## 1. Executive Context & Architectural Unification

This document establishes the **authoritative boundary between live on-chain/gateway discriminators and standards-track protocol specifications**. 

Historically, memo formats were documented as prose across multiple disparate modules (`apps/colosseum/lib/memos.ts`, `gateway.mjs`, `escrow-server/index.mjs`). This document and its companion module (`apps/x402-tswp/src/discriminators.mjs`) consolidate all 12 operational discriminators into a **single, typed, importable source of truth**.

---

## 2. Estate Matrix: Live vs. Standards-Track Discriminators

| Discriminator | Full Syntax | Estate Status | Active Rails | Primary Implementing Service | Real Live Example / Tx Citation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`X402G`** | `X402G:<challenge>` | 🟢 **LIVE_ONCHAIN** | XRPL Altnet, Solana Devnet | `mcp-402-gateway` (:8402) / `nodes-api` | `X402G:827da995-adda-4dd7-9fb5-d05338526873` (Live 402 challenge step 1) |
| **`X402W`** | `X402W:<window>:<syn_addr>` | 🟢 **LIVE_ONCHAIN** | XRPL Altnet, Solana Devnet | `mcp-402-gateway-escrow` (:8405) / `clearinghouse.mjs` | `X402W:1789811559:syn1eydur8g7d66xeq38mmxvg95h7e6crr2vtunpq8` (Solana `3WMyWWEf…`, XRPL `BD9E238C…`) |
| **`X402M`** | `X402M:<corridor>:<maker_syn>` | 🟢 **LIVE_ONCHAIN** | XRPL Altnet | `mcp-402-gateway` / `gateway.mjs` | `X402M:USD-TZS:syn1jh0hy5409y49kzh0uw83d395fcsg5qa7lyy` (Maker margin EscrowCreate) |
| **`X402MR`** | `X402MR:<corridor>:<maker_syn>`| 🟡 **LIVE_GATEWAY** | XRPL Altnet | `mcp-402-gateway` / COLOSSEUM §8.2 | `X402MR:USD-TZS:syn1jh0hy5409y49kzh0uw83d395fcsg5qa7lyy` (Margin return to maker) |
| **`X402E`** | `X402E:<corridor_id>:<uetr>` | 🟢 **LIVE_ONCHAIN** | XRPL Altnet | `mcp-402-gateway-escrow` (:8405) | `X402E:cTZS:e6a9972c-29b3-4f9e-a868-b78807d85317` (ISO 20022 pacs.008 linkage) |
| **`X402B`** | `X402B:<session>:<consumer>` | 🟢 **LIVE_ONCHAIN** | XRPL Altnet | `escrow-server/index.mjs` (:8405) | `X402B:bond-fcf217a2:syn1jh0hy5409y49kzh0uw83d395fcsg5qa7lyy` (Bond open deposit) |
| **`X402BN`** | `X402BN:<session>:<consumer>`| 🟢 **LIVE_ONCHAIN** | XRPL Altnet, Solana Devnet | `escrow-server/index.mjs` (:8405) | `X402BN:bond-fcf217a2:syn1jh0hy5409y49kzh0uw83d395fcsg5qa7lyy` (Netted bond fee settle) |
| **`X402BR`** | `X402BR:<session>:<consumer>`| 🟢 **LIVE_ONCHAIN** | XRPL Altnet | `escrow-server/index.mjs` (:8405) | `X402BR:bond-fcf217a2...` (XRPL Tx `CFBDADC090D440FFC08F17CF0A2D5839D434E2EA75ECEC7A13BEC7746C69698B`) |
| **`X402N`** | `X402N:<session>:<net>` | 🟢 **LIVE_ONCHAIN** | XRPL Altnet, Solana Devnet | `clearinghouse.mjs` (:8405) | Session 11 (`02e3a590…`) and Session 12 (`2bb58b67…`) on Delta :8405 |
| **`X402L`** | `X402L:<lane>:<window>:<nonce>`| 🔵 **STANDARDS_TRACK** | Solana Devnet, Synaptic L1 | IETF RFC Track / Solana SIMD-0671 | `X402L:151:1789860218:806384975` (Parametric 256-lane watermark) |
| **`X402Z`** | `X402Z:<root>:<proof>` | 🔵 **STANDARDS_TRACK** | Synaptic L1, XRPL Altnet | CERN Zenodo SYN-TD-008 & SYN-TD-012 | Zero-Knowledge confidential clearing attestation |
| **`X402R`** | `X402R:<session>:<reason>` | 🔵 **STANDARDS_TRACK** | XRPL Altnet, Synaptic L1 | CERN Zenodo SYN-TD-001 | Honest-rejection cryptographic dispute proof |

---

## 3. Codebase Harmonization Plan

To eliminate prose drift across the codebase, services import directly from `apps/x402-tswp/src/discriminators.mjs`:

### In `apps/colosseum/lib/memos.ts`:
```typescript
import { DISCRIMINATOR_REGISTRY } from '@synaptics/x402-tswp/discriminators';

export const MEMO_GRAMMAR = Object.values(DISCRIMINATOR_REGISTRY).map(entry => ({
  memo: entry.syntax,
  where: entry.service,
  carries: entry.description,
  liveExample: entry.liveExample,
  exampleSource: entry.status,
}));
```

### In Gateway Daemons (`gateway.mjs`, `clearinghouse.mjs`):
```javascript
import { validateTswpMemo, buildGatewayMemo, buildWindowMemo } from '../apps/x402-tswp/src/discriminators.mjs';

// Inbound validation
const { valid, tag, error } = validateTswpMemo(rawMemo);
if (!valid) {
  return reply402Error(error);
}
```

---

## 4. Key Takeaways for Server Agent (`root@delta`)

1. **Do Not Re-invent the Grammar:** All 12 discriminators are locked in `apps/x402-tswp/src/discriminators.mjs`.
2. **Current Master Commit:** Ensure your local branch is synchronized via `git pull --rebase origin master`.
3. **Live Daemons:** Delta PM2 services `:8402` (`x402-gateway`), `:8405` (`mcp-402-gateway-escrow`), and `:8415` (`synaptic-traderx-adapter`) must run against these exact regex definitions.
