/* global console */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'uyumsoft-sdk-pack-'));
const packDir = path.join(tmpDir, 'pack');
const installDir = path.join(tmpDir, 'consumer');

await fs.mkdir(packDir);
await fs.mkdir(installDir);

try {
  const { stdout } = await execFileAsync(
    'npm',
    ['pack', '--json', '--ignore-scripts', '--pack-destination', packDir],
    { cwd: rootDir },
  );
  const [packed] = JSON.parse(stdout);
  const packagePath = path.join(packDir, packed.filename);

  await fs.writeFile(
    path.join(installDir, 'package.json'),
    JSON.stringify({ type: 'module', private: true }, null, 2),
  );

  await execFileAsync('npm', ['install', packagePath, '--ignore-scripts'], { cwd: installDir });

  await fs.writeFile(
    path.join(installDir, 'esm-smoke.mjs'),
    `
      import { Uyumsoft, UYUMSOFT_ENDPOINTS } from '@erennyuksell/uyumsoft-edonusum-unofficial-sdk';
      const client = new Uyumsoft({ username: 'fixture', password: 'fixture' });
      if (!client.efatura || !UYUMSOFT_ENDPOINTS.efatura.test.includes('Integration?wsdl')) {
        throw new Error('ESM import smoke failed');
      }
    `,
  );

  await fs.writeFile(
    path.join(installDir, 'cjs-smoke.cjs'),
    `
      const { Uyumsoft, UYUMSOFT_ENDPOINTS } = require('@erennyuksell/uyumsoft-edonusum-unofficial-sdk');
      const client = new Uyumsoft({ username: 'fixture', password: 'fixture' });
      if (!client.efatura || !UYUMSOFT_ENDPOINTS.efatura.test.includes('Integration?wsdl')) {
        throw new Error('CJS require smoke failed');
      }
    `,
  );

  await execFileAsync('node', ['esm-smoke.mjs'], { cwd: installDir });
  await execFileAsync('node', ['cjs-smoke.cjs'], { cwd: installDir });

  console.log(JSON.stringify({ package: packed.filename, smoke: 'passed' }, null, 2));
} finally {
  await fs.rm(tmpDir, { recursive: true, force: true });
}
