import { afterEach, describe, expect, it, vi } from 'vitest';
import * as strongSoap from 'strong-soap';
import { BaseClient } from '../src/core/base-client';
import {
  UyumsoftAuthError,
  UyumsoftConnectionError,
  UyumsoftTimeoutError,
} from '../src/core/errors';
import { normalizeResponse } from '../src/core/helpers';
import type { RetryConfig, UnknownRecord } from '../src/core/types';
import { EDefterClient } from '../src/services/e-defter/client';
import { EDovizClient } from '../src/services/e-doviz/client';
import { EIrsaliyeClient } from '../src/services/e-irsaliye/client';

vi.mock('strong-soap', () => ({
  soap: { createClient: vi.fn(), WSSecurity: class {} },
}));

type Callback = (err: unknown, result?: unknown) => void;
type Options = { timeout: number };

class TestClient extends BaseClient {
  constructor(retry: RetryConfig = {}, timeout = 50) {
    super(
      {
        username: 'u',
        password: 'p',
        environment: 'test',
        timeout,
        retry: { initialDelay: 1, ...retry },
      },
      {
        test: 'https://example.invalid/test?wsdl',
        production: 'https://example.invalid/prod?wsdl',
      },
    );
  }

  run(method: string): Promise<unknown> {
    return this.call(method);
  }
}

/** The SOAP client strong-soap would create, with one operation. */
function soapClientWith(method: string, impl: (callback: Callback, options: Options) => void) {
  const calls: Options[] = [];
  vi.mocked(strongSoap.soap.createClient).mockImplementation(((
    _url: string,
    _options: unknown,
    done: (err: unknown, client: unknown) => void,
  ) => {
    done(null, {
      setSecurity: () => undefined,
      [method]: (_params: unknown, callback: Callback, options: Options) => {
        calls.push(options);
        impl(callback, options);
      },
    });
  }) as never);
  return calls;
}

const CONFIG = { username: 'u', password: 'p' };
const ok = { $attributes: { IsSucceded: 'true' } };

afterEach(() => vi.mocked(strongSoap.soap.createClient).mockReset());

describe('retry', () => {
  const dropped = () => Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' });

  it('does not repeat a write whose request may have arrived', async () => {
    const calls = soapClientWith('SendInvoice', (callback) => callback(dropped()));
    await expect(new TestClient({ maxRetries: 2 }).run('SendInvoice')).rejects.toBeInstanceOf(
      UyumsoftConnectionError,
    );
    expect(calls).toHaveLength(1);
  });

  it('does not repeat a write after a timeout', async () => {
    const calls = soapClientWith('CancelEArchiveInvoice', () => undefined);
    await expect(
      new TestClient({ maxRetries: 2 }).run('CancelEArchiveInvoice'),
    ).rejects.toBeInstanceOf(UyumsoftTimeoutError);
    expect(calls).toHaveLength(1);
  });

  it('repeats a read', async () => {
    const calls = soapClientWith('GetOutboxInvoiceList', (callback) => callback(dropped()));
    await expect(
      new TestClient({ maxRetries: 2 }).run('GetOutboxInvoiceList'),
    ).rejects.toBeInstanceOf(UyumsoftConnectionError);
    expect(calls).toHaveLength(3);
  });

  it('does not take a write for a read because of its first letters', async () => {
    const calls = soapClientWith('ImportExistingInvoice', (callback) => callback(dropped()));
    await expect(
      new TestClient({ maxRetries: 2 }).run('ImportExistingInvoice'),
    ).rejects.toBeInstanceOf(UyumsoftConnectionError);
    expect(calls).toHaveLength(1);
  });

  it('repeats a write when the connection was never made', async () => {
    const refused = Object.assign(new Error('refused'), { code: 'ECONNREFUSED' });
    const calls = soapClientWith('SendInvoice', (callback) => callback(refused));
    const error = await new TestClient({ maxRetries: 1 }).run('SendInvoice').catch((e) => e);
    expect(error).toBeInstanceOf(UyumsoftConnectionError);
    expect((error as UyumsoftConnectionError).neverSent).toBe(true);
    expect(calls).toHaveLength(2);
  });

  it('repeats a write only on request', async () => {
    const calls = soapClientWith('SendInvoice', (callback) => callback(dropped()));
    await expect(
      new TestClient({ maxRetries: 1, retryMutations: true }).run('SendInvoice'),
    ).rejects.toBeInstanceOf(UyumsoftConnectionError);
    expect(calls).toHaveLength(2);
  });
});

describe('time limit', () => {
  it('reaches the HTTP request', async () => {
    const calls = soapClientWith('WhoAmI', (callback) => callback(null, { ok: true }));
    await new TestClient({}, 1234).run('WhoAmI');
    expect(calls[0]).toEqual({ timeout: 1234 });
  });

  it('covers loading the WSDL, and that load is shared', async () => {
    vi.mocked(strongSoap.soap.createClient).mockImplementation((() => undefined) as never);
    const client = new TestClient({ maxRetries: 0 });
    const [first, second] = await Promise.allSettled([client.run('WhoAmI'), client.run('WhoAmI')]);
    for (const outcome of [first, second]) {
      expect(outcome.status).toBe('rejected');
      const error = (outcome as PromiseRejectedResult).reason as UyumsoftConnectionError;
      expect(error).toBeInstanceOf(UyumsoftConnectionError);
      expect(error.neverSent).toBe(true);
    }
    expect(strongSoap.soap.createClient).toHaveBeenCalledTimes(1);
  });
});

describe('errors', () => {
  it('reads a wrong user or password as an auth error', async () => {
    const fault = new Error(
      'faultcode: s:Client faultstring: Bu sisteme erişmek için gerekli yetkiniz yok, Kullanıcı: x, Ip: 1.2.3.4',
    );
    soapClientWith('WhoAmI', (callback) => callback(fault));
    await expect(new TestClient({ maxRetries: 0 }).run('WhoAmI')).rejects.toBeInstanceOf(
      UyumsoftAuthError,
    );
  });

  it('does not read every mention of authentication as an auth error', async () => {
    const fault = new Error('faultcode: s:Client faultstring: Authentication header is malformed');
    soapClientWith('WhoAmI', (callback) => callback(fault));
    const error = await new TestClient({ maxRetries: 0 }).run('WhoAmI').catch((e) => e);
    expect(error).not.toBeInstanceOf(UyumsoftAuthError);
  });

  it('keeps the request and its password out of the error', async () => {
    const fault = Object.assign(new Error('faultcode: s:Server faultstring: boom'), {
      root: { Envelope: {} },
      body: '<fault/>',
      response: { statusCode: 500, request: { body: '<wsse:Password>gizli</wsse:Password>' } },
    });
    soapClientWith('WhoAmI', (callback) => callback(fault));
    const error = (await new TestClient({ maxRetries: 0 })
      .run('WhoAmI')
      .catch((e) => e)) as Error & {
      cause: UnknownRecord;
    };
    expect(error.cause).toMatchObject({ statusCode: 500, body: '<fault/>' });
    expect(error.cause.response).toBeUndefined();
    expect(JSON.stringify(error.cause, Object.getOwnPropertyNames(error.cause))).not.toContain(
      'gizli',
    );
  });
});

describe('results that are not what their shape suggests', () => {
  const answer = (method: string, result: UnknownRecord) =>
    soapClientWith(method, (callback) => callback(null, { [`${method}Result`]: result }));

  it('returns the value of a result that is not a flag', async () => {
    answer('UploadSignedLedger', { ...ok, Value: { $attributes: { Id: 'L1' } } });
    await expect(new EDefterClient(CONFIG).ledgers.uploadSigned('L1', 'data')).resolves.toEqual({
      Id: 'L1',
    });
  });

  it('returns the date of a date result', async () => {
    answer('CanPrepareLedger', {
      $attributes: { IsSucceded: 'true', Value: '2026-10-01T00:00:00Z' },
    });
    await expect(new EDefterClient(CONFIG).ledgers.canPrepare('2026-10')).resolves.toEqual(
      new Date('2026-10-01T00:00:00Z'),
    );
  });

  it('reports success of a result that carries nothing else', async () => {
    answer('RetrySendForeignExchanges', ok);
    await expect(new EDovizClient(CONFIG).outbox.retrySend(['e'])).resolves.toBe(true);
  });

  it('throws when such a call fails', async () => {
    answer('RetrySendForeignExchanges', {
      $attributes: { IsSucceded: 'false', Message: 'olmadı' },
    });
    await expect(new EDovizClient(CONFIG).outbox.retrySend(['e'])).rejects.toThrow('olmadı');
  });

  it('reads the text field of an object result', async () => {
    answer('GetHtmlView', {
      ...ok,
      Value: { Html: '<p>belge</p>', $attributes: { IsUsingDefaultXslt: 'true' } },
    });
    await expect(new EDovizClient(CONFIG).outbox.getHtml('d')).resolves.toBe('<p>belge</p>');
    answer('GetPdfView', { ...ok, Value: { $attributes: { DocumentId: 'd' }, FileData: 'UERG' } });
    await expect(new EDovizClient(CONFIG).outbox.getPdf('d')).resolves.toBe('UERG');
  });

  it('reads items listed under their own element', async () => {
    answer('SendReceiptAdviceUbl', {
      ...ok,
      ReceiptAdviceIdentity: [{ $attributes: { ReceiptAdviceNumber: 'R1', DocumentId: 'u1' } }],
    });
    await expect(new EIrsaliyeClient(CONFIG).receipt.sendUbl([])).resolves.toEqual([
      { ReceiptAdviceNumber: 'R1', DocumentId: 'u1' },
    ]);
  });

  it('keeps the child elements of an element with text', () => {
    expect(
      normalizeResponse({ $attributes: { Id: '1' }, $value: 'metin', Child: { $value: 'c' } }),
    ).toEqual({ Id: '1', $value: 'metin', Child: 'c' });
  });
});
