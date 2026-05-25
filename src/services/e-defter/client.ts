// Uyumsoft SDK — e-Defter (Ledger) Client
import { BaseClient, type ServiceContext } from '../../core/base-client';
import { UYUMSOFT_ENDPOINTS, type UyumsoftConfig } from '../../core/types';
import { toArray, SharedSystemMethods } from '../../core/helpers';
import type {
  LedgerSource,
  LedgerInfo,
  LedgerLog,
  LedgerSchematronResult,
  LedgerReport,
  CompanyInfo,
  AccountantInfo,
  LedgerSourceInfo,
} from './types';

/**
 * e-Defter client — Yevmiye defteri + Kebir defteri.
 * 50 methods: system + source upload, ledger CRUD, certificates, reports,
 * company/accountant info, PDF/HTML transform, signing, sync.
 */
export class EDefterClient extends BaseClient {
  readonly system: SharedSystemMethods;
  readonly sources: LedgerSourceMethods;
  readonly ledgers: LedgerMethods;
  readonly reports: LedgerReportMethods;
  readonly company: CompanyMethods;

  constructor(config: UyumsoftConfig) {
    super(config, UYUMSOFT_ENDPOINTS.edefter);
    this.system = new SharedSystemMethods(this.ctx);
    this.sources = new LedgerSourceMethods(this.ctx);
    this.ledgers = new LedgerMethods(this.ctx);
    this.reports = new LedgerReportMethods(this.ctx);
    this.company = new CompanyMethods(this.ctx);
  }
}

// ─── Source Management ───────────────────────────────────

class LedgerSourceMethods {
  constructor(private readonly ctx: ServiceContext) {}

  async upload(source: any): Promise<any> {
    const raw = await this.ctx.call('UploadSource', { source });
    return this.ctx.unwrap(raw, 'UploadSourceResult');
  }

  async list(): Promise<LedgerSource[]> {
    const raw = await this.ctx.call('GetLedgerSources');
    return toArray(this.ctx.unwrap<any>(raw, 'GetLedgerSourcesResult'));
  }

  async getInfo(sourceId: string): Promise<LedgerSourceInfo> {
    const raw = await this.ctx.call('GetSourceInformation', { sourceId });
    return this.ctx.unwrap<LedgerSourceInfo>(raw, 'GetSourceInformationResult');
  }

  async cancel(sourceId: string): Promise<boolean> {
    const raw = await this.ctx.call('CancelLedgerSource', { sourceId });
    return this.ctx.unwrapFlag(raw, 'CancelLedgerSourceResult');
  }

  async getLogs(sourceId: string): Promise<LedgerLog[]> {
    const raw = await this.ctx.call('GetLedgerSourceLogs', { sourceId });
    return toArray(this.ctx.unwrap<any>(raw, 'GetLedgerSourceLogsResult'));
  }
}

// ─── Ledger CRUD ─────────────────────────────────────────

class LedgerMethods {
  constructor(private readonly ctx: ServiceContext) {}

  async list(): Promise<LedgerInfo[]> {
    const raw = await this.ctx.call('GetLedgers');
    return toArray(this.ctx.unwrap<any>(raw, 'GetLedgersResult'));
  }

  async getData(ledgerId: string): Promise<any> {
    const raw = await this.ctx.call('GetLedgerData', { ledgerId });
    return this.ctx.unwrap(raw, 'GetLedgerDataResult');
  }

  async getDataByFileType(ledgerId: string, fileType: string): Promise<any> {
    const raw = await this.ctx.call('GetLedgerDataByFileType', { ledgerId, fileType });
    return this.ctx.unwrap(raw, 'GetLedgerDataByFileTypeResult');
  }

  async getCompressedData(ledgerId: string): Promise<string> {
    const raw = await this.ctx.call('GetLedgerCompressedData', { ledgerId });
    return this.ctx.unwrapString(raw, 'GetLedgerCompressedDataResult');
  }

  async getCompressedAllData(ledgerId: string): Promise<string> {
    const raw = await this.ctx.call('GetLedgerCompressedAllData', { ledgerId });
    return this.ctx.unwrapString(raw, 'GetLedgerCompressedAllDataResult');
  }

  async getCompressedDataByFileType(ledgerId: string, fileType: string): Promise<string> {
    const raw = await this.ctx.call('GetLedgerCompressedDataByFileType', { ledgerId, fileType });
    return this.ctx.unwrapString(raw, 'GetLedgerCompressedDataByFileTypeResult');
  }

  async cancel(ledgerId: string): Promise<boolean> {
    const raw = await this.ctx.call('CancelLedger', { ledgerId });
    return this.ctx.unwrapFlag(raw, 'CancelLedgerResult');
  }

  async getLogs(ledgerId: string): Promise<LedgerLog[]> {
    const raw = await this.ctx.call('GetLedgerLogs', { ledgerId });
    return toArray(this.ctx.unwrap<any>(raw, 'GetLedgerLogsResult'));
  }

  async getSchematronResults(ledgerId: string): Promise<LedgerSchematronResult[]> {
    const raw = await this.ctx.call('GetLedgerSchematronResults', { ledgerId });
    return toArray(this.ctx.unwrap<any>(raw, 'GetLedgerSchematronResultsResult'));
  }

  async uploadSigned(ledgerId: string, signedData: string): Promise<boolean> {
    const raw = await this.ctx.call('UploadSignedLedger', { ledgerId, signedData });
    return this.ctx.unwrapFlag(raw, 'UploadSignedLedgerResult');
  }

  async toPdf(ledgerId: string): Promise<string> {
    const raw = await this.ctx.call('TransformLedgerToPdf', { ledgerId });
    return this.ctx.unwrapString(raw, 'TransformLedgerToPdfResult');
  }

  async toCompressedPdf(ledgerId: string): Promise<string> {
    const raw = await this.ctx.call('TransformLedgerToCompressedPdf', { ledgerId });
    return this.ctx.unwrapString(raw, 'TransformLedgerToCompressedPdfResult');
  }

  async toCompressedHtml(ledgerId: string): Promise<string> {
    const raw = await this.ctx.call('TransformLedgerToCompressedHtml', { ledgerId });
    return this.ctx.unwrapString(raw, 'TransformLedgerToCompressedHtmlResult');
  }

  async getSigningSessionData(ledgerId: string): Promise<any> {
    const raw = await this.ctx.call('GetLedgerSigningSessionData', { ledgerId });
    return this.ctx.unwrap(raw, 'GetLedgerSigningSessionDataResult');
  }

  async canPrepare(period: string): Promise<boolean> {
    const raw = await this.ctx.call('CanPrepareLedger', { period });
    return this.ctx.unwrapFlag(raw, 'CanPrepareLedgerResult');
  }

  async storeCompleted(ledgerId: string): Promise<boolean> {
    const raw = await this.ctx.call('StoreCompletedLedger', { ledgerId });
    return this.ctx.unwrapFlag(raw, 'StoreCompletedLedgerResult');
  }

  async importLedger(data: any): Promise<any> {
    const raw = await this.ctx.call('ImportLedger', { data });
    return this.ctx.unwrap(raw, 'ImportLedgerResult');
  }

  async latestSuccessfulPeriods(): Promise<any> {
    const raw = await this.ctx.call('LatestSuccessfulPeriods');
    return this.ctx.unwrap(raw, 'LatestSuccessfulPeriodsResult');
  }

  async syncWithBookkeeper(): Promise<boolean> {
    const raw = await this.ctx.call('SyncronizeWithBookkeper');
    return this.ctx.unwrapFlag(raw, 'SyncronizeWithBookkeperResult');
  }

  async createCertificate(data: any): Promise<any> {
    const raw = await this.ctx.call('CreateCertificate', { data });
    return this.ctx.unwrap(raw, 'CreateCertificateResult');
  }

  async sendCertificate(data: any): Promise<boolean> {
    const raw = await this.ctx.call('SendCertificate', { data });
    return this.ctx.unwrapFlag(raw, 'SendCertificateResult');
  }
}

// ─── Reports ─────────────────────────────────────────────

class LedgerReportMethods {
  constructor(private readonly ctx: ServiceContext) {}

  async create(data: any): Promise<any> {
    const raw = await this.ctx.call('CreateLedgerReport', { data });
    return this.ctx.unwrap(raw, 'CreateLedgerReportResult');
  }

  async send(reportId: string): Promise<boolean> {
    const raw = await this.ctx.call('SendLedgerReport', { reportId });
    return this.ctx.unwrapFlag(raw, 'SendLedgerReportResult');
  }

  async list(): Promise<LedgerReport[]> {
    const raw = await this.ctx.call('GetLedgerReports');
    return toArray(this.ctx.unwrap<any>(raw, 'GetLedgerReportsResult'));
  }

  async getData(reportId: string): Promise<any> {
    const raw = await this.ctx.call('GetLedgerReportData', { reportId });
    return this.ctx.unwrap(raw, 'GetLedgerReportDataResult');
  }

  async getCompressedData(reportId: string): Promise<string> {
    const raw = await this.ctx.call('GetLedgerReportCompressedData', { reportId });
    return this.ctx.unwrapString(raw, 'GetLedgerReportCompressedDataResult');
  }

  async getCsvData(reportId: string): Promise<string> {
    const raw = await this.ctx.call('GetLedgerReportCsvData', { reportId });
    return this.ctx.unwrapString(raw, 'GetLedgerReportCsvDataResult');
  }

  async getPdf(reportId: string): Promise<string> {
    const raw = await this.ctx.call('GetLedgerReportPdf', { reportId });
    return this.ctx.unwrapString(raw, 'GetLedgerReportPdfResult');
  }

  async uploadSigned(reportId: string, signedData: string): Promise<boolean> {
    const raw = await this.ctx.call('UploadSignedLedgerReport', { reportId, signedData });
    return this.ctx.unwrapFlag(raw, 'UploadSignedLedgerReportResult');
  }

  async getActiveForPeriod(period: string): Promise<any> {
    const raw = await this.ctx.call('GetActiveLedgerReportWithDataForPeriod', { period });
    return this.ctx.unwrap(raw, 'GetActiveLedgerReportWithDataForPeriodResult');
  }
}

// ─── Company & Accountant ────────────────────────────────

class CompanyMethods {
  constructor(private readonly ctx: ServiceContext) {}

  async getCompanyInfo(): Promise<CompanyInfo> {
    const raw = await this.ctx.call('GetCompanyInformation');
    return this.ctx.unwrap<CompanyInfo>(raw, 'GetCompanyInformationResult');
  }

  async saveCompanyInfo(info: any): Promise<boolean> {
    const raw = await this.ctx.call('SaveCompanyInformation', { info });
    return this.ctx.unwrapFlag(raw, 'SaveCompanyInformationResult');
  }

  async getAccountantInfo(): Promise<AccountantInfo> {
    const raw = await this.ctx.call('GetAccountantInformation');
    return this.ctx.unwrap<AccountantInfo>(raw, 'GetAccountantInformationResult');
  }

  async saveAccountantInfo(info: any): Promise<boolean> {
    const raw = await this.ctx.call('SaveAccountantInformation', { info });
    return this.ctx.unwrapFlag(raw, 'SaveAccountantInformationResult');
  }

  async deleteAccountantInfo(): Promise<boolean> {
    const raw = await this.ctx.call('DeleteAccountantInformation');
    return this.ctx.unwrapFlag(raw, 'DeleteAccountantInformationResult');
  }
}
