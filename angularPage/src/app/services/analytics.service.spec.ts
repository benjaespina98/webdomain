import { scrubEvent, stripUrlDetails } from './analytics.service';
import type { CaptureResult } from 'posthog-js';

describe('analytics: recorte de URLs', () => {
  const event = (properties: Record<string, unknown>, $set?: Record<string, unknown>): CaptureResult =>
    ({ uuid: '1', event: 'app_opened', properties, $set } as unknown as CaptureResult);

  it('quita el fragmento con los datos del enlace compartido', () => {
    expect(stripUrlDetails('https://dividimos.vercel.app/share#data=N4Ig&v=4')).toBe('https://dividimos.vercel.app/share');
  });

  it('quita también el query string (enlaces viejos con ?data=)', () => {
    expect(stripUrlDetails('https://dividimos.vercel.app/share?data=abc&v=3')).toBe('https://dividimos.vercel.app/share');
  });

  it('recorta $current_url, $referrer y las variantes iniciales; no toca otras propiedades', () => {
    const scrubbed = scrubEvent(event({
      $current_url: 'https://dividimos.vercel.app/share#data=SECRETO',
      $initial_current_url: 'https://dividimos.vercel.app/share#data=SECRETO',
      $session_entry_url: 'https://dividimos.vercel.app/share?data=SECRETO',
      $referrer: 'https://l.wl.co/l?u=https%3A%2F%2Fdividimos.vercel.app%2Fshare%23data%3DSECRETO',
      $pathname: '/share',
      $browser: 'Chrome'
    }))!;

    expect(JSON.stringify(scrubbed)).not.toContain('SECRETO');
    expect(scrubbed.properties['$current_url']).toBe('https://dividimos.vercel.app/share');
    expect(scrubbed.properties['$referrer']).toBe('https://l.wl.co/l');
    expect(scrubbed.properties['$pathname']).toBe('/share');
    expect(scrubbed.properties['$browser']).toBe('Chrome');
  });

  it('también limpia las propiedades de persona ($set)', () => {
    const scrubbed = scrubEvent(event({}, { $initial_referrer: 'https://x.com/a?b=SECRETO' }))!;

    expect(JSON.stringify(scrubbed)).not.toContain('SECRETO');
  });

  it('deja pasar un evento nulo', () => {
    expect(scrubEvent(null)).toBeNull();
  });
});
