/* global console, process */

import { Uyumsoft } from '../dist/index.js';

const username = process.env.UYUMSOFT_USERNAME;
const password = process.env.UYUMSOFT_PASSWORD;
const environment = process.env.UYUMSOFT_ENV ?? 'test';

if (environment !== 'test') {
  console.error('Readonly live smoke tests are pinned to UYUMSOFT_ENV=test.');
  process.exit(2);
}

if (!username || !password) {
  console.error('Missing UYUMSOFT_USERNAME or UYUMSOFT_PASSWORD. Live readonly smoke skipped.');
  process.exit(2);
}

const client = new Uyumsoft({
  username,
  password,
  environment: 'test',
  timeout: Number(process.env.UYUMSOFT_TIMEOUT_MS ?? 30_000),
  retry: { maxRetries: 0 },
});

const results = [];

await runStep('efatura.system.testConnection', true, async () => {
  const ok = await client.efatura.system.testConnection();
  return { ok };
});

await runStep('efatura.system.whoAmI', false, async () => {
  const who = await client.efatura.system.whoAmI();
  return { hasValue: Boolean(who && typeof who === 'object') };
});

await runStep('efatura.inbox.list', false, async () => {
  const inbox = await client.efatura.inbox.list({ PageIndex: 0, PageSize: 1 });
  return pagedShape(inbox);
});

await runStep('efatura.outbox.list', false, async () => {
  const outbox = await client.efatura.outbox.list({ PageIndex: 0, PageSize: 1 });
  return pagedShape(outbox);
});

console.log(JSON.stringify({ environment, results }, null, 2));

if (results.some((result) => result.required && result.status !== 'passed')) {
  process.exitCode = 1;
}

async function runStep(name, required, fn) {
  try {
    results.push({ name, required, status: 'passed', shape: await fn() });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({
      name,
      required,
      status: required ? 'failed' : 'skipped',
      reason: redact(message),
    });
  }
}

function pagedShape(page) {
  return {
    itemsIsArray: Array.isArray(page.items),
    pageIndexType: typeof page.pageIndex,
    pageSizeType: typeof page.pageSize,
    totalCountType: typeof page.totalCount,
  };
}

function redact(value) {
  return value
    .replaceAll(username, '[redacted-username]')
    .replaceAll(password, '[redacted-password]');
}
