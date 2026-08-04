import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import type { ServiceContext } from '../../src/core/base-client';
import type { SoapRequestParams, UnknownRecord } from '../../src/core/types';
import type { Uyumsoft } from '../../src/uyumsoft';

export type EndpointSafety =
  | 'readonly'
  | 'requires-existing-id'
  | 'mutating'
  | 'admin-template'
  | 'unsafe-production'
  | 'service-discovery';

export type EndpointResponseKind =
  | 'flag'
  | 'string'
  | 'date'
  | 'object'
  | 'array'
  | 'paged'
  | 'void'
  | 'describe';

export interface EndpointMatrixRow {
  service: string;
  group: string;
  sdkMethod: string;
  publicPath: string;
  sourceFile: string;
  soapMethod?: string;
  resultKey?: string;
  responseKind: EndpointResponseKind;
  safety: EndpointSafety;
  sampleArgs: unknown[];
}

export interface CapturedSoapCall {
  method: string;
  params?: SoapRequestParams;
}

type MutableServiceContext = ServiceContext & {
  call: <T = unknown>(method: string, params?: SoapRequestParams) => Promise<T>;
  describeService: () => Promise<UnknownRecord>;
};

type ServiceInternals = {
  ctx: MutableServiceContext;
};

const SERVICE_FOLDERS = {
  'e-adisyon': 'eadisyon',
  'e-banka-makbuzu': 'ebankamakbuzu',
  'e-bilet': 'ebilet',
  'e-defter': 'edefter',
  'e-doviz': 'edoviz',
  'e-fatura': 'efatura',
  'e-gider-pusulasi': 'egiderpusulasi',
  'e-irsaliye': 'eirsaliye',
  'e-mm': 'emm',
  'e-smm': 'esmm',
} as const;

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const ENDPOINT_MATRIX = buildEndpointMatrix();

export function installSoapCapture(client: Uyumsoft, row: EndpointMatrixRow): CapturedSoapCall[] {
  const service = getProperty(client, row.service) as ServiceInternals;
  const calls: CapturedSoapCall[] = [];

  service.ctx.call = async <T = unknown>(
    method: string,
    params?: SoapRequestParams,
  ): Promise<T> => {
    calls.push({ method, params });
    return buildSuccessFixture(row) as T;
  };
  service.ctx.describeService = async () => ({
    service: row.service,
    source: 'fixture',
  });

  return calls;
}

export async function invokeEndpoint(client: Uyumsoft, row: EndpointMatrixRow): Promise<unknown> {
  const method = resolvePublicMethod(client, row.publicPath);
  return method(...row.sampleArgs);
}

function buildEndpointMatrix(): EndpointMatrixRow[] {
  const rows: EndpointMatrixRow[] = [];

  for (const [folder, service] of Object.entries(SERVICE_FOLDERS)) {
    const sourceFile = path.join(ROOT_DIR, 'src/services', folder, 'client.ts');
    const source = fs.readFileSync(sourceFile, 'utf8');
    const sourceFileAst = ts.createSourceFile(sourceFile, source, ts.ScriptTarget.Latest, true);
    const classToGroup = findConstructorGroups(sourceFileAst);
    const hasSystemGroup = [...classToGroup.values()].includes('system');

    if (hasSystemGroup) {
      rows.push(...sharedSystemRows(service, path.relative(ROOT_DIR, sourceFile)));
    }

    for (const statement of sourceFileAst.statements) {
      if (!ts.isClassDeclaration(statement) || !statement.name) continue;

      const className = statement.name.text;
      const group = classToGroup.get(className);
      if (!group) continue;

      for (const member of statement.members) {
        if (!ts.isMethodDeclaration(member)) continue;
        if (!member.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword)) {
          continue;
        }

        const sdkMethod = member.name.getText(sourceFileAst);
        const soapMethod = findSoapMethod(member, sourceFileAst);
        const result = findResultUnwrapper(member);

        rows.push({
          service,
          group,
          sdkMethod,
          publicPath: `${service}.${group}.${sdkMethod}`,
          sourceFile: path.relative(ROOT_DIR, sourceFile),
          soapMethod,
          resultKey: result?.resultKey,
          responseKind: result?.responseKind ?? (soapMethod ? 'void' : 'describe'),
          safety: classifyEndpoint(`${group}.${sdkMethod}.${soapMethod ?? ''}`),
          sampleArgs: member.parameters.map((parameter) => sampleArg(parameter, sourceFileAst)),
        });
      }
    }
  }

  return rows.sort((a, b) => a.publicPath.localeCompare(b.publicPath));
}

function findConstructorGroups(sourceFile: ts.SourceFile): Map<string, string> {
  const classToGroup = new Map<string, string>();

  function visit(node: ts.Node): void {
    if (!ts.isBinaryExpression(node)) {
      ts.forEachChild(node, visit);
      return;
    }

    if (
      node.operatorToken.kind !== ts.SyntaxKind.EqualsToken ||
      !ts.isPropertyAccessExpression(node.left) ||
      node.left.expression.kind !== ts.SyntaxKind.ThisKeyword ||
      !ts.isNewExpression(node.right)
    ) {
      ts.forEachChild(node, visit);
      return;
    }

    const group = node.left.name.text;
    const className = node.right.expression.getText(sourceFile);
    classToGroup.set(className, group);
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return classToGroup;
}

function findSoapMethod(
  method: ts.MethodDeclaration,
  sourceFile: ts.SourceFile,
): string | undefined {
  let soapMethod: string | undefined;

  function visit(node: ts.Node): void {
    if (soapMethod) return;

    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const expression = node.expression;
      if (
        expression.name.text === 'call' &&
        expression.expression.getText(sourceFile).endsWith('.ctx')
      ) {
        const [firstArg] = node.arguments;
        if (firstArg && ts.isStringLiteral(firstArg)) {
          soapMethod = firstArg.text;
          return;
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(method);
  return soapMethod;
}

function findResultUnwrapper(
  method: ts.MethodDeclaration,
): { resultKey: string; responseKind: EndpointResponseKind } | undefined {
  let result: { resultKey: string; responseKind: EndpointResponseKind } | undefined;

  function visit(node: ts.Node): void {
    if (result) return;

    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const unwrapMethod = node.expression.name.text;
      if (!unwrapMethod.startsWith('unwrap')) {
        ts.forEachChild(node, visit);
        return;
      }

      const resultKeyArg = node.arguments[1];
      if (!resultKeyArg || !ts.isStringLiteral(resultKeyArg)) {
        ts.forEachChild(node, visit);
        return;
      }

      result = {
        resultKey: resultKeyArg.text,
        responseKind: unwrapMethodToResponseKind(unwrapMethod),
      };
      return;
    }

    ts.forEachChild(node, visit);
  }

  visit(method);
  return result;
}

function unwrapMethodToResponseKind(unwrapMethod: string): EndpointResponseKind {
  if (unwrapMethod === 'unwrapFlag') return 'flag';
  if (unwrapMethod === 'unwrapString') return 'string';
  if (unwrapMethod === 'unwrapDate') return 'date';
  if (unwrapMethod === 'unwrapArray') return 'array';
  if (unwrapMethod === 'unwrapPaged') return 'paged';
  return 'object';
}

function sharedSystemRows(service: string, sourceFile: string): EndpointMatrixRow[] {
  return [
    {
      service,
      group: 'system',
      sdkMethod: 'getDate',
      publicPath: `${service}.system.getDate`,
      sourceFile,
      soapMethod: 'GetSystemDate',
      resultKey: 'GetSystemDateResult',
      responseKind: 'date',
      safety: 'readonly',
      sampleArgs: [],
    },
    {
      service,
      group: 'system',
      sdkMethod: 'generateDocumentUrl',
      publicPath: `${service}.system.generateDocumentUrl`,
      sourceFile,
      soapMethod: 'GenerateDocumentUrl',
      resultKey: 'GenerateDocumentUrlResult',
      responseKind: 'string',
      safety: 'requires-existing-id',
      sampleArgs: ['Invoice', 'SDKTEST-DOCUMENT-ID', 'Pdf'],
    },
    {
      service,
      group: 'system',
      sdkMethod: 'describe',
      publicPath: `${service}.system.describe`,
      sourceFile,
      responseKind: 'describe',
      safety: 'service-discovery',
      sampleArgs: [],
    },
  ];
}

function classifyEndpoint(signature: string): EndpointSafety {
  const value = signature.toLowerCase();

  if (value.includes('describe')) return 'service-discovery';
  if (value.includes('setxslt') || value.includes('company') || value.includes('accountant')) {
    return 'admin-template';
  }
  if (
    value.includes('send') ||
    value.includes('cancel') ||
    value.includes('delete') ||
    value.includes('upload') ||
    value.includes('import') ||
    value.includes('transfer') ||
    value.includes('queue') ||
    value.includes('store') ||
    value.includes('syncronize') ||
    value.includes('synchronize') ||
    value.includes('create')
  ) {
    return 'unsafe-production';
  }
  if (
    value.includes('save') ||
    value.includes('change') ||
    value.includes('move') ||
    value.includes('clone') ||
    value.includes('mark') ||
    value.includes('retry') ||
    value.includes('recover') ||
    value.includes('validate') ||
    value.includes('fromearchive') ||
    value.includes('transform')
  ) {
    return 'mutating';
  }
  if (
    value.includes('.list.') ||
    value.includes('.filter.') ||
    value.includes('testconnection') ||
    value.includes('whoami') ||
    value.includes('userinfo') ||
    value.includes('creditinfo') ||
    value.includes('summaryreport') ||
    value.includes('getsystemdate') ||
    value.includes('aliases') ||
    value.includes('isuser') ||
    value.includes('user')
  ) {
    return 'readonly';
  }
  if (
    value.includes('status') ||
    value.includes('pdf') ||
    value.includes('html') ||
    value.includes('view') ||
    value.includes('data') ||
    value.includes('source') ||
    value.includes('envelope') ||
    value.includes('get(') ||
    value.includes('.get') ||
    value.includes('url')
  ) {
    return 'requires-existing-id';
  }

  return 'readonly';
}

function sampleArg(parameter: ts.ParameterDeclaration, sourceFile: ts.SourceFile): unknown {
  const name = parameter.name.getText(sourceFile);
  const typeText = parameter.type?.getText(sourceFile) ?? '';
  const lower = name.toLowerCase();

  if (typeText.endsWith('[]') || lower.endsWith('ids') || lower.endsWith('ettns')) {
    return [{ $attributes: { TestId: 'SDKTEST-ITEM' } }];
  }
  if (typeText === 'boolean' || lower.startsWith('is') || lower.startsWith('has')) return true;
  if (typeText === 'number' || lower.includes('pageindex')) return 0;
  if (lower.includes('pagesize')) return 1;
  if (lower.includes('date')) return '2026-05-25';
  if (lower.includes('period')) return '2026-05';
  if (lower.includes('format')) return 'yyyy-MM-dd';
  if (lower.includes('filetype')) return 'Pdf';
  if (lower === 'type' || lower.includes('documenttype')) return 'Invoice';
  if (lower.includes('hash')) return 'SDKTEST-HASH';
  if (lower.includes('filedata') || lower.includes('signeddata') || lower === 'data') {
    return 'U0RLVEVTVA==';
  }
  if (typeText.includes('SoapRequestParams')) return { $attributes: { TestId: 'SDKTEST' } };
  if (!typeText || typeText.includes('string')) return `SDKTEST-${name}`;

  return { $attributes: { TestId: `SDKTEST-${name}` } };
}

function buildSuccessFixture(row: EndpointMatrixRow): UnknownRecord {
  if (!row.resultKey) return {};

  const attributes = { IsSucceded: 'true' };

  if (row.responseKind === 'flag') {
    return { [row.resultKey]: { $attributes: { ...attributes, Value: 'true' } } };
  }
  if (row.responseKind === 'string') {
    return { [row.resultKey]: { $attributes: { ...attributes, Value: 'SDKTEST-VALUE' } } };
  }
  if (row.responseKind === 'date') {
    return { [row.resultKey]: { $attributes: { ...attributes, Value: '2026-05-25T12:00:00Z' } } };
  }
  if (row.responseKind === 'array') {
    return {
      [row.resultKey]: {
        $attributes: attributes,
        Value: { Item: { $attributes: { Id: 'SDKTEST-ID', Status: 'Success' } } },
      },
    };
  }
  if (row.responseKind === 'paged') {
    return {
      [row.resultKey]: {
        $attributes: attributes,
        Value: {
          $attributes: { PageIndex: '0', PageSize: '1', TotalCount: '1', TotalPages: '1' },
          Items: { Item: { $attributes: { Id: 'SDKTEST-ID', Status: 'Success' } } },
        },
      },
    };
  }

  return {
    [row.resultKey]: {
      $attributes: attributes,
      Value: { $attributes: { Id: 'SDKTEST-ID', Status: 'Success' } },
    },
  };
}

function resolvePublicMethod(
  client: Uyumsoft,
  publicPath: string,
): (...args: unknown[]) => Promise<unknown> {
  const parts = publicPath.split('.');
  let current: unknown = client;
  let owner: unknown = client;

  for (const part of parts) {
    owner = current;
    current = getProperty(current, part);
  }

  if (typeof current !== 'function') {
    throw new Error(`Endpoint "${publicPath}" is not callable`);
  }

  return current.bind(owner) as (...args: unknown[]) => Promise<unknown>;
}

function getProperty(target: unknown, key: string): unknown {
  if (typeof target !== 'object' || target === null || !(key in target)) {
    throw new Error(`Missing property "${key}"`);
  }

  return (target as Record<string, unknown>)[key];
}
