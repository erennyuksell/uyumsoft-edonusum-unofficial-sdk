// Uyumsoft SDK — e-Bilet (Ticket) Client
import { BaseClient, type ServiceContext } from '../../core/base-client';
import { UYUMSOFT_ENDPOINTS, type UyumsoftConfig, type PagedResult } from '../../core/types';
import { SharedSystemMethods, buildPaginationAttrs } from '../../core/helpers';
import type { TicketListItem, TicketData, PassengerListData } from './types';

/**
 * e-Bilet client — Ulaşım bileti (otobüs, uçak vb.) belgeleme.
 * 16 methods: system + send/get/cancel ticket, passenger list, query.
 */
export class EBiletClient extends BaseClient {
  readonly system: SharedSystemMethods;
  readonly tickets: TicketMethods;

  constructor(config: UyumsoftConfig) {
    super(config, UYUMSOFT_ENDPOINTS.ebilet);
    this.system = new SharedSystemMethods(this.ctx);
    this.tickets = new TicketMethods(this.ctx);
  }
}

class TicketMethods {
  constructor(private readonly ctx: ServiceContext) {}

  async send(ticket: any): Promise<any> {
    const raw = await this.ctx.call('SendTicket', { ticket });
    return this.ctx.unwrap(raw, 'SendTicketResult');
  }

  async get(documentId: string): Promise<TicketData> {
    const raw = await this.ctx.call('GetTicket', { documentId });
    return this.ctx.unwrap<TicketData>(raw, 'GetTicketResult');
  }

  async cancel(documentId: string): Promise<boolean> {
    const raw = await this.ctx.call('CancelTicket', { documentId });
    return this.ctx.unwrapFlag(raw, 'CancelTicketResult');
  }

  async list(pageIndex = 0, pageSize = 20): Promise<PagedResult<TicketListItem>> {
    const raw = await this.ctx.call('QueryTickets', {
      context: { $attributes: buildPaginationAttrs(pageIndex, pageSize) },
    });
    return this.ctx.unwrapPaged<TicketListItem>(raw, 'QueryTicketsResult');
  }

  async sendPassengerList(data: any): Promise<any> {
    const raw = await this.ctx.call('SendPassengerList', { data });
    return this.ctx.unwrap(raw, 'SendPassengerListResult');
  }

  async getPassengerList(documentId: string): Promise<PassengerListData> {
    const raw = await this.ctx.call('GetPassengerList', { documentId });
    return this.ctx.unwrap<PassengerListData>(raw, 'GetPassengerListResult');
  }
}
