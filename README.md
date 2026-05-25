# @erennyuksell/uyumsoft-edonusum-unofficial-sdk

Unofficial TypeScript SDK for Uyumsoft e-Dönüşüm SOAP services.

This is an independent, unofficial open-source package. It is not affiliated with, endorsed by, or maintained by Uyumsoft. Always verify production behavior against the current Uyumsoft contract and your account permissions.

```typescript
import { Uyumsoft } from '@erennyuksell/uyumsoft-edonusum-unofficial-sdk';

const client = new Uyumsoft({
  username: 'WS_USER',
  password: 'WS_PASS',
});

// Gelen faturaları listele
const invoices = await client.efatura.inbox.list({ PageSize: 10 });

// Giden irsaliye durumunu sorgula
const status = await client.eirsaliye.outbox.getStatus(['ettn-uuid']);

// e-Defter yevmiye listesi
const ledgers = await client.edefter.ledgers.list({ Year: 2025, Month: 1 });
```

## Özellikler

- 🔌 **10 servis, tek client** — e-Fatura, e-İrsaliye, e-SMM, e-MM, e-Defter, e-Bilet, e-Adisyon, e-Döviz, e-Banka Makbuzu, e-Gider Pusulası
- 🔄 **Lazy SOAP init** — her servis ilk çağrıda bağlanır, kullanılmayan servis bağlantı açmaz
- 🛡️ **Retry + Exponential Backoff** — ağ hatalarında otomatik yeniden deneme
- 📦 **Dar dependency yüzeyi** — SOAP için `soap`, UBL-TR envelope için `@erennyuksell/ubl-tr`
- 🧩 **Tam TypeScript** — tüm request/response tipleri dahil
- 📖 **Domain-grouped API** — `inbox`, `outbox`, `send`, `manage`, `users`, `system`

## Kurulum

```bash
npm install @erennyuksell/uyumsoft-edonusum-unofficial-sdk
```

## Yapılandırma

```typescript
const client = new Uyumsoft({
  // Zorunlu
  username: 'WS_USER',
  password: 'WS_PASS',

  // Opsiyonel
  environment: 'production', // 'test' | 'production' (varsayılan: 'test')
  timeout: 30_000, // ms (varsayılan: 30000)

  // Retry politikası
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
    backoffMultiplier: 2,
    retryOnTimeout: true,
    retryOnConnectionError: true,
  },

  // Logger (pino, winston, console — hepsi uyumlu)
  logger: console,
});
```

### Test Ortamı

Uyumsoft test ortamı herkese açıktır:

```typescript
const testClient = new Uyumsoft({
  username: 'Uyumsoft',
  password: 'Uyumsoft',
  environment: 'test',
});
```

> Test portali: http://edonusum-test.uyum.com.tr (Uyumsoft / Uyumsoft)

## Servisler

### 📄 e-Fatura & e-Arşiv — `client.efatura`

Uyumsoft Integration servisi. Gelen/giden fatura yönetimi, e-Arşiv, ihracat faturası.

```typescript
// ─── Gelen Faturalar ─────────────────────────
const inbox = await client.efatura.inbox.list({
  ExecutionStartDate: '2025-01-01T00:00:00',
  ExecutionEndDate: '2025-12-31T23:59:59',
  PageSize: 50,
});
const invoice = await client.efatura.inbox.get('uuid');
const pdf = await client.efatura.inbox.getPdf('uuid');
const xml = await client.efatura.inbox.getData('uuid');

// ─── Giden Faturalar ─────────────────────────
const outbox = await client.efatura.outbox.list({
  ExecutionStartDate: '2025-01-01T00:00:00',
  PageSize: 50,
  Scenario: 'eArchive', // sadece e-Arşiv faturaları
});
const status = await client.efatura.outbox.getStatus(['uuid1', 'uuid2']);
const statusWithLogs = await client.efatura.outbox.getStatusWithLogs(['uuid']);

// ─── Fatura Gönderme ─────────────────────────
const result = await client.efatura.send.invoice([invoiceData]);
const draft = await client.efatura.send.saveAsDraft([invoiceData]);
await client.efatura.send.sendDraft(['draftId']);
await client.efatura.send.cancelDraft(['draftId']);

// ─── Fatura Yönetimi ─────────────────────────
await client.efatura.manage.validate(invoiceXml);
await client.efatura.manage.cancelEArchive('docId', '2025-01-15');
await client.efatura.manage.retrySend(['uuid']);
await client.efatura.manage.clone(['uuid']);
await client.efatura.manage.changeArchiveStatus(['uuid'], true, true);

// ─── Kullanıcı Sorguları ─────────────────────
const isUser = await client.efatura.users.isEInvoiceUser('1234567890');
const aliases = await client.efatura.users.getAliases('1234567890');
const address = await client.efatura.users.getAddressFromVkn('1234567890');

// ─── Sistem ──────────────────────────────────
const ok = await client.efatura.system.testConnection();
const me = await client.efatura.system.whoAmI();
const date = await client.efatura.system.getDate();
```

<details>
<summary>Tüm e-Fatura method'ları (55)</summary>

| Grup       | Method                                          | Açıklama                 |
| ---------- | ----------------------------------------------- | ------------------------ |
| **system** | `testConnection()`                              | Bağlantı testi           |
|            | `whoAmI()`                                      | Hesap bilgileri          |
|            | `getDate()`                                     | Sunucu tarihi            |
|            | `getDateFormatted(fmt)`                         | Formatlı tarih           |
|            | `getSummaryReport(start, end)`                  | Özet rapor               |
|            | `getCreditInfo()`                               | Kredi/abonelik           |
|            | `getUserInfo()`                                 | Kullanıcı doğrulama      |
| **inbox**  | `list(query)`                                   | Gelen fatura listesi     |
|            | `getInvoices(query)`                            | Gelen faturalar (UBL-TR) |
|            | `get(id)`                                       | Tekil fatura             |
|            | `getData(id)`                                   | XML verisi (base64)      |
|            | `getBulkData(query)`                            | Toplu XML verisi         |
|            | `getPdf(id)`                                    | PDF (base64)             |
|            | `getView(id)`                                   | HTML görüntü             |
|            | `getStatus(ids)`                                | Durum sorgula            |
|            | `getStatusWithLogs(ids)`                        | Detaylı durum            |
|            | `markAsTaken(ids)`                              | Yeni işareti kaldır      |
|            | `sendResponse(responses)`                       | Kabul/Red yanıtı         |
|            | `queryResponseStatus(ids)`                      | Yanıt durumu             |
| **outbox** | `list(query)`                                   | Giden fatura listesi     |
|            | `getInvoices(query)`                            | Giden faturalar (UBL-TR) |
|            | `get(id)`                                       | Tekil fatura             |
|            | `getData(id)`                                   | XML verisi               |
|            | `getBulkData(query)`                            | Toplu XML                |
|            | `getPdf(id)`                                    | PDF                      |
|            | `getView(id)`                                   | HTML görüntü             |
|            | `getResponseView(id)`                           | Yanıt görüntüsü          |
|            | `getStatus(ids)`                                | Durum sorgula            |
|            | `getStatusWithLogs(ids)`                        | Detaylı durum            |
|            | `queryGtbResponses(ids)`                        | Gümrük yanıtları         |
| **send**   | `invoice(data)`                                 | Fatura gönder            |
|            | `saveAsDraft(data)`                             | Taslak kaydet            |
|            | `compressedSend(data, hash)`                    | Sıkıştırılmış gönderim   |
|            | `compressedSaveAsDraft(data, hash)`             | Sıkıştırılmış taslak     |
|            | `sendDraft(ids)`                                | Taslak gönder            |
|            | `cancelDraft(ids)`                              | Taslak iptal             |
| **manage** | `validate(invoice)`                             | UBL-TR doğrulama         |
|            | `cancelEArchive(id, date)`                      | e-Arşiv iptal            |
|            | `recoverEArchiveCancel(id)`                     | İptal geri al            |
|            | `changeArchiveStatus(ids, isInbox, isArchived)` | Arşiv durumu             |
|            | `moveToDraft(ids)`                              | Taslağa çevir            |
|            | `clone(ids)`                                    | Fatura kopyala           |
|            | `retrySend(ids)`                                | Yeniden gönder           |
|            | `importInvoice(fileName, data)`                 | Fatura import            |
|            | `getEnvelope(id, isInbox)`                      | Zarf verisi              |
|            | `transferToBranch(ids, alias)`                  | Şubeye transfer          |
|            | `queueNotification(docId, mail, sms)`           | Bildirim gönder          |
|            | `createFromDespatches(ids, status)`             | İrsaliyeden fatura       |
|            | `setXsltView(type, content)`                    | XSLT yükle               |
|            | `getXsltView(type)`                             | XSLT indir               |
| **users**  | `isEInvoiceUser(vkn)`                           | e-Fatura mükellef mi?    |
|            | `getEInvoiceUsers(page, size)`                  | Mükellef listesi         |
|            | `filter(text, page, size)`                      | Mükellef ara             |
|            | `getAliases(vkn)`                               | Posta kutuları           |
|            | `getAddressFromVkn(vkn)`                        | Adres sorgula            |
|            | `getCompressedList(type)`                       | Sıkıştırılmış liste      |

</details>

---

### 🚚 e-İrsaliye — `client.eirsaliye`

DespatchIntegration servisi. Gelen/giden sevk irsaliyesi.

```typescript
const inbox = await client.eirsaliye.inbox.list({
  ExecutionStartDate: '2025-01-01T00:00:00',
  PageSize: 50,
});
const outbox = await client.eirsaliye.outbox.list({ PageSize: 10 });
const isUser = await client.eirsaliye.users.isEDespatchUser('1234567890');
await client.eirsaliye.send.despatch([despatchData]);
```

---

### 📋 e-SMM — `client.esmm`

VoucherIntegration servisi. Serbest meslek makbuzu.

```typescript
const list = await client.esmm.outbox.list({
  StartDate: '2025-01-01T00:00:00',
  EndDate: '2025-12-31T23:59:59',
  PageSize: 50,
});
const pdf = await client.esmm.outbox.getPdf('uuid');
await client.esmm.send.send([voucherData]);
```

---

### 🌾 e-MM — `client.emm`

ProducerReceiptIntegration servisi. Müstahsil makbuzu.

```typescript
const list = await client.emm.outbox.list({
  StartDate: '2025-01-01T00:00:00',
  EndDate: '2025-12-31T23:59:59',
  PageSize: 50,
});
```

---

### 📒 e-Defter — `client.edefter`

LedgerIntegration servisi. Yevmiye defteri + kebir defteri. **40 method.**

```typescript
// Kaynak yönetimi
const sources = await client.edefter.sources.list({ Year: 2025, Month: 1 });
await client.edefter.sources.import(sourceData);
await client.edefter.sources.approve(sourceId);
await client.edefter.sources.delete(sourceId);

// Defter işlemleri
const ledgers = await client.edefter.ledgers.list({ Year: 2025, Month: 1 });
await client.edefter.ledgers.create({ Year: 2025, Month: 1 });
await client.edefter.ledgers.sign(ledgerId);
await client.edefter.ledgers.upload(ledgerId);

// Raporlar
const report = await client.edefter.reports.getStatus(ledgerId);

// Şirket bilgileri
const company = await client.edefter.company.getInfo();
```

---

### 🎫 e-Bilet — `client.ebilet`

TicketIntegration servisi. Ulaşım biletleri.

```typescript
const status = await client.ebilet.tickets.getStatus(['ettn1']);
await client.ebilet.tickets.send(ticketData);
```

---

### 🍽️ e-Adisyon — `client.eadisyon`

GuestCheckIntegration servisi. Otel/restoran adisyonu.

```typescript
const list = await client.eadisyon.outbox.list({ PageSize: 10 });
const status = await client.eadisyon.outbox.getStatus(['ettn1']);
await client.eadisyon.send.send(guestCheckData);
```

---

### 💱 e-Döviz — `client.edoviz`

ForeignExchangeIntegration servisi. Döviz alım/satım belgesi.

```typescript
const list = await client.edoviz.outbox.list({ PageSize: 10 });
await client.edoviz.send.send(exchangeData);
```

---

### 🏦 e-Banka Makbuzu — `client.ebankamakbuzu`

BankReceiptIntegration servisi. Banka tahsilat makbuzu.

```typescript
const list = await client.ebankamakbuzu.outbox.list({ PageSize: 10 });
await client.ebankamakbuzu.send.send(receiptData);
```

---

### 📝 e-Gider Pusulası — `client.egiderpusulasi`

ExpenseReceiptIntegration servisi. Gider pusulası.

```typescript
const list = await client.egiderpusulasi.outbox.list({ PageSize: 10 });
await client.egiderpusulasi.send.send(expenseData);
const fromArchive = await client.egiderpusulasi.outbox.fromEArchiveInvoices(['inv1']);
```

---

## Durum Kodları

Fatura/belge durum sorgulamalarında dönen status kodları:

| Kod  | Enum                    | Açıklama            |
| ---- | ----------------------- | ------------------- |
| 1000 | `Approved`              | Onaylandı           |
| 1100 | `WaitingForApprovement` | Onay Bekliyor       |
| 1200 | `Declined`              | Reddedildi          |
| 1300 | `Return`                | İade Edildi         |
| 1400 | `eArchiveCanceled`      | e-Arşiv İptal       |
| 2000 | `Error`                 | GİB iletişim hatası |

## Fatura Seri Numarası Formatı

```
[3 harf seri][4 yıl][9 sıra no] = 16 hane
SHI       2025    000000029    → SHI2025000000029
```

- İlk 3 karakter: büyük harf/rakam (Türkçe karakter yok)
- Yıl: fatura tarihinin yılı
- Sıra: 000000001'den başlar, seri içinde sıralı ilerler

Boş ID gönderilirse Uyumsoft otomatik atar. 3 haneli prefix gönderilirse o seriden sıradaki numara atanır.

## Hata Yönetimi

```typescript
import {
  UyumsoftError,
  UyumsoftAuthError,
  UyumsoftConnectionError,
  UyumsoftTimeoutError,
} from '@erennyuksell/uyumsoft-edonusum-unofficial-sdk';

try {
  await client.efatura.inbox.list();
} catch (err) {
  if (err instanceof UyumsoftAuthError) {
    // Kullanıcı adı/şifre hatalı veya IP whitelist
  } else if (err instanceof UyumsoftTimeoutError) {
    // İstek zaman aşımı
  } else if (err instanceof UyumsoftConnectionError) {
    // Ağ bağlantı hatası (ECONNRESET, ENOTFOUND)
  } else if (err instanceof UyumsoftError) {
    // Genel SDK hatası
    console.error(err.code, err.message);
  }
}
```

## Mimari

```
uyumsoft/
├── core/
│   ├── base-client.ts   ← Lazy SOAP init, retry, WS-Security
│   ├── helpers.ts       ← Shared unwrap/extract utilities
│   ├── errors.ts        ← Error hierarchy
│   └── types.ts         ← Config, PagedResult, Endpoints
├── services/
│   ├── e-fatura/        ← 55 methods (inbox/outbox/send/manage/users)
│   ├── e-irsaliye/      ← 46 methods
│   ├── e-smm/           ← 19 methods
│   ├── e-mm/            ← 15 methods
│   ├── e-defter/        ← 40 methods
│   ├── e-bilet/         ← 6 methods
│   ├── e-adisyon/       ← 12 methods
│   ├── e-doviz/         ← 13 methods
│   ├── e-banka-makbuzu/ ← 12 methods
│   └── e-gider-pusulasi/← 12 methods
├── uyumsoft.ts          ← Unified facade
└── index.ts             ← Public barrel export
```

### Tekil Servis Kullanımı

Sadece belirli bir servis lazımsa facade yerine doğrudan import:

```typescript
import { EFaturaClient } from '@erennyuksell/uyumsoft-edonusum-unofficial-sdk';

const efatura = new EFaturaClient({
  username: 'WS_USER',
  password: 'WS_PASS',
  environment: 'production',
});

const invoices = await efatura.inbox.list();
```

## Endpoint'ler

| Ortam          | Base URL                                 |
| -------------- | ---------------------------------------- |
| **Production** | `edonusumapi.uyum.com.tr/services/`      |
| **Test**       | `efatura-test.uyumsoft.com.tr/Services/` |

> Not: Production ortamı IP whitelist gerektirebilir. Uyumsoft destek ile iletişime geçin.

## Scope

This package includes typed SOAP clients, response helpers, retry/timeout handling, and a Uyumsoft invoice envelope builder. It does not include credentials, account provisioning, IP whitelist management, GIB portal automation, XML signing, persistence, HTTP controllers, or official/vendor PDF documentation.

## Disclaimer

This package is unofficial and independent. Uyumsoft service behavior can vary by environment, account permission, and enabled e-Dönüşüm modules. Test against your own Uyumsoft account before production use.

## Lisans

MIT

## Katkıda Bulunma

1. Fork & clone
2. `npm install`
3. `npm run typecheck && npm run lint && npm test && npm run build`
4. PR açın
