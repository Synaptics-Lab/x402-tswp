import assert from 'node:assert/strict';

function buildLaneMemo(lane, window, nonce) {
  const laneStr = String(lane);
  const winStr = String(window);
  const nonceStr = String(nonce);

  assert(/^\d+$/.test(laneStr), 'lane must be integer');
  const laneNum = Number(lane);
  assert(laneNum >= 0 && laneNum <= 255, 'lane out of bounds');
  assert(/^\d+$/.test(winStr), 'window must be numeric');
  assert(/^\d+$/.test(nonceStr), 'nonce must be numeric');

  if (/^0\d+/.test(laneStr) || /^0\d+/.test(winStr) || /^0\d+/.test(nonceStr)) {
    throw new Error('Non-canonical decimal representation');
  }

  const memo = `X402L:${laneStr}:${winStr}:${nonceStr}`;
  if (Buffer.byteLength(memo, 'ascii') > 50) {
    throw new Error('Lane memo exceeds 50 bytes');
  }
  return memo;
}

function buildGatewayMemo(challenge) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  assert(uuidRegex.test(challenge), 'invalid challenge uuid');
  return `X402G:${challenge}`;
}

console.log('--- Testing RFC-0402 Conformance Vectors ---');

// Vector 1: Gateway challenge
const gMemo = buildGatewayMemo('827da995-adda-4dd7-9fb5-d05338526873');
assert.equal(gMemo, 'X402G:827da995-adda-4dd7-9fb5-d05338526873');
assert.equal(Buffer.byteLength(gMemo, 'ascii'), 42);
console.log('PASS: Vector 1 (Gateway Challenge)');

// Vector 2: Lane memo
const lMemo = buildLaneMemo(151, 1789860218n, 806384975n);
assert.equal(lMemo, 'X402L:151:1789860218:806384975');
assert.equal(Buffer.byteLength(lMemo, 'ascii'), 30);
console.log('PASS: Vector 2 (Lane Memo)');

// Vector 3: Leading zero rejection
assert.throws(() => {
  buildLaneMemo(0, 1789860218, '0806384975');
}, /Non-canonical decimal representation/);
console.log('PASS: Vector 3 (Leading Zero Rejection)');

// Vector 4: Zero digit representation
const zMemo = buildLaneMemo(0, 1, 0);
assert.equal(zMemo, 'X402L:0:1:0');
assert.equal(Buffer.byteLength(zMemo, 'ascii'), 11);
console.log('PASS: Vector 4 (Zero Digit Canonical)');

console.log('All 4 RFC-0402 test vectors PASSED.');
