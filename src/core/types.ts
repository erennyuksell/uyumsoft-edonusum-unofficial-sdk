// Uyumsoft SDK — Shared Core Types

// ─── Client Configuration ────────────────────────────────

/** SDK configuration */
export interface UyumsoftConfig {
  /** API username */
  username: string;
  /** API password */
  password: string;
  /** Environment: 'test' uses test WSDL endpoints, 'production' uses live */
  environment?: 'test' | 'production';
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Retry configuration */
  retry?: RetryConfig;
  /** Optional logger for debugging SOAP calls */
  logger?: UyumsoftLogger;
}

/** Retry policy configuration */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay between retries in ms (default: 1000) */
  initialDelay?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Whether to retry on timeout errors (default: true) */
  retryOnTimeout?: boolean;
  /** Whether to retry on connection errors (default: true) */
  retryOnConnectionError?: boolean;
}

/** Logger interface — plug in any logger (pino, winston, console) */
export interface UyumsoftLogger {
  debug?(message: string, meta?: Record<string, any>): void;
  info?(message: string, meta?: Record<string, any>): void;
  warn?(message: string, meta?: Record<string, any>): void;
  error?(message: string, meta?: Record<string, any>): void;
}

// ─── Response Types ──────────────────────────────────────

/** Paginated response wrapper */
export interface PagedResult<T> {
  items: T[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// ─── Endpoint Registry ───────────────────────────────────

/** WSDL endpoint configuration per service */
export interface ServiceEndpoints {
  production: string;
  test: string;
}

/** WSDL endpoints for all Uyumsoft services */
export const UYUMSOFT_ENDPOINTS = {
  efatura: {
    production: 'https://edonusumapi.uyum.com.tr/services/Integration?wsdl',
    test: 'https://efatura-test.uyumsoft.com.tr/Services/Integration?wsdl',
  },
  eirsaliye: {
    production: 'https://edonusumapi.uyum.com.tr/services/DespatchIntegration?wsdl',
    test: 'https://efaturaws-test.uyum.com.tr/services/DespatchIntegration?wsdl',
  },
  esmm: {
    production: 'https://edonusumapi.uyum.com.tr/services/VoucherIntegration?wsdl',
    test: 'https://efaturaws-test.uyum.com.tr/services/VoucherIntegration?wsdl',
  },
  emm: {
    production: 'https://edonusumapi.uyum.com.tr/services/ProducerReceiptIntegration?wsdl',
    test: 'https://efaturaws-test.uyum.com.tr/services/ProducerReceiptIntegration?wsdl',
  },
  edefter: {
    production: 'https://edonusumapi.uyum.com.tr/services/LedgerIntegration?wsdl',
    test: 'https://efaturaws-test.uyum.com.tr/services/LedgerIntegration?wsdl',
  },
  ebilet: {
    production: 'https://edonusumapi.uyum.com.tr/services/TicketIntegration?wsdl',
    test: 'https://efaturaws-test.uyum.com.tr/services/TicketIntegration?wsdl',
  },
  eadisyon: {
    production: 'https://edonusumapi.uyum.com.tr/services/GuestCheckIntegration?wsdl',
    test: 'https://efaturaws-test.uyum.com.tr/services/GuestCheckIntegration?wsdl',
  },
  edoviz: {
    production: 'https://edonusumapi.uyum.com.tr/services/ForeignExchangeIntegration?wsdl',
    test: 'https://efaturaws-test.uyum.com.tr/services/ForeignExchangeIntegration?wsdl',
  },
  ebankamakbuzu: {
    production: 'https://edonusumapi.uyum.com.tr/services/BankReceiptIntegration?wsdl',
    test: 'https://efaturaws-test.uyum.com.tr/services/BankReceiptIntegration?wsdl',
  },
  egiderpusulasi: {
    production: 'https://edonusumapi.uyum.com.tr/services/ExpenseReceiptIntegration?wsdl',
    test: 'https://efaturaws-test.uyum.com.tr/services/ExpenseReceiptIntegration?wsdl',
  },
} as const satisfies Record<string, ServiceEndpoints>;

// ─── Shared Enums ────────────────────────────────────────

/** Sort direction — shared across all services */
export const QuerySortMode = {
  Default: 'Default',
  Ascending: 'Ascending',
  Descending: 'Descending',
} as const;
export type QuerySortMode = (typeof QuerySortMode)[keyof typeof QuerySortMode];

// ─── Shared Base Types ───────────────────────────────────

/** Log record — used across all services for status-with-logs responses */
export interface LogRecordItem {
  Creator?: string;
  CreateDateUtc: string;
  RemoteIpAddress?: string;
  LocalIpAddress?: string;
  MachineName?: string;
  Type: number;
  Message?: string;
}

/** Document access file types — shared across services */
export const DocumentAccessFileType = {
  All: 'All',
  Default: 'Default',
  Xml: 'Xml',
  Pdf: 'Pdf',
  Html: 'Html',
} as const;
export type DocumentAccessFileType =
  (typeof DocumentAccessFileType)[keyof typeof DocumentAccessFileType];

/** System document types — shared across services */
export const SystemDocumentType = {
  Unknown: 'Unknown',
  OutboxInvoice: 'OutboxInvoice',
  Voucher: 'Voucher',
  ProducerReceipt: 'ProducerReceipt',
  InboxInvoice: 'InboxInvoice',
  OutboxDespatch: 'OutboxDespatch',
  InboxDespatch: 'InboxDespatch',
  GuestCheck: 'GuestCheck',
  ForeignExchange: 'ForeignExchange',
  GibArchive: 'GibArchive',
  Ticket: 'Ticket',
  PassengerList: 'PassengerList',
  BankReceipt: 'BankReceipt',
  InsuranceCommission: 'InsuranceCommission',
  Ledger: 'Ledger',
  AssetsLedger: 'AssetsLedger',
  Reconciliation: 'Reconciliation',
  OkcReport: 'OkcReport',
  ExpenseReceipt: 'ExpenseReceipt',
} as const;
export type SystemDocumentType = (typeof SystemDocumentType)[keyof typeof SystemDocumentType];
