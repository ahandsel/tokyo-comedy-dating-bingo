# Memory index

This folder contains durable notes for AI agents working in this repository.
[AGENTS.md](../AGENTS.md), the [README](../README.md), and the pages under `docs/` define the rules and explain the code.
The memory files supplement them with non-obvious facts, decisions, and open questions from earlier sessions.


## How to use these memories

* Review this index before starting a task, then open only the memory files relevant to that task.
* Follow confirmed decisions and facts unless a more authoritative or newer repository source contradicts them.
* Treat open questions as unresolved.
  Do not assume an answer or present one as confirmed.
* If a memory conflicts with `AGENTS.md`, the README, a page under `docs/`, or the current code, follow the authoritative source and update or remove the outdated memory.


## Maintenance rules

* Create a memory only for a non-obvious fact, decision, or open question that future sessions will need and that is not already recorded in `AGENTS.md`, the README, a page under `docs/`, or the git history.
* Keep one subject in each memory file.
* Start each file with a title heading, followed by `Type`, `Added`, and `Source` list items and a short, actionable explanation.
* Use an ISO 8601 date in the `Added` item, such as `2026-11-02`.
* Make the `Source` item specific.
  Name the relevant file, pull request, session, or other authoritative source.
* Link related memories with relative Markdown links.
* Add every new memory to the contents section below with a concise description.
* Keep the contents section and this folder in sync.
  When they disagree, write the missing memory file or delete the stale entry.
* Update or delete a memory when it becomes incorrect or moves to an authoritative repository source.
  Update or delete its contents entry at the same time.
* An auto memory that Claude saves on its own arrives with YAML frontmatter and without the `Type`, `Added`, and `Source` items.
  Rewrite it into the format above and give it a category prefix the next time you touch it.
* The repository is private, but everything in this folder is tracked by git, so never store secrets, credentials, or personal details.

Name each memory file with a kebab-case slug that starts with one of these category prefixes:

* `auditing-`: Instructions for agents that review or verify content.
* `styling-`: Decisions about how to write or format repository content.
* `tooling-`: Decisions about repository configuration, automation, and developer tooling.
* `wording-`: Terminology choices and guidance about how to phrase repository content.


## Contents

* [Auto memory ignores the checked-in memory folder setting](tooling-auto-memory-directory-ignored.md) - Claude Code ignores `autoMemoryDirectory` in `.claude/settings.json`, so the key now also lives in the owner's `.claude/settings.local.json`, which is not yet confirmed to work.
* [Install pnpm under each nodenv Node version](tooling-nodenv-pnpm-per-version.md) - After bumping `.node-version`, install pnpm for the new Node version, or every `pnpm` call fails with `command not found`.
* [Real-browser smoke tests drive headless Chrome over CDP](tooling-browser-smoke-test-via-cdp.md) - No Playwright is installed, so drive the local Google Chrome over the DevTools Protocol and force reduced motion off first.
* [Never let two lint hook runs overlap](tooling-lint-hook-runs-must-not-overlap.md) - Overlapping `pnpm lint` hook runs garble Markdown files, so send Write and Edit calls one at a time and make sure no other session is editing.
* [Prettier formats Markdown before markdownlint](tooling-prettier-formats-markdown-first.md) - The owner wants `pnpm lint` to run Prettier on Markdown before markdownlint, so do not add `*.md` to `.prettierignore`; only the vendored skills are excluded.
* [Keep the nationality cards ambiguous in Japanese](wording-nationality-cards-stay-ambiguous.md) - `q25` and `q26` do not say who judged whom, so Japanese refinements must not add a subject or a speaker.
* [The owner reworded the q13 and q17 English labels](wording-owner-reworded-q13-and-q17.md) - "Visited a military base" and "Experienced 告白 (kokuhaku)" are canonical, although `start-prompt.prompt.md` still lists the old wording.
