// Uyumsoft SDK — e-Adisyon (GuestCheck) Types
import type { LogRecordItem, QuerySortMode, UnknownRecord } from '../../core/types';

export type GuestCheckListItem = UnknownRecord;
export type GuestCheckPayload = UnknownRecord | UnknownRecord[];
export interface GuestCheckStatusInfo {
  Ettn: string;
  Status: string;
  Message?: string;
}
export interface GuestCheckStatusWithLogInfo extends GuestCheckStatusInfo {
  Logs?: LogRecordItem[];
}
export interface GuestCheckData {
  DocumentId: string;
  Data?: string;
}
export interface GuestCheckIdentity {
  Ettn: string;
  DocumentId?: string;
}

export interface GuestCheckListQuery {
  StartDate?: string;
  EndDate?: string;
  SortMode?: QuerySortMode;
  PageIndex?: number;
  PageSize?: number;
}
