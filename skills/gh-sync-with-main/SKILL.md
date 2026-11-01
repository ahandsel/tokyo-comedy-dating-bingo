---
name: gh-sync-with-main
description: Bring the current git branch up to date with commits from the main branch, or check whether it needs syncing without changing it. Use when the user asks to pull latest main, sync/refresh the branch, rebase onto main, merge main into a feature branch, or verify how far the branch is ahead of or behind main.
---

# GitHub sync with main branch skill


## Overview

Update the checked out branch from `main` with a small helper script instead of rebuilding the git sequence from scratch.
Prefer rebase for a clean linear history, and switch to merge only when the user or repository workflow requires it.
Pass `--verify` for a read-only check that reports how far the branch is ahead of or behind `main`, previews conflicts, and recommends a strategy without changing anything.

Every run ends with a `👉 Next command` block naming the exact command to run next.
Relay that block to the user; it may recommend a push, inspection of upstream work, or no further action.


## Workflow

1. Confirm the repository state first.
   * Run `git status --short`.
   * Run `git branch --show-current`.
   * Stop if the user is already on `main`.
2. Choose the update strategy.
   * Default to `rebase`.
   * Use `merge` when the user explicitly asks to merge, the branch is already shared and history should not be rewritten, or the repository conventions prefer merge commits.
3. Run the helper script.

   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/update-branch-from-main.mjs"
   ```

4. Add flags only when needed.

   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/update-branch-from-main.mjs" --strategy merge
   node "${CLAUDE_SKILL_DIR}/scripts/update-branch-from-main.mjs" --base-branch main --remote origin
   node "${CLAUDE_SKILL_DIR}/scripts/update-branch-from-main.mjs" --allow-dirty
   ```

5. Tell the user the next command before ending the turn.
   * Quote the script's `👉 Next command` block in the reply as a copy-pasteable code block, so the user can run it without retyping it.
   * Never end on the success line alone.
     State the follow-up even when the answer is that there is nothing to push.
   * Do not run the push yourself unless the user asks for it.
     Offer it, and let the user decide.


## Next command

The script fetches the configured upstream destination before syncing and records its tip and the local HEAD.
It recommends a force push only when this run rebased a branch that already contained that upstream tip and the rebase rewrote history.
Existing divergence, including during `--verify`, requires reviewing and integrating upstream work.
Push commands target the configured upstream branch even when its name differs from the local branch.
The one exception is an upstream that is the base branch itself, which a branch created from `origin/main` gets by default.
Pushing to that upstream would put the branch's commits on `main`, so the script publishes the branch under its own name with `-u` instead.

| Situation after the run                                           | Next command                                                                                    |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| This run safely rewrote history with a rebase                     | `git push --force-with-lease=refs/heads/upstream-name:OID origin HEAD:refs/heads/upstream-name` |
| Upstream commits are missing without a proven rewrite by this run | Inspect the displayed commit range and integrate upstream work                                  |
| The branch is ahead of its upstream and has not diverged          | `git push origin HEAD:refs/heads/upstream-name`                                                 |
| The branch has no upstream yet                                    | `git push -u origin my-feature-branch`                                                          |
| The branch tracks the base branch, such as `origin/main`          | `git push -u origin my-feature-branch`                                                          |
| The branch already matches its upstream                           | None, there is nothing to push                                                                  |
| The rebase stopped on conflicts                                   | `git add` the resolved files, then `git rebase --continue`                                      |
| The merge stopped on conflicts                                    | `git add` the resolved files, then `git commit`                                                 |
| Refused because the working tree is dirty                         | `git stash push -m "wip"`, rerun the script, then `git stash pop`                               |
| Refused because `main` is checked out                             | `git switch my-feature-branch`, then rerun the script                                           |
| `--verify` reported the branch behind                             | Rerun the same command without `--verify`                                                       |

The explicit lease uses the upstream object ID captured before this run's rebase.
A later upstream update causes the push to fail, even if a background fetch has refreshed the tracking ref.
Do not replace the explicit lease with an unqualified force option.


## Verify mode

When the user only wants to know whether the branch needs syncing, run the script with `--verify` instead of syncing.
This mode fetches the base branch and, when assessing a possible push, the configured upstream.
It updates fetched objects and tracking refs without rebasing, merging, or changing the branch or working tree.

```bash
node "${CLAUDE_SKILL_DIR}/scripts/update-branch-from-main.mjs" --verify
node "${CLAUDE_SKILL_DIR}/scripts/update-branch-from-main.mjs" --verify --strategy merge
```

The report includes the branch name, the base ref, the working tree state, the ahead and behind commit counts, a conflict preview, and a recommendation.

* The recommendation is one of `up to date`, `sync recommended (rebase)`, or `sync recommended (merge)`, and it notes `resolve conflicts manually` when the conflict preview is `likely`.
* The `--strategy` flag selects which strategy the recommendation names; it defaults to `rebase`.
* The conflict preview uses `git merge-tree` and needs git 2.38 or newer.
  On older git it reports `unknown`.
* Verify exits `0` once the assessment completes, whatever it recommends, so the exit code does not signal whether a sync is needed.
  Read the recommendation from the output.
* The next command is the sync command when the branch is behind the base.
  When it is current, the script checks the upstream before recommending a normal push, an inspection, or no action.


## Conflict handling

If git reports conflicts, stop normal automation and guide the user through resolution.
The script prints these same steps in its `👉 Next command` block, so relay them rather than paraphrasing them.

* For rebase conflicts: resolve files, `git add <files>`, then `git rebase --continue`.
  A rebase replays commits one at a time, so it can stop more than once.
* For merge conflicts: resolve files, `git add <files>`, then `git commit`.
* If the user wants to cancel: `git rebase --abort` or `git merge --abort`.


## Guardrails

* Refuse to run on `main`.
  This applies to `--verify` as well, because there is nothing to compare against.
* Refuse to run with a dirty working tree unless the user explicitly accepts `--allow-dirty`.
  Note that `--allow-dirty` pairs best with `merge`, because `git rebase` still refuses to run with unstaged changes even after the script's own clean-tree check is bypassed.
  The dirty-tree refusal does not apply to `--verify`, which never changes the working tree.
* Fetch `origin/main` before changing history.
* Prefer `origin/main` over a stale local `main`.
* Show the exact git commands before execution so the user can see the plan.
* Use `--verify` when the user asks only to check the branch.
  It never rebases, merges, or edits the branch or working tree.
* Always hand the user the next command.
  Ending a sync turn without it leaves the branch synced locally and stale on the remote.
* Never force push on the user's behalf without being asked.
  It rewrites a branch other people may have pulled.


## Script behavior

The helper script:

* verifies the current branch is not the base branch
* checks whether the working tree is clean unless `--allow-dirty` is passed
* fetches the chosen base branch and the configured upstream destination before syncing
* rebases onto `origin/main` by default, or merges `origin/main` when requested
* exits immediately on the first git failure and leaves the repository in git's native conflict state for manual resolution
* with `--verify`, fetches the base branch and then reports the ahead and behind counts, a `git merge-tree` conflict preview, and a recommendation, without rebasing, merging, or changing the branch or working tree
* ends every run - success, conflict, or refusal - with a `👉 Next command` block, choosing the push destination from the tracking configuration, never advising a push onto the base branch, and limiting force-push advice to a proven rewrite by this run
