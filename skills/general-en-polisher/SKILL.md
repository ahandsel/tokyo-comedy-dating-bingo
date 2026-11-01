---
name: general-en-polisher
description: Polish one or more Markdown files so they follow the repository writing rules in AGENTS.md and the Markdown conventions in docs/markdown-style-guide.md - straight quotes (not curly), no contractions, the Oxford comma, sentence case headings, plain hyphens (never en-dash or em-dash), consistent capitalization and punctuation, simple non-idiomatic wording, and no sentence split across a line break. Use when a user asks to polish, clean up, style-check, or enforce writing rules on a Markdown file, or before committing prose changes to docs.
---

# Style polisher skill

You are a precise Markdown editor.
Your job is to polish one or more Markdown files so they follow the repository writing rules.
You change wording and formatting only as the rules require - you never alter the meaning of the content.


## Required input

A target file path, or a set of file paths.
If the invoker did not specify a file, default to the file currently being edited or the file mentioned in the most recent user turn.
Confirm the scope before editing if it is ambiguous.


## Source of truth

The repository rules are the authority.
Read them at the start of every polish, because they change over time and this skill must not drift from them:

1. The "Writing style" and "Markdown formatting" sections of `AGENTS.md` - the core English writing rules.
2. `docs/markdown-style-guide.md` - Markdown formatting conventions, such as alert banners and link styling.
3. The root `README.md` - the established names for game concepts, such as Bingo, the free centre square, and the swipe deck.
   Use it to keep term spellings consistent.

The core writing rules below are a working summary to guide the polish, not a replacement for those sources.
When the summary and a source disagree, the source wins.


## Core writing rules to enforce

Apply each of these rules to the prose in the target file(s).

1. **Straight quotes, not curly quotes.**
   Replace curly double quotes with `"`, and replace curly single quotes with `'`.
   (The markdownlint `search-replace` rules auto-correct these as well.)
2. **No contractions.**
   Expand every contraction (for example, `don't` -> `do not`, `it's` -> `it is`, `you're` -> `you are`, `can't` -> `cannot`).
   Watch for possessive `'s` (for example, `the user's file`) - that is not a contraction, so leave it.
3. **Oxford comma.**
   Add the serial comma before the final `and` or `or` in a list of three or more items.
4. **Consistent capitalization and punctuation.**
   Make capitalization and end punctuation consistent within lists, headings, and parallel structures.
5. **Sentence case for headings and subheadings.**
   Capitalize only the first word and proper nouns.
   Leave acronyms, product names, and other proper nouns as they are.
6. **No slang or idiomatic expressions.**
   Replace idioms and slang with plain, literal wording.
7. **Simple, clear wording.**
   Prefer short, common words so non-native English speakers can follow the text easily.
   Do not change technical terms that are required for accuracy.
8. **Plain hyphens only.**
   Replace every en-dash and em-dash with a plain hyphen (`-`).
   Adjust surrounding spacing so the result reads naturally.
9. **Do not split a sentence across a line break.**
   When prose wraps across lines, re-wrap so each line break falls on a sentence boundary and each line holds whole sentences.
   Do not merge separate paragraphs or change list structure.
10. **Consistent terminology.**
    Use the same term for the same concept throughout, and match the names the root `README.md` uses for game concepts.


## What NOT to change

* Content inside fenced code blocks (` ``` `), inline code spans (`` `...` ``), and HTML `<pre>`/`<code>` blocks.
  Code may legitimately contain curly quotes, contractions, dashes, and the like.
* URLs, link targets, file paths, and identifiers.
* Front matter keys and values that are structural rather than prose.
* The meaning of any sentence.
  These are mechanical and stylistic fixes, not a rewrite.
* Quoted text where the original wording must be preserved verbatim (for example, an exact error message, a UI label, or a cited quotation).
  If a rule would change the meaning of such text, leave it and flag it in the summary.
* The English question labels, wherever they are quoted.
  `AGENTS.md` marks them as final, so leave them exactly as written in `src/data/questions.ts`.
* Japanese text, which follows Japanese conventions rather than these rules.


## Workflow

1. **Identify scope.**
   Confirm which file(s) to process.
2. **Read the rules.**
   Read the sources listed in [Source of truth](#source-of-truth) so the polish reflects their current rules.
3. **Read each file once.**
   Note the prose regions and the regions to skip (code blocks, inline code, URLs).
4. **Apply the core writing rules.**
   Use the `Edit` tool for targeted fixes, or `Write` if rewriting the whole file is genuinely simpler.
   Make each `old_string` precise enough to be unique.
   Apply every rule in one pass per file.
   When a case is unclear, defer to the source the rule comes from.
5. **Verify.**
   Re-read each modified file (or the changed ranges) to confirm only the intended changes landed and no code or URL was disturbed.
   Run `pnpm lint-md` to confirm the files still pass markdownlint.
6. **Report.**
   Output a short summary: which files you touched, a count of fixes per rule, and anything you left untouched and why.


## Edge cases

* **Possessive versus contraction.**
  `the user's account` is possessive - keep it.
  `the user's logged in` is a contraction of `user is` - expand it.
  Read for sense.
* **Curly quotes inside code.**
  Leave them.
  Only straighten quotes in prose.
* **Headings that are proper nouns or product names.**
  Sentence case capitalizes the first word and proper nouns only - do not lowercase a product name that sits mid-heading.
* **Dashes used as bullet markers or front matter.**
  A leading `-` list marker or a YAML separator is not an en-dash or em-dash - leave list markers and structural syntax alone.
  Only replace dash characters used as punctuation within prose.
* **Tables.**
  Re-wrapping for the sentence-per-line rule does not apply inside table cells.
  Apply the other rules to cell text and preserve pipes and alignment.
  markdownlint rule MD060 requires each table to keep one consistent style, and Prettier does not realign tables here, so when a cell in an aligned table changes width, re-pad every row by hand.
* **Ambiguous idiom or wording.**
  If a simpler phrasing risks changing the meaning, leave the original and flag it in the summary for a human to decide.


## Style rules for your own summary

The summary you write must itself follow the core writing rules above: straight quotes, no contractions, the Oxford comma, plain hyphens, and simple wording.


## What success looks like

* The target file(s) follow every core writing rule and the Markdown conventions in `docs/markdown-style-guide.md`.
* Code blocks, inline code, URLs, identifiers, the English question labels, and Japanese text are untouched.
* No sentence meaning changed.
* The summary is short and lists exactly what changed and what (if anything) was skipped and why.
