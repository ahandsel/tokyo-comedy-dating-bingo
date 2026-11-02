# Prettier formats Markdown before markdownlint

* Type: Tooling
* Added: 2026-11-02
* Source: a 2026-11-02 Claude Code session that repaired Markdown files garbled by overlapping lint runs; the owner chose this over adding `*.md` to `.prettierignore`

The owner removed `prettier-plugin-autocorrect` on purpose, and its Markdown parser had kept Prettier from reformatting Markdown.
Now `pnpm lint` runs Prettier on every Markdown file first and `markdownlint-cli2 --fix` second, and the owner wants that order.
Prettier aligns table columns and formats fenced code, so it adds semicolons to TypeScript examples and changes `*` to `-` inside a `markdown` code block.
markdownlint changes list markers back to `*` and restores the two blank lines above headings, but it does not touch code blocks.

The vendored skills under `skills/gh-address-comments/`, `skills/gh-fix-ci/`, `skills/security-best-practices/`, and `skills/security-threat-model/` are listed in `.prettierignore`, as they are in the `ignores` of `.markdownlint-cli2.jsonc`, so that they stay identical to upstream.

How to apply:

* Do not propose adding `*.md` to `.prettierignore` again; treat Prettier's table and code-block formatting in Markdown as intended.
* When you add another vendored skill, list it in both `.prettierignore` and `.markdownlint-cli2.jsonc`.
* Two lint runs rewrite every Markdown file twice, so they must never overlap; see [Never let two lint hook runs overlap](tooling-lint-hook-runs-must-not-overlap.md).
