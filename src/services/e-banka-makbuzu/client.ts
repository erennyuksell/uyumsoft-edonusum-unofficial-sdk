// Uyumsoft SDK — e-Banka Makbuzu (BankReceipt) Client
import { BaseClient, type ServiceContext } from '../../core/base-client';
import { UYUMSOFT_ENDPOINTS, type UyumsoftConfig, type PagedResult } from '../../core/types';
import { toArray, SharedSystemMethods, buildPaginationAttrs } from '../../core/helpers';
import type {
  BankReceiptListItem,
  BankReceiptStatusInfo,
  BankReceiptStatusWithLogInfo,
  BankReceiptData,
  BankReceiptIdentity,
} from './types';

/**
 * e-Banka Makbuzu client — Banka tahsilat makbuzu.
 * 22 methods: system + send/draft, HTML/PDF, status, query, cancel.
 */
export class EBankaMakbuzuClient extends BaseClient {
  readonly system: SharedSystemMethods;
  readonly outbox: BankReceiptOutboxMethods;
  readonly send: BankReceiptSendMethods;

  constructor(config: UyumsoftConfig) {
    super(config, UYUMSOFT_ENDPOINTS.ebankamakbuzu);
    this.system = new SharedSystemMethods(this.ctx);
    this.outbox = new BankReceiptOutboxMethods(this.ctx);
    this.send = new BankReceiptSendMethods(this.ctx);
  }
}

class BankReceiptOutboxMethods {
  constructor(private readonly ctx: ServiceContext) {}

  async list(pageIndex = 0, pageSize = 20): Promise<PagedResult<BankReceiptListItem>> {
    const raw = await this.ctx.call('QueryBankReceiptList', {
      context: { $attributes: buildPaginationAttrs(pageIndex, pageSize) },
    });
    return this.ctx.unwrapPaged<BankReceiptListItem>(raw, 'QueryBankReceiptListResult');
  }

  async get(documentId: string): Promise<BankReceiptData> {
    const raw = await this.ctx.call('GetBankReceipt', { documentId });
    return this.ctx.unwrap<BankReceiptData>(raw, 'GetBankReceiptResult');
  }

  async getData(documentId: string): Promise<BankReceiptData> {
    const raw = await this.ctx.call('GetBankReceiptData', { documentId });
    return this.ctx.unwrap<BankReceiptData>(raw, 'GetBankReceiptDataResult');
  }

  async getHtml(documentId: string): Promise<string> {
    const raw = await this.ctx.call('GetHtmlView', { documentId });
    return this.ctx.unwrapString(raw, 'GetHtmlViewResult');
  }

  async getPdf(documentId: string): Promise<string> {
    const raw = await this.ctx.call('GetPdfView', { documentId });
    return this.ctx.unwrapString(raw, 'GetPdfViewResult');
  }

  async getStatus(ettns: string[]): Promise<BankReceiptStatusInfo[]> {
    const raw = await this.ctx.call('QueryBankReceiptStatus', { receiptIds: { string: ettns } });
    return toArray(this.ctx.unwrap<any>(raw, 'QueryBankReceiptStatusResult'));
  }

  async getStatusWithLogs(ettns: string[]): Promise<BankReceiptStatusWithLogInfo[]> {
    const raw = await this.ctx.call('QueryBankReceiptStatusWithLogs', {
      receiptIds: { string: ettns },
    });
    return toArray(this.ctx.unwrap<any>(raw, 'QueryBankReceiptStatusWithLogsResult'));
  }

  async cancel(ettn: string, cancelDate: string): Promise<boolean> {
    const raw = await this.ctx.call('CancelBankReceipt', {
      cancellationContext: { $attributes: { BankReceiptEttn: ettn, CancelDate: cancelDate } },
    });
    return this.ctx.unwrapFlag(raw, 'CancelBankReceiptResult');
  }
}

class BankReceiptSendMethods {
  constructor(private readonly ctx: ServiceContext) {}

  async send(data: any): Promise<BankReceiptIdentity[]> {
    const raw = await this.ctx.call('SendBankReceipt', { bankReceipts: data });
    return toArray(this.ctx.unwrap<any>(raw, 'SendBankReceiptResult'));
  }

  async saveAsDraft(data: any): Promise<BankReceiptIdentity[]> {
    const raw = await this.ctx.call('SaveAsDraft', { bankReceipts: data });
    return toArray(this.ctx.unwrap<any>(raw, 'SaveAsDraftResult'));
  }

  async sendDraft(ettns: string[]): Promise<boolean> {
    const raw = await this.ctx.call('SendDraft', { bankReceiptEttns: { string: ettns } });
    return this.ctx.unwrapFlag(raw, 'SendDraftResult');
  }

  async cancelDraft(ettns: string[]): Promise<boolean> {
    const raw = await this.ctx.call('CancelDraft', { bankReceiptEttns: { string: ettns } });
    return this.ctx.unwrapFlag(raw, 'CancelDraftResult');
  }
}
