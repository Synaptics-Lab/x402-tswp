<pre>
title: Typed Settlement Wire Grammar for XRPL Memos
description: Byte-exact typed memo grammar for payment-gated M2M settlements and UETR tracking on XRPL.
author: Abdul Shabazz &lt;veritasvaultone@gmail.com&gt; (@veritasvaultone, Synaptics Lab)
category: Ecosystem
status: Proposal
created: 2026-09-26
updated: 2026-09-26
</pre>

# [Ecosystem Proposal: Typed Settlement Wire Grammar for XRPL Memos (X402-TSWP)]

## Abstract

This standard specifies an ecosystem wire format for XRP Ledger (XRPL) transaction memos to support autonomous Machine-to-Machine (M2M) payment paywalls, payment-gated API execution, and atomic linkage of cross-border financial identifiers (such as SWIFT gpi UETRs) to on-chain XRPL settlements.

The standard builds upon the IETF `X402-TSWP` (The X402 Typed Settlement Wire Protocol) specification and standardizes hex-encoded byte-exact discriminators within XRPL `Memos` arrays.

---

## Motivation

The XRP Ledger is widely utilized for high-throughput, low-latency, and low-cost payments. The XRPL transaction schema provides a native `Memos` array capable of storing arbitrary hex-encoded data:
- `MemoType`: Categorizes the purpose of the memo.
- `MemoData`: Carries the primary memo payload.
- `MemoFormat`: Designates mime-type or encoding structure.

However, in the absence of an open ecosystem standard for memo structure:
1. **Ad-Hoc String Parsing:** Off-chain payment gateways, Model Context Protocol (MCP) tool servers, and automated settlement engines parse free-text memos using brittle, non-standard regular expressions.
2. **Missing Challenge Preimage Grammar:** Machine-to-machine micropayment clients lack a standardized grammar to associate a payment with an ephemeral HTTP 402 or MCP challenge token.
3. **SWIFT / ISO 20022 Disconnect:** Financial institutions clearing via XRPL cannot deterministically link on-chain transaction hashes to the SWIFT Unique End-to-End Transaction Reference (UETR) mandated by ISO 20022.

This proposal defines a canonical, typed schema for XRPL memos to establish interoperability across institutional gateways, AI agents, and cross-chain execution engines.

---

## Specification

### 1. Memo Fields & Hex Encoding

XRPL transactions carrying X402-TSWP payloads MUST format the `Memos` array entry with the following canonical fields:

| Field | Encoding | Plaintext Value | Hex Value |
|---|---|---|---|
| `MemoType` | Hex (ASCII) | `X402` or `X402G` | `58343032` or `5834303247` |
| `MemoFormat` | Hex (ASCII) | `text/plain` | `746578742f706c61696e` |
| `MemoData` | Hex (ASCII) | `<TypedGrammar>` | `hex(<TypedGrammar>)` |

### 2. Operational Memo Grammar

The `MemoData` payload follows a strict prefix-based discriminator grammar:

```
X402<Discriminator>:<Payload>
```

#### 2.1. Gateway Challenge Payment (`X402G`)
Used by autonomous AI agents, MCP servers, and HTTP 402 API gateways for single-use challenge satisfaction:
- **Format:** `X402G:<challenge-uuid>`
- **Length:** Exactly 42 ASCII characters (84 hex nibbles).
- **Example Plaintext:** `X402G:827da995-adda-4dd7-9fb5-d05338526873`
- **Example Hex `MemoData`:** `58343032473a38323764613939352d616464612d346464372d396662352d643035333338353236383733`

#### 2.2. Multilateral Netting & SWIFT UETR Settlement (`X402W`)
Used for institutional settlement binding an on-chain XRPL transaction to a specific clearing window and SWIFT gpi UETR:
- **Format:** `X402W:<window-id>:<uetr-uuid>`
- **Example Plaintext:** `X402W:1789860218:c3b29f04-8b65-4f42-b9e7-5735cf572bf1`

#### 2.3. Market Maker Escrow Collateral (`X402M`)
Used to fund and identify deterministic liquidity provision collateral on XRPL:
- **Format:** `X402M:<window-id>:<account-address>`
- **Example Plaintext:** `X402M:1789860218:rKmtCQXuZpXWgb7KiwKbiQwJeX6AtbpMtC`

---

### 3. Canonical XRPL Transaction Example

An XRPL `Payment` transaction fulfilling an `X402G` challenge for a micro-fee of 160 drops:

```json
{
  "TransactionType": "Payment",
  "Account": "r9LChhKowvV8r...ClientAccount",
  "Destination": "rKmtCQXuZpXWgb7KiwKbiQwJeX6AtbpMtC",
  "Amount": "160",
  "Memos": [
    {
      "Memo": {
        "MemoType": "58343032",
        "MemoFormat": "746578742f706c61696e",
        "MemoData": "58343032473a38323764613939352d616464612d346464372d396662352d643035333338353236383733"
      }
    }
  ]
}
```

---

## Rationale

1. **Native Field Compatibility:** Utilizes existing XRPL transaction primitives without requiring ledger amendments or core `rippled` modifications.
2. **Byte-Exact Verification:** The deterministic length and prefix structure permit fast substring slicing and exact comparison in high-throughput ledger ingest pipelines.
3. **Cross-Chain Equivalence:** The `X402G` and `X402W` formats are identical across XRPL and Solana SPL Memo v2, enabling uniform verification logic across multi-rail settlement gateways.

---

## Backwards Compatibility

This standard is purely additive and strictly backward-compatible. XRPL accounts, wallets, and explorers that do not implement X402-TSWP continue to process and render transactions normally.

---

## Reference Implementation

- **Production Node & Gateway:** Operating in `syn-m2m-server` and `mcp-402-gateway` (:8405) settling transactions on XRPL Altnet.
- **IETF Specification:** Standards Track [draft-shabazz-http-x402-tswp-00](https://datatracker.ietf.org/doc/draft-shabazz-http-x402-tswp/).
- **Defensive Prior Art Registration:** Zenodo [DOI 10.5281/zenodo.22979715](https://doi.org/10.5281/zenodo.22979715).
- **Cross-Rail Equivalents:** Solana Foundation [SIMD PR #671](https://github.com/solana-foundation/solana-improvement-documents/pull/671).

---

## Security Considerations

1. **Single-Use Challenge Enforcement:** Gateways MUST invalidate the challenge UUIDv4 immediately upon the first validated ledger appearance to prevent replay attacks.
2. **Strict Memo Equality:** Ingesting services MUST verify the full byte-exact memo value (`MemoData == hex("X402G:" + challenge)`) to eliminate injection of extraneous trailing bytes.
3. **Ledger Validation:** Gateways MUST confirm transaction finality in a validated ledger (`"validated": true` from `rippled`) before releasing commercial tool execution.
