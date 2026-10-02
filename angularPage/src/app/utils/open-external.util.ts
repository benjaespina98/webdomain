/** Lo mínimo de `window` que usamos; permite probar la función con un doble. */
export interface WindowLike {
  open(url: string, target: string): { opener: unknown } | null;
  location: { assign(url: string): void };
}

/**
 * Abre un enlace externo (por ejemplo WhatsApp) en una pestaña nueva. Si el navegador bloquea la
 * ventana, `window.open` devuelve `null` y no pasaba nada, sin ningún aviso: en ese caso se abre en
 * la misma pestaña. La sesión ya está guardada en el dispositivo, así que no se pierde nada.
 *
 * No se usa la opción `noopener` de `window.open` porque con ella siempre devuelve `null` y no se
 * podría saber si se abrió; en su lugar se corta `opener` a mano (mismo efecto de seguridad).
 */
export function openExternalLink(url: string, win: WindowLike = window as unknown as WindowLike): 'new-tab' | 'same-tab' {
  const popup = win.open(url, '_blank');

  if (popup) {
    popup.opener = null;
    return 'new-tab';
  }

  win.location.assign(url);
  return 'same-tab';
}
