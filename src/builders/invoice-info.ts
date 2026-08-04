// builders/invoice-info.ts
// Uyumsoft-specific wrapper: UBL-TR Invoice → Uyumsoft InvoiceInfo
// This layer adds ONLY provider-specific envelope:
//   Scenario, TargetCustomer, Notification
// GİB-standard fields (e-Arşiv info) come from UblInvoiceInput.eArchiveInfo

import * as EFaturaTypes from '../services/e-fatura/types';
import type { InvoiceInfo } from '../services/e-fatura/types';
import { buildUblInvoice } from '@erennyuksell/ubl-tr';
import type { UblInvoiceInput } from '@erennyuksell/ubl-tr';

// ─── Uyumsoft Mapping Tables ─────────────────────────────

/** CRM InvoiceProfile → Uyumsoft InvoiceScenarioChoosen
 * Automated: Uyumsoft checks GİB mükellef registry and auto-routes.
 * eArchive: Forced when CRM already determined recipient is non-mükellef. */
const PROFILE_TO_SCENARIO: Record<string, string> = {
  EARSIVFATURA: EFaturaTypes.InvoiceScenarioChoosen.eArchive,
  // All other profiles → Automated (Uyumsoft checks mükellef status)
  TICARIFATURA: EFaturaTypes.InvoiceScenarioChoosen.Automated,
  TEMELFATURA: EFaturaTypes.InvoiceScenarioChoosen.Automated,
  IHRACAT: EFaturaTypes.InvoiceScenarioChoosen.Automated,
  YOLCUBERABER: EFaturaTypes.InvoiceScenarioChoosen.Automated,
  HKS: EFaturaTypes.InvoiceScenarioChoosen.Automated,
  KAMU: EFaturaTypes.InvoiceScenarioChoosen.Automated,
  ENERJI: EFaturaTypes.InvoiceScenarioChoosen.Automated,
  ILACTIBBIICIHAZ: EFaturaTypes.InvoiceScenarioChoosen.Automated,
  YATIRIMTESVIK: EFaturaTypes.InvoiceScenarioChoosen.Automated,
  IDIS: EFaturaTypes.InvoiceScenarioChoosen.Automated,
};

// ─── Uyumsoft-specific Options (provider-only) ───────────

export interface UyumsoftInvoiceOptions {
  /** Receiver alias for e-Invoice routing */
  receiverAlias?: string;
  /** Email to notify after e-Archive sending */
  notificationEmail?: string;
}

// ─── Main Wrapper ────────────────────────────────────────

/**
 * Build Uyumsoft InvoiceInfo from a provider-agnostic UblInvoiceInput.
 *
 * 1. Delegates UBL-TR XML body building to @erennyuksell/ubl-tr
 * 2. Reads GİB-standard eArchiveInfo from the input
 * 3. Wraps result in Uyumsoft-specific InvoiceInfo envelope
 *
 * The returned object is passed to `send.invoice()` or `send.saveAsDraft()`.
 *
 * `input.invoiceNo` may be left blank: Uyumsoft then allocates the next number from the
 * registered series. A 3-character prefix selects a specific series. See "Fatura Seri Numarası
 * Formatı" in the README.
 */
export function buildUyumsoftInvoiceInfo(
  input: UblInvoiceInput,
  options: UyumsoftInvoiceOptions = {},
): InvoiceInfo {
  // Uyumsoft assigns cbc:ID itself when it is blank, so the UBL-TR "invoice number is
  // required" rule must not apply here.
  const ublInvoice = buildUblInvoice(input, { providerAssignedInvoiceNo: true });
  const isEArchive = input.profileId === 'EARSIVFATURA';
  const eArchive = input.eArchiveInfo;

  return {
    Invoice: ublInvoice,
    Scenario: (PROFILE_TO_SCENARIO[input.profileId] ??
      EFaturaTypes.InvoiceScenarioChoosen.Automated) as EFaturaTypes.InvoiceScenarioChoosen,
    CreateDateUtc: new Date().toISOString(),
    TargetCustomer: {
      VknTckn: input.customer.vkn,
      Alias: options.receiverAlias ?? '',
      Title: input.customer.title,
    },

    // GİB e-Arşiv bilgileri → Uyumsoft EArchiveInvoiceInfo envelope'una map
    ...(isEArchive && eArchive
      ? {
          EArchiveInvoiceInfo: {
            DeliveryType: (eArchive.deliveryType === 'Electronic'
              ? EFaturaTypes.InvoiceDeliveryType.Electronic
              : EFaturaTypes.InvoiceDeliveryType.Paper) as EFaturaTypes.InvoiceDeliveryType,
            ...(eArchive.internetSalesInfo
              ? {
                  InternetSalesInfo: {
                    WebAddress: eArchive.internetSalesInfo.webAddress,
                    PaymentMidierName: eArchive.internetSalesInfo.paymentMediatorName,
                    PaymentType: eArchive.internetSalesInfo.paymentType,
                    PaymentDate: eArchive.internetSalesInfo.paymentDate,
                  },
                }
              : {}),
          },
        }
      : {}),

    // Uyumsoft-specific: email notification
    ...(options.notificationEmail
      ? {
          Notification: {
            Mailing: [
              {
                EnableNotification: true,
                To: options.notificationEmail,
              },
            ],
          },
        }
      : {}),
  };
}
