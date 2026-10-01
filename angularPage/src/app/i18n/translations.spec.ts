import { TRANSLATIONS } from './translations';

describe('TRANSLATIONS', () => {
  it('tiene exactamente las mismas claves en español e inglés', () => {
    expect(Object.keys(TRANSLATIONS.en).sort()).toEqual(Object.keys(TRANSLATIONS.es).sort());
  });

  it('no deja ningún texto vacío', () => {
    for (const lang of ['es', 'en'] as const) {
      Object.entries(TRANSLATIONS[lang]).forEach(([key, value]) => {
        expect(String(value).trim().length).withContext(`${lang}.${key}`).toBeGreaterThan(0);
      });
    }
  });
});
