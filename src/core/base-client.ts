// Uyumsoft SDK — Enterprise Base SOAP Client
import * as strongSoap from 'strong-soap';
import type {
  UyumsoftConfig,
  ServiceEndpoints,
  PagedResult,
  RetryConfig,
  UyumsoftLogger,
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
};

// ─── ServiceContext ─────────────────────────────────────

/**
 * Shared context passed to domain group classes.
 * Eliminates the need for public wrapper methods or protected access.
 */
export interface ServiceContext {
  call<T = any>(method: string, params?: Record<string, any>): Promise<T>;
  unwrap<T>(raw: any, resultKey: string): T;
  unwrapFlag(raw: any, resultKey: string): boolean;
  unwrapPaged<T>(raw: any, resultKey: string): PagedResult<T>;
  unwrapDate(raw: any, resultKey: string): Date;
  unwrapString(raw: any, resultKey: string): string;
  describeService(): Promise<Record<string, any>>;
}

// ─── BaseClient ─────────────────────────────────────────

export abstract class BaseClient {
  private readonly retryConfig: Required<RetryConfig>;
  private readonly timeout: number;
  private readonly logger?: UyumsoftLogger;
  private readonly wsdlUrl: string;
  private soapClient: any | null = null;

  protected readonly config: UyumsoftConfig;
  protected readonly ctx: ServiceContext;

  constructor(config: UyumsoftConfig, endpoints: ServiceEndpoints) {
    this.config = config;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.retryConfig = { ...DEFAULT_RETRY, ...config.retry };
    this.logger = config.logger;
    this.wsdlUrl =
      (config.environment ?? 'production') === 'test' ? endpoints.test : endpoints.production;

    this.ctx = {
      call: this.call.bind(this),
      unwrap: this.unwrap.bind(this),
      unwrapFlag: this.unwrapFlag.bind(this),
      unwrapPaged: this.unwrapPaged.bind(this),
      unwrapDate: this.unwrapDate.bind(this),
      unwrapString: this.unwrapString.bind(this),
      describeService: this.describeService.bind(this),
    };
  }

  // ─── SOAP Client Lifecycle ───────────────────────────

  private async getClient(): Promise<any> {
    if (this.soapClient) return this.soapClient;

    this.logger?.debug?.('Creating SOAP client', { wsdlUrl: this.wsdlUrl });
    try {
      this.soapClient = await new Promise<any>((resolve, reject) => {
        strongSoap.soap.createClient(this.wsdlUrl, {}, (err: any, client: any) => {
          if (err) reject(err);
          else resolve(client);
        });
      });
      this.soapClient.setSecurity(
        new strongSoap.soap.WSSecurity(this.config.username, this.config.password),
      );
      this.logger?.info?.('SOAP client connected', { wsdlUrl: this.wsdlUrl });
      return this.soapClient;
    } catch (err) {
      throw new UyumsoftConnectionError(`Failed to connect: ${this.wsdlUrl}`, err);
    }
  }

  destroy(): void {
    this.soapClient = null;
  }

  // ─── SOAP Call with Retry ────────────────────────────

  protected async call<T = any>(method: string, params: Record<string, any> = {}): Promise<T> {
    const maxAttempts = 1 + this.retryConfig.maxRetries;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.executeCall<T>(method, params, attempt);
      } catch (err: any) {
        lastError = err;
        if (err instanceof UyumsoftAuthError) throw err;
        if (attempt >= maxAttempts || !this.isRetryable(err)) throw err;

        const delay =
          this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
        this.logger?.warn?.(`Retrying "${method}" (${attempt + 1}/${maxAttempts})`, {
          delay,
          error: err.message,
        });
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw lastError!;
  }

  private async executeCall<T>(
    method: string,
    params: Record<string, any>,
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
      client[method](params, (err: any, result: any) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    try {
      const result = await Promise.race([callPromise, timeoutPromise]);
      return result;
    } catch (err: any) {
      if (err instanceof UyumsoftTimeoutError) throw err;
      if (err.message?.includes('Authentication') || err.message?.includes('Unauthorized')) {
        throw new UyumsoftAuthError();
      }
      if (
        err.message?.includes('AuthorizedServiceMethodAttribute') &&
        err.message?.includes('Object reference not set to an instance of an object')
      ) {
        throw new UyumsoftAuthError(
          'Uyumsoft kimlik doğrulama veya servis yetki kontrolü başarısız. Kullanıcı/şifre, ortam ve e-Dönüşüm API yetkisini kontrol edin.',
        );
      }
      if (['ECONNREFUSED', 'ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT'].includes(err.code)) {
        this.soapClient = null;
        throw new UyumsoftConnectionError(err.message, err);
      }
      throw new UyumsoftError(`SOAP "${method}" failed: ${err.message}`, 'SOAP_CALL_ERROR', err);
    } finally {
      clearTimeout(timer!);
    }
  }

  private isRetryable(err: any): boolean {
    if (err instanceof UyumsoftTimeoutError) return this.retryConfig.retryOnTimeout;
    if (err instanceof UyumsoftConnectionError) return this.retryConfig.retryOnConnectionError;
    return false;
  }

  // ─── Response Unwrappers ─────────────────────────────

  protected unwrap<T>(raw: any, resultKey: string): T {
    const result = this.extractResult(raw, resultKey);
    const value = result.Value ?? result.$value ?? result.$attributes?.Value;
    return normalizeResponse<T>(value);
  }

  protected unwrapFlag(raw: any, resultKey: string): boolean {
    const result = this.extractResult(raw, resultKey);
    const v = result.$attributes?.Value;
    return v === 'true' || v === true;
  }

  protected unwrapPaged<T>(raw: any, resultKey: string): PagedResult<T> {
    const value = this.unwrap<any>(raw, resultKey);
    const a = value?.$attributes || value || {};
    return {
      items: normalizeResponse<T[]>(toArray<any>(value?.Items)),
      pageIndex: parseInt(a.PageIndex || '0', 10),
      pageSize: parseInt(a.PageSize || '20', 10),
      totalCount: parseInt(a.TotalCount || '0', 10),
      totalPages: parseInt(a.TotalPages || '0', 10),
    };
  }

  protected unwrapDate(raw: any, resultKey: string): Date {
    return new Date(this.extractResult(raw, resultKey).$attributes.Value);
  }

  protected unwrapString(raw: any, resultKey: string): string {
    const r = this.extractResult(raw, resultKey);
    return r.$attributes?.Value ?? r.$value ?? r.Value ?? '';
  }

  async describeService(): Promise<Record<string, any>> {
    return (await this.getClient()).describe();
  }

  // ─── Private ─────────────────────────────────────────

  /** Single validation point for all unwrappers. */
  private extractResult(raw: any, resultKey: string): any {
    const result = raw?.[resultKey];
    if (!result) throw new UyumsoftError(`Missing "${resultKey}"`, 'INVALID_RESPONSE', raw);

    if (result.$attributes?.IsSucceded !== 'true') {
      const msg = result.$attributes?.Message;
      if (msg?.includes('Authentication') || msg?.includes('Unauthorized'))
        throw new UyumsoftAuthError(msg);
      throw new UyumsoftError(msg || 'Unknown error', 'API_ERROR', raw);
    }
    return result;
  }
}
