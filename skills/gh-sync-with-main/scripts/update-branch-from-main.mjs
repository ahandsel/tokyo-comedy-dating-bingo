#!/usr/bin/env node

// update-branch-from-main.mjs notes
// General notes:
// * Purpose: Bring the current git branch up to date with a base branch (default `main`) using rebase by default, or merge when requested.
//   Used by the gh-sync-with-main skill.
// * Refuses to run while checked out on the base branch and refuses a dirty working tree unless --allow-dirty is passed.
// * Fetches the base branch from the remote first, then rebases or merges onto the remote-tracking ref (e.g. origin/main), and exits on the first git failure.
//   A rebase or merge that stops mid-way leaves git's conflict state for manual resolution.
//   A failure before that state exists leaves no conflict in progress.
// * With --verify, runs a read-only assessment instead: it fetches the base branch (updating the remote-tracking ref only), reports the ahead and behind commit counts, previews conflicts, and prints a recommendation.
//   It never rebases, merges, or changes the branch or working tree.
// * Every exit path ends with a "Next command" block that names the exact command to run next, so no one has to work the follow-up step out.
//   After a successful sync that is the push the branch now needs, chosen from the real divergence between the branch and its upstream rather than assumed.
// Usage:
//   node skills/gh-sync-with-main/scripts/update-branch-from-main.mjs
//   node skills/gh-sync-with-main/scripts/update-branch-from-main.mjs --strategy merge
//   node skills/gh-sync-with-main/scripts/update-branch-from-main.mjs --base-branch main --remote origin
//   node skills/gh-sync-with-main/scripts/update-branch-from-main.mjs --allow-dirty
//   node skills/gh-sync-with-main/scripts/update-branch-from-main.mjs --verify
// Options:
//   --base-branch <name>  Base branch to sync from. Defaults to main.
//   --remote <name>       Remote to fetch from. Defaults to origin.
//   --strategy <mode>     Update strategy: rebase or merge. Defaults to rebase.
//                         In --verify mode this selects the recommended strategy.
//   --allow-dirty         Allow updating even if the working tree has local changes.
//   --verify              Read-only assessment. Report ahead and behind counts,
//                         a conflict preview, and a recommendation without
//                         rebasing, merging, or changing the branch.
//   --help, -h            Show this message.
// Output:
// * Sync mode: prints the planned git commands, then runs them, then a final status line, then the "Next command" block.
// * Verify mode: prints the fetch plan, then a read-only assessment (branch, base, working tree, ahead and behind counts, conflict preview, and a recommendation), then a final status line, then the "Next command" block.
// * Refusals and git failures also print a "Next command" block naming how to get unstuck (resolve conflicts, continue, or abort).
// * Status emojis: ✅ success or up to date, ⚠️ refusal or sync recommended, ❌ git command failure, 👉 the next command to run.
// * Exit codes: 0 success (including a completed --verify assessment, whatever it recommends), 1 refusal (on base branch, dirty tree, no branch), 2 invalid arguments, or the failing git command's exit code.
// Version history:
// * v1.6 - 2026-11-02 - Replace this repo's earlier v1.1, which only reformatted comments, with the upstream v1.1 to v1.5 (the --verify mode and the "Next command" block), and reformat the comments to one sentence per line again.
// * v1.5 - 2026-10-30 - Advise git push -u to the branch's own name when its upstream is the base branch, instead of a push that would update the base branch.
// * v1.4 - 2026-10-29 - Print conflict recovery only when a rebase or merge is in progress.
// * v1.3 - 2026-09-17 - Verify the upstream before sync, limit force-push advice to proven local rewrites, and push to the configured destination with an explicit lease.
// * v1.2 - 2026-08-20 - Always end with a "Next command" block.
//   After a sync it names the push the branch needs (--force-with-lease after a history rewrite, plain push when fast-forwardable, -u when there is no upstream); on conflicts and refusals it names the recovery steps.
// * v1.1 - 2026-07-14 - Add --verify read-only assessment mode (ahead and behind counts, merge-tree conflict preview, and a recommendation) with no changes.
// * v1.0 - 2026-06-08 - Initial release.
//   Port of update_branch_from_main.py to a Node.js ES module.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

function printUsage() {
  console.log(`Usage: node update-branch-from-main.mjs [options]

Bring the current git branch up to date with a base branch. Rebases by default
for a clean linear history; use --strategy merge when history should not be
rewritten. Use --verify for a read-only check that reports the sync status
without changing anything.

Every run ends with a "Next command" block naming the exact command to run
next, whether the run succeeded, hit conflicts, or was refused.

Options:
  --base-branch <name>  Base branch to sync from. Defaults to main.
  --remote <name>       Remote to fetch from. Defaults to origin.
  --strategy <mode>     Update strategy: rebase or merge. Defaults to rebase.
                        In --verify mode this selects the recommended strategy.
  --allow-dirty         Allow updating even if the working tree has local
                        changes. Ignored in --verify mode.
  --verify              Read-only assessment. Fetch the base branch, then report
                        the ahead and behind counts, a conflict preview, and a
                        recommendation without rebasing, merging, or changing
                        the branch or working tree.
  --help, -h            Show this message.

Exit codes:
  0  Success, including a completed --verify assessment whatever it recommends.
  1  Refusal (checked out on the base branch, dirty working tree, or the
     current branch could not be determined).
  2  Invalid arguments.
  *  The failing git command's exit code on a git error.
`);
}

// Print the trailing "Next command" block.
// Every exit path calls this so the reader is never left guessing at the follow-up step.
// `step` is either null (nothing left to run) or { lines, why }, where `lines` are pre-rendered and printed as-is.
// Failures print to stderr so the block stays ordered with the error message when either stream is redirected.
function printNextCommand(step, { toStderr = false } = {}) {
  const write = toStderr ? console.error : console.log;

  write('');
  if (!step) {
    write('👉 Next command: none.');
    return;
  }
  if (step.lines.length === 0) {
    write(`👉 Next command: none. ${step.why}`);
    return;
  }

  write(
    step.lines.length > 1
      ? '👉 Next commands to run:'
      : '👉 Next command to run:',
  );
  for (const line of step.lines) {
    write(`   ${line}`);
  }
  if (step.why) {
    write('');
    write(`   Why: ${step.why}`);
  }
}

function fail(code, message, step) {
  console.error(message);
  if (step !== undefined) {
    printNextCommand(step, { toStderr: true });
  }
  process.exit(code);
}

// Run git and capture its output.
// Used for read-only inspection commands.
function git(args) {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  if (result.error) {
    fail(1, `❌ Failed to run git: ${result.error.message}`);
  }
  return result;
}

function parseArgs(argv) {
  const options = {
    baseBranch: 'main',
    remote: 'origin',
    strategy: 'rebase',
    allowDirty: false,
    verify: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
        break;
      case '--base-branch':
        options.baseBranch = argv[++i];
        if (!options.baseBranch) fail(2, '❌ --base-branch requires a value.');
        break;
      case '--remote':
        options.remote = argv[++i];
        if (!options.remote) fail(2, '❌ --remote requires a value.');
        break;
      case '--strategy':
        options.strategy = argv[++i];
        if (options.strategy !== 'rebase' && options.strategy !== 'merge') {
          fail(2, '❌ --strategy must be "rebase" or "merge".');
        }
        break;
      case '--allow-dirty':
        options.allowDirty = true;
        break;
      case '--verify':
        options.verify = true;
        break;
      default:
        fail(2, `❌ Unknown argument: ${arg}. Run with --help for usage.`);
    }
  }

  return options;
}

function ensureGitRepo() {
  const result = git(['rev-parse', '--show-toplevel']);
  if (result.status !== 0) {
    fail(1, '❌ Not inside a git repository.');
  }
}

function currentBranch() {
  return git(['branch', '--show-current']).stdout.trim();
}

function isWorktreeClean() {
  return git(['status', '--short']).stdout.trim() === '';
}

function dirtyTreeStep() {
  return {
    lines: [
      '1. git stash push -m "wip"         (set the local changes aside)',
      `2. ${selfCommand()}`,
      '3. git stash pop                   (bring the local changes back)',
    ],
    why: 'Committing the changes first works just as well. Rerunning with --allow-dirty only skips this check, and git rebase still refuses to run with unstaged changes, so it pairs best with --strategy merge.',
  };
}

// Conflict recovery is only valid once git has stopped inside a rebase or merge.
function syncInProgress() {
  if (git(['rev-parse', '--verify', '--quiet', 'MERGE_HEAD']).status === 0) {
    return true;
  }
  for (const dir of ['rebase-merge', 'rebase-apply']) {
    const path = git(['rev-parse', '--git-path', dir]).stdout.trim();
    if (path && existsSync(path)) return true;
  }
  return false;
}

function syncFailureStep(options) {
  if (syncInProgress()) return conflictStep(options.strategy);
  if (!isWorktreeClean()) return dirtyTreeStep();
  return {
    lines: ['git status'],
    why: 'The sync command failed before it changed the branch. Inspect the git error, then rerun.',
  };
}

function printPlan(commands) {
  console.log('Plan:');
  for (const command of commands) {
    console.log(`  ${command.join(' ')}`);
  }
}

// Rebuild the command that invoked this script, so suggested reruns can be copied straight from the output.
// Extra flags are appended by the caller.
function selfCommand(extraArgs = []) {
  const args = [...process.argv.slice(2), ...extraArgs];
  return `node "${process.argv[1]}"${args.length ? ` ${args.join(' ')}` : ''}`;
}

// The branch's upstream tracking ref (e.g. origin/my-branch), or null when the branch has never been pushed.
function upstreamRef() {
  const result = git([
    'rev-parse',
    '--abbrev-ref',
    '--symbolic-full-name',
    '@{upstream}',
  ]);
  return result.status === 0 ? result.stdout.trim() || null : null;
}

// An inspection failure must stop push advice rather than look like an empty result.
function gitOk(args) {
  const result = git(args);
  if (result.status !== 0) {
    fail(
      result.status || 1,
      `❌ git ${args.join(' ')} failed: ${result.stderr.trim()}`,
      {
        lines: ['git status'],
        why: 'Resolve the git error before rerunning the sync.',
      },
    );
  }
  return result.stdout.trim();
}

function shellArg(value) {
  return /^[A-Za-z0-9_./:=@+-]+$/.test(value)
    ? value
    : `'${value.replaceAll("'", "'\\''")}'`;
}

// Fetch the actual destination so a stale tracking ref cannot hide upstream work.
// Capture its exact tip for both ancestry checks and a lease immune to later background fetches.
// A branch created from origin/main tracks the base branch itself, and pushing to that destination would put the branch's commits on the base branch.
// Such an upstream is reported with tracksBase instead, so the push advice publishes the branch under its own name.
function fetchUpstream(branch, options) {
  const remote = git([
    'config',
    '--get',
    `branch.${branch}.remote`,
  ]).stdout.trim();
  const ref = git(['config', '--get', `branch.${branch}.merge`]).stdout.trim();
  if (!remote && !ref) return null;
  if (!remote || !ref.startsWith('refs/heads/')) {
    fail(1, '❌ Cannot determine the configured upstream destination.', {
      lines: ['git branch -vv'],
      why: 'Check the branch tracking configuration before syncing.',
    });
  }
  if (ref === `refs/heads/${options.baseBranch}`) {
    return {
      tracksBase: true,
      label: upstreamRef() || `${remote}/${options.baseBranch}`,
    };
  }
  console.log(`git fetch --no-tags ${shellArg(remote)} ${shellArg(ref)}`);
  gitOk(['fetch', '--no-tags', remote, ref]);
  return {
    remote,
    ref,
    tip: gitOk(['rev-parse', 'FETCH_HEAD']),
    label: upstreamRef() || `${remote}/${ref}`,
  };
}

function isAncestor(ancestor, descendant) {
  const result = git(['merge-base', '--is-ancestor', ancestor, descendant]);
  if (result.status !== 0 && result.status !== 1) {
    fail(
      result.status || 1,
      `❌ Cannot compare commit ancestry: ${result.stderr.trim()}`,
    );
  }
  return result.status === 0;
}

// Count commits on each side without assuming why the histories differ.
function divergence(upstream) {
  const output = gitOk([
    'rev-list',
    '--left-right',
    '--count',
    `${upstream}...HEAD`,
  ]);
  const [behind, ahead] = output.split(/\s+/).map(Number);
  return { behind, ahead };
}

// Only a rewrite observed in this run can justify recommending a force push.
// Remote work absent before the sync must be inspected and integrated first.
function pushStep(options, branch, upstream, headBefore = null) {
  if (!upstream || upstream.tracksBase) {
    return {
      lines: [`git push -u ${shellArg(options.remote)} ${shellArg(branch)}`],
      why: upstream
        ? `${branch} tracks the base branch ${upstream.label}, and pushing to that upstream would put its commits on ${options.baseBranch}. -u publishes ${branch} under its own name and makes ${options.remote}/${branch} the branch it tracks.`
        : `${branch} has no upstream yet, so -u publishes it and sets ${options.remote}/${branch} as the branch it tracks.`,
    };
  }

  const { remote, ref, tip, label } = upstream;
  const { ahead, behind } = divergence(tip);
  const destination = `${shellArg(remote)} ${shellArg(`HEAD:${ref}`)}`;

  if (ahead === 0 && behind === 0) {
    return {
      lines: [],
      why: `${branch} already matches ${label}, so there is nothing to push.`,
    };
  }

  if (behind > 0) {
    const rewrittenHere =
      options.strategy === 'rebase' &&
      headBefore !== null &&
      isAncestor(tip, headBefore) &&
      !isAncestor(headBefore, 'HEAD');
    if (!rewrittenHere) {
      return {
        lines: [`git log --left-right --oneline ${shellArg(`${tip}...HEAD`)}`],
        why: `${label} has commits missing locally. Review and integrate the upstream work before pushing; this run did not establish a safe history rewrite.`,
      };
    }
    return {
      lines: [
        `git push ${shellArg(`--force-with-lease=${ref}:${tip}`)} ${destination}`,
      ],
      why: `This rebase rewrote commits that already contained ${label}. The explicit lease permits the push only while the destination still points to ${tip}.`,
    };
  }

  return {
    lines: [`git push ${destination}`],
    why: `${branch} is ${ahead} commit(s) ahead of ${label}, so a plain push fast-forwards the configured destination.`,
  };
}

// The recovery steps to print when a rebase or merge stops on conflicts.
function conflictStep(strategy) {
  if (strategy === 'rebase') {
    return {
      lines: [
        '1. git status                      (list the conflicted files)',
        '2. Fix each conflict, then run:    git add <file>',
        '3. git rebase --continue           (resume; repeat for each stopped commit)',
      ],
      why: 'A rebase replays commits one at a time, so it can stop more than once. To abandon the sync and return the branch to where it started, run: git rebase --abort',
    };
  }
  return {
    lines: [
      '1. git status                      (list the conflicted files)',
      '2. Fix each conflict, then run:    git add <file>',
      '3. git commit                      (record the merge commit)',
    ],
    why: 'To abandon the merge and return the branch to where it started, run: git merge --abort',
  };
}

// Return true when the installed git is at least the given major.minor version.
// Used to gate the merge-tree conflict preview, which requires git 2.38+.
function gitVersionAtLeast(major, minor) {
  const match = git(['--version']).stdout.match(/(\d+)\.(\d+)/);
  if (!match) return false;
  const [, gotMajor, gotMinor] = match.map(Number);
  return gotMajor > major || (gotMajor === major && gotMinor >= minor);
}

// Read-only assessment: fetch the base branch, then report ahead and behind counts, a conflict preview, and a recommendation.
// Never changes the branch.
function verify(options, branch) {
  const baseRef = `${options.remote}/${options.baseBranch}`;

  console.log(
    'Verify mode: read-only assessment (no rebase, merge, or working-tree changes).',
  );
  console.log('');
  printPlan([['git', 'fetch', options.remote, options.baseBranch]]);

  // Fetch to make the counts accurate.
  // This updates the remote-tracking ref only; it does not touch the current branch or working tree.
  const fetch = spawnSync(
    'git',
    ['fetch', options.remote, options.baseBranch],
    { stdio: 'inherit' },
  );
  if (fetch.status !== 0) {
    const code = fetch.status === null ? 1 : fetch.status;
    fail(
      code,
      `❌ Command failed with exit code ${code}: git fetch ${options.remote} ${options.baseBranch}`,
      {
        lines: ['1. git remote -v', `2. ${selfCommand()}`],
        why: `The fetch failed, so nothing was assessed. Confirm the remote "${options.remote}" exists and is reachable, then rerun the same command.`,
      },
    );
  }

  if (git(['rev-parse', '--verify', '--quiet', baseRef]).status !== 0) {
    fail(
      1,
      `❌ Could not resolve ${baseRef} after fetch. Check the remote and base branch names.`,
      {
        lines: [`git branch --remotes --list "${options.remote}/*"`],
        why: `List the branches on "${options.remote}" to find the right base branch name, then rerun with --base-branch <name>.`,
      },
    );
  }

  const ahead = Number(
    git(['rev-list', '--count', `${baseRef}..HEAD`]).stdout.trim() || '0',
  );
  const behind = Number(
    git(['rev-list', '--count', `HEAD..${baseRef}`]).stdout.trim() || '0',
  );
  const clean = isWorktreeClean();

  // Preview conflicts with a trial merge that writes nothing.
  // git merge-tree --write-tree exits 0 for a clean merge and 1 when it conflicts (git 2.38+).
  let conflicts = 'unknown';
  if (gitVersionAtLeast(2, 38)) {
    const status = git(['merge-tree', '--write-tree', baseRef, 'HEAD']).status;
    if (status === 0) conflicts = 'none';
    else if (status === 1) conflicts = 'likely';
  }

  let recommendation;
  if (behind === 0) {
    recommendation = 'up to date';
  } else if (conflicts === 'likely') {
    recommendation = `sync recommended (${options.strategy}), resolve conflicts manually`;
  } else {
    recommendation = `sync recommended (${options.strategy})`;
  }

  console.log('');
  console.log(`Branch: ${branch}`);
  console.log(`Base: ${baseRef}`);
  console.log(`Working tree: ${clean ? 'clean' : 'has uncommitted changes'}`);
  console.log(`Ahead of base: ${ahead} commit(s)`);
  console.log(`Behind base: ${behind} commit(s)`);
  console.log(
    `Conflicts (merge preview): ${conflicts === 'unknown' ? 'unknown (requires git 2.38+)' : conflicts}`,
  );
  console.log(`Recommendation: ${recommendation}`);
  console.log('');

  if (behind === 0) {
    console.log(`✅ ${branch} is up to date with ${baseRef}. No sync needed.`);
  } else {
    console.log(
      `⚠️ ${recommendation}. ${branch} is behind ${baseRef} by ${behind} commit(s).`,
    );
  }

  // Verify changes nothing, so the next command is either the sync it just recommended or, when the branch is already current, whatever push is outstanding.
  if (behind === 0) {
    printNextCommand(pushStep(options, branch, fetchUpstream(branch, options)));
    return;
  }

  const syncArgs = process.argv
    .slice(2)
    .filter((arg) => arg !== '--verify')
    .join(' ');
  printNextCommand({
    lines: [`node "${process.argv[1]}"${syncArgs ? ` ${syncArgs}` : ''}`],
    why: `Drop --verify to run the ${options.strategy} for real.${clean ? '' : ' Commit or stash the working-tree changes first.'} That run then names the push to follow it with.`,
  });
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  ensureGitRepo();

  const branch = currentBranch();
  if (!branch) {
    fail(1, '⚠️ Could not determine the current branch.', {
      lines: ['git switch -c my-feature-branch'],
      why: 'HEAD is detached or the repository has no commits yet. Create or switch to a branch, then rerun the sync.',
    });
  }

  if (branch === options.baseBranch) {
    const action = options.verify ? 'verify' : 'update';
    fail(
      1,
      `⚠️ Refusing to ${action} while checked out on ${options.baseBranch}. Switch to a feature branch first.`,
      {
        lines: ['1. git switch my-feature-branch', `2. ${selfCommand()}`],
        why: `There is nothing to sync while ${options.baseBranch} is checked out. Run "git branch" to see the available branches, switch to the one to sync, then rerun.`,
      },
    );
  }

  if (options.verify) {
    verify(options, branch);
    return;
  }

  if (!options.allowDirty && !isWorktreeClean()) {
    fail(
      1,
      '⚠️ Working tree is not clean. Commit, stash, or rerun with --allow-dirty.',
      dirtyTreeStep(),
    );
  }

  const baseRef = `${options.remote}/${options.baseBranch}`;
  const commands = [['git', 'fetch', options.remote, options.baseBranch]];
  if (options.strategy === 'rebase') {
    commands.push(['git', 'rebase', baseRef]);
  } else {
    commands.push(['git', 'merge', baseRef]);
  }

  printPlan(commands);

  let upstream = null;
  let headBefore = null;
  for (const [, ...args] of commands) {
    if (args[0] === 'rebase' || args[0] === 'merge') {
      upstream = fetchUpstream(branch, options);
      headBefore = gitOk(['rev-parse', 'HEAD']);
    }
    const result = spawnSync('git', args, { stdio: 'inherit' });
    if (result.status !== 0) {
      const code = result.status === null ? 1 : result.status;
      const isSyncStep = args[0] === 'rebase' || args[0] === 'merge';
      fail(
        code,
        `❌ Command failed with exit code ${code}: git ${args.join(' ')}`,
        isSyncStep
          ? syncFailureStep(options)
          : {
              lines: ['1. git remote -v', `2. ${selfCommand()}`],
              why: `The fetch failed, so the branch was not changed. Confirm the remote "${options.remote}" exists and is reachable, then rerun the same command.`,
            },
      );
    }
  }

  console.log(
    `✅ Branch ${branch} is now updated from ${baseRef} using ${options.strategy}.`,
  );

  printNextCommand(pushStep(options, branch, upstream, headBefore));
}

main();
