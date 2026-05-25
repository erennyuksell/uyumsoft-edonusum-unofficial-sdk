// Uyumsoft SDK — Unified Facade
import type { UyumsoftConfig } from './core/types';
import { EFaturaClient } from './services/e-fatura/client';
import { EIrsaliyeClient } from './services/e-irsaliye/client';
import { ESmmClient } from './services/e-smm/client';
import { EMmClient } from './services/e-mm/client';
import { EDefterClient } from './services/e-defter/client';
import { EBiletClient } from './services/e-bilet/client';
import { EAdisyonClient } from './services/e-adisyon/client';
import { EDovizClient } from './services/e-doviz/client';
import { EBankaMakbuzuClient } from './services/e-banka-makbuzu/client';
import { EGiderPusalasiClient } from './services/e-gider-pusulasi/client';

/**
 * Uyumsoft e-Dönüşüm SDK — unified entry point for all 10 services.
 *
 * @example
 * ```typescript
 * const uyumsoft = new Uyumsoft({ username: 'WS_USER', password: 'WS_PASS' });
 *
 * // e-Fatura & e-Arşiv
 * const invoices = await uyumsoft.efatura.inbox.list();
 *
 * // e-Defter
 * const ledgers = await uyumsoft.edefter.ledgers.list();
 *
 * // e-Bilet
 * const tickets = await uyumsoft.ebilet.tickets.list();
 * ```
 */
export class Uyumsoft {
  readonly efatura: EFaturaClient;
  readonly eirsaliye: EIrsaliyeClient;
  readonly esmm: ESmmClient;
  readonly emm: EMmClient;
  readonly edefter: EDefterClient;
  readonly ebilet: EBiletClient;
  readonly eadisyon: EAdisyonClient;
  readonly edoviz: EDovizClient;
  readonly ebankamakbuzu: EBankaMakbuzuClient;
  readonly egiderpusulasi: EGiderPusalasiClient;

  constructor(config: UyumsoftConfig) {
    this.efatura = new EFaturaClient(config);
    this.eirsaliye = new EIrsaliyeClient(config);
    this.esmm = new ESmmClient(config);
    this.emm = new EMmClient(config);
    this.edefter = new EDefterClient(config);
    this.ebilet = new EBiletClient(config);
    this.eadisyon = new EAdisyonClient(config);
    this.edoviz = new EDovizClient(config);
    this.ebankamakbuzu = new EBankaMakbuzuClient(config);
    this.egiderpusulasi = new EGiderPusalasiClient(config);
  }
}
