# Deployment, configuration and quality checks

## Hosting

The app is deployed on Vercel at https://dividimos.vercel.app. It is a static site: there is no server code.

- Build command: `npm run build` (the `vercel-build` script calls it). It runs `ng build` and then `node scripts/generate-share-page.mjs`. Output: `angularPage/dist/angular-page`.
- `angularPage/vercel.json` defines:
  - A rewrite of `/share` to `share.html`.
  - A rewrite of every other path without a file extension and outside `/assets/` to `index.html` (single page app fallback). Real files, such as `og-image.png`, are served as they are.
  - Security headers: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy` (only the microphone is allowed, for voice input) and a Content Security Policy that only allows the app's own origin plus PostHog.
  - Cache rules: `index.html`, the manifest and the service worker files are never cached, and hashed `.js` and `.css` files are cached for a year.

## The share page

WhatsApp builds the link card from static HTML, it does not run JavaScript. `scripts/generate-share-page.mjs` copies `index.html` to `share.html` after the build and replaces the Open Graph and Twitter tags with a small card (the app icon) and `noindex`. The app that loads is the same.

## Social preview image

- The tags for the main site (`og:*`, `twitter:*`, canonical) are written statically in `angularPage/src/index.html`.
- The image is `angularPage/src/og-image.png` (1200 by 630), served at `https://dividimos.vercel.app/og-image.png`. To regenerate it: `npm run og:image` (needs Chrome, uses `playwright-core` as a dev dependency).
- `npm run check:seo` checks title, description, canonical, the Open Graph and Twitter tags, the image in the build and its size, JSON-LD, the sitemap and `robots.txt`.

## Configuration

There is no `.env` file. Settings live in `angularPage/src/environments/environment.ts` (development) and `environment.prod.ts` (production build).

| Key | Purpose | Development | Production |
| --- | --- | --- | --- |
| `posthogApiKey` | PostHog project key for anonymous usage counting. Empty disables analytics. | empty | public project key |
| `posthogHost` | PostHog ingestion host | `https://us.i.posthog.com` | same |
| `coffeeUrl` | Support link shown once there is data (not in the read only shared view). Empty hides it. | set | set |

The PostHog key is a public project key: it only allows sending events and is meant to be shipped in client code. There are no secrets in the repository.

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request and on every push to `main`, in `angularPage` with Node 22:

1. `npm ci`
2. `npm run lint`
3. Unit tests in headless Chrome.
4. `npm run build`
5. A check that `index.html` has no inline handlers (the CSP does not allow them).
6. A check that `share.html` uses the small preview card.
7. `npm run check:seo`

`.github/dependabot.yml` opens weekly update pull requests for npm packages (Angular and testing packages are grouped) and for GitHub Actions.

## Running the checks locally

```bash
cd angularPage
npm run lint
npx ng test --watch=false --browsers=ChromeHeadlessCI
npm run build
npm run check:seo
```
