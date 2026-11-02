# Real-browser smoke tests drive headless Chrome over CDP

* Type: Tooling
* Added: 2026-11-01
* Source: a 2026-11-01 Claude Code session; migrated from the user-level auto memory folder on 2026-11-02; dialog focus gotchas added from the 2026-11-02 PR audit fix session

No Playwright package is installed in this repository.
`playwright` appears in `pnpm-lock.yaml` only as an optional peer dependency of Vitest, and a cached Chromium sits under `~/Library/Caches/ms-playwright`.
Adding Playwright would mean a new dependency plus a browser download, and `AGENTS.md` asks for the owner's approval before either.

A headless Chrome smoke test works without any download:

1. Serve the production build with `pnpm build` and then `pnpm preview --port 4173`.
2. Launch `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome --headless=new --remote-debugging-port=<port>`.
3. Read `http://127.0.0.1:<port>/json` for the page's WebSocket URL, then talk to the page over the Chrome DevTools Protocol with the global `WebSocket` that Node 24 provides.

Why it matters: jsdom cannot verify the swipe deck, touch gestures, or the iPhone layout.
CDP provides touch emulation (`Input.dispatchTouchEvent`), device metrics, key events, and screenshots.

Gotchas:

* Call `Emulation.setEmulatedMedia` with `prefers-reduced-motion: no-preference` first, because the host's reduce-motion setting otherwise zeroes the exit animation timers.
* Select an open dialog with `dialog[open]`, not the first `dialog` element on the page.
* jsdom has no `HTMLDialogElement.showModal()`, so `ModalDialog.vue` falls back to the `open` attribute there and `autofocus` never moves focus.
  Vitest can only assert the `autofocus` attribute; check where focus actually lands over CDP.
  `Input.dispatchKeyEvent` with `autoRepeat: true` simulates a held key, which is how the 2026-11-02 session showed that a doubled or held Enter confirmed the restart dialog.
* Scroll a button into view and confirm its center is inside the viewport before `Input.dispatchMouseEvent`, because the results screen can still be settling its layout and a click outside the viewport hits nothing.
