# GitHub Copilot instructions

[`AGENTS.md`](../AGENTS.md) at the repository root is the primary instruction set for every AI agent working here, Copilot included.
This file exists because Copilot code review does not read `AGENTS.md`: it restates for Copilot the rules that `AGENTS.md` already states for everyone else, and it adds the review guidance that is specific to Copilot code review.
Read `AGENTS.md` first when you can, treat it as authoritative wherever the two disagree, and add a new rule there rather than here.

GitHub loads this file as the repository-wide custom instruction set, so it applies to code review and to authoring alike.
The repository has no path-scoped `.github/instructions/*.instructions.md` files yet.


## Review philosophy

* Report an issue only when you have high confidence that it is real and introduced or exposed by the pull request.
* Focus on correctness, user impact, privacy, accessibility, and the game invariants below.
* Make each comment actionable and keep one issue per comment.
* State the problem first, explain the impact when it is not obvious, and suggest a specific fix.
* Check the changed lines in their repository context before commenting.
* Stay silent when you cannot identify a concrete issue.


## Sources of truth

Use these files in priority order when reviewing a change:

1. `AGENTS.md` for repository-wide requirements.
2. A matching `skills/<skill-name>/SKILL.md` for task-specific requirements.
3. The pages under `docs/` for how each layer of the app works, starting with `docs/architecture.md`.
4. `docs/markdown-style-guide.md` and `docs/repo-commit-style-guide.md` for Markdown formatting and commit messages.
5. `memory/MEMORY.md` and the memory files it indexes for decisions and gotchas that no other file records.
6. Existing nearby files for local implementation patterns.

If two sources conflict, follow the higher-priority source.


## Repository context

* Tokyo Comedy Dating Bingo is a bilingual (English and Japanese) party game that combines Tinder-style swiping with a 5x5 Bingo card.
* It is a single-page Vue 3 app built with Vite and TypeScript, tested with Vitest in jsdom, and deployed to GitHub Pages from `main`.
* Use `pnpm`, not `npm` or `yarn`.


## Game invariants

Flag any change that breaks one of these rules from `AGENTS.md`, unless the pull request says the owner approved it:

* Everything runs in the browser: no backend, database, analytics, remote logging, API keys, or request that sends answers off the device.
  Google Fonts is the only third-party request, and answers never go into URLs.
* There is one page and no router.
* There are exactly 24 questions, and the board is always a 5x5 grid with the `FREE` cell at flat index 12.
* Question IDs (`q01` to `q24`) are stable, and the English question labels in `src/data/questions.ts` are final.
* Game logic stores, compares, and evaluates by question ID only, never by translated text, and `src/utils/` imports neither Vue nor Vue I18n.
* The board shuffle is independent of the answers and the swipe order, and neither switching language nor editing an answer reshuffles it.
* Switching language never restarts the game, and restarting never resets the language preference.
* A change to the `GameState` shape bumps `GAME_STATE_VERSION` and updates `parseGameState` in `src/composables/useGameStorage.ts`.
* Keyboard control, visible focus, localized screen-reader labels, `prefers-reduced-motion` support, and state indicators that do not rely on color alone are requirements.


## Localization

* User-facing strings, including `aria-label` text and status announcements, live in `src/i18n/locales/en.ts` and `src/i18n/locales/ja.ts`, never hardcoded in a Vue component.
* A new key needs both an English and a Japanese entry; `pnpm typecheck` and `src/tests/i18n.test.ts` catch a missing one.
* Japanese UI copy does not put spaces between Japanese characters and Latin letters or digits, for example `24問中8問目`.


## Code style

* Favor readability over cleverness in TypeScript, Vue, and Node.js code.
* Do not nest ternary operators.
  Use an early return or a named helper instead.
* Vue components use `<script setup lang="ts">` and the Composition API.
* Interface icons are Lucide components from `@lucide/vue`, imported by name and hidden with `aria-hidden="true"`.
  Flag a new emoji or Unicode symbol used as an interface icon, and flag an icon that differs from the one already used for the same meaning.
  The PNG export copies the board and stat icon shapes into `EXPORT_ICON_PATHS` in `src/utils/exportImage.ts`, so flag an icon change that updates only one side.
* Code under `src/` uses 2-space indentation, single quotes, and no semicolons, by hand, because Prettier does not format `src/`.


## Writing style

These rules apply to English Markdown prose and to prose comments in scripts and other code files.
In Markdown files, markdownlint replaces curly quotes, en dashes, and em dashes automatically, so flag those three only in code comments.

* Use straight quotes, not curly quotes.
* Do not use contractions (write "do not" instead of "don't").
* Use the Oxford comma.
* Use sentence case for headings (capitalize only the first word and proper nouns).
* Use a plain hyphen, never an en dash or an em dash.
* Give each sentence its own source line, and never split one sentence across two source lines.
* Keep wording simple for non-native English speakers, and avoid slang and idioms.


## Authoring rules

Apply these when writing or editing files rather than reviewing them:

* Use `lowercase-with-dashes` for file and folder names outside `src/`; inside `src/`, use PascalCase for Vue components and camelCase for TypeScript modules.
* When renaming a file or folder, update every reference to it, including the "Project structure" tree in the root `README.md`.
* Keep the `README.md` index of `docs/`, `prompts/`, `scripts/`, and `skills/` accurate when a folder's contents change.
* Use `*` for unordered list items, 2-space indentation for nested lists, 2 blank lines above headings, and 1 blank line below.
* Restrict inline HTML in Markdown to `<br>`, `<pre>`, `<script>`, `<ul>`, `<li>`, and `<ol>`.
* Keep the `scripts` block in `package.json` sorted alphabetically.
* Never add a `Co-Authored-By` trailer, a "Generated with" line, or any other AI attribution to a commit message, a pull request body, an issue, or a comment.


## Web research

These come from the "Web research" section of `AGENTS.md`, which stays authoritative.

* Before you read anything on the web, list the sites you want to check and wait for the user to approve the list.
* The rule covers every route to the network: the fetch and search tools, a browser session, a shell command such as `curl` or `wget`, and an MCP server that reads a remote resource for you.
* Approval covers the task at hand only, and a site the work turns up later needs its own ask.
* The standing allowlist of pre-approved sites lives in `.claude/settings.json` under `permissions.allow` as `WebFetch(domain:<host>)` entries.


## Automated checks

* `.github/workflows/deploy.yml` is the only workflow.
  On every push to `main` it runs `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm typecheck`, and `pnpm build`, then deploys `dist/` to GitHub Pages.
* Nothing runs on pull requests, so `pnpm check` (lint, test, and build) run locally is the only gate before merge.
* The tests run in jsdom, so touch gestures, the Web Share API, and PNG export on real devices are checked by hand.


## Low-value comments to avoid

Do not comment on:

* Formatting that Prettier or markdownlint handles.
* Curly quotes, em dashes, en dashes, and non-breaking spaces, which the markdownlint `search-replace` rules in `.markdownlint-cli2.jsonc` rewrite automatically in Markdown files.
* Subjective rewrites that do not improve accuracy or task completion.
* Minor naming preferences when the existing name is clear and consistent.
* Requests for comments on self-explanatory code.
* Refactoring ideas without a concrete correctness or maintainability problem.
* Several unrelated issues in one comment.


## Comment format

Use this structure when you identify an issue:

1. State the problem in one sentence.
2. Explain why it matters in one sentence when the impact is not obvious.
3. Suggest a specific change or a small replacement snippet.

Example:

```text
This compares the translated label instead of the question ID, so Bingo detection breaks when the player switches to Japanese. Compare `cell.id` instead.
```
