// Uyumsoft SDK — e-Gider Pusulası (ExpenseReceipt) Types
import type { LogRecordItem, QuerySortMode } from '../../core/types';

export interface ExpenseReceiptListItem {
  [key: string]: any;
}
export interface ExpenseReceiptStatusInfo {
  Ettn: string;
  Status: string;
  Message?: string;
}
export interface ExpenseReceiptStatusWithLogInfo extends ExpenseReceiptStatusInfo {
  Logs?: LogRecordItem[];
}
export interface ExpenseReceiptData {
  DocumentId: string;
  Data?: string;
}
export interface ExpenseReceiptIdentity {
  Ettn: string;
  DocumentId?: string;
}

export interface ExpenseReceiptListQuery {
  StartDate?: string;
  EndDate?: string;
  SortMode?: QuerySortMode;
  PageIndex?: number;
  PageSize?: number;
}
