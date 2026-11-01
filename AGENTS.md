# Repository rules

These rules apply to all AI agents working in this repository.
This is the canonical instructions file.


## Project overview

Tokyo Comedy Dating Bingo is a bilingual (English and Japanese) party game that combines Tinder-style swiping with a 5x5 Bingo card.
Players swipe through 24 Tokyo dating experiences, and the game then builds a Bingo board from their answers.
It is a single-page Vue 3 app built with Vite and TypeScript, and it deploys as a static site to GitHub Pages at <https://ahandsel.github.io/tokyo-comedy-dating-bingo/>.
The content is mature, dating-related humor intended for adults.
The repository itself is private, but the deployed site is public.

* [README.md](README.md) is the human-facing reference for the game rules, the saved-state format, the theme, and deployment.
* The pages under [docs/](docs/README.md) explain how each layer of the code works.
  Start with [docs/architecture.md](docs/architecture.md), then read the page for the layer you are changing.
* [start-prompt.prompt.md](start-prompt.prompt.md) is the original build specification.
  Read it when you need the reasoning behind a rule in "Game invariants".
* When the README and the code disagree, the code is canonical.
  Fix the README in the same change.


## Repository structure

* `src/` - The app.
  * `App.vue` and `main.ts` - The root component, which switches views by game phase, and the entry point, which boots Vue I18n with the saved or detected locale.
  * `components/` - Vue components for the swipe deck, the Bingo board, the dialogs, and the language switcher.
  * `views/` - One view per game phase: `WelcomeView.vue`, `GameView.vue`, and `ResultsView.vue`.
  * `composables/` - Reactive state: `useGame.ts` (game store and rules), `useGameStorage.ts` (LocalStorage persistence and validation), and `useLocale.ts` (language switching, `<html lang>`, and the document title).
  * `data/questions.ts` - The 24 bilingual questions.
  * `i18n/` - Vue I18n setup in `index.ts` and the interface message catalogs in `locales/en.ts` and `locales/ja.ts`.
  * `types/` - Shared types, including `GameState`, `Locale`, and the `FREE` board marker.
  * `utils/` - Pure TypeScript logic: shuffling, board generation, Bingo evaluation, and PNG export.
  * `tests/` - Vitest suites plus the shared `setup.ts` and `helpers.ts`.
  * `style.css` - Theme tokens, typography, and shared button styles.
* `public/` - Static files that Vite copies into `dist/` unchanged.
* `index.html` - The HTML entry point, including the Google Fonts links.
* `.github/workflows/` - The deployment workflow.
  See "Continuous integration".
* `.claude/` - Claude Code configuration: `settings.json` (permissions, attribution, and the lint hook), the `CLAUDE.md` stub that imports this file, and the `commands` and `skills` symlinks described below.
* `docs/` - One page per layer of the code, plus the Markdown and commit style guides, indexed by [docs/README.md](docs/README.md).
* `memory/` - Durable cross-session notes for AI agents, indexed by [memory/MEMORY.md](memory/MEMORY.md).
* `prompts/` - Reusable `*.prompt.md` files, indexed by [prompts/README.md](prompts/README.md).
  `.claude/commands` is a symlink to this folder, so each prompt is also a Claude Code slash command.
* `scripts/` - Development tools and automation scripts, indexed by [scripts/README.md](scripts/README.md).
* `skills/` - Reusable AI workflows, each with a `SKILL.md` file, indexed by [skills/README.md](skills/README.md).
  `.claude/skills` is a symlink to this folder.

This repository has no `agents/` folder and defines no custom subagents.
Load the matching skill directly.


### README.md files

* Each top-level support folder (`docs/`, `prompts/`, `scripts/`, and `skills/`) has a `README.md` that indexes its contents.
  Keep it current whenever you add, rename, or remove a file in that folder.
  The `readme-maintainer` skill checks these indexes.
* `memory/` is the exception: [memory/MEMORY.md](memory/MEMORY.md) is its index, so do not add a `README.md` to it.
* When a change alters how a layer of the app works, update the matching page under `docs/` in the same change.
* `src/` and its subfolders do not get their own `README.md` files.
  Two file trees document them instead: "Project structure" in the root [README.md](README.md) and "Folder layout" in [docs/architecture.md](docs/architecture.md).
  Update both trees when you add, rename, or remove a file under `src/`.


## Setup and commands

Use Node.js 24 (pinned in `.node-version`) and pnpm 12 (pinned in the `packageManager` field of `package.json`).

* `pnpm install` - Install dependencies.
* `pnpm dev` - Start the Vite dev server at `http://localhost:5173/tokyo-comedy-dating-bingo/`.
* `pnpm test` - Run the Vitest suite once.
  Pass a path to run one file, for example `pnpm test src/tests/board.test.ts`.
* `pnpm test:watch` - Run Vitest in watch mode.
* `pnpm typecheck` - Type-check the app and `vite.config.ts` with `vue-tsc -b`.
* `pnpm build` - Type-check, then build the production site into `dist/`.
* `pnpm preview` - Serve an existing production build locally.
* `pnpm lint` - Run `lint-code` and then `lint-md`.
* `pnpm lint-code` - Format the repository with Prettier.
  `src/` is excluded; see "Code style" for why.
* `pnpm lint-md` - Fix Markdown with markdownlint-cli2.
* `pnpm check` - Run `lint`, `test`, and `build` in that order, stopping at the first failure.
* `pnpm index` - List every `pnpm` script defined in `package.json`.

The `BASE_PATH` environment variable sets the Vite `base` and defaults to `/tokyo-comedy-dating-bingo/`, so the dev server, the preview, and production all use the same path.
Use `BASE_PATH=/ pnpm build` for a root site or a custom domain.

In Claude Code, a `PostToolUse` hook in `.claude/settings.json` runs `pnpm lint` after every Write or Edit.
The hook formats the whole repository, so it can rewrite the file you just edited and any other file that is not yet formatted.
If a follow-up edit fails because the file changed, read the file again first.


### Before you commit

Run `pnpm check` and fix every failure.
It runs `pnpm lint`, `pnpm test`, and `pnpm build`, which includes the typecheck.

Pull requests get no CI checks, and the deployment workflow runs straight from `main`, so this local run is the only gate before a change goes live.


## Game invariants

These rules come from the original specification, and the tests enforce most of them.
Do not change one without the owner's explicit approval.

* Everything runs in the browser.
  Do not add a backend, a database, analytics, remote logging, API keys, or any request that sends answers off the device.
  Google Fonts is the only third-party request.
* Answers never go into URLs.
  Sharing happens only when the player presses "Share" or "Save image", and the image is generated locally.
* There is one page and no router.
  Do not add routes such as `/en/` and `/ja/`; the same page serves both languages, and a reload on GitHub Pages never returns a 404.
* There are exactly 24 questions, and the board is always a true 5x5 grid with the `FREE` cell at `CENTER_INDEX` (flat index 12).
* Question IDs (`q01` to `q24`) are stable.
  Answers, the swipe order, and the board arrangement are all stored as IDs, so changing an ID invalidates saved games.
* The English question labels in `src/data/questions.ts` are final.
  Do not reword them.
  The Japanese labels may be refined as long as they keep the original intent.
* Game logic never reads translated text.
  Store, compare, and evaluate by question ID only, and keep `src/utils/` free of Vue and Vue I18n imports.
* The board shuffle is independent of the answers and of the swipe order.
  Switching language or editing an answer on the results screen never reshuffles the board or the swipe order.
* Switching language never restarts the game, and restarting the game never resets the language preference.
* The LocalStorage keys are `tcdb:game` and `tcdb:preferences`.
  When you change the `GameState` shape, bump `GAME_STATE_VERSION` in `src/composables/useGameStorage.ts` and update `parseGameState`, so that an old save is discarded rather than misread.
* Accessibility is a requirement: keyboard control, visible focus, localized screen-reader labels and live-region announcements, `prefers-reduced-motion` support, and state indicators that do not rely on color alone.


## Localization

English and Japanese ship together and stay equally complete.

* Do not hardcode user-facing strings in Vue components, including `aria-label` text and status announcements.
  Add the key to `src/i18n/locales/en.ts`, which defines the schema, and to `src/i18n/locales/ja.ts`, which is typed as `MessageSchema`.
  `pnpm typecheck` fails on a missing Japanese key, and `src/tests/i18n.test.ts` checks key parity in both directions.
* Question text lives only in `src/data/questions.ts`, never in the locale files.
* Japanese UI copy does not put spaces between Japanese characters and Latin letters or digits, for example `24問中8問目`.
  Do not let a formatter or an editor re-space it, because the tests match these exact strings.
* Japanese text tends to be longer and wraps differently.
  When you change layout or copy, check both languages for overflow in swipe cards and board cells.
* To add a third language, follow "Adding a third language" in the README.


## Code style

* Favor readability over cleverness in TypeScript, Vue, and Node.js code.
* Do not nest ternary operators.
  Use an early return or a named helper instead.
* Write Vue components as single-file components with `<script setup lang="ts">` and the Composition API.
  Type props and emits with `defineProps<...>()` and `defineEmits<...>()`.
* Put game rules in pure functions under `src/utils/` and reactive state in `src/composables/`, and keep components focused on rendering and events.
* Use BEM-style class names (`block__element` and `block--modifier`), and add a `data-testid` attribute to each element that a test needs to find.
* Theme colors, fonts, radii, and shadows are CSS custom properties at the top of `src/style.css`.
  The PNG export copies them as constants in `src/utils/exportImage.ts` (`COLORS`, `EXPORT_FONT_STACK`, and `EXPORT_SCRIPT_STACK`), so change both together.
  It also copies the Lucide shapes it draws into `EXPORT_ICON_PATHS`, so change an icon on the board or in the stats in both places.
* Use Lucide icons from `@lucide/vue` for interface icons, not emoji or Unicode symbols, and import each icon by name.
  Hide each icon with `aria-hidden="true"`, size it in CSS, and reuse the icon that already stands for the same meaning.
  "Theme customization" in the README lists the sizing rule and the icon for each meaning.
* Prettier does not format `src/`, so match the existing style by hand: 2-space indentation, single quotes, and no semicolons.
  The reason is that `prettier-plugin-autocorrect` must stay last in `.prettierrc.json5`, and it takes over the TypeScript and Vue parsers.
  On `src/` it would only re-space the Japanese UI copy, so `src/` is listed in `.prettierignore`.


## Testing

* Tests live in `src/tests/` as `<area>.test.ts` files and run in jsdom with Vitest and Vue Test Utils.
* `src/tests/setup.ts` clears LocalStorage and resets the game store before each test.
  It also makes `HTMLCanvasElement.getContext` return `null`, because jsdom has no canvas, so confetti stays off and PNG export reports that it is unavailable.
  Reuse the helpers in `src/tests/helpers.ts`, such as `mountApp`, `memoryStore`, and `firePointer`, rather than writing new ones.
* Use `seededRandom` from `src/utils/shuffle.ts` when a test needs a predictable shuffle.
* Add or update tests with every behavior change.
  When the change touches visible text, cover both English and Japanese.
* There are no end-to-end browser tests.
  Touch gestures, the Web Share API, and PNG export on real devices are checked by hand, so flag that in the pull request when a change affects them.


## Dependencies

* Keep the dependency list short.
  The swipe gesture and the Bingo engine are custom on purpose, and the README records why each candidate library was rejected.
* Ask the owner before you add a dependency.
  When one is added, record its license and purpose in the "Dependencies and licenses" section of the README.
* `pnpm-workspace.yaml` sets `minimumReleaseAge` to three days, so pnpm refuses package versions published less than three days ago.
  Do not lower it to get a newer version.


## Package manager

Always use `pnpm` - never `npm`, `npx`, or `yarn`.
Do not commit `package-lock.json` or `yarn.lock`.
Run a tool that is already installed with `pnpm exec <bin>`.
`pnpm dlx` downloads a package before it runs it, so it needs approval under "Web research".

Keep scripts in `package.json` sorted alphabetically.
Commit `pnpm-lock.yaml` together with every `package.json` change, because the deployment installs with `--frozen-lockfile` and fails on a stale lockfile.


## Continuous integration

* `.github/workflows/deploy.yml` is the only workflow.
  On every push to `main` and on manual dispatch, it runs `pnpm install --frozen-lockfile`, `pnpm test`, and `pnpm typecheck`, builds with `BASE_PATH=/<repository-name>/`, and deploys `dist/` to GitHub Pages.
* The workflow does not run `pnpm lint`, and nothing runs on pull requests.
  See "Before you commit".
* The workflow derives the base path from the repository name, so renaming the repository needs no change.
  For a custom domain, follow "Custom domain setup" in the README.


## Skills

Prioritize local skills in `skills/` over external or global skills.

1. Check [skills/README.md](skills/README.md) for the index.
2. Load and follow `skills/<skill-name>/SKILL.md` before starting matching work.
3. If a local skill and an external skill overlap, use the local skill.

Skill maintenance:

* When you add, rename, or remove a skill or a skill script, update `skills/README.md` and the managed entries in `.claude/settings.json` in the same change: one `Skill(<skill-name>)` entry per skill and one `Bash(<runner> <path>:*)` entry per skill script.
* Check the allowlist with `node skills/skill-allowlist-syncer/scripts/check-skill-allowlist.mjs`.
  If it reports `result:drift`, rerun it with `--write`, which rewrites `.claude/settings.json` and therefore prompts first.
* If `skills/README.md` and the `skills/` folder disagree, treat the `SKILL.md` files as canonical and fix the index.
* `gh-address-comments`, `gh-fix-ci`, `security-best-practices`, and `security-threat-model` are vendored third-party skills.
  Keep them unchanged so they can be re-synced with upstream; markdownlint skips them.
* GitHub Copilot does not see these skills, because the repository keeps no copies under `.github/skills/`.


## Memory

Cross-session notes for AI agents live in the top-level `memory/` folder.
Each memory is one file holding one fact, decision, or open question, and [memory/MEMORY.md](memory/MEMORY.md) is the index that lists them all.

@memory/MEMORY.md

* In Claude Code, the `@memory/MEMORY.md` line above imports the index into this file.
  Other agents do not process that import, so open [memory/MEMORY.md](memory/MEMORY.md) yourself.
* No agent loads the individual memory files automatically, so open the ones the task touches before starting work.
* Record what this file, the README, and the pages under `docs/` do not cover: gotchas, decisions and their reasons, and questions still waiting on a decision.
* Follow the maintenance rules in `memory/MEMORY.md`: the file format, the category prefix in each file name, and one index line per memory.
  Write the memory itself in its own file; the index carries only that line.
* Save every memory in this folder, never under `~/.claude/projects/`.
  `.claude/settings.json` sets `autoMemoryDirectory` to this folder, but Claude Code ignores that key in a checked-in settings file for security.
  To make auto memory land here, set the key to this folder's absolute path in your own `.claude/settings.local.json`.
  Otherwise, check the memory path in your system prompt, and when it points elsewhere, write the memory here yourself.
* The repository is private, but everything in this folder is tracked by git, so never store secrets, credentials, or personal details in it.


## Web research

Reaching a website is not a free action.
Before you read anything on the web, present the list of sites you want to check and wait for the user to approve it.

The rule covers every route to the network:

* The `WebFetch` and `WebSearch` tools.
* A browser session driven by Playwright or another browser automation tool.
* Any shell command that makes a request, such as `curl`, `wget`, `npx`, `pnpm dlx`, or an inline `node -e` script that calls `fetch`.
* An MCP server that reads a remote resource for you.

The rule is about reading the web, not about running this project.
`pnpm install`, the repository scripts under `scripts/` and `skills/<skill-name>/scripts/`, and the `gh` commands in the allowlist stay allowed.
Opening the local dev server or preview in a browser is also allowed, even though the page loads Google Fonts.


### How to ask

1. Stop before the first request.
2. List every site you want to visit, one per line, giving the URL or the domain and one short sentence on what you need from it.
3. Wait for the user to approve the list.
   Do not treat silence, a related instruction, or your own judgment as approval.
4. Visit only what the user approved.
   When the work turns up a site that is not on the approved list, ask again before you follow it.

Approval covers the task at hand only, so a later task starts over even in the same session.
A URL that the user puts in the request is already approved, and so is a page linked from it when the user tells you to follow the link.


### Standing allowlist

Some sites are approved in advance and need no ask.
They live in [.claude/settings.json](.claude/settings.json) under `permissions.allow` as `WebFetch(domain:<host>)` entries, which is the same list Claude Code enforces, so the repository keeps one list rather than two.
Read that list before you ask, and leave an already-approved site out of the list you present.

To add a site, add a `WebFetch(domain:<host>)` entry to the `allow` array and keep the array sorted.
To remove one, delete its entry.
The repository owner decides what belongs on this list.


### What the permission rules do

In Claude Code, `.claude/settings.json` shows a prompt before `WebFetch` reaches a host outside the standing allowlist, and before `WebSearch`, `curl`, `wget`, `npx`, or `pnpm dlx` runs.
Those entries match a literal command prefix, so a request phrased another way can still reach the network without a prompt.
The written rule above binds every agent, and no permission list replaces it.


## Copilot instructions

[.github/copilot-instructions.md](.github/copilot-instructions.md) is the repository-wide instruction file that GitHub Copilot loads for code review and authoring.
It restates for Copilot what this file says for every other agent.

* This file stays the primary instruction source.
  Keep a rule here and let the Copilot file point at it, rather than moving a rule into `.github/`.
* When you change a rule here that Copilot also needs, update the Copilot file in the same change.


## File and folder naming

* Use `lowercase-with-dashes` for file and folder names.
* Inside `src/`, follow Vue and TypeScript conventions instead:
  * PascalCase for Vue components and views, such as `BingoBoard.vue`.
  * camelCase for TypeScript modules, such as `useGame.ts` and `exportImage.ts`.
  * `<area>.test.ts` for test files.
* Conventional uppercase names such as `README.md`, `AGENTS.md`, `LICENSE`, `MEMORY.md`, and `SKILL.md` are exempt.
* Use the `.yaml` extension for YAML files, not `.yml`, except when an external tool or platform requires a specific filename.
  Files inside dot-folders such as `.github/` are exempt.
* When renaming a file or folder, update every reference to it across documentation, scripts, and code, including the "Project structure" tree in the README.


## Writing style

Apply these rules when reviewing or creating content.
They cover Markdown prose and prose comments in scripts and other code files.
In Markdown files, `pnpm lint` replaces curly quotes, en dashes, and em dashes automatically.
Nothing checks the other rules, or any rule in a code comment, so apply them yourself, and use the `general-en-polisher` skill to review a Markdown file.

* Use straight quotes, not curly quotes.
* Do not use contractions (write "do not" instead of "don't").
* Use the Oxford comma.
* Use sentence case for headings (capitalize only the first word and proper nouns).
* Never use en-dash or em-dash; always use a plain hyphen (`-`) instead.
* Give each sentence its own source line, as described in "One sentence per line".
* Keep wording simple for non-native English speakers.
  Avoid slang and idioms.
* Maintain consistent capitalization and punctuation throughout a document.

These rules cover English prose only.
Japanese copy in `src/i18n/locales/ja.ts` and `src/data/questions.ts` follows Japanese conventions, including full-width punctuation such as `。` and `「」`.


## One sentence per line

Give each sentence its own source line, and never split one sentence across two source lines.
This keeps diffs focused: editing one sentence changes one source line.

* Apply the rule to Markdown body prose and to prose comments in scripts and other code files, wherever a soft line break keeps the rendered output the same.
* Use an ordinary Markdown soft line break between sentences.
  Do not add a trailing space or a `<br>` element, because both create a visible line break.
* Indent a continuation sentence so it stays inside the same list item, and repeat `>` on a continuation sentence inside a blockquote.
* When wrapping text, break only at sentence boundaries, so each line holds whole sentences.
  Never wrap prose to a fixed column width.
* Keep frontmatter, fenced code blocks, inline code spans, tables, and URLs in their existing layout.
  Keep a frontmatter value on its existing YAML line, and do not turn it into a block scalar only to split its sentences.
  Do not rewrap text inside a table cell.

Example:

```markdown
The export runs every night.
It includes every file in the folder.

* Turn on the setting.
  The change applies to every user.
```


## Markdown formatting

* When writing or editing any Markdown file, follow [docs/markdown-style-guide.md](docs/markdown-style-guide.md).
* Follow the rules defined in [.markdownlint-cli2.jsonc](.markdownlint-cli2.jsonc).
* Use `*` for unordered list items (not `-` or `+`).
* Use 2-space indentation for nested lists.
* Leave 2 blank lines above headings and 1 blank line below.
* Inline HTML is restricted to `<br>`, `<pre>`, `<script>`, `<ul>`, `<li>`, and `<ol>`.
* Keep each table in one style, either fully aligned or fully compact, because markdownlint rule MD060 rejects a mix and cannot fix it.
* Put Japanese UI copy that you quote in Markdown inside an inline code span.
  `pnpm lint` inserts spaces between Japanese text and Latin letters or digits in Markdown prose, but it leaves code spans alone.


## Scripts

Helper scripts live in the top-level `scripts/` folder, and a skill may carry its own scripts under `skills/<skill-name>/scripts/`.
See [scripts/README.md](scripts/README.md) for the index of the top-level scripts.

Authoring rules, with `scripts/index.sh` as the reference example:

* Default to Node.js ES modules (`.mjs`) or zsh.
  Python is banned, because managing Python environments and dependencies across different users' machines is not worth the overhead.
* Use Node.js for file system operations, string manipulation, or integration with JavaScript-based tools.
* Use zsh for simple command sequences, environment setup, or when shell features would be more cumbersome to implement in Node.js.
* Every script supports `--help` and prints usage that is clear to a user who has not seen the script before.
* Every script carries a notes section near the top covering general notes (what it does), usage (how to invoke it), output (what it returns or generates), and a reverse-chronological version history with a date and a summary per version.
* Bump the version and add a version-history entry whenever you change a script, and name the script and its new version in the commit title, for example `🔧 index.sh v1.3: list pnpm scripts`.
* Use status emojis in output: ✅ for success, ⚠️ for warnings, and ❌ for errors.

The `script-auditor` skill checks a new or changed script against these rules.

Permissions.
`.claude/settings.json` sorts script invocations into three tiers by risk:

* `allow` for read-only scripts and scripts that write only their own generated file, such as `index.sh`, `audit-helper-scripts.mjs`, and the check mode of `check-skill-allowlist.mjs`.
* `ask` for scripts that delete or rename files, rewrite existing files in place, create commits, or change git history, such as `check-skill-allowlist.mjs --write`, `lint-names.mjs --fix`, `update-branch-from-main.mjs`, and the `ai-commit` apply scripts.
* `deny` for destructive shell commands and for reads of local secret files such as `.env`.

When you add or rename a script, classify it into one of those tiers and add the matching entries: `Bash(<runner> <path>:*)` with the runner that matches how the script is invoked (`node` for a `.mjs` file, `zsh` for a shell script here), plus `Bash(pnpm <script>:*)` for every `package.json` script that invokes it.
Prefix matching is literal, so an entry only fires on the exact command string it spells out.

The `skill-allowlist-syncer` skill writes an `allow` entry for every skill script, including scripts that belong in `ask`.
Gate such a script by adding a matching `ask` entry and leaving the `allow` entry in place: Claude Code evaluates `deny`, then `ask`, then `allow`, so the `ask` entry prompts even though the `allow` entry also matches.


## Git commits

* Never add a Co-Authored-By trailer to commit messages.
* Follow the commit style guide in [docs/repo-commit-style-guide.md](docs/repo-commit-style-guide.md).
* Use the `ai-commit` skill to write commit messages based on git inputs and user notes.
* Write the title as a gitmoji followed by a short imperative summary in sentence case, for example `✨ Add the swipe deck and welcome flow`.
  Pick the gitmoji from the full list in the style guide; the most common are ✨ for features, 🐛 for fixes, 🧪 for tests, 📝 for documentation, and 🔧 for configuration and tooling.
* Keep each commit to one logical change, such as one feature, its tests, or one tooling update.


## Pull requests

* Use the `gh-pr-generator` skill to draft the body and open the pull request.
* Never add a "Generated with Claude Code" line or any other AI attribution to a pull request body, an issue, or a comment.
  `.claude/settings.json` sets `attribution.pr` to an empty string, so Claude Code does not add one.
* Nothing runs on pull requests, so run `pnpm check` before you open one, as described in "Before you commit".
