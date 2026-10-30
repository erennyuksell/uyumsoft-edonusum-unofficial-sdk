# Changelog

## 0.5.0

### Breaking

- A call that changes state (sending, cancelling, responding, retrying) is no longer retried after a
  timeout or a dropped connection: the request may have arrived, and a second one can send the same
  document twice. `retry.retryMutations: true` restores the old behaviour. A connection that was never
  made is still retried; such errors carry `UyumsoftConnectionError.neverSent`.
- A wrong user or password now raises `UyumsoftAuthError`. Uyumsoft answers with the SOAP fault
  "Bu sisteme erişmek için gerekli yetkiniz yok", which used to surface as `SOAP_CALL_ERROR`. The check
  no longer matches any message that merely contains "Authentication".
- Methods that returned `boolean` but whose result is a value now return it: e-Defter `ledgers.cancel`
  (`string`), `uploadSigned` (`LedgerInfo`), `canPrepare` (`Date`), `storeCompleted` (`LedgerInfo[]`),
  `saveCompanyInfo`, `saveAccountantInfo`, e-Gider Pusulası `fromEArchiveInvoices` (`ExpenseReceipt[]`). They
  always returned `false`.
- e-Defter `getCompressedAllData` returns `LedgerData[]`, one entry per file (it returned the text
  `[object Object]`).

### Fixed

- A server that goes silent is disconnected instead of holding the socket after the call has timed out,
  and the time limit covers loading the WSDL, which could hang forever. Calls that arrive during the load
  share it.
- Errors no longer carry strong-soap's HTTP response in `cause`: it led to the request body with the
  WS-Security password. `code`, `root`, `body` and `statusCode` stay.
- e-Defter `syncWithBookkeeper` and e-Döviz `retrySend` always returned `false`: their result carries only
  success. They return `true`, and throw on failure.
- Fifteen methods returned the text `[object Object]`: e-Müstahsil `getHtmlView`, the `getHtml` and `getPdf`
  of e-Adisyon, e-Döviz, e-Banka Makbuzu and e-Gider Pusulası, and e-Defter `getCompressedData`,
  `getCompressedDataByFileType`, `toPdf`, `toCompressedPdf`, `toCompressedHtml` and the report
  `getCompressedData`. They return the HTML, or the file as base64.
- e-İrsaliye `receipt.sendUbl` returned an empty list; its result lists `ReceiptAdviceIdentity`.
- `normalizeResponse` dropped the child elements of an element that also had text.

### Added

- Enum values from the current WSDLs: `InboxVoucher`, `EAssetsLedger`, `ExpenseReceipt`, `EmlakKivi507`,
  `DocumentUsage`, `PaGeneralExpense`, `PaQuote`.
- The README documents the real status codes, that `InvoiceId` in a list row is the invoice number and
  `DocumentId` the ETTN, and which date filter to use for polling the inbox.

## 0.4.0

### Breaking

- Requires `@erennyuksell/ubl-tr` `^0.7.0` (was `^0.3.0`). `buildUyumsoftInvoiceInfo` builds and
  validates through it, so ubl-tr's checks against GİB's current e-Fatura schematron and guides apply
  here too: codes from GİB's lists, the profile and type pair (an `IADE` is not issued under
  `TICARIFATURA`), VKN and TCKN check digits, a TCKN party's first and family name, an exemption's
  reason and type, a zero VAT's exemption, the exchange rate of an invoice not in TRY, and the fields of
  each special profile (export, tax-free, KAMU, SGK, HKS, ENERJI, İDİS, ILAC_TIBBICIHAZ, investment
  incentive). Return invoices take `billingReferences` (several returned invoices); the single
  `billingReferenceInvoiceNo` still works. See the ubl-tr 0.4.0 to 0.7.0 changelogs.

## 0.3.0

### Breaking

- Requires `@erennyuksell/ubl-tr` `^0.3.0` (was `^0.2.0`). `buildUyumsoftInvoiceInfo` validates
  through it, so its stricter pre-flight checks now apply here too: document totals must equal
  the lines exactly, a line's amount and withholding must match exactly (only line VAT keeps the
  one-kuruş tolerance), withholding lines need a GİB tevkifat code at GİB's rate and a
  withholding invoice type, return types need the returned invoice's 16-character number
  (`billingReferenceInvoiceNo`), and `headerAllowanceCharges[].percent` is a percent (5 = 5%, not
  0.05); the calculator spreads the document discount or charge over the lines. Only the written
  `MultiplierFactorNumeric` is a fraction (0.05 for 5%). See the ubl-tr 0.3.0 changelog.

## 0.2.0

### Breaking

- `environment` now defaults to `'test'` instead of `'production'`. Callers that never set it
  were silently talking to the live endpoint; set `environment: 'production'` explicitly.
- Requires Node >= 20, up from >= 18. Node 18 has been end-of-life since April 2025 and the test
  toolchain no longer runs on it, so continuing to claim support would be untested.

### Fixed

- Correct the e-Fatura test endpoint. It pointed at `efatura-test.uyumsoft.com.tr`, a host that
  does not answer on 443, so `environment: 'test'` could not reach e-Fatura at all. It is now
  `efaturaws-test.uyum.com.tr/services/Integration`, matching the other nine services and
  serving the same 64 operations as production.
- `buildUyumsoftInvoiceInfo` no longer requires `invoiceNo`. Uyumsoft assigns the number itself
  when `cbc:ID` is blank, or allocates from a specific series when a 3-character prefix is sent,
  so the UBL-TR "invoice number is required" rule is now opted out of for this builder. A blank
  `invoiceNo` previously threw a `UblValidationError`. All other UBL-TR validation still applies.
- A SOAP operation missing from the WSDL now raises `METHOD_NOT_FOUND` instead of a
  "not a function" TypeError.
- Error message and code are read through helpers, so non-`Error` throws no longer crash the
  retry and error-mapping paths.
- Paged responses unwrap single-key item containers.

### Added

- `unwrapArray` on the service context.
- `UnknownRecord`, `SoapRequestParams`, and `UyumsoftDocumentPayload` types.
- Offline SOAP fixture, endpoint matrix, and logging-hygiene test suites; a package smoke test
  (`test:package`) that installs the packed tarball and checks ESM and CJS entry points; and
  readonly/mutating live smoke scripts. See [docs/testing.md](docs/testing.md).
- `npm run ci` bundling typecheck, lint, format check, unit tests, and the package test. CI runs
  it on Node 18, 20, 22, and 24; releases publish with npm provenance.

### Changed

- `@typescript-eslint/no-explicit-any` is enforced; the SOAP and UBL boundaries are typed.
- Requires `@erennyuksell/ubl-tr` >= 0.2.0.

## 0.1.0

- Initial public release.
- Adds a typed Uyumsoft e-Donusum SOAP SDK facade for 10 service groups.
- Adds Uyumsoft invoice envelope builder integration with `@erennyuksell/ubl-tr`.
