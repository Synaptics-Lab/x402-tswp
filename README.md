# X402 Typed Settlement Wire Protocol (X402-TSWP)

[![Specification Status](https://img.shields.io/badge/Status-Draft%20Specification-blue.svg)](RFC_X402_TYPED_SETTLEMENT_WIRE.md)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)

An extensible, byte-exact state-machine grammar and multi-rail transport protocol for machine-to-machine (M2M) micropayments, collateralization, and multilateral netting settlements.

## Overview

The **X402 Typed Settlement Wire Protocol (X402-TSWP)** replaces naive, untyped implementations of HTTP `402 Payment Required` with an on-chain verifiable operational grammar:

```
X402<Type>:<Payload>
```

On high-throughput execution engines such as Solana, X402-TSWP eliminates regex string parsing and prefix matching in favor of byte-exact equality verification executed natively inside on-chain smart contracts via **Instructions Sysvar Introspection** (`sysvar::instructions`).

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
