// Uyumsoft SDK — e-Fatura Client (Enterprise)
import { BaseClient } from '../../core/base-client';
import {
  UYUMSOFT_ENDPOINTS,
  type PagedResult,
  type SoapRequestParams,
  type UyumsoftConfig,
  type UyumsoftDocumentPayload,
} from '../../core/types';
import { SharedSystemMethods, buildPaginationAttrs } from '../../core/helpers';
import type {
  InboxInvoiceListQuery,
  OutboxInvoiceListQuery,
  InboxInvoiceQuery,
  InboxInvoiceListItem,
  OutboxInvoiceListItem,
  InvoiceInfo,
  InvoiceData,
  InvoiceStatusInfo,
  InvoiceStatusWithLogInfo,
  InvoiceIdentity,
  ViewResult,
  EnvelopeData,
  WhoAmIInfo,
  SystemUser,
  SystemUserWithAlias,
  AddressLookupResult,
  DocumentResponseInfo,
  SummaryReport,
  CustomerCreditInfo,
  CustomerReportPeriodFormat,
  QueryType,
  AliasType,
  InvoiceStatus,
  MailingInformation,
  SmsMessageInformation,
} from './types';
import type { ServiceContext } from '../../core/base-client';

/**
 * e-Fatura & e-Arşiv client — wraps all 64 Integration SOAP methods.
 *
 * Domain groups:
 * - `system` — Connection test, account info, dates, credit info
 * - `inbox`  — Incoming invoices (list, get, PDF, status, mark taken)
 * - `outbox` — Outgoing invoices (list, get, PDF, status, GTB)
 * - `send`   — Create/send invoices (draft, compressed)
 * - `manage` — Cancel, archive, clone, validate, XSLT templates
 * - `users`  — e-Invoice user lookup, aliases, address queries
 */
export class EFaturaClient extends BaseClient {
  readonly system: EFaturaSystemMethods;
  readonly inbox: InboxMethods;
  readonly outbox: OutboxMethods;
  readonly send: SendMethods;
  readonly manage: ManageMethods;
  readonly users: UserMethods;

  constructor(config: UyumsoftConfig) {
    super(config, UYUMSOFT_ENDPOINTS.efatura);
    this.system = new EFaturaSystemMethods(this.ctx);
    this.inbox = new InboxMethods(this.ctx);
    this.outbox = new OutboxMethods(this.ctx);
    this.send = new SendMethods(this.ctx);
    this.manage = new ManageMethods(this.ctx);
    this.users = new UserMethods(this.ctx);
  }
}

// ─── Helpers ─────────────────────────────────────────────

function buildListQuery(query: InboxInvoiceListQuery | OutboxInvoiceListQuery): SoapRequestParams {
  const { PageIndex, PageSize, ...rest } = query;
  const onlyNewestInvoices = 'OnlyNewestInvoices' in query ? query.OnlyNewestInvoices : undefined;
  const body: SoapRequestParams = { ...rest };
  delete body.OnlyNewestInvoices;

  return {
    $attributes: {
      ...buildPaginationAttrs(PageIndex, PageSize),
      ...(onlyNewestInvoices != null ? { OnlyNewestInvoices: onlyNewestInvoices } : {}),
    },
    ...body,
  };
}

function buildInvoiceQuery(query: InboxInvoiceQuery): SoapRequestParams {
  const { PageIndex, PageSize, ...rest } = query;
  return {
    $attributes: {
      ...buildPaginationAttrs(PageIndex, PageSize),
      ...(query.SetTaken != null ? { SetTaken: query.SetTaken } : {}),
      ...(query.OnlyNewestInvoices != null ? { OnlyNewestInvoices: query.OnlyNewestInvoices } : {}),
    },
    ...rest,
  };
}

// ─── System (extends shared) ─────────────────────────────

class EFaturaSystemMethods extends SharedSystemMethods {
  /** Test API connection and credentials. Returns `true` if connection is valid. */
  async testConnection(): Promise<boolean> {
    const raw = await this.ctx.call('TestConnection');
    return this.ctx.unwrapFlag(raw, 'TestConnectionResult');
  }

  /** Get account information (user, customer, company, services). */
  async whoAmI(): Promise<WhoAmIInfo> {
    const raw = await this.ctx.call('WhoAmI');
    return this.ctx.unwrap<WhoAmIInfo>(raw, 'WhoAmIResult');
  }

  /** Get formatted system date using the provided format string. */
  async getDateFormatted(format: string): Promise<string> {
    const raw = await this.ctx.call('GetSystemDateWithFormat', { format });
    return this.ctx.unwrapString(raw, 'GetSystemDateWithFormatResult');
  }

  /** Get summary usage report for the given date range. */
  async getSummaryReport(
    startDate: string,
    endDate: string,
    periodFormat: CustomerReportPeriodFormat = 'Auto',
  ): Promise<SummaryReport> {
    const raw = await this.ctx.call('GetSummaryReport', { startDate, endDate, periodFormat });
    return this.ctx.unwrap<SummaryReport>(raw, 'GetSummaryReportResult');
  }

  /** Get customer credit/subscription info (remaining credits, contract period). */
  async getCreditInfo(): Promise<CustomerCreditInfo[]> {
    const raw = await this.ctx.call('GetCustomerCreditInfo');
    return this.ctx.unwrapArray<CustomerCreditInfo>(raw, 'GetCustomerCreditInfoResult');
  }

  /** Get user verification info without credential check. */
  async getUserInfo(): Promise<WhoAmIInfo> {
    const raw = await this.ctx.call('UserInfoWithNoCheck');
    return this.ctx.unwrap<WhoAmIInfo>(raw, 'UserInfoWithNoCheckResult');
  }
}

// ─── Inbox Methods ───────────────────────────────────────

class InboxMethods {
  constructor(private readonly ctx: ServiceContext) {}

  /** List incoming invoices with filtering, sorting, and pagination. */
  async list(query: InboxInvoiceListQuery = {}): Promise<PagedResult<InboxInvoiceListItem>> {
    const raw = await this.ctx.call('GetInboxInvoiceList', { query: buildListQuery(query) });
    return this.ctx.unwrapPaged<InboxInvoiceListItem>(raw, 'GetInboxInvoiceListResult');
  }

  /** Get full incoming invoices (includes UBL-TR XML). */
  async getInvoices(query: InboxInvoiceQuery = {}): Promise<PagedResult<InvoiceInfo>> {
    const raw = await this.ctx.call('GetInboxInvoices', { query: buildInvoiceQuery(query) });
    return this.ctx.unwrapPaged<InvoiceInfo>(raw, 'GetInboxInvoicesResult');
  }

  /** Get a single incoming invoice by ID (full UBL-TR XML). */
  async get(invoiceId: string): Promise<InvoiceInfo> {
    const raw = await this.ctx.call('GetInboxInvoice', { invoiceId });
    return this.ctx.unwrap<InvoiceInfo>(raw, 'GetInboxInvoiceResult');
  }

  /** Get invoice raw data (base64 encoded XML). */
  async getData(invoiceId: string): Promise<InvoiceData> {
    const raw = await this.ctx.call('GetInboxInvoiceData', { invoiceId });
    return this.ctx.unwrap<InvoiceData>(raw, 'GetInboxInvoiceDataResult');
  }

  /** Get bulk invoice raw data with pagination. */
  async getBulkData(query: InboxInvoiceQuery = {}): Promise<PagedResult<InvoiceData>> {
    const raw = await this.ctx.call('GetInboxInvoicesData', { query: buildInvoiceQuery(query) });
    return this.ctx.unwrapPaged<InvoiceData>(raw, 'GetInboxInvoicesDataResult');
  }

  /** Get invoice PDF as base64. */
  async getPdf(invoiceId: string): Promise<InvoiceData> {
    const raw = await this.ctx.call('GetInboxInvoicePdf', { invoiceId });
    return this.ctx.unwrap<InvoiceData>(raw, 'GetInboxInvoicePdfResult');
  }

  /** Get invoice HTML view (rendered with XSLT). */
  async getView(invoiceId: string): Promise<ViewResult> {
    const raw = await this.ctx.call('GetInboxInvoiceView', { invoiceId });
    return this.ctx.unwrap<ViewResult>(raw, 'GetInboxInvoiceViewResult');
  }

  /** Query status of one or more inbox invoices. */
  async getStatus(invoiceIds: string[]): Promise<InvoiceStatusInfo[]> {
    const raw = await this.ctx.call('QueryInboxInvoiceStatus', {
      invoiceIds: { string: invoiceIds },
    });
    return this.ctx.unwrapArray<InvoiceStatusInfo>(raw, 'QueryInboxInvoiceStatusResult');
  }

  /** Get invoice status with detailed processing logs. */
  async getStatusWithLogs(invoiceIds: string[]): Promise<InvoiceStatusWithLogInfo[]> {
    const raw = await this.ctx.call('GetInboxInvoiceStatusWithLogs', {
      invoiceIds: { string: invoiceIds },
    });
    return this.ctx.unwrapArray<InvoiceStatusWithLogInfo>(
      raw,
      'GetInboxInvoiceStatusWithLogsResult',
    );
  }

  /** Mark invoices as "taken" (prevents re-fetching by `SetTaken` queries). */
  async markAsTaken(invoiceIds: string[]): Promise<boolean> {
    const raw = await this.ctx.call('SetInvoicesTaken', { invoices: { string: invoiceIds } });
    return this.ctx.unwrapFlag(raw, 'SetInvoicesTakenResult');
  }

  /** Send document response (accept/decline incoming commercial invoices). */
  async sendResponse(responses: DocumentResponseInfo[]): Promise<boolean> {
    const raw = await this.ctx.call('SendDocumentResponse', {
      responses: { DocumentResponseInfo: responses },
    });
    return this.ctx.unwrapFlag(raw, 'SendDocumentResponseResult');
  }

  /** Query document response status for invoice IDs. */
  async queryResponseStatus(invoiceIds: string[]): Promise<InvoiceStatusInfo[]> {
    const raw = await this.ctx.call('QueryDocumentResponseStatus', {
      invoiceIds: { string: invoiceIds },
    });
    return this.ctx.unwrapArray<InvoiceStatusInfo>(raw, 'QueryDocumentResponseStatusResult');
  }
}

// ─── Outbox Methods ──────────────────────────────────────

class OutboxMethods {
  constructor(private readonly ctx: ServiceContext) {}

  /** List outgoing invoices with filtering, sorting, and pagination. */
  async list(query: OutboxInvoiceListQuery = {}): Promise<PagedResult<OutboxInvoiceListItem>> {
    const raw = await this.ctx.call('GetOutboxInvoiceList', { query: buildListQuery(query) });
    return this.ctx.unwrapPaged<OutboxInvoiceListItem>(raw, 'GetOutboxInvoiceListResult');
  }

  /** Get full outgoing invoices (includes UBL-TR XML). */
  async getInvoices(query: InboxInvoiceQuery = {}): Promise<PagedResult<InvoiceInfo>> {
    const raw = await this.ctx.call('GetOutboxInvoices', { query: buildInvoiceQuery(query) });
    return this.ctx.unwrapPaged<InvoiceInfo>(raw, 'GetOutboxInvoicesResult');
  }

  /** Get a single outgoing invoice by ID. */
  async get(invoiceId: string): Promise<InvoiceInfo> {
    const raw = await this.ctx.call('GetOutboxInvoice', { invoiceId });
    return this.ctx.unwrap<InvoiceInfo>(raw, 'GetOutboxInvoiceResult');
  }

  /** Get invoice raw XML data (base64 encoded). */
  async getData(invoiceId: string): Promise<InvoiceData> {
    const raw = await this.ctx.call('GetOutboxInvoiceData', { invoiceId });
    return this.ctx.unwrap<InvoiceData>(raw, 'GetOutboxInvoiceDataResult');
  }

  /** Get bulk invoice raw data with pagination. */
  async getBulkData(query: InboxInvoiceQuery = {}): Promise<PagedResult<InvoiceData>> {
    const raw = await this.ctx.call('GetOutboxInvoicesData', { query: buildInvoiceQuery(query) });
    return this.ctx.unwrapPaged<InvoiceData>(raw, 'GetOutboxInvoicesDataResult');
  }

  /** Get invoice PDF as base64. */
  async getPdf(invoiceId: string): Promise<InvoiceData> {
    const raw = await this.ctx.call('GetOutboxInvoicePdf', { invoiceId });
    return this.ctx.unwrap<InvoiceData>(raw, 'GetOutboxInvoicePdfResult');
  }

  /** Get invoice HTML view (rendered with XSLT). */
  async getView(invoiceId: string): Promise<ViewResult> {
    const raw = await this.ctx.call('GetOutboxInvoiceView', { invoiceId });
    return this.ctx.unwrap<ViewResult>(raw, 'GetOutboxInvoiceViewResult');
  }

  /** Get outbox invoice response view (for commercial invoices). */
  async getResponseView(invoiceId: string): Promise<ViewResult> {
    const raw = await this.ctx.call('GetOutboxInvoiceResponseView', { invoiceId });
    return this.ctx.unwrap<ViewResult>(raw, 'GetOutboxInvoiceResponseViewResult');
  }

  /** Query status of one or more outbox invoices. */
  async getStatus(invoiceIds: string[]): Promise<InvoiceStatusInfo[]> {
    const raw = await this.ctx.call('QueryOutboxInvoiceStatus', {
      invoiceIds: { string: invoiceIds },
    });
    return this.ctx.unwrapArray<InvoiceStatusInfo>(raw, 'QueryOutboxInvoiceStatusResult');
  }

  /** Get invoice status with detailed processing logs. */
  async getStatusWithLogs(invoiceIds: string[]): Promise<InvoiceStatusWithLogInfo[]> {
    const raw = await this.ctx.call('GetOutboxInvoiceStatusWithLogs', {
      invoiceIds: { string: invoiceIds },
    });
    return this.ctx.unwrapArray<InvoiceStatusWithLogInfo>(
      raw,
      'GetOutboxInvoiceStatusWithLogsResult',
    );
  }

  /** Query GTB (Customs) responses for export invoices. */
  async queryGtbResponses(invoiceIds: string[]): Promise<InvoiceStatusInfo[]> {
    const raw = await this.ctx.call('QueryInvoiceGtbResponses', {
      invoiceIds: { string: invoiceIds },
    });
    return this.ctx.unwrapArray<InvoiceStatusInfo>(raw, 'QueryInvoiceGtbResponsesResult');
  }
}

// ─── Send Methods ────────────────────────────────────────

class SendMethods {
  constructor(private readonly ctx: ServiceContext) {}

  /** Send one or more invoices. Returns document identities with assigned IDs. */
  async invoice(invoices: InvoiceInfo[]): Promise<InvoiceIdentity[]> {
    const raw = await this.ctx.call('SendInvoice', { invoices: { InvoiceInfo: invoices } });
    return this.ctx.unwrapArray<InvoiceIdentity>(raw, 'SendInvoiceResult');
  }

  /** Save invoice(s) as draft without sending. */
  async saveAsDraft(invoices: InvoiceInfo[]): Promise<InvoiceIdentity[]> {
    const raw = await this.ctx.call('SaveAsDraft', { invoices: { InvoiceInfo: invoices } });
    return this.ctx.unwrapArray<InvoiceIdentity>(raw, 'SaveAsDraftResult');
  }

  /** Send compressed invoice (base64 gzip). Optimized for large batches. */
  async compressedSend(data: string, hash: string): Promise<InvoiceIdentity[]> {
    const raw = await this.ctx.call('CompressedSendInvoice', { data: { Data: data, Hash: hash } });
    return this.ctx.unwrapArray<InvoiceIdentity>(raw, 'CompressedSendInvoiceResult');
  }

  /** Save compressed invoice as draft. */
  async compressedSaveAsDraft(data: string, hash: string): Promise<InvoiceIdentity[]> {
    const raw = await this.ctx.call('CompressedSaveAsDraft', { data: { Data: data, Hash: hash } });
    return this.ctx.unwrapArray<InvoiceIdentity>(raw, 'CompressedSaveAsDraftResult');
  }

  /** Send existing draft invoices (changes status from Draft → Queued). */
  async sendDraft(invoiceIds: string[]): Promise<boolean> {
    const raw = await this.ctx.call('SendDraft', { invoiceIds: { string: invoiceIds } });
    return this.ctx.unwrapFlag(raw, 'SendDraftResult');
  }

  /** Cancel draft invoices (reverts to draft state for editing). */
  async cancelDraft(invoiceIds: string[]): Promise<boolean> {
    const raw = await this.ctx.call('CancelDraft', { invoiceIds: { string: invoiceIds } });
    return this.ctx.unwrapFlag(raw, 'CancelDraftResult');
  }
}

// ─── Manage Methods ──────────────────────────────────────

class ManageMethods {
  constructor(private readonly ctx: ServiceContext) {}

  /** Validate a UBL-TR invoice XML against the schema. */
  async validate(invoice: UyumsoftDocumentPayload): Promise<boolean> {
    const raw = await this.ctx.call('ValidateInvoice', { invoice });
    return this.ctx.unwrapFlag(raw, 'ValidateInvoiceResult');
  }

  /** Cancel an e-Archive invoice. Not applicable for e-Invoice. */
  async cancelEArchive(invoiceId: string, cancelDate: string): Promise<boolean> {
    const raw = await this.ctx.call('CancelEArchiveInvoice', {
      request: { $attributes: { InvoiceId: invoiceId, CancelDate: cancelDate } },
    });
    return this.ctx.unwrapFlag(raw, 'CancelEArchiveInvoiceResult');
  }

  /** Recover a previously canceled e-Archive invoice. */
  async recoverEArchiveCancel(documentId: string): Promise<boolean> {
    const raw = await this.ctx.call('RecoverEArchiveCancel', { documentId });
    return this.ctx.unwrapFlag(raw, 'RecoverEArchiveCancelResult');
  }

  /** Change archive status of invoices (move to/from archive). */
  async changeArchiveStatus(
    invoiceIds: string[],
    isInbox: boolean,
    isArchived: boolean,
  ): Promise<boolean> {
    const raw = await this.ctx.call('ChangeInvoiceArchiveStatus', {
      invoiceIds: { string: invoiceIds },
      isInbox,
      isArchived,
    });
    return this.ctx.unwrapFlag(raw, 'ChangeInvoiceArchiveStatusResult');
  }

  /** Move invoices back to draft status for editing. */
  async moveToDraft(invoiceIds: string[]): Promise<boolean> {
    const raw = await this.ctx.call('MoveToDraftStatus', { invoiceIds: { string: invoiceIds } });
    return this.ctx.unwrapFlag(raw, 'MoveToDraftStatusResult');
  }

  /** Clone invoices (creates new draft copies with new IDs). */
  async clone(
    invoiceIds: string[],
  ): Promise<{ SourceInvoiceId: string; ClonedInvoiceId: string }[]> {
    const raw = await this.ctx.call('CloneInvoices', { invoiceIds: { string: invoiceIds } });
    return this.ctx.unwrapArray<{ SourceInvoiceId: string; ClonedInvoiceId: string }>(
      raw,
      'CloneInvoicesResult',
    );
  }

  /** Retry sending failed invoices. */
  async retrySend(invoiceIds: string[]): Promise<void> {
    const raw = await this.ctx.call('RetrySendInvoices', { invoiceIds: { string: invoiceIds } });
    this.ctx.unwrapFlag(raw, 'RetrySendInvoicesResult');
  }

  /** Import an existing invoice file. Returns the assigned document ID. */
  async importInvoice(fileName: string, fileData: string): Promise<string> {
    const raw = await this.ctx.call('ImportExistingInvoice', {
      request: { $attributes: { FileName: fileName }, FileData: fileData },
    });
    return this.ctx.unwrapString(raw, 'ImportExistingInvoiceResult');
  }

  /** Get invoice envelope data (signed SOAP envelope). */
  async getEnvelope(invoiceId: string, isInbox: boolean): Promise<EnvelopeData> {
    const raw = await this.ctx.call('GetInvoiceEnvelope', { invoiceId, isInbox });
    return this.ctx.unwrap<EnvelopeData>(raw, 'GetInvoiceEnvelopeResult');
  }

  /** Transfer inbox invoice to another branch. */
  async transferToBranch(invoiceIds: string[], targetBranchAlias: string): Promise<boolean> {
    const raw = await this.ctx.call('TransferInboxInvoiceToAnotherBranch', {
      invoiceIds: { string: invoiceIds },
      targetBranchAlias,
    });
    return this.ctx.unwrapFlag(raw, 'TransferInboxInvoiceToAnotherBranchResult');
  }

  /** Queue invoice notification (email/SMS delivery). */
  async queueNotification(
    documentId: string,
    mailing?: MailingInformation[],
    messaging?: SmsMessageInformation[],
  ): Promise<boolean> {
    const raw = await this.ctx.call('QueueInvoiceNotification', {
      request: {
        $attributes: { DocumentId: documentId },
        ...(mailing ? { Mailing: mailing } : {}),
        ...(messaging ? { Messaging: messaging } : {}),
      },
    });
    return this.ctx.unwrapFlag(raw, 'QueueInvoiceNotificationResult');
  }

  /** Create invoices from despatch documents. */
  async createFromDespatches(
    documentIds: string[],
    status: InvoiceStatus,
  ): Promise<OutboxInvoiceListItem> {
    const raw = await this.ctx.call('QueueInvoiceFromDespatches', {
      documentIds: { string: documentIds },
      status,
    });
    return this.ctx.unwrap<OutboxInvoiceListItem>(raw, 'QueueInvoiceFromDespatchesResult');
  }

  /** Upload a custom XSLT view template. */
  async setXsltView(type: string, fileContent: string): Promise<boolean> {
    const raw = await this.ctx.call('SetXsltView', { type, fileContent });
    return this.ctx.unwrapFlag(raw, 'SetXsltViewResult');
  }

  /** Download the current XSLT view template. */
  async getXsltView(type: string): Promise<string> {
    const raw = await this.ctx.call('GetXsltView', { type });
    return this.ctx.unwrapString(raw, 'GetXsltViewResult');
  }
}

// ─── User Methods ────────────────────────────────────────

class UserMethods {
  constructor(private readonly ctx: ServiceContext) {}

  /** Check if a VKN/TCKN is registered as e-Invoice user on GİB. */
  async isEInvoiceUser(vknTckn: string, alias?: string): Promise<boolean> {
    const raw = await this.ctx.call('IsEInvoiceUser', { vknTckn, alias });
    return this.ctx.unwrapFlag(raw, 'IsEInvoiceUserResult');
  }

  /** Get paginated list of all e-Invoice users registered on GİB. */
  async getEInvoiceUsers(pageIndex = 0, pageSize = 20): Promise<PagedResult<SystemUser>> {
    const raw = await this.ctx.call('GetEInvoiceUsers', {
      pagination: { $attributes: buildPaginationAttrs(pageIndex, pageSize) },
    });
    return this.ctx.unwrapPaged<SystemUser>(raw, 'GetEInvoiceUsersResult');
  }

  /** Filter e-Invoice users by VKN, title, or alias text. */
  async filter(filter: string, pageIndex = 0, pageSize = 20): Promise<PagedResult<SystemUser>> {
    const raw = await this.ctx.call('FilterEInvoiceUsers', {
      context: { $attributes: buildPaginationAttrs(pageIndex, pageSize), Filter: filter },
    });
    return this.ctx.unwrapPaged<SystemUser>(raw, 'FilterEInvoiceUsersResult');
  }

  /** Get user aliases (receiver/sender boxes) for a specific VKN. */
  async getAliases(vknTckn: string): Promise<SystemUserWithAlias> {
    const raw = await this.ctx.call('GetUserAliasses', { vknTckn });
    return this.ctx.unwrap<SystemUserWithAlias>(raw, 'GetUserAliassesResult');
  }

  /** Look up address info from GİB/TURMOB by VKN/TCKN. */
  async getAddressFromVkn(
    vknTckn: string,
    queryType: QueryType = 'Normal',
  ): Promise<AddressLookupResult> {
    const raw = await this.ctx.call('TryToGetAddressFromVknTckn', { vknTckn, queryType });
    return this.ctx.unwrap<AddressLookupResult>(raw, 'TryToGetAddressFromVknTcknResult');
  }

  /** Get compressed system users list (base64 gzip). */
  async getCompressedList(type: AliasType): Promise<string> {
    const raw = await this.ctx.call('GetSystemUsersCompressedList', { type });
    return this.ctx.unwrapString(raw, 'GetSystemUsersCompressedListResult');
  }
}
