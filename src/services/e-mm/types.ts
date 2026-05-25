// Uyumsoft SDK — e-MM (Producer Receipt / Müstahsil Makbuzu) Service Types
// Derived from ProducerReceiptIntegration XSD

import type { LogRecordItem, QuerySortMode } from '../../core/types';

// ─── Enums ───────────────────────────────────────────────

/** Producer receipt processing status */
export const ProducerReceiptStatus = {
  Draft: 'Draft',
  Canceled: 'Canceled',
  Queued: 'Queued',
  Processing: 'Processing',
  Signed: 'Signed',
  EProducerReceiptCanceled: 'EProducerReceiptCanceled',
  Error: 'Error',
  Deleted: 'Deleted',
} as const;
export type ProducerReceiptStatus =
  (typeof ProducerReceiptStatus)[keyof typeof ProducerReceiptStatus];

/** Producer receipt list sorting columns */
export const ProducerReceiptSortingColumn = {
  Default: 'Default',
  Id: 'Id',
  CreateDate: 'CreateDate',
  DocumentDate: 'DocumentDate',
} as const;
export type ProducerReceiptSortingColumn =
  (typeof ProducerReceiptSortingColumn)[keyof typeof ProducerReceiptSortingColumn];

// QuerySortMode imported from core/types

// ─── Query Models ────────────────────────────────────────

/** Filter model for producer receipt list */
export interface ProducerReceiptListQuery {
  /** Document date range start (ISO 8601) */
  StartDate?: string;
  /** Document date range end (ISO 8601) */
  EndDate?: string;
  /** Filter by specific ETTN identifier */
  Identifier?: string;
  /** Filter by receipt number */
  ReceiptNumber?: string;
  /** Filter by target person name */
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
  SortColumn?: ProducerReceiptSortingColumn;
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

/** Producer receipt list item */
export interface ProducerReceiptListItem {
  /** Receipt UUID (ETTN) */
  Ettn: string;
  /** Receipt number */
  ProducerReceiptNumber: string;
  /** Current status */
  Status: ProducerReceiptStatus;
  /** Numeric status code */
  StatusCode: number;
  /** UTC creation timestamp */
  CreateDateUtc: string;
  /** Document date */
  DocumentDate: string;
  /** Whether the receipt is archived */
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

/** Producer receipt status info */
export interface ProducerReceiptStatusInfo {
  /** Receipt UUID (ETTN) */
  ProducerReceiptEttn: string;
  /** Current status */
  Status: ProducerReceiptStatus;
  /** Numeric status code */
  StatusCode: number;
  /** Receipt number */
  ProducerReceiptNumber?: string;
  /** Local reference document ID */
  LocalDocumentId?: string;
}

/** Producer receipt status with processing logs */
export interface ProducerReceiptStatusWithLogInfo extends ProducerReceiptStatusInfo {
  /** Chronological processing logs */
  Logs: LogRecordItem[];
}

/** Producer receipt data (base64 encoded) */
export interface ProducerReceiptData {
  /** Receipt UUID (ETTN) */
  Ettn: string;
  /** Receipt number */
  ProducerReceiptNumber: string;
  /** Base64 encoded file data (PDF/XML) */
  FileData: string;
}

/** Document identity (returned from send operations) */
export interface ProducerReceiptDocumentIdentity {
  /** Receipt UUID (ETTN) */
  Ettn: string;
  /** Assigned receipt number */
  ProducerReceiptNumber: string;
}

/** Cloned receipt info */
export interface ClonedProducerReceiptInfo {
  /** Source receipt ID */
  SourceInvoiceId: string;
  /** Cloned receipt ID */
  ClonedInvoiceId: string;
}
