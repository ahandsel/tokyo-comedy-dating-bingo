# Install pnpm under each nodenv Node version

* Type: Tooling
* Added: 2026-11-01
* Source: a 2026-11-01 Claude Code session; migrated from the user-level auto memory folder on 2026-11-02; see also [docs/development.md](../docs/development.md)

On the owner's machine, Node comes from nodenv (`~/.nodenv`).
`pnpm` is a nodenv shim that resolves to a pnpm installed separately for each Node version with `npm install -g pnpm@<version>`, not through Corepack or Homebrew.
That bootstrap is the one place `npm` is used.
`.node-version` pins Node 24.22.2 and the `packageManager` field in `package.json` pins pnpm 12.16.1, and both are installed for that Node version.

Why it matters: after `.node-version` changes, every `pnpm` call fails with `nodenv: pnpm: command not found` until pnpm is installed under the new Node version.
pnpm 10 and newer then switches to the `packageManager` version on its own, so only the first pnpm on the PATH needs to exist.

How to apply: after bumping `.node-version`, run `nodenv install <version>`, `npm install -g pnpm@<pinned-version>`, and `nodenv rehash` before running any pnpm script.
Keep `@types/node` on the 24.x line to match the pinned runtime.
