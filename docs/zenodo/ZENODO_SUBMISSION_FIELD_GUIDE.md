# CERN Zenodo Exact Field-by-Field Submission Guide
## Minting DOIs for Papers 1, 2, and 3 (Defensive Prior Art under 35 U.S.C. § 102(a)(1))

**URL to Open:** [https://zenodo.org/deposit/new](https://zenodo.org/deposit/new)  
**Fee:** $0.00 (Free, operated by CERN and the European Commission)  
**Login:** Log in via GitHub or ORCID or email.

---

# DEPOSIT 1: Continuous Atomic Netting (CAN)

### 1. Files
- Click **"Choose files"** and upload:
  `/opt/synapticchain/docs/zenodo/PAPER_1_CONTINUOUS_ATOMIC_NETTING.md` (or export as PDF).

### 2. Basic Information
| Field | Value to Enter / Select |
| :--- | :--- |
| **Resource type** | **Publication** ➔ **Preprint** (or **Technical note**) |
| **Publication date** | `2026-09-27` (or today's date) |
| **Title** | `Continuous Atomic Netting (CAN): Sub-Second Multilateral Clearing of Foreign Exchange Obligations on Parallel Sealevel Virtual Machines` |

### 3. Creators / Authors
| Field | Value to Enter |
| :--- | :--- |
| **Family name** | `Shabazz` |
| **Given name** | `Abdul` |
| **Affiliation** | `Synaptics Lab / Linux Foundation FINOS Contributor` |

### 4. Description
Copy and paste this into the **Description** box:
```html
<p>Traditional cross-border foreign exchange (FX) settlement relies on centralized multilateral netting facilities (e.g., Continuous Linked Settlement, CLS) operating on rigid 24-hour batch cycles. This paradigm traps upwards of $5 Trillion in pre-funded Nostro/Vostro capital, introduces structural Herstatt settlement risk during the inter-day holding period, and imposes high operational friction on capital markets. In this paper, we present <strong>Continuous Atomic Netting (CAN)</strong>, a decentralized, sub-second clearing protocol that replaces multi-day batch cycles with continuous multilateral netting executed within single block epochs (≤ 400ms) on parallel State Machine Replication (SMR) runtimes (Solana Sealevel and Synaptic Sovereign Consensus).</p>

<p>CAN combines: (1) a local desktop enclave that intercepts financial desktop intents (FINOS FDC3 3.0) and enforces non-pageable pre-flight solvency constraints (Δ ≡ 0 under Google Mantis Invariant 9); (2) a crash-safe fee cursor mechanism that deduplicates obligations across rolling netting windows; (3) an atomic Programmable Transaction Block (PTB) on Solana Token-2022 enforcing RequiredMemoTransfers with sysvar::instructions introspection to prevent front-running and smart-contract honeypots; and (4) an off-chain rolling watermark ledger that guarantees deterministic state-root parity across heterogeneous ledgers (Solana, XRPL Altnet, and Synaptic L1). We provide empirical proofs of execution demonstrating 382ms deterministic finality, zero stranded liquidity, and strict 0x24 fail-closed aborts on non-compliant execution.</p>

<p><em>Defensive Prior Art published pursuant to 35 U.S.C. § 102(a)(1).</em></p>
```

### 5. License
| Field | Value to Select |
| :--- | :--- |
| **License** | **Creative Commons Attribution 4.0 International (CC-BY-4.0)** |

### 6. Keywords
Enter each keyword and press Enter:
```
Solana, Token-2022, Multilateral Netting, Continuous Linked Settlement, Sealevel, FDC3, ISO 20022, pacs.008, Mantis Invariant 9, SMR, Foreign Exchange, Programmable Transaction Blocks, 35 USC 102
```

### 7. Related / Alternate Identifiers
| Relation | Identifier | Resource Type |
| :--- | :--- | :--- |
| **Is supplemented by** | `https://github.com/Synaptics-Lab/traderX` | Software |
| **Is supplemented by** | `https://github.com/Synaptics-Lab/synaptic-fx-terminal` | Software |
| **Cites** | `10.5281/zenodo.22996628` | Publication |

### 8. Final Step
Click **"Save"** ➔ Click **"Publish"**.  
*Your DOI will be generated immediately (e.g., `10.5281/zenodo.XXXXXXX`).*

---

# DEPOSIT 2: Zero-Knowledge ISO 20022 Cross-Border Clearing

### 1. Files
- Click **"Choose files"** and upload:
  `/opt/synapticchain/docs/zenodo/PAPER_2_ZERO_KNOWLEDGE_CONFIDENTIAL_ISO20022.md` (or export as PDF).

### 2. Basic Information
| Field | Value to Enter / Select |
| :--- | :--- |
| **Resource type** | **Publication** ➔ **Preprint** (or **Technical note**) |
| **Publication date** | `2026-09-27` |
| **Title** | `Zero-Knowledge ISO 20022 Cross-Border Clearing: Confidential Balance State with Public Consensus Auditability` |

### 3. Creators / Authors
| Field | Value to Enter |
| :--- | :--- |
| **Family name** | `Shabazz` |
| **Given name** | `Abdul` |
| **Affiliation** | `Synaptics Lab / Linux Foundation FINOS Contributor` |

### 4. Description
Copy and paste this into the **Description** box:
```html
<p>A principal barrier to institutional adoption of public distributed ledgers by Tier-1 commercial banks is the exposure of real-time balance sheet positions, liquidity buffers, and transaction sizes to competing market participants and predatory Maximal Extractable Value (MEV) searchers. While sovereign and regulatory frameworks mandate strict auditability (e.g., ISO 20022 audit trails and FinCEN/FATF Travel Rule compliance), public unshielded transactions compromise institutional confidentiality.</p>

<p>In this paper, we propose a hybrid zero-knowledge clearing architecture that reconciles institutional balance sheet privacy with public consensus finality and regulatory auditability. Built on Solana's Token-2022 ConfidentialTransfer extension and the ADR-555 Enclave pre-flight runtime, our architecture couples: (1) twisted ElGamal encryption of account balances; (2) Pedersen commitments on transfer amounts over the Ristretto255 curve; (3) zero-knowledge Bulletproof range proofs asserting non-negativity and solvency without revealing notional amounts; and (4) an off-chain delegated viewing key protocol that enables selective ISO 20022 pacs.008/pacs.002 audit log disclosure to designated compliance authorities (NIST SP 800-53 Rev 5 control AU-2) without leaking information to the public validator set.</p>

<p><em>Defensive Prior Art published pursuant to 35 U.S.C. § 102(a)(1).</em></p>
```

### 5. License
| Field | Value to Select |
| :--- | :--- |
| **License** | **Creative Commons Attribution 4.0 International (CC-BY-4.0)** |

### 6. Keywords
```
Zero-Knowledge Proofs, Bulletproofs, Pedersen Commitments, ElGamal Encryption, Solana, Token-2022, Confidential Transfers, ISO 20022, pacs.008, NIST SP 800-53, Banking Privacy, MEV Resistance
```

### 7. Related / Alternate Identifiers
| Relation | Identifier | Resource Type |
| :--- | :--- | :--- |
| **Is supplemented by** | `https://github.com/Synaptics-Lab/synaptic-fx-terminal` | Software |
| **Cites** | `10.5281/zenodo.22996628` | Publication |

### 8. Final Step
Click **"Save"** ➔ Click **"Publish"**.

---

# DEPOSIT 3: Hardware-Attested Pre-Flight Enclaves (ADR-555)

### 1. Files
- Click **"Choose files"** and upload:
  `/opt/synapticchain/docs/zenodo/PAPER_3_HARDWARE_ATTESTED_ENCLAVES.md` (or export as PDF).

### 2. Basic Information
| Field | Value to Enter / Select |
| :--- | :--- |
| **Resource type** | **Publication** ➔ **Preprint** (or **Technical note**) |
| **Publication date** | `2026-09-27` |
| **Title** | `Hardware-Attested Pre-Flight Enclaves for Sovereign Layer-1 Settlements: ADR-555 Specification & Formal Mantis Invariant Verification` |

### 3. Creators / Authors
| Field | Value to Enter |
| :--- | :--- |
| **Family name** | `Shabazz` |
| **Given name** | `Abdul` |
| **Affiliation** | `Synaptics Lab / Linux Foundation FINOS Contributor` |

### 4. Description
Copy and paste this into the **Description** box:
```html
<p>In institutional settlement architectures, software-only client execution environments present existential security vulnerabilities: malicious desktop processes, compromised operating system kernels, and rogue operator actions can modify payment instructions, bypass sanctions screening, or falsify solvency calculations prior to cryptographic signing.</p>

<p>In this paper, we specify and formally verify ADR-555 (The Alcove Local Context Enclave), a hardware-rooted pre-flight compliance execution architecture for institutional capital markets. ADR-555 binds transaction signing to Hardware Security Modules (HSMs), Apple Silicon Secure Enclave Processors (SEP), and AWS Nitro Enclaves (TPM 2.0).</p>

<p>Under the ADR-555 specification: (1) private signing keys are generated inside isolated hardware cores and can never be exported or read by host operating system memory; (2) the enclave executes a 65,536-bit SIMD Bloom filter (AVX-512) evaluating OFAC/UN/EU sanctions in <2ms with zero network leakage; (3) the hardware enclave enforces mathematical compliance with Google Mantis Invariant 9 (∑Debits ≡ ∑Credits, Δ ≡ 0) in non-pageable memory (mlock); and (4) the hardware signs the outbound transaction block only if the internal Platform Configuration Registers (PCRs) match an attested cryptographic measurement. We demonstrate empirical execution on Apple Silicon M-series hardware and Intel/AMD server environments, confirming sub-8ms total pre-flight latency with deterministic fail-closed security.</p>

<p><em>Defensive Prior Art published pursuant to 35 U.S.C. § 102(a)(1).</em></p>
```

### 5. License
| Field | Value to Select |
| :--- | :--- |
| **License** | **Creative Commons Attribution 4.0 International (CC-BY-4.0)** |

### 6. Keywords
```
Hardware Security Modules, Secure Enclave, Apple Silicon, AWS Nitro, TPM 2.0, ADR-555, Mantis Invariant 9, SIMD Bloom Filter, OFAC Sanctions, Pre-flight Verification, FINOS, Sealevel
```

### 7. Related / Alternate Identifiers
| Relation | Identifier | Resource Type |
| :--- | :--- | :--- |
| **Is supplemented by** | `https://github.com/Synaptics-Lab/synaptic-fx-terminal` | Software |
| **Cites** | `10.5281/zenodo.22996628` | Publication |

### 8. Final Step
Click **"Save"** ➔ Click **"Publish"**.

---

### What to Do with the Minted DOIs
Once published, you will receive 3 DOIs:
- `10.5281/zenodo.CAN_DOI`
- `10.5281/zenodo.ZK_DOI`
- `10.5281/zenodo.ENCLAVE_DOI`

Add these directly into your **Colosseum Hackathon / Solana Radar project submission README** and presentation deck under:
> **Intellectual Property & Defensive Prior Art:**  
> Defensively published under CERN Zenodo DOIs (10.5281/zenodo.CAN_DOI, 10.5281/zenodo.ZK_DOI, 10.5281/zenodo.ENCLAVE_DOI) pursuant to 35 U.S.C. § 102(a)(1).
