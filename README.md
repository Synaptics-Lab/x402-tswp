# X402 Typed Settlement Wire Protocol (X402-TSWP)

### Standards Track & Industry Consortia
[![IETF Datatracker](https://img.shields.io/badge/IETF-draft--shabazz--http--x402--tswp--01-blue.svg)](https://datatracker.ietf.org/doc/draft-shabazz-http-x402-tswp/)
[![FINOS FDC3](https://img.shields.io/badge/FINOS%20FDC3-PR%20%232204-008080.svg)](https://github.com/finos/FDC3/pull/2204)
[![Solana SIMD](https://img.shields.io/badge/Solana%20SIMD-PR%20%23671-purple.svg)](https://github.com/solana-foundation/solana-improvement-documents/pull/671)
[![XRPL Standards](https://img.shields.io/badge/XRPL%20XLS-Discussion%20%23646-red.svg)](https://github.com/XRPLF/XRPL-Standards/discussions/646)
[![Interledger RFC](https://img.shields.io/badge/Interledger%20RFC-PR%20%23605-brightgreen.svg)](https://github.com/interledger/rfcs/pull/605)
[![MCP SEP](https://img.shields.io/badge/MCP%20SEP-PR%20%231-orange.svg)](https://github.com/Synaptics-Lab/modelcontextprotocol/pull/1)
[![IANA Registry](https://img.shields.io/badge/IANA%20Fields-Issues%20%2362%20%26%20%2363-darkgreen.svg)](https://github.com/protocol-registries/http-fields/issues/62)
[![IANA ALPN](https://img.shields.io/badge/IANA%20ALPN-x402%20%26%20tswp-darkblue.svg)](ietf/IETF_ANNOUNCEMENT_AND_IANA_REGISTRATION.md)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)

### CERN Zenodo Defensive Patent Portfolio (14 Registered DOIs)
[![DOI: SYN-TD-2026-001](https://zenodo.org/badge/DOI/10.5281/zenodo.22979715.svg)](https://doi.org/10.5281/zenodo.22979715)
[![DOI: SYN-TD-2026-002](https://zenodo.org/badge/DOI/10.5281/zenodo.22983522.svg)](https://doi.org/10.5281/zenodo.22983522)
[![DOI: SYN-TD-2026-003](https://zenodo.org/badge/DOI/10.5281/zenodo.22994745.svg)](https://doi.org/10.5281/zenodo.22994745)
[![DOI: SYN-TD-2026-004](https://zenodo.org/badge/DOI/10.5281/zenodo.22996200.svg)](https://doi.org/10.5281/zenodo.22996200)
[![DOI: SYN-TD-2026-005](https://zenodo.org/badge/DOI/10.5281/zenodo.22996628.svg)](https://doi.org/10.5281/zenodo.22996628)
[![DOI: SYN-TD-2026-006](https://zenodo.org/badge/DOI/10.5281/zenodo.23000701.svg)](https://doi.org/10.5281/zenodo.23000701)
[![DOI: SYN-TD-2026-007](https://zenodo.org/badge/DOI/10.5281/zenodo.23002617.svg)](https://doi.org/10.5281/zenodo.23002617)
[![DOI: SYN-TD-2026-008](https://zenodo.org/badge/DOI/10.5281/zenodo.23002720.svg)](https://doi.org/10.5281/zenodo.23002720)
[![DOI: SYN-TD-2026-009](https://zenodo.org/badge/DOI/10.5281/zenodo.23002771.svg)](https://doi.org/10.5281/zenodo.23002771)
[![DOI: SYN-TD-2026-010](https://zenodo.org/badge/DOI/10.5281/zenodo.23003928.svg)](https://doi.org/10.5281/zenodo.23003928)
[![DOI: SYN-TD-2026-011](https://zenodo.org/badge/DOI/10.5281/zenodo.23038493.svg)](https://doi.org/10.5281/zenodo.23038493)
[![DOI: SYN-TD-2026-012](https://zenodo.org/badge/DOI/10.5281/zenodo.23041137.svg)](https://doi.org/10.5281/zenodo.23041137)
[![DOI: SYN-TD-2026-013](https://zenodo.org/badge/DOI/10.5281/zenodo.23041557.svg)](https://doi.org/10.5281/zenodo.23041557)
[![DOI: SYN-TD-2026-014](https://zenodo.org/badge/DOI/10.5281/zenodo.23041910.svg)](https://doi.org/10.5281/zenodo.23041910)

An extensible, byte-exact state-machine grammar and multi-rail transport protocol for machine-to-machine (M2M) micropayments, collateralization, and multilateral netting settlements.

## Overview

The **X402 Typed Settlement Wire Protocol (X402-TSWP)** replaces naive, untyped implementations of HTTP `402 Payment Required` with an on-chain verifiable operational grammar:

```
X402<Type>:<Payload>
```

On high-throughput execution engines such as Solana, X402-TSWP eliminates regex string parsing and prefix matching in favor of byte-exact equality verification executed natively inside on-chain smart contracts via **Instructions Sysvar Introspection** (`sysvar::instructions`).

### The Atomic X402 PTB Pipeline

X402 type discriminators chain sequentially inside a single Programmable Transaction Block (PTB) or atomic multi-instruction envelope, executing in sub-400ms:

```
 ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 │ COMMAND 0: X402G (Gateway Paywall)                                                      │
 │  Input: UUIDv4 Challenge ──► Verifies MCP Tool fee & unlocks enclave ingress gate       │
 ├─────────────────────────────────────────────────────────────────────────────────────────┤
 │ COMMAND 1: X402M (Margin Escrow)                                                        │
 │  Input: Participant Vault ──► Locks collateral into liquidity vault                     │
 ├─────────────────────────────────────────────────────────────────────────────────────────┤
 │ COMMAND 2: X402L (Concurrent Lane Routing)                                              │
 │  Input: Nonce Key ──► Acquires Lane in ADR-062 sliding watermark (0 HoL blocking)        │
 ├─────────────────────────────────────────────────────────────────────────────────────────┤
 │ COMMAND 3: X402B (Session Bonding)                                                      │
 │  Input: Session Preimage ──► Enforces monotonic sequence deduplication                  │
 ├─────────────────────────────────────────────────────────────────────────────────────────┤
 │ COMMAND 4: X402E (ISO 20022 Cross-Border Linkage)                                       │
 │  Input: SWIFT UETR ──► Runtime introspects instruction memory for byte-exact match      │
 ├─────────────────────────────────────────────────────────────────────────────────────────┤
 │ COMMAND 5: X402W (Net Settlement Execution)                                             │
 │  Input: Net Matrix ──► Asserts Invariant 9 (ΣDebits == ΣCredits) & disburses net funds  │
 ├─────────────────────────────────────────────────────────────────────────────────────────┤
 │ COMMAND 6: X402N (Consensus Net Readback)                                               │
 │  Output: Emits final immutable clearing receipt leaf to state root                      │
 └─────────────────────────────────────────────────────────────────────────────────────────┘
         ▲                                                                 │
         └───────────── ALL PASS OR ENTIRE PIPELINE ROLLS BACK ────────────┘
```

| Operational Dimension | Traditional Banking / SWIFT | Standard Web3 Bridge | Synaptic X402 PTB Chain |
| :--- | :--- | :--- | :--- |
| **Execution Steps** | 5 manual API calls + Nostro/Vostro | 3–4 separate transactions | **1 Single Atomic PTB** |
| **Settlement Time** | T+2 Business Days | 15–45 minutes | **< 400 Milliseconds** |
| **Failure State** | Stuck funds, wire investigation fees | Wrapped token de-peg / Exploit | **Atomic Rollback ($\Delta = 0$)** |
| **Auditability** | Disconnected PDF wire receipts | Unverified smart contract emits | **On-Chain Byte-Exact UETR** |
| **Concurrency** | 1 wire at a time per account | Sequential nonce blocking | **1 to 65,535 Parallel Lanes** |

## Core Specifications

- [**SYN-FPS-2026-001: Financial PTB Wire Standard (SYN-TD-011)**](docs/SYN-FPS-2026-001-FINANCIAL-PTB-WIRE-STANDARD.md) — [DOI 10.5281/zenodo.23038493](https://doi.org/10.5281/zenodo.23038493): Extended institutional finance protocol language, 9 banking patterns (DvP, FX-SARF, MNC, CRW, BSS, DNS, GTA, MEO, RWA-DvP), PTB composition algebra, Invariant 9 continuous solvency conservation, and ISO 20022 / Shariah compliance mappings.
- [**SYN-TD-2026-014: Off-Grid LoRa Mesh DTN Wire Framing**](docs/TECHNICAL_DISCLOSURE_OFFGRID_LORA_MESH.md) — [DOI 10.5281/zenodo.23041910](https://doi.org/10.5281/zenodo.23041910): Delay-tolerant sovereign financial settlement over uncoordinated Sub-GHz LoRa mesh radio (868/915 MHz), 144-byte unfragmented binary framing (`X402LORA`), and 256-lane off-grid double-spend prevention.
- [**SYN-TD-2026-013: Mobile P2P Low-Bandwidth Settlement Framing**](docs/TECHNICAL_DISCLOSURE_MOBILE_P2P_LOW_BANDWIDTH.md) — [DOI 10.5281/zenodo.23041557](https://doi.org/10.5281/zenodo.23041557): Ultra-low-bandwidth P2P settlement for constrained mobile devices, 2G/3G SMS (3GPP TS 23.038), USSD, NFC, and BLE sub-160B operational codecs (`X402G`, `X402L`, `X402W`, `X402E`).
- [**SYN-TD-2026-012: ZKO State Attestation & RWA Atomic DvP**](docs/TECHNICAL_DISCLOSURE_ZKO_RWA_ATOMIC_DVP.md) — [DOI 10.5281/zenodo.23041137](https://doi.org/10.5281/zenodo.23041137): Zero-Knowledge state attestation (`X402Z`) and programmatic RWA legal lien encumbrance (`X402R`) with atomic Delivery-versus-Payment clearing.
- [**IETF Internet-Draft: draft-shabazz-http-x402-tswp-01**](https://datatracker.ietf.org/doc/draft-shabazz-http-x402-tswp/) — Application-layer framing extension to HTTP status code 402 with typed challenge-response headers and byte-exact multi-rail settlement grammars.
- [**FINOS FDC3 Specification PR #2204**](https://github.com/finos/FDC3/pull/2204) — `StartPayment` intent bridging institutional financial desktop agents and trader blotters directly to X402-TSWP settlement pipelines.
- [**Solana Foundation SIMD-0671**](https://github.com/solana-foundation/solana-improvement-documents/pull/671) — Typed settlement wire linkage via SPL Memo v2 and Token-2022 instruction introspection (`sysvar::instructions`).
- [**RFC-0402 Master Specification**](RFC_X402_TYPED_SETTLEMENT_WIRE.md) — Foundational ABNF grammar, type discriminator registry, and runtime verification rules.


## Operational Type Discriminator Registry

| Codec | Lifecycle Phase | Carrier Rails | Operational Semantics |
|---|---|---|---|
| `X402G` | Gateway Paywall | XRPL / Solana | UUIDv4 challenge-bound micropayments & MCP tool metering. |
| `X402B` / `BN` / `BR` | Bonding | L1 Ledger | Monotonic sequence deduplication for bonded sessions. |
| `X402M` / `MR` | Margin Escrow | XRPL / Solana | Market maker collateral locking and deterministic return. |
| `X402L` | Concurrent Lanes | Solana SPL Memo v2 | Disambiguates 256 parallel lanes under the ADR-062 sliding window. |
| `X402N` | Net Readback | Synaptic L1 | Canonical consensus readback of multi-party clearing matrices. |
| `X402W` | Net Settlement | Dual Rail | Multilateral netting finality binding debtor & creditor disbursements. |
| `X402E` | Cross-Border | ISO 20022 | Cryptographically links escrow releases to SWIFT UETR tracking IDs. |
| `X402Z` | ZK State Attestation | Token-2022 / SBF | Verifies zero-knowledge title, solvency range, & double-pledge nullifiers. |
| `X402R` | RWA Lien Encumbrance | Multi-Rail Registry | Programmatic legal lien & title attachment (UCC-1/MLETR) in escrow. |

## Reference Implementations

- **Solana Escrow Program:** `mcp-402-gateway/escrow-server/solana-escrow-program` (Rust / SBF)
- **FDC3 3.0 Institutional Terminal:** [https://terminal.synapticchain.xyz/](https://terminal.synapticchain.xyz/)
- **Node.js Test Vectors:** `npm test` runs byte-exact validation of canonical vectors.

## License

Apache-2.0
