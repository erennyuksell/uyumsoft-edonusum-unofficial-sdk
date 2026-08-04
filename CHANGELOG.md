# Changelog

## 0.2.0

### Breaking

- `environment` now defaults to `'test'` instead of `'production'`. Callers that never set it
  were silently talking to the live endpoint; set `environment: 'production'` explicitly.

### Fixed

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
