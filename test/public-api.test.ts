import { describe, expect, it } from 'vitest';
import {
  EFaturaTypes,
  UYUMSOFT_ENDPOINTS,
  Uyumsoft,
  UyumsoftAuthError,
  buildUyumsoftInvoiceInfo,
  type UblInvoiceInput,
  type UnknownRecord,
} from '../src/index';

const invoiceInput: UblInvoiceInput = {
  invoiceNo: 'TST2026000000001',
  uuid: '550e8400-e29b-41d4-a716-446655440000',
  issueDate: new Date('2026-05-25T09:00:00+03:00'),
  issueTime: '09:00:00',
  profileId: 'TEMELFATURA',
  invoiceTypeCode: 'SATIS',
  currency: 'TRY',
  taxExclusiveAmount: 1000,
  taxAmount: 200,
  discount: 0,
  payableAmount: 1200,
  supplier: {
    vkn: '1234567890',
    title: 'Supplier A.S.',
    taxOffice: 'Istanbul',
    address: {
      street: 'Example Street',
      district: 'Kadikoy',
      city: 'Istanbul',
      country: 'Turkiye',
    },
  },
  customer: {
    vkn: '11111111111',
    title: 'Ali Veli',
    taxOffice: 'Istanbul',
    address: {
      street: 'Customer Street',
      district: 'Besiktas',
      city: 'Istanbul',
      country: 'Turkiye',
    },
    person: {
      firstName: 'Ali',
      familyName: 'Veli',
    },
  },
  lines: [
    {
      name: 'Software service',
      quantity: 1,
      unitCode: 'NIU',
      price: 1000,
      lineAmount: 1000,
      vatRate: 20,
      taxAmount: 200,
    },
  ],
};

describe('public API', () => {
  it('exports the unified Uyumsoft facade without opening SOAP connections', () => {
    const client = new Uyumsoft({
      username: 'Uyumsoft',
      password: 'Uyumsoft',
      environment: 'test',
    });

    expect(client.efatura).toBeDefined();
    expect(client.eirsaliye).toBeDefined();
    expect(UYUMSOFT_ENDPOINTS.efatura.test).toContain('Integration?wsdl');
  });

  it('exports typed Uyumsoft errors', () => {
    const error = new UyumsoftAuthError();

    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe('AUTH_ERROR');
  });

  it('builds a Uyumsoft invoice envelope from UBL-TR input', () => {
    const invoiceInfo = buildUyumsoftInvoiceInfo(invoiceInput, {
      receiverAlias: 'urn:mail:defaultpk@uyumsoft.com.tr',
    });

    expect(invoiceInfo.Scenario).toBe(EFaturaTypes.InvoiceScenarioChoosen.Automated);
    expect(invoiceInfo.TargetCustomer.VknTckn).toBe('11111111111');
    expect(invoiceInfo.TargetCustomer.Alias).toBe('urn:mail:defaultpk@uyumsoft.com.tr');
    expect((invoiceInfo.Invoice as UnknownRecord).InvoiceLine).toHaveLength(1);
  });

  it('lets Uyumsoft assign the invoice number when invoiceNo is blank', () => {
    const invoiceInfo = buildUyumsoftInvoiceInfo({ ...invoiceInput, invoiceNo: '' });

    expect((invoiceInfo.Invoice as UnknownRecord).ID).toBe('');
  });

  it('passes a 3-character series prefix through as the invoice number', () => {
    const invoiceInfo = buildUyumsoftInvoiceInfo({ ...invoiceInput, invoiceNo: 'SHI' });

    expect((invoiceInfo.Invoice as UnknownRecord).ID).toBe('SHI');
  });

  it('still rejects structurally invalid invoice input', () => {
    expect(() =>
      buildUyumsoftInvoiceInfo({ ...invoiceInput, invoiceNo: '', taxAmount: 999 }),
    ).toThrow(/taxAmount/);
  });
});
