// Uyumsoft SDK — e-İrsaliye (Despatch) Service Types
// Derived from DespatchIntegration XSD: xsd=xsd0

import type { LogRecordItem, QuerySortMode, UnknownRecord } from '../../core/types';

// ─── Enums ───────────────────────────────────────────────

/** Despatch advice processing status */
export const DespatchStatus = {
  NotPrepared: 'NotPrepared',
  NotSend: 'NotSend',
  Draft: 'Draft',
  Canceled: 'Canceled',
  Queued: 'Queued',
  Processing: 'Processing',
  SentToGib: 'SentToGib',
  Approved: 'Approved',
  WaitingForAprovement: 'WaitingForAprovement',
  Declined: 'Declined',
  Return: 'Return',
  Error: 'Error',
} as const;
export type DespatchStatus = (typeof DespatchStatus)[keyof typeof DespatchStatus];

/** Despatch envelope processing status */
export const DespatchEnvelopeStatus = {
  NoEnvelope: 'NoEnvelope',
  Preparing: 'Preparing',
  EnvelopIsQueued: 'EnvelopIsQueued',
  EnvelopIsProcessing: 'EnvelopIsProcessing',
  CompletedSuccessfully: 'CompletedSuccessfully',
  SystemError: 'SystemError',
  Error: 'Error',
} as const;
export type DespatchEnvelopeStatus =
  (typeof DespatchEnvelopeStatus)[keyof typeof DespatchEnvelopeStatus];

/** Despatch list sorting columns */
export const DespatchListSortingColumn = {
  Default: 'Default',
  Id: 'Id',
  CreateDate: 'CreateDate',
  ExecutionDate: 'ExecutionDate',
} as const;
export type DespatchListSortingColumn =
  (typeof DespatchListSortingColumn)[keyof typeof DespatchListSortingColumn];

// QuerySortMode imported from core/types

/** Despatch type code */
export const DespatchTypeCode = {
  Sevk: 'Sevk',
  Matbuat: 'Matbuat',
} as const;
export type DespatchTypeCode = (typeof DespatchTypeCode)[keyof typeof DespatchTypeCode];

// ─── Query Models ────────────────────────────────────────

/** Filter model for despatch list endpoints */
export interface DespatchListQuery {
  /** Execution date range start (ISO 8601) */
  ExecutionStartDate?: string;
  /** Execution date range end (ISO 8601) */
  ExecutionEndDate?: string;
  /** Creation date range start */
  CreateStartDate?: string;
  /** Creation date range end */
  CreateEndDate?: string;
  /** Filter by status */
  Status?: DespatchStatus;
  /** Filter by specific despatch IDs */
  DespatchIds?: string[];
  /** Include statuses (OR logic) */
  StatusInList?: DespatchStatus[];
  /** Exclude statuses */
  StatusNotInList?: DespatchStatus[];
  /** Sort column */
  SortColumn?: DespatchListSortingColumn;
  /** Sort direction */
  SortMode?: QuerySortMode;
  /** Filter archived items */
  IsArchived?: boolean;
  /** Filter by target company name */
  TargetTitle?: string;
  /** Filter by target VKN/TCKN */
  TargetTcknVkn?: string;
  /** Page index (0-based) */
  PageIndex?: number;
  /** Items per page (default: 20) */
  PageSize?: number;
}

/** Query model for full despatch retrieval (includes UBL-TR) */
export interface DespatchQuery extends DespatchListQuery {
  /** Mark retrieved despatches as "taken" to prevent re-fetching */
  SetTaken?: boolean;
  /** Only return despatches not previously fetched */
  OnlyNewestDespatches?: boolean;
}

// ─── Response Models ─────────────────────────────────────

/** Despatch list item — returned by list endpoints */
export interface DespatchListItem {
  /** Unique despatch ID (UUID/ETTN) */
  DespatchId: string;
  /** Document number (e.g., ISR2026000000001) */
  DocumentId: string;
  /** Despatch type code */
  TypeCode: number;
  /** Target company VKN/TCKN */
  TargetTcknVkn: string;
  /** Target company title */
  TargetTitle: string;
  /** SOAP envelope identifier */
  EnvelopeIdentifier: string;
  /** Current processing status */
  Status: DespatchStatus;
  /** Numeric status code */
  StatusCode: number;
  /** Envelope processing status */
  EnvelopeStatus: DespatchEnvelopeStatus;
  /** Numeric envelope status code */
  EnvelopeStatusCode: number;
  /** Status or error message */
  Message?: string;
  /** UTC creation timestamp */
  CreateDateUtc: string;
  /** Despatch execution date */
  ExecutionDate: string;
  /** Whether the despatch is archived */
  IsArchived: boolean;
  /** Whether the despatch has been read */
  IsNew?: boolean;
}

/** Full despatch info (includes UBL-TR DespatchAdvice XML) */
export interface DespatchInfo {
  /** UBL-TR DespatchAdvice document. Contains full shipment details. */
  DespatchAdvice: DespatchAdviceDocument;
  /** Target customer routing info */
  TargetCustomer?: {
    VknTckn: string;
    Alias: string;
    Title: string;
  };
  /** Despatch creation timestamp (UTC) */
  CreateDateUtc: string;
  /** Local reference document ID */
  LocalDocumentId?: string;
  /** Extra information string (free-form) */
  ExtraInformation?: string;
}

/** UBL-TR DespatchAdvice document structure */
export interface DespatchAdviceDocument {
  /** UBL version (typically "2.1") */
  UBLVersionID?: string;
  /** Customization ID (typically "TR1.2" or "TR1.2.1") */
  CustomizationID?: string;
  /** Profile ID (e.g., "TEMELIRSALIYE") */
  ProfileID?: string;
  /** Unique document ID */
  ID?: string;
  /** UUID (ETTN) */
  UUID?: string;
  /** Issue date */
  IssueDate?: string;
  /** Issue time */
  IssueTime?: string;
  /** Despatch advice type code */
  DespatchAdviceTypeCode?: string;
  /** Notes */
  Note?: string[];
  /** Line count */
  LineCountNumeric?: number;
  /** Supplier party (sender) */
  DespatchSupplierParty?: UnknownRecord;
  /** Customer party (receiver) */
  DeliveryCustomerParty?: UnknownRecord;
  /** Shipment details (driver, vehicle, etc.) */
  Shipment?: UnknownRecord;
  /** Despatch lines (items) */
  DespatchLine?: UnknownRecord[];
}

/** Despatch raw data (base64 encoded XML) */
export interface DespatchData {
  /** Base64 encoded DespatchAdvice XML */
  Data: string;
  /** Despatch UUID */
  DespatchId: string;
  /** Local reference document ID */
  LocalDocumentId?: string;
}

/** Despatch status info */
export interface DespatchStatusInfo {
  /** Current status */
  Status: DespatchStatus;
  /** Numeric status code */
  StatusCode: number;
  /** Despatch UUID */
  DespatchId: string;
  /** Despatch document number */
  DespatchNumber?: string;
  /** Status message */
  Message?: string;
}

/** Despatch status with processing logs */
export interface DespatchStatusWithLogInfo extends DespatchStatusInfo {
  /** Local reference document ID */
  LocalDocumentId?: string;
  /** Envelope processing status code */
  EnvelopeStatusCode: number;
  /** Chronological processing logs */
  Logs: LogRecordItem[];
}

/** Receipt advice list item */
export interface ReceiptAdviceListItem {
  /** Receipt advice UUID */
  ReceiptAdviceId: string;
  /** Document number */
  DocumentId: string;
  /** Linked despatch UUID */
  DespatchId: string;
  /** Current status */
  Status: DespatchStatus;
  /** Numeric status code */
  StatusCode: number;
  /** Envelope identifier */
  EnvelopeIdentifier: string;
  /** Status message */
  Message?: string;
  /** UTC creation timestamp */
  CreateDateUtc: string;
  /** Execution date */
  ExecutionDate: string;
}

/** Receipt advice status info */
export interface ReceiptAdviceStatusInfo {
  /** Current status */
  Status: DespatchStatus;
  /** Numeric status code */
  StatusCode: number;
  /** Receipt advice UUID */
  ReceiptAdviceId: string;
  /** Status message */
  Message?: string;
}

/** Despatch system user info */
export interface DespatchSystemUser {
  /** VKN/TCKN identifier */
  Identifier: string;
  /** Postbox alias */
  PostboxAlias: string;
  /** Senderbox alias */
  SenderboxAlias: string;
  /** Company title */
  Title: string;
  /** User type */
  Type: string;
  /** System creation date */
  SystemCreateDate: string;
  /** First creation date */
  FirstCreateDate: string;
  /** Whether the user is enabled */
  Enabled: boolean;
}

/** View result (HTML render of despatch) */
export interface DespatchViewResult {
  /** Rendered HTML string */
  Html: string;
  /** Whether default XSLT was used */
  IsUsingDefaultXslt: boolean;
}

/** Envelope data for a despatch */
export interface DespatchEnvelopeData {
  /** Base64 encoded envelope */
  Envelope: string;
  /** Envelope identifier */
  EnvelopeIdentifier: string;
  /** Envelope status */
  Status: DespatchEnvelopeStatus;
  /** Numeric status code */
  StatusCode: number;
}

export interface DespatchUserAliases {
  Definition: UnknownRecord;
  ReceiverboxAliases: UnknownRecord[];
  SenderboxAliases: UnknownRecord[];
}
