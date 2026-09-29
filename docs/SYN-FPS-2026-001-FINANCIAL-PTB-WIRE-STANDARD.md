# SYN-FPS-2026-001 — Financial PTB Wire Standard
## X402-TSWP Extended Institutional Finance Protocol Language

**Document Identifier:** `SYN-FPS-2026-001`  
**Status:** PUBLISHED v1.0 — Live Implementation Reference  
**Authors:** Abdul Shabazz (Trevin Rogers), Synaptics Lab  
**Date:** 2026-09-29  
**Zenodo DOI:** [`10.5281/zenodo.23038493`](https://zenodo.org/records/23038493) (SYN-TD-011)  
**IETF Base:** `draft-shabazz-http-x402-tswp-01`  
**Zenodo Umbrella:** DOI [`10.5281/zenodo.23000701`](https://zenodo.org/records/23000701) (SYN-TD-006)  
**Patent Scope:** SYN-TD-2026-005, DOI `10.5281/zenodo.22996628` (defensive prior art)  
**Repository:** `https://github.com/Synaptics-Lab/Synaptic-Source`

> **What this is:** The complete formal specification of X402-TSWP as a
> programmable financial wire language — not a product manual. It defines the
> grammar, discriminator semantics, composition algebra, banking transaction
> patterns, invariants, and compliance mappings that any implementation must
> satisfy to interoperate. If a live system disagrees with this document, the
> live system is wrong *or* this document has a known gap (§11 tracks them).

---

## Table of Contents

1. [Purpose and Scope](#1-purpose-and-scope)
2. [Design Axioms](#2-design-axioms)
3. [Base Wire Grammar (ABNF)](#3-base-wire-grammar-abnf)
4. [Discriminator Registry](#4-discriminator-registry)
5. [Financial Transaction Patterns](#5-financial-transaction-patterns)
6. [PTB Composition Algebra](#6-ptb-composition-algebra)
7. [Invariants](#7-invariants)
8. [Fee Arithmetic](#8-fee-arithmetic)
9. [ISO 20022 / SWIFT Compliance Mapping](#9-iso-20022--swift-compliance-mapping)
10. [Shariah Compliance (Bay' al-Sarf / Yadan bi-Yadin)](#10-shariah-compliance)
11. [Multi-Rail Carrier Semantics](#11-multi-rail-carrier-semantics)
12. [Implementation Requirements](#12-implementation-requirements)
13. [Known Gaps and Disclosure](#13-known-gaps-and-disclosure)

---

## 1. Purpose and Scope

### 1.1 What Problem This Solves

Traditional cross-border settlement requires:

- **T+2 to T+5** finality (SWIFT CBPR+, Nostro-Vostro bilateral netting)
- **Disconnected stages**: gateway auth, margin call, lane routing, UETR wiring, netting, settlement — each a separate message or transaction, each with its own failure domain
- **Bridge risk**: cross-chain movement requires custodial mints or relayers (→ \$2.8B+ cumulative bridge hacks)
- **Intermediate state exposure**: if stage 3 of 7 fails, stages 1–2 remain committed, stranding collateral

X402-TSWP resolves all four by encoding the entire institutional financial lifecycle as a **typed, byte-exact wire grammar** that implementations chain into a single atomic Programmable Transaction Block (PTB). The grammar is the contract. Any implementation in any language that produces the same bytes speaks the same protocol.

### 1.2 Scope

This document specifies:

- The complete ABNF wire grammar for all 12 discriminators (including ZK Knowledge Objects and RWA Lien Encumbrance)
- Semantic constraints on each discriminator (required fields, byte limits, carrier rules)
- Nine canonical banking and asset settlement patterns and their PTB composition
- The PTB composition algebra (sequencing, parallelism, rollback)
- All protocol invariants (conservation, lane, bond, nonce)
- Fee arithmetic (exact integer math, no floating point)
- ISO 20022 CBPR+ / SWIFT UETR conformance mapping
- Shariah compliance mapping for Islamic finance corridors (including tangible RWA *Mal Mutaqawwim*)
- Per-rail carrier semantics (SynapticChain L1, Solana SPL Token-2022, XRPL altnet, HTTP 402)
- Minimum implementation requirements for conformance

### 1.3 Non-Scope

- Smart contract bytecode implementation (covered in `docs/r16/CLEARING-PROTOCOL-GUIDE.md`)
- Network transport (HTTP/2, WebSocket — covered in the IETF draft)
- ADR-555 enclave internals (covered in SYN-TD-002)

---

## 2. Design Axioms

These are not goals — they are architectural invariants that cannot be traded away for performance or convenience:

**Axiom A1 — Bytes are the contract.** The grammar below is the normative definition of the protocol. Any implementation in any language producing the same bytes is conformant. No implementation has authority over the spec.

**Axiom A2 — Zero intermediate state.** Between the first and last command of a PTB, no state mutation is observable outside the executing processor's volatile memory. Either all commands commit or none do. `Δ ≡ 0` at any externally visible snapshot.

**Axiom A3 — Fail-closed everywhere.** An absent, malformed, or mismatched field MUST cause the entire enclosing PTB to abort. Silent partial execution is not permitted.

**Axiom A4 — No implicit foreign exchange.** Each discriminator payload carries an explicit unit token address. There is no cross-unit conversion inside a PTB. Settlement of corridor sUSD/cNGN requires two separate unit-specific legs; no rate assumption is embedded.

**Axiom A5 — Direction before magnitude.** Net settlement MUST resolve debtor/creditor direction before computing magnitude. A function returning `|payable − receivable|` without prior direction resolution is non-conformant (a live-found VM bug; see §7.1).

**Axiom A6 — Ledger of record is L1.** Solana mirrors execution lanes; XRPL carries evidence. Sessions, net positions, fees, and conservation proofs live only on SynapticChain L1. No rail can override L1 truth.

---

## 3. Base Wire Grammar (ABNF)

All X402-TSWP payloads are 7-bit ASCII. No Unicode. No binary encoding. Byte-exact match.

```abnf
;; Root production
x402-message    = discriminator ":" payload

;; Discriminator is always 5 or 6 ASCII uppercase characters
discriminator   = "X402" type-tag [ sub-tag ]
type-tag        = ALPHA          ; one uppercase letter  A-Z
sub-tag         = 1*2ALPHA       ; one or two uppercase letters (optional)

;; Payload is discriminator-specific; see §4 for each
payload         = 1*250VCHAR    ; printable ASCII, max 250 bytes total message

;; Common sub-productions
uuid4           = 8HEXDIG "-" 4HEXDIG "-" "4" 3HEXDIG "-" [%x38-39 / %x61 / %x62]
                  3HEXDIG "-" 12HEXDIG
                  ; RFC 4122 UUIDv4, lowercase hex required
decimal-uint    = 1*20DIGIT     ; unsigned integer, no leading zeros except "0" itself
bech32m-addr    = 1*90( ALPHA / DIGIT )  ; bech32m encoded, implementation validates checksum
lane-id         = 1*3DIGIT      ; 0..255 (single SHA3-256 byte, no modulo)
window-id       = decimal-uint  ; epoch counter, monotonic, u64 range
nonce           = decimal-uint  ; sliding window position, u64 range
session-id      = decimal-uint  ; monotonic session counter, u64 range
corridor-id     = decimal-uint  ; registered corridor index, u64 range
bps             = decimal-uint  ; basis points integer, range 0..10000
net-amount      = decimal-uint  ; base units u128, no decimals
hex32           = 64HEXDIG      ; 32-byte cryptographic hash or commitment, lowercase hex
hex16           = 32HEXDIG      ; 16-byte identifier or proof scheme hash, lowercase hex
asset-class     = 1*8ALPHA      ; RWA class: "INV", "EBL", "REC", "CO2", "CRE"
asset-id        = 1*64( ALPHA / DIGIT / "-" / "_" ) ; Legal asset identifier (e.g. registry serial)
```

---

## 4. Discriminator Registry

### 4.1 Complete Registry (12 Discriminators)

| Code | Full Name | Carrier(s) | Production Status |
|:---|:---|:---|:---|
| `X402G` | Gateway Challenge | HTTP 402, MCP Enclave, SPL Memo v2 | **LIVE** |
| `X402M` | Margin Escrow | Solana Token-2022, XRPL Escrow | **LIVE** |
| `X402MR` | Margin Return | XRPL payout | **LIVE** |
| `X402L` | Lane Allocation | ADR-062, SPL Memo v2 | **LIVE** |
| `X402B` | Session Bond | L1 State Engine | **LIVE** |
| `X402BN` | Bond Initiation | L1 State Engine | **LIVE** |
| `X402BR` | Bond Release | L1 State Engine | **LIVE** |
| `X402E` | ISO 20022 UETR Linkage | SBF Sysvar, CBPR+ | **LIVE** |
| `X402W` | Net Settlement | Multi-Rail | **LIVE** |
| `X402N` | Net Readback | L1 Consensus | **LIVE** |
| `X402Z` | ZK State Attestation | Token-2022 / SBF Sysvar | **REGISTERED (SYN-TD-008)** |
| `X402R` | RWA Lien Encumbrance | Multi-Rail Registry | **REGISTERED (SYN-TD-008)** |

> **Note:** `X402L`, `X402E`, `X402B`, `X402BN`, `X402BR`, `X402MR`, `X402Z`, `X402R` are formally registered (IETF draft + Zenodo estate) but currently `X402G`, `X402M`, `X402N`, `X402W` compose the live Delta production validator subset. The complete 12-code grammar forms the full institutional wire protocol standard.

---

### 4.2 Per-Discriminator Grammar

#### X402G — Gateway Challenge / Paywall

```abnf
x402g-payload   = "X402G:" uuid4
```

**Semantics:**  
- Issues a machine-to-machine ephemeral challenge token (UUIDv4 preimage).  
- An implementation MUST verify the challenge against its token registry before granting tool access.  
- Tokens are single-use. Replay of a consumed token MUST be refused with HTTP 409.  
- The challenge nonce MUST be generated with cryptographically secure randomness (CSPRNG).  
- Live production example: `X402G:3fa85f64-5717-4562-b3fc-2c963f66afa6` (320 XRPL drops, ~0.00032 USD equivalent).

**Required in PTB?** Yes — MUST be Command 0 when a gateway fee applies.

---

#### X402M — Margin Escrow

```abnf
x402m-payload   = "X402M:" corridor-id ":" bech32m-addr
```

**Semantics:**  
- Locks bilateral collateral into a programmatic non-custodial vault.  
- `corridor-id` identifies the registered netting corridor (e.g., `16` = sUSD/cNGN).  
- `bech32m-addr` is the margin depositor (maker) address.  
- Amount is NOT embedded in the memo — it is read from the on-chain margin balance.  
- Release occurs **only** upon successful downstream `X402W` execution. If `X402W` fails, margin returns atomically within the same PTB.  
- Margin floor: 2,000,000,000,000 base units (2e12). An escrow below floor MUST be refused.

**Conformance note:** The address field is the raw 20-byte canonical address, not its bech32m presentation, when used as a hash input (see lane derivation §4.3 note). In the memo string itself, use the bech32m text.

---

#### X402MR — Margin Return

```abnf
x402mr-payload  = "X402MR:" corridor-id ":" bech32m-addr
```

**Semantics:**  
- Signals custodian-to-maker payout of previously escrowed margin after a session completes or is voided.  
- MUST only be emitted by the custodian after `finalize_session` confirms status 3 or the session is voided at status 0.

---

#### X402L — Lane Allocation

```abnf
x402l-payload   = "X402L:" lane-id ":" window-id ":" nonce
```

**Semantics:**  
- Allocates execution to lane `k` in the ADR-062 sliding watermark partition (0 ≤ k ≤ 255 in the SHA3-256 single-byte derivation; up to 65,535 logical lanes via the full parametric range).  
- `nonce` is the per-lane monotonic sliding-window position.  
- The full memo string MUST be ≤ 50 bytes (SPL Memo v2 constraint on Solana).  
- **Critical:** A memo naming a different lane than the executing lane PDA is `MEMO_LINKAGE_MISSING` error `0x4` — the entire PTB aborts. Single-digit NUL-byte sensitivity applies (a live-found bug).

**Lane derivation (normative):**

```
lane_input  = "SYN-R16-LANE-v1"          (15 bytes, ASCII)
            ‖ corridor_id.to_le_bytes()   (8 bytes, u64 LE)
            ‖ participant_raw_20_bytes     (20 bytes — NOT the bech32m text)
            ‖ window_epoch.to_le_bytes()  (8 bytes, u64 LE)
            ;; total = 51 bytes

lane_digest = SHA3-256(lane_input)        ;; 32 bytes
lane_id     = lane_digest[0]             ;; byte 0 only, no modulo, no folding
```

> **IMPORTANT:** `participant_raw_20_bytes` is the canonical Borsh `[u8; 20]` address representation, not the bech32m text string. Using the text string is non-conformant and will produce an incorrect lane id.

**Verification vector:**  
- Corridor 1, participant `c21b7682c60c3a3628a20973f93bee2775a32322` (hex), window `1789860218` → lane **151**.

---

#### X402B — Session Bond

```abnf
x402b-payload   = "X402B:" session-id
```

**Semantics:**  
- Declares a long-lived agent session bond for the given session.  
- Enforces monotonic sequence deduplication across agents — no two messages with the same session-id may be bonded simultaneously.  
- Three lifecycle events compose the full bond lifecycle:

| Code | Meaning |
|:---|:---|
| `X402B` | General bond presence / status assertion |
| `X402BN` | Bond initiation — session opens the bond |
| `X402BR` | Bond release — session terminates the bond |

```abnf
x402bn-payload  = "X402BN:" session-id
x402br-payload  = "X402BR:" session-id
```

A PTB MUST NOT include both `X402BN` and `X402BR` for the same session-id in the same atomic block (undefined behavior; implementation MUST refuse).

---

#### X402E — ISO 20022 Cross-Border UETR Linkage

```abnf
x402e-payload   = "X402E:" corridor-id ":" uuid4
```

**Semantics:**  
- Binds a SWIFT ISO 20022 UETR (128-bit RFC 4122 UUIDv4) to the executing PTB.  
- The UUID MUST conform to `pacs.008.001.08` CBPR+ UETR format (version 4, variant bits set per RFC 4122 §4.4).  
- The UETR is introspected from the executing instruction sysvar (`sysvar::instructions`) **at runtime** — no regex parsing, no off-chain index lookup.  
- An `X402W` command that follows MUST assert byte-exact equality between the UETR in its own payload and the UETR previously loaded by `X402E` in the same PTB.  
- Live production example: `X402E:16:550e8400-e29b-41d4-a716-446655440000`

---

#### X402W — Net Settlement Wire

```abnf
x402w-payload   = "X402W:" window-id ":" bech32m-addr
```

**Semantics:**  
- Asserts and executes net settlement for a specific participant in a netting window.  
- `window-id` corresponds to `session_id` on L1.  
- `bech32m-addr` is the settling participant (debtor or creditor, determined by direction bit from `get_net_is_debtor()`).  
- Direction MUST be resolved before magnitude: call `get_net_is_debtor(session, participant)` → bool, THEN `get_net_amount(session, participant)` or `get_net_creditor_amount(session, participant)`. A single function returning `|gross_payable − gross_receivable|` without resolving direction first is **non-conformant** (Axiom A5).  
- `X402W` enforces Invariant 9 (§7.1) — if `ΣDebits ≠ ΣCredits`, the command aborts with `0x24` and the entire PTB rolls back.

**Carrier:**  
- XRPL altnet: `EscrowCreate` with memo `X402W:<session>:<syn_addr>` + `X402N:<session>:<net>` — evidence-validated BEFORE the settle record is written to L1.

---

#### X402N — Net Readback / Consensus Receipt

```abnf
x402n-payload   = "X402N:" session-id ":" net-amount
```

**Semantics:**  
- Emits an immutable cryptographic attestation leaf committed to the block header.  
- `net-amount` is the exact decimal integer net position for the settling participant (debtor pays; creditor receives).  
- The leaf format is fixed (69 bytes):

```
receipt = "SYN-R16-LEAF-v1"      (15 bytes, ASCII)
        ‖ lane_id                 (1 byte)
        ‖ corridor_id.to_le_bytes() (8 bytes, u64 LE)
        ‖ participant_raw_20_bytes  (20 bytes)
        ‖ window_epoch.to_le_bytes() (8 bytes, u64 LE)
        ‖ net_amount.to_le_bytes()   (16 bytes, u128 LE)
        ‖ settled_flag              (1 byte: 0x01 = settled, 0x00 = cancelled)
;; total = 69 bytes
```

- The leaf is Ed25519-signed by the custodian (64-byte detached signature, RFC 8032).  
- The fold chain (§4.4) accumulates leaves into the session audit root.

---

#### X402Z — Zero-Knowledge State Attestation & Knowledge Object (ZKO)

```abnf
x402z-payload   = "X402Z:" hex16 ":" hex32 ":" hex32
                ; "X402Z:" proof-id ":" nullifier ":" state-root
```

**Semantics:**  
- Verifies a Zero-Knowledge Knowledge Object (ZKO) asserting off-chain legal title, solvency range, or regulatory compliance without disclosing sensitive corporate data.
- `proof-id`: 16-byte (32-hex) identifier of the verifying proof circuit or verification key (e.g. Groth16, Plonk, or Token-2022 Bulletproof range proof per SYN-TD-008).
- `nullifier`: 32-byte (64-hex) unique cryptographic nullifier derived from the underlying asset serial and debtor secret key ($Nullifier = \text{SHA3-256}(SecretKey \parallel AssetSerial \parallel Corridor)$).
  - **Double-Pledge Elimination:** On-chain programs maintain an append-only bitset/map of spent nullifiers. If the nullifier has already been committed in any historical session or active PTB, the transaction aborts with `ERROR_NULLIFIER_ALREADY_SPENT` (`0x50`). This mathematically eliminates double-pledging of physical invoices, bills of lading, or warehouse receipts.
- `state-root`: 32-byte (64-hex) Merkle root of the accredited legal/asset registry (e.g. UN/CEFACT MLETR registry, national land title database, or accredited invoice clearinghouse).
- **Zero-leakage execution:** Verified in CPU cache via runtime memory introspection (`sysvar::instructions`). No public balance, invoice margin, or entity tax identifier is ever written to ledger state.

---

#### X402R — Real-World Asset (RWA) Lien Encumbrance

```abnf
x402r-payload   = "X402R:" asset-class ":" asset-id ":" hex32
                ; "X402R:" asset-class ":" asset-id ":" commitment
```

**Semantics:**  
- Programmatically locks, encumbers, or transfers a real-world legal lien or title claim in escrow against settlement funds.
- `asset-class`: Standardized asset classification code:
  - `INV`: Trade Finance Commercial Invoice
  - `EBL`: Electronic Bill of Lading (MLETR compliant)
  - `REC`: Accounts Receivable / Corporate Factoring
  - `CO2`: Verified Carbon Credit Batch (e.g. AfriCredit)
  - `CRE`: Commercial Real Estate Debt / Mortgages
- `asset-id`: Legal asset identifier (e.g., registry serial number, D-U-N-S + invoice number).
- `commitment`: 32-byte (64-hex) Pedersen commitment $T = r \cdot G + v \cdot H$ over the Ristretto255 curve concealing the exact valuation $v$ while asserting solvency against the downstream settlement debit (`X402W`).
- **Atomic Title Perfection:** If the downstream settlement leg (`X402W`) succeeds, the lien is atomically perfected to the creditor or liquidity pool. If `X402W` aborts, the encumbrance unwinds in volatile memory instantly with zero residual cloud on title ($\Delta = 0$).

---

### 4.3 Lane Derivation Note (All Discriminators)

When any discriminator payload includes a participant address that will be used as a hash input in the lane derivation function, the **raw 20-byte Borsh representation** MUST be used — not the bech32m text presentation. The bech32m checksum is a human-readable transcription aid; it carries no semantic meaning as a hash preimage. Using the text form produces a different lane id and constitutes a conformance failure.

---

### 4.4 Fold Chain (Session Audit Root)

```
R_0     = SHA3-256("SYN-R16-FOLD-v1" ‖ corridor_id.to_le_bytes() ‖ window_epoch.to_le_bytes())
leaf_k  = SHA3-256(receipt_k)          ;; 69-byte receipt per §4.2 X402N
R_k     = SHA3-256(R_{k-1} ‖ leaf_k)  ;; ascending lane order
root    = R_last                        ;; 64-char lowercase hex → L1 audit_root
```

- A chained fold, not a Merkle tree — chosen for O(1) incremental state per crank.  
- `FOLD_MAX_LANES = 8` per crank — this is a design constant, not a tunable. A crank MUST NOT fold more than 8 lanes even if compute headroom allows.  
- Cancelled lanes emit `settled_flag = 0x00`; they are NOT skipped. Every lane folds exactly once.  
- Live verification vector: corridor 16, session 14, 8/8 lanes → root `a161f58503615516e4a7aa678f19a7dc67ab6ef76b236f2d712a54ed80a6d331` (reproduced pure-compute ≡ Solana devnet ≡ L1 readback — three-way conformance).

---

## 5. Financial Transaction Patterns

These are the eight canonical banking patterns expressible in X402-TSWP. Each pattern is defined as a named PTB composition with mandatory discriminator sequence.

---

### Pattern 1: GATEWAY-METERED-TOOL-ACCESS (GTA)

**Use case:** Machine-to-machine API tool access behind a paywall (MCP / HTTP 402).  
**ISO analogy:** Service fee debit prior to resource grant.

```
PTB-GTA:
  [0] X402G:<challenge-uuid4>     ;; gateway paywall — consume challenge token
```

**Constraints:**
- Minimum: 1 command.
- The challenge UUID MUST be pre-issued by the server in a prior `HTTP 402` response.
- Payment evidence (e.g., 320 XRPL drops with `X402G:<uuid>` memo) MUST be validated before the tool response is returned.

---

### Pattern 2: MARGIN-ESCROW-ONLY (MEO)

**Use case:** Pre-trade margin call / collateral lock without settlement.  
**ISO analogy:** ISO 15022 `MT544` (Receive Free) — pre-position collateral.

```
PTB-MEO:
  [0] X402G:<challenge>           ;; gateway metering (optional but RECOMMENDED)
  [1] X402M:<corridor>:<maker>    ;; lock margin to non-custodial vault
```

**Constraints:**
- `X402M` without a subsequent `X402W` in the same PTB is a valid standalone margin lock.
- Margin locked by a standalone MEO MUST be explicitly released via a separate `X402MR` PTB after session finalization.
- A PTB with `X402M` and no `X402W` is NOT automatically rolled back — the margin lock persists until `X402MR`.

---

### Pattern 3: DELIVERY-VERSUS-PAYMENT (DvP)

**Use case:** Atomic simultaneous exchange of asset and payment with zero settlement risk.  
**ISO analogy:** ISO 15022 `MT543` / ISO 20022 `sese.023` — delivery versus payment.  
**Shariah note:** Satisfies *Yadan bi-Yadin* (hand-to-hand exchange) — see §10.

```
PTB-DvP:
  [0] X402G:<challenge>           ;; gateway fee
  [1] X402M:<corridor>:<debtor>   ;; lock debtor collateral
  [2] X402L:<lane>:<window>:<n>   ;; allocate execution lane
  [3] X402B:<session>             ;; bond session for deduplication
  [4] X402E:<corridor>:<uetr>     ;; bind ISO 20022 UETR
  [5] X402W:<session>:<debtor>    ;; settle debtor net (debit + fee)
  [6] X402N:<session>:<net-amt>   ;; emit immutable clearing receipt
```

**Invariant:** Commands [5] asserts `ΣDebits ≡ ΣCredits` before disbursement. If false → entire PTB aborts, [1] margin returns, [0] gateway fee is NOT refunded (the fee was for access, not for settlement outcome).

**Timing:** Sub-400ms from PTB submission to `X402N` leaf emission in production.

---

### Pattern 4: FX-SARF (Islamic Foreign Exchange)

**Use case:** Spot foreign exchange under Bay' al-Sarf (Islamic law commodity-for-commodity exchange). No deferred leg, no riba (interest), no gharar (speculation).  
**ISO analogy:** ISO 20022 `fxtr.013` (FX Trade Confirmation), spot value date.  
**Shariah note:** Full *Bay' al-Sarf* compliance analysis in §10.

```
PTB-SARF:
  [0] X402G:<challenge>
  [1] X402M:<corridor-A>:<counterparty-A>  ;; lock currency A collateral
  [2] X402M:<corridor-B>:<counterparty-B>  ;; lock currency B collateral
  [3] X402L:<lane>:<window>:<n>
  [4] X402E:<corridor-A>:<uetr>            ;; one UETR governs both legs
  [5] X402W:<session>:<counterparty-A>     ;; settle A → B leg
  [6] X402W:<session>:<counterparty-B>     ;; settle B → A leg
  [7] X402N:<session>:<net-combined>
```

**Constraints:**
- Both `X402M` commands [1] and [2] MUST lock before either `X402W` executes.
- Both settlement legs are in the same atomic PTB — if either fails, both margins return.
- No intermediate custody leg: this is the structural proof of simultaneity required for *Yadan bi-Yadin*.

---

### Pattern 5: MULTILATERAL-NET-CLEARING (MNC)

**Use case:** N-party bilateral obligation netting with conservation proof. The core use case of the R16 clearinghouse.  
**ISO analogy:** ISO 20022 `camt.053` (Statement of Account) + `pacs.009` (Financial Institution Credit Transfer) — multilateral netting cycle.

```
SESSION LIFECYCLE (operator-driven, NOT a single PTB):

  open_session(corridor_id)                     → session_id, status=1

  For each obligation:
    submit_obligation(session, creditor,          → obligation_id
                      amount, uetr)               ;; debtor signs

  seal_session(session_id, audit_root)           → status=2 (freeze submissions)

  For each debtor participant:
    PTB-MNC-SETTLE-DEBTOR:
      [0] X402W:<session>:<debtor>               ;; debit net + fee
      [1] X402N:<session>:<net-debit>

  For each creditor participant:
    PTB-MNC-SETTLE-CREDITOR:
      [0] X402W:<session>:<creditor>             ;; credit net
      [1] X402N:<session>:<net-credit>

  finalize_session(session_id)                   → status=3, conservation check
```

**Conservation requirement at finalize:**
```
session_settled_debt_volume == session_settled_credit_volume   ;; necessary
settlers_count == expected_debtors + expected_creditors        ;; sufficient
```

Both conditions MUST be true. A session where one is true and the other is not MUST fail finalization. (The vacuous `0 == 0` pass when all participants are unsettled is a confirmed v1 gap — §13.)

---

### Pattern 6: CORRIDOR-ROUTED-WIRE (CRW)

**Use case:** Cross-corridor settlement with explicit lane routing and UETR linkage.  
**ISO analogy:** SWIFT `pacs.008.001.08` — Customer Credit Transfer with UETR.

```
PTB-CRW:
  [0] X402G:<challenge>
  [1] X402M:<corridor>:<sender>
  [2] X402L:<lane>:<window>:<n>
  [3] X402E:<corridor>:<uetr>       ;; SWIFT-compatible UETR — 128-bit UUIDv4
  [4] X402W:<session>:<sender>
  [5] X402N:<session>:<amount>
```

**UETR constraints:**
- The UUIDv4 in `X402E` MUST be the same UETR used in the correspondent banking `pacs.008` message.
- The runtime introspector verifies byte-exact equality between the `X402E` payload and the `X402W` instruction's expected UETR parameter via `sysvar::instructions` — no external oracle lookup.
- UETR is globally unique per ISO 20022 — an implementation MUST NOT reuse a UETR across sessions.

---

### Pattern 7: BONDED-SESSION-STREAM (BSS)

**Use case:** Long-lived agent session with replay protection — suitable for continuous settlement streams (e.g., intraday real-time gross settlement, streaming micropayments).  
**ISO analogy:** RTGS continuous gross settlement with sequence number deduplication.

```
SESSION OPEN:
  PTB-BSS-OPEN:
    [0] X402BN:<session>          ;; bond initiation — register session

  Loop (for each settlement in the stream):
    PTB-BSS-SETTLE:
      [0] X402B:<session>         ;; assert bond is active
      [1] X402L:<lane>:<window>:<n>
      [2] X402E:<corridor>:<uetr>
      [3] X402W:<session>:<participant>
      [4] X402N:<session>:<amount>

SESSION CLOSE:
  PTB-BSS-CLOSE:
    [0] X402BR:<session>          ;; bond release — deregister session
```

**Constraints:**
- `X402BN` and `X402BR` for the same `session-id` MUST NOT appear in the same PTB.
- A `X402B` assertion without a prior `X402BN` MUST fail with a bond-not-found error.
- Session ids are monotonic and MUST NOT be reused after `X402BR` is executed.

---

### Pattern 8: DEFERRED-NETTING-SETTLEMENT (DNS)

**Use case:** End-of-day batch netting — obligations accumulate during the trading day; settlement executes as a single net position. Standard for FX market bilateral netting (CLS-style).  
**ISO analogy:** ISO 20022 `camt.054` (Debit/Credit Notification) post-netting, DTCC multilateral batch.

```
ACCUMULATION PHASE (intraday, many submit_obligation calls):
  For each trade:
    submit_obligation(session, creditor, amount, uetr)   ;; debtor signs

SETTLEMENT PHASE (end of day):
  seal_session(session_id, sha3_audit_root)

  For each debtor:
    PTB-DNS-DEBTOR:
      [0] X402W:<session>:<debtor>
      [1] X402N:<session>:<net-debit>

  For each creditor:
    PTB-DNS-CREDITOR:
      [0] X402W:<session>:<creditor>
      [1] X402N:<session>:<net-credit>

  finalize_session(session_id)

  Fold (per crank, max 8 lanes):
    fold_crank(session_id, [lane_receipts_batch])

  Solana close-back:
    seal_master_clearing(corridor, window, fold_root)
    → L1 get_session_audit_root(session_id) == fold_root  ;; three-way conformance
```

**Three-way conformance proof (required for DNS):**
1. Pure compute: local SHA3-256 fold chain over the 69-byte receipts
2. Solana devnet: lane PDAs' accumulated fold state
3. L1 readback: `get_session_audit_root(session_id)` hex string

All three MUST produce the same root. A discrepancy in any one is a conformance failure.

---

### Pattern 9: RWA-DvP (Atomic Real-World Asset Delivery-versus-Payment)

**Use case:** Institutional factoring, commodity trade finance, and private credit clearing where physical or legal real-world asset (RWA) claims are exchanged simultaneously for settlement liquidity without public disclosure of commercial terms.  
**ISO / Statutory analogy:** UNCITRAL Model Law on Electronic Transferable Records (MLETR), ISO 20022 `sese.023` (Securities Settlement Transaction), and UCC Article 9 electronic chattel paper perfection.  
**Cryptographic anchor:** SYN-TD-008 (`10.5281/zenodo.23002720`) zero-knowledge balance encryption and Bulletproof range proofs.

```
PTB-RWA-DvP:
  [0] X402G:<challenge>                          ;; gateway paywall / MCP metering
  [1] X402Z:<proof_id>:<nullifier>:<state_root>  ;; ZK state attestation (proves ownership, title, & valuation range)
  [2] X402R:<asset_class>:<asset_id>:<commitment>;; programmatically encumbers RWA lien / title claim in escrow
  [3] X402L:<lane>:<window>:<n>                  ;; ADR-062 concurrent lane allocation
  [4] X402E:<corridor>:<uetr>                    ;; binds ISO 20022 CBPR+ pacs.008 SWIFT payment tracking ID
  [5] X402W:<session>:<debtor>                   ;; settles net liquidity disbursement (asserts Invariant 9)
  [6] X402N:<session>:<net-amt>                  ;; emits immutable consensus receipt leaf binding cash & perfected lien
```

**Constraints & Execution Semantics:**
- **Zero Double-Pledge Invariant:** Command [1] evaluates `<nullifier>`. If the nullifier exists in the on-chain nullifier bitset, the transaction aborts with `0x50` (`ERROR_NULLIFIER_ALREADY_SPENT`) before Command [2] attaches or any liquidity is touched.
- **Atomic Lien Perfection:** Command [2] attaches a programmatic lien commitment ($T = r \cdot G + v \cdot H$) to the asset. The lien attaches **if and only if** Command [5] disburses liquidity successfully.
- **Fail-Closed Rollback:** If Command [5] fails (e.g. liquidity shortage, sanctions breach, or Invariant 9 non-zero delta), Commands [2] and [1] roll back in memory instantly ($\Delta \equiv 0$). The debtor retains 100% unencumbered asset ownership; zero collateral remains stranded.
- **AU-2 Regulatory Viewing Key Delegation:** The underlying invoice details, tax IDs, and exact trade margins are encrypted via twisted ElGamal over Curve25519 (SYN-TD-008 §2). Designated compliance authorities possessing the private viewing key can decrypt transaction details without public ledger leakage.

---

## 6. PTB Composition Algebra

### 6.1 Sequential Composition

Commands within a PTB execute in strict index order `[0], [1], ..., [N]`. The state available to command `[k]` is the transient in-memory state produced by commands `[0]` through `[k-1]`:

```
S_transient = δ(C_{N-1}, δ(..., δ(C_1, δ(C_0, S_initial))...))
```

Persistent state mutation is gated on full pipeline success:

```
S_final = Commit(S_transient)  if ∀ i ∈ [0,N]: Status(C_i) = SUCCESS
          S_initial            if ∃ i ∈ [0,N]: Status(C_i) = ERROR
```

### 6.2 Parallel Composition (Lane Independence)

Two PTBs targeting distinct lanes `k1 ≠ k2` commute — execution order does not affect final state:

```
δ(PTB_A(k1), δ(PTB_B(k2), Σ)) ≡ δ(PTB_B(k2), δ(PTB_A(k1), Σ))
```

This enables an institutional treasury to stream thousands of concurrent PTB settlement pipelines without Head-of-Line blocking. Lane independence is structural (different PDA seeds, different account write sets, no shared mutable state between lanes in the same corridor+window tuple).

### 6.3 Rollback Guarantee

The rollback guarantee is not a try/catch — it is enforced by the ledger runtime's atomic execution model. Any command returning a non-zero error code causes the runtime to revert all account state mutations applied since the PTB's first instruction. No partial state is visible post-revert.

**Operational implication:** An implementation MUST NOT split a logical settlement lifecycle across multiple non-atomic transactions. Doing so breaks the rollback guarantee and exposes intermediate state.

### 6.4 Composition Constraints

| Rule | Constraint |
|:---|:---|
| C1 | `X402G` MUST be Command [0] if present |
| C2 | `X402M` MUST precede `X402W` in the same PTB |
| C3 | `X402L` MUST precede `X402E` and `X402W` |
| C4 | `X402E` MUST precede `X402W`; UETR in both MUST be byte-identical |
| C5 | `X402N` MUST be the final command in a settlement PTB |
| C6 | `X402BN` and `X402BR` MUST NOT coexist in the same PTB |
| C7 | A PTB MUST contain at least 1 command |
| C8 | Max PTB depth = implementation-defined; RECOMMENDED minimum = 8 commands |
| C9 | `X402Z` MUST precede `X402R` and `X402W` in any RWA settlement pipeline |
| C10 | An `X402R` encumbrance MUST be succeeded by an atomic `X402W` settlement or explicitly roll back ($\Delta \equiv 0$) |

---

## 7. Invariants

### 7.1 Invariant 9 — Continuous Solvency (THE CORE INVARIANT)

At execution of every `X402W` command, and again at `finalize_session`, the following MUST hold:

```
∑_{j=1}^{m} GrossDebits(p_j)  ≡  ∑_{j=1}^{m} GrossCredits(p_j) + ∑_k Fee_k
```

Where `Fee_k = (net_debt_k × corridor_fee_bps) / fee_denom` (integer floor division).

**Delta form:** `Δ = ΣDebits − ΣCredits − ΣFees ≡ 0`

If `Δ ≠ 0`, the VM MUST abort with error `0x24` and roll back the entire PTB. Naked credit creation (credits appearing without corresponding debits) is structurally impossible when this invariant is enforced.

**Formal proof of fee conservation:** Fees are paid by debtors on top of the net — they are additive to debtor obligations and do NOT reduce creditor credits. Therefore:

```
debtor_pays   = net_debt + fee
creditor_gets = net_credit                         (= net_debt, before fees)
admin_gets    = fee
TOTAL_OUT     = net_debt + fee = debtor_pays       ✓ conservation closes
```

### 7.2 Invariant L1 — Lane Uniqueness

Every state write for one `(corridor, participant, window)` tuple lands in exactly ONE lane account. Two obligations with the same tuple derive the same lane — by design. A lane is an execution partition, not an identity. Same-lane different-owner PDAs are distinct accounts.

### 7.3 Invariant L2 — Lane Opacity

The lane number alone identifies nothing. All evidence binds to the full `(corridor, participant, window)` tuple, never to `lane_id` alone.

### 7.4 Invariant B1 — Bond Monotonicity

Session bond ids are monotonic and globally unique. A `session-id` reuse after `X402BR` is a protocol violation. An implementation MUST refuse `X402BN` for an already-active or previously-released session-id.

### 7.5 Invariant N1 — Nonce Ordering

Within a lane+window, nonces are monotonically increasing. A nonce less than or equal to the current watermark `W_k` for lane `k` MUST be refused. The sliding bitmask `B_k` tracks the last 256 positions; a nonce outside the window `[W_k, W_k + 256)` MUST be refused.

### 7.6 Invariant D1 — Direction Precedence

Net direction MUST be resolved before magnitude computation. The canonical form:

```rust
let is_debtor: bool = get_net_is_debtor(session, participant);
let amount: u128 = if is_debtor {
    get_net_amount(session, participant)
} else {
    get_net_creditor_amount(session, participant)
};
```

The form `amount = |gross_payable − gross_receivable|` without direction resolution first is **non-conformant** — it triggers integer overflow when `gross_payable < gross_receivable` in a u128 unchecked context (a confirmed live-chain bug; see `docs/r16/CLEARING-PROTOCOL-GUIDE.md §4.3`).

---

## 8. Fee Arithmetic

All fee arithmetic is **integer arithmetic**. No floating point. No u256 (unless the runtime natively supports it and overflow is explicitly tested).

```
fee_denom         = 10000            ;; constant, not configurable
corridor_fee_bps  = corridor_fee_bps[corridor_id]   ;; registered u64
                    OR default_fee_bps (= 5) if corridor value is 0

fee               = (net_debt × corridor_fee_bps) / fee_denom   ;; u128, floor division
debtor_debit      = net_debt + fee
creditor_credit   = net_debt                ;; creditor gets the full net, not net-fee
admin_credit      = fee
```

**Live example (session 11, corridor 16):**
```
net_debt          = 600,300,000,000 base units (600.3e9)
corridor_fee_bps  = 5
fee               = (600,300,000,000 × 5) / 10000 = 300,150,000 base units
debtor_pays       = 600,300,000,000 + 300,150,000 = 600,600,150,000
creditor_receives = 600,300,000,000
admin_receives    = 300,150,000
```

**Overflow guard:** `net_debt × fee_bps` MUST be checked-multiply before division. A `checked_mul` failure MUST abort the PTB. Do NOT silently wrap.

**No implicit FX:** The `corridor_base_token` and `corridor_quote_token` are separate registered addresses. A PTB settling corridor A does not touch corridor B balances. If a settlement spans two currency units, use Pattern 4 (FX-SARF) with two separate `X402M` legs.

---

## 9. ISO 20022 / SWIFT Compliance Mapping

| X402-TSWP Element | ISO 20022 / SWIFT Equivalent |
|:---|:---|
| `X402G` UUIDv4 challenge | `TxId` in `pacs.008` (Unique Transaction Identifier) |
| `X402M` corridor + maker | `Collateral` in `camt.071` Margin Call message |
| `X402L` lane + window | `SeqNb` + `GrpId` in `pacs.009` batch routing |
| `X402E` UETR | `UETR` in `pacs.008.001.08` CBPR+ (RFC 4122 UUIDv4, mandatory field) |
| `X402W` session + participant | `CdtTrfTxInf` / `DbtrAcct` in `pacs.009` (net settlement instruction) |
| `X402N` net readback | `TxSts` `ACSC` (Accepted Settlement Completed) in `pacs.002` |
| `X402B` session bond | `GrpRef` in `camt.055` batch session reference |
| `submit_obligation` + UETR | `FIToFICstmrCdtTrf` `pacs.008` — debtor-signed obligation |
| `seal_session` + audit_root | `ReportEntry` hash in `camt.053` Statement of Account |
| `finalize_session` | `BatchBookg` = true in `pain.001` — net book confirmation |
| Conservation invariant | `TtlNbOfTxs` + `CtrlSum` reconciliation in `pain.001.001.09` |
| `X402Z` ZK State Proof | `sese.023` (Securities Settlement Transaction Confirmation) / UNCITRAL MLETR §10 |
| `X402R` RWA Lien | `camt.054` / UCC Article 9 Electronic Chattel Paper Lien Attachment |

**UETR Format (normative):**
```
uetr = 8HEXDIG "-" 4HEXDIG "-" "4" 3HEXDIG "-" variant-bits 3HEXDIG "-" 12HEXDIG
```
Where `variant-bits` is one of `%x38`, `%x39`, `%x61`, `%x62` (RFC 4122 §4.4).

---

## 10. Shariah Compliance

### 10.1 Riba Prohibition (No Interest)

The fee model (§8) is a flat basis-point service levy on the net transaction amount — structurally equivalent to a *ujrah* (service fee, permitted) not a *riba* (interest on debt, prohibited). The fee does not compound, does not accrue over time, and is not contingent on delay (there is no deferred settlement; all settlement is atomic sub-400ms). An implementation MUST NOT implement penalty fees for settlement delay within a PTB — the PTB either settles or rolls back, with no intermediate time exposure.

### 10.2 Gharar Prohibition (No Uncertainty)

Every PTB has a deterministic binary outcome: either all commands succeed and state commits, or any command fails and all state reverts. There is no partial settlement, no probabilistic outcome, and no off-chain oracle-dependent price input. The UETR-linkage (`X402E`) binds the settlement amount to a specific pre-agreed CBPR+ instruction — no spot-rate price oracle is embedded in the protocol.

### 10.3 Bay' al-Sarf (Spot FX)

The FX-SARF pattern (Pattern 4) satisfies the two conditions of *Bay' al-Sarf*:

1. **Simultaneity** (*taqabud*): Both currency legs are locked by `X402M` and settled by `X402W` inside the same atomic PTB. There is no temporal gap between delivery of the two currencies — atomicity is the structural proof.
2. **Equal for Equal** (*tamathul*): The conservation invariant (§7.1) ensures `ΣDebits ≡ ΣCredits`. No currency is created or destroyed in the exchange — the exchange is lossless except for the disclosed service fee.

**Practical note for Islamic finance corridors:** Corridor registration SHOULD specify `corridor_fee_bps = 0` for Shariah-reviewed corridors where a separate *ujrah* agreement covers the fee externally. The zero-bps path is conformant and tested (fee = 0, debtor_pays = net_debt, conservation still holds).

### 10.4 Yadan bi-Yadin (Hand-to-Hand)

The PTB atomicity is the digital implementation of *Yadan bi-Yadin* — "hand-to-hand" simultaneous exchange. The atomic rollback guarantee (§6.3) means there is no scenario where Party A delivers without Party B delivering in the same transaction block. Bridge-based or sequential-transaction approaches cannot satisfy *Yadan bi-Yadin* because the inter-transaction gap creates a window of unilateral exposure.

### 10.5 Tangible Real-Asset Backing (Mal Mutaqawwim)

In Islamic commercial law (Fiqh al-Mu'amalat), a valid trade or financing contract (e.g. *Murabaha*, *Salam*, *Istisna'a*, or *Ijarah*) requires the existence of real, identifiable, legally owned, and unencumbered subject matter (*Mal Mutaqawwim*). Purely synthetic financial derivatives, unbacked debts traded for debt (*Bay' al-Kali bi-al-Kali*), and fractional reserves without underlying physical assets are strictly impermissible.

The combination of `X402R` and `X402Z` establishes mathematical compliance with *Mal Mutaqawwim*:
1. **Asset Tangibility Proof:** `X402R` requires an accredited asset classification (`INV`, `EBL`, `REC`, `CO2`, `CRE`) and legal registry identifier.
2. **Title Verification Without Usury:** `X402Z` verifies the unencumbered ownership of the physical asset via non-interactive zero-knowledge proofs.
3. **Prevention of Fictitious Trade Financing:** The nullifier mechanism in `X402Z` prevents the same physical commodity or invoice from being financed more than once (eliminating duplicate *Murabaha* pledge fraud, historically a persistent issue in Islamic trade banking).

---

## 11. Multi-Rail Carrier Semantics

### 11.1 SynapticChain L1 (Ledger of Record)

- All session state (status, obligations, nets, conservation, fees) lives on L1.
- Memo format for L1 native `submit_obligation`: the `uetr` field is stored directly as a string in `obligation_uetr` — not embedded in an `X402E` memo. The `X402E` memo is a cross-chain linkage carrier, not a L1 storage format.
- All integer types in L1 are `u128` (base units). No floating point. No u256 unless explicitly proven.

### 11.2 Solana SPL Token-2022 (Execution Lane Mirror)

- `X402L` memos ride SPL Memo v2 program (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`).
- Maximum memo length: 50 bytes (including the `X402L:` prefix). Implementations MUST pad or truncate to stay within 50 bytes.
- Bidirectional `sysvar::instructions` linkage: the lane program reads the memo from its own instruction AND the preceding instruction to assert the funding tx originates from the expected corridor+window+participant tuple.
- PDA derivation seeds (normative):
  - Lane state: `["escrow_lane", lane(1B), corridor(8 LE), window(8 LE), participant(20B)]`, magic discriminator `3`
  - Lane vault: `["lane_vault", lane_state_pda(32B), mint(32B)]` — Token-2022, authority = lane PDA
  - Master clearing: `["clearing_master", corridor(8 LE), window(8 LE)]`, magic discriminator `4`
- Namespace safety: `"escrow"` (6 bytes) and `"escrow_lane"` (11 bytes) can never produce the same PDA preimage — disjoint by seed length.

### 11.3 XRPL Altnet (Evidence Rail)

- `X402W` settlement evidence is an `EscrowCreate` from the participant to the custodian carrying all three memos:
  ```
  X402W:<session>:<syn_addr>
  X402M:<corridor_id>:<syn_addr>
  X402N:<session>:<net_amount>
  ```
- The validator reads the *transaction* (not the escrow object — escrow ledger objects carry no memos).
- The `EscrowCreate` MUST lock to the custodian address. An escrow to any other address is not valid settlement evidence.
- `EscrowFinish` with `tfEscapeCancel` flag = `temINVALID_FLAG` on altnet — use the `EscrowCancel` path.
- Cancel timing validates against **ledger close time**, not wall clock. Implementations MUST use ledger time for escrow expiry calculations.
- Drop/base-unit conversion: XRPL drops and L1 base units are different units. The chain number (`<net_amount>` in the memo) carries the L1 base unit value. No drop-to-sUSD conversion is embedded in the protocol.

### 11.4 HTTP 402 / MCP (Machine-to-Machine Transport)

- A conforming server MUST respond to an unauthenticated resource access with:
  ```
  HTTP/1.1 402 Payment Required
  X-Payment-Required: X402G:<uuid4>
  X-Payment-Amount: <amount-in-drops>
  X-Payment-Memo: X402G:<uuid4>
  ```
- A conforming client MUST submit payment with the exact memo `X402G:<uuid4>` and then retry the request with:
  ```
  X-Payment-Receipt: <rail-tx-id>
  ```
- The server validates the payment receipt against the challenge token before responding.
- Tokens are single-use. The server MUST record consumed tokens and refuse replays.

---

## 12. Implementation Requirements

### 12.1 Conformance Levels

An implementation is **conformant** if it satisfies all of:

| Requirement | Test |
|:---|:---|
| Produces byte-identical payloads for all 10 discriminators | Wire grammar ABNF (§3, §4) |
| Enforces Invariant 9 at every `X402W` and `finalize` | Conservation math (§7.1) |
| Uses direction-before-magnitude for net settlement | Invariant D1 (§7.6) |
| Uses raw 20-byte address for lane derivation | §4.3 |
| Uses SHA3-256 (Keccak-256 is NOT conformant) | §4.4 |
| Uses integer arithmetic only for fees | §8 |
| Read-validates all state writes (no dry-run trust) | Axiom A3 |

### 12.2 The waitState Discipline

Every state-mutating write MUST be followed by a state read that confirms the new state before proceeding. A dry-run of a write LIES — the dry-run return value is not the on-chain state. Silent reverts (VM exceptions that do not propagate to the caller) are real on SynapticChain L1 (a confirmed live-chain behavior). The only reliable source of truth is a post-write readback.

```
write(tx)
state = read_until(expected_state, timeout)   ;; poll live chain
if state != expected_state:
    raise SettlementSyncError
```

### 12.3 Prohibited Patterns

| Anti-Pattern | Why Prohibited |
|:---|:---|
| Split lifecycle across multiple non-atomic txs | Breaks rollback guarantee (§6.3) |
| Use bech32m text as lane derivation hash input | Produces wrong lane id (§4.3) |
| `\|gross_payable − gross_receivable\|` without direction | Integer overflow, non-conformant (§7.6) |
| `compute_net_position` returning signed value | Live-VM directional collapse bug (retired function) |
| Trust dry-run return value as on-chain state | Dry-runs lie — use readback (§12.2) |
| Float arithmetic for fees | Precision loss, non-conformant (§8) |
| Regex parsing of memo fields | Non-conformant — byte-exact match only (Axiom A1) |
| Cross-unit FX assumption within PTB | Non-conformant — no implicit FX (Axiom A4) |

### 12.4 Error Codes (Normative Subset)

| Code | Meaning |
|:---|:---|
| `0x04` | `MEMO_LINKAGE_MISSING` — lane memo mismatch |
| `0x24` | Invariant 9 violation — `Δ ≠ 0` |
| `0x30` | `INSUFFICIENT_PTB_DEPTH` — sysvar introspection found fewer than 2 prior instructions |
| `0x31` | `LANE_LINKAGE_MISMATCH` — `X402L` payload mismatch |
| `0x32` | `UETR_PAYLOAD_MISMATCH` — `X402E` UETR mismatch |

---

## 13. Known Gaps and Disclosure

This section is the honesty contract. Every gap is stated directly.

| Gap | Status |
|:---|:---|
| **V1 conservation vacuous pass** — `finalize` passes `0==0` when all participants are unsettled. | **FIXED** in v-next (`syn1qwvut…`), deployed and cut over. V1 retained for audit trail. |
| **V1 margin custody** — V1 `deposit_margin` is bookkeeping, not a real token transfer. | **FIXED** in v-next — real cross-contract `balance_of` watermark. Deployed and cut over. |
| **Fourth rail** — The codec spec is ledger-agnostic (SHA3-256 speaking), but only three rails are live-demonstrated (L1, Solana devnet, XRPL altnet). | Open demonstration gap. Not a defect. Closing it means standing a fourth rail. |
| **`RaiseIntentFailTargetedAppInstanceResolve1`** — One FINOS FDC3 conformance test (1/132 = 0.76%) fails due to a bug in `@finos/fdc3-web-impl` library error-contract churn. | Upstream FINOS issue. Fix = file PR against `@finos/fdc3-web-impl`. Not a protocol defect. |
| **External audit** — No third-party security audit has been completed. | Audit-readiness dossier complete (`docs/audit/AUDIT-ENGAGEMENT-DOSSIER-2026-09-28.md`). Pending commission of Trail of Bits, OpenZeppelin, Kudelski, or Zellic. |
| **Mainnet volume** — All rail evidence is testnet/devnet. | Devnet-only. No mainnet volume. No real money moved in production outside testnet. |
| **`X402L`, `X402E`, `X402B`, `X402BN`, `X402BR`, `X402MR`** — Formally registered but not in Delta live validator production subset. | Estate law (registered). Delta production runs `X402G`, `X402M`, `X402N`, `X402W` only. Full 10-code implementation is the roadmap, not the current runtime. |

---

## Appendix A — Quick Reference Card

```
GRAMMAR
  x402-message = discriminator ":" payload
  discriminator = "X402" type-tag [sub-tag]
  All payloads = 7-bit ASCII, max 250 bytes total

10 DISCRIMINATORS
  X402G:<uuid4>                    gateway paywall
  X402M:<corridor>:<maker>         margin escrow
  X402MR:<corridor>:<maker>        margin return
  X402L:<lane>:<window>:<n>        lane allocation  (≤50B on Solana)
  X402B:<session>                  session bond
  X402BN:<session>                 bond initiation
  X402BR:<session>                 bond release
  X402E:<corridor>:<uetr>          ISO 20022 UETR linkage
  X402W:<session>:<participant>    net settlement
  X402N:<session>:<net-amount>     consensus receipt

8 PATTERNS
  GTA   = [G]
  MEO   = [G,M]
  DvP   = [G,M,L,B,E,W,N]
  SARF  = [G,M,M,L,E,W,W,N]      (two M, two W)
  MNC   = session lifecycle + per-participant [W,N] PTBs
  CRW   = [G,M,L,E,W,N]
  BSS   = [BN] open, [B,L,E,W,N]* loop, [BR] close
  DNS   = accumulate + seal + per-participant [W,N] + finalize + fold

INVARIANT 9 (CORE)
  ΣDebits ≡ ΣCredits + ΣFees   (Δ = 0)
  Abort 0x24 if Δ ≠ 0

FEE MATH (integer only)
  fee = (net_debt × corridor_fee_bps) / 10000   (floor)
  debtor_pays = net_debt + fee
  creditor_gets = net_debt
  admin_gets = fee

LANE DERIVATION
  input = "SYN-R16-LANE-v1" ‖ corridor_le8 ‖ participant_raw20 ‖ window_le8
  lane  = SHA3-256(input)[0]

FOLD CHAIN
  R_0 = SHA3-256("SYN-R16-FOLD-v1" ‖ corridor_le8 ‖ window_le8)
  R_k = SHA3-256(R_{k-1} ‖ SHA3-256(receipt_k))
  receipt = "SYN-R16-LEAF-v1" ‖ lane(1) ‖ corridor(8) ‖ participant(20) ‖ window(8) ‖ net(16) ‖ flag(1)

PROHIBITED
  bech32m text as hash input | dry-run trust | float fee arithmetic
  regex memo parse | |payable-receivable| without direction | split lifecycle
```

---

## Appendix B — Standard Linkages

| Standard | Linkage |
|:---|:---|
| IETF Internet-Draft | `draft-shabazz-http-x402-tswp-01` |
| Zenodo DOI (Umbrella) | `10.5281/zenodo.23000701` (SYN-TD-006) |
| Zenodo DOI (Financial PTB Standard) | `10.5281/zenodo.23038493` (SYN-TD-011) |
| Zenodo DOI (PTB Pipelining) | `10.5281/zenodo.22996628` (SYN-TD-005) |
| Zenodo DOI (ADR-062 Lanes) | `10.5281/zenodo.22996200` (SYN-TD-004) |
| Zenodo DOI (Core Protocol) | `10.5281/zenodo.22979715` (SYN-TD-001) |
| FINOS FDC3 PR | `#2204` — `StartPayment` intent (FDC3 ↔ X402-TSWP bridge) |
| Solana SIMD | `SIMD-0671` |
| Interledger RFC | `RFC #605` |
| ISO 20022 | `pacs.008.001.08`, `camt.053`, `camt.054`, `fxtr.013` |
| RFC 4122 | UUIDv4 UETR format |

---

*End of SYN-FPS-2026-001 v1.0*
