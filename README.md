# dividimos?

> Dividí gastos grupales en segundos. Sin registro, sin servidores, 100% en tu navegador.

[![Angular](https://img.shields.io/badge/Angular-17-DD0031?logo=angular\&logoColor=white)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript\&logoColor=white)](https://www.typescriptlang.org/)
[![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?logo=pwa\&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel\&logoColor=white)](https://dividimos.vercel.app/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

🔗 **Demo:** https://dividimos.vercel.app/

---

## ¿Qué es dividimos?

**dividimos?** resuelve un problema muy concreto: después de un asado, una cena, una salida o un viaje de fin de semana, alguien tiene que sentarse a hacer cuentas para saber quién le debe plata a quién.

La aplicación calcula automáticamente cuánto aportó cada persona, cuánto debería haber pagado y cuáles son las transferencias mínimas necesarias para saldar todas las deudas.

A diferencia de otras aplicaciones de gastos compartidos, **dividimos?** está pensada para resolver **gastos puntuales**, sin obligarte a crear una cuenta ni depender de un servidor.

### Características

* Sin registro.
* Sin backend.
* Todo funciona en el navegador.
* Los datos permanecen en tu dispositivo (localStorage).
* Compartir resultados mediante un único enlace.
* Compatible con WhatsApp y cualquier otra aplicación de mensajería.
* Español e Inglés.
* Instalable como PWA.

---

## Funcionalidades

* Alta y baja de participantes.
* Registro de gastos con:

  * descripción,
  * monto,
  * persona que pagó,
  * participantes incluidos.
* División de gastos entre todos o entre participantes específicos.
* Cálculo automático de:

  * gasto total,
  * promedio por persona,
  * balances individuales,
  * transferencias sugeridas.
* Compartir resumen mediante un enlace o WhatsApp.
* Persistencia local de la sesión.
* Restauración automática al abrir un enlace compartido.
* Diseño responsive.
* Funcionamiento offline como PWA.

---

## Tecnologías

* Angular 17
* TypeScript
* Bootstrap 5
* SCSS
* RxJS
* Angular Service Worker (PWA)
* lz-string
* PostHog (opcional)
* Vercel

---

## Capturas

> Pendiente de agregar imágenes reales.

| Landing                        | Aplicación                 |
| ------------------------------ | -------------------------- |
| `docs/screenshots/landing.png` | `docs/screenshots/app.png` |

---

## Ejecutar localmente

```bash
git clone https://github.com/benjaespina98/webdomain.git

cd webdomain/angularPage

npm install

npm start
```

Abrir:

```
http://localhost:4200
```

---

## Build de producción

```bash
npm run build
```

Los archivos generados quedan en:

```
angularPage/dist/angular-page
```

---

## Tests

```bash
npm test

npx tsc --noEmit
```

---

## Variables de entorno

PostHog es completamente opcional.

```ts
export const environment = {
  production: true,
  posthogApiKey: '',
  posthogHost: 'https://us.i.posthog.com'
};
```

Si la API Key queda vacía, la aplicación funciona normalmente.

---

## Estructura del proyecto

```text
webdomain/
├── README.md
├── LICENSE
└── angularPage/
    ├── src/
    │   ├── app/
    │   ├── assets/
    │   ├── environments/
    │   ├── manifest.webmanifest
    │   └── styles.scss
    ├── angular.json
    ├── ngsw-config.json
    ├── package.json
    └── vercel.json
```

---

## Roadmap

* [ ] Historial de divisiones.
* [ ] Exportar resultados a PDF.
* [ ] Exportar a Excel.
* [ ] Soporte multi-moneda.
* [ ] Más idiomas.
* [ ] Tema claro.
* [ ] Donaciones para sostener el proyecto.

---

## Créditos

Desarrollado por **Benjamín Espina**.

---

## Licencia

Distribuido bajo licencia **MIT**. Ver el archivo `LICENSE`.
