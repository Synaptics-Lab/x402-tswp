# RFC-0402: X402 Typed Settlement Wire Protocol (X402-TSWP)

```
Document:       RFC-0402
Title:          The X402 Typed Settlement Wire Protocol (X402-TSWP)
Category:       Standards Track
Status:         Draft / Specification v1.0.0
Author:         Abdul Shabazz <veritasvaultone@gmail.com>
Organization:   Synaptics Lab
Solana SIMD:    https://github.com/solana-foundation/solana-improvement-documents/pull/671
IETF Draft:     https://datatracker.ietf.org/doc/draft-shabazz-http-x402-tswp/
Zenodo DOI:     https://doi.org/10.5281/zenodo.22979715
Target Bodies:  IETF (HTTPbis), Linux Foundation FINOS (FDC3 Standards WG), Solana SIMD
Created:        2026-09-26
```

---

## 1. Abstract

RFC-0402 defines the **X402 Typed Settlement Wire Protocol (X402-TSWP)**, an extensible, byte-exact state-machine grammar and multi-rail transport protocol for machine-to-machine (M2M) micropayments, collateralization, and multilateral netting settlements. 

Unlike naive implementations of HTTP status code `402 Payment Required` that rely on untyped off-chain transaction hashes, X402-TSWP introduces single-byte operational type discriminators (`X402<Type>:<Payload>`) enforced at the blockchain runtime layer. On high-throughput execution engines like Solana, X402-TSWP eliminates string parsing, regular expressions, and prefix matching in favor of byte-exact equality verification via runtime instruction introspection (`sysvar::instructions`). It establishes native interoperability between Web3 multi-lane escrows, FINOS FDC3 desktop context routing, and SWIFT ISO 20022 financial messaging.

---

## 2. Problem Statement & Motivation

### 2.1 The Failure Modes of Naive HTTP 402
Historically, RFC 9110 (HTTP Semantics §15.5.3) reserved status code `402 Payment Required` without standardizing challenge headers, verification parameters, or settlement lifecycles. Emerging AI-agent payment schemes typically implement naive 402 protocols:
1. **Zero Concurrency Control:** When concurrent agent processes trigger payments, unindexed transfers result in nonce collisions, double-spend rejections, and state clobbering.
2. **Gross Inefficiency (No Netting or Margining):** Every micro-invocation incurs on-chain transaction fees and ledger bloat. There is no mechanism to accumulate bilateral obligations and settle directional net balances.
3. **Absence of Institutional Traceability:** Raw cryptocurrency transaction hashes cannot be reconciled against SWIFT ISO 20022 end-to-end identification (RFC 4122 UUIDv4 UETR).
4. **Vulnerability to Decoy & Front-Running Attacks:** Off-chain listeners relying on regex prefix matching can be tricked by spoofed transaction memos containing trailing or leading garbage bytes.

### 2.2 The X402-TSWP Invariant
X402-TSWP enforces three non-negotiable operational invariants:
- **Zero-Regex On-Chain Enforcement:** On-chain programs (Solana SBF, Synaptic VM) perform strictly byte-exact comparisons against precomputed byte arrays.
- **Atomic Preimage Linkage:** Settlement release instructions MUST verify the existence of a preceding memo instruction within the same atomic transaction package.
- **Deterministic State Transition Typing:** Every payment payload is strictly classified by an operational subtype defining its lifecycle stage (metering, escrow, netting, margin, or final disbursement).

---

## 3. Formal Wire Grammar

### 3.1 Lexical Structure
All X402-TSWP wire payloads conform to the following Augmented Backus-Naur Form (ABNF, RFC 5234):

```abnf
x402-wire-payload = "X402" type-tag [ ":" sub-type ] ":" payload
type-tag          = ALPHA ; Single ASCII uppercase character [A-Z]
sub-type          = ALPHA ; Optional secondary qualifier (e.g., 'R', 'N')
payload           = 1*128( VCHAR ) ; Printable ASCII (0x21-0x7E), excluding whitespace
```

### 3.2 Canonical Formatting Rules
1. **Encoding:** Strict 7-bit ASCII. Multi-byte UTF-8, null bytes (`0x00`), and control characters are strictly forbidden and trigger immediate on-chain deserialization rejection (`MEMO_INVALID_ENCODING`).
2. **Decimal Numerics:** All integers (`lane_id`, `window_epoch`, `nonce`, `amount`) MUST be represented in standard base-10 ASCII without leading zeros (e.g., `0`, `151`, `1789860218`). The token `0151` is illegal.
3. **Delimiter:** The colon character (`:`, ASCII `0x3A`) is the sole hierarchical field delimiter. Empty adjacent delimiters (`::`) are forbidden.
4. **Maximum Length:** On Solana SPL Memo v2, total memo payload length MUST NOT exceed 50 bytes (for lane memos) or 128 bytes (for settlement memos).

---

## 4. Operational Type Discriminator Registry

X402-TSWP allocates operational discriminators into a structured namespace:

```
X402
 ├── G : Gateway Challenge & Tool Metering
 ├── B : Bonded Session Collateral
 │    ├── BN : Netted Bond Release
 │    └── BR : Bond Return / Clawback
 ├── M : Market Maker Margin Escrow
 │    └── MR : Margin Return Payout
 ├── L : Concurrent Lane Funding
 ├── N : Net Obligation Readback
 ├── W : Multilateral Netting Window Settlement
 └── E : Cross-Border Corridor ISO 20022 Linkage
```

### 4.1 `X402G:<challenge>` (Gateway Paywall & Metering)
- **Grammar:** `X402G:<uuidv4>` (Exact length: 42 bytes).
- **Transport Carrier:** XRPL Altnet/Mainnet Payment (`MemoData`) or Solana SPL Memo v2.
- **Semantics:** Minted by an HTTP 402 server to meter API/MCP tool access. `<challenge>` is a non-fungible RFC 4122 UUIDv4 token. On-chain validation grants credits to the payer's session on the L1 credit registry (`CreditSession v5`).

### 4.2 `X402L:<lane>:<window>:<nonce>` (Concurrent Lane Funding)
- **Grammar:** `X402L:<0..255>:<u64_window>:<u64_nonce>` (Max length: 50 bytes).
- **Transport Carrier:** Solana Devnet/Mainnet SPL Memo v2 (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`).
- **Semantics:** Feeds parallel execution pipelines (e.g., ADR-062 256-lane sliding window). Disambiguates multiple concurrent fundings targeting the same settlement window without account contention.

### 4.3 `X402W:<window>:<participant_id>` (Net-Window Settlement)
- **Grammar:** `X402W:<u64_window>:<syn_bech32_address>`
- **Transport Carrier:** Dual-rail (Solana SPL Memo v2 + XRPL Payments).
- **Semantics:** Executed by clearinghouse debtors to deposit net obligations, and by the clearing custodian to disburse net credits to liquidity providers. Atomic with window freeze.

### 4.4 `X402M:<corridor_id>:<maker_id>` (Maker Margin Escrow)
- **Grammar:** `X402M:<u32_corridor>:<syn_bech32_address>`
- **Transport Carrier:** XRPL `EscrowCreate` / Solana PDA Escrow.
- **Semantics:** Pre-funds bilateral or multilateral netting margin pools. Gated by custodian authorization prior to opening trading limits.

### 4.5 `X402N:<session_id>:<net_balance>` (Net Readback)
- **Grammar:** `X402N:<u64_session>:<s64_net_drops>`
- **Transport Carrier:** Ledger-of-record state transitions.
- **Semantics:** Verbatim on-chain readback of the multi-party clearing matrix. Prevents divergence between off-chain blotters and consensus state.

### 4.6 `X402E:<corridor_id>:<uetr>` (ISO 20022 Cross-Border Linkage)
- **Grammar:** `X402E:<u32_corridor>:<uuidv4_uetr>`
- **Transport Carrier:** Cross-border settlement carriers.
- **Semantics:** Directly binds an on-chain escrow release or Token-2022 transfer to an ISO 20022 `pacs.008.001.08` SWIFT message envelope.

---

## 5. Solana SBF Runtime Verification Specification

On Solana, on-chain programs enforce X402-TSWP through **Instructions Sysvar Introspection**. The program does not rely on off-chain relayer claims or client-supplied signatures; it verifies that the memo instruction was executed in the identical transaction pipeline.

### 5.1 Verification Algorithm
```rust
use solana_program::{
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    instruction::Instruction,
    program_error::ProgramError,
    sysvar::instructions::{
        load_current_index_checked, load_instruction_at_checked, ID as IX_SYSVAR_ID,
    },
};

pub const SPL_MEMO_V2_ID: [u8; 32] = [
    // MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr
    0x05, 0x4a, 0x53, 0x5a, 0x99, 0x29, 0x21, 0x06,
    0x4d, 0x24, 0xe8, 0x71, 0x60, 0xda, 0x38, 0x7c,
    0x7c, 0x35, 0xb5, 0xdd, 0xbc, 0x23, 0x70, 0x57,
    0xbc, 0xa3, 0x3a, 0x5a, 0xfc, 0xe6, 0x45, 0x79,
];

pub fn verify_x402_memo_linkage(
    ix_sysvar: &AccountInfo,
    expected_wire_payload: &[u8],
) -> ProgramResult {
    // 1. Validate Sysvar Identity
    if ix_sysvar.key != &IX_SYSVAR_ID {
        return Err(ProgramError::InvalidArgument);
    }

    // 2. Load Instruction Index
    let current_idx = load_current_index_checked(ix_sysvar)?;
    if current_idx == 0 {
        return Err(ProgramError::Custom(0x04)); // MEMO_LINKAGE_MISSING
    }

    // 3. Inspect Preceding Instruction
    let preceding_ix: Instruction = load_instruction_at_checked(
        (current_idx - 1) as usize,
        ix_sysvar,
    )?;

    // 4. Validate Program Owner (Must be official SPL Memo v2)
    if preceding_ix.program_id.to_bytes() != SPL_MEMO_V2_ID {
        return Err(ProgramError::Custom(0x05)); // INVALID_MEMO_PROGRAM
    }

    // 5. Byte-Exact String Comparison (Zero regex, zero prefix fuzzing)
    if preceding_ix.data != expected_wire_payload {
        return Err(ProgramError::Custom(0x06)); // MEMO_PAYLOAD_MISMATCH
    }

    Ok(())
}
```

### 5.2 Token-2022 RequiredMemoTransfers Invariant
When interacting with creditor settlement vaults, accounts MUST enforce the native SPL Token-2022 `RequiredMemoTransfers` extension. Any raw transfer instruction submitted without a linked `X402*` memo fails immediately at the Solana runtime protocol layer.

---

## 6. HTTP Transport Layer (RFC 9110 Integration)

When bridging X402-TSWP over web protocols (e.g., in REST or Model Context Protocol JSON-RPC endpoints), the protocol defines three standard HTTP headers:

### 6.1 Server Challenge (`402 Payment Required`)
```http
HTTP/1.1 402 Payment Required
WWW-Authenticate: X402-TSWP type="G",
                            challenge="827da995-adda-4dd7-9fb5-d05338526873",
                            rails="solana,xrpl",
                            amount="160",
                            unit="drops",
                            recipient="rKmtCQXuZpXWgb7KiwKbiQwJeX6AtbpMtC",
                            memo-grammar="X402G:827da995-adda-4dd7-9fb5-d05338526873",
                            expires="1789860818"
```

### 6.2 Client Payment Proof Header
```http
GET /mcp/tools/execute HTTP/1.1
Host: gateway.synapticchain.xyz
Authorization: X402-TSWP rail="solana-devnet",
                         tx="4uQ7T...8kL",
                         type="L",
                         memo="X402L:151:1789860218:806384975"
```

### 6.3 Settlement Confirmation Receipt
```http
HTTP/1.1 200 OK
X402-Receipt: rail="solana-devnet",
              leaf="a161f58503615516e4a7aa678f19a7dc67ab6ef76b236f2d712a54ed80a6d331",
              status="settled",
              balance-remaining="42"
```

---

## 7. Extensibility & Future Reserved Discriminators

The single-character type namespace reserves future institutional capabilities:

| Tag | Proposed Title | Function |
|---|---|---|
| **`X402Q`** | Post-Quantum Attestation | Binds Winternitz One-Time Signatures (WOTS+) leaf hashes (`X402Q:<epoch>:<leaf_hash>`) for quantum-resistant settlement. |
| **`X402K`** | Sanctions & KYC Leaf | Embeds SIMD Merkle Bloom filter zero-knowledge membership roots (`X402K:<merkle_root>`). |
| **`X402A`** | Cross-Rail Atomic Swap | Coordinates multi-chain hash-time-lock escrow synchronization (`X402A:<swap_id>:<secret_hash>`). |

---

## 8. Security Considerations

1. **Replay Defense:** Every `X402G` challenge contains a 128-bit UUIDv4 nonce tracked in the clearinghouse state. Used nonces transition to `Settled` or `Expired` and are rejected if re-presented.
2. **Double-Spend Elimination via Monotonic Deduction:** Bonded sessions (`X402B`) record sequential call counters (`call_seq`). Out-of-order or duplicate indices are rejected on-chain.
3. **Mantis Invariant 9 Solvency:** Netting settlements (`X402W`) require strict mathematical balance across the matrix:
   $$\sum \text{Debits} \equiv \sum \text{Credits} \quad (\Delta = 0)$$
   Custodians cannot release creditor payouts if debtor obligations are uncollected.
4. **Fail-Closed Deserialization:** Trailing characters, space padding, or case deviations result in immediate transaction reversal.

---

## 9. Reference Test Vectors

```
Test Vector 1 (Valid Gateway Challenge):
Input:    Type='G', Challenge='827da995-adda-4dd7-9fb5-d05338526873'
Output:   b"X402G:827da995-adda-4dd7-9fb5-d05338526873" (42 bytes)
Verdict:  PASS

Test Vector 2 (Valid Solana Lane Memo):
Input:    Type='L', Lane=151, Window=1789860218, Nonce=806384975
Output:   b"X402L:151:1789860218:806384975" (30 bytes)
Verdict:  PASS

Test Vector 3 (Leading Zero Rejection):
Input:    Type='L', Lane=0151, Window=1789860218, Nonce=806384975
Output:   b"X402L:0151:1789860218:806384975"
Verdict:  REJECT (Code 0x06: Non-canonical decimal representation)

Test Vector 4 (Single-Digit Zero Representation):
Input:    Type='L', Lane=0, Window=1, Nonce=0
Output:   b"X402L:0:1:0" (11 bytes)
Verdict:  PASS (Zero must be formatted as '0', never empty or '00')
```
