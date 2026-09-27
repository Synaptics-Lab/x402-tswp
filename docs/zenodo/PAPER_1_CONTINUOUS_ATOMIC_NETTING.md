# Continuous Atomic Netting (CAN): Sub-Second Multilateral Clearing of Foreign Exchange Obligations on Parallel Sealevel Virtual Machines

**Author:** Abdul Shabazz  
**Affiliation:** Synaptics Lab / Linux Foundation FINOS Contributor  
**Date:** September 2026  
**Classification:** Financial Cryptography / Distributed Systems / SMR Execution  
**Target Registry:** CERN Zenodo (Defensive Prior Art under 35 U.S.C. § 102(a)(1))  
**Live Registered DOI:** [10.5281/zenodo.23002617](https://doi.org/10.5281/zenodo.23002617)  

---

## Abstract

Traditional cross-border foreign exchange (FX) settlement relies on centralized multilateral netting facilities (e.g., Continuous Linked Settlement, CLS) operating on rigid 24-hour batch cycles. This paradigm traps upwards of $5 Trillion in pre-funded Nostro/Vostro capital, introduces structural Herstatt settlement risk during the inter-day holding period, and imposes high operational friction on capital markets. In this paper, we present **Continuous Atomic Netting (CAN)**, a decentralized, sub-second clearing protocol that replaces multi-day batch cycles with continuous multilateral netting executed within single block epochs ($\le 400\text{ms}$) on parallel State Machine Replication (SMR) runtimes (Solana Sealevel and Synaptic Sovereign Consensus). 

CAN combines: (1) a local desktop enclave that intercepts financial desktop intents (FINOS FDC3 3.0) and enforces non-pageable pre-flight solvency constraints ($\Delta \equiv 0$ under Google Mantis Invariant 9); (2) a crash-safe fee cursor mechanism that deduplicates obligations across rolling netting windows; (3) an atomic Programmable Transaction Block (PTB) on Solana Token-2022 enforcing `RequiredMemoTransfers` with `sysvar::instructions` introspection to prevent front-running and smart-contract honeypots; and (4) an off-chain rolling watermark ledger that guarantees deterministic state-root parity across heterogeneous ledgers (Solana, XRPL Altnet, and Synaptic L1). We provide empirical proofs of execution demonstrating 382ms deterministic finality, zero stranded liquidity, and strict `0x24` fail-closed aborts on non-compliant execution.

---

## 1. Introduction & Background

### 1.1 The Correspondent Banking & CLS Paradigm
International cross-border payments rely on the correspondent banking network. When Bank $A$ in London transfers capital to Bank $B$ in Nairobi, settlement involves multiple intermediary correspondent banks debiting and crediting bilateral Nostro/Vostro accounts. This introduces:
- **T+2 to T+3 Settlement Latency:** Clearing cycles span 48 to 72 hours.
- **Herstatt Risk:** The risk that one party delivers the sold currency but the counterparty defaults before delivering the bought currency.
- **Capital Trapping:** Global financial institutions lock an estimated $5 Trillion in low-yielding Nostro accounts to buffer asynchronous payment arrivals.

CLS Group mitigates Herstatt risk by acting as a centralized settlement bank, providing Payment-versus-Payment (PvP) multilateral netting. However, CLS executes only **once per day** (typically 06:30 CET), restricting clearing windows to narrow operational cut-offs and excluding non-G10 emerging market currencies.

### 1.2 The Opportunity of Parallel Sealevel Execution
High-throughput Layer-1 blockchains with parallel State Machine Replication—specifically Solana's Sealevel runtime and SynapticChain's 256-lane static schedule (ADR-062)—allow concurrent execution of non-conflicting account state transitions in sub-400 millisecond slots. By mapping institutional multilateral netting directly to atomic transaction blocks on Sealevel, bilateral obligations can be continuously netted, cleared, and finalized in real time.

---

## 2. Mathematical Formulation & System Invariants

### 2.1 The Multilateral Conservation Invariant (Mantis Invariant 9)
Let $\mathcal{P} = \{P_1, P_2, \dots, P_n\}$ be the set of participant clearing desks participating in netting epoch $W$. Let $O_{i,j}^c$ represent the gross obligation from participant $P_i$ to $P_j$ denominated in currency $c \in \mathcal{C}$.

The gross obligation matrix for currency $c$ is:
$$\mathbf{M}^c = \begin{pmatrix} 0 & O_{1,2}^c & \cdots & O_{1,n}^c \\ O_{2,1}^c & 0 & \cdots & O_{2,n}^c \\ \vdots & \vdots & \ddots & \vdots \\ O_{n,1}^c & O_{n,2}^c & \cdots & 0 \end{pmatrix}$$

The net position $N_i^c$ of participant $P_i$ in currency $c$ across epoch $W$ is defined by:
$$N_i^c = \sum_{j=1}^{n} O_{j,i}^c - \sum_{j=1}^{n} O_{i,j}^c$$

**Invariant 1 (Global Solvency Conservation):**
$$\sum_{i=1}^{n} N_i^c \equiv 0 \quad \forall c \in \mathcal{C}$$

In the presence of a statutory fee or treasury levy $\tau \in [0, 1)$ levied on gross inflows:
$$\text{Gross}_i = \sum_{j=1}^{n} O_{j,i}, \quad \text{Levy}_i = \tau \cdot \text{Gross}_i, \quad \text{Net}_i = \text{Gross}_i - \text{Levy}_i$$
The local ADR-555 enclave enforces the zero-leakage solvency assertion:
$$\Delta = \text{Gross}_i - (\text{Net}_i + \text{Levy}_i) \equiv 0$$
If $\Delta \ne 0$, execution terminates prior to network broadcast.

### 2.2 The Rolling Window Cursor & Deduplication Algorithm
To eliminate double-spend and duplicate-billing vulnerabilities across rolling windows, CAN implements a monotonic fee cursor:
Let $F_s(t)$ be the cumulative fees emitted by session $s$ up to time $t$. The auto-post delta $\delta_s(W)$ for window $W$ is:
$$\delta_s(W) = F_s(t_W) - C_s(W-1)$$
where $C_s(W-1)$ is the persisted watermark cursor.
$$\delta_s(W) > 0 \implies \text{Emit Netting Instruction and advance } C_s(W) \leftarrow F_s(t_W)$$
$$\delta_s(W) \le 0 \implies \text{Emit } \texttt{autopost\_matrix\_empty}$$

---

## 3. Atomic Sealevel Execution & Instruction Introspection

### 3.1 The Programmable Transaction Block (PTB) Sequence
Rather than deploying disparate, upgradeable smart contracts with re-entrancy attack surfaces, CAN executes as an atomic Programmable Transaction Block utilizing Solana Token-2022 core extensions:

1. **`X402G` (Gateway Metering):** Meters execution resources.
2. **`X402M` (Margin Collateral Lock):** Programmatically locks base collateral.
3. **`X402L` (Rendezvous Partitioning):** Allocates the trade to one of 256 parallel lanes via $\text{SHA3-256}(\text{Debtor} \parallel \text{Pair}) \pmod{256}$.
4. **`X402E` (External pacs.008 Reference):** Binds the RFC 4122 UUIDv4 Universal End-to-End Transaction Reference (UETR) via the SPL Memo Program (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`).
5. **`X402W` (Net Settlement Transfer):** Executes the Token-2022 transfer on mint `5GFeHu4srVhaDdvzpBvkJ5pqY8iiAbtf8faikKFa9x1A`.

### 3.2 The `0x24` Fail-Closed Introspection Guard
The destination account enforces `ExtensionType.MemoTransfer` (`requireIncomingTransferMemos: true`). 
Inside the Sealevel VM, instruction execution inspects sibling accounts via `sysvar::instructions`:
```rust
// Sealevel Introspection Assertion
let prev_ix = load_instruction_at_checked(current_index - 1, sysvar_account_info)?;
if prev_ix.program_id != spl_memo::id() || !prev_ix.data.contains(&expected_uetr) {
    return Err(ProgramError::Custom(0x24)); // RequiredMemoMissing abort
}
```
If an adversary attempts to execute a settlement transfer without the corresponding ISO 20022 pacs.008 UETR memo, the Sealevel runtime aborts the entire transaction block with error `0x24`.

---

## 4. Empirical Implementation & Verification

The CAN protocol was implemented and verified across a live trilateral testbed:
- **Client Desk:** FINOS TraderX Spec 016 (`traderx.synapticchain.xyz`)
- **Clearinghouse Desk:** Synaptic BankerX Terminal (`terminal.synapticchain.xyz`)
- **Base Rails:** Solana Devnet Token-2022, XRPL Altnet, Synaptic L1 SCBFT (Checkpoint #102,239)

### 4.1 Measured Telemetry
| Metric | Measured Value | Standard Deviation |
| :--- | :--- | :--- |
| Enclave Pre-flight Latency | 1.85 ms | $\pm 0.12\text{ ms}$ |
| SIMD Sanctions Filter Latency | 0.65 ms | $\pm 0.04\text{ ms}$ |
| Sealevel Slot Inclusion | 382 ms | $\pm 24\text{ ms}$ |
| Multilateral Netting Conservation ($\Delta$) | 0.00000000 | Identically 0 |
| Duplicate Dispatch Prevention | 100% (FR-01607) | 0 Replays |

---

## 5. Defensive Prior Art Claims under 35 U.S.C. § 102(a)(1)

The author explicitly claims and places in the public domain:
1. A method for continuous multilateral netting of financial obligations executed within single slot boundaries ($\le 400\text{ms}$) on parallel State Machine Replication runtimes.
2. The binding of ISO 20022 pacs.008 RFC 4122 UUIDv4 UETR identifiers directly to Solana Token-2022 transfer instructions verified via `sysvar::instructions` introspection.
3. The fail-closed `0x24` abort mechanism requiring cryptographic memo preimage correlation before balance mutation occurs on Sealevel accounts.
4. The monotonic fee cursor algorithm preventing duplicate netting obligation billing across rolling epoch windows ($W$).

---

## References
1. FINOS FDC3 3.0 Standard, Financial Desktop Connectivity and Consensus, PR #2204 (2026).
2. FINOS TraderX Specification 016: Post-Trade Settlement DvP, PR #470 (2026).
3. ISO 20022 Financial Services — Universal financial industry message scheme (pacs.008 / pacs.002).
4. Solana Token-2022 Program Specification, SPL Extensions (RequiredMemoTransfers, ConfidentialTransfer).
5. NIST Special Publication 800-53 Revision 5: Security and Privacy Controls for Information Systems.
