import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { BaseClient } from '../src/core/base-client';
import { UyumsoftConnectionError, UyumsoftTimeoutError } from '../src/core/errors';

// Real sockets and the real strong-soap: a mock cannot show that a request is actually dropped.

const wsdl = (port: number) => `<?xml version="1.0" encoding="utf-8"?>
<wsdl:definitions name="Probe" targetNamespace="urn:probe" xmlns:tns="urn:probe"
  xmlns:wsdl="http://schemas.xmlsoap.org/wsdl/" xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
  xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <wsdl:types><xs:schema targetNamespace="urn:probe" elementFormDefault="qualified">
    <xs:element name="Ping"><xs:complexType><xs:sequence/></xs:complexType></xs:element>
    <xs:element name="PingResponse"><xs:complexType><xs:sequence/></xs:complexType></xs:element>
  </xs:schema></wsdl:types>
  <wsdl:message name="In"><wsdl:part name="parameters" element="tns:Ping"/></wsdl:message>
  <wsdl:message name="Out"><wsdl:part name="parameters" element="tns:PingResponse"/></wsdl:message>
  <wsdl:portType name="Port"><wsdl:operation name="Ping">
    <wsdl:input message="tns:In"/><wsdl:output message="tns:Out"/>
  </wsdl:operation></wsdl:portType>
  <wsdl:binding name="Bind" type="tns:Port">
    <soap:binding transport="http://schemas.xmlsoap.org/soap/http"/>
    <wsdl:operation name="Ping"><soap:operation soapAction="urn:probe/Ping" style="document"/>
      <wsdl:input><soap:body use="literal"/></wsdl:input>
      <wsdl:output><soap:body use="literal"/></wsdl:output>
    </wsdl:operation>
  </wsdl:binding>
  <wsdl:service name="Service"><wsdl:port name="P" binding="tns:Bind">
    <soap:address location="http://127.0.0.1:${port}/service"/>
  </wsdl:port></wsdl:service>
</wsdl:definitions>`;

class ProbeClient extends BaseClient {
  constructor(url: string, timeout: number) {
    super(
      { username: 'u', password: 'p', environment: 'test', timeout, retry: { maxRetries: 0 } },
      { test: url, production: url },
    );
  }

  ping(): Promise<unknown> {
    return this.call('Ping');
  }
}

const servers: http.Server[] = [];

function listen(handler: http.RequestListener): Promise<number> {
  const server = http.createServer(handler);
  servers.push(server);
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve((server.address() as AddressInfo).port));
  });
}

afterEach(() => {
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    server.close();
  }
});

describe('time limit against a silent server', () => {
  it('stops the call and drops the connection', async () => {
    let dropped: () => void;
    const closed = new Promise<void>((resolve) => {
      dropped = resolve;
    });
    let port = 0;
    port = await listen((req, res) => {
      if (req.method === 'GET') {
        res.setHeader('content-type', 'text/xml');
        res.end(wsdl(port));
        return;
      }
      req.resume();
      res.on('close', () => dropped());
    });

    const started = Date.now();
    await expect(
      new ProbeClient(`http://127.0.0.1:${port}/wsdl-a?wsdl`, 150).ping(),
    ).rejects.toBeInstanceOf(UyumsoftTimeoutError);
    await closed;
    expect(Date.now() - started).toBeLessThan(2_000);
  });

  it('does not wait for a WSDL that never comes', async () => {
    const port = await listen(() => undefined);
    const started = Date.now();
    const error = await new ProbeClient(`http://127.0.0.1:${port}/wsdl-b?wsdl`, 150)
      .ping()
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(UyumsoftConnectionError);
    expect((error as UyumsoftConnectionError).neverSent).toBe(true);
    expect(Date.now() - started).toBeLessThan(2_000);
  });
});
