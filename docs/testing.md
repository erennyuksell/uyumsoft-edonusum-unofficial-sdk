# Testing Strategy

This SDK uses layered tests because Uyumsoft e-Donusum SOAP operations have very different risk profiles. Default CI is offline and safe. Live tests are explicit and pinned to the Uyumsoft test environment.

## Test Layers

| Layer         | Command                                | Runs in PR CI         | Network           | Purpose                                                             |
| ------------- | -------------------------------------- | --------------------- | ----------------- | ------------------------------------------------------------------- |
| Typecheck     | `npm run typecheck`                    | Yes                   | No                | Public TypeScript surface and internal type safety                  |
| Lint/format   | `npm run lint && npm run format:check` | Yes                   | No                | Style, no explicit `any`, import hygiene                            |
| Unit/fixtures | `npm run test:unit`                    | Yes                   | No                | SOAP normalization, endpoint matrix, request capture, error mapping |
| Package smoke | `npm run test:package`                 | Yes                   | npm registry only | `npm pack`, temporary install, ESM import, CJS require              |
| Readonly live | `npm run test:live:readonly`           | Manual/scheduled only | Uyumsoft test     | Auth probe and safe list/read shape checks                          |
| Mutating live | `npm run test:live:mutating`           | Manual only           | Uyumsoft test     | Guarded SDKTEST fixture scenarios                                   |

## Endpoint Matrix

`test/support/endpoint-matrix.ts` builds the endpoint matrix from the service client source files. Every discovered public SDK operation is classified with:

- `readonly`: safe for live test-account smoke checks.
- `requires-existing-id`: read-like operation that needs an existing document ID or ETTN.
- `mutating`: changes draft/archive/status-like state or performs validation.
- `admin-template`: company/accountant/XSLT style account configuration.
- `unsafe-production`: send/cancel/upload/import/delete/transfer operations that must never run by default.
- `service-discovery`: local service description helpers.

The matrix test invokes each public method through the `Uyumsoft` facade with a captured `ctx.call`, so it validates SOAP method names and request serialization without opening a SOAP connection.

## Live Readonly Smoke

Readonly live tests are pinned to the Uyumsoft test WSDLs. They refuse `UYUMSOFT_ENV=production`.

```bash
UYUMSOFT_USERNAME=... UYUMSOFT_PASSWORD=... UYUMSOFT_ENV=test npm run test:live:readonly
```

The runner calls `efatura.system.testConnection()` first. Optional steps such as `whoAmI`, `inbox.list`, and `outbox.list` are reported as skipped if the test account lacks module permissions. This keeps auth/config failures separate from payload-shape failures.

## Live Mutating Smoke

Mutating tests are disabled unless every guard is explicit:

```bash
UYUMSOFT_USERNAME=... \
UYUMSOFT_PASSWORD=... \
UYUMSOFT_ENV=test \
UYUMSOFT_RUN_MUTATING_TESTS=true \
UYUMSOFT_MUTATING_FLOW=draft \
npm run test:live:mutating
```

By default the runner selects all services. e-Fatura/e-Arsiv and e-SMM have built-in generated SDKTEST fixtures. e-MM uses a test-account clone/status/cancelDraft smoke if no explicit fixture is provided. e-Irsaliye tries the vendor clone API against an existing test despatch before falling back to readonly status. e-Adisyon, e-Doviz, e-Banka Makbuzu, and e-Gider Pusulasi attempt generated SDKTEST CreditNote-style draft payloads before falling back to safe existing-document probes. Missing module permissions, branch/VKN mismatches in the public test account, and Uyumsoft test endpoint limitations are reported as skipped with a reason, not as SDK failures.

Mutating live defaults use a 60 second SOAP timeout and one retry because Uyumsoft public test services can be slow under load. Override with `UYUMSOFT_TIMEOUT_MS` and `UYUMSOFT_LIVE_MAX_RETRIES` when needed.

```bash
UYUMSOFT_USERNAME=... \
UYUMSOFT_PASSWORD=... \
UYUMSOFT_ENV=test \
UYUMSOFT_RUN_MUTATING_TESTS=true \
UYUMSOFT_MUTATING_SERVICES=efatura,esmm,emm,eirsaliye,eadisyon,edoviz,ebankamakbuzu,egiderpusulasi,ebilet,edefter \
npm run test:live:mutating
```

Supported fixture environment variables:

| Service          | Fixture env var                                    | Draft support | Notes                                                                                                              |
| ---------------- | -------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------ |
| e-Fatura/e-Arsiv | Built in                                           | Yes           | Generated from `WhoAmI`, validates first                                                                           |
| e-SMM            | Built in or `UYUMSOFT_ESMM_PAYLOAD_JSON`           | Yes           | Generated `eArsivVeriSerbestMeslekMakbuz` smoke                                                                    |
| e-MM             | Clone smoke or `UYUMSOFT_EMM_PAYLOAD_JSON`         | Yes           | Clones an existing test receipt when no fixture is set                                                             |
| e-Irsaliye       | Clone smoke or `UYUMSOFT_EIRSALIYE_PAYLOAD_JSON`   | Yes           | Tries CloneDespatches first; fixture runs save/list/status/cancelDraft                                             |
| e-Adisyon        | Built in or `UYUMSOFT_EADISYON_PAYLOAD_JSON`       | Yes           | Generated CreditNote-style payload; public test account may skip on branch/VKN mismatch                            |
| e-Doviz          | Built in or `UYUMSOFT_EDOVIZ_PAYLOAD_JSON`         | Yes           | Generated CreditNote-style payload; public test account may skip on permission                                     |
| e-Banka Makbuzu  | Built in or `UYUMSOFT_EBANKAMAKBUZU_PAYLOAD_JSON`  | Yes           | Generated CreditNote-style payload; public test account may skip on branch/VKN mismatch or endpoint context errors |
| e-Gider Pusulasi | Built in or `UYUMSOFT_EGIDERPUSULASI_PAYLOAD_JSON` | Yes           | Generated CreditNote-style payload; public test account may skip on permission                                     |
| e-Bilet          | `UYUMSOFT_EBILET_PAYLOAD_JSON`                     | No            | Fixture sends/cancels only with `UYUMSOFT_MUTATING_FLOW=send`; otherwise existing list/get probe                   |
| e-Defter         | Not enabled by default fixture contract            | No            | Requires a real ledger source/report flow                                                                          |

Use `UYUMSOFT_MUTATING_SERVICES=efatura` for the built-in generated invoice flow. Use `UYUMSOFT_REQUIRE_ALL_MUTATING_FIXTURES=true` when a manual live workflow should fail if any selected service is skipped. `UYUMSOFT_MUTATING_FLOW=send` sends supported test documents instead of saving drafts; keep that mode manual only.

## Security Notes

Tests and scripts must not print credentials, WS-Security headers, invoice XML, base64 payloads, VKN/TCKN data, or private endpoints. `npm audit --omit=dev` currently reports known transitive advisories through `strong-soap`; see `SECURITY.md` for the allowlist rationale and mitigation notes.
