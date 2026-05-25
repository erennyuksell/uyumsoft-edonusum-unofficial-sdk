// Uyumsoft SDK — e-Bilet (Ticket) Types
import type { LogRecordItem, QuerySortMode } from '../../core/types';

export interface TicketListItem {
  [key: string]: any;
}
export interface TicketStatusInfo {
  Ettn: string;
  Status: string;
  Message?: string;
}
export interface TicketStatusWithLogInfo extends TicketStatusInfo {
  Logs?: LogRecordItem[];
}
export interface TicketData {
  DocumentId: string;
  Data?: string;
}
export interface PassengerListData {
  DocumentId: string;
  Data?: string;
}

export interface TicketListQuery {
  StartDate?: string;
  EndDate?: string;
  SortMode?: QuerySortMode;
  PageIndex?: number;
  PageSize?: number;
}
