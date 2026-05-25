// Uyumsoft SDK — e-Adisyon (GuestCheck) Types
import type { LogRecordItem, QuerySortMode } from '../../core/types';

export interface GuestCheckListItem {
  [key: string]: any;
}
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
