// Uyumsoft SDK — e-Adisyon (GuestCheck) Client
import { BaseClient, type ServiceContext } from '../../core/base-client';
import { UYUMSOFT_ENDPOINTS, type UyumsoftConfig, type PagedResult } from '../../core/types';
import { SharedSystemMethods, buildPaginationAttrs, toArray } from '../../core/helpers';
import type {
  GuestCheckListItem,
  GuestCheckStatusInfo,
  GuestCheckStatusWithLogInfo,
  GuestCheckData,
  GuestCheckIdentity,
  GuestCheckPayload,
} from './types';

/**
 * e-Adisyon client — Otel/restoran adisyon belgeleme.
 * 22 methods: system + send/draft/cancel, HTML/PDF view, status, query.
 */
export class EAdisyonClient extends BaseClient {
  readonly system: SharedSystemMethods;
  readonly outbox: AdisyonOutboxMethods;
  readonly send: AdisyonSendMethods;

  constructor(config: UyumsoftConfig) {
    super(config, UYUMSOFT_ENDPOINTS.eadisyon);
    this.system = new SharedSystemMethods(this.ctx);
    this.outbox = new AdisyonOutboxMethods(this.ctx);
    this.send = new AdisyonSendMethods(this.ctx);
  }
}

class AdisyonOutboxMethods {
  constructor(private readonly ctx: ServiceContext) {}

  async list(pageIndex = 0, pageSize = 20): Promise<PagedResult<GuestCheckListItem>> {
    const raw = await this.ctx.call('QueryGuestCheckList', {
      context: { $attributes: buildPaginationAttrs(pageIndex, pageSize) },
    });
    return this.ctx.unwrapPaged<GuestCheckListItem>(raw, 'QueryGuestCheckListResult');
  }

  async get(documentId: string): Promise<GuestCheckData> {
    const raw = await this.ctx.call('GetGuestCheck', { documentId });
    return this.ctx.unwrap<GuestCheckData>(raw, 'GetGuestCheckResult');
  }

  async getData(documentId: string): Promise<GuestCheckData> {
    const raw = await this.ctx.call('GetGuestCheckData', { documentId });
    return this.ctx.unwrap<GuestCheckData>(raw, 'GetGuestCheckDataResult');
  }

  async getHtml(documentId: string): Promise<string> {
    const raw = await this.ctx.call('GetHtmlView', { documentId });
    return this.ctx.unwrapString(raw, 'GetHtmlViewResult');
  }

  async getPdf(documentId: string): Promise<string> {
    const raw = await this.ctx.call('GetPdfView', { documentId });
    return this.ctx.unwrapString(raw, 'GetPdfViewResult');
  }

  async getStatus(ettns: string[]): Promise<GuestCheckStatusInfo[]> {
    const raw = await this.ctx.call('QueryGuestCheckStatus', { documentIds: { string: ettns } });
    return this.ctx.unwrapArray<GuestCheckStatusInfo>(raw, 'QueryGuestCheckStatusResult');
  }

  async getStatusWithLogs(ettns: string[]): Promise<GuestCheckStatusWithLogInfo[]> {
    const raw = await this.ctx.call('QueryGuestCheckStatusWithLogs', {
      documentIds: { string: ettns },
    });
    return this.ctx.unwrapArray<GuestCheckStatusWithLogInfo>(
      raw,
      'QueryGuestCheckStatusWithLogsResult',
    );
  }

  async cancel(ettn: string, cancelDate = new Date().toISOString()): Promise<boolean> {
    const raw = await this.ctx.call('CancelGuestCheck', {
      cancellationContext: { $attributes: { DocumentId: ettn, CancelDate: cancelDate } },
    });
    return this.ctx.unwrapFlag(raw, 'CancelGuestCheckResult');
  }
}

class AdisyonSendMethods {
  constructor(private readonly ctx: ServiceContext) {}

  async send(data: GuestCheckPayload): Promise<GuestCheckIdentity[]> {
    const raw = await this.ctx.call('SendGuestCheck', {
      guestChecks: { GuestCheckInfo: toArray(data) },
    });
    return this.ctx.unwrapArray<GuestCheckIdentity>(raw, 'SendGuestCheckResult');
  }

  async saveAsDraft(data: GuestCheckPayload): Promise<GuestCheckIdentity[]> {
    const raw = await this.ctx.call('SaveAsDraft', {
      guestChecks: { GuestCheckInfo: toArray(data) },
    });
    return this.ctx.unwrapArray<GuestCheckIdentity>(raw, 'SaveAsDraftResult');
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
