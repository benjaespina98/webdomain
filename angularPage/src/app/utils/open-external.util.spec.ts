import { openExternalLink, WindowLike } from './open-external.util';

describe('openExternalLink', () => {
  it('abre una pestaña nueva y le corta el opener', () => {
    const popup = { opener: 'app' as unknown };
    const assign = jasmine.createSpy('assign');
    const win: WindowLike = { open: () => popup, location: { assign } };

    expect(openExternalLink('https://wa.me/?text=hola', win)).toBe('new-tab');
    expect(popup.opener).toBeNull();
    expect(assign).not.toHaveBeenCalled();
  });

  it('si el navegador bloquea la ventana, abre el enlace en la misma pestaña', () => {
    const assign = jasmine.createSpy('assign');
    const win: WindowLike = { open: () => null, location: { assign } };

    expect(openExternalLink('https://wa.me/?text=hola', win)).toBe('same-tab');
    expect(assign).toHaveBeenCalledWith('https://wa.me/?text=hola');
  });
});
