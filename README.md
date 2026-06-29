# dividimos?

> Dividí gastos grupales en segundos. Sin registro, sin servidores, 100% en tu navegador.

[![Angular](https://img.shields.io/badge/Angular-17-DD0031?logo=angular&logoColor=white)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)](https://dividimos.vercel.app/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

🔗 **Demo:** [dividimos.vercel.app](https://dividimos.vercel.app/)

---

## ¿Qué es dividimos?

**dividimos?** resuelve un problema muy concreto: después de un asado, una cena, una salida o un viaje de fin de semana, alguien tiene que sentarse a hacer cuentas para saber quién le debe plata a quién. dividimos? hace eso automáticamente, en segundos, sin pedirte que te registres ni que instales nada.

No es una herramienta de contabilidad permanente como otras apps de gastos compartidos: está pensada para resolver **gastos puntuales de un grupo** y compartir el resultado con un solo link.

- Sin cuentas ni backend: todo corre en el navegador.
- Tus datos quedan en tu dispositivo (localStorage), nunca en un servidor.
- Al terminar, compartís un único enlace por WhatsApp con el resumen completo.
- Bilingüe (Español / Inglés) e instalable como PWA.

## Capturas de pantalla

> _Pendiente: agregar capturas reales de la landing (`/`) y de la app (`/app`) antes de publicar el repo. Se recomienda incluir al menos una vista de escritorio y una mobile de cada una en `docs/screenshots/`._

| Landing | App |
|---|---|
| `docs/screenshots/landing.png` | `docs/screenshots/app.png` |

## Características principales

- **Flujo guiado en 3 pasos:** participantes → gastos → resultados, con indicador visual de progreso.
- **Carga de gastos flexible:** dividir entre todos los participantes o elegir manualmente quién participa de cada gasto.
- **Cálculo automático de transferencias:** algoritmo de liquidación de deudas que minimiza la cantidad de pagos necesarios.
- **Edición y eliminación** de participantes y gastos en cualquier momento, con confirmación y deshacer (undo).
- **Compartir por WhatsApp:** mensaje prearmado con el resumen y un link corto que reconstruye toda la sesión en el dispositivo de quien lo abre.
- **Copiar enlace:** para compartir por cualquier otro canal (Telegram, email, etc.).
- **Persistencia local:** cerrar la pestaña o recargar la página no pierde el progreso (localStorage versionado).
- **Bilingüe:** Español / Inglés, con detección automática del idioma del navegador.
- **PWA instalable:** funciona offline una vez cargada, con actualización automática de versión vía Service Worker.
- **Analítica de producto mínima y no invasiva** (PostHog) sobre eventos clave, sin datos sensibles.
- **SEO completo:** Open Graph, Twitter Cards, sitemap, robots.txt y meta tags por ruta.

## Tecnologías utilizadas

- [Angular 17](https://angular.io/) (standalone routing + módulos)
- [TypeScript](https://www.typescriptlang.org/)
- [Bootstrap 5](https://getbootstrap.com/) + SCSS a medida
- [RxJS](https://rxjs.dev/)
- [lz-string](https://github.com/pieroxy/lz-string) — compresión del estado compartido en la URL
- [posthog-js](https://posthog.com/) — analítica de producto opt-in
- Angular Service Worker (PWA)
- [Vercel](https://vercel.com/) — hosting y deploy

## Cómo ejecutarlo localmente

```bash
git clone https://github.com/benjaespina98/webdomain.git
cd webdomain/angularPage
npm install
npm start
```

La app queda disponible en `http://localhost:4200/`.

## Build de producción

```bash
cd angularPage
npm run build
```

El resultado queda en `angularPage/dist/angular-page/`, listo para servir como sitio estático (configurado para Vercel en `vercel.json`, con rewrites de SPA y headers de caché para los assets versionados).

### Tests

```bash
npm test          # unit tests (Karma + Jasmine)
npx tsc --noEmit  # chequeo de tipos sin emitir build
```

### Variables de entorno

La integración con PostHog es opcional. Para habilitarla en producción, completá la API key en `angularPage/src/environments/environment.prod.ts`:

```ts
export const environment = {
  production: true,
  posthogApiKey: 'TU_API_KEY',
  posthogHost: 'https://us.i.posthog.com'
};
```

Si se deja vacía, la app funciona igual: simplemente no se envían eventos.

## Estructura del proyecto

```text
webdomain/
├─ README.md
├─ LICENSE
└─ angularPage/
   ├─ src/
   │  ├─ app/
   │  │  ├─ app.component.*        # shell + router-outlet + SEO/analytics bootstrap
   │  │  ├─ app-routing.module.ts  # rutas: /, /app, /share, /split (redirect)
   │  │  ├─ landing/                # landing page de marketing
   │  │  ├─ split/                  # la aplicación en sí (participantes, gastos, resultados)
   │  │  ├─ share/                  # resuelve /share?data=... y restaura la sesión
   │  │  └─ services/
   │  │     ├─ persistence.service.ts  # localStorage versionado
   │  │     ├─ share.service.ts        # compresión/descompresión del link compartido
   │  │     ├─ analytics.service.ts    # wrapper de PostHog
   │  │     └─ seo.service.ts          # title/description/canonical por ruta
   │  ├─ assets/
   │  ├─ environments/
   │  ├─ manifest.webmanifest
   │  └─ styles.scss
   ├─ angular.json
   ├─ ngsw-config.json   # configuración del Service Worker (PWA)
   ├─ vercel.json        # rewrites SPA + headers de caché
   └─ package.json
```

## Roadmap

Ideas a futuro, sin compromiso de fecha:

- [ ] **dividimos? Pro**: historial de divisiones, exportar a PDF/Excel.
- [ ] Soporte multi-moneda.
- [ ] Más idiomas además de ES/EN.
- [ ] Donaciones / sponsor para sostener el hosting.
- [ ] Modo claro (light theme) opcional.

## Créditos

Desarrollado por [Benjamín Espina](https://github.com/benjaespina98).

## Licencia

Distribuido bajo licencia [MIT](LICENSE).
