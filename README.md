# dividimos?

Aplicación web para dividir gastos en grupo de forma simple, rápida y clara.

## Descripción

dividimos? permite cargar participantes, registrar gastos compartidos y obtener automáticamente quién le debe pagar a quién para saldar cuentas.

Está desarrollada con Angular y pensada para uso real en situaciones cotidianas como salidas, viajes, compras grupales o convivencia.

## Funcionalidades

- Alta y baja de participantes.
- Carga de gastos con:
	- descripción,
	- monto,
	- persona que pagó,
	- participantes incluidos en ese gasto.
- Cálculo automático de:
	- gasto total,
	- promedio por persona,
	- transferencias sugeridas entre deudores y acreedores.
- Compartir resumen por WhatsApp con detalle de gastos y transferencias.
- Interfaz bilingüe (Español/Inglés) con persistencia del idioma en localStorage.
- Avisos de estado y opción de deshacer acciones críticas.
- Atajo de teclado para carga rápida de gasto: Ctrl/Cmd + Enter.
- Diseño responsive para desktop y mobile.
- Soporte PWA (instalable) con Service Worker y actualización automática de versión.

## Tecnologías

- Angular 16
- TypeScript
- SCSS
- Bootstrap 5
- RxJS
- Angular Service Worker (PWA)
- Vercel (deploy)

## Estructura del proyecto

```text
mipaginaweb/
├─ README.md
└─ angularPage/
	 ├─ src/
	 │  ├─ app/
	 │  │  ├─ app.component.*
	 │  │  └─ split/
	 │  │     ├─ split.component.ts
	 │  │     ├─ split.component.html
	 │  │     └─ split.component.scss
	 │  ├─ manifest.webmanifest
	 │  └─ styles.scss
	 ├─ angular.json
	 ├─ ngsw-config.json
	 ├─ package.json
	 └─ vercel.json
```

## Instalación y ejecución local

1. Clonar el repositorio.
2. Entrar al proyecto Angular:

```bash
cd angularPage
```

3. Instalar dependencias:

```bash
npm install
```

4. Ejecutar en modo desarrollo:

```bash
npm start
```

La app queda disponible en `http://localhost:4200/`.

## Scripts disponibles

- `npm start`: inicia servidor de desarrollo.
- `npm run build`: genera build de producción.
- `npm run watch`: build en modo watch.
- `npm test`: ejecuta tests unitarios.

## Deploy

El proyecto está preparado para deploy en Vercel, con headers de caché optimizados para PWA y actualización segura de assets críticos.

- Configuración: `angularPage/vercel.json`
- Build output: `angularPage/dist/angular-page`

## Mi rol

- Desarrollo frontend completo.
- Diseño de experiencia de usuario para carga rápida de gastos.
- Implementación de lógica de reparto y transferencias.
- Integración PWA, actualización automática y estrategia de deploy.

## Demo

- Web: agregar URL pública de Vercel aquí.

## Estado

Proyecto personal en evolución.