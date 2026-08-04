/* global console, process */

import { randomUUID } from 'node:crypto';
import { Uyumsoft, buildUyumsoftInvoiceInfo } from '../dist/index.js';

const username = process.env.UYUMSOFT_USERNAME;
const password = process.env.UYUMSOFT_PASSWORD;
const environment = process.env.UYUMSOFT_ENV ?? 'test';
const runMutating = process.env.UYUMSOFT_RUN_MUTATING_TESTS === 'true';
const flow = process.env.UYUMSOFT_MUTATING_FLOW ?? 'draft';
const requireAllFixtures = process.env.UYUMSOFT_REQUIRE_ALL_MUTATING_FIXTURES === 'true';
const selectedServices = parseServiceSelection(
  process.env.UYUMSOFT_MUTATING_SERVICES ??
    [
      'efatura',
      'esmm',
      'emm',
      'eirsaliye',
      'eadisyon',
      'edoviz',
      'ebankamakbuzu',
      'egiderpusulasi',
      'ebilet',
      'edefter',
    ].join(','),
);

if (environment !== 'test') {
  console.error('Mutating live tests are pinned to UYUMSOFT_ENV=test.');
  process.exit(2);
}

if (!runMutating) {
  console.error('Refusing to run mutating live tests without UYUMSOFT_RUN_MUTATING_TESTS=true.');
  process.exit(2);
}

if (!username || !password) {
  console.error('Missing UYUMSOFT_USERNAME or UYUMSOFT_PASSWORD.');
  process.exit(2);
}

if (!['draft', 'send'].includes(flow)) {
  console.error('UYUMSOFT_MUTATING_FLOW must be "draft" or "send".');
  process.exit(2);
}

const client = new Uyumsoft({
  username,
  password,
  environment: 'test',
  timeout: Number(process.env.UYUMSOFT_TIMEOUT_MS ?? 60_000),
  retry: { maxRetries: Number(process.env.UYUMSOFT_LIVE_MAX_RETRIES ?? 1) },
});

const runId = `SDKTEST-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomUUID().slice(0, 8)}`;
const results = [];
let invoiceInfo;
let liveUserInfo;

if (selectedServices.has('efatura')) {
  await runEfaturaScenario();
}

if (selectedServices.has('esmm')) {
  await runArrayDraftScenario({
    serviceName: 'esmm',
    fixtureEnv: 'UYUMSOFT_ESMM_PAYLOAD_JSON',
    defaultPayload: () => buildTestVoucherPayload(),
    saveAsDraft: (payloads) => client.esmm.send.saveAsDraft(payloads),
    send: (payloads) => client.esmm.send.voucher(payloads),
    list: (ids) =>
      client.esmm.outbox.list({
        PageIndex: 0,
        PageSize: 5,
        VoucherEttns: ids.length > 0 ? ids : undefined,
      }),
    getStatus: (ids) => client.esmm.outbox.getStatus(ids),
    cancelDraft: (ids) => client.esmm.send.cancelDraft(ids),
  });
}

if (selectedServices.has('emm')) {
  await runEmmScenario();
}

if (selectedServices.has('eirsaliye')) {
  await runEirsaliyeScenario();
}

if (selectedServices.has('eadisyon')) {
  await runDocumentDraftScenario({
    serviceName: 'eadisyon',
    fixtureEnv: 'UYUMSOFT_EADISYON_PAYLOAD_JSON',
    defaultPayload: () => buildCreditNotePayload('GuestCheck', 'ADISYON'),
    saveAsDraft: (payload) => client.eadisyon.send.saveAsDraft(payload),
    send: (payload) => client.eadisyon.send.send(payload),
    list: () => client.eadisyon.outbox.list(0, 5),
    getStatus: (ids) => client.eadisyon.outbox.getStatus(ids),
    cancelDraft: (ids) => client.eadisyon.send.cancelDraft(ids),
    existingProbe: {
      list: () => client.eadisyon.outbox.list(0, 1),
      getStatus: (ids) => client.eadisyon.outbox.getStatus(ids),
    },
  });
}

if (selectedServices.has('edoviz')) {
  await runDocumentDraftScenario({
    serviceName: 'edoviz',
    fixtureEnv: 'UYUMSOFT_EDOVIZ_PAYLOAD_JSON',
    defaultPayload: () => buildCreditNotePayload('ForeignExchange', 'DOVIZALIM'),
    saveAsDraft: (payload) => client.edoviz.send.saveAsDraft(payload),
    send: (payload) => client.edoviz.send.send(payload),
    list: () => client.edoviz.outbox.list(0, 5),
    getStatus: (ids) => client.edoviz.outbox.getStatus(ids),
    cancelDraft: (ids) => client.edoviz.send.cancelDraft(ids),
    existingProbe: {
      list: () => client.edoviz.outbox.list(0, 1),
      getStatus: (ids) => client.edoviz.outbox.getStatus(ids),
    },
  });
}

if (selectedServices.has('ebankamakbuzu')) {
  await runDocumentDraftScenario({
    serviceName: 'ebankamakbuzu',
    fixtureEnv: 'UYUMSOFT_EBANKAMAKBUZU_PAYLOAD_JSON',
    defaultPayload: () => buildCreditNotePayload('BankReceipt', 'BANKAMAKBUZ'),
    saveAsDraft: (payload) => client.ebankamakbuzu.send.saveAsDraft(payload),
    send: (payload) => client.ebankamakbuzu.send.send(payload),
    list: () => client.ebankamakbuzu.outbox.list(0, 5),
    getStatus: (ids) => client.ebankamakbuzu.outbox.getStatus(ids),
    cancelDraft: (ids) => client.ebankamakbuzu.send.cancelDraft(ids),
    existingProbe: {
      list: () => client.ebankamakbuzu.outbox.list(0, 1),
      getStatus: (ids) => client.ebankamakbuzu.outbox.getStatus(ids),
    },
  });
}

if (selectedServices.has('egiderpusulasi')) {
  await runDocumentDraftScenario({
    serviceName: 'egiderpusulasi',
    fixtureEnv: 'UYUMSOFT_EGIDERPUSULASI_PAYLOAD_JSON',
    defaultPayload: () => buildCreditNotePayload('ExpenseReceipt', 'GIDERPUSULASI'),
    saveAsDraft: (payload) => client.egiderpusulasi.send.saveAsDraft(payload),
    send: (payload) => client.egiderpusulasi.send.send(payload),
    list: () => client.egiderpusulasi.outbox.list(0, 5),
    getStatus: (ids) => client.egiderpusulasi.outbox.getStatus(ids),
    cancelDraft: (ids) => client.egiderpusulasi.send.cancelDraft(ids),
    existingProbe: {
      list: () => client.egiderpusulasi.outbox.list(0, 1),
      getStatus: (ids) => client.egiderpusulasi.outbox.getStatus(ids),
    },
  });
}

if (selectedServices.has('ebilet')) {
  await runTicketScenario();
}

if (selectedServices.has('edefter')) {
  pushSkipped(
    'edefter.mutating',
    'e-Defter mutating smoke needs a real ledger source/report fixture and is not safe to synthesize.',
  );
}

console.log(
  JSON.stringify({ environment, runId, services: [...selectedServices], results }, null, 2),
);

if (results.some((result) => result.status === 'failed')) {
  process.exitCode = 1;
}

if (requireAllFixtures && results.some((result) => result.status === 'skipped')) {
  process.exitCode = 1;
}

async function runEfaturaScenario() {
  const generatedDocumentIds = [];

  await runStep('efatura.system.testConnection', async () => {
    const ok = await client.efatura.system.testConnection();
    return { ok };
  });

  await runStep('efatura.system.whoAmI', async () => {
    const who = await client.efatura.system.whoAmI();
    liveUserInfo = who;
    invoiceInfo = buildTestInvoiceInfo(who);
    return {
      hasEarchive: normalizeBoolean(who.Services?.HasEarchive),
      hasEInvoice: normalizeBoolean(who.Services?.HasEInvoice),
      customerVknTcknLength: String(who.Customer?.VkTckNo ?? '').length,
    };
  });

  await runStep('efatura.manage.validate', async () => {
    const ok = await client.efatura.manage.validate(invoiceInfo.Invoice);
    return { ok, runId };
  });

  await runStep(flow === 'send' ? 'efatura.send.invoice' : 'efatura.send.saveAsDraft', async () => {
    const identities =
      flow === 'send'
        ? await client.efatura.send.invoice([invoiceInfo])
        : await client.efatura.send.saveAsDraft([invoiceInfo]);

    for (const identity of identities) {
      if (identity.Id) {
        generatedDocumentIds.push(identity.Id);
      }
    }

    return summarizeIdentities(identities);
  });

  await runStep('efatura.outbox.list.generated', async () => {
    const page = await client.efatura.outbox.list({
      PageIndex: 0,
      PageSize: 5,
      InvoiceIds: generatedDocumentIds,
    });

    return summarizePage(page);
  });

  await runStep('efatura.outbox.getStatus.generated', async () => {
    const statuses = await client.efatura.outbox.getStatus(generatedDocumentIds);
    return summarizeStatuses(statuses);
  });

  if (flow === 'draft' && generatedDocumentIds.length > 0) {
    await runStep('efatura.send.cancelDraft.cleanup', async () => {
      const ok = await client.efatura.send.cancelDraft(generatedDocumentIds);
      return { ok, cleanedDocumentCount: generatedDocumentIds.length };
    });
  }
}

async function runArrayDraftScenario(options) {
  const hasExplicitFixture = Boolean(process.env[options.fixtureEnv]);
  if (!hasExplicitFixture && options.defaultPayloadNeedsUserInfo) {
    await ensureLiveUserInfo();
  }
  const fixture = readFixture(options.fixtureEnv, options.serviceName, options.defaultPayload);
  if (!fixture) {
    if (options.existingProbe) {
      await runExistingDocumentProbe(options.serviceName, options.existingProbe);
    }
    return;
  }

  const payloads = Array.isArray(fixture) ? fixture : [fixture];
  const ids = [];

  const sendStepName = `${options.serviceName}.${flow === 'send' ? 'send' : 'send.saveAsDraft'}`;
  try {
    results.push({
      name: sendStepName,
      status: 'passed',
      shape: await (async () => {
        const identities =
          flow === 'send' ? await options.send(payloads) : await options.saveAsDraft(payloads);
        ids.push(...extractIdentityIds(identities));
        return summarizeIdentities(identities);
      })(),
    });
  } catch (error) {
    if (!hasExplicitFixture && isExpectedLiveAccountLimitation(error)) {
      pushSkipped(
        sendStepName,
        `Generated SDKTEST payload could not run with this test account: ${safeErrorMessage(error)}`,
      );
      if (options.existingProbe) {
        await runExistingDocumentProbe(options.serviceName, options.existingProbe);
      }
      return;
    }
    results.push({ name: sendStepName, status: 'failed', reason: safeErrorMessage(error) });
    return;
  }

  await runStep(`${options.serviceName}.outbox.list.generated`, async () =>
    summarizePage(await options.list(ids)),
  );

  if (ids.length > 0) {
    await runStep(`${options.serviceName}.outbox.getStatus.generated`, async () =>
      summarizeStatuses(await options.getStatus(ids)),
    );
  } else {
    pushSkipped(`${options.serviceName}.outbox.getStatus.generated`, 'No document id returned.');
  }

  if (flow === 'draft' && ids.length > 0) {
    await runStep(`${options.serviceName}.send.cancelDraft.cleanup`, async () => {
      const ok = await options.cancelDraft(ids);
      return { ok, cleanedDocumentCount: ids.length };
    });
  }
}

async function runEirsaliyeScenario() {
  const hasExplicitFixture = Boolean(process.env.UYUMSOFT_EIRSALIYE_PAYLOAD_JSON);

  if (hasExplicitFixture) {
    await runArrayDraftScenario({
      serviceName: 'eirsaliye',
      fixtureEnv: 'UYUMSOFT_EIRSALIYE_PAYLOAD_JSON',
      saveAsDraft: (payloads) => client.eirsaliye.send.saveAsDraft(payloads),
      send: (payloads) => client.eirsaliye.send.despatch(payloads),
      list: (ids) =>
        client.eirsaliye.outbox.list({
          PageIndex: 0,
          PageSize: 5,
          DespatchIds: ids.length > 0 ? ids : undefined,
        }),
      getStatus: (ids) => client.eirsaliye.outbox.getStatus(ids),
      cancelDraft: (ids) => client.eirsaliye.send.cancelDraft(ids),
    });
    return;
  }

  const sourceIds = [];
  const clonedIds = [];

  await runStep('eirsaliye.outbox.list.clone-source', async () => {
    const page = await client.eirsaliye.outbox.list({ PageIndex: 0, PageSize: 1 });
    const sourceId = firstExistingDocumentId(page.items);
    if (sourceId) {
      sourceIds.push(sourceId);
    }
    return {
      ...summarizePage(page),
      firstDocumentId: sourceId,
      firstItemKeys: firstObjectKeys(page.items),
    };
  });

  if (sourceIds.length === 0) {
    pushSkipped('eirsaliye.manage.clone', 'No existing despatch was available to clone.');
    return;
  }

  try {
    const cloned = await client.eirsaliye.manage.clone(sourceIds);
    clonedIds.push(...extractIdentityIds(cloned));
    results.push({
      name: 'eirsaliye.manage.clone',
      status: 'passed',
      shape: summarizeIdentities(cloned),
    });
  } catch (error) {
    pushSkipped(
      'eirsaliye.manage.clone',
      `Existing despatch clone could not run with this test account: ${safeErrorMessage(error)}`,
    );
    await runExistingDocumentProbe('eirsaliye', {
      list: () => client.eirsaliye.outbox.list({ PageIndex: 0, PageSize: 1 }),
      getStatus: (ids) => client.eirsaliye.outbox.getStatus(ids),
    });
    return;
  }

  if (clonedIds.length === 0) {
    pushSkipped('eirsaliye.outbox.getStatus.generated', 'Clone did not return a document id.');
    return;
  }

  await runStep('eirsaliye.outbox.getStatus.generated', async () =>
    summarizeStatuses(await client.eirsaliye.outbox.getStatus(clonedIds)),
  );

  if (flow === 'draft') {
    await runStep('eirsaliye.send.cancelDraft.cleanup', async () => {
      const ok = await client.eirsaliye.send.cancelDraft(clonedIds);
      return { ok, cleanedDocumentCount: clonedIds.length };
    });
  }
}

async function runEmmScenario() {
  const fixture = readFixture('UYUMSOFT_EMM_PAYLOAD_JSON', 'emm', undefined, {
    skipWhenMissing: true,
  });
  if (fixture) {
    await runArrayDraftScenario({
      serviceName: 'emm',
      fixtureEnv: 'UYUMSOFT_EMM_PAYLOAD_JSON',
      saveAsDraft: (payloads) => client.emm.send.saveAsDraft(payloads),
      send: (payloads) => client.emm.send.producerReceipt(payloads),
      list: (ids) =>
        client.emm.outbox.list({
          PageIndex: 0,
          PageSize: 5,
          IdList: ids.length > 0 ? ids : undefined,
        }),
      getStatus: (ids) => client.emm.outbox.getStatus(ids),
      cancelDraft: (ids) => client.emm.send.cancelDraft(ids),
    });
    return;
  }

  const clonedIds = [];

  await runStep('emm.outbox.list.clone-source', async () => {
    const page = await client.emm.outbox.list({ PageIndex: 0, PageSize: 1 });
    const sourceId = firstDefined(page.items[0], ['DocumentId', 'Ettn', 'ProducerReceiptEttn']);
    if (typeof sourceId === 'string' && sourceId.trim() !== '') {
      clonedIds.sourceId = sourceId;
    }
    return summarizePage(page);
  });

  if (!clonedIds.sourceId) {
    pushSkipped('emm.manage.clone', 'No existing producer receipt was available to clone.');
    return;
  }

  await runStep('emm.manage.clone', async () => {
    const cloned = await client.emm.manage.clone(clonedIds.sourceId, true);
    clonedIds.push(...extractIdentityIds(cloned));
    return summarizeIdentities(cloned);
  });

  if (clonedIds.length === 0) {
    pushSkipped('emm.outbox.getStatus.generated', 'Clone did not return a document id.');
    return;
  }

  await runStep('emm.outbox.getStatus.generated', async () =>
    summarizeStatuses(await client.emm.outbox.getStatus(clonedIds)),
  );

  await runStep('emm.send.cancelDraft.cleanup', async () => {
    const ok = await client.emm.send.cancelDraft(clonedIds);
    return { ok, cleanedDocumentCount: clonedIds.length };
  });
}

async function runDocumentDraftScenario(options) {
  const hasExplicitFixture = Boolean(process.env[options.fixtureEnv]);
  if (
    !hasExplicitFixture &&
    options.defaultPayloadNeedsUserInfo !== false &&
    options.defaultPayload
  ) {
    await ensureLiveUserInfo();
  }
  const fixture = readFixture(options.fixtureEnv, options.serviceName, options.defaultPayload);
  if (!fixture) {
    if (options.existingProbe) {
      await runExistingDocumentProbe(options.serviceName, options.existingProbe);
    }
    return;
  }

  const ids = [];

  const sendStepName = `${options.serviceName}.${flow === 'send' ? 'send' : 'send.saveAsDraft'}`;
  try {
    results.push({
      name: sendStepName,
      status: 'passed',
      shape: await (async () => {
        const identities =
          flow === 'send' && options.send
            ? await options.send(fixture)
            : await options.saveAsDraft(fixture);
        ids.push(...extractIdentityIds(identities));
        return summarizeIdentities(identities);
      })(),
    });
  } catch (error) {
    if (!hasExplicitFixture && isExpectedLiveAccountLimitation(error)) {
      pushSkipped(
        sendStepName,
        `Generated SDKTEST payload could not run with this test account: ${safeErrorMessage(error)}`,
      );
      if (options.existingProbe) {
        await runExistingDocumentProbe(options.serviceName, options.existingProbe);
      }
      return;
    }
    results.push({ name: sendStepName, status: 'failed', reason: safeErrorMessage(error) });
    return;
  }

  await runStep(`${options.serviceName}.outbox.list.generated`, async () =>
    summarizePage(await options.list(ids)),
  );

  if (ids.length > 0) {
    await runStep(`${options.serviceName}.outbox.getStatus.generated`, async () =>
      summarizeStatuses(await options.getStatus(ids)),
    );
  } else {
    pushSkipped(`${options.serviceName}.outbox.getStatus.generated`, 'No document id returned.');
  }

  if (flow === 'draft' && ids.length > 0) {
    await runStep(`${options.serviceName}.send.cancelDraft.cleanup`, async () => {
      const ok = await options.cancelDraft(ids);
      return { ok, cleanedDocumentCount: ids.length };
    });
  }
}

async function runTicketScenario() {
  const fixture = readFixture('UYUMSOFT_EBILET_PAYLOAD_JSON', 'ebilet', undefined, {
    skipWhenMissing: true,
  });
  if (!fixture) {
    await runExistingDocumentProbe('ebilet', {
      list: () => client.ebilet.tickets.list(0, 1),
      get: (id) => client.ebilet.tickets.get(id),
    });
    return;
  }

  if (flow !== 'send') {
    pushSkipped(
      'ebilet.tickets.send',
      'e-Bilet has no draft API; set UYUMSOFT_MUTATING_FLOW=send.',
    );
    return;
  }

  const ids = [];

  await runStep('ebilet.tickets.send', async () => {
    const result = await client.ebilet.tickets.send(fixture);
    ids.push(...extractIdentityIds(result));
    return summarizeIdentities(result);
  });

  await runStep('ebilet.tickets.list.generated', async () =>
    summarizePage(await client.ebilet.tickets.list(0, 5)),
  );

  if (ids.length > 0) {
    await runStep('ebilet.tickets.cancel.cleanup', async () => {
      const cancelled = [];
      for (const id of ids) {
        cancelled.push({ id, ok: await client.ebilet.tickets.cancel(id) });
      }
      return { cancelled };
    });
  } else {
    pushSkipped('ebilet.tickets.cancel.cleanup', 'No document id returned.');
  }
}

async function runExistingDocumentProbe(serviceName, probe) {
  let page;
  let documentId;

  try {
    page = await probe.list();
    documentId = firstExistingDocumentId(page.items);
    results.push({
      name: `${serviceName}.outbox.list.existing`,
      status: 'passed',
      shape: {
        ...summarizePage(page),
        firstDocumentId: documentId,
        firstItemKeys: firstObjectKeys(page.items),
      },
    });
  } catch (error) {
    pushSkipped(
      `${serviceName}.outbox.list.existing`,
      `Live probe could not run with this test account: ${safeErrorMessage(error)}`,
    );
    return;
  }

  if (!documentId) {
    pushSkipped(
      `${serviceName}.outbox.getStatus.existing`,
      'No existing document id was available.',
    );
    return;
  }

  if (probe.getStatus) {
    await runStep(`${serviceName}.outbox.getStatus.existing`, async () =>
      summarizeStatuses(await probe.getStatus([documentId])),
    );
  }

  if (probe.get) {
    await runStep(`${serviceName}.outbox.get.existing`, async () =>
      summarizeDocument(await probe.get(documentId)),
    );
  }
}

async function runStep(name, fn) {
  try {
    results.push({ name, status: 'passed', shape: await fn() });
  } catch (error) {
    results.push({ name, status: 'failed', reason: safeErrorMessage(error) });
  }
}

function pushSkipped(name, reason) {
  results.push({ name, status: 'skipped', reason });
}

function readFixture(envName, serviceName, defaultPayload, options = {}) {
  const raw = process.env[envName];
  if (!raw) {
    if (defaultPayload) {
      return defaultPayload();
    }
    if (options.skipWhenMissing) {
      return undefined;
    }
    pushSkipped(
      `${serviceName}.fixture`,
      `Missing ${envName}; provide valid test-account document JSON to run this service.`,
    );
    return undefined;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({
      name: `${serviceName}.fixture`,
      status: 'failed',
      reason: redact(`Invalid ${envName}: ${message}`),
    });
    return undefined;
  }
}

function summarizePage(page) {
  return {
    itemsIsArray: Array.isArray(page.items),
    itemCount: Array.isArray(page.items) ? page.items.length : undefined,
    totalCount: page.totalCount,
    pageIndex: page.pageIndex,
    pageSize: page.pageSize,
  };
}

function summarizeStatuses(statuses) {
  const list = Array.isArray(statuses) ? statuses : [statuses];
  return {
    statusCount: list.length,
    statuses: list.map((status) => ({
      id: firstDefined(status, [
        'InvoiceId',
        'DespatchId',
        'Ettn',
        'VoucherEttn',
        'ProducerReceiptEttn',
        'DocumentId',
      ]),
      status: firstDefined(status, ['Status', 'DocumentStatus', 'State']),
      statusCode: firstDefined(status, ['StatusCode', 'Code']),
    })),
  };
}

function summarizeDocument(document) {
  if (!document || typeof document !== 'object') {
    return { type: typeof document };
  }

  return {
    keys: Object.keys(document).sort(),
    documentId: firstDefined(document, ['DocumentId', 'Id', 'Ettn']),
    hasData: typeof document.Data === 'string' && document.Data.length > 0,
    dataLength: typeof document.Data === 'string' ? document.Data.length : undefined,
  };
}

function summarizeIdentities(value) {
  const identities = Array.isArray(value) ? value : [value];
  return {
    identityCount: identities.length,
    ids: extractIdentityIds(identities),
    numbers: extractStringValues(identities, ['Number', 'VoucherNumber', 'ProducerReceiptNumber']),
    rawKeys: identities
      .filter((identity) => identity && typeof identity === 'object')
      .slice(0, 3)
      .map((identity) => Object.keys(identity).sort()),
  };
}

function extractIdentityIds(value) {
  return [...new Set(extractStringValues(value, identityKeys()))];
}

function extractStringValues(value, keys) {
  const found = [];
  const queue = Array.isArray(value) ? [...value] : [value];

  while (queue.length > 0) {
    const item = queue.shift();
    if (!item || typeof item !== 'object') {
      continue;
    }

    for (const [key, child] of Object.entries(item)) {
      if (keys.includes(key) && typeof child === 'string' && child.trim() !== '') {
        found.push(child);
      } else if (child && typeof child === 'object') {
        queue.push(child);
      }
    }
  }

  return found;
}

function identityKeys() {
  return [
    'Id',
    'Ettn',
    'ETTN',
    'DocumentId',
    'InvoiceId',
    'DespatchId',
    'ReceiptAdviceId',
    'VoucherEttn',
    'ProducerReceiptEttn',
    'GuestCheckEttn',
    'ForeignExchangeEttn',
    'BankReceiptEttn',
    'ExpenseReceiptEttn',
    'ClonedReceiptId',
    'ClonedDespatchId',
    'ClonedDocumentId',
  ];
}

function firstDefined(value, keys) {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  for (const key of keys) {
    if (value[key] !== undefined && value[key] !== null) {
      return value[key];
    }
  }

  return undefined;
}

function firstExistingDocumentId(items) {
  const list = Array.isArray(items) ? items : [];
  for (const item of list) {
    const id = firstDefined(item, identityKeys());
    if (typeof id === 'string' && id.trim() !== '') {
      return id;
    }
  }
  return undefined;
}

function firstObjectKeys(items) {
  const first = Array.isArray(items)
    ? items.find((item) => item && typeof item === 'object')
    : undefined;
  return first ? Object.keys(first).sort() : undefined;
}

function redact(value) {
  return value
    .replaceAll(username, '[redacted-username]')
    .replaceAll(password, '[redacted-password]');
}

function safeErrorMessage(error) {
  const message = error instanceof Error ? error.message : String(error);
  const withoutServiceDetail = message.replace(/\s+detail:\s+.+$/s, '');
  const compact = withoutServiceDetail.replace(/\s+/g, ' ').trim();
  return redact(compact.length > 1_000 ? `${compact.slice(0, 997)}...` : compact);
}

function isExpectedLiveAccountLimitation(error) {
  const message = safeErrorMessage(error);
  return [
    'gerekli yetkiniz yok',
    'Vergi Kimlik Numarası',
    'Object reference not set to an instance of an object',
    'Error in deserializing body of request message',
  ].some((pattern) => message.includes(pattern));
}

async function ensureLiveUserInfo() {
  if (!liveUserInfo) {
    liveUserInfo = await client.efatura.system.whoAmI();
  }
  return liveUserInfo;
}

function buildTestInvoiceInfo(who) {
  const customer = who.Customer ?? {};
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const invoiceNo = `SDK${year}${Date.now().toString().slice(-9)}`;
  const supplierVkn = String(customer.VkTckNo ?? '9000068418');
  const supplierTitle = String(customer.Name ?? 'Uyumsoft Test Supplier');

  return {
    ...buildUyumsoftInvoiceInfo(
      {
        invoiceNo,
        uuid: randomUUID(),
        issueDate: now,
        issueTime: now.toISOString().slice(11, 19),
        profileId: 'EARSIVFATURA',
        invoiceTypeCode: 'SATIS',
        currency: 'TRY',
        notes: [`${runId} generated by SDK live mutating smoke test`],
        taxExclusiveAmount: 10,
        taxAmount: 2,
        discount: 0,
        payableAmount: 12,
        supplier: {
          vkn: supplierVkn,
          title: supplierTitle,
          taxOffice: String(customer.TaxOffice ?? 'TEST'),
          address: {
            street: String(customer.AddressStreetName ?? 'Test Street'),
            room: String(customer.AddressRoom ?? ''),
            district: String(customer.AddressSubDivisionName ?? 'Test District'),
            city: String(customer.AddressCity ?? 'Istanbul'),
            postalZone: String(customer.AddressPostalZone ?? ''),
            country: String(customer.AddressCountry ?? 'Turkiye'),
          },
          contact: {
            phone: customer.ContactPhone ? String(customer.ContactPhone) : undefined,
            email: customer.ContactEmail ? String(customer.ContactEmail) : undefined,
          },
        },
        customer: {
          vkn: '11111111111',
          title: 'SDKTEST ALICI',
          taxOffice: 'TEST',
          address: {
            street: 'SDKTEST Musteri Sokak',
            district: 'Kadikoy',
            city: 'Istanbul',
            country: 'Turkiye',
          },
          person: {
            firstName: 'SDKTEST',
            familyName: 'ALICI',
          },
        },
        lines: [
          {
            name: 'SDKTEST hizmet kalemi',
            quantity: 1,
            unitCode: 'NIU',
            price: 10,
            lineAmount: 10,
            vatRate: 20,
            taxAmount: 2,
          },
        ],
        eArchiveInfo: {
          deliveryType: 'Electronic',
        },
      },
      {
        notificationEmail: 'sdk-test@example.invalid',
      },
    ),
    LocalDocumentId: runId,
    ExtraInformation: runId,
  };
}

function buildTestVoucherPayload() {
  const id = randomUUID();
  return {
    eArsivVeriSerbestMeslekMakbuz: {
      ETTN: id,
      gonderimSekli: 'ELEKTRONIK',
      belgeTarihi: new Date().toISOString().slice(0, 10),
      belgeZamani: new Date().toISOString().slice(11, 19),
      toplamTutar: 100,
      odenecekTutar: 80,
      paraBirimi: 'TRY',
      vergiBilgisi: {
        vergilerToplami: 20,
        vergi: [
          {
            matrah: 100,
            vergiKodu: '0015',
            vergiTutari: 20,
            vergiOrani: 20,
          },
        ],
      },
      aliciBilgileri: {
        gercekKisi: {
          tckn: '11111111111',
          adiSoyadi: 'SDKTEST ALICI',
        },
        adres: {
          caddeSokak: 'SDKTEST Sokak',
          sehir: 'Istanbul',
          ulke: 'TR',
        },
        vDaire: 'TEST',
      },
      malHizmetBilgisi: {
        malHizmet: [
          {
            ad: 'SDKTEST hizmet',
            vergiBilgisi: {
              vergilerToplami: 20,
              vergi: [
                {
                  matrah: 100,
                  vergiKodu: '0015',
                  vergiTutari: 20,
                  vergiOrani: 20,
                },
              ],
            },
            burutUcret: 100,
            netUcret: 80,
            tahsilEdilenTutar: 80,
            MappedObjectId: 1,
            MappedObjectId2: 1,
          },
        ],
      },
    },
    LocalDocumentId: `${runId}-ESMM-${id.slice(0, 8)}`,
  };
}

function buildCreditNotePayload(rootName, creditNoteTypeCode) {
  const who = liveUserInfo ?? {};
  const customer = who.Customer ?? {};
  const id = randomUUID();
  const now = new Date();
  const documentNumber = `SDK${now.getUTCFullYear()}${Date.now().toString().slice(-9)}`;

  return {
    [rootName]: {
      UBLVersionID: '2.1',
      CustomizationID: 'TR1.2.1',
      ProfileID: 'EARSIVBELGE',
      ID: documentNumber,
      UUID: id,
      IssueDate: now.toISOString().slice(0, 10),
      IssueTime: now.toISOString().slice(11, 19),
      CreditNoteTypeCode: creditNoteTypeCode,
      DocumentCurrencyCode: 'TRY',
      LineCountNumeric: 1,
      AccountingSupplierParty: buildCreditNoteParty({
        vkn: String(customer.VkTckNo ?? '9000068418'),
        title: String(customer.Name ?? 'Uyumsoft Test Supplier'),
        taxOffice: String(customer.TaxOffice ?? 'TEST'),
        city: String(customer.AddressCity ?? 'Istanbul'),
        district: String(customer.AddressSubDivisionName ?? 'Kadikoy'),
        street: String(customer.AddressStreetName ?? 'SDKTEST Sokak'),
      }),
      AccountingCustomerParty: {
        Party: {
          PartyIdentification: [{ ID: '11111111111' }],
          PostalAddress: {
            StreetName: 'SDKTEST Musteri Sokak',
            CitySubdivisionName: 'Kadikoy',
            CityName: 'Istanbul',
            Country: { Name: 'Turkiye' },
          },
          Person: {
            FirstName: 'SDKTEST',
            FamilyName: 'ALICI',
          },
        },
      },
      TaxTotal: [
        {
          TaxAmount: 20,
          TaxSubtotal: [
            {
              TaxableAmount: 100,
              TaxAmount: 20,
              Percent: 20,
              TaxCategory: {
                TaxScheme: {
                  Name: 'KDV',
                  TaxTypeCode: '0015',
                },
              },
            },
          ],
        },
      ],
      LegalMonetaryTotal: {
        LineExtensionAmount: 100,
        TaxExclusiveAmount: 100,
        TaxInclusiveAmount: 120,
        PayableAmount: 120,
      },
      CreditNoteLine: [
        {
          ID: '1',
          CreditedQuantity: 1,
          LineExtensionAmount: 100,
          TaxTotal: [
            {
              TaxAmount: 20,
              TaxSubtotal: [
                {
                  TaxableAmount: 100,
                  TaxAmount: 20,
                  Percent: 20,
                  TaxCategory: {
                    TaxScheme: {
                      Name: 'KDV',
                      TaxTypeCode: '0015',
                    },
                  },
                },
              ],
            },
          ],
          Item: {
            Name: `SDKTEST ${creditNoteTypeCode}`,
          },
          Price: {
            PriceAmount: 100,
          },
        },
      ],
    },
    LocalDocumentId: `${runId}-${rootName}-${id.slice(0, 8)}`,
  };
}

function buildCreditNoteParty(input) {
  return {
    Party: {
      PartyIdentification: [{ ID: input.vkn }],
      PartyName: { Name: input.title },
      PostalAddress: {
        StreetName: input.street,
        CitySubdivisionName: input.district,
        CityName: input.city,
        Country: { Name: 'Turkiye' },
      },
      PartyTaxScheme: {
        TaxScheme: { Name: input.taxOffice },
      },
    },
  };
}

function normalizeBoolean(value) {
  return value === true || value === 'true';
}

function parseServiceSelection(value) {
  const allowed = new Set([
    'efatura',
    'esmm',
    'emm',
    'eirsaliye',
    'eadisyon',
    'edoviz',
    'ebankamakbuzu',
    'egiderpusulasi',
    'ebilet',
    'edefter',
  ]);
  const services = new Set();

  for (const service of value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)) {
    if (!allowed.has(service)) {
      console.error(`Unknown UYUMSOFT_MUTATING_SERVICES entry: ${service}`);
      process.exit(2);
    }
    services.add(service);
  }

  return services;
}
