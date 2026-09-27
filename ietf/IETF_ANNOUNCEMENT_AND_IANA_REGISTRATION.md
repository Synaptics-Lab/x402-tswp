# IETF HTTP-WG Announcement & IANA Early Header Registration

```
Document:       IETF-ANNOUNCEMENT-X402-TSWP
Specification:  draft-shabazz-http-x402-tswp-00
Title:          The X402 Typed Settlement Wire Protocol (X402-TSWP)
Author:         Abdul Shabazz <veritasvaultone@gmail.com> (Synaptics Lab)
Datatracker:    https://datatracker.ietf.org/doc/draft-shabazz-http-x402-tswp/
```

---

## 1. IETF HTTP Working Group (HTTPBIS) Announcement Email

**To:** `ietf-http-wg@w3.org`, `dispatch@ietf.org`  
**Subject:** `[New Internet-Draft] draft-shabazz-http-x402-tswp-00: The X402 Typed Settlement Wire Protocol`

```text
Dear HTTP Working Group and Dispatch participants,

We have published an initial individual Internet-Draft specifying the X402 Typed Settlement Wire Protocol (X402-TSWP), an application-layer extension to Hypertext Transfer Protocol status code 402 (Payment Required).

Document URL:
https://datatracker.ietf.org/doc/draft-shabazz-http-x402-tswp/

HTMLized Version:
https://datatracker.ietf.org/doc/html/draft-shabazz-http-x402-tswp

Abstract:
This document specifies machine-to-machine challenge-response headers, deterministic payment fulfillment schemas, and structured error responses for HTTP 402. It introduces a typed operational grammar (X402<Type>:<Payload>) that eliminates fragile regex parsing by utilizing byte-exact token preimages verifiable natively across parallel distributed ledgers (such as Solana and the XRP Ledger) and off-chain execution environments.

We welcome feedback, review, and comments from the Working Group regarding the header definitions, security considerations, and alignment with RFC 9110.

Best regards,
Abdul Shabazz
Synaptics Lab
veritasvaultone@gmail.com
```

---

## 2. IANA Provisional Message Header Field Registration

Per RFC 3864 (Registration Procedures for Message Header Fields), this template requests provisional entry in the **Message Header Fields** registry:

### 2.1 Header Field: `X-402-Challenge`
- **Header field name:** `X-402-Challenge`
- **Applicable protocol:** `http`
- **Status:** `provisional`
- **Author/Change controller:** Abdul Shabazz <veritasvaultone@gmail.com>
- **Specification document(s):** draft-shabazz-http-x402-tswp-00 (§3.2.1)
- **Related information:** Issued by servers in HTTP 402 responses containing an ephemeral RFC 4122 UUIDv4 token for M2M payment gating.

### 2.2 Header Field: `X-402-Payment`
- **Header field name:** `X-402-Payment`
- **Applicable protocol:** `http`
- **Status:** `provisional`
- **Author/Change controller:** Abdul Shabazz <veritasvaultone@gmail.com>
- **Specification document(s):** draft-shabazz-http-x402-tswp-00 (§3.2.2)
- **Related information:** Provided by clients in subsequent HTTP requests carrying proof-of-settlement (ledger transaction hash and challenge token preimage).

### 2.3 Header Field: `X-402-Receipt`
- **Header field name:** `X-402-Receipt`
- **Applicable protocol:** `http`
- **Status:** `provisional`
- **Author/Change controller:** Abdul Shabazz <veritasvaultone@gmail.com>
- **Specification document(s):** draft-shabazz-http-x402-tswp-00 (§3.2.3)
- **Related information:** Issued by servers in HTTP 200 responses returning an immutable settlement confirmation hash.

---

## 3. IANA Application-Layer Protocol Negotiation (ALPN) Protocol ID Registration

Per RFC 7301 § 6 (Transport Layer Security (TLS) Application-Layer Protocol Negotiation Extension), this section establishes the formal registration template for the **Application-Layer Protocol Negotiation (ALPN) Protocol IDs** registry under the Expert Review policy:

### 3.1 ALPN Protocol ID: `x402`
- **Protocol:** `x402` (The X402 Typed Settlement Wire Protocol over TLS)
- **Identification Sequence:** `0x78 0x34 0x30 0x32` (`"x402"`)
- **Specification:** `draft-shabazz-http-x402-tswp-00`
- **Contact:** Abdul Shabazz <veritasvaultone@gmail.com> (Synaptics Lab)
- **Description:** Direct application-layer negotiation of payment-gated wire framing over TLS 1.3 / QUIC for autonomous agents and MCP enclaves, eliminating HTTP round-trip negotiation latency and enabling zero-RTT challenge pre-flighting.

### 3.2 ALPN Protocol ID: `tswp`
- **Protocol:** `tswp` (Typed Settlement Wire Protocol)
- **Identification Sequence:** `0x74 0x73 0x77 0x70` (`"tswp"`)
- **Specification:** `draft-shabazz-http-x402-tswp-00`
- **Contact:** Abdul Shabazz <veritasvaultone@gmail.com> (Synaptics Lab)
- **Description:** Dedicated peer-to-peer, clearinghouse, and enclave settlement wire framing for ISO 20022 UETR direct clearing over TLS.

