// Uyumsoft SDK — e-Döviz (ForeignExchange) Types
import type { LogRecordItem, QuerySortMode } from '../../core/types';

export interface FxListItem {
  [key: string]: any;
}
export interface FxStatusInfo {
  Ettn: string;
  Status: string;
  Message?: string;
}
export interface FxStatusWithLogInfo extends FxStatusInfo {
  Logs?: LogRecordItem[];
}
export interface FxData {
  DocumentId: string;
  Data?: string;
}
export interface FxIdentity {
  Ettn: string;
  DocumentId?: string;
}

export interface FxListQuery {
  StartDate?: string;
  EndDate?: string;
  SortMode?: QuerySortMode;
  PageIndex?: number;
  PageSize?: number;
}
