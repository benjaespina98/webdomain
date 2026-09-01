import { TestBed } from '@angular/core/testing';
import { ShareService } from './share.service';

describe('ShareService', () => {
  let service: ShareService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShareService);
  });

  it('decodifica un enlace v4 (índices) generado por buildShareUrl', () => {
    const payload = {
      p: ['Ana', 'Beto'],
      e: [{ d: 'Cena', a: 1000, b: 0, r: [0, 1] }],
      c: 'U$S'
    };
    const url = service.buildShareUrl(payload);
    const params = new URL(url).searchParams;

    const decoded = service.parseShareLink(params.get('data')!, Number(params.get('v')));

    expect(decoded).toEqual(payload as any);
  });

  it('migra un enlace v3 (pagador/participantes por nombre) al formato actual', () => {
    const legacyPayload = {
      p: ['Ana', 'Beto'],
      e: [{ d: 'Cena', a: 1000, b: 'Beto', r: ['Ana', 'Beto'] }]
    };
    const data = service.encodeState(legacyPayload);

    const decoded = service.parseShareLink(data, 3);

    expect(decoded).toEqual({
      p: ['Ana', 'Beto'],
      e: [{ d: 'Cena', a: 1000, b: 1, r: [0, 1] }]
    });
  });

  it('rechaza un enlace v3 cuyo pagador no está en la lista de personas', () => {
    const legacyPayload = { p: ['Ana'], e: [{ d: 'Cena', a: 1000, b: 'Alguien más' }] };
    const data = service.encodeState(legacyPayload);

    expect(service.parseShareLink(data, 3)).toBeNull();
  });

  it('rechaza versiones más nuevas que la actual (enlace de una versión futura)', () => {
    const data = service.encodeState({ p: ['Ana'], e: [] });

    expect(service.parseShareLink(data, 99)).toBeNull();
  });

  it('rechaza versiones anteriores a la mínima soportada', () => {
    const data = service.encodeState({ p: ['Ana'], e: [] });

    expect(service.parseShareLink(data, 1)).toBeNull();
  });
});
