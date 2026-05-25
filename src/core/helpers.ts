// Uyumsoft SDK — Shared Helpers & Base Domain Classes
import type { ServiceContext } from './base-client';
import type { QuerySortMode } from './types';

// ─── Utility Functions ───────────────────────────────────

/**
 * Normalize a SOAP response that may be a single object, an array, or undefined.
 * Many Uyumsoft endpoints return a single item instead of an array when count=1.
 */
export function toArray<T>(val: T | T[] | undefined): T[] {
  if (Array.isArray(val)) return val;
  return val ? [val] : [];
}

/**
 * Recursively normalize strong-soap response objects.
 *
 * strong-soap wraps XML attributes in `$attributes` and text content in `$value`.
 * Our type definitions expect direct fields (e.g., `item.Id` not `item.$attributes.Id`).
 *
 * This flattens `$attributes` into the parent and replaces `$value`-only objects
 * with the scalar value, so responses match our existing types.
 */
export function normalizeResponse<T>(value: any): T {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  // strong-soap auto-converts DateTime XML to JS Date objects — preserve as ISO string
  if (value instanceof Date) return value.toISOString() as T;
  if (Array.isArray(value)) return value.map((v) => normalizeResponse(v)) as T;

  const keys = Object.keys(value);

  // If object only has $attributes, flatten it
  if (keys.length === 1 && keys[0] === '$attributes') {
    return normalizeResponse(value.$attributes);
  }

  // If object has $value (text content) + possibly $attributes
  if ('$value' in value) {
    // Simple scalar with attributes — return just the value for most cases
    if (keys.length <= 2 && '$attributes' in value) {
      return value.$value;
    }
    return value.$value;
  }

  // Recursively normalize all nested objects, spreading $attributes into parent
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(value)) {
    if (k === '$attributes' && typeof v === 'object' && v !== null) {
      // Spread attributes into parent
      for (const [ak, av] of Object.entries(v)) {
        result[ak] = normalizeResponse(av);
      }
    } else if (k !== '$value') {
      result[k] = normalizeResponse(v);
    }
  }
  return result as T;
}

// ─── Shared System Methods ───────────────────────────────

/**
 * System methods available on ALL Uyumsoft services.
 * Shared base eliminates duplication across 4 service clients.
 */
export class SharedSystemMethods {
  constructor(protected readonly ctx: ServiceContext) {}

  /** Get server system date (UTC). */
  async getDate(): Promise<Date> {
    const raw = await this.ctx.call('GetSystemDate');
    return this.ctx.unwrapDate(raw, 'GetSystemDateResult');
  }

  /** Generate a signed URL for document access (PDF, XML, HTML). */
  async generateDocumentUrl(
    documentType: string,
    documentId: string,
    fileType = 'Pdf',
  ): Promise<string> {
    const raw = await this.ctx.call('GenerateDocumentUrl', {
      documentAccessInfo: {
        DocumentType: documentType,
        DocumentId: documentId,
        AllowedFileTypes: 'All',
        FileType: fileType,
      },
    });
    return this.ctx.unwrapString(raw, 'GenerateDocumentUrlResult');
  }

  /** List all available SOAP methods on this service endpoint. */
  async describe(): Promise<Record<string, any>> {
    return this.ctx.describeService();
  }
}

// ─── Shared Query Builders ───────────────────────────────

/** Common pagination attributes for SOAP queries */
export function buildPaginationAttrs(pageIndex?: number, pageSize?: number) {
  return { PageIndex: pageIndex ?? 0, PageSize: pageSize ?? 20 };
}

/** Normalized query input for outbox context builders */
export interface OutboxContextQuery {
  Identifier?: string;
  Number?: string;
  TargetTitle?: string;
  TargetVknTckn?: string;
  StartDate?: string;
  EndDate?: string;
  IsArchived?: boolean;
  SortMode?: QuerySortMode;
  PayableAmountBegin?: number;
  PayableAmountEnd?: number;
  PageIndex?: number;
  PageSize?: number;
}

/**
 * Build the standardized outbox context object for e-SMM and e-MM.
 *
 * Both services use the same DocumentStartDate/DocumentEndDate + context pattern.
 * The only difference is the document number field name.
 *
 * @param query - Query parameters
 * @param numberField - The API field name for the document number (e.g. 'VoucherNumber', 'ReceiptNumber')
 */
export function buildOutboxContext(query: OutboxContextQuery, numberField: string) {
  return {
    $attributes: buildPaginationAttrs(query.PageIndex, query.PageSize),
    Identifier: query.Identifier ?? null,
    [numberField]: query.Number ?? null,
    TargetTitle: query.TargetTitle ?? null,
    TargetVknTckn: query.TargetVknTckn ?? null,
    DocumentStartDate: query.StartDate ?? null,
    DocumentEndDate: query.EndDate ?? null,
    CreationSartDate: null, // NOTE: Uyumsoft API typo — actual field name is misspelled
    CreationEndDate: null,
    IsArchived: query.IsArchived ?? null,
    Ascending: query.SortMode === 'Ascending',
    HasNoTag: false,
    HasAnyTag: false,
    PayableAmountBegin: query.PayableAmountBegin ?? null,
    PayableAmountEnd: query.PayableAmountEnd ?? null,
  };
}
