// Uyumsoft SDK — e-SMM (Voucher) Client (Enterprise)
import { BaseClient, type ServiceContext } from '../../core/base-client';
import { UYUMSOFT_ENDPOINTS, type UyumsoftConfig, type PagedResult } from '../../core/types';
import { SharedSystemMethods, buildOutboxContext, buildPaginationAttrs } from '../../core/helpers';
import type {
  VoucherListQuery,
  VoucherListItem,
  InboxVoucherListItem,
  VoucherStatusInfo,
  VoucherStatusWithLogInfo,
  VoucherData,
  VoucherDocumentIdentity,
  ClonedVoucherInfo,
  VoucherPayload,
} from './types';

/**
 * e-SMM (Serbest Meslek Makbuzu / Voucher) client — wraps all 21 VoucherIntegration SOAP methods.
 *
 * Domain groups:
 * - `system`  — System date, document URL, service discovery
 * - `outbox`  — Outgoing vouchers (list, status, PDF, HTML, source XML)
 * - `inbox`   — Incoming vouchers (list, PDF, archive management)
 * - `send`    — Create/send vouchers (draft, send draft, cancel draft)
 * - `manage`  — Cancel, recover, archive, draft management, clone
 */
export class ESmmClient extends BaseClient {
  readonly system: SharedSystemMethods;
  readonly outbox: SmmOutboxMethods;
  readonly inbox: SmmInboxMethods;
  readonly send: SmmSendMethods;
  readonly manage: SmmManageMethods;

  constructor(config: UyumsoftConfig) {
    super(config, UYUMSOFT_ENDPOINTS.esmm);
    this.system = new SharedSystemMethods(this.ctx);
    this.outbox = new SmmOutboxMethods(this.ctx);
    this.inbox = new SmmInboxMethods(this.ctx);
    this.send = new SmmSendMethods(this.ctx);
    this.manage = new SmmManageMethods(this.ctx);
  }
}

// ─── Helpers ─────────────────────────────────────────────

function smmOutboxContext(query: VoucherListQuery) {
  return buildOutboxContext(
    {
      Identifier: query.Identifier,
      Number: query.VoucherNumber,
      TargetTitle: query.TargetTitle,
      TargetVknTckn: query.TargetVknTckn,
      StartDate: query.StartDate,
      EndDate: query.EndDate,
      IsArchived: query.IsArchived,
      SortMode: query.SortMode,
      PayableAmountBegin: query.PayableAmountBegin,
      PayableAmountEnd: query.PayableAmountEnd,
      PageIndex: query.PageIndex,
      PageSize: query.PageSize,
    },
    'VoucherNumber',
  );
}

function smmInboxContext(query: VoucherListQuery) {
  return {
    $attributes: buildPaginationAttrs(query.PageIndex, query.PageSize),
    SortAscending: query.SortMode === 'Ascending',
    CreationDate: { Begin: null, End: null },
    DocumentDate: { Begin: query.StartDate ?? null, End: query.EndDate ?? null },
    IsValidXmlDocument: null,
    DeliveryType: null,
    IsArchived: query.IsArchived ?? null,
    PayableAmount: { Begin: query.PayableAmountBegin ?? null, End: query.PayableAmountEnd ?? null },
  };
}

// ─── Outbox ──────────────────────────────────────────────

class SmmOutboxMethods {
  constructor(private readonly ctx: ServiceContext) {}

  /** List outgoing vouchers with filtering and pagination. */
  async list(query: VoucherListQuery = {}): Promise<PagedResult<VoucherListItem>> {
    const raw = await this.ctx.call('QueryVoucherList', { context: smmOutboxContext(query) });
    return this.ctx.unwrapPaged<VoucherListItem>(raw, 'QueryVoucherListResult');
  }

  /** Query status of one or more vouchers by ETTN. */
  async getStatus(voucherEttns: string[]): Promise<VoucherStatusInfo[]> {
    const raw = await this.ctx.call('QueryVoucherStatus', {
      voucherEttns: { string: voucherEttns },
    });
    return this.ctx.unwrapArray<VoucherStatusInfo>(raw, 'QueryVoucherStatusResult');
  }

  /** Get voucher status with detailed processing logs. */
  async getStatusWithLogs(receiptIds: string[]): Promise<VoucherStatusWithLogInfo[]> {
    const raw = await this.ctx.call('QueryVoucherStatusWithLogs', {
      receiptIds: { string: receiptIds },
    });
    return this.ctx.unwrapArray<VoucherStatusWithLogInfo>(raw, 'QueryVoucherStatusWithLogsResult');
  }

  /** Get voucher source XML data. */
  async getSource(documentId: string): Promise<VoucherData> {
    const raw = await this.ctx.call('GetVoucherSource', { documentId });
    return this.ctx.unwrap<VoucherData>(raw, 'GetVoucherSourceResult');
  }

  /** Get voucher as signed PDF (base64). */
  async getSignedPdf(documentId: string): Promise<VoucherData> {
    const raw = await this.ctx.call('GetSignedPdf', { documentId });
    return this.ctx.unwrap<VoucherData>(raw, 'GetSignedPdfResult');
  }

  /** Get voucher HTML view (rendered with XSLT). */
  async getHtmlView(documentId: string): Promise<string> {
    const raw = await this.ctx.call('GetHtmlView', { documentId });
    return this.ctx.unwrapString(raw, 'GetHtmlViewResult');
  }

  /** Get voucher PDF (base64). */
  async getPdf(documentId: string): Promise<VoucherData> {
    const raw = await this.ctx.call('GetPdf', { documentId });
    return this.ctx.unwrap<VoucherData>(raw, 'GetPdfResult');
  }
}

// ─── Inbox ───────────────────────────────────────────────

class SmmInboxMethods {
  constructor(private readonly ctx: ServiceContext) {}

  /** List incoming vouchers with filtering and pagination. */
  async list(query: VoucherListQuery = {}): Promise<PagedResult<InboxVoucherListItem>> {
    const raw = await this.ctx.call('QueryInboxVoucherList', { context: smmInboxContext(query) });
    return this.ctx.unwrapPaged<InboxVoucherListItem>(raw, 'QueryInboxVoucherListResult');
  }

  /** Get incoming voucher PDF (base64). */
  async getPdf(documentId: string): Promise<VoucherData> {
    const raw = await this.ctx.call('GetInboxVoucherPdf', { documentId });
    return this.ctx.unwrap<VoucherData>(raw, 'GetInboxVoucherPdfResult');
  }

  /** Change archive status of incoming vouchers. */
  async changeArchiveStatus(voucherEtts: string[], isArchive: boolean): Promise<boolean> {
    const raw = await this.ctx.call('ChangeInboxVoucherIsArchiveStatus', {
      voucherEtts: { string: voucherEtts },
      isArchive,
    });
    return this.ctx.unwrapFlag(raw, 'ChangeInboxVoucherIsArchiveStatusResult');
  }
}

// ─── Send ────────────────────────────────────────────────

class SmmSendMethods {
  constructor(private readonly ctx: ServiceContext) {}

  /** Send one or more vouchers. Returns document identities with assigned numbers. */
  async voucher(vouchers: VoucherPayload[]): Promise<VoucherDocumentIdentity[]> {
    const raw = await this.ctx.call('SendVoucher', { vouchers: { VoucherSource: vouchers } });
    return this.ctx.unwrapArray<VoucherDocumentIdentity>(raw, 'SendVoucherResult');
  }

  /** Save voucher(s) as draft without sending. */
  async saveAsDraft(vouchers: VoucherPayload[]): Promise<VoucherDocumentIdentity[]> {
    const raw = await this.ctx.call('SaveAsDraft', { vouchers: { VoucherSource: vouchers } });
    return this.ctx.unwrapArray<VoucherDocumentIdentity>(raw, 'SaveAsDraftResult');
  }

  /** Send existing draft vouchers (changes status from Draft → Queued). */
  async sendDraft(voucherEttns: string[]): Promise<boolean> {
    const raw = await this.ctx.call('SendDraft', { voucherEttns: { string: voucherEttns } });
    return this.ctx.unwrapFlag(raw, 'SendDraftResult');
  }

  /** Cancel draft vouchers. */
  async cancelDraft(voucherEttns: string[]): Promise<boolean> {
    const raw = await this.ctx.call('CancelDraft', { voucherEttns: { string: voucherEttns } });
    return this.ctx.unwrapFlag(raw, 'CancelDraftResult');
  }
}

// ─── Manage ──────────────────────────────────────────────

class SmmManageMethods {
  constructor(private readonly ctx: ServiceContext) {}

  /** Cancel a sent voucher. */
  async cancel(voucherEttn: string, cancelDate: string): Promise<boolean> {
    const raw = await this.ctx.call('CancelVoucher', {
      cancellationContext: { $attributes: { VoucherEttn: voucherEttn, CancelDate: cancelDate } },
    });
    return this.ctx.unwrapFlag(raw, 'CancelVoucherResult');
  }

  /** Recover a previously canceled voucher. */
  async recoverCancel(documentId: string): Promise<boolean> {
    const raw = await this.ctx.call('RecoverFromCancel', { documentId });
    return this.ctx.unwrapFlag(raw, 'RecoverFromCancelResult');
  }

  /** Change archive status of outgoing vouchers. */
  async changeArchiveStatus(voucherEtts: string[], isArchive: boolean): Promise<boolean> {
    const raw = await this.ctx.call('ChangeIsArchiveStatus', {
      voucherEtts: { string: voucherEtts },
      isArchive,
    });
    return this.ctx.unwrapFlag(raw, 'ChangeIsArchiveStatusResult');
  }

  /** Move vouchers back to draft status for editing. */
  async moveToDraft(voucherEttns: string[]): Promise<boolean> {
    const raw = await this.ctx.call('MoveToDraftStatus', {
      voucherEttns: { string: voucherEttns },
    });
    return this.ctx.unwrapFlag(raw, 'MoveToDraftStatusResult');
  }

  /** Clone a voucher (creates a new draft copy). */
  async clone(voucherEttn: string, createNewId = true): Promise<ClonedVoucherInfo> {
    const raw = await this.ctx.call('CloneVoucher', { voucherEttn, createNewId });
    return this.ctx.unwrap<ClonedVoucherInfo>(raw, 'CloneVoucherResult');
  }
}
