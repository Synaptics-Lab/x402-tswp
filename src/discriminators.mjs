/**
 * @file discriminators.mjs
 * @description Canonical Typed Source of Truth (SSOT) for X402-TSWP Discriminators & Wire Grammar.
 * Replaces ad-hoc string formatting across gateway.mjs, escrow-server/index.mjs, and colosseum/lib/memos.ts.
 * @author Abdul Shabazz <veritasvaultone@gmail.com>
 * @license Apache-2.0
 */

import assert from 'node:assert/strict';

export const DISCRIMINATOR_TAGS = Object.freeze({
  X402G: 'X402G',   // Gateway Paywall & Metering Challenge
  X402W: 'X402W',   // Netting Window Participant Settlement
  X402M: 'X402M',   // Maker Margin Escrow Creation
  X402MR: 'X402MR', // Margin Return / Release Payment
  X402E: 'X402E',   // Escrow Creation / UETR Correlation
  X402B: 'X402B',   // Bond Collateral Escrow
  X402BN: 'X402BN', // Netted Bond Fee
  X402BR: 'X402BR', // Bond Collateral Release
  X402N: 'X402N',   // Netting Obligation Settlement
  X402L: 'X402L',   // 256-Lane Parametric Watermark Nonce
  X402Z: 'X402Z',   // Zero-Knowledge Confidential Attestation
  X402R: 'X402R',   // Honest-Rejection / Dispute Proof
});

export const ESTATE_STATUS = Object.freeze({
  LIVE_ONCHAIN: 'LIVE_ONCHAIN',       // Live on XRPL altnet and/or Solana devnet with verified tx hashes
  LIVE_GATEWAY: 'LIVE_GATEWAY',       // Live in PM2 reverse proxy gateway (:8402/:8405)
  STANDARDS_TRACK: 'STANDARDS_TRACK', // Formally specified in IETF / SIMD-0671 / Zenodo prior art
});

/**
 * Master Registry of all 12 X402-TSWP Discriminators.
 */
export const DISCRIMINATOR_REGISTRY = Object.freeze({
  X402G: {
    tag: 'X402G',
    name: 'Gateway Challenge',
    status: ESTATE_STATUS.LIVE_ONCHAIN,
    syntax: 'X402G:<challenge-uuid>',
    regex: /^X402G:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    rails: ['xrpl-altnet', 'solana-devnet'],
    service: 'mcp-402-gateway (:8402) / nodes-api',
    description: 'Paywall challenge payment fulfilling per-call micro-fee.',
    liveExample: 'X402G:827da995-adda-4dd7-9fb5-d05338526873',
  },
  X402W: {
    tag: 'X402W',
    name: 'Netting Window Settlement',
    status: ESTATE_STATUS.LIVE_ONCHAIN,
    syntax: 'X402W:<window>:<participant_syn>',
    regex: /^X402W:\d+:syn1[0-9a-z]+$/,
    rails: ['xrpl-altnet', 'solana-devnet'],
    service: 'mcp-402-gateway-escrow (:8405) / clearinghouse.mjs',
    description: 'Net-window movement between debtors and clearing custodian, and custodian to creditors.',
    liveExample: 'X402W:1789811559:syn1eydur8g7d66xeq38mmxvg95h7e6crr2vtunpq8',
  },
  X402M: {
    tag: 'X402M',
    name: 'Maker Margin Escrow',
    status: ESTATE_STATUS.LIVE_ONCHAIN,
    syntax: 'X402M:<corridor>:<maker_syn>',
    regex: /^X402M:[a-zA-Z0-9_-]+:syn1[0-9a-z]+$/,
    rails: ['xrpl-altnet'],
    service: 'mcp-402-gateway / gateway.mjs',
    description: 'Maker margin EscrowCreate locking liquidity for corridor clearing.',
    liveExample: 'X402M:USD-TZS:syn1jh0hy5409y49kzh0uw83d395fcsg5qa7lyy',
  },
  X402MR: {
    tag: 'X402MR',
    name: 'Margin Release',
    status: ESTATE_STATUS.LIVE_GATEWAY,
    syntax: 'X402MR:<corridor>:<maker_syn>',
    regex: /^X402MR:[a-zA-Z0-9_-]+:syn1[0-9a-z]+$/,
    rails: ['xrpl-altnet'],
    service: 'mcp-402-gateway / COLOSSEUM-DATA-CONTRACT §8.2',
    description: 'Margin return payment to maker upon corridor rotation or margin unwind.',
    liveExample: 'X402MR:USD-TZS:syn1jh0hy5409y49kzh0uw83d395fcsg5qa7lyy',
  },
  X402E: {
    tag: 'X402E',
    name: 'Escrow UETR Linkage',
    status: ESTATE_STATUS.LIVE_ONCHAIN,
    syntax: 'X402E:<corridor_id>:<uetr>',
    regex: /^X402E:[a-zA-Z0-9_-]+:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    rails: ['xrpl-altnet'],
    service: 'mcp-402-gateway-escrow (:8405) / clearinghouse.mjs',
    description: 'Binds on-chain escrow creation to ISO 20022 pacs.008 UETR for deterministic settlement.',
    liveExample: 'X402E:cTZS:e6a9972c-29b3-4f9e-a868-b78807d85317',
  },
  X402B: {
    tag: 'X402B',
    name: 'Bond Collateral Escrow',
    status: ESTATE_STATUS.LIVE_ONCHAIN,
    syntax: 'X402B:<session>:<consumer_syn>',
    regex: /^X402B:[a-zA-Z0-9_-]+:syn1[0-9a-z]+$/,
    rails: ['xrpl-altnet'],
    service: 'mcp-402-gateway-escrow (:8405) / escrow-server/index.mjs',
    description: 'Bond collateral escrow deposit securing multi-call API sessions.',
    liveExample: 'X402B:bond-fcf217a2:syn1jh0hy5409y49kzh0uw83d395fcsg5qa7lyy',
  },
  X402BN: {
    tag: 'X402BN',
    name: 'Netted Bond Fee',
    status: ESTATE_STATUS.LIVE_ONCHAIN,
    syntax: 'X402BN:<session>:<consumer_syn>',
    regex: /^X402BN:[a-zA-Z0-9_-]+:syn1[0-9a-z]+$/,
    rails: ['xrpl-altnet', 'solana-devnet'],
    service: 'mcp-402-gateway-escrow (:8405) / escrow-server/index.mjs',
    description: 'Settlement payment for the netted fee consumed across a bond session.',
    liveExample: 'X402BN:bond-fcf217a2:syn1jh0hy5409y49kzh0uw83d395fcsg5qa7lyy',
  },
  X402BR: {
    tag: 'X402BR',
    name: 'Bond Release',
    status: ESTATE_STATUS.LIVE_ONCHAIN,
    syntax: 'X402BR:<session>:<consumer_syn>',
    regex: /^X402BR:[a-zA-Z0-9_-]+:syn1[0-9a-z]+$/,
    rails: ['xrpl-altnet'],
    service: 'mcp-402-gateway-escrow (:8405) / escrow-server/index.mjs',
    description: 'Full or residual bond collateral return to consumer upon session close.',
    liveExample: 'X402BR:bond-fcf217a2-7ada-459f-9374-06a7b8c285b4-n:syn1jh0hy5409y49kzh0uw83d395fcsg5qa7lyy',
  },
  X402N: {
    tag: 'X402N',
    name: 'Netting Obligation',
    status: ESTATE_STATUS.LIVE_ONCHAIN,
    syntax: 'X402N:<session>:<net>',
    regex: /^X402N:[a-zA-Z0-9_-]+:\d+$/,
    rails: ['xrpl-altnet', 'solana-devnet'],
    service: 'mcp-402-gateway-escrow (:8405) / clearinghouse.mjs',
    description: 'Net balance settlement payment resulting from multilateral clearinghouse cycle.',
    liveExample: 'X402N:12:35000000',
  },
  X402L: {
    tag: 'X402L',
    name: 'Parametric Watermark Nonce',
    status: ESTATE_STATUS.STANDARDS_TRACK,
    syntax: 'X402L:<lane>:<window>:<nonce>',
    regex: /^X402L:\d+:\d+:\d+$/,
    rails: ['solana-devnet', 'synaptic-l1'],
    service: 'IETF draft-shabazz-http-x402-tswp-01 / Solana SIMD-0671',
    description: '256-lane watermark nonce header preventing serialization bottlenecks ($S=0).',
    liveExample: 'X402L:151:1789860218:806384975',
  },
  X402Z: {
    tag: 'X402Z',
    name: 'ZK State Attestation',
    status: ESTATE_STATUS.STANDARDS_TRACK,
    syntax: 'X402Z:<root_hash>:<proof_ref>',
    regex: /^X402Z:[0-9a-f]{64}:[a-zA-Z0-9_-]+$/i,
    rails: ['synaptic-l1', 'xrpl-altnet'],
    service: 'Zenodo SYN-TD-008 & SYN-TD-012',
    description: 'Zero-knowledge confidential attestation of ISO 20022 clearing state and RWA DvP.',
    liveExample: 'X402Z:02e3a590d238cb09849204859038495028495028495028495028495028495028:proof-zko-01',
  },
  X402R: {
    tag: 'X402R',
    name: 'Honest Rejection Proof',
    status: ESTATE_STATUS.STANDARDS_TRACK,
    syntax: 'X402R:<session>:<reason_code>',
    regex: /^X402R:[a-zA-Z0-9_-]+:[A-Z0-9_]+$/,
    rails: ['xrpl-altnet', 'synaptic-l1'],
    service: 'Zenodo SYN-TD-001 / mcp-402-gateway',
    description: 'Cryptographic proof of honest rejection for failed post-trade dispute resolution.',
    liveExample: 'X402R:sess-8891:INVALID_RATE_TOLERANCE',
  },
});

/**
 * Validates any raw string against canonical X402-TSWP memo grammar.
 * @param {string} memo - Raw memo string
 * @returns {{ valid: boolean, tag?: string, record?: object, error?: string }}
 */
export function validateTswpMemo(memo) {
  if (typeof memo !== 'string') {
    return { valid: false, error: 'Memo must be a string' };
  }
  const prefix = memo.split(':')[0];
  const record = DISCRIMINATOR_REGISTRY[prefix];
  if (!record) {
    return { valid: false, error: `Unknown X402 discriminator: ${prefix}` };
  }
  if (!record.regex.test(memo)) {
    return { valid: false, tag: prefix, error: `Malformed syntax for ${prefix}. Expected: ${record.syntax}` };
  }
  return { valid: true, tag: prefix, record };
}

/**
 * Formats a canonical Gateway Challenge memo.
 */
export function buildGatewayMemo(challengeUuid) {
  const memo = `X402G:${challengeUuid}`;
  const res = validateTswpMemo(memo);
  assert(res.valid, res.error);
  return memo;
}

/**
 * Formats a canonical 256-Lane Parametric Watermark memo.
 */
export function buildLaneMemo(lane, window, nonce) {
  const laneStr = String(lane);
  const winStr = String(window);
  const nonceStr = String(nonce);

  if (/^0\d+/.test(laneStr) || /^0\d+/.test(winStr) || /^0\d+/.test(nonceStr)) {
    throw new Error('Non-canonical decimal representation (leading zero)');
  }
  const laneNum = Number(lane);
  assert(laneNum >= 0 && laneNum <= 255, 'lane out of bounds (0-255)');

  const memo = `X402L:${laneStr}:${winStr}:${nonceStr}`;
  assert(Buffer.byteLength(memo, 'ascii') <= 50, 'Lane memo exceeds 50 bytes');
  const res = validateTswpMemo(memo);
  assert(res.valid, res.error);
  return memo;
}

/**
 * Formats a canonical Net-Window settlement memo.
 */
export function buildWindowMemo(window, participantSyn) {
  const memo = `X402W:${window}:${participantSyn}`;
  const res = validateTswpMemo(memo);
  assert(res.valid, res.error);
  return memo;
}
