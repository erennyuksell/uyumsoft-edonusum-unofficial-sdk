import { describe, expect, it } from 'vitest';
import { EFaturaClient } from '../src/services/e-fatura/client';
import { UYUMSOFT_ENDPOINTS } from '../src/core/types';
import { Uyumsoft } from '../src/uyumsoft';
import {
  ENDPOINT_MATRIX,
  installSoapCapture,
  invokeEndpoint,
  type EndpointSafety,
} from './support/endpoint-matrix';

const EXPECTED_SERVICES = [
  'eadisyon',
  'ebankamakbuzu',
  'ebilet',
  'edefter',
  'edoviz',
  'efatura',
  'egiderpusulasi',
  'eirsaliye',
  'emm',
  'esmm',
];

describe('endpoint matrix', () => {
  it('classifies every discovered SDK operation', () => {
    expect(ENDPOINT_MATRIX.length).toBeGreaterThan(170);
    expect([...new Set(ENDPOINT_MATRIX.map((row) => row.service))].sort()).toEqual(
      EXPECTED_SERVICES,
    );

    const missingSafety = ENDPOINT_MATRIX.filter((row) => !row.safety);
    const missingResponseKind = ENDPOINT_MATRIX.filter((row) => !row.responseKind);
    const duplicatePaths = duplicateValues(ENDPOINT_MATRIX.map((row) => row.publicPath));

    expect(missingSafety).toEqual([]);
    expect(missingResponseKind).toEqual([]);
    expect(duplicatePaths).toEqual([]);
  });

  it('defaults SDK clients to the Uyumsoft test WSDL unless production is explicit', () => {
    const testDefault = new EFaturaClient({ username: 'fixture', password: 'fixture' });
    const explicitProduction = new EFaturaClient({
      username: 'fixture',
      password: 'fixture',
      environment: 'production',
    });

    expect(getWsdlUrl(testDefault)).toBe(UYUMSOFT_ENDPOINTS.efatura.test);
    expect(getWsdlUrl(explicitProduction)).toBe(UYUMSOFT_ENDPOINTS.efatura.production);
  });

  it.each(ENDPOINT_MATRIX)('captures $publicPath without opening SOAP', async (row) => {
    const client = new Uyumsoft({
      username: 'fixture-user',
      password: 'fixture-password',
    });
    const calls = installSoapCapture(client, row);

    await invokeEndpoint(client, row);

    if (row.responseKind === 'describe') {
      expect(calls).toEqual([]);
      return;
    }

    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe(row.soapMethod);
    expect(JSON.stringify(calls[0].params ?? {})).not.toContain('fixture-password');
  });

  it('keeps known request shapes stable for high-risk SOAP serializers', async () => {
    const client = new Uyumsoft({ username: 'fixture', password: 'fixture' });
    const row = ENDPOINT_MATRIX.find((entry) => entry.publicPath === 'efatura.inbox.list');

    expect(row).toBeDefined();
    if (!row) return;

    row.sampleArgs = [{ PageIndex: 3, PageSize: 10, OnlyNewestInvoices: true }];
    const calls = installSoapCapture(client, row);

    await invokeEndpoint(client, row);

    expect(calls[0]).toEqual({
      method: 'GetInboxInvoiceList',
      params: {
        query: {
          $attributes: { PageIndex: 3, PageSize: 10, OnlyNewestInvoices: true },
        },
      },
    });
  });

  it('marks production-risk methods outside readonly live coverage', () => {
    const unsafeMethods = ENDPOINT_MATRIX.filter((row) => row.safety === 'unsafe-production');
    const readonlyLiveEligible = ENDPOINT_MATRIX.filter(isReadonlyLiveEligible);

    expect(unsafeMethods.length).toBeGreaterThan(30);
    expect(readonlyLiveEligible.every((row) => row.safety === 'readonly')).toBe(true);
    expect(readonlyLiveEligible.map((row) => row.publicPath)).toContain(
      'efatura.system.testConnection',
    );
    expect(readonlyLiveEligible.map((row) => row.publicPath)).toContain('efatura.inbox.list');
  });
});

function duplicateValues(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }

  return [...duplicates].sort();
}

function getWsdlUrl(client: EFaturaClient): string {
  return (client as unknown as { wsdlUrl: string }).wsdlUrl;
}

function isReadonlyLiveEligible(row: { safety: EndpointSafety; responseKind: string }): boolean {
  return (
    row.safety === 'readonly' &&
    ['flag', 'object', 'paged', 'array', 'string'].includes(row.responseKind)
  );
}
