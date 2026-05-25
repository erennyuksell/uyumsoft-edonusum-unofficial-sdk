// Uyumsoft SDK — e-Banka Makbuzu (BankReceipt) Types
import type { LogRecordItem, QuerySortMode } from '../../core/types';

export interface BankReceiptListItem {
  [key: string]: any;
}
export interface BankReceiptStatusInfo {
  Ettn: string;
  Status: string;
  Message?: string;
}
export interface BankReceiptStatusWithLogInfo extends BankReceiptStatusInfo {
  Logs?: LogRecordItem[];
}
export interface BankReceiptData {
  DocumentId: string;
  Data?: string;
}
export interface BankReceiptIdentity {
  Ettn: string;
  DocumentId?: string;
}

export interface BankReceiptListQuery {
  StartDate?: string;
  EndDate?: string;
  SortMode?: QuerySortMode;
  PageIndex?: number;
  PageSize?: number;
}
