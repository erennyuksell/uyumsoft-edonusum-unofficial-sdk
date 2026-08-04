// Uyumsoft SDK — e-Bilet (Ticket) Types
import type { LogRecordItem, QuerySortMode, UnknownRecord } from '../../core/types';

export type TicketListItem = UnknownRecord;
export type TicketPayload = UnknownRecord;
export type TicketSendResult = UnknownRecord;
export type PassengerListPayload = UnknownRecord;
export type PassengerListSendResult = UnknownRecord;
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
