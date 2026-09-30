import assert from 'node:assert/strict';
import {
  DISCRIMINATOR_TAGS,
  DISCRIMINATOR_REGISTRY,
  validateTswpMemo,
  buildGatewayMemo,
  buildLaneMemo,
  buildWindowMemo,
} from '../src/discriminators.mjs';

console.log('--- Testing RFC-0402 X402-TSWP Conformance Suite ---');

// 1. Verify all 12 discriminators are registered
const tags = Object.keys(DISCRIMINATOR_TAGS);
assert.equal(tags.length, 12, 'Expected exactly 12 registered discriminators');
console.log(`PASS: 12/12 Discriminators Registered (${tags.join(', ')})`);

// 2. Vector: Gateway challenge validation
const gMemo = buildGatewayMemo('827da995-adda-4dd7-9fb5-d05338526873');
assert.equal(gMemo, 'X402G:827da995-adda-4dd7-9fb5-d05338526873');
assert.equal(Buffer.byteLength(gMemo, 'ascii'), 42);
const gRes = validateTswpMemo(gMemo);
assert.equal(gRes.valid, true);
assert.equal(gRes.tag, 'X402G');
console.log('PASS: Vector 1 (Gateway Challenge)');

// 3. Vector: Lane memo validation
const lMemo = buildLaneMemo(151, 1789860218n, 806384975n);
assert.equal(lMemo, 'X402L:151:1789860218:806384975');
assert.equal(Buffer.byteLength(lMemo, 'ascii'), 30);
const lRes = validateTswpMemo(lMemo);
assert.equal(lRes.valid, true);
assert.equal(lRes.tag, 'X402L');
console.log('PASS: Vector 2 (Lane Watermark Nonce)');

// 4. Vector: Window memo validation
const wMemo = buildWindowMemo(1789811559, 'syn1eydur8g7d66xeq38mmxvg95h7e6crr2vtunpq8');
assert.equal(wMemo, 'X402W:1789811559:syn1eydur8g7d66xeq38mmxvg95h7e6crr2vtunpq8');
const wRes = validateTswpMemo(wMemo);
assert.equal(wRes.valid, true);
assert.equal(wRes.tag, 'X402W');
console.log('PASS: Vector 3 (Netting Window Memo)');

// 5. Vector: Leading zero rejection in numeric components
assert.throws(() => {
  buildLaneMemo(0, 1789860218, '0806384975');
}, /Non-canonical decimal representation/);
console.log('PASS: Vector 4 (Leading Zero Rejection)');

// 6. Vector: All Live Discriminator Examples Validate
for (const [tag, record] of Object.entries(DISCRIMINATOR_REGISTRY)) {
  if (record.liveExample) {
    const res = validateTswpMemo(record.liveExample);
    assert.equal(res.valid, true, `Failed validation for live example of ${tag}: ${record.liveExample}`);
    assert.equal(res.tag, tag);
  }
}
console.log('PASS: Vector 5 (All Live Estate Examples Validated)');

// 7. Vector: Unknown discriminator rejection
const badRes = validateTswpMemo('X402UNKNOWN:123');
assert.equal(badRes.valid, false);
console.log('PASS: Vector 6 (Unknown Discriminator Fail-Closed)');

console.log('All RFC-0402 X402-TSWP test vectors PASSED.');
