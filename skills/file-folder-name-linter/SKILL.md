---
name: file-folder-name-linter
description: Lint repository file and folder names for format compliance with the "File and folder naming" rules in AGENTS.md. Use when users ask to check naming conventions, enforce the `.yaml` extension, or sweep the repo for names that are not kebab-case; applies a fixed set of rules from the skill and reports any discovered repository style guides for reviewer reference.
---

# File and folder name linter skill

Sweep the repository for file and folder names that drift from the "File and folder naming" rules in `AGENTS.md`.
Use this skill when the user asks to check naming, enforce file extensions, or sweep the repo for non-compliant paths.

The skill enforces a fixed set of rules from this `SKILL.md` and surfaces every discovered repository style guide (`AGENTS.md`, `docs/markdown-style-guide.md`, `docs/repo-commit-style-guide.md`, and so on) at the end of the report, so the reviewer can sanity-check intent on gray-area findings.


## Rules

The linter enforces two rules on every run:

1. **`.yaml` not `.yml`.**
   Any tracked file ending in `.yml` is flagged with a `.yaml` suggestion.
   This is the only rule the linter can auto-fix.
2. **Kebab-case.**
   File basenames (before the first dot) and folder names must match `^[a-z0-9][a-z0-9-]*$` - lowercase letters, digits, and hyphens, starting with a letter or digit.
   No underscores, no uppercase, no spaces.

`src/` is out of scope, because `AGENTS.md` gives it Vue and TypeScript conventions instead: PascalCase for Vue components and views, camelCase for TypeScript modules, and `<area>.test.ts` for test files.
Check names under `src/` by reading them against those rules.


## Scope

In scope:

* Every file tracked by git that is not covered by a default ignore or a `.namelintignore` pattern.
* Every folder that contains at least one in-scope file.

Out of scope (the linter skips these):

* Anything excluded by `.gitignore` (handled implicitly because the linter uses `git ls-files` to enumerate paths).
  Untracked files are skipped too, so add a new file to git before linting it.
* `src/` and everything beneath it, as described under "Rules".
* Standard repo docs and skill definitions anywhere in the tree: `README.md`, `README.txt`, `AGENTS.md`, `MEMORY.md`, `ONBOARDING.md`, `SKILL.md`, `LICENSE` (with or without a `.md` or `.txt` extension), `CHANGELOG.md`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md`, `SUPPORT.md`, `AUTHORS` (with or without `.md`), and `NOTICE` (with or without a `.md` or `.txt` extension).
* Fixed-name toolchain files: `Brewfile`, `Makefile`, `Dockerfile`, `Procfile`, `Gemfile`, `Rakefile`, `Caddyfile`, `Justfile`, and `Vagrantfile`.
* Dotfiles and dot-folders: any path segment that starts with `.` (`.gitignore`, `.node-version`, `.claude/`, `.github/`, and so on).
  This also covers the `.yml` exemption for files inside dot-folders, such as the workflows in `.github/workflows/`.
* Package manager files: `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and `tsconfig*.json`.
* Anything matched by the repo-root `.namelintignore` file.


## Quick start

Run the bundled linter with `node` from the repo root:

```bash
# Scan the whole repo and print a grouped report.
node skills/file-folder-name-linter/scripts/lint-names.mjs

# Scan a subset of paths.
node skills/file-folder-name-linter/scripts/lint-names.mjs docs/ skills/

# Rename *.yml to *.yaml in place (the only auto-fixable rule).
node skills/file-folder-name-linter/scripts/lint-names.mjs --fix

# Machine-readable output for piping.
node skills/file-folder-name-linter/scripts/lint-names.mjs --json

# Print help and exit.
node skills/file-folder-name-linter/scripts/lint-names.mjs --help
```

Exit codes:

* `0` - no violations found.
* `1` - one or more violations.
* `2` - configuration error (not a git checkout, unreadable `.namelintignore`, and so on).


## Workflow

1. **Scope the run.**
   * If the user just touched a folder, pass that folder so the report stays focused, for example `docs/`.
   * For a repo-wide sweep, run with no arguments.
2. **Lint.**
   Run the linter.
   Read the grouped report.
   Violations are grouped by rule (`.yml` extension and kebab-case) so the fix list stays clear.
3. **Report.**
   Summarize for the user: which paths violate which rule, and which violations are auto-fixable.
4. **Fix.**
   * **`.yml` files:** run the linter with `--fix` to rename them in place to `.yaml`.
     Then search the repository for the old name and update every reference, as "File and folder naming" in `AGENTS.md` requires.
   * **Kebab-case violations:** rename manually.
     Renames may break Markdown links, scripts, and the file trees in the root `README.md` and `docs/architecture.md`; review each one and update every inbound reference in the same change.
   * **False positives:** if a path is intentionally non-compliant (a third-party artifact, a generated file, an external dependency), add a glob to `.namelintignore` with a one-line `#` comment explaining why.
     Do not edit the script's default ignore list for project-specific cases.
5. **Re-lint.**
   Run the linter again.
   Confirm the verdict is now clean (exit `0`).
6. **Sanity-check intent.**
   When in doubt about a rule, consult the style guides printed at the end of the report (informational `ℹ️` block) before changing the script's defaults.


## Bundled resources


### scripts/lint-names.mjs

Scans tracked files and the folders they live in, applies the two rules, and prints a per-rule report.

Behavior:

* Locates the repo root via `git rev-parse --show-toplevel`.
* Enumerates tracked paths via `git ls-files -z`, which honors `.gitignore` automatically.
* Builds the set of unique folder paths from those file paths.
* Skips default ignores (`src/`, standard docs, dotfiles, and package manager files) and any path matched by `.namelintignore`.
* Runs two rule checks (`.yml` extension and kebab-case) and groups the findings.
* Prints a human-readable report by default, or `{ violations: [...], fixed: [...], styleGuides: [...] }` with `--json`.
* With `--fix`, renames `*.yml` to `*.yaml` in place.
  Other rules report only.
* Discovers and prints style-guide files (`*style-guide*`, `*-rules.md`, `AGENTS.md`, and `repo-commit-style-guide.md`) as informational pointers - never affects the exit code.

The script reads files for discovery and only writes when `--fix` is passed; in that case, the only mutation is the `.yml` -> `.yaml` rename.


## Constraints

* Do not add new rules to this skill without confirming with the user.
  The skill enforces a fixed set of rules by design.
* Do not edit the script's hardcoded default ignore list to silence a project-specific finding.
  Add a glob to `.namelintignore` instead, with a one-line `#` comment explaining why.
* Do not auto-rename for the kebab-case rule.
  Renames in that category need human review for link breakage.
* Do not silence a violation by deleting the file.
  Confirm with the user first - the file may be intentional and just needs a rename.
* Before acting on a flagged finding, read the surrounding context.
  A rule may legitimately not apply to a vendored asset or a generated artifact; in those cases, add an ignore entry rather than rename.
