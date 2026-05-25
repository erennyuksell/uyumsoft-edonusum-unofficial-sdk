# Security

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.x     | Yes       |

## Reporting a Vulnerability

Please report security issues privately through GitHub Security Advisories when available, or by opening a minimal issue without secrets, credentials, invoice payloads, or customer data.

## Dependency Notes

This SDK intentionally uses `strong-soap` because Uyumsoft/GIB SOAP payloads rely on XML attribute and text serialization compatible with the `$attributes` and `$value` conventions. The regular `soap` package was previously avoided for this integration because it can serialize attribute-like objects incorrectly for these payloads.

As of `0.1.0`, `npm audit --omit=dev` reports transitive advisories through `strong-soap` dependencies (`@cypress/request`, `httpntlm`, `qs`, `underscore`, and `uuid`). The suggested `strong-soap@3.5.6` downgrade introduces critical `request`/`form-data` findings and is not a safer replacement for this SDK.

Mitigations in this package:

- No credentials, tokens, or private endpoints are bundled.
- Public tests do not call Uyumsoft services or print SOAP credentials.
- The package boundary excludes vendor PDFs, runtime logs, `.env` files, and generated local artifacts.
- Consumers should avoid logging request payloads that contain WS-Security headers, VKN/TCKN, invoice XML, or customer data.

We will move to a safer SOAP transport when it can be verified to preserve Uyumsoft-compatible XML serialization.
