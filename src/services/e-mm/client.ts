// Uyumsoft SDK — e-MM (Producer Receipt / Müstahsil Makbuzu) Client (Enterprise)
import { BaseClient, type ServiceContext } from '../../core/base-client';
import { UYUMSOFT_ENDPOINTS, type UyumsoftConfig, type PagedResult } from '../../core/types';
import { toArray, SharedSystemMethods, buildOutboxContext } from '../../core/helpers';
import type {
  ProducerReceiptListQuery,
  ProducerReceiptListItem,
  ProducerReceiptStatusInfo,
  ProducerReceiptStatusWithLogInfo,
  ProducerReceiptData,
  ProducerReceiptDocumentIdentity,
  ClonedProducerReceiptInfo,
} from './types';

/**
 * e-MM (Müstahsil Makbuzu / Producer Receipt) client — wraps all 21 ProducerReceiptIntegration SOAP methods.
 */
export class EMmClient extends BaseClient {
  readonly system: SharedSystemMethods;
  readonly outbox: MmOutboxMethods;
  readonly send: MmSendMethods;
  readonly manage: MmManageMethods;

  constructor(config: UyumsoftConfig) {
    super(config, UYUMSOFT_ENDPOINTS.emm);
    this.system = new SharedSystemMethods(this.ctx);
    this.outbox = new MmOutboxMethods(this.ctx);
    this.send = new MmSendMethods(this.ctx);
    this.manage = new MmManageMethods(this.ctx);
  }
}

// ─── Helpers ─────────────────────────────────────────────

function mmContext(query: ProducerReceiptListQuery) {
  return buildOutboxContext(
    {
      Identifier: query.Identifier,
      Number: query.ReceiptNumber,
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
    'ReceiptNumber',
  );
}

// ─── Outbox ──────────────────────────────────────────────

class MmOutboxMethods {
  constructor(private readonly ctx: ServiceContext) {}

  async list(query: ProducerReceiptListQuery = {}): Promise<PagedResult<ProducerReceiptListItem>> {
    const raw = await this.ctx.call('QueryProducerReceiptList', { context: mmContext(query) });
    return this.ctx.unwrapPaged<ProducerReceiptListItem>(raw, 'QueryProducerReceiptListResult');
  }

  async get(producerReceiptId: string): Promise<ProducerReceiptData> {
    const raw = await this.ctx.call('GetProducerReceipt', { producerReceiptId });
    return this.ctx.unwrap<ProducerReceiptData>(raw, 'GetProducerReceiptResult');
  }

  async getData(producerReceiptId: string): Promise<ProducerReceiptData> {
    const raw = await this.ctx.call('GetProducerReceiptData', { producerReceiptId });
    return this.ctx.unwrap<ProducerReceiptData>(raw, 'GetProducerReceiptDataResult');
  }

  async getHtmlView(producerReceiptId: string): Promise<string> {
    const raw = await this.ctx.call('GetHtmlView', { producerReceiptId });
    return this.ctx.unwrapString(raw, 'GetHtmlViewResult');
  }

  async getPdf(producerReceiptId: string): Promise<ProducerReceiptData> {
    const raw = await this.ctx.call('GetPdfView', { producerReceiptId });
    return this.ctx.unwrap<ProducerReceiptData>(raw, 'GetPdfViewResult');
  }

  async getStatus(ettns: string[]): Promise<ProducerReceiptStatusInfo[]> {
    const raw = await this.ctx.call('QueryProducerReceiptStatus', {
      producerReceiptEttns: { string: ettns },
    });
    return toArray(this.ctx.unwrap<any>(raw, 'QueryProducerReceiptStatusResult'));
  }

  async getStatusWithLogs(ettns: string[]): Promise<ProducerReceiptStatusWithLogInfo[]> {
    const raw = await this.ctx.call('QueryProducerReceiptStatusWithLogs', {
      producerReceiptEttns: { string: ettns },
    });
    return toArray(this.ctx.unwrap<any>(raw, 'QueryProducerReceiptStatusWithLogsResult'));
  }
}

// ─── Send ────────────────────────────────────────────────

class MmSendMethods {
  constructor(private readonly ctx: ServiceContext) {}

  async producerReceipt(receipts: any[]): Promise<ProducerReceiptDocumentIdentity[]> {
    const raw = await this.ctx.call('SendProducerReceipt', { receipts });
    return toArray(this.ctx.unwrap<any>(raw, 'SendProducerReceiptResult'));
  }

  async saveAsDraft(receipts: any[]): Promise<ProducerReceiptDocumentIdentity[]> {
    const raw = await this.ctx.call('SaveAsDraft', { receipts });
    return toArray(this.ctx.unwrap<any>(raw, 'SaveAsDraftResult'));
  }

  async sendDraft(ettns: string[]): Promise<boolean> {
    const raw = await this.ctx.call('SendDraft', { receiptEttns: { string: ettns } });
    return this.ctx.unwrapFlag(raw, 'SendDraftResult');
  }

  async cancelDraft(ettns: string[]): Promise<boolean> {
    const raw = await this.ctx.call('CancelDraft', { receiptEttns: { string: ettns } });
    return this.ctx.unwrapFlag(raw, 'CancelDraftResult');
  }
}

// ─── Manage ──────────────────────────────────────────────

class MmManageMethods {
  constructor(private readonly ctx: ServiceContext) {}

  async cancel(ettn: string, cancelDate: string): Promise<boolean> {
    const raw = await this.ctx.call('CancelProducerReceipt', {
      cancellationContext: { $attributes: { ProducerReceiptEttn: ettn, CancelDate: cancelDate } },
    });
    return this.ctx.unwrapFlag(raw, 'CancelProducerReceiptResult');
  }

  async changeArchiveStatus(ettns: string[], isArchive: boolean): Promise<boolean> {
    const raw = await this.ctx.call('ChangeIsArchiveStatus', {
      receiptEtts: { string: ettns },
      isArchive,
    });
    return this.ctx.unwrapFlag(raw, 'ChangeIsArchiveStatusResult');
  }

  async moveToDraft(ettns: string[]): Promise<boolean> {
    const raw = await this.ctx.call('MoveToDraftStatus', { receiptEttns: { string: ettns } });
    return this.ctx.unwrapFlag(raw, 'MoveToDraftStatusResult');
  }

  async clone(ettn: string, createNewId = true): Promise<ClonedProducerReceiptInfo> {
    const raw = await this.ctx.call('CloneProducerReceipt', { receiptEttn: ettn, createNewId });
    return this.ctx.unwrap<ClonedProducerReceiptInfo>(raw, 'CloneProducerReceiptResult');
  }
}
