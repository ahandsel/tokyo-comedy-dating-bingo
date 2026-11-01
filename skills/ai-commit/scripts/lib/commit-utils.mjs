// commit-utils.mjs notes
// General notes:
// * Purpose: Shared library for the ai-commit scripts: git helpers, style guide resolution, message file parsing, message validation, and reword prerequisite checks.
// Usage:
//   import { gitOk, validateMessage } from './lib/commit-utils.mjs';
//   Library module only: it is not a CLI entry point and has no --help output.
// Output:
// * Exported functions return values to the caller; fail() prints a ❌ message and exits the process.
// Version history:
// * v1.5 - 2026-11-02 - Import into this repo, drop the 📚 emoji from ALLOWED_EMOJIS to match the "Commit type emoji guide" in docs/repo-commit-style-guide.md, and reformat the comments to one sentence per line.
// * v1.4 - 2026-10-30 - List unpushed commits as those on no remote-tracking branch, so a rebase onto main does not put main's commits in reword scope.
//   Reject message body lines that are not "- " bullets instead of dropping them, replacing a one-line check that could never fire.
// * v1.3 - 2026-10-28 - Add the 📚 internal-docs emoji to ALLOWED_EMOJIS.
// * v1.2 - 2026-09-17 - Preserve staged deletions and rename sources when staging selected commit paths.
// * v1.1 - 2026-07-13 - Add validateTitle, merges-in-range and rebase-in-progress reword checks, and grapheme-aware title length counting.
//   The clean-tree check now ignores untracked files, so draft message files do not block rewords.
// * v1.0 - 2026-07-09 - Initial release for ai-commit script refactor.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

// Mirrors the "Commit type emoji guide" in docs/repo-commit-style-guide.md, so change both together.
export const ALLOWED_EMOJIS = [
  '🐛',
  '🔧',
  '⬇️',
  '⬆️',
  '📝',
  '✨',
  '🚚',
  '🎨',
  '🚀',
  '♻️',
  '🗑️',
  '🔄',
  '🧪',
];

export function fail(code, message) {
  console.error(message.startsWith('❌') ? message : `❌ ${message}`);
  process.exit(code);
}

export function git(args) {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  if (result.error) {
    fail(1, `Failed to run git: ${result.error.message}`);
  }
  return result;
}

export function gitOk(args) {
  const result = git(args);
  if (result.status !== 0) {
    fail(
      result.status || 1,
      `git ${args.join(' ')} failed:\n${(result.stderr || result.stdout || '').trim()}`,
    );
  }
  return (result.stdout || '').trimEnd();
}

export function gitTry(args) {
  const result = git(args);
  return {
    ok: result.status === 0,
    stdout: (result.stdout || '').trimEnd(),
    stderr: (result.stderr || '').trimEnd(),
    status: result.status ?? 1,
  };
}

export function ensureGitRepo() {
  const result = git(['rev-parse', '--show-toplevel']);
  if (result.status !== 0) {
    fail(1, 'Not inside a git repository.');
  }
  return (result.stdout || '').trimEnd();
}

export function resolveStyleGuide(repoRoot) {
  const tracked = gitTry([
    'ls-files',
    '-z',
    ':(glob)**/repo-commit-style-guide.md',
  ]);
  const matches = tracked.ok ? tracked.stdout.split('\0').filter(Boolean) : [];

  let path = null;
  if (matches.length === 1) {
    path = join(repoRoot, matches[0]);
  } else if (matches.length > 1) {
    const rootMatch = matches.find((m) => !m.includes('/'));
    const docsMatch = matches.find((m) => m.startsWith('docs/'));
    const chosen = rootMatch || docsMatch || matches[0];
    path = join(repoRoot, chosen);
  } else {
    path = join(SCRIPT_DIR, '..', '..', 'default-commit-style-guide.md');
  }

  let content = '';
  try {
    content = readFileSync(path, 'utf8');
  } catch {
    fail(1, `Style guide not found at ${path}`);
  }

  return { path, content, ambiguous: matches.length > 1, matches };
}

export function parseMessageFile(content) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  let title = null;
  const bullets = [];
  // Body lines that are not "- " bullets, such as the second line of a wrapped bullet.
  // They are kept for validateMessage to reject, because the commit would otherwise drop them silently.
  const strayLines = [];
  let inMessage = false;

  for (const line of lines) {
    if (line.startsWith('Title:')) {
      title = line.slice('Title:'.length).trim();
      continue;
    }
    if (line.trim() === 'Message:') {
      inMessage = true;
      continue;
    }
    if (!inMessage || line.trim() === '') {
      continue;
    }
    if (line.startsWith('- ')) {
      bullets.push(line.slice(2));
    } else {
      strayLines.push(line);
    }
  }

  if (!title) {
    fail(2, 'Message file must include a line starting with "Title:".');
  }

  return { title, bullets, strayLines };
}

export function readMessageFile(filePath) {
  let content = '';
  try {
    content = readFileSync(filePath, 'utf8');
  } catch (err) {
    fail(2, `Cannot read message file ${filePath}: ${err.message}`);
  }
  return parseMessageFile(content);
}

export function formatGitMessage(title, bullets) {
  if (bullets.length === 0) {
    return title;
  }
  return `${title}\n\n${bullets.map((b) => `- ${b}`).join('\n')}`;
}

export function titleLength(title) {
  return [...new Intl.Segmenter().segment(title)].length;
}

export function validateTitle(title) {
  const errors = [];

  if (!title) {
    errors.push('Title is missing.');
    return errors;
  }

  const length = titleLength(title);
  if (length > 50) {
    errors.push(
      `Title is ${length} characters; limit is 50 including the emoji.`,
    );
  }
  if (title.endsWith('.')) {
    errors.push('Title must not end with a period.');
  }
  const emoji = ALLOWED_EMOJIS.find((e) => title.startsWith(e));
  if (!emoji) {
    errors.push(
      `Title must start with exactly one allowed emoji (${ALLOWED_EMOJIS.join(', ')}).`,
    );
  } else {
    const rest = title.slice(emoji.length);
    if (!rest.startsWith(' ') || rest.trim() === '') {
      errors.push('Title must include text after the emoji.');
    }
    const extraEmoji = ALLOWED_EMOJIS.some(
      (e) => e !== emoji && rest.includes(e),
    );
    if (extraEmoji) {
      errors.push('Title must start with exactly one emoji.');
    }
  }

  return errors;
}

export function validateMessage(title, bullets, strayLines = []) {
  const errors = validateTitle(title);

  if (bullets.length === 0) {
    errors.push('Message body must include at least one "- " bullet.');
  }

  for (const line of strayLines) {
    errors.push(
      `Body line "${line}" must start with "- "; keep each bullet on one line.`,
    );
  }

  for (const [index, bullet] of bullets.entries()) {
    if (!bullet.trim()) {
      errors.push(`Bullet ${index + 1} is empty.`);
    }
  }

  return errors;
}

export function isWorkingTreeClean() {
  // Untracked files (for example, draft message files) do not block a rebase.
  return (
    gitTry(['status', '--porcelain', '--untracked-files=no']).stdout === ''
  );
}

export function isMergeCommit(hash) {
  const parents = gitTry(['rev-list', '--parents', '-n', '1', hash]).stdout;
  const parentCount = parents.split(' ').length - 1;
  return parentCount > 1;
}

export function isRebaseInProgress() {
  return ['rebase-merge', 'rebase-apply'].some((dir) => {
    const path = gitTry(['rev-parse', '--git-path', dir]).stdout;
    return path !== '' && existsSync(path);
  });
}

export function runPrerequisiteChecks(hash) {
  const checks = [];

  const exists = gitTry(['rev-parse', '--verify', `${hash}^{commit}`]);
  checks.push({
    name: 'commit-exists',
    ok: exists.ok,
    detail: exists.ok
      ? `${hash} resolves to a commit.`
      : `Commit ${hash} not found.`,
  });
  if (!exists.ok) {
    return checks;
  }

  const resolved = exists.stdout;
  const reachable = gitTry(['merge-base', '--is-ancestor', resolved, 'HEAD']);
  checks.push({
    name: 'reachable-from-head',
    ok: reachable.ok,
    detail: reachable.ok
      ? `${resolved} is reachable from HEAD.`
      : `${resolved} is not reachable from HEAD.`,
  });

  const merge = isMergeCommit(resolved);
  checks.push({
    name: 'not-merge-commit',
    ok: !merge,
    detail: merge
      ? `${resolved} is a merge commit and cannot be reworded.`
      : `${resolved} is not a merge commit.`,
  });

  const mergesInRange = gitTry([
    'rev-list',
    '--merges',
    `${resolved}..HEAD`,
  ]).stdout;
  checks.push({
    name: 'no-merges-in-range',
    ok: mergesInRange === '',
    detail:
      mergesInRange === ''
        ? `No merge commits between ${resolved} and HEAD.`
        : `Merge commits exist between ${resolved} and HEAD; a rebase reword would flatten them.`,
  });

  const rebaseInProgress = isRebaseInProgress();
  checks.push({
    name: 'no-rebase-in-progress',
    ok: !rebaseInProgress,
    detail: rebaseInProgress
      ? 'A rebase is already in progress; finish or abort it first.'
      : 'No rebase is in progress.',
  });

  const clean = isWorkingTreeClean();
  checks.push({
    name: 'clean-working-tree',
    ok: clean,
    detail: clean
      ? 'Working tree and index are clean.'
      : 'Working tree or index has changes; commit or stash before rewording.',
  });

  return checks;
}

// Unpushed means contained in no remote-tracking branch.
// An @{upstream}..HEAD range is not enough: after a rebase onto a newer main, it also holds main's commits, which are already on origin/main.
export function getUnpushedCommits() {
  const result = gitTry([
    'log',
    '--reverse',
    '--format=%H',
    'HEAD',
    '--not',
    '--remotes',
  ]);
  if (!result.ok) {
    return [];
  }
  return result.stdout.split('\n').filter(Boolean);
}

export function getRemoteBranchesContaining(hash) {
  const result = gitTry(['branch', '-r', '--contains', hash]);
  if (!result.ok || !result.stdout) {
    return [];
  }
  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function commitSummary(hash) {
  const subject = gitOk(['log', '-1', '--format=%s', hash]);
  const shortHash = gitOk(['rev-parse', '--short', hash]);
  const files = gitOk(['show', '--name-status', '--format=', hash])
    .split('\n')
    .filter(Boolean);
  const patch = gitOk(['show', '--patch', '--format=', hash]);
  const checks = runPrerequisiteChecks(hash);
  const remoteBranches = getRemoteBranchesContaining(hash);

  return {
    hash,
    shortHash,
    subject,
    files,
    patch,
    checks,
    likelyPushed: remoteBranches.length > 0,
    remoteBranches,
    isMerge: isMergeCommit(hash),
  };
}

// Already-staged deletions no longer match git add's index/worktree pathspecs.
// Keep them in the commit scope, but only restage them if the path was recreated.
export function stageCommitFiles(
  files,
  runGit = gitOk,
  repoRoot = process.cwd(),
) {
  const deleted = new Set(
    runGit([
      'diff',
      '--cached',
      '--no-renames',
      '--name-only',
      '--diff-filter=D',
      '-z',
      '--',
      ...files,
    ])
      .split('\0')
      .filter(Boolean),
  );
  const toStage = files.filter(
    (file) => !deleted.has(file) || existsSync(join(repoRoot, file)),
  );
  if (toStage.length > 0) {
    runGit(['add', '-A', '--', ...toStage]);
  }
}
