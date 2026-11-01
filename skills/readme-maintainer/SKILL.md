---
name: readme-maintainer
description: Maintain the folder `README.md` files in two mutually exclusive modes, and keep individual skill folders and their subfolders free of README files. The default (flagless) invocation only audits and updates existing READMEs and the two `src/` file trees, and the `--new` flag (or an explicit user request to create new README files) only finds in-scope folders that are missing a `README.md` and creates them. Use after adding new folders, moving files between folders, renaming files, or whenever folder contents change in a way that may make existing READMEs inaccurate.
---

# README maintainer skill

Ensure every top-level support folder in this repository has a `README.md` that accurately indexes its contents, and that the two file trees that document `src/` stay accurate.

This skill enforces the "README.md files" rules in `AGENTS.md`: the support folders carry an index `README.md`, `memory/` uses `MEMORY.md` instead, and `src/` is documented by two file trees rather than by per-folder READMEs.
The trees are "Project structure" in the root `README.md` and "Folder layout" in `docs/architecture.md`.

Individual skill folders under `skills/<skill-name>/`, including all nested folders, must not contain README files.
Use each skill's `SKILL.md` as its entry point and link supporting files directly from it.
Keep [skills/README.md][] as the shared skill catalog.


## Modes

This skill runs in exactly one of two mutually exclusive modes per invocation, never both.

* **Default mode (update-only).**
  Active when the skill is invoked with no arguments.
  It only audits and updates `README.md` files that already exist, plus the two `src/` file trees.
  It does not create new README files, and it does not report or mention folders that are missing a README.
* **New-file mode (`--new`).**
  Active when the skill is invoked with the `--new` flag, or when the user explicitly asks to create new README files.
  It scans all in-scope folders, identifies folders that should have a `README.md` but do not, and creates the missing files.
  It does not audit or edit existing READMEs or the `src/` file trees.

To decide which mode is active, check the invocation and the user request.
When the `--new` flag is present, or the user explicitly requests new READMEs, run in new-file mode; otherwise run in default mode.

Removing a stray README from a skill folder is a correction to what already exists, so it belongs to default mode.
New-file mode never removes a file.


## Scope

In scope:

* The top-level support folders `docs/`, `prompts/`, `scripts/`, and `skills/`.
* The "Project structure" tree in the root `README.md` and the "Folder layout" tree in `docs/architecture.md`, which must each list every file under `src/` (default mode only).

Out of scope (skip these, do not create a README):

* The repository root (`README.md` already exists and is hand-curated); check only its "Project structure" tree.
* `src/` and every folder inside it, which the two file trees document instead.
* `public/`, which holds only static assets that Vite copies into the build.
* `memory/`, whose index is `memory/MEMORY.md`.
  `AGENTS.md` forbids a `README.md` there.
* Individual skill folders at `skills/<skill-name>/` and every folder beneath them, including `scripts/`, `references/`, `assets/`, and `agents/`.
  Check these only for README files that should be removed, never for missing READMEs.
* Dot folders that hold tool configuration only: `.claude/`, `.github/`, `.vscode/`, and any nested folders inside them.
* Folders that are empty or only contain other empty folders (no tracked files anywhere beneath).
* Folders that exist only because of build or cache artifacts (for example `__pycache__/`, `node_modules/`).
* Folders that contain only a single `README.md` and no other tracked content (the README would only describe itself).


## Workflow

1. **Discovery**
   * Run `git ls-files` to list all tracked files.
   * Derive the set of folders that contain at least one tracked file (directly or in a subfolder).
   * In default mode, list any README files inside individual skill folders or their subfolders for removal, within the requested scope.
     Include newly added files when reviewing a skill that is not yet tracked.
   * Filter out the folders listed in "Out of scope" above.

2. **Coverage check** (new-file mode only)
   * Skip this step in default mode.
   * For each in-scope folder, check whether `<folder>/README.md` exists and is tracked by git.
   * Build a list of folders that are missing a README.

3. **Freshness check** (default mode only)
   * Skip this step in new-file mode.
   * For each in-scope folder that already has a README, compare the README against the folder's current contents:
     * List the tracked files and immediate subfolders.
     * Read the README and extract the items it references (filenames, subfolder names, table rows, reference-style links).
     * Flag a README as stale when:
       * The README references files or subfolders that no longer exist.
       * Files or subfolders exist that are not mentioned in the README (when the README is structured as an index of contents).
       * The README's stated purpose contradicts what is actually in the folder.
   * Use `git log -1 --format=%cs -- <folder>/README.md` and `git log -1 --format=%cs -- <folder>` to see whether the folder changed more recently than its README; treat that as a signal to re-read, not as proof of staleness on its own.
   * Compare the "Project structure" tree in the root `README.md` and the "Folder layout" tree in `docs/architecture.md` with `git ls-files src/`, and flag any file that is missing from a tree or listed but gone.

4. **Report**

   Before making changes, present a short plan to the user that matches the active mode, never mixing the two:
   * In default mode, list the stale READMEs and file trees - the files and what looks out of date - plus a one-line summary count of the READMEs that are up to date.
     Do not report or mention folders that are missing a README.
   * In default mode, also list any unnecessary skill READMEs to remove, along with the unique guidance or incoming links to preserve.
   * In new-file mode, list the folders that are missing a README.
     Do not report stale READMEs.

   Ask the user to confirm before writing or editing files when more than a few changes are needed.
   In new-file mode, for a single missing README in a folder the user just touched, proceed directly.

5. **Create, update, or remove**
   * In new-file mode, create a new `README.md` for each missing README, following the style described below.
     Do not edit existing READMEs in this mode.
   * In default mode, edit only the parts of each stale README or file tree that are out of date.
     Do not rewrite the whole file when a targeted edit is enough, and do not create new README files in this mode.
   * In default mode, remove each README found inside an individual skill folder, after moving any useful instructions into that skill's `SKILL.md` or an appropriate supporting reference and updating the incoming links.
   * In either mode, update any index files that link to the affected folder, for example [skills/README.md][] when adding a skill, or `scripts/README.md` when adding a script.

6. **Verify**
   * Re-read every README that was created or edited.
   * Confirm that every file and subfolder reference resolves to a real path.
   * Confirm that no README files remain inside the reviewed skill folders, and that [skills/README.md][] still exists.
   * Run `pnpm lint` to catch markdown and formatting issues.


## README style

Follow the project's writing and markdown rules from `AGENTS.md`.
In particular:

* Use straight quotes, not curly quotes.
* Do not use contractions.
* Use the Oxford comma.
* Use sentence case for headings.
* Use a plain hyphen, never en-dash or em-dash.
* Do not split a sentence across a line break - break only at sentence boundaries so each line contains whole sentences.
* Use `*` for unordered list items, with 2-space indentation for nested lists.
* Leave 2 blank lines above headings and 1 blank line below.
* Prefer reference-style links collected at the bottom of the file.


### Suggested structure

```markdown
# <Folder name in sentence case>

<One or two sentence description of what this folder contains and its purpose.>

## Contents

- [item-1](item-1) - <one-line description>
- [item-2](item-2) - <one-line description>
```

For folders that act as an index of many siblings (for example `skills/` or `scripts/`), use a markdown table with `Name` and `Description` columns, matching the existing convention in [skills/README.md][] and `scripts/README.md`.

For other in-scope folders whose contents are tightly themed, a short prose paragraph plus a bullet list is enough.


## Edge cases

* **Renamed file or folder** - update the folder's own README when it is in scope, and any other READMEs or docs that link to the old path.
  The rule under "File and folder naming" in `AGENTS.md` requires updating every reference.
* **Folder added but not yet populated** - if the folder is tracked because of a `.gitkeep` only, skip it.
* **Folder with sensitive or generated content** - describe the purpose without listing individual files when listing them would be noisy or could leak data.
* **Conflicting prior README** - if a README looks intentionally minimal (for example a top-level folder that defers to a child index), preserve that style; do not expand it without reason.
* **Index folder with many entries** - keep entries sorted alphabetically unless the existing file uses a deliberate grouping (for example `skills/README.md` groups by category); preserve the existing grouping.


## Constraints

* Do not create READMEs for folders listed in "Out of scope".
* Do not retain README files inside individual skill folders or their subfolders within the requested scope.
  This prohibition does not apply to the shared [skills/README.md][] catalog.
* Do not rewrite a README that is already accurate just to change its style.
* Do not invent descriptions for files that have not been read; open the file first.
* Do not add a table of contents to a README that is short enough to scan at a glance.

[skills/README.md]: ../README.md
