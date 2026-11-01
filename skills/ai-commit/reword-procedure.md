# Reword procedure

Reword operations are applied by [`apply-commit.mjs`][].
Do not run manual `git rebase -i` or `GIT_SEQUENCE_EDITOR` commands.


## Prerequisite checks

The gather payload and the apply script run the same checks before any reword:

* The commit exists and is reachable from `HEAD`.
* The commit is not a merge commit.
* No merge commits exist between the commit and `HEAD`.
* No rebase is already in progress.
* The working tree and index are clean.

If any check fails, stop and report it.


## Failure handling

When a reword rebase fails, `apply-commit.mjs` aborts that rebase automatically and reports the failure.
The rebase forces full `pick` commands, so an abbreviated todo cannot skip the reword.
After a successful rebase, it verifies that the branch tree and commit count are unchanged and that the target subject matches the message file.

`--reword-unpushed` reads and validates every message file before the first rebase, so a missing, invalid, or mistyped file rewrites nothing.
Each commit is reworded by its own rebase, so a failure on a later commit leaves the earlier ones reworded.
The error then names how many commits were already reworded and the branch tip before the batch.
If the branch still looks wrong after a reported failure, inspect `git reflog` to recover.

[`apply-commit.mjs`]: scripts/apply-commit.mjs
