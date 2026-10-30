// Uyumsoft SDK — Enterprise Base SOAP Client
import * as strongSoap from 'strong-soap';
import type {
  UyumsoftConfig,
  ServiceEndpoints,
  PagedResult,
  RetryConfig,
  UyumsoftLogger,
  SoapRequestParams,
  UnknownRecord,
} from './types';
import {
  UyumsoftError,
  UyumsoftAuthError,
  UyumsoftConnectionError,
  UyumsoftTimeoutError,
} from './errors';
import { toArray, normalizeResponse } from './helpers';

const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_RETRY: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1_000,
  backoffMultiplier: 2,
  retryOnTimeout: true,
  retryOnConnectionError: true,
  retryMutations: false,
};

/** Operations that only read: repeating one after a timeout changes nothing. */
const READ_ONLY_OPERATION =
  /^(Get|Query|Is|Filter|Test|WhoAmI|Validate|TryToGet|UserInfo|CanPrepare|LatestSuccessful|TransformLedger|GenerateDocumentUrl)/;

/** Uyumsoft's answer to a wrong user or password is a plain SOAP fault with this text. */
const AUTH_FAILURE = /gerekli yetkiniz yok|authentication failed|unauthorized/i;

/** Codes raised before a request is written to the socket. */
const NEVER_SENT_CODES = ['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN'];

// ─── ServiceContext ─────────────────────────────────────

/**
 * Shared context passed to domain group classes.
 * Eliminates the need for public wrapper methods or protected access.
 */
export interface ServiceContext {
  call<T = unknown>(method: string, params?: SoapRequestParams): Promise<T>;
  unwrap<T>(raw: unknown, resultKey: string): T;
  unwrapArray<T>(raw: unknown, resultKey: string): T[];
  unwrapFlag(raw: unknown, resultKey: string): boolean;
  unwrapPaged<T>(raw: unknown, resultKey: string): PagedResult<T>;
  unwrapDate(raw: unknown, resultKey: string): Date;
  unwrapString(raw: unknown, resultKey: string): string;
  /** For results that carry only success: `true`, or the API error is thrown. */
  unwrapSuccess(raw: unknown, resultKey: string): boolean;
  /** For results whose `Value` is an object: one text field of it. */
  unwrapField(raw: unknown, resultKey: string, field: string): string;
  /** For results that list items under their own element instead of `Value`. */
  unwrapElements<T>(raw: unknown, resultKey: string, element: string): T[];
  describeService(): Promise<UnknownRecord>;
}

type SoapCallback = (err: unknown, result: unknown) => void;
type SoapClientMethod = (
  params: SoapRequestParams,
  callback: SoapCallback,
  options?: { timeout: number },
) => void;
type SoapClient = Record<string, SoapClientMethod> & {
  setSecurity(security: unknown): void;
  describe(): UnknownRecord;
};

type SoapResultEnvelope = UnknownRecord & {
  $attributes?: UnknownRecord;
  Value?: unknown;
  $value?: unknown;
};

// ─── BaseClient ─────────────────────────────────────────

export abstract class BaseClient {
  private readonly retryConfig: Required<RetryConfig>;
  private readonly timeout: number;
  private readonly logger?: UyumsoftLogger;
  private readonly wsdlUrl: string;
  private soapClient: SoapClient | null = null;
  private soapClientLoading: Promise<SoapClient> | null = null;

  protected readonly config: UyumsoftConfig;
  protected readonly ctx: ServiceContext;

  constructor(config: UyumsoftConfig, endpoints: ServiceEndpoints) {
    this.config = config;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.retryConfig = { ...DEFAULT_RETRY, ...config.retry };
    this.logger = config.logger;
    this.wsdlUrl =
      (config.environment ?? 'test') === 'test' ? endpoints.test : endpoints.production;

    this.ctx = {
      call: this.call.bind(this),
      unwrap: this.unwrap.bind(this),
      unwrapArray: this.unwrapArray.bind(this),
      unwrapFlag: this.unwrapFlag.bind(this),
      unwrapPaged: this.unwrapPaged.bind(this),
      unwrapDate: this.unwrapDate.bind(this),
      unwrapString: this.unwrapString.bind(this),
      unwrapSuccess: this.unwrapSuccess.bind(this),
      unwrapField: this.unwrapField.bind(this),
      unwrapElements: this.unwrapElements.bind(this),
      describeService: this.describeService.bind(this),
    };
  }

  // ─── SOAP Client Lifecycle ───────────────────────────

  private async getClient(): Promise<SoapClient> {
    if (this.soapClient) return this.soapClient;

    // Calls that arrive while the WSDL loads share one load.
    this.soapClientLoading ??= this.createClient().finally(() => {
      this.soapClientLoading = null;
    });
    return this.soapClientLoading;
  }

  /** Loads the WSDL within the same time limit as a call: a silent endpoint must not hang it. */
  private async createClient(): Promise<SoapClient> {
    this.logger?.debug?.('Creating SOAP client', { wsdlUrl: this.wsdlUrl });
    let timer: ReturnType<typeof setTimeout>;
    try {
      const client = await Promise.race([
        new Promise<SoapClient>((resolve, reject) => {
          strongSoap.soap.createClient(this.wsdlUrl, {}, (err: unknown, created: unknown) => {
            if (err) reject(err);
            else resolve(created as SoapClient);
          });
        }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error(`WSDL not loaded within ${this.timeout}ms`)),
            this.timeout,
          );
        }),
      ]);
      client.setSecurity(
        new strongSoap.soap.WSSecurity(this.config.username, this.config.password),
      );
      this.soapClient = client;
      this.logger?.info?.('SOAP client connected', { wsdlUrl: this.wsdlUrl });
      return client;
    } catch (err) {
      throw new UyumsoftConnectionError(
        `Failed to connect: ${this.wsdlUrl}`,
        sanitizeCause(err),
        true,
      );
    } finally {
      clearTimeout(timer!);
    }
  }

  destroy(): void {
    this.soapClient = null;
    this.soapClientLoading = null;
  }

  // ─── SOAP Call with Retry ────────────────────────────

  protected async call<T = unknown>(method: string, params: SoapRequestParams = {}): Promise<T> {
    const maxAttempts = 1 + this.retryConfig.maxRetries;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.executeCall<T>(method, params, attempt);
      } catch (err) {
        lastError = err;
        if (err instanceof UyumsoftAuthError) throw err;
        if (attempt >= maxAttempts || !this.isRetryable(err, method)) throw err;

        const delay =
          this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
        this.logger?.warn?.(`Retrying "${method}" (${attempt + 1}/${maxAttempts})`, {
          delay,
          error: getErrorMessage(err),
        });
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw lastError!;
  }

  private async executeCall<T>(
    method: string,
    params: SoapRequestParams,
    attempt: number,
  ): Promise<T> {
    const client = await this.getClient();

    this.logger?.debug?.(`SOAP: ${method}`, { attempt, params: Object.keys(params) });

    // Race with timeout — clearTimeout in finally prevents timer leaks
    let timer: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new UyumsoftTimeoutError(method, this.timeout)),
        this.timeout,
      );
    });

    // strong-soap: callback-based call → promisify
    const callPromise = new Promise<T>((resolve, reject) => {
      const fn = client[method];
      if (typeof fn !== 'function') {
        reject(new UyumsoftError(`SOAP method "${method}" is not available`, 'METHOD_NOT_FOUND'));
        return;
      }
      // The HTTP request gets the limit too: a server that goes silent is disconnected. The race
      // below stays, because this limit counts inactivity and a slow steady body would outlast it.
      fn(
        params,
        (err: unknown, result: unknown) => {
          if (err) reject(err);
          else resolve(result as T);
        },
        { timeout: this.timeout },
      );
    });

    try {
      const result = await Promise.race([callPromise, timeoutPromise]);
      return result;
    } catch (err) {
      if (err instanceof UyumsoftTimeoutError) throw err;
      const message = getErrorMessage(err);
      if (AUTH_FAILURE.test(message)) {
        throw new UyumsoftAuthError();
      }
      if (
        message.includes('AuthorizedServiceMethodAttribute') &&
        message.includes('Object reference not set to an instance of an object')
      ) {
        throw new UyumsoftAuthError(
          'Uyumsoft kimlik doğrulama veya servis yetki kontrolü başarısız. Kullanıcı/şifre, ortam ve e-Dönüşüm API yetkisini kontrol edin.',
        );
      }
      const code = getErrorCode(err);
      if (
        code &&
        [...NEVER_SENT_CODES, 'ECONNRESET', 'ETIMEDOUT', 'ESOCKETTIMEDOUT'].includes(code)
      ) {
        this.soapClient = null;
        throw new UyumsoftConnectionError(
          message,
          sanitizeCause(err),
          NEVER_SENT_CODES.includes(code),
        );
      }
      throw new UyumsoftError(
        `SOAP "${method}" failed: ${message}`,
        'SOAP_CALL_ERROR',
        sanitizeCause(err),
      );
    } finally {
      clearTimeout(timer!);
    }
  }

  private isRetryable(err: unknown, method: string): boolean {
    if (err instanceof UyumsoftConnectionError && err.neverSent) {
      return this.retryConfig.retryOnConnectionError;
    }
    // The request may have arrived: repeating a write could send the same document twice.
    if (!this.retryConfig.retryMutations && !READ_ONLY_OPERATION.test(method)) return false;
    if (err instanceof UyumsoftTimeoutError) return this.retryConfig.retryOnTimeout;
    if (err instanceof UyumsoftConnectionError) return this.retryConfig.retryOnConnectionError;
    return false;
  }

  // ─── Response Unwrappers ─────────────────────────────

  protected unwrap<T>(raw: unknown, resultKey: string): T {
    const result = this.extractResult(raw, resultKey);
    const value = result.Value ?? result.$value ?? result.$attributes?.Value;
    return normalizeResponse<T>(value);
  }

  protected unwrapArray<T>(raw: unknown, resultKey: string): T[] {
    return toArray(
      normalizeResponse<T | T[]>(extractSingleContainer(this.unwrap<unknown>(raw, resultKey))),
    );
  }

  protected unwrapFlag(raw: unknown, resultKey: string): boolean {
    const result = this.extractResult(raw, resultKey);
    const v = result.$attributes?.Value;
    return v === 'true' || v === true;
  }

  protected unwrapPaged<T>(raw: unknown, resultKey: string): PagedResult<T> {
    const value = this.unwrap<SoapResultEnvelope>(raw, resultKey);
    const attrs = (value.$attributes ?? value) as UnknownRecord;
    const items = extractPagedItems(value.Items);
    return {
      items: normalizeResponse<T[]>(toArray(items)),
      pageIndex: parseInt(String(attrs.PageIndex ?? '0'), 10),
      pageSize: parseInt(String(attrs.PageSize ?? '20'), 10),
      totalCount: parseInt(String(attrs.TotalCount ?? '0'), 10),
      totalPages: parseInt(String(attrs.TotalPages ?? '0'), 10),
    };
  }

  protected unwrapDate(raw: unknown, resultKey: string): Date {
    return new Date(String(this.extractResult(raw, resultKey).$attributes?.Value ?? ''));
  }

  protected unwrapString(raw: unknown, resultKey: string): string {
    const r = this.extractResult(raw, resultKey);
    return String(r.$attributes?.Value ?? r.$value ?? r.Value ?? '');
  }

  protected unwrapSuccess(raw: unknown, resultKey: string): boolean {
    this.extractResult(raw, resultKey);
    return true;
  }

  protected unwrapField(raw: unknown, resultKey: string, field: string): string {
    const value = this.unwrap<UnknownRecord | undefined>(raw, resultKey);
    return String(value?.[field] ?? '');
  }

  protected unwrapElements<T>(raw: unknown, resultKey: string, element: string): T[] {
    return toArray(normalizeResponse<T | T[]>(this.extractResult(raw, resultKey)[element]));
  }

  async describeService(): Promise<UnknownRecord> {
    return (await this.getClient()).describe();
  }

  // ─── Private ─────────────────────────────────────────

  /** Single validation point for all unwrappers. */
  private extractResult(raw: unknown, resultKey: string): SoapResultEnvelope {
    const container = isRecord(raw) ? raw : {};
    const result = container[resultKey] as SoapResultEnvelope | undefined;
    if (!result) throw new UyumsoftError(`Missing "${resultKey}"`, 'INVALID_RESPONSE', raw);

    if (result.$attributes?.IsSucceded !== 'true') {
      const msg = String(result.$attributes?.Message ?? '');
      if (AUTH_FAILURE.test(msg)) throw new UyumsoftAuthError(msg);
      throw new UyumsoftError(msg || 'Unknown error', 'API_ERROR', raw);
    }
    return result;
  }
}

function extractPagedItems(items: unknown): unknown {
  if (Array.isArray(items) || !isRecord(items)) return items;

  const keys = Object.keys(items);
  if (keys.length === 1 && keys[0]) {
    return items[keys[0]];
  }

  return items;
}

function extractSingleContainer(value: unknown): unknown {
  if (Array.isArray(value) || !isRecord(value)) return value;

  const keys = Object.keys(value);
  if (keys.length === 1 && keys[0]) {
    return value[keys[0]];
  }

  return value;
}

/**
 * strong-soap attaches the HTTP response to its errors, and that response leads to the request
 * body with the WS-Security password. Only the parts that are safe to log are kept.
 */
function sanitizeCause(err: unknown): unknown {
  if (!(err instanceof Error)) return err;
  const source = err as Error & UnknownRecord;
  const safe = new Error(err.message) as Error & UnknownRecord;
  safe.name = err.name;
  for (const key of ['code', 'errno', 'syscall', 'root', 'body']) {
    if (source[key] !== undefined) safe[key] = source[key];
  }
  const response = source.response;
  if (isRecord(response) && response.statusCode !== undefined) {
    safe.statusCode = response.statusCode;
  }
  return safe;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getErrorCode(error: unknown): string | undefined {
  if (!isRecord(error)) return undefined;
  return typeof error.code === 'string' ? error.code : undefined;
}
