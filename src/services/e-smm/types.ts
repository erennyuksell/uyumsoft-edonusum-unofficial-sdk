// Uyumsoft SDK — e-SMM (Voucher) Service Types
// Derived from VoucherIntegration XSD

import type { LogRecordItem, QuerySortMode } from '../../core/types';

// ─── Enums ───────────────────────────────────────────────

/** Voucher (SMM) processing status */
export const VoucherStatus = {
  Draft: 'Draft',
  Canceled: 'Canceled',
  Queued: 'Queued',
  Processing: 'Processing',
  Signed: 'Signed',
  EVoucherCanceled: 'EVoucherCanceled',
  Error: 'Error',
  Deleted: 'Deleted',
} as const;
export type VoucherStatus = (typeof VoucherStatus)[keyof typeof VoucherStatus];

/** Voucher list sorting columns */
export const VoucherListSortingColumn = {
  Default: 'Default',
  Id: 'Id',
  CreateDate: 'CreateDate',
  DocumentDate: 'DocumentDate',
} as const;
export type VoucherListSortingColumn =
  (typeof VoucherListSortingColumn)[keyof typeof VoucherListSortingColumn];

// QuerySortMode imported from core/types

// ─── Query Models ────────────────────────────────────────

/** Filter model for outbox voucher list */
export interface VoucherListQuery {
  /** Document date range start (ISO 8601) */
  StartDate?: string;
  /** Document date range end (ISO 8601) */
  EndDate?: string;
  /** Filter by specific ETTN identifier */
  Identifier?: string;
  /** Filter by voucher number */
  VoucherNumber?: string;
  /** Filter by target company name */
  TargetTitle?: string;
  /** Filter by target VKN/TCKN */
  TargetVknTckn?: string;
  /** Filter statuses numerically (OR logic) */
  Statuses?: number[];
  /** Exclude statuses numerically */
  StatusesNot?: number[];
  /** Filter archived items */
  IsArchived?: boolean;
  /** Sort column */
  SortColumn?: VoucherListSortingColumn;
  /** Sort direction */
  SortMode?: QuerySortMode;
  /** Minimum payable amount */
  PayableAmountBegin?: number;
  /** Maximum payable amount */
  PayableAmountEnd?: number;
  /** Page index (0-based) */
  PageIndex?: number;
  /** Items per page (default: 20) */
  PageSize?: number;
}

// ─── Response Models ─────────────────────────────────────

/** Outbox voucher list item */
export interface VoucherListItem {
  /** Voucher UUID (ETTN) */
  Ettn: string;
  /** Voucher number */
  VoucherNumber: string;
  /** Current status */
  Status: VoucherStatus;
  /** Numeric status code */
  StatusCode: number;
  /** UTC creation timestamp */
  CreateDateUtc: string;
  /** Document date */
  DocumentDate: string;
  /** Whether the voucher is archived */
  IsArchived: boolean;
  /** Target person/company name */
  TargetTitle?: string;
  /** Target VKN/TCKN */
  TargetVknTckn?: string;
  /** Total amount payable */
  PayableAmount: number;
  /** Currency code (e.g., "TRY") */
  DocumentCurrencyCode: string;
  /** Status or error message */
  Message?: string;
  /** Local reference document ID */
  LocalDocumentId?: string;
}

/** Inbox voucher list item */
export interface InboxVoucherListItem {
  /** Voucher UUID (ETTN) */
  Ettn: string;
  /** Voucher number */
  VoucherNumber: string;
  /** UTC creation timestamp */
  CreateDateUtc: string;
  /** Document date */
  DocumentDate: string;
  /** Whether the voucher is archived */
  IsArchived: boolean;
  /** Source person/company VKN/TCKN */
  TargetVknTckn?: string;
  /** Total amount payable */
  PayableAmount: number;
  /** Currency code */
  DocumentCurrencyCode: string;
  /** Whether the XML is valid */
  IsValidXmlDocument?: boolean;
}

/** Voucher status info */
export interface VoucherStatusInfo {
  /** Voucher UUID (ETTN) */
  VoucherEttn: string;
  /** Current status */
  Status: VoucherStatus;
  /** Numeric status code */
  StatusCode: number;
  /** Voucher number */
  VoucherNumber?: string;
  /** Local reference document ID */
  LocalDocumentId?: string;
}

/** Voucher status with processing logs */
export interface VoucherStatusWithLogInfo extends VoucherStatusInfo {
  /** Chronological processing logs */
  Logs: LogRecordItem[];
}

/** Voucher data (base64 encoded) */
export interface VoucherData {
  /** Voucher UUID (ETTN) */
  Ettn: string;
  /** Voucher number */
  VoucherNumber: string;
  /** Base64 encoded file data (PDF/XML) */
  FileData: string;
}

/** Document identity (returned from send operations) */
export interface VoucherDocumentIdentity {
  /** Voucher UUID (ETTN) */
  Ettn: string;
  /** Assigned voucher number */
  VoucherNumber: string;
}

/** Cloned voucher info */
export interface ClonedVoucherInfo {
  /** Source voucher ID */
  SourceInvoiceId: string;
  /** Cloned voucher ID */
  ClonedInvoiceId: string;
}

/** Voucher cancellation context */
export interface VoucherCancellationContext {
  /** Voucher UUID (ETTN) to cancel */
  VoucherEttn: string;
  /** Cancellation date (ISO 8601) */
  CancelDate: string;
}
