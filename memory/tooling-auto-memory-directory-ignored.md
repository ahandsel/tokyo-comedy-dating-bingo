# Auto memory ignores the checked-in memory folder setting

* Type: Tooling
* Added: 2026-11-02
* Source: a 2026-11-02 Claude Code session (CLI 2.1.308) that audited `AGENTS.md`; the settings schema text bundled in the CLI; see also [the nodenv memory](tooling-nodenv-pnpm-per-version.md), which was migrated by hand from the user-level folder

`.claude/settings.json` sets `autoMemoryDirectory` to `./memory`, but that setting has no effect there.
The settings schema in the CLI describes the key as "Ignored if set in projectSettings (checked-in .claude/settings.json) for security."
The 2026-11-02 session therefore pointed its auto memory at `~/.claude/projects/<project-slug>/memory/`, and the two earlier memories in this folder started there and were moved here by hand.

The same session added the key to the owner's `.claude/settings.local.json` with this folder's absolute path.
That file is user-owned and ignored by git, so the restriction should not apply, but no session has confirmed it yet.

How to apply: at the start of a session, check the memory path in the system prompt.
When it points at this folder, the local setting works, so update this memory to say so.
When it still points elsewhere, write memories here by hand in the format that [MEMORY.md](MEMORY.md) describes.
