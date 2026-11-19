# Architecture

dividimos? is a static single page application. There is no backend and no database: the browser keeps the session, and a share link carries the data inside the URL.

## Routes

| Path | Component | Purpose |
| --- | --- | --- |
| `/` | `LandingComponent` | Landing page. A guard sends returning visitors straight to `/app`. |
| `/about` | `LandingComponent` | The landing page, always reachable. |
| `/app` | `SplitComponent` | The calculator: people, expenses, results, sharing. |
| `/share` | `ShareComponent` | Opens a shared link, imports it and redirects to `/app`. |

## Source layout (`angularPage/src/app`)

| Folder | Contents |
| --- | --- |
| `split/` | Main screen. The component renders the UI and calls the services and utilities below. |
| `landing/` | Landing page and the guard that decides when to show it. |
| `share/` | Import of shared links. |
| `services/` | State, persistence, share links, language, analytics, SEO, voice input. |
| `utils/` | Pure functions: settlement, share message, PNG summary, expense guessing. |
| `models/` | Types and the expense categories. |
| `i18n/` | Spanish and English strings and a test that keeps both in sync. |

## State and persistence

- `SplitStateService` holds the session in Angular signals. An effect saves every change through `PersistenceService` to `localStorage`.
- Saved sessions carry a `schemaVersion` (currently 2). Older versions are migrated on load instead of being discarded. A newer version than the app understands is ignored without deleting it.
- Optional aliases (bank alias or CBU) are stored only on the device. They are never part of a share link.

## Settlement algorithm (`utils/settlement.util.ts`)

- All arithmetic uses integer cents, so there is no floating point drift. When an amount does not divide evenly, the remaining cents are assigned one by one so balances always close exactly.
- An expense can be split equally among everyone, equally among some people, or by exact amounts per person. If exact amounts do not add up to the expense, it falls back to an equal split.
- Transfers: people with a non-zero balance are partitioned into the largest possible number of groups whose balances add up to zero (bitmask dynamic programming, used up to 16 people). Inside each group a greedy match settles the debts. A group of `k` people needs at most `k - 1` transfers, so this gives the minimum number of transfers. Above 16 people it falls back to a plain greedy match.

## Share links

- The link is `https://dividimos.vercel.app/share#data=<payload>&v=4`.
- The payload is a compact JSON (`p` people, `e` expenses with the payer as an index, `c` currency symbol) compressed with `lz-string` and URL safe.
- The data is in the fragment (`#`), which browsers never send to the server, so names and amounts do not appear in hosting logs.
- Versions 3 and 4 are accepted. A link that is invalid, corrupt or newer than the app is rejected and the local session is not touched.
- When someone opens a link while having a session of their own, that session is backed up under a separate key and the shared one is shown read only. A banner offers "Back to my session" and "Edit a copy".

## WhatsApp message and PNG summary

- `utils/share-message.util.ts` builds a short message: total, one line per transfer, the alias of whoever collects, and the link.
- `utils/summary-image.util.ts` draws a PNG summary on a `canvas`.

## Categories and emojis

`utils/expense-guess.util.ts` suggests a category and an emoji from the description. It matches whole words after removing accents and plurals, so "bar" does not match "barrio". If a category is picked by hand, it wins over the guess.

## Language

`LanguageService` is the single source for the language (Spanish or English): detection from the device, persistence in `localStorage` and number formatting. The default currency symbol follows the language and can be changed per session. The symbol is a label only, there is no conversion.

## Offline and updates

The app is a PWA (`@angular/service-worker`, `ngsw-config.json`). The service worker prefetches the app shell and assets. `AppComponent` checks for updates every minute and when the tab becomes visible, activates a new version and reloads, with a guard that allows at most one automatic reload every 30 seconds to avoid loops.

## Privacy and analytics

- Optional anonymous usage counting with PostHog. Only named events are sent (`app_opened`, `participant_added`, `expense_added`, `results_generated`, `share_clicked`, `summary_copied`, `session_cleared`, `voice_expense_dictated`, `summary_image_downloaded`, `coffee_clicked`).
- No expenses or names are sent, session recording and autocapture are off, and every URL property is cut to origin and path before sending (`before_send` in `analytics.service.ts`), so the content of a share link never leaves the browser.
- If `posthogApiKey` is empty, analytics is disabled and the app works the same.

## Other pieces

- `SeoService` updates title, description, canonical and `og:` tags when the route changes. Crawlers that do not run JavaScript read the static tags in `src/index.html`.
- `VoiceInputService` uses the browser Web Speech API to dictate an expense. The button only shows where the API exists.
