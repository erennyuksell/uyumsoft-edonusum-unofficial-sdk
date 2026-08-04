// Uyumsoft SDK — Public Barrel Export

// ─── Facade ──────────────────────────────────────────────
export { Uyumsoft } from './uyumsoft';

// ─── Core ────────────────────────────────────────────────
export type {
  UyumsoftConfig,
  RetryConfig,
  UyumsoftLogger,
  PagedResult,
  ServiceEndpoints,
  LogRecordItem,
  SoapRequestParams,
  UnknownRecord,
  UyumsoftDocumentPayload,
} from './core/types';
export {
  UYUMSOFT_ENDPOINTS,
  DocumentAccessFileType,
  SystemDocumentType,
  QuerySortMode,
} from './core/types';
export {
  UyumsoftError,
  UyumsoftAuthError,
  UyumsoftConnectionError,
  UyumsoftTimeoutError,
} from './core/errors';
export type { ServiceContext } from './core/base-client';
export {
  toArray,
  SharedSystemMethods,
  buildPaginationAttrs,
  buildOutboxContext,
} from './core/helpers';

// ─── Builders ────────────────────────────────────────────
export { buildUyumsoftInvoiceInfo } from './builders/invoice-info';
export type { UyumsoftInvoiceOptions } from './builders/invoice-info';
export type { UblInvoiceInput } from '@erennyuksell/ubl-tr';

// ─── Services ────────────────────────────────────────────
export { EFaturaClient } from './services/e-fatura/client';
export * as EFaturaTypes from './services/e-fatura/types';

export { EIrsaliyeClient } from './services/e-irsaliye/client';
export * as EIrsaliyeTypes from './services/e-irsaliye/types';

export { ESmmClient } from './services/e-smm/client';
export * as ESmmTypes from './services/e-smm/types';

export { EMmClient } from './services/e-mm/client';
export * as EMmTypes from './services/e-mm/types';

export { EDefterClient } from './services/e-defter/client';
export * as EDefterTypes from './services/e-defter/types';

export { EBiletClient } from './services/e-bilet/client';
export * as EBiletTypes from './services/e-bilet/types';

export { EAdisyonClient } from './services/e-adisyon/client';
export * as EAdisyonTypes from './services/e-adisyon/types';

export { EDovizClient } from './services/e-doviz/client';
export * as EDovizTypes from './services/e-doviz/types';

export { EBankaMakbuzuClient } from './services/e-banka-makbuzu/client';
export * as EBankaMakbuzuTypes from './services/e-banka-makbuzu/types';

export { EGiderPusalasiClient } from './services/e-gider-pusulasi/client';
export * as EGiderPusalasiTypes from './services/e-gider-pusulasi/types';
