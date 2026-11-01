# Skills

This folder contains the local AI skills used by this repository.
Each skill lives in `skills/<skill-name>/SKILL.md`, and `.claude/skills` is a symlink to this folder, so Claude Code loads them as project skills.

Most skills were copied from the owner's other repositories, such as [ahandsel.github.io](https://github.com/ahandsel/ahandsel.github.io), and adapted to this app.
`gh-address-comments`, `gh-fix-ci`, `security-best-practices`, and `security-threat-model` are vendored third-party skills with their own `LICENSE.txt`, so change them only to re-sync them with upstream; markdownlint skips them.


## Usage

To use a skill, enter the skill's name in the AI interface (VS Code extension, terminal prompt, or desktop app) with the appropriate prefix for the AI tool.

| Tool   | Input       | Example                                       |
| ------ | ----------- | --------------------------------------------- |
| Claude | /skill-name | `/ai-commit --auto` or `/general-en-polisher` |
| Codex  | $skill-name | `$ai-commit --auto` or `$general-en-polisher` |

> [!TIP]
> Ask the AI `What does [skill name] do?` to get a description of the skill's functionality and usage instructions.

When you add, rename, or remove a skill or a skill script, update this index and run `node skills/skill-allowlist-syncer/scripts/check-skill-allowlist.mjs` to check the `Skill(<skill-name>)` and script `Bash(...)` entries in `.claude/settings.json`.
A skill script that writes files, creates commits, or rewrites git history also needs a matching `ask` entry, as described in the `skill-allowlist-syncer` skill.


## Available skills


### Daily utility skills

| Skill                     | Description                                                                                                                                                                                                                      | Last updated |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| [`ai-commit`][]           | Drafts and applies commit messages that follow `docs/repo-commit-style-guide.md`, with bundled scripts that gather the git context, validate the message, and apply one commit, a multi-commit plan, or a message-only reword.   | 2026-11-02   |
| [`general-en-polisher`][] | Polishes Markdown files to enforce the English writing rules in `AGENTS.md` (straight quotes, no contractions, the Oxford comma, sentence case headings, plain hyphens, and one sentence per line) and the Markdown style guide. | 2026-11-02   |
| [`gh-sync-with-main`][]   | Brings the current git branch up to date with the main branch (rebase or merge), or checks the sync status without changing anything with `--verify`. Every run ends by naming the next command to run.                          | 2026-11-02   |
| [`ja-review-text`][]      | Rewrites AI-drafted Japanese text into natural, human-sounding Japanese without changing meaning or facts.                                                                                                                       | 2026-11-02   |
| [`readability-editor`][]  | Improves the readability and scannability of Markdown docs using plain language and clear structure while preserving technical accuracy.                                                                                         | 2026-11-02   |

[`ai-commit`]: ./ai-commit/SKILL.md
[`general-en-polisher`]: ./general-en-polisher/SKILL.md
[`gh-sync-with-main`]: ./gh-sync-with-main/SKILL.md
[`ja-review-text`]: ./ja-review-text/SKILL.md
[`readability-editor`]: ./readability-editor/SKILL.md


### Review and security skills

| Skill                         | Description                                                                                                                                                                                                                | Last updated |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| [`pr-auditor`][]              | Audits an AI-written branch or pull request as a skeptical staff engineer, verifying its claims against the code and the game invariants, and gates the merge with severity-ranked findings. Reports only and never edits. | 2026-11-02   |
| [`security-best-practices`][] | Performs language and framework-specific security best-practice reviews, including a Vue frontend reference, and suggests improvements.                                                                                    | 2026-11-02   |
| [`security-threat-model`][]   | Writes a repository-grounded threat model that enumerates trust boundaries, assets, attacker capabilities, abuse paths, and mitigations.                                                                                   | 2026-11-02   |

[`pr-auditor`]: ./pr-auditor/SKILL.md
[`security-best-practices`]: ./security-best-practices/SKILL.md
[`security-threat-model`]: ./security-threat-model/SKILL.md


### Repository maintenance skills

| Skill                         | Description                                                                                                                                                                                      | Last updated |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| [`file-folder-name-linter`][] | Lints tracked file and folder names against the `AGENTS.md` naming rules (`.yaml` not `.yml`, and kebab-case outside `src/`), with style-guide pointers for the reviewer.                        | 2026-11-02   |
| [`readme-maintainer`][]       | Audits and updates the support-folder `README.md` indexes and the two `src/` file trees by default, or only creates missing READMEs with `--new`. Keeps READMEs out of individual skill folders. | 2026-11-02   |
| [`script-auditor`][]          | Audits helper scripts in `scripts/` and `skills/*/scripts/` against the `AGENTS.md` script guidelines (no Python, prefer `.mjs` or zsh, require `--help`, a notes section, and status emojis).   | 2026-11-02   |
| [`skill-allowlist-syncer`][]  | Syncs the managed `permissions.allow` entries in `.claude/settings.json` with this folder: one `Skill(<name>)` entry per skill and one `Bash(<runner> <path>:*)` entry per skill script.         | 2026-11-02   |

[`file-folder-name-linter`]: ./file-folder-name-linter/SKILL.md
[`readme-maintainer`]: ./readme-maintainer/SKILL.md
[`script-auditor`]: ./script-auditor/SKILL.md
[`skill-allowlist-syncer`]: ./skill-allowlist-syncer/SKILL.md


### GitHub skills

| Skill                     | Description                                                                                                                                                          | Last updated |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| [`gh-address-comments`][] | Finds the open pull request for the current branch and works through its review and issue comments with the `gh` CLI.                                                | 2026-11-02   |
| [`gh-cli`][]              | Interact with GitHub repositories using the GitHub CLI (gh). Covers pull requests, issues, releases, workflow runs, and branch operations.                           | 2026-11-02   |
| [`gh-fix-ci`][]           | Inspects failing GitHub Actions pull request checks with `gh`, summarizes the failure, drafts a fix plan, and implements it after approval.                          | 2026-11-02   |
| [`gh-pr-generator`][]     | Drafts a structured pull request body from the branch diff (pending tasks, manual device checks, and collapsed detail) and opens the pull request with the `gh` CLI. | 2026-11-02   |
| [`gh-pr-reporter`][]      | Fetches every comment on a GitHub pull request (reviews, inline review comments, and general comments) and emits a single consolidated Markdown report.              | 2026-11-02   |

[`gh-address-comments`]: ./gh-address-comments/SKILL.md
[`gh-cli`]: ./gh-cli/SKILL.md
[`gh-fix-ci`]: ./gh-fix-ci/SKILL.md
[`gh-pr-generator`]: ./gh-pr-generator/SKILL.md
[`gh-pr-reporter`]: ./gh-pr-reporter/SKILL.md
