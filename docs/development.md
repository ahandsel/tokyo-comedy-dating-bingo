# Development

This page covers the toolchain, the scripts, the tests, formatting, and deployment.


## Toolchain

| Tool    | Version          | Where it is pinned                                                    |
| ------- | ---------------- | --------------------------------------------------------------------- |
| Node.js | 24 LTS (24.22.2) | `.node-version` (read by nodenv, fnm, asdf, and `actions/setup-node`) |
| pnpm    | 12 (12.16.1)     | `packageManager` in `package.json`                                    |

`engines` in `package.json` requires Node 24 or newer and pnpm 12 or newer.

pnpm manages its own version: when the installed pnpm sees a different `packageManager` value it downloads and runs the pinned release, so `pnpm install` works with any pnpm 10 or newer on the PATH.
With nodenv, run `nodenv install 24.22.2` once, then `npm install -g pnpm@12.16.1` for that Node version (or use Corepack).

pnpm is the only supported package manager.
Do not commit `package-lock.json` or `yarn.lock`.
`pnpm-workspace.yaml` sets `minimumReleaseAge` to three days so freshly published package versions are not installed immediately.


## Scripts

| Command           | What it does                                                    |
| ----------------- | --------------------------------------------------------------- |
| `pnpm dev`        | Start the Vite dev server at `/tokyo-comedy-dating-bingo/`.     |
| `pnpm build`      | Type-check with `vue-tsc -b`, then build into `dist/`.          |
| `pnpm preview`    | Serve the production build locally.                             |
| `pnpm test`       | Run the Vitest suite once.                                      |
| `pnpm test:watch` | Run Vitest in watch mode.                                       |
| `pnpm typecheck`  | `vue-tsc -b` without emitting.                                  |
| `pnpm lint`       | Format with Prettier, then fix Markdown with markdownlint-cli2. |
| `pnpm lint-code`  | Prettier only.                                                  |
| `pnpm lint-md`    | markdownlint-cli2 only.                                         |
| `pnpm check`      | Run `lint`, `test`, and `build`; use it before every commit.    |
| `pnpm index`      | List every script with `scripts/index.sh`.                      |

`vite.config.ts` reads `BASE_PATH` (default `/tokyo-comedy-dating-bingo/`) for the site base and configures Vitest with the jsdom environment and `src/tests/setup.ts`.


## Tests

The suite lives in `src/tests/` and runs in jsdom with Vue Test Utils.

| File             | Covers                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------- |
| `questions.test` | 24 questions, unique IDs, both translations, specific labels.                               |
| `i18n.test`      | Detection, preferences, catalogue parity, switching on every screen, persistence, credits.  |
| `swipe.test`     | Gestures, store rules, double-event guard, exit and return animations, flicks.              |
| `keyboard.test`  | Page-wide arrow keys and undo shortcuts, key repeat, modifiers, cleanup, grid navigation.   |
| `dialogs.test`   | The native dialog wrapper, start-over confirmation, corrupted-data notice.                  |
| `icons.test`     | Hidden icons, board marks by state, status and dialog icons, new-tab link icons.            |
| `board.test`     | Shuffle, board structure, independence, stability.                                          |
| `bingo.test`     | Winning-line evaluation.                                                                    |
| `storage.test`   | Validation, auto-save, reload, restart, corruption, missing storage, reveal flag.           |
| `export.test`    | Wrapping, drawing in both languages, icon marks matching Lucide, share fallback.            |

Helpers in `helpers.ts`:

* `mountApp(locale)` mounts the full app with a fresh i18n instance attached to `document.body`.
* `memoryStore(seed)` builds a store with an in-memory `Storage` and a seeded random source.
* `answerAll(store, pick)` plays a whole game.
* `firePointer(el, type, init)` dispatches pointer events, because jsdom lacks a `PointerEvent` constructor.

`setup.ts` clears LocalStorage and resets the store singleton before each test, and stubs `HTMLCanvasElement.prototype.getContext` to return `null` because jsdom has no 2D canvas.

There are no end-to-end browser tests.
Real-device checks of touch gestures and the PNG export are manual.


## Formatting

* `.prettierrc.json5` configures Prettier with the autocorrect, package.json, shell, SQL, TOML, and XML plugins.
* `src/` is excluded in `.prettierignore` because `prettier-plugin-autocorrect` owns the TypeScript and Vue parsers and would re-space Japanese UI copy.
* `.markdownlint-cli2.jsonc` enforces the Markdown rules, including straight quotes and hyphens instead of dashes.


## Continuous integration and deployment

`.github/workflows/deploy.yml` runs on every push to `main` and on manual dispatch:

1. Check out, set up pnpm from `packageManager`, and set up Node from `.node-version` with the pnpm cache.
2. `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm typecheck`.
3. `pnpm build` with `BASE_PATH=/<repository-name>/`.
4. Upload `dist/` and deploy with `actions/deploy-pages`.

The site is a single page without a router, so refreshing on GitHub Pages never produces a 404.
For a custom domain, set `BASE_PATH` to `/` and add `public/CNAME`.
