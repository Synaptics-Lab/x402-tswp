# SEP-0000: Payment-Gated Tool Execution & Challenge Protocol Extension (MCP-402)

- **Status**: Draft
- **Type**: Extensions Track
- **Created**: 2026-09-26
- **Author(s)**: Abdul Shabazz (@veritasvaultone, Synaptics Lab) <veritasvaultone@gmail.com>
- **Sponsor**: None
- **PR**: https://github.com/modelcontextprotocol/modelcontextprotocol/pull/0000
- **Related Specs**: IETF draft-shabazz-http-x402-tswp-00; Solana SIMD PR #671; Zenodo DOI 10.5281/zenodo.22979715

---

## Abstract

This Specification Enhancement Proposal defines **MCP-402**, an Extensions Track standard for the Model Context Protocol (MCP) that introduces native payment capability negotiation, payment challenge error handling (JSON-RPC error code `402`), and cryptographic proof-of-settlement validation for machine-to-machine (M2M) tool execution. 

MCP-402 enables autonomous AI agents to discover commercial tool pricing, negotiate settlement terms across public multi-rail ledgers (including Solana and XRPL) or HTTP 402 endpoints, and deliver verified settlement receipts without relying on out-of-band subscription keys or centralized payment aggregators.

---

## Motivation

The Model Context Protocol currently standardizes JSON-RPC transport for Prompts, Resources, and Tools. However, as autonomous AI agents interact with external commercial services—such as high-value computational simulations, financial data streams, or institutional execution gateways—the absence of a native payment negotiation layer creates severe operational limitations:

1. **Out-of-Band Key Management:** Existing MCP tools require human operators to manually provision and configure proprietary API keys, breaking end-to-end agent autonomy.
2. **Absence of In-Band Metering:** Servers have no protocol-compliant mechanism to signal credit exhaustion, per-invocation pricing, or replenishment challenges within the standard JSON-RPC exchange.
3. **No Verifiable Settlement Grammar:** Clients lack a standardized channel to provide cryptographic evidence (such as on-chain transaction hashes with challenge preimages) that an invocation fee has been fulfilled.

MCP-402 resolves these deficiencies by embedding the typed wire protocol of IETF `X402-TSWP` directly into the MCP lifecycle.

---

## Specification

### 1. Capability Negotiation (`initialize`)

During the `initialize` handshake, clients and servers declare payment negotiation capabilities under `capabilities.payments`.

#### Client Initialization Request:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "roots": { "listChanged": true },
      "sampling": {},
      "payments": {
        "schemes": ["x402"],
        "supportedRails": ["solana-devnet", "solana-mainnet", "xrpl-altnet", "xrpl-mainnet"]
      }
    },
    "clientInfo": {
      "name": "SynapticTraderAgent",
      "version": "1.0.0"
    }
  }
}
```

#### Server Initialization Response:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": { "listChanged": true },
      "payments": {
        "schemes": ["x402"],
        "memoGrammar": "X402G:<challenge>",
        "defaultCurrency": "drops"
      }
    },
    "serverInfo": {
      "name": "SynapticClearingGateway",
      "version": "1.0.0"
    }
  }
}
```

---

### 2. Tool Discovery with Pricing Metadata (`tools/list`)

Servers MAY declare pricing parameters for individual tools inside the tool definition schema:

```json
{
  "name": "fx_corridor_settle",
  "description": "Executes atomic foreign exchange settlement on Solana Token-2022.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "corridor": { "type": "string" },
      "gross": { "type": "number" }
    },
    "required": ["corridor", "gross"]
  },
  "pricing": {
    "scheme": "x402",
    "pricePerCall": "160",
    "unit": "drops",
    "supportedRails": ["solana-devnet", "xrpl-altnet"]
  }
}
```

---

### 3. Payment Required Challenge Error (Code `402`)

When a client invokes a tool requiring payment without sufficient pre-funded credits or active session bonds, the server MUST reject the call with JSON-RPC error code `402`:

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "error": {
    "code": 402,
    "message": "Payment Required",
    "data": {
      "scheme": "x402",
      "challenge": "827da995-adda-4dd7-9fb5-d05338526873",
      "price": "160",
      "unit": "drops",
      "recipient": "rKmtCQXuZpXWgb7KiwKbiQwJeX6AtbpMtC",
      "memo": "X402G:827da995-adda-4dd7-9fb5-d05338526873",
      "expiresAt": 1789860818,
      "rails": [
        {
          "rail": "xrpl-altnet",
          "recipient": "rKmtCQXuZpXWgb7KiwKbiQwJeX6AtbpMtC",
          "amount": "160"
        },
        {
          "rail": "solana-devnet",
          "recipient": "BnuCTFWFLLXnSPv2Frs42royiTAYG87WP7p1zRLB4ksG",
          "amount": "1000",
          "unit": "lamports"
        }
      ]
    }
  }
}
```

---

### 4. Execution Retry with Payment Proof (`tools/call`)

The client broadcasts the transaction on the selected rail containing the exact challenge memo (`X402G:<challenge>`) and retries the `tools/call` invocation, populating the proof in `_meta.payment`:

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "fx_corridor_settle",
    "arguments": {
      "corridor": "USD/KES",
      "gross": 2500000
    },
    "_meta": {
      "payment": {
        "scheme": "x402",
        "rail": "solana-devnet",
        "tx": "5wK1ScvH34rK7Q8Z9pL...",
        "challenge": "827da995-adda-4dd7-9fb5-d05338526873"
      }
    }
  }
}
```

---

### 5. Execution Receipt Response

Upon verifying that the on-chain payment matches the challenge amount and preimage, the server completes the tool invocation and returns an immutable receipt in `_meta.receipt`:

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Settlement of $2,500,000 USD/KES committed on Solana Devnet. Tx: 4uQ7T...8kL"
      }
    ],
    "_meta": {
      "receipt": {
        "scheme": "x402",
        "rail": "solana-devnet",
        "leaf": "a161f58503615516e4a7aa678f19a7dc67ab6ef76b236f2d712a54ed80a6d331",
        "creditsRemaining": 85
      }
    }
  }
}
```

---

## Rationale

- **JSON-RPC Error Code 402:** Using HTTP status code 402 semantics within JSON-RPC error codes preserves standard client intuition without inventing custom error structures.
- **Inclusion in `_meta`:** Placing proof tokens in `_meta` prevents breaking existing `tools/call` input schemas, keeping tool argument types clean and unmodified.
- **Multi-Rail Agnosticism:** Rather than binding exclusively to one cryptocurrency network, MCP-402 specifies a transport-agnostic memo preimage (`X402G:<challenge>`), allowing servers to accept Solana SPL tokens, XRPL drops, or fiat-backed stablecoins.

---

## Backward Compatibility

MCP-402 is strictly backward-compatible. Servers and clients that do not declare `capabilities.payments` simply omit payment negotiation and operate as standard MCP peers. Unfunded calls on servers without MCP-402 support continue to return standard errors without payment metadata.

---

## Reference Implementation

A live, production reference implementation of the MCP-402 gateway is active in the Synaptic ecosystem:
- **Reference Gateway:** `mcp-402-gateway` listening on port `8405`.
- **IETF Specification:** Standards Track [draft-shabazz-http-x402-tswp-00](https://datatracker.ietf.org/doc/draft-shabazz-http-x402-tswp/).
- **Solana Foundation SIMD:** [Solana SIMD PR #671](https://github.com/solana-foundation/solana-improvement-documents/pull/671).
- **Prior Art Registration:** Zenodo DOI [10.5281/zenodo.22979715](https://doi.org/10.5281/zenodo.22979715).

---

## Security Implications

1. **Replay Attack Prevention:** Each challenge UUIDv4 is single-use and invalidated immediately upon settlement or expiration.
2. **Byte-Exact Memo Introspection:** Servers enforce exact string matching on the payment memo (`X402G:<challenge>`), preventing frontrunning or trailing byte manipulation.
3. **Double-Spend Mitigation:** The server verifies transaction confirmation on the destination rail prior to executing the requested tool payload.
