import { describe, expect, it } from 'vitest';
import { BaseClient, type ServiceContext } from '../src/core/base-client';
import { UyumsoftAuthError, UyumsoftError } from '../src/core/errors';
import { normalizeResponse } from '../src/core/helpers';
import { EFaturaClient } from '../src/services/e-fatura/client';
import type { InboxInvoiceListItem } from '../src/services/e-fatura/types';
import type { PagedResult, SoapRequestParams, UnknownRecord } from '../src/core/types';

class FixtureClient extends BaseClient {
  constructor() {
    super(
      { username: 'fixture', password: 'fixture', environment: 'test' },
      {
        test: 'https://example.invalid/test?wsdl',
        production: 'https://example.invalid/prod?wsdl',
      },
    );
  }

  read<T>(raw: unknown, key: string): T {
    return this.unwrap<T>(raw, key);
  }

  readArray<T>(raw: unknown, key: string): T[] {
    return this.unwrapArray<T>(raw, key);
  }

  readPaged<T>(raw: unknown, key: string): PagedResult<T> {
    return this.unwrapPaged<T>(raw, key);
  }

  readFlag(raw: unknown, key: string): boolean {
    return this.unwrapFlag(raw, key);
  }
}

describe('SOAP fixtures', () => {
  it('normalizes strong-soap attributes, scalar values, arrays, and dates', () => {
    const normalized = normalizeResponse<UnknownRecord>({
      $attributes: { Id: 'INV-1', StatusCode: '1300' },
      Amount: { $attributes: { currencyID: 'TRY' }, $value: '1200.00' },
      CreatedAt: new Date('2026-05-25T12:00:00.000Z'),
      Logs: [{ $attributes: { Type: 'Info' }, Message: { $value: 'Queued' } }],
    });

    expect(normalized).toEqual({
      Id: 'INV-1',
      StatusCode: '1300',
      Amount: '1200.00',
      CreatedAt: '2026-05-25T12:00:00.000Z',
      Logs: [{ Type: 'Info', Message: 'Queued' }],
    });
  });

  it('unwraps success flags, arrays, and paged item containers', () => {
    const client = new FixtureClient();
    const raw = {
      QueryInboxInvoiceStatusResult: {
        $attributes: { IsSucceded: 'true' },
        Value: {
          InvoiceStatusInfo: [
            { $attributes: { InvoiceId: 'A', Status: 'Approved', StatusCode: '1300' } },
            { $attributes: { InvoiceId: 'B', Status: 'Error', StatusCode: '9999' } },
          ],
        },
      },
      GetInboxInvoiceListResult: {
        $attributes: { IsSucceded: 'true' },
        Value: {
          $attributes: { PageIndex: '2', PageSize: '5', TotalCount: '1', TotalPages: '1' },
          Items: {
            InboxInvoiceListItem: {
              $attributes: {
                InvoiceId: 'INV-1',
                DocumentId: 'ABC2026000000001',
                Status: 'Approved',
              },
            },
          },
        },
      },
    };

    expect(client.readArray<UnknownRecord>(raw, 'QueryInboxInvoiceStatusResult')).toHaveLength(2);

    const page = client.readPaged<InboxInvoiceListItem>(raw, 'GetInboxInvoiceListResult');
    expect(page.pageIndex).toBe(2);
    expect(page.pageSize).toBe(5);
    expect(page.items).toHaveLength(1);
    expect(page.items[0].InvoiceId).toBe('INV-1');
  });

  it('unwraps empty paged item containers as empty arrays', () => {
    const client = new FixtureClient();
    const page = client.readPaged<InboxInvoiceListItem>(
      {
        GetInboxInvoiceListResult: {
          $attributes: { IsSucceded: 'true' },
          Value: {
            $attributes: { PageIndex: '0', PageSize: '10', TotalCount: '0', TotalPages: '0' },
            Items: undefined,
          },
        },
      },
      'GetInboxInvoiceListResult',
    );

    expect(page).toEqual({
      items: [],
      pageIndex: 0,
      pageSize: 10,
      totalCount: 0,
      totalPages: 0,
    });
  });

  it('normalizes Uyumsoft API and auth failure result envelopes', () => {
    const client = new FixtureClient();

    expect(() =>
      client.readFlag(
        {
          TestConnectionResult: {
            $attributes: { IsSucceded: 'false', Message: 'Unauthorized' },
          },
        },
        'TestConnectionResult',
      ),
    ).toThrow(UyumsoftAuthError);

    expect(() =>
      client.readFlag(
        {
          SendInvoiceResult: {
            $attributes: { IsSucceded: 'false', Message: 'Invalid invoice payload' },
          },
        },
        'SendInvoiceResult',
      ),
    ).toThrow(UyumsoftError);
  });

  it('builds e-Fatura list request payloads without opening a SOAP connection', async () => {
    const client = new EFaturaClient({
      username: 'fixture',
      password: 'fixture',
      environment: 'test',
    });
    const calls: Array<{ method: string; params?: SoapRequestParams }> = [];
    const ctx = (client as unknown as { ctx: ServiceContext }).ctx;
    ctx.call = async <T = unknown>(method: string, params?: SoapRequestParams): Promise<T> => {
      calls.push({ method, params });
      return {
        GetInboxInvoiceListResult: {
          $attributes: { IsSucceded: 'true' },
          Value: {
            $attributes: { PageIndex: '3', PageSize: '10', TotalCount: '1', TotalPages: '1' },
            Items: {
              InboxInvoiceListItem: {
                $attributes: {
                  InvoiceId: 'INV-2',
                  DocumentId: 'ABC2026000000002',
                  Status: 'Approved',
                },
              },
            },
          },
        },
      } as T;
    };

    const result = await client.inbox.list({
      PageIndex: 3,
      PageSize: 10,
      OnlyNewestInvoices: true,
    });

    expect(calls[0].method).toBe('GetInboxInvoiceList');
    expect(calls[0].params?.query).toEqual({
      $attributes: { PageIndex: 3, PageSize: 10, OnlyNewestInvoices: true },
    });
    expect(result.items[0].InvoiceId).toBe('INV-2');
  });
});
