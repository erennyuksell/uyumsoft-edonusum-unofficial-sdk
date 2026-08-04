// Uyumsoft SDK — e-Fatura Service Types
// Generated from XSD: https://efatura.uyumsoft.com.tr/Services/Integration?xsd=xsd0

import type { QuerySortMode, UyumsoftDocumentPayload } from '../../core/types';
export type { QuerySortMode } from '../../core/types';

// ─── Enums ───────────────────────────────────────────────

export const InvoiceStatus = {
  NotPrepared: 'NotPrepared',
  NotSend: 'NotSend',
  Draft: 'Draft',
  Canceled: 'Canceled',
  Queued: 'Queued',
  Processing: 'Processing',
  SentToGib: 'SentToGib',
  Approved: 'Approved',
  WaitingForAprovement: 'WaitingForAprovement',
  Declined: 'Declined',
  Return: 'Return',
  EArchivedCanceled: 'EArchivedCanceled',
  Error: 'Error',
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export const InvoiceScenarioType = {
  eInvoice: 'eInvoice',
  eArchive: 'eArchive',
} as const;
export type InvoiceScenarioType = (typeof InvoiceScenarioType)[keyof typeof InvoiceScenarioType];

export const InvoiceTypes = {
  BaseInvoice: 'BaseInvoice',
  ComercialInvoice: 'ComercialInvoice',
  InvoiceWithPassanger: 'InvoiceWithPassanger',
  Export: 'Export',
  eArchive: 'eArchive',
  Hks: 'Hks',
  PublicAdministration: 'PublicAdministration',
  Energy: 'Energy',
  MedicineAndMedicalDevices: 'MedicineAndMedicalDevices',
  InvestmentIncentive: 'InvestmentIncentive',
  IdisSystem: 'IdisSystem',
} as const;
export type InvoiceTypes = (typeof InvoiceTypes)[keyof typeof InvoiceTypes];

export const InvoiceTipType = {
  Sales: 'Sales',
  Return: 'Return',
  Tax: 'Tax',
  Exception: 'Exception',
  TaxBase: 'TaxBase',
  ExportSaved: 'ExportSaved',
  Sgk: 'Sgk',
  Broker: 'Broker',
  HksSales: 'HksSales',
  HksBroker: 'HksBroker',
  WithholdingReturn: 'WithholdingReturn',
  Accomodation: 'Accomodation',
  Charge: 'Charge',
  ChargeInstant: 'ChargeInstant',
  TechSupport: 'TechSupport',
  InvestmentIncentiveSales: 'InvestmentIncentiveSales',
  InvestmentIncentiveException: 'InvestmentIncentiveException',
  InvestmentIncentiveReturn: 'InvestmentIncentiveReturn',
  InvestmentIncentiveWitholding: 'InvestmentIncentiveWitholding',
  InvestmentIncentiveWitholdingReturn: 'InvestmentIncentiveWitholdingReturn',
} as const;
export type InvoiceTipType = (typeof InvoiceTipType)[keyof typeof InvoiceTipType];

export const EnvelopeStatus = {
  NoEnvelope: 'NoEnvelope',
  Preparing: 'Preparing',
  EnvelopIsQueued: 'EnvelopIsQueued',
  EnvelopIsProcessing: 'EnvelopIsProcessing',
  FileIsNotZip: 'FileIsNotZip',
  InvalidEnvelopIdLength: 'InvalidEnvelopIdLength',
  EnvelopCouldNotCopiedFromArchive: 'EnvelopCouldNotCopiedFromArchive',
  CouldNotOpenZip: 'CouldNotOpenZip',
  ZipIsEmpty: 'ZipIsEmpty',
  FileIsNotXml: 'FileIsNotXml',
  EnvelopeIdAndXmlNameMustBeSame: 'EnvelopeIdAndXmlNameMustBeSame',
  CouldNotParseDocument: 'CouldNotParseDocument',
  EnvelopeIdNotFound: 'EnvelopeIdNotFound',
  EnvelopeIdAndZipNameMustBeSame: 'EnvelopeIdAndZipNameMustBeSame',
  InvalidVersion: 'InvalidVersion',
  SchematronCheckFailed: 'SchematronCheckFailed',
  XmlSchemaCheckFailed: 'XmlSchemaCheckFailed',
  CouldNotTakeTcknVknForSigner: 'CouldNotTakeTcknVknForSigner',
  CouldNotSaveSigniture: 'CouldNotSaveSigniture',
  EnvelopeIdIsAlreadyUsed: 'EnvelopeIdIsAlreadyUsed',
  EnvelopeContainsIdIsAlreadyUsed: 'EnvelopeContainsIdIsAlreadyUsed',
  CouldNotCheckPermission: 'CouldNotCheckPermission',
  DoesNotHaveSenderUnitPermission: 'DoesNotHaveSenderUnitPermission',
  DoesNotHavePostBoxPermission: 'DoesNotHavePostBoxPermission',
  CouldNotCheckSignPermission: 'CouldNotCheckSignPermission',
  SignerHasNoPermission: 'SignerHasNoPermission',
  IllegalSign: 'IllegalSign',
  CouldNotCheckAddress: 'CouldNotCheckAddress',
  AddressNotFound: 'AddressNotFound',
  DoesNotHaveEntegratorApplication: 'DoesNotHaveEntegratorApplication',
  CouldNotPrepareSystemResponse: 'CouldNotPrepareSystemResponse',
  SystemError: 'SystemError',
  EnvelopedProcessSuccessfully: 'EnvelopedProcessSuccessfully',
  CouldNotSendDocumentToTheAddress: 'CouldNotSendDocumentToTheAddress',
  DocumentSendingFailedWillNotRetry: 'DocumentSendingFailedWillNotRetry',
  TargetDoesNotSendSystemResponse: 'TargetDoesNotSendSystemResponse',
  TargetSendFailedSystemResponse: 'TargetSendFailedSystemResponse',
  InvoiceLinkedToCancel: 'InvoiceLinkedToCancel',
  CompletedSuccessfully: 'CompletedSuccessfully',
  CouldNotFindEnvelopeId: 'CouldNotFindEnvelopeId',
} as const;
export type EnvelopeStatus = (typeof EnvelopeStatus)[keyof typeof EnvelopeStatus];

// QuerySortMode imported from core/types

export const InvoiceListSortingColumn = {
  Default: 'Default',
  Id: 'Id',
  CreateDate: 'CreateDate',
  ExecutionDate: 'ExecutionDate',
} as const;
export type InvoiceListSortingColumn =
  (typeof InvoiceListSortingColumn)[keyof typeof InvoiceListSortingColumn];

export const DocumentResponseStatus = {
  Approved: 'Approved',
  Declined: 'Declined',
  Return: 'Return',
} as const;
export type DocumentResponseStatus =
  (typeof DocumentResponseStatus)[keyof typeof DocumentResponseStatus];

export const InvoiceDeliveryType = {
  Paper: 'Paper',
  Electronic: 'Electronic',
} as const;
export type InvoiceDeliveryType = (typeof InvoiceDeliveryType)[keyof typeof InvoiceDeliveryType];

export const InvoiceScenarioChoosen = {
  Automated: 'Automated',
  eInvoice: 'eInvoice',
  eArchive: 'eArchive',
  MusteArchive: 'MusteArchive',
} as const;
export type InvoiceScenarioChoosen =
  (typeof InvoiceScenarioChoosen)[keyof typeof InvoiceScenarioChoosen];

export const CustomerType = {
  Enterprise: 'Enterprise',
  Person: 'Person',
} as const;
export type CustomerType = (typeof CustomerType)[keyof typeof CustomerType];

export const CustomerOwnerType = {
  Government: 'Government',
  Private: 'Private',
  Vuk507Government: 'Vuk507Government',
  Vuk507Private: 'Vuk507Private',
} as const;
export type CustomerOwnerType = (typeof CustomerOwnerType)[keyof typeof CustomerOwnerType];

export const CustomerServiceType = {
  EInvoice: 'EInvoice',
  SubscriveArchive: 'SubscriveArchive',
  EArchive: 'EArchive',
  ETicket: 'ETicket',
  EArchiveArchive: 'EArchiveArchive',
  EDespatch: 'EDespatch',
  EDespatchArchive: 'EDespatchArchive',
  EseVoucher: 'EseVoucher',
  EpReceipt: 'EpReceipt',
  EseVoucherArchive: 'EseVoucherArchive',
  EpReceiptArchive: 'EpReceiptArchive',
  ERevenue_Old: 'ERevenue_Old',
  ERevenue_New: 'ERevenue_New',
  ELedger: 'ELedger',
  ELedgerArchive: 'ELedgerArchive',
  ELedgerVip: 'ELedgerVip',
  Reconciliation: 'Reconciliation',
  GuestCheck: 'GuestCheck',
  ForeignExchange: 'ForeignExchange',
  GibArchive: 'GibArchive',
  EBReceipt: 'EBReceipt',
  PreAccounting: 'PreAccounting',
  LucaIntegration: 'LucaIntegration',
  InsuranceCommission: 'InsuranceCommission',
  DocumentAccess: 'DocumentAccess',
} as const;
export type CustomerServiceType = (typeof CustomerServiceType)[keyof typeof CustomerServiceType];

export const CustomerStatus = {
  Passive: 'Passive',
  WaitingForActive: 'WaitingForActive',
  Active: 'Active',
  WaitingForPassive: 'WaitingForPassive',
  Invalid: 'Invalid',
} as const;
export type CustomerStatus = (typeof CustomerStatus)[keyof typeof CustomerStatus];

export const AliasType = {
  InvoiceReceiverbox: 'InvoiceReceiverbox',
  InvoiceSenderbox: 'InvoiceSenderbox',
  DespatchReceiverbox: 'DespatchReceiverbox',
  DespatchSenderbox: 'DespatchSenderbox',
} as const;
export type AliasType = (typeof AliasType)[keyof typeof AliasType];

export const DocumentAccessFileType = {
  All: 'All',
  Default: 'Default',
  Xml: 'Xml',
  Pdf: 'Pdf',
  Html: 'Html',
} as const;
export type DocumentAccessFileType =
  (typeof DocumentAccessFileType)[keyof typeof DocumentAccessFileType];

export const CustomerReportPeriodFormat = {
  YearMonth: 'YearMonth',
  YearWeek: 'YearWeek',
  YearMonthDay: 'YearMonthDay',
  Auto: 'Auto',
} as const;
export type CustomerReportPeriodFormat =
  (typeof CustomerReportPeriodFormat)[keyof typeof CustomerReportPeriodFormat];

export const QueryType = {
  Normal: 'Normal',
  OnlyDb: 'OnlyDb',
  OnlyTurmob: 'OnlyTurmob',
} as const;
export type QueryType = (typeof QueryType)[keyof typeof QueryType];

/** Response entity status — returned by queryResponseStatus() */
export const DocumentResponseEntityStatus = {
  Waiting: 'Waiting',
  Queued: 'Queued',
  Processing: 'Processing',
  SentToGib: 'SentToGib',
  Success: 'Success',
  Error: 'Error',
} as const;
export type DocumentResponseEntityStatus =
  (typeof DocumentResponseEntityStatus)[keyof typeof DocumentResponseEntityStatus];

/** Batch submit type — used in compressed batch operations */
export const InvoicesBatchSubmitType = {
  Send: 'Send',
  SaveDraft: 'SaveDraft',
} as const;
export type InvoicesBatchSubmitType =
  (typeof InvoicesBatchSubmitType)[keyof typeof InvoicesBatchSubmitType];

/** Batch operation result status */
export const InvoiceBatchOperationStatusCode = {
  Success: 'Success',
  Failed: 'Failed',
} as const;
export type InvoiceBatchOperationStatusCode =
  (typeof InvoiceBatchOperationStatusCode)[keyof typeof InvoiceBatchOperationStatusCode];

/** Product/service type — returned by getCreditInfo() */
export const ProductType = {
  eInvoice: 'eInvoice',
  eArchive: 'eArchive',
  eDespatch: 'eDespatch',
  eMM: 'eMM',
  eSMM: 'eSMM',
  gibArchiveInvoice: 'gibArchiveInvoice',
  eLedger: 'eLedger',
  eForeignExchange: 'eForeignExchange',
  eGuestCheck: 'eGuestCheck',
  eInsuranceCommission: 'eInsuranceCommission',
  PreAccounting: 'PreAccounting',
  eBankReceipt: 'eBankReceipt',
  eAssetsLedger: 'eAssetsLedger',
  eExpenseReceipt: 'eExpenseReceipt',
} as const;
export type ProductType = (typeof ProductType)[keyof typeof ProductType];

/** GİB faaliyet kodları — address lookup response */
export const GIBFaalKodlari = {
  Belirtilmemis: 'Belirtilmemis',
  Faal: 'Faal',
  Tanimsiz: 'Tanimsiz',
} as const;
export type GIBFaalKodlari = (typeof GIBFaalKodlari)[keyof typeof GIBFaalKodlari];

/** GİB şirket türleri — address lookup response */
export const GIBSirketTurleri = {
  Belirtilmemis: 'Belirtilmemis',
  Gercek: 'Gercek',
  Adi: 'Adi',
  Kollektif: 'Kollektif',
  AdiKomandit: 'AdiKomandit',
  ESHKomandit: 'ESHKomandit',
  LTD: 'LTD',
  Anonim: 'Anonim',
  Koop: 'Koop',
  Diger: 'Diger',
} as const;
export type GIBSirketTurleri = (typeof GIBSirketTurleri)[keyof typeof GIBSirketTurleri];

/** Kimlik numarası tipi — address lookup response */
export const KimlikNOTipi = {
  Belirtilmemis: 'Belirtilmemis',
  TCKN: 'TCKN',
  VKN: 'VKN',
  MTKN: 'MTKN',
  TCSN: 'TCSN',
} as const;
export type KimlikNOTipi = (typeof KimlikNOTipi)[keyof typeof KimlikNOTipi];

/** Phone type — customer info */
export const PhoneType = {
  Bookkeeper: 'Bookkeeper',
  Controller: 'Controller',
  Direct: 'Direct',
  Fax: 'Fax',
  InvestorRelations: 'InvestorRelations',
  Main: 'Main',
  Switchboard: 'Switchboard',
  Other: 'Other',
} as const;
export type PhoneType = (typeof PhoneType)[keyof typeof PhoneType];

/** Customer source type — customer info */
export const CustomerSourceType = {
  Default: 'Default',
  eBelge: 'eBelge',
  Hepsiburada: 'Hepsiburada',
  Trendyol: 'Trendyol',
  K_01: 'K_01',
  K_02: 'K_02',
  K_03: 'K_03',
  Paynet: 'Paynet',
  KiviPavo507: 'KiviPavo507',
  Odeal507: 'Odeal507',
  Pavo507: 'Pavo507',
} as const;
export type CustomerSourceType = (typeof CustomerSourceType)[keyof typeof CustomerSourceType];

/** XSLT view type — used in setXsltView/getXsltView */
export const XsltViewType = {
  Invoice: 'Invoice',
  AproveInvoice: 'AproveInvoice',
  CancelInvoice: 'CancelInvoice',
  eArchiveDefaultInvoice: 'eArchiveDefaultInvoice',
  eArchiveInternetSalesInvoice: 'eArchiveInternetSalesInvoice',
  EmailBody: 'EmailBody',
  Ticket: 'Ticket',
  PassengerList: 'PassengerList',
  eDespatch: 'eDespatch',
  eReceiptAdvice: 'eReceiptAdvice',
  Voucher: 'Voucher',
  CancelEmailBody: 'CancelEmailBody',
  XmlToUblTransformator: 'XmlToUblTransformator',
  VoucherEmailBody: 'VoucherEmailBody',
  VoucherCancelEmailBody: 'VoucherCancelEmailBody',
  ProducerReceipt: 'ProducerReceipt',
  InboxInvoiceEmailBody: 'InboxInvoiceEmailBody',
  ProducerReceiptEmailBody: 'ProducerReceiptEmailBody',
  ProducerReceiptCancelEmailBody: 'ProducerReceiptCancelEmailBody',
  SmsBody: 'SmsBody',
  OutboxDespatchEmailBody: 'OutboxDespatchEmailBody',
  OutboxDespatchCancelEmailBody: 'OutboxDespatchCancelEmailBody',
  InboxDespatchEmailBody: 'InboxDespatchEmailBody',
  ReconciliationRecordMail: 'ReconciliationRecordMail',
  GuestCheck: 'GuestCheck',
  ForeignExchangeSale: 'ForeignExchangeSale',
  ForeignExchangeBuy: 'ForeignExchangeBuy',
  ForeignExchangeMetalSale: 'ForeignExchangeMetalSale',
  ForeignExchangeMetalBuy: 'ForeignExchangeMetalBuy',
  InsuranceCommission: 'InsuranceCommission',
  PaBankAccountList: 'PaBankAccountList',
  PaBillList: 'PaBillList',
  PaBusinessAccountList: 'PaBusinessAccountList',
  PaCreditCardList: 'PaCreditCardList',
  PaDocumentEntityList: 'PaDocumentEntityList',
  PaStockList: 'PaStockList',
  PaVaultList: 'PaVaultList',
  BankReceipt: 'BankReceipt',
  PaBill: 'PaBill',
  PaDocumentEntity: 'PaDocumentEntity',
  ImpersonatedCustomerLedgersSummary: 'ImpersonatedCustomerLedgersSummary',
  PaReceipt: 'PaReceipt',
  PaDocumentEntitiesPeriodSummary: 'PaDocumentEntitiesPeriodSummary',
  PaFuturesList: 'PaFuturesList',
  ExpenseReceipt: 'ExpenseReceipt',
  GibArchiveInvoice: 'GibArchiveInvoice',
  PaWarehouseList: 'PaWarehouseList',
  GuestCheckReport: 'GuestCheckReport',
} as const;
export type XsltViewType = (typeof XsltViewType)[keyof typeof XsltViewType];

// ─── Query Models ────────────────────────────────────────

export interface InvoiceListQuery {
  ExecutionStartDate?: string;
  ExecutionEndDate?: string;
  CreateStartDate?: string;
  CreateEndDate?: string;
  Status?: InvoiceStatus;
  InvoiceIds?: string[];
  InvoiceNumbers?: string[];
  StatusInList?: InvoiceStatus[];
  StatusNotInList?: InvoiceStatus[];
  SortColumn?: InvoiceListSortingColumn;
  SortMode?: QuerySortMode;
  IsArchived?: boolean;
  TargetTitle?: string;
  TargetTcknVkn?: string;
  /** Page index (0-based) */
  PageIndex?: number;
  /** Page size (default 20) */
  PageSize?: number;
}

export interface InboxInvoiceListQuery extends InvoiceListQuery {
  OnlyNewestInvoices?: boolean;
}

export interface OutboxInvoiceListQuery extends InvoiceListQuery {
  Scenario?: InvoiceScenarioType;
}

export interface InvoiceQuery {
  ExecutionStartDate?: string;
  ExecutionEndDate?: string;
  InvoiceIds?: string[];
  InvoiceNumbers?: string[];
  PageIndex?: number;
  PageSize?: number;
}

export interface InboxInvoiceQuery extends InvoiceQuery {
  SetTaken?: boolean;
  OnlyNewestInvoices?: boolean;
}

// ─── Response Models ─────────────────────────────────────

/** Base invoice list item (shared between inbox/outbox) */
export interface InvoiceListItemBase {
  InvoiceId: string;
  DocumentId: string;
  Type: InvoiceTypes;
  TypeCode: number;
  TargetTcknVkn: string;
  TargetTitle: string;
  EnvelopeIdentifier: string;
  Status: InvoiceStatus;
  StatusCode: number;
  EnvelopeStatus: EnvelopeStatus;
  EnvelopeStatusCode: number;
  Message?: string;
  CreateDateUtc: string;
  ExecutionDate: string;
  PayableAmount: number;
  TaxTotal: number;
  TaxExclusiveAmount: number;
  DocumentCurrencyCode: string;
  ExchangeRate: number;
  Vat1: number;
  Vat8: number;
  Vat10: number;
  Vat18: number;
  Vat20: number;
  Vat0TaxableAmount: number;
  Vat1TaxableAmount: number;
  Vat8TaxableAmount: number;
  Vat10TaxableAmount: number;
  Vat18TaxableAmount: number;
  Vat20TaxableAmount: number;
  OrderDocumentId?: string;
  IsArchived: boolean;
  InvoiceTipType: InvoiceTipType;
  InvoiceTipTypeCode: number;
}

/** Inbox-specific invoice list item */
export interface InboxInvoiceListItem extends InvoiceListItemBase {
  IsNew: boolean;
  IsSeen: boolean;
}

/** Outbox-specific invoice list item */
export interface OutboxInvoiceListItem extends InvoiceListItemBase {
  Scenario: InvoiceScenarioType;
  ScenarioCode: number;
  LocalDocumentId?: string;
  ExtraInformation?: string;
}

/** Full invoice info (includes UBL-TR XML data) */
export interface InvoiceInfo {
  Invoice: UyumsoftDocumentPayload; // UBL-TR InvoiceType — complex XML
  TargetCustomer?: CustomerTarget;
  EArchiveInvoiceInfo?: EArchiveInvoiceInformation;
  Scenario: InvoiceScenarioChoosen;
  Notification?: NotificationInformation;
  CreateDateUtc: string;
  LocalDocumentId?: string;
  ExtraInformation?: string;
}

/** Invoice raw data (base64 encoded XML) */
export interface InvoiceData {
  Data: string; // base64
  InvoiceId: string;
  LocalDocumentId?: string;
  ExtraInformation?: string;
}

/** Customer target info */
export interface CustomerTarget {
  VknTckn: string;
  Alias: string;
  Title: string;
}

/** e-Archive specific info */
export interface EArchiveInvoiceInformation {
  DeliveryType: InvoiceDeliveryType;
  NewGenerationPamentRecorderInfo?: {
    PaperNumber: string;
    PaperDate: string;
    SerialNumber: string;
    ZNumber: string;
  };
  InternetSalesInfo?: {
    WebAddress: string;
    PaymentMidierName: string;
    PaymentType: string;
    PaymentDate: string;
  };
  WithHoldings?: { Code: string; Rate: number; Total: number }[];
}

/** Notification settings */
export interface NotificationInformation {
  Mailing?: MailingInformation[];
  Messaging?: SmsMessageInformation[];
}

export interface MailingInformation {
  EnableNotification: boolean;
  To: string;
  Subject?: string;
  BodyXsltIdentifier?: string;
  EmailAccountIdentifier?: string;
}

export interface SmsMessageInformation {
  To: string;
  Subject?: string;
  BodyXsltIdentifier?: string;
  SmsAccountIdentifier?: string;
}

/** Invoice notification request payload. */
export interface InvoiceNotificationRequest {
  Mailing?: MailingInformation[];
  Messaging?: SmsMessageInformation[];
}

/** Invoice status info */
export interface InvoiceStatusInfo {
  Status: InvoiceStatus;
  StatusCode: number;
  InvoiceId: string;
  Message?: string;
}

/** Invoice status with log details */
export interface InvoiceStatusWithLogInfo extends InvoiceStatusInfo {
  LocalDocumentId?: string;
  EnvelopeStatusCode: number;
  Logs: LogRecordItem[];
}

/** Log record */
export interface LogRecordItem {
  Creator?: string;
  CreateDateUtc: string;
  RemoteIpAddress?: string;
  LocalIpAddress?: string;
  MachineName?: string;
  Type: number;
  Message?: string;
}

/** Invoice identity (returned from send/draft) */
export interface InvoiceIdentity {
  Id: string;
  Number: string;
  InvoiceScenario: InvoiceScenarioType;
}

/** View result (HTML render of invoice) */
export interface ViewResult {
  Html: string;
  Verification?: {
    IsVerified: boolean;
    Data?: string;
    SigningDate?: string;
  };
  IsUsingDefaultXslt: boolean;
}

/** Envelope data */
export interface EnvelopeData {
  Envelope: string; // base64
  EnvelopeIdentifier: string;
  Status: EnvelopeStatus;
  StatusCode: number;
}

/** Document response info (for accepting/declining invoices) */
export interface DocumentResponseInfo {
  InvoiceId: string;
  ResponseStatus: DocumentResponseStatus;
  Reason?: string;
  LineResponses?: { LineNumber: number; Description: string }[];
}

// ─── WhoAmI Types ────────────────────────────────────────

export interface WhoAmIInfo {
  User: UserShortInfo;
  Customer: CustomerInfo;
  Company: CompanyInfo;
  Services: CustomerServiceFlags;
  DetailedServiceInfo: CustomerServiceStatus[];
}

export interface UserShortInfo {
  Username: string;
  Name: string;
  Surname: string;
  Email: string;
}

export interface CustomerInfo {
  Name: string;
  VkTckNo: string;
  TypeEnum: CustomerType;
  TaxOffice: string;
  OwnerTypeEnum: CustomerOwnerType;
  WebSite?: string;
  AddressCountry?: string;
  AddressCity?: string;
  AddressSubDivisionName?: string;
  AddressStreetName?: string;
  AddressRoom?: string;
  AddressPostalZone?: string;
  ContactName?: string;
  ContactPhone?: string;
  ContactEmail?: string;
}

export interface CompanyInfo {
  BranchName?: string;
  BranchNo?: string;
  BusinessDescription?: string;
  Email?: string;
  PhoneNumber?: string;
  FiscalYearMonth: number;
}

export interface CustomerServiceFlags {
  HasEarchive: boolean;
  HasEInvoice: boolean;
  HasELedger: boolean;
  HasETicket: boolean;
  HasVoucher: boolean;
  HasProducerReceipt: boolean;
  HasEDespatch: boolean;
  HasEGuestCheck: boolean;
  HasEForeignExchange: boolean;
  HasEGibArchive: boolean;
  HasEInsuranceCommission: boolean;
  HasPreAccounting: boolean;
  HasLucaIntegration: boolean;
}

export interface CustomerServiceStatus {
  ServiceTypeEnum: CustomerServiceType;
  StatusEnum: CustomerStatus;
  LastActivatedDateUtc?: string;
  LastDeactivatedDateUtc?: string;
}

// ─── Address Lookup Types ────────────────────────────────

export interface AddressLookupResult {
  Adi?: string;
  Soyadi?: string;
  BabaAdi?: string;
  VergiDairesiAdi?: string;
  VergiDairesiKodu?: string;
  VKN?: string;
  Unvan?: string;
  IsAdresi?: AddressInfo;
  IkametgahAdresi?: AddressInfo;
}

export interface AddressInfo {
  MahalleSemt?: string;
  CaddeSokak?: string;
  KapiNO?: string;
  DaireNO?: string;
  IlceAdi?: string;
  IlKodu?: string;
  IlAdi?: string;
}

// ─── System User Types ───────────────────────────────────

export interface SystemUser {
  Identifier: string;
  PostboxAlias: string;
  SenderboxAlias: string;
  Title: string;
  Type: string;
  SystemCreateDate: string;
  FirstCreateDate: string;
  Enabled: boolean;
}

export interface SystemUserWithAlias {
  Definition: {
    Identifier: string;
    Title: string;
    Type: string;
    CreateDateUtc: string;
    SystemCreateDate: string;
  };
  ReceiverboxAliases: SystemUserAlias[];
  SenderboxAliases: SystemUserAlias[];
  DespatchReceiverboxAliases: SystemUserAlias[];
  DespatchSenderboxAliases: SystemUserAlias[];
}

export interface SystemUserAlias {
  Alias: string;
  Type: number;
  SystemCreateDate: string;
  SystemDeleteDate?: string;
  Enabled: boolean;
}

// ─── Summary Report Types ────────────────────────────────

export interface SummaryReport {
  Last10Days?: {
    InboxWaitingForApprovalCount: number;
    OutboxWaitingForApprovalCount: number;
    OutboxErrorCount: number;
  };
  MonthlyReports?: {
    Period: number;
    InboxCount: number;
    OutboxCount: number;
  }[];
}

// ─── Credit Info Types ───────────────────────────────────

export interface CustomerCreditInfo {
  VknTckn: string;
  Product: string;
  TypeId: number;
  ContractStartDate?: string;
  ContractEndDate?: string;
  Credits: number;
  MaxFreeDate?: string;
  LastBuyedQuantity: number;
  IsNeedToBuy: boolean;
  IsPrepaid: boolean;
}
