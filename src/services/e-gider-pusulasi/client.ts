// Uyumsoft SDK — e-Gider Pusulası (ExpenseReceipt) Client
import { BaseClient, type ServiceContext } from '../../core/base-client';
import { UYUMSOFT_ENDPOINTS, type UyumsoftConfig, type PagedResult } from '../../core/types';
import { SharedSystemMethods, buildPaginationAttrs, toArray } from '../../core/helpers';
import type {
  ExpenseReceiptListItem,
  ExpenseReceiptStatusInfo,
  ExpenseReceiptStatusWithLogInfo,
  ExpenseReceiptData,
  ExpenseReceiptIdentity,
  ExpenseReceiptPayload,
} from './types';

/**
 * e-Gider Pusulası client — Gider pusulası belgeleme.
 * 22 methods: system + send/draft, HTML/PDF, status, query, cancel, fromEArchive.
 */
export class EGiderPusalasiClient extends BaseClient {
  readonly system: SharedSystemMethods;
  readonly outbox: ExpenseOutboxMethods;
  readonly send: ExpenseSendMethods;

  constructor(config: UyumsoftConfig) {
    super(config, UYUMSOFT_ENDPOINTS.egiderpusulasi);
    this.system = new SharedSystemMethods(this.ctx);
    this.outbox = new ExpenseOutboxMethods(this.ctx);
    this.send = new ExpenseSendMethods(this.ctx);
  }
}

class ExpenseOutboxMethods {
  constructor(private readonly ctx: ServiceContext) {}

  async list(pageIndex = 0, pageSize = 20): Promise<PagedResult<ExpenseReceiptListItem>> {
    const raw = await this.ctx.call('QueryExpenseReceiptList', {
      context: { $attributes: buildPaginationAttrs(pageIndex, pageSize) },
    });
    return this.ctx.unwrapPaged<ExpenseReceiptListItem>(raw, 'QueryExpenseReceiptListResult');
  }

  async get(documentId: string): Promise<ExpenseReceiptData> {
    const raw = await this.ctx.call('GetExpenseReceipt', { documentId });
    return this.ctx.unwrap<ExpenseReceiptData>(raw, 'GetExpenseReceiptResult');
  }

  async getData(documentId: string): Promise<ExpenseReceiptData> {
    const raw = await this.ctx.call('GetExpenseReceiptData', { documentId });
    return this.ctx.unwrap<ExpenseReceiptData>(raw, 'GetExpenseReceiptDataResult');
  }

  async getHtml(documentId: string): Promise<string> {
    const raw = await this.ctx.call('GetHtmlView', { documentId });
    return this.ctx.unwrapString(raw, 'GetHtmlViewResult');
  }

  async getPdf(documentId: string): Promise<string> {
    const raw = await this.ctx.call('GetPdfView', { documentId });
    return this.ctx.unwrapString(raw, 'GetPdfViewResult');
  }

  async getStatus(ettns: string[]): Promise<ExpenseReceiptStatusInfo[]> {
    const raw = await this.ctx.call('QueryExpenseReceiptStatus', {
      documentIds: { string: ettns },
    });
    return this.ctx.unwrapArray<ExpenseReceiptStatusInfo>(raw, 'QueryExpenseReceiptStatusResult');
  }

  async getStatusWithLogs(ettns: string[]): Promise<ExpenseReceiptStatusWithLogInfo[]> {
    const raw = await this.ctx.call('QueryExpenseReceiptStatusWithLogs', {
      documentIds: { string: ettns },
    });
    return this.ctx.unwrapArray<ExpenseReceiptStatusWithLogInfo>(
      raw,
      'QueryExpenseReceiptStatusWithLogsResult',
    );
  }

  /** Create expense receipts from existing e-Archive invoices. */
  async fromEArchiveInvoices(invoiceIds: string[]): Promise<boolean> {
    const raw = await this.ctx.call('QueueExpenseReceiptFromEArchiveInvoices', {
      invoiceIds: { string: invoiceIds },
    });
    return this.ctx.unwrapFlag(raw, 'QueueExpenseReceiptFromEArchiveInvoicesResult');
  }
}

class ExpenseSendMethods {
  constructor(private readonly ctx: ServiceContext) {}

  async send(data: ExpenseReceiptPayload): Promise<ExpenseReceiptIdentity[]> {
    const raw = await this.ctx.call('SendExpenseReceipt', {
      expenseReceipts: { ExpenseReceiptInfo: toArray(data) },
    });
    return this.ctx.unwrapArray<ExpenseReceiptIdentity>(raw, 'SendExpenseReceiptResult');
  }

  async saveAsDraft(data: ExpenseReceiptPayload): Promise<ExpenseReceiptIdentity[]> {
    const raw = await this.ctx.call('SaveAsDraft', {
      expenseReceipts: { ExpenseReceiptInfo: toArray(data) },
    });
    return this.ctx.unwrapArray<ExpenseReceiptIdentity>(raw, 'SaveAsDraftResult');
  }

  async sendDraft(ettns: string[]): Promise<boolean> {
    const raw = await this.ctx.call('SendDraft', { documentIds: { string: ettns } });
    return this.ctx.unwrapFlag(raw, 'SendDraftResult');
  }

  async cancelDraft(ettns: string[]): Promise<boolean> {
    const raw = await this.ctx.call('CancelDraft', { documentIds: { string: ettns } });
    return this.ctx.unwrapFlag(raw, 'CancelDraftResult');
  }
}
