# SEP-0001: Asset-Binding Discriminator (X402A) — Issuer-Agnostic Instrument Identification

- **Status**: Draft
- **Type**: Standards Track
- **Created**: 2026-10-07
- **Author(s)**: Abdul Shabazz (@veritasvaultone, Synaptics Lab) <veritasvaultone@gmail.com>
- **Sponsor**: None
- **PR**: https://github.com/Synaptics-Lab/x402-tswp/pull/1
- **Related Specs**: IETF draft-shabazz-http-x402-tswp-01; SEP-0000 (MCP-402, payment-gated tools); integration map (`DISCRIMINATOR_INTEGRATION_MAP.md` §2, X402A row)

---

## Abstract

This proposal registers the fifteenth X402-TSWP discriminator: **`X402A`**, the asset-binding tag. X402A binds a settlement asset *symbol* to its on-chain token *mint identifier* (base58, exactly 32 bytes) and *wire decimals* (0..255, the u8 enforced by SPL Token-2022 `transfer_checked`), giving X402-TSWP memos an issuer-agnostic instrument vocabulary. The inaugural registration is **OUSD** (Open Standard; Token-2022 mainnet mint `ousd2mJsPEckLHcSCDxyKD7NDGARZcfLbDZkKiatYHB`, decimals 6, RPC-verified 2026-10-07).

The tag carries **no economics claims** — only on-chain facts. Issuer control surfaces (freeze, pause, permanent-delegate authorities) are recorded as disclosed data, without judgment.

---

## Motivation

The existing fourteen discriminators identify *flows* (challenges, windows, margins, bonds, nets, lanes, attestations, desk settlements) but say nothing about *which instrument* moves. A composition authority building multi-leg settlement PTBs today must carry mints as opaque strings with no binding to a symbol a human or an ISO 20022 message can name. Consequences:

1. **No instrument identity on the wire.** A pacs.008 frame (X402P) names a UETR and minor units, but the asset is implicit per-rail context — invisible to cross-rail reconciliation.
2. **Mint substitution is undetectable.** A leg that names mint A while the desk believes it is settling instrument B has no wire-level guard.
3. **Unregistered-asset drift.** Nothing distinguishes "asset known to the estate with verified facts" from "arbitrary base58 constant."

X402A closes these: the symbol→mint→decimals triple is validated byte-exactly, drift-checked against the registry, and refuses fail-closed when a registered asset is off the composer's rail.

---

## Specification

### 1. Wire grammar

```
X402A:<asset>:<mint>:<decimals>
      |        |        |
      |        |        +-- decimal field, 0..255, no leading zeros
      |        |            (matches SPL u8 wire decimals)
      |        +----------- base58, decodes to exactly 32 bytes
      |                    (zero-dependency: alphabet check, byte-length
      |                    check, all-'1s' leading-zero edge handled)
      +-------------------- 2–16 chars, uppercase A–Z/alnum, letter-led
                           (ASSET_RE = /^[A-Z][A-Z0-9]{1,15}$/)
```

Byte-exactness: the same fail-closed segment-validation model as the other fifteen tags — 3 segments exactly, `MAX_SEGMENT`/`MAX_TOTAL` respected, no trailing-segment injection.

### 2. Registry (SEP-0001 asset registry — `src/assets.mjs`)

A pure data module (no network, no keys, no I/O). Every row is admitted from measured, chain-verified facts only, and its `evidence` field names the verification. Exports:

- `resolveAsset(name)` — case-insensitive lookup; **throws `unknown_asset` loud** on unknown symbols (never returns null to a composer that then guesses).
- `registeredAssetByMint(mint)` — row or null; used for the raw-mint back-route gate below.

Inaugural row:

| Field | Value |
|---|---|
| asset | `OUSD` |
| issuer | Open Standard (OUSD) — issued by Bridge (a Stripe company) |
| chain | `solana-mainnet` |
| program | `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` (SPL Token-2022) |
| mint | `ousd2mJsPEckLHcSCDxyKD7NDGARZcfLbDZkKiatYHB` |
| decimals | 6 |
| status | `REGISTERED_EXTERNAL_MAINNET` |
| registered | 2026-10-07 |
| evidence | mainnet-beta `getAccountInfo` 2026-10-07: decimals 6; supply 69,811,167.77 OUSD; mintAuthority, freezeAuthority, permanentDelegate authorities on record; extensions [mintCloseAuthority, permanentDelegate, defaultAccountState, confidentialTransferMint, transferHook (programId null), metadataPointer, pausableConfig (paused:false), tokenMetadata] |

**Issuer control-surface disclosure:** the issuer holds freeze + pause + permanent-delegate authorities. The estate records the control facts — this is disclosure, not endorsement.

### 3. Fail-closed rail gate (the executor law)

Composition authorities importing the SSOT MUST refuse an X402A-bound leg **before any bytes are composed** when the asset's registered chain is not the chain that leg will settle on. The reference implementation (`ptb-controller` `netting_settlement`, composition rail Solana DEVNET) enforces this on **both independent paths** so there is no back-route:

1. **Asset-symbol path:** if the leg names `asset` and the registry row's chain is off-rail → `netting_settlement leg N asset_not_on_rail: <symbol> is <status> on <chain> and this composer runs on <rail> — fail-closed before compose (integration-ready, not integrated; external issuance is never blurred)`.
2. **Raw-mint back-route gate:** if the leg names `mint` directly and `registeredAssetByMint(mint)` hits an off-rail row → the same refusal. Passing a registered mainnet mint without its symbol gets no special treatment.
3. **Binding-drift checks:** if a leg names both `asset` and a concrete `mint`/`decimals`, they MUST equal the registry row, else `X402A binding drift` refusal — the wire cannot silently settle mint A under symbol B's name.

All three gates precede `composeFlow`, so `bytes_composed=false` and `money_moved=false` on every refusal.

---

## Measured Receipts (reference implementation, 2026-10-07)

UETRs and blockhashes minted fresh at run time; no testnet/mainnet funds moved.

| Receipt | Result |
|---|---|
| `R0_grammar_asset_binding` | `X402A:OUSD:ousd2mJsPEckLHcSCDxyKD7NDGARZcfLbDZkKiatYHB:6` validates; tag `A`; registry reports 15 tags |
| `R1_asset_not_on_rail` | OUSD leg refused pre-compose (asset-symbol gate); `bytes_composed=false`, `money_moved=false` |
| `R2_mint_side_gate` | OUSD mainnet mint passed raw, refused pre-compose (back-route gate) |
| `R3_control_estate_devnet_leg_composes` | Estate devnet Token-2022 mint composes unchanged — the issuer-agnostic path has no regression |

Full transcript: `ops/OUSD-X402A-INTEGRATION-RECEIPT-2026-10-07.md` in the Synaptics-Lab/Synaptic-Source repository; vector tests in `test/vectors.test.mjs` Suite 8.

---

## Rationale

- **Issuer-agnostic, not issuer-promoting:** the tag defines form, not policy. Any issuer that can be RPC-verified can be registered the same way.
- **Integration-ready, not integrated:** the reference estate settles estate-minted devnet tokens; OUSD is external mainnet issuance, so OUSD legs refuse rather than compose dead transactions. Honesty on the rail boundary is preserved at the wire level.
- **Wire decimals, not UI decimals:** the decimals field is the `transfer_checked`-enforced u8, so an X402A memo is sufficient to build a byte-exact token leg with no external decimal table.
- **Zero dependencies:** the base58 decoder is ~25 lines mirroring the existing `assertBase58Key` semantics; no new packages.

---

## Security Implications

1. **No silent binding drift:** symbol/mint/decimals are cross-checked, so an X402A memo cannot mean two instruments.
2. **Fail-closed off-rail refusal:** registered assets on ledgers the composer does not touch can never produce a dead transaction or blur custody rails.
3. **Control-surface transparency:** freeze/pause/permanent-delegate authorities are recorded in the registry as issuer facts — a settlement counterparty integrating X402A sees the asset's revocation surface, not a marketing page.
4. **Loud unknowns:** unknown asset symbols throw rather than resolve to null guesswork downstream.

---

## Backward Compatibility

Strictly additive: a fifteenth registry tag, a new optional `asset` field on v2 token legs, and one new module. Legs without `asset` behave byte-identically (receipt R3); the registry count assertion in the vector suite moves 14→15. Importers that validate inbound memos accept X402A only after they adopt the new generation of `src/discriminators.mjs`.

---

## Reference Implementation

- SSOT grammar: `src/discriminators.mjs` (tag `A`, validator, `buildAssetBindingMemo`) — byte-exact, zero-dependency ESM.
- Asset registry: `src/assets.mjs` (SEP-0001 rows, OUSD inaugural).
- Executor gates + live composer: composition authority of the SynapticChain estate (`ptb-controller`).
- Integration map: `DISCRIMINATOR_INTEGRATION_MAP.md` §2, `X402A` row.