const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  APIFY_BUDGET_POLICY,
  budgetStatus,
  canStartActor,
  createTikTokApproval,
  redactSecrets,
  verifyTikTokApproval
} = require('../lib/apify-budget');

test('Apify budget enforces actor, batch, and month limits', () => {
  const now = new Date('2026-07-17T00:00:00Z');
  const ledger = { entries: [{ month: '2026-07', actualUsd: 19.2 }], reservations: [] };
  assert.equal(canStartActor({ ledger, reserveUsd: 1, now }).blockedReason, 'MONTH_LIMIT');
  assert.equal(canStartActor({ ledger: {}, batchActualUsd: 4.2, reserveUsd: 1, now }).blockedReason, 'BATCH_LIMIT');
  assert.equal(canStartActor({ ledger: {}, reserveUsd: 1.01, now }).blockedReason, 'PER_ACTOR_LIMIT');
  assert.equal(canStartActor({ ledger: {}, reserveUsd: 1, now }).ok, true);
  assert.equal(budgetStatus({ ledger, now }).policy.perMonthUsd, APIFY_BUDGET_POLICY.perMonthUsd);
});

test('TikTok approval is bound to exact candidates and expires', () => {
  const candidates = [{ platform: 'tiktok', input: 'https://www.tiktok.com/@creator' }];
  const issuedAt = Date.parse('2026-07-17T00:00:00Z');
  const token = createTikTokApproval(candidates, 'server-secret', issuedAt);
  assert.equal(verifyTikTokApproval(token, candidates, 'server-secret', issuedAt + 1000), true);
  assert.equal(verifyTikTokApproval(token, [{ platform: 'tiktok', input: 'other' }], 'server-secret', issuedAt + 1000), false);
  assert.equal(verifyTikTokApproval(token, candidates, 'server-secret', issuedAt + 31 * 60 * 1000), false);
});

test('secret redaction removes query and authorization tokens', () => {
  const raw = 'https://api.apify.com/run?token=secret123 authorization: bearer token456';
  const safe = redactSecrets(raw);
  assert.doesNotMatch(safe, /secret123|token456/);
});

test('server rejects browser tokens and disables unbudgeted paid routes', () => {
  const serverSource = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  assert.match(serverSource, /hasOwnProperty\.call\(body, 'apiToken'\)/);
  assert.match(serverSource, /legacyPaidPaths/);
  assert.match(serverSource, /isUnbudgetedScrape/);
  assert.match(serverSource, /maxTotalChargeUsd/);
});
