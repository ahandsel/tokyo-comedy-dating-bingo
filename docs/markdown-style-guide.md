# Markdown style guide

This document describes how Markdown documents in this repository should be formatted.
The English writing rules, including one sentence per source line, live in the "Writing style" and "One sentence per line" sections of [AGENTS.md](../AGENTS.md).


## Table of contents <!-- omit in toc -->

* [Linter rules](#linter-rules)
  * [Enabled and customized rules](#enabled-and-customized-rules)
  * [Disabled rules](#disabled-rules)
  * [Search and replace rules](#search-and-replace-rules)
  * [Custom rules](#custom-rules)
  * [Ignored files](#ignored-files)
* [What Prettier does to Markdown](#what-prettier-does-to-markdown)
* [Alerts for important notes](#alerts-for-important-notes)
* [Link style](#link-style)


## Linter rules

These rules are enforced by [markdownlint-cli2](https://github.com/DavidAnson/markdownlint-cli2) and configured in [.markdownlint-cli2.jsonc](../.markdownlint-cli2.jsonc).
Run `pnpm lint` (or `pnpm lint-md` for Markdown only) to format and auto-fix files, and run `pnpm check` before every commit.


### Enabled and customized rules

| Rule  | Setting                                         | What it means                                                                                                                                                                               |
| ----- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MD004 | `style: asterisk`                               | Use `*` for unordered list items, never `-` or `+`.                                                                                                                                         |
| MD007 | `indent: 2`                                     | Indent nested unordered lists by 2 spaces.                                                                                                                                                  |
| MD009 | `br_spaces: 2`                                  | Trailing whitespace is not allowed, except exactly 2 trailing spaces to force a line break.                                                                                                 |
| MD012 | `maximum: 2`                                    | Allow at most 2 consecutive blank lines.                                                                                                                                                    |
| MD022 | `lines_above: 2, lines_below: 1`                | Leave 2 blank lines above every heading and 1 blank line below.                                                                                                                             |
| MD025 | `front_matter_title`                            | Only one top-level (H1) heading per document; a front matter `title` counts as the H1.                                                                                                      |
| MD029 | `style: ordered`                                | Number ordered list items sequentially (1, 2, 3, ...).                                                                                                                                      |
| MD031 | `blanks-around-fences: true`                    | Surround fenced code blocks with blank lines.                                                                                                                                               |
| MD033 | `allowed_elements: br, pre, script, ul, li, ol` | Inline HTML is restricted to `<br>`, `<pre>`, `<script>`, `<ul>`, `<li>`, and `<ol>`.                                                                                                       |
| MD060 | Default (`style: any`)                          | Keep each table in one style: either every pipe aligned, or every cell compact. When a cell in an aligned table changes width, re-pad every row by hand, because MD060 is not auto-fixable. |


### Disabled rules

These default rules are turned off, so they are not enforced:

| Rule  | What it would check                                                                              |
| ----- | ------------------------------------------------------------------------------------------------ |
| MD013 | Line length limit. Long lines are allowed; do not split a single sentence across multiple lines. |
| MD014 | Dollar signs before shell commands without showing output.                                       |
| MD024 | Duplicate heading text. Repeated headings are allowed.                                           |
| MD026 | Trailing punctuation in headings.                                                                |
| MD032 | Blank lines around lists.                                                                        |
| MD036 | Emphasis used in place of a heading.                                                             |


### Search and replace rules

The custom `search-replace` rule auto-corrects these characters on lint.
Characters are listed by Unicode code point because the literal characters are auto-replaced in this document too.

| Character                    | Code point         | Replaced with               | Reason                           |
| ---------------------------- | ------------------ | --------------------------- | -------------------------------- |
| Curly double quotes          | `U+201C`, `U+201D` | Straight double quote (`"`) | Use straight quotes only.        |
| Curly single quotes          | `U+2018`, `U+2019` | Straight single quote (`'`) | Use straight quotes only.        |
| Em dash                      | `U+2014`           | Hyphen (`-`)                | Never use em dashes.             |
| En dash                      | `U+2013`           | Hyphen (`-`)                | Never use en dashes.             |
| Non-breaking space           | `U+00A0`           | Regular space               | Use regular spaces only.         |
| Object replacement character | `U+FFFC`           | Regular space               | Stray character from copy-paste. |


### Custom rules

* `markdownlint-rule-search-replace` powers the search and replace corrections above.
* `markdownlint-rule-relative-links` verifies that relative links point to files that exist.


### Ignored files

The `ignores` list in `.markdownlint-cli2.jsonc` skips these paths:

* `skills/gh-address-comments/`, `skills/gh-fix-ci/`, `skills/security-best-practices/`, and `skills/security-threat-model/` - vendored third-party skills, kept unchanged so they can be re-synced with upstream.
* `.claude/commands/` and `.claude/skills/` - symlinks to `prompts/` and `skills/`, which are linted directly.
  Linting a file through both paths runs two `--fix` passes on it at once, and that corrupts the file.


## What Prettier does to Markdown

`pnpm lint` runs Prettier before markdownlint, but `prettier-plugin-autocorrect` owns the Markdown parser in this repository.
As a result, Prettier does not reflow paragraphs or realign tables in Markdown.

It does insert spaces between Japanese text and Latin letters or digits in prose, so `24問中8問目` written as plain text becomes `24 問中 8 問目`.
Inline code spans and fenced code blocks are left alone.
When a document quotes Japanese UI copy that must stay exact, put it in an inline code span.


## Alerts for important notes

GitHub renders these alert blockquotes with a colored label:

```md
> [!NOTE]
> Useful information that readers should know, even when skimming.

> [!TIP]
> Optional advice, such as a best practice or a shortcut.

> [!IMPORTANT]
> Information that readers need to succeed.

> [!WARNING]
> Urgent information that needs immediate attention to avoid problems.

> [!CAUTION]
> A warning about risks or negative outcomes, such as data loss.
```

Rules on alert usage:

* Keep the `> [!TYPE]` marker alone on the first line; GitHub does not render an alert when text follows the marker on the same line.
* Start every following line with `>`, including each new sentence.
* Use alerts sparingly, at most one or two per document, and do not place two alerts next to each other.


## Link style

* Use inline links in prose documents, such as the root `README.md` and the pages under `docs/`.
* Index files that list many entries, such as `skills/README.md`, `scripts/README.md`, and `prompts/README.md`, may collect reference-style link definitions at the end of the file instead.
  Keep those definitions sorted alphabetically.
* Use relative links for files in this repository, so they work on GitHub and in an editor.
  `markdownlint-rule-relative-links` reports a relative link whose target does not exist.
