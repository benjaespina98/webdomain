import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

const LANDING_SEEN_KEY = 'dividimos_landing_seen';
const SESSION_KEY = 'dividimos_app_state';

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** La landing se muestra una sola vez; después de verla, "/" entra directo a la app. */
export function markLandingSeen(): void {
  try {
    localStorage.setItem(LANDING_SEEN_KEY, '1');
  } catch {
    // Sin localStorage (modo privado, etc.): simplemente se volverá a mostrar.
  }
}

/**
 * Manda a /app a quien ya vio la landing o ya tiene (o tuvo) una sesión guardada, para no
 * hacerle pasar por la presentación cada vez que abre la app. Quien llega por primera vez
 * —y los buscadores, que no tienen localStorage— sigue viendo la landing en "/".
 * La landing sigue accesible en /about.
 */
export const landingGuard: CanActivateFn = () => {
  const alreadyKnown = readStorage(LANDING_SEEN_KEY) === '1' || readStorage(SESSION_KEY) !== null;
  return alreadyKnown ? inject(Router).createUrlTree(['/app']) : true;
};
