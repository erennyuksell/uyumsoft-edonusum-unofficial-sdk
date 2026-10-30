// Uyumsoft SDK — Custom Error Hierarchy

/**
 * Base error class for all Uyumsoft SDK errors.
 */
export class UyumsoftError extends Error {
  readonly code: string;
  readonly cause?: unknown;
  readonly timestamp = new Date();

  constructor(message: string, code = 'UNKNOWN_ERROR', cause?: unknown) {
    super(message);
    this.name = 'UyumsoftError';
    this.code = code;
    this.cause = cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Authentication failure — invalid credentials or insufficient permissions. */
export class UyumsoftAuthError extends UyumsoftError {
  constructor(message = 'Authentication failed') {
    super(message, 'AUTH_ERROR');
    this.name = 'UyumsoftAuthError';
  }
}

/** Connection failure — WSDL unreachable, network down, DNS failure. */
export class UyumsoftConnectionError extends UyumsoftError {
  /** True when no request left this process (WSDL not loaded, connection refused, DNS failure). */
  readonly neverSent: boolean;

  constructor(message = 'Connection failed', cause?: unknown, neverSent = false) {
    super(message, 'CONNECTION_ERROR', cause);
    this.name = 'UyumsoftConnectionError';
    this.neverSent = neverSent;
  }
}

/** Timeout — SOAP request exceeded configured timeout. */
export class UyumsoftTimeoutError extends UyumsoftError {
  readonly timeoutMs: number;

  constructor(method: string, timeoutMs: number) {
    super(`SOAP call "${method}" timed out after ${timeoutMs}ms`, 'TIMEOUT_ERROR');
    this.name = 'UyumsoftTimeoutError';
    this.timeoutMs = timeoutMs;
  }
}
