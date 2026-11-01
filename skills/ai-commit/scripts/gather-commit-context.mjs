#!/usr/bin/env node

// gather-commit-context.mjs notes
// General notes:
// * Purpose: Gather every git input the ai-commit skill needs in one structured payload: style guide, worktree status, diffs, and commit details for reword modes.
//   Read-only against git.
// Usage:
//   node skills/ai-commit/scripts/gather-commit-context.mjs
//   node skills/ai-commit/scripts/gather-commit-context.mjs --head
//   node skills/ai-commit/scripts/gather-commit-context.mjs --commit <hash>
// Options:
//   --head                Gather unpushed commits oldest-first for reword mode.
//   --commit <hash>       Gather one target commit for reword mode.
//   --format <mode>       Output format: json (default) or markdown.
//   --max-diff-lines <n>  Truncate each diff to n lines (for small context windows).
//   --help, -h            Show this message.
// Output:
// * JSON object on stdout (default) or a Markdown summary with --format markdown.
// * Status line on stderr.
// * Exit codes: 0 success, 1 git failure, 2 invalid arguments.
// Version history:
// * v1.4 - 2026-11-02 - Import into this repo and reformat the comments to one sentence per line.
// * v1.3 - 2026-10-29 - Keep the two-character porcelain status so a staged edit stays distinct from an unstaged edit.
// * v1.2 - 2026-10-29 - List every untracked file, keep rename and quoted paths as real paths, and include untracked contents in the unstaged diff.
// * v1.1 - 2026-07-13 - Add --max-diff-lines to bound diff output for models with small context windows.
// * v1.0 - 2026-07-09 - Initial release for ai-commit script refactor.

import {
  commitSummary,
  ensureGitRepo,
  fail,
  getUnpushedCommits,
  gitOk,
  gitTry,
  resolveStyleGuide,
} from './lib/commit-utils.mjs';

function printUsage() {
  console.log(`Usage: node gather-commit-context.mjs [options]

Gather git context for the ai-commit skill in one structured payload.

Options:
  --head                Gather unpushed commits oldest-first for reword mode.
  --commit <hash>       Gather one target commit for reword mode.
  --format <mode>       Output format: json (default) or markdown.
  --max-diff-lines <n>  Truncate each diff to n lines (for small context windows).
  --help, -h            Show this message.

Default mode (no flags) gathers the working tree: status, file lists, and diffs.

Exit codes:
  0  Success.
  1  Git failure.
  2  Invalid arguments.
`);
}

function parseArgs(argv) {
  const options = {
    mode: 'worktree',
    commitHash: null,
    format: 'json',
    maxDiffLines: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
        break;
      case '--head':
        options.mode = 'unpushed';
        break;
      case '--commit':
        options.commitHash = argv[++i];
        if (!options.commitHash) {
          fail(2, '--commit requires a hash.');
        }
        options.mode = 'commit';
        break;
      case '--format':
        options.format = argv[++i];
        if (options.format !== 'json' && options.format !== 'markdown') {
          fail(2, '--format must be "json" or "markdown".');
        }
        break;
      case '--max-diff-lines':
        options.maxDiffLines = Number(argv[++i]);
        if (
          !Number.isInteger(options.maxDiffLines) ||
          options.maxDiffLines < 1
        ) {
          fail(2, '--max-diff-lines requires a positive integer.');
        }
        break;
      default:
        fail(2, `Unknown argument: ${arg}. Run with --help for usage.`);
    }
  }

  if (options.mode === 'commit' && options.commitHash) {
    const head = gitTry(['rev-parse', 'HEAD']);
    const target = gitTry([
      'rev-parse',
      '--verify',
      `${options.commitHash}^{commit}`,
    ]);
    if (target.ok && head.ok && target.stdout === head.stdout) {
      options.fallbackToHeadOnly = true;
    }
  }

  return options;
}

// Null-separated porcelain keeps paths literal.
// A rename or copy record is the destination path, then the source path.
function parseStatusZ(porcelain) {
  const files = [];
  const tokens = porcelain.split('\0');
  for (let index = 0; index < tokens.length; index++) {
    const entry = tokens[index];
    if (!entry) continue;
    const xy = entry.slice(0, 2);
    files.push({ status: xy, path: entry.slice(3) });
    if (xy[0] === 'R' || xy[0] === 'C') {
      index += 1;
      const source = tokens[index];
      if (source) files.push({ status: xy, path: source });
    }
  }
  return files;
}

// git diff omits untracked files.
// Compare each one with an empty file so the payload still contains its text.
function untrackedDiff(path) {
  const result = gitTry(['diff', '--no-index', '--', '/dev/null', path]);
  if (result.status !== 0 && result.status !== 1) {
    fail(1, `git diff --no-index failed for ${path}:\n${result.stderr}`);
  }
  return result.stdout;
}

function gatherWorktree() {
  const files = parseStatusZ(
    gitOk(['status', '--porcelain=v1', '-z', '--untracked-files=all']),
  );
  const stagedDiff = gitTry(['diff', '--staged']).stdout;
  const unstagedDiff = [
    gitTry(['diff']).stdout,
    ...files
      .filter((file) => file.status === '??')
      .map((file) => untrackedDiff(file.path)),
  ]
    .filter(Boolean)
    .join('\n');

  return {
    clean: files.length === 0,
    status: files.map((file) => `${file.status} ${file.path}`).join('\n'),
    files,
    stagedDiff,
    unstagedDiff,
  };
}

function gatherUnpushed() {
  const hashes = getUnpushedCommits();
  if (hashes.length === 0) {
    return { commits: [], empty: true };
  }

  const commits = hashes.map((hash, index) => ({
    positionFromHead: hashes.length - 1 - index,
    ...commitSummary(hash),
  }));

  return { commits, empty: false };
}

function gatherCommit(hash) {
  const resolved = gitOk(['rev-parse', '--verify', `${hash}^{commit}`]);
  return commitSummary(resolved);
}

function truncateDiff(diff, maxLines) {
  if (!maxLines || !diff) {
    return diff;
  }
  const lines = diff.split('\n');
  if (lines.length <= maxLines) {
    return diff;
  }
  const omitted = lines.length - maxLines;
  return [
    ...lines.slice(0, maxLines),
    `⚠️ Diff truncated: ${omitted} more lines. Rerun without --max-diff-lines for the full diff.`,
  ].join('\n');
}

function buildPayload(repoRoot, options) {
  const styleGuide = resolveStyleGuide(repoRoot);
  const payload = {
    mode: options.mode,
    repoRoot,
    styleGuide: {
      path: styleGuide.path,
      content: styleGuide.content,
      ambiguous: styleGuide.ambiguous,
      matches: styleGuide.matches,
    },
  };

  if (options.mode === 'worktree') {
    payload.worktree = gatherWorktree();
    payload.worktree.stagedDiff = truncateDiff(
      payload.worktree.stagedDiff,
      options.maxDiffLines,
    );
    payload.worktree.unstagedDiff = truncateDiff(
      payload.worktree.unstagedDiff,
      options.maxDiffLines,
    );
  } else if (options.mode === 'unpushed') {
    payload.unpushed = gatherUnpushed();
    for (const commit of payload.unpushed.commits) {
      commit.patch = truncateDiff(commit.patch, options.maxDiffLines);
    }
  } else {
    payload.commit = gatherCommit(options.commitHash);
    payload.commit.patch = truncateDiff(
      payload.commit.patch,
      options.maxDiffLines,
    );
    if (options.fallbackToHeadOnly) {
      payload.note =
        'Target resolves to HEAD; use apply-commit.mjs --reword-head after approval.';
    }
  }

  return payload;
}

function toMarkdown(payload) {
  const lines = [`# ai-commit context (${payload.mode})`, ''];
  lines.push(`Style guide: \`${payload.styleGuide.path}\``);
  if (payload.styleGuide.ambiguous) {
    lines.push(
      `⚠️ Multiple repo-commit-style-guide.md files found; using \`${payload.styleGuide.path}\`.`,
    );
  }
  lines.push('');

  if (payload.worktree) {
    lines.push('## Working tree');
    if (payload.worktree.clean) {
      lines.push('Clean.');
    } else {
      lines.push('```');
      lines.push(payload.worktree.status);
      lines.push('```');
      if (payload.worktree.stagedDiff) {
        lines.push(
          '',
          '### Staged diff',
          '```diff',
          payload.worktree.stagedDiff,
          '```',
        );
      }
      if (payload.worktree.unstagedDiff) {
        lines.push(
          '',
          '### Unstaged diff',
          '```diff',
          payload.worktree.unstagedDiff,
          '```',
        );
      }
    }
  }

  if (payload.unpushed) {
    lines.push('## Unpushed commits');
    if (payload.unpushed.empty) {
      lines.push('None.');
    } else {
      for (const commit of payload.unpushed.commits) {
        lines.push(
          `### ${commit.shortHash} (HEAD~${commit.positionFromHead}) - ${commit.subject}`,
        );
        for (const check of commit.checks) {
          lines.push(`- ${check.ok ? '✅' : '❌'} ${check.detail}`);
        }
        if (commit.likelyPushed) {
          lines.push(
            `- ⚠️ Likely pushed to: ${commit.remoteBranches.join(', ')}`,
          );
        }
        lines.push('', '```diff', commit.patch, '```', '');
      }
    }
  }

  if (payload.commit) {
    lines.push(`## Commit ${payload.commit.shortHash}`);
    lines.push(`Subject: ${payload.commit.subject}`);
    for (const check of payload.commit.checks) {
      lines.push(`- ${check.ok ? '✅' : '❌'} ${check.detail}`);
    }
    if (payload.commit.likelyPushed) {
      lines.push(
        `- ⚠️ Likely pushed to: ${payload.commit.remoteBranches.join(', ')}`,
      );
    }
    lines.push('', '```diff', payload.commit.patch, '```');
    if (payload.note) {
      lines.push('', payload.note);
    }
  }

  return lines.join('\n');
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const repoRoot = ensureGitRepo();
  const payload = buildPayload(repoRoot, options);

  if (options.format === 'markdown') {
    console.log(toMarkdown(payload));
  } else {
    console.log(JSON.stringify(payload, null, 2));
  }

  console.error(`✅ Gathered ai-commit context (${options.mode}).`);
}

main();
