const crypto = require('crypto');

const APIFY_BUDGET_POLICY = Object.freeze({ perActorUsd: 1, perBatchUsd: 5, perMonthUsd: 20 });

function money(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? Number(number.toFixed(6)) : 0;
}

function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function normalizeLedger(value = {}) {
  return {
    version: 1,
    entries: Array.isArray(value.entries) ? value.entries : [],
    reservations: Array.isArray(value.reservations) ? value.reservations : [],
    legacyRunsImportedAt: String(value.legacyRunsImportedAt || '')
  };
}

function usageForMonth(ledger, now = new Date()) {
  const key = monthKey(now);
  const normalized = normalizeLedger(ledger);
  const actualUsd = normalized.entries
    .filter((row) => String(row.month || '').startsWith(key))
    .reduce((sum, row) => sum + money(row.actualUsd), 0);
  const reservedUsd = normalized.reservations
    .filter((row) => String(row.month || '').startsWith(key))
    .reduce((sum, row) => sum + money(row.reservedUsd), 0);
  return { month: key, actualUsd: money(actualUsd), reservedUsd: money(reservedUsd) };
}

function budgetStatus({ ledger = {}, batchActualUsd = 0, batchReservedUsd = 0, now = new Date(), policy = APIFY_BUDGET_POLICY } = {}) {
  const month = usageForMonth(ledger, now);
  return {
    policy,
    month: month.month,
    monthActualUsd: month.actualUsd,
    monthReservedUsd: month.reservedUsd,
    monthRemainingUsd: money(Math.max(0, policy.perMonthUsd - month.actualUsd - month.reservedUsd)),
    batchActualUsd: money(batchActualUsd),
    batchReservedUsd: money(batchReservedUsd),
    batchRemainingUsd: money(Math.max(0, policy.perBatchUsd - Number(batchActualUsd || 0) - Number(batchReservedUsd || 0)))
  };
}

function canStartActor(options = {}) {
  const status = budgetStatus(options);
  const reserveUsd = Number(options.reserveUsd || status.policy.perActorUsd);
  if (reserveUsd > status.policy.perActorUsd) return { ok: false, blockedReason: 'PER_ACTOR_LIMIT', status };
  if (status.batchActualUsd + status.batchReservedUsd + reserveUsd > status.policy.perBatchUsd) return { ok: false, blockedReason: 'BATCH_LIMIT', status };
  if (status.monthActualUsd + status.monthReservedUsd + reserveUsd > status.policy.perMonthUsd) return { ok: false, blockedReason: 'MONTH_LIMIT', status };
  return { ok: true, blockedReason: '', status };
}

function approvalPayload(candidates, issuedAt) {
  return JSON.stringify({
    issuedAt,
    candidates: (candidates || []).map((row) => ({
      platform: String(row.platform || ''),
      input: String(row.input || row.influencerInput || row.homeUrl || '')
    }))
  });
}

function createTikTokApproval(candidates, secret, now = Date.now()) {
  const issuedAt = Number(now);
  const signature = crypto.createHmac('sha256', String(secret || '')).update(approvalPayload(candidates, issuedAt)).digest('hex');
  return `${issuedAt}.${signature}`;
}

function verifyTikTokApproval(token, candidates, secret, now = Date.now(), ttlMs = 30 * 60 * 1000) {
  const [issuedRaw, signature = ''] = String(token || '').split('.');
  const issuedAt = Number(issuedRaw);
  if (!issuedAt || issuedAt > now || now - issuedAt > ttlMs || !signature) return false;
  const expected = createTikTokApproval(candidates, secret, issuedAt).split('.')[1];
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function redactSecrets(value) {
  return String(value || '')
    .replace(/([?&]token=)[^&\s]+/gi, '$1[REDACTED]')
    .replace(/(authorization\s*[:=]\s*bearer\s+)[^\s]+/gi, '$1[REDACTED]')
    .replace(/(apify_api_token\s*[:=]\s*)[^\s]+/gi, '$1[REDACTED]');
}

module.exports = {
  APIFY_BUDGET_POLICY,
  budgetStatus,
  canStartActor,
  createTikTokApproval,
  monthKey,
  normalizeLedger,
  redactSecrets,
  usageForMonth,
  verifyTikTokApproval
};
