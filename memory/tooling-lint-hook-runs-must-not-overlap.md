# Never let two lint hook runs overlap

* Type: Tooling
* Added: 2026-11-02
* Source: a 2026-11-02 Claude Code session running the `readme-maintainer` skill; see also the `ignores` comment in [.markdownlint-cli2.jsonc](../.markdownlint-cli2.jsonc)

The `PostToolUse` hook in `.claude/settings.json` runs `pnpm lint` after every Write or Edit, and `pnpm lint` rewrites every Markdown file in the repository.
Prettier first changes each `*` list marker to `-` and removes double blank lines, and then `markdownlint-cli2 --fix` changes them back.
When two runs overlap, one run applies its fixes to text that the other run has already changed.
In that session, two Edit calls sent in parallel corrupted more than 20 Markdown files: stray `*` lines, a first letter replaced by `*` (`*othing`), headings turned into `_# Contents_`, and blank lines inserted into tables, lists, and code blocks.
A second agent session or an editor that saves into the repository at the same time can cause the same race.

How to apply:

* Send Write and Edit calls one at a time in this repository, never in parallel.
* Before you edit, make sure that no other agent session is editing the repository.
* To recover, restore files that had no uncommitted changes with `git checkout --`, and restore files that Claude edited from the backups in `~/.claude/file-history/<session-id>/`.
  Use Bash for the recovery, because Bash does not trigger the hook.
* `pnpm exec prettier --check` reports clean committed Markdown files as unformatted, because markdownlint reverts the Prettier changes.
  Use `pnpm exec markdownlint-cli2 <files>` to check a few files without rewriting the whole repository.
