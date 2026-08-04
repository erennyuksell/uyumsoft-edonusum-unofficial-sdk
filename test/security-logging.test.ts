import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('security logging', () => {
  it('logs SOAP request metadata without credentials or raw payloads', () => {
    const baseClientSource = fs.readFileSync(
      path.join(ROOT_DIR, 'src/core/base-client.ts'),
      'utf8',
    );

    expect(baseClientSource).toContain('params: Object.keys(params)');
    expect(baseClientSource).not.toMatch(/logger\?\.(debug|info|warn|error)\?\([^;]*password/i);
    expect(baseClientSource).not.toMatch(/logger\?\.(debug|info|warn|error)\?\([^;]*this\.config/i);
    expect(baseClientSource).not.toMatch(/logger\?\.(debug|info|warn|error)\?\([^;]*invoiceXml/i);
  });
});
