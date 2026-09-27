# X402 Typed Settlement Wire Protocol (X402-TSWP)

[![Specification Status](https://img.shields.io/badge/Status-Draft%20Specification-blue.svg)](RFC_X402_TYPED_SETTLEMENT_WIRE.md)
[![Solana SIMD](https://img.shields.io/badge/Solana%20SIMD-PR%20%23671-purple.svg)](https://github.com/solana-foundation/solana-improvement-documents/pull/671)
[![XRPL Standards](https://img.shields.io/badge/XRPL%20XLS-Discussion%20%23646-red.svg)](https://github.com/XRPLF/XRPL-Standards/discussions/646)
[![IETF Datatracker](https://img.shields.io/badge/IETF-draft--shabazz--http--x402--tswp--00-blue.svg)](https://datatracker.ietf.org/doc/draft-shabazz-http-x402-tswp/)
[![IANA Registry](https://img.shields.io/badge/IANA%20Fields-Issues%20%2362%20%26%20%2363-darkgreen.svg)](https://github.com/protocol-registries/http-fields/issues/62)
[![IANA ALPN](https://img.shields.io/badge/IANA%20ALPN-x402%20%26%20tswp-darkblue.svg)](ietf/IETF_ANNOUNCEMENT_AND_IANA_REGISTRATION.md)
[![Interledger RFC](https://img.shields.io/badge/Interledger%20RFC-PR%20%23605-brightgreen.svg)](https://github.com/interledger/rfcs/pull/605)
[![DOI: SYN-TD-2026-001](https://zenodo.org/badge/DOI/10.5281/zenodo.22979715.svg)](https://doi.org/10.5281/zenodo.22979715)
[![DOI: SYN-TD-2026-002](https://zenodo.org/badge/DOI/10.5281/zenodo.22983522.svg)](https://doi.org/10.5281/zenodo.22983522)
[![DOI: SYN-TD-2026-003](https://zenodo.org/badge/DOI/10.5281/zenodo.22994745.svg)](https://doi.org/10.5281/zenodo.22994745)
[![DOI: SYN-TD-2026-004](https://zenodo.org/badge/DOI/10.5281/zenodo.22996200.svg)](https://doi.org/10.5281/zenodo.22996200)
[![DOI: SYN-TD-2026-005](https://zenodo.org/badge/DOI/10.5281/zenodo.22996628.svg)](https://doi.org/10.5281/zenodo.22996628)
[![DOI: SYN-TD-2026-006](https://zenodo.org/badge/DOI/10.5281/zenodo.23000701.svg)](https://doi.org/10.5281/zenodo.23000701)
[![MCP SEP](https://img.shields.io/badge/MCP%20SEP-PR%20%231%20(Fork)-orange.svg)](https://github.com/Synaptics-Lab/modelcontextprotocol/pull/1)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)

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

- [**RFC-0402 Master Specification**](RFC_X402_TYPED_SETTLEMENT_WIRE.md): Formal ABNF grammar, type discriminator registry, Solana SBF verification rules, and HTTP header profiles.


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

## Reference Implementations

- **Solana Escrow Program:** `mcp-402-gateway/escrow-server/solana-escrow-program` (Rust / SBF)
- **FDC3 3.0 Institutional Terminal:** [https://terminal.synapticchain.xyz/](https://terminal.synapticchain.xyz/)
- **Node.js Test Vectors:** `npm test` runs byte-exact validation of canonical vectors.

## License

Apache-2.0
