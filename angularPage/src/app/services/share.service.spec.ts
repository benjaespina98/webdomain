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
    const fragment = service.parseFragment(new URL(url).hash);
    const decoded = service.parseShareLink(fragment!.data, fragment!.version);

    expect(decoded).toEqual(payload as any);
  });

  it('conserva la categoría al importar y ignora una desconocida', () => {
    const state = service.buildImportedState({
      p: ['Ana', 'Beto'],
      e: [
        { d: 'Asado', a: 100, b: 0, k: 'food' },
        { d: 'Otro', a: 50, b: 1, k: 'nope' as any }
      ]
    }, 'es');

    expect(state.expenseItems[0].category).toBe('food');
    expect(state.expenseItems[1].category).toBeUndefined();
  });

  it('pone los datos en el fragmento y no en el query string', () => {
    const url = new URL(service.buildShareUrl({ p: ['Ana'], e: [] }));

    expect(url.search).toBe('');
    expect(url.hash).toContain('data=');
  });

  it('parseFragment devuelve null sin datos y conserva los + de lz-string', () => {
    expect(service.parseFragment(null)).toBeNull();
    expect(service.parseFragment('v=4')).toBeNull();
    expect(service.parseFragment('#data=ab+c$d-e&v=4')).toEqual({ data: 'ab+c$d-e', version: 4 });
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

  it('ida y vuelta de un gasto con montos exactos', () => {
    const payload = { p: ['Ana', 'Beto', 'Caro'], e: [{ d: 'Cena', a: 100, b: 0, s: [30, 70, 0] }] };
    const fragment = service.parseFragment(new URL(service.buildShareUrl(payload)).hash)!;
    const decoded = service.parseShareLink(fragment.data, fragment.version)!;
    const state = service.buildImportedState(decoded, 'es');

    expect(state.expenseItems[0].shares).toEqual({ Ana: 30, Beto: 70 });
    expect(state.expenseItems[0].participants).toEqual(['Ana', 'Beto']);
  });

  it('rechaza montos exactos que no suman el total o con largo incorrecto', () => {
    const link = (s: number[]) => {
      const f = service.parseFragment(new URL(service.buildShareUrl({ p: ['Ana', 'Beto'], e: [{ d: 'X', a: 100, b: 0, s }] })).hash)!;
      return service.parseShareLink(f.data, f.version);
    };

    expect(link([30, 70])).not.toBeNull();
    expect(link([30, 60])).toBeNull();
    expect(link([100])).toBeNull();
    expect(link([-10, 110])).toBeNull();
  });
});
