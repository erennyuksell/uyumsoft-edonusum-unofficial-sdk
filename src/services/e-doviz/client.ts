// Uyumsoft SDK — e-Döviz (ForeignExchange) Client
import { BaseClient, type ServiceContext } from '../../core/base-client';
import { UYUMSOFT_ENDPOINTS, type UyumsoftConfig, type PagedResult } from '../../core/types';
import { SharedSystemMethods, buildPaginationAttrs, toArray } from '../../core/helpers';
import type {
  FxListItem,
  FxStatusInfo,
  FxStatusWithLogInfo,
  FxData,
  FxIdentity,
  FxPayload,
} from './types';

/**
 * e-Döviz client — Döviz alım/satım belgesi.
 * 23 methods: system + send/draft, HTML/PDF, status, query, cancel, retry.
 */
export class EDovizClient extends BaseClient {
  readonly system: SharedSystemMethods;
  readonly outbox: FxOutboxMethods;
  readonly send: FxSendMethods;

  constructor(config: UyumsoftConfig) {
    super(config, UYUMSOFT_ENDPOINTS.edoviz);
    this.system = new SharedSystemMethods(this.ctx);
    this.outbox = new FxOutboxMethods(this.ctx);
    this.send = new FxSendMethods(this.ctx);
  }
}

class FxOutboxMethods {
  constructor(private readonly ctx: ServiceContext) {}

  async list(pageIndex = 0, pageSize = 20): Promise<PagedResult<FxListItem>> {
    const raw = await this.ctx.call('QueryForeignExchangeList', {
      context: { $attributes: buildPaginationAttrs(pageIndex, pageSize) },
    });
    return this.ctx.unwrapPaged<FxListItem>(raw, 'QueryForeignExchangeListResult');
  }

  async get(documentId: string): Promise<FxData> {
    const raw = await this.ctx.call('GetForeignExchange', { documentId });
    return this.ctx.unwrap<FxData>(raw, 'GetForeignExchangeResult');
  }

  async getData(documentId: string): Promise<FxData> {
    const raw = await this.ctx.call('GetForeignExchangeData', { documentId });
    return this.ctx.unwrap<FxData>(raw, 'GetForeignExchangeDataResult');
  }

  async getHtml(documentId: string): Promise<string> {
    const raw = await this.ctx.call('GetHtmlView', { documentId });
    return this.ctx.unwrapString(raw, 'GetHtmlViewResult');
  }

  async getPdf(documentId: string): Promise<string> {
    const raw = await this.ctx.call('GetPdfView', { documentId });
    return this.ctx.unwrapString(raw, 'GetPdfViewResult');
  }

  async getStatus(ettns: string[]): Promise<FxStatusInfo[]> {
    const raw = await this.ctx.call('QueryForeignExchangeStatus', {
      documentIds: { string: ettns },
    });
    return this.ctx.unwrapArray<FxStatusInfo>(raw, 'QueryForeignExchangeStatusResult');
  }

  async getStatusWithLogs(ettns: string[]): Promise<FxStatusWithLogInfo[]> {
    const raw = await this.ctx.call('QueryForeignExchangeStatusWithLogs', {
      documentIds: { string: ettns },
    });
    return this.ctx.unwrapArray<FxStatusWithLogInfo>(
      raw,
      'QueryForeignExchangeStatusWithLogsResult',
    );
  }

  async cancel(ettn: string, cancelDate = new Date().toISOString()): Promise<boolean> {
    const raw = await this.ctx.call('RequestCancelForeignExchange', {
      context: { $attributes: { DocumentId: ettn, CancelDate: cancelDate } },
    });
    return this.ctx.unwrapFlag(raw, 'RequestCancelForeignExchangeResult');
  }

  async retrySend(ettns: string[]): Promise<boolean> {
    const raw = await this.ctx.call('RetrySendForeignExchanges', {
      documentIds: { string: ettns },
    });
    return this.ctx.unwrapFlag(raw, 'RetrySendForeignExchangesResult');
  }
}

class FxSendMethods {
  constructor(private readonly ctx: ServiceContext) {}

  async send(data: FxPayload): Promise<FxIdentity[]> {
    const raw = await this.ctx.call('SendForeignExchange', {
      exchanges: { ForeignExchangeInfo: toArray(data) },
    });
    return this.ctx.unwrapArray<FxIdentity>(raw, 'SendForeignExchangeResult');
  }

  async saveAsDraft(data: FxPayload): Promise<FxIdentity[]> {
    const raw = await this.ctx.call('SaveAsDraft', {
      exchanges: { ForeignExchangeInfo: toArray(data) },
    });
    return this.ctx.unwrapArray<FxIdentity>(raw, 'SaveAsDraftResult');
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
