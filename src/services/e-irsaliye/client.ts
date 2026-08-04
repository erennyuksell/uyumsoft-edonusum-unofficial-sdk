// Uyumsoft SDK — e-İrsaliye (Despatch) Client (Enterprise)
import { BaseClient, type ServiceContext } from '../../core/base-client';
import {
  UYUMSOFT_ENDPOINTS,
  type PagedResult,
  type SoapRequestParams,
  type UyumsoftConfig,
} from '../../core/types';
import { SharedSystemMethods, buildPaginationAttrs } from '../../core/helpers';
import type {
  DespatchListQuery,
  DespatchQuery,
  DespatchListItem,
  DespatchInfo,
  DespatchData,
  DespatchStatusInfo,
  DespatchStatusWithLogInfo,
  ReceiptAdviceListItem,
  ReceiptAdviceStatusInfo,
  DespatchViewResult,
  DespatchEnvelopeData,
  DespatchSystemUser,
  DespatchUserAliases,
} from './types';

/**
 * e-İrsaliye (Despatch) client — wraps all 47 DespatchIntegration SOAP methods.
 *
 * Domain groups:
 * - `system`  — System date, document URL, service discovery
 * - `inbox`   — Incoming despatch advices (list, get, PDF, status, mark taken)
 * - `outbox`  — Outgoing despatch advices (list, get, PDF, status)
 * - `send`    — Create/send despatches (draft, compressed)
 * - `receipt` — Receipt advices (yanıt irsaliyesi)
 * - `manage`  — Validate, archive, clone, draft management
 * - `users`   — e-Despatch user lookup, aliases, filtering
 */
export class EIrsaliyeClient extends BaseClient {
  readonly system: SharedSystemMethods;
  readonly inbox: DespatchInboxMethods;
  readonly outbox: DespatchOutboxMethods;
  readonly send: DespatchSendMethods;
  readonly receipt: ReceiptAdviceMethods;
  readonly manage: DespatchManageMethods;
  readonly users: DespatchUserMethods;

  constructor(config: UyumsoftConfig) {
    super(config, UYUMSOFT_ENDPOINTS.eirsaliye);
    this.system = new SharedSystemMethods(this.ctx);
    this.inbox = new DespatchInboxMethods(this.ctx);
    this.outbox = new DespatchOutboxMethods(this.ctx);
    this.send = new DespatchSendMethods(this.ctx);
    this.receipt = new ReceiptAdviceMethods(this.ctx);
    this.manage = new DespatchManageMethods(this.ctx);
    this.users = new DespatchUserMethods(this.ctx);
  }
}

// ─── Helpers ─────────────────────────────────────────────

function buildQuery(query: DespatchListQuery | DespatchQuery): SoapRequestParams {
  const { PageIndex, PageSize, ...rest } = query;
  return {
    $attributes: {
      ...buildPaginationAttrs(PageIndex, PageSize),
      ...('SetTaken' in rest && rest.SetTaken != null ? { SetTaken: rest.SetTaken } : {}),
      ...('OnlyNewestDespatches' in rest && rest.OnlyNewestDespatches != null
        ? { OnlyNewestDespatches: rest.OnlyNewestDespatches }
        : {}),
    },
    ...rest,
  };
}

// ─── Inbox ───────────────────────────────────────────────

class DespatchInboxMethods {
  constructor(private readonly ctx: ServiceContext) {}

  /** List incoming despatch advices with filtering and pagination. */
  async list(query: DespatchListQuery = {}): Promise<PagedResult<DespatchListItem>> {
    const raw = await this.ctx.call('GetInboxDespatchList', { query: buildQuery(query) });
    return this.ctx.unwrapPaged<DespatchListItem>(raw, 'GetInboxDespatchListResult');
  }

  /** Get a single incoming despatch by ID (full UBL-TR). */
  async get(despatchId: string): Promise<DespatchInfo> {
    const raw = await this.ctx.call('GetInboxDespatch', { despatchId });
    return this.ctx.unwrap<DespatchInfo>(raw, 'GetInboxDespatchResult');
  }

  /** Get incoming despatches with full UBL-TR documents (paginated). */
  async getDespatches(query: DespatchQuery = {}): Promise<PagedResult<DespatchInfo>> {
    const raw = await this.ctx.call('GetInboxDespatches', { query: buildQuery(query) });
    return this.ctx.unwrapPaged<DespatchInfo>(raw, 'GetInboxDespatchesResult');
  }

  /** Get bulk raw despatch data (base64 XML). */
  async getData(query: DespatchQuery = {}): Promise<PagedResult<DespatchData>> {
    const raw = await this.ctx.call('GetInboxDespatchesData', { query: buildQuery(query) });
    return this.ctx.unwrapPaged<DespatchData>(raw, 'GetInboxDespatchesDataResult');
  }

  /** Get despatch PDF as base64. */
  async getPdf(despatchId: string): Promise<DespatchData> {
    const raw = await this.ctx.call('GetInboxDespatchPdf', { despatchId });
    return this.ctx.unwrap<DespatchData>(raw, 'GetInboxDespatchPdfResult');
  }

  /** Get despatch HTML view (rendered with XSLT). */
  async getView(despatchId: string): Promise<DespatchViewResult> {
    const raw = await this.ctx.call('GetInboxDespatchView', { despatchId });
    return this.ctx.unwrap<DespatchViewResult>(raw, 'GetInboxDespatchViewResult');
  }

  /** Query status of one or more inbox despatches. */
  async getStatus(despatchIds: string[]): Promise<DespatchStatusInfo[]> {
    const raw = await this.ctx.call('QueryInboxDespatchStatus', {
      despatchIds: { string: despatchIds },
    });
    return this.ctx.unwrapArray<DespatchStatusInfo>(raw, 'QueryInboxDespatchStatusResult');
  }

  /** Get despatch status with detailed processing logs. */
  async getStatusWithLogs(despatchIds: string[]): Promise<DespatchStatusWithLogInfo[]> {
    const raw = await this.ctx.call('GetInboxDespatchStatusWithLogs', {
      despatchIds: { string: despatchIds },
    });
    return this.ctx.unwrapArray<DespatchStatusWithLogInfo>(
      raw,
      'GetInboxDespatchStatusWithLogsResult',
    );
  }

  /** Mark despatches as "taken" (prevents re-fetching). */
  async markAsTaken(despatchIds: string[]): Promise<boolean> {
    const raw = await this.ctx.call('SetDespatchesTaken', { despatches: { string: despatchIds } });
    return this.ctx.unwrapFlag(raw, 'SetDespatchesTakenResult');
  }

  /** Transfer inbox despatch to another branch. */
  async transferToBranch(despatchIds: string[], targetBranchAlias: string): Promise<boolean> {
    const raw = await this.ctx.call('TransferInboxDespatchToAnotherBranch', {
      despatchIds: { string: despatchIds },
      targetBranchAlias,
    });
    return this.ctx.unwrapFlag(raw, 'TransferInboxDespatchToAnotherBranchResult');
  }
}

// ─── Outbox ──────────────────────────────────────────────

class DespatchOutboxMethods {
  constructor(private readonly ctx: ServiceContext) {}

  /** List outgoing despatch advices with filtering and pagination. */
  async list(query: DespatchListQuery = {}): Promise<PagedResult<DespatchListItem>> {
    const raw = await this.ctx.call('GetOutboxDespatchList', { query: buildQuery(query) });
    return this.ctx.unwrapPaged<DespatchListItem>(raw, 'GetOutboxDespatchListResult');
  }

  /** Get a single outgoing despatch by ID (full UBL-TR). */
  async get(despatchId: string): Promise<DespatchInfo> {
    const raw = await this.ctx.call('GetOutboxDespatch', { despatchId });
    return this.ctx.unwrap<DespatchInfo>(raw, 'GetOutboxDespatchResult');
  }

  /** Get outgoing despatches with full UBL-TR documents (paginated). */
  async getDespatches(query: DespatchQuery = {}): Promise<PagedResult<DespatchInfo>> {
    const raw = await this.ctx.call('GetOutboxDespatches', { query: buildQuery(query) });
    return this.ctx.unwrapPaged<DespatchInfo>(raw, 'GetOutboxDespatchesResult');
  }

  /** Get bulk raw despatch data (base64 XML). */
  async getData(query: DespatchQuery = {}): Promise<PagedResult<DespatchData>> {
    const raw = await this.ctx.call('GetOutboxDespatchesData', { query: buildQuery(query) });
    return this.ctx.unwrapPaged<DespatchData>(raw, 'GetOutboxDespatchesDataResult');
  }

  /** Get despatch PDF as base64. */
  async getPdf(despatchId: string): Promise<DespatchData> {
    const raw = await this.ctx.call('GetOutboxDespatchPdf', { despatchId });
    return this.ctx.unwrap<DespatchData>(raw, 'GetOutboxDespatchPdfResult');
  }

  /** Get despatch HTML view (rendered with XSLT). */
  async getView(despatchId: string): Promise<DespatchViewResult> {
    const raw = await this.ctx.call('GetOutboxDespatchView', { despatchId });
    return this.ctx.unwrap<DespatchViewResult>(raw, 'GetOutboxDespatchViewResult');
  }

  /** Query status of one or more outbox despatches. */
  async getStatus(despatchIds: string[]): Promise<DespatchStatusInfo[]> {
    const raw = await this.ctx.call('QueryOutboxDespatchStatus', {
      despatchIds: { string: despatchIds },
    });
    return this.ctx.unwrapArray<DespatchStatusInfo>(raw, 'QueryOutboxDespatchStatusResult');
  }

  /** Get despatch status with detailed processing logs. */
  async getStatusWithLogs(despatchIds: string[]): Promise<DespatchStatusWithLogInfo[]> {
    const raw = await this.ctx.call('GetOutboxDespatchStatusWithLogs', {
      despatchIds: { string: despatchIds },
    });
    return this.ctx.unwrapArray<DespatchStatusWithLogInfo>(
      raw,
      'GetOutboxDespatchStatusWithLogsResult',
    );
  }

  /** Transfer outbox despatch to another branch. */
  async transferToBranch(despatchIds: string[], targetBranchAlias: string): Promise<boolean> {
    const raw = await this.ctx.call('TransferOutboxDespatchToAnotherBranch', {
      despatchIds: { string: despatchIds },
      targetBranchAlias,
    });
    return this.ctx.unwrapFlag(raw, 'TransferOutboxDespatchToAnotherBranchResult');
  }
}

// ─── Send ────────────────────────────────────────────────

class DespatchSendMethods {
  constructor(private readonly ctx: ServiceContext) {}

  /** Send one or more despatch advices. Returns document identities. */
  async despatch(despatches: DespatchInfo[]): Promise<DespatchStatusInfo[]> {
    const raw = await this.ctx.call('SendDespatch', { despatches: { DespatchInfo: despatches } });
    return this.ctx.unwrapArray<DespatchStatusInfo>(raw, 'SendDespatchResult');
  }

  /** Send compressed despatch (base64 gzip). Optimized for large batches. */
  async compressedSend(data: string, hash: string): Promise<DespatchStatusInfo[]> {
    const raw = await this.ctx.call('CompressedSendDespatch', { data: { Data: data, Hash: hash } });
    return this.ctx.unwrapArray<DespatchStatusInfo>(raw, 'CompressedSendDespatchResult');
  }

  /** Save despatch(s) as draft without sending. */
  async saveAsDraft(despatches: DespatchInfo[]): Promise<DespatchStatusInfo[]> {
    const raw = await this.ctx.call('SaveAsDraft', { despatches: { DespatchInfo: despatches } });
    return this.ctx.unwrapArray<DespatchStatusInfo>(raw, 'SaveAsDraftResult');
  }

  /** Send existing draft despatches (changes status from Draft → Queued). */
  async sendDraft(despatchIds: string[]): Promise<boolean> {
    const raw = await this.ctx.call('SendDraft', { despatchIds: { string: despatchIds } });
    return this.ctx.unwrapFlag(raw, 'SendDraftResult');
  }

  /** Cancel draft despatches (reverts to draft state for editing). */
  async cancelDraft(despatchIds: string[]): Promise<boolean> {
    const raw = await this.ctx.call('CancelDraft', { despatchIds: { string: despatchIds } });
    return this.ctx.unwrapFlag(raw, 'CancelDraftResult');
  }

  /** Retry sending failed despatches. */
  async retrySend(despatchIds: string[]): Promise<void> {
    await this.ctx.call('RetrySendDespatches', { despatchIds: { string: despatchIds } });
  }

  /** Transform external data and send as despatch. */
  async transformAndSend(data: SoapRequestParams): Promise<DespatchStatusInfo[]> {
    const raw = await this.ctx.call('TransformAndSend', data);
    return this.ctx.unwrapArray<DespatchStatusInfo>(raw, 'TransformAndSendResult');
  }
}

// ─── Receipt Advice ──────────────────────────────────────

class ReceiptAdviceMethods {
  constructor(private readonly ctx: ServiceContext) {}

  /** List receipt advices (yanıt irsaliyesi) with filtering and pagination. */
  async list(query: DespatchListQuery = {}): Promise<PagedResult<ReceiptAdviceListItem>> {
    const raw = await this.ctx.call('GetInboxReceiptAdvicesList', { query: buildQuery(query) });
    return this.ctx.unwrapPaged<ReceiptAdviceListItem>(raw, 'GetInboxReceiptAdvicesListResult');
  }

  /** Get receipt advices (full UBL-TR data). */
  async get(query: DespatchQuery = {}): Promise<PagedResult<DespatchInfo>> {
    const raw = await this.ctx.call('GetInboxReceiptAdvices', { query: buildQuery(query) });
    return this.ctx.unwrapPaged<DespatchInfo>(raw, 'GetInboxReceiptAdvicesResult');
  }

  /** Get bulk receipt advice data (base64 XML). */
  async getData(query: DespatchQuery = {}): Promise<PagedResult<DespatchData>> {
    const raw = await this.ctx.call('GetInboxReceiptAdvicesData', { query: buildQuery(query) });
    return this.ctx.unwrapPaged<DespatchData>(raw, 'GetInboxReceiptAdvicesDataResult');
  }

  /** Send receipt advices. */
  async send(receiptAdvices: DespatchInfo[]): Promise<DespatchStatusInfo[]> {
    const raw = await this.ctx.call('SendReceiptAdvice', { receiptAdvices });
    return this.ctx.unwrapArray<DespatchStatusInfo>(raw, 'SendReceiptAdviceResult');
  }

  /** Send receipt advices as UBL-TR XML. */
  async sendUbl(receiptAdvices: DespatchInfo[]): Promise<DespatchStatusInfo[]> {
    const raw = await this.ctx.call('SendReceiptAdviceUbl', { receiptAdvices });
    return this.ctx.unwrapArray<DespatchStatusInfo>(raw, 'SendReceiptAdviceUblResult');
  }

  /** Save receipt advices as draft. */
  async saveAsDraft(receiptAdvices: DespatchInfo[]): Promise<DespatchStatusInfo[]> {
    const raw = await this.ctx.call('SaveReceiptAdviceAsDraft', { receiptAdvices });
    return this.ctx.unwrapArray<DespatchStatusInfo>(raw, 'SaveReceiptAdviceAsDraftResult');
  }

  /** Query status of receipt advices. */
  async queryStatus(receiptAdviceIds: string[]): Promise<ReceiptAdviceStatusInfo[]> {
    const raw = await this.ctx.call('QueryReceiptAdviceStatus', {
      receiptAdviceIds: { string: receiptAdviceIds },
    });
    return this.ctx.unwrapArray<ReceiptAdviceStatusInfo>(raw, 'QueryReceiptAdviceStatusResult');
  }

  /** Get receipt advice HTML view. */
  async getView(receiptAdviceId: string): Promise<DespatchViewResult> {
    const raw = await this.ctx.call('GetReceiptAdviceView', { receiptAdviceId });
    return this.ctx.unwrap<DespatchViewResult>(raw, 'GetReceiptAdviceViewResult');
  }

  /** Get receipt advice PDF as base64. */
  async getPdf(receiptAdviceId: string): Promise<DespatchData> {
    const raw = await this.ctx.call('GetReceiptAdvicePdf', { receiptAdviceId });
    return this.ctx.unwrap<DespatchData>(raw, 'GetReceiptAdvicePdfResult');
  }

  /** Mark receipt advices as "taken". */
  async markAsTaken(receiptAdviceIds: string[]): Promise<boolean> {
    const raw = await this.ctx.call('SetReceiptAdvicesTaken', {
      receiptAdvices: { string: receiptAdviceIds },
    });
    return this.ctx.unwrapFlag(raw, 'SetReceiptAdvicesTakenResult');
  }

  /** Mark despatch receipt advices as "taken". */
  async markDespatchReceiptsTaken(despatchIds: string[]): Promise<boolean> {
    const raw = await this.ctx.call('SetDespatchReceiptAdvicesTaken', {
      despatches: { string: despatchIds },
    });
    return this.ctx.unwrapFlag(raw, 'SetDespatchReceiptAdvicesTakenResult');
  }
}

// ─── Manage ──────────────────────────────────────────────

class DespatchManageMethods {
  constructor(private readonly ctx: ServiceContext) {}

  /** Validate a UBL-TR despatch XML against the schema. */
  async validate(despatch: DespatchInfo): Promise<boolean> {
    const raw = await this.ctx.call('ValidateDespath', { despatch });
    return this.ctx.unwrapFlag(raw, 'ValidateDespathResult');
  }

  /** Change archive status of despatches (move to/from archive). */
  async changeArchiveStatus(
    despatchIds: string[],
    isInbox: boolean,
    isArchived: boolean,
  ): Promise<boolean> {
    const raw = await this.ctx.call('ChangeDespatchArchiveStatus', {
      despatchIds: { string: despatchIds },
      isInbox,
      isArchived,
    });
    return this.ctx.unwrapFlag(raw, 'ChangeDespatchArchiveStatusResult');
  }

  /** Clone despatches (creates new draft copies with new IDs). */
  async clone(
    despatchIds: string[],
  ): Promise<{ SourceDespatchId: string; ClonedDespatchId: string }[]> {
    const raw = await this.ctx.call('CloneDespatches', { despatchesIds: { string: despatchIds } });
    return this.ctx.unwrapArray<{ SourceDespatchId: string; ClonedDespatchId: string }>(
      raw,
      'CloneDespatchesResult',
    );
  }

  /** Move despatches back to draft status for editing. */
  async moveToDraft(despatchIds: string[]): Promise<boolean> {
    const raw = await this.ctx.call('MoveToDraftStatus', { despatchIds: { string: despatchIds } });
    return this.ctx.unwrapFlag(raw, 'MoveToDraftStatusResult');
  }

  /** Get despatch envelope data (signed SOAP envelope). */
  async getEnvelope(despatchId: string, isInbox: boolean): Promise<DespatchEnvelopeData> {
    const raw = await this.ctx.call('GetDespatchEnvelope', { despatchId, isInbox });
    return this.ctx.unwrap<DespatchEnvelopeData>(raw, 'GetDespatchEnvelopeResult');
  }
}

// ─── Users ───────────────────────────────────────────────

class DespatchUserMethods {
  constructor(private readonly ctx: ServiceContext) {}

  /** Check if a VKN/TCKN is registered as e-Despatch user on GİB. */
  async isEDespatchUser(vknTckn: string, alias?: string): Promise<boolean> {
    const raw = await this.ctx.call('IsEDespatchUser', { vknTckn, alias });
    return this.ctx.unwrapFlag(raw, 'IsEDespatchUserResult');
  }

  /** Get paginated list of all e-Despatch users registered on GİB. */
  async getEDespatchUsers(pageIndex = 0, pageSize = 20): Promise<PagedResult<DespatchSystemUser>> {
    const raw = await this.ctx.call('GetEDespatchUsers', {
      pagination: { $attributes: buildPaginationAttrs(pageIndex, pageSize) },
    });
    return this.ctx.unwrapPaged<DespatchSystemUser>(raw, 'GetEDespatchUsersResult');
  }

  /** Filter e-Despatch users by VKN, title, or alias text. */
  async filter(
    filter: string,
    pageIndex = 0,
    pageSize = 20,
  ): Promise<PagedResult<DespatchSystemUser>> {
    const raw = await this.ctx.call('FilterEDespatchUsers', {
      context: { $attributes: buildPaginationAttrs(pageIndex, pageSize), Filter: filter },
    });
    return this.ctx.unwrapPaged<DespatchSystemUser>(raw, 'FilterEDespatchUsersResult');
  }

  /** Get user aliases (receiver/sender boxes) for a specific VKN. */
  async getAliases(vknTckn: string): Promise<DespatchUserAliases> {
    const raw = await this.ctx.call('GetUserAliasses', { vknTckn });
    return this.ctx.unwrap(raw, 'GetUserAliassesResult');
  }
}
