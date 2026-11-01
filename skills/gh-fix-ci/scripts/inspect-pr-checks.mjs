#!/usr/bin/env node

// inspect-pr-checks.mjs notes
//
// General notes:
// * Purpose: find the failing checks on a pull request, fetch the GitHub Actions log for each one, and cut the log down to the part that explains the failure.
// * For every failing check it resolves the run id (and job id when present) out of the check's details url, reads the run metadata, then pulls the log and extracts a window around the last failure marker.
// * A check whose details url points somewhere other than GitHub Actions is reported as `external` and left alone, because only Actions logs are reachable through `gh`.
// * Requires the GitHub CLI installed and authenticated, and a path inside the target Git repository.
//
// Usage:
//   node skills/gh-fix-ci/scripts/inspect-pr-checks.mjs --repo . --pr 123
//   node skills/gh-fix-ci/scripts/inspect-pr-checks.mjs --repo . --pr https://github.com/org/repo/pull/123 --json
//   node skills/gh-fix-ci/scripts/inspect-pr-checks.mjs --repo . --max-lines 200 --context 40
//   node skills/gh-fix-ci/scripts/inspect-pr-checks.mjs --help
//
// Output:
// * A text report on stdout by default, one block per failing check, or a JSON object with `pr` and `results` keys when `--json` is given.
// * Exit codes follow the original tool, where a non-zero exit is the normal result of finding a problem: 0 means no failing check was detected, 1 means either failing checks were analyzed and reported or the inspection could not run, and 2 means the arguments were invalid.
// * Because 1 covers both outcomes, read the report rather than the exit code to tell a found failure from a broken run.
//
// Version history:
// * v1.3 - 2026-11-02 - Accept the `--option=value` form, read an empty `state` as a fall-through to `status`, and set process.exitCode instead of calling process.exit, which discarded queued stdout past one pipe buffer and truncated a large piped report.
// * v1.2 - 2026-09-30 - Apply sentence-per-line formatting to comments.
// * v1.1 - 2026-09-30 - Recognize only the GitHub Actions `/actions/runs/<id>` path, so an external CI url that happens to contain `/runs/<id>` is reported as `external`. Read the job-specific log with `gh run view --job` whenever the details url names a job, so each check shows its own failure rather than the last failure in the whole run, and drop the REST job-log fallback, which `gh api` rejected for logs holding terminal escape sequences.
// * v1.0 - 2026-08-28 - Initial release. Ports inspect_pr_checks.py to a Node.js ES module, keeping its output shape, field fallbacks, and exit codes, and adding status emojis.

import { execFileSync } from 'node:child_process';

const FAILURE_CONCLUSIONS = new Set([
  'failure',
  'cancelled',
  'timed_out',
  'action_required',
]);

const FAILURE_STATES = new Set([
  'failure',
  'error',
  'cancelled',
  'timed_out',
  'action_required',
]);

const FAILURE_BUCKETS = new Set(['fail']);

const FAILURE_MARKERS = [
  'error',
  'fail',
  'failed',
  'traceback',
  'exception',
  'assert',
  'panic',
  'fatal',
  'timeout',
  'segmentation fault',
];

const DEFAULT_MAX_LINES = 160;
const DEFAULT_CONTEXT_LINES = 30;

const PENDING_LOG_MARKERS = [
  'still in progress',
  'log will be available when it is complete',
];

const HELP = `Inspect failing GitHub PR checks, fetch GitHub Actions logs, and extract a failure snippet.

Usage:
  node skills/gh-fix-ci/scripts/inspect-pr-checks.mjs [options]

Options:
  --repo <path>       Path inside the target Git repository (default: .).
  --pr <ref>          PR number or URL (default: the current branch's PR).
  --max-lines <n>     Maximum lines in a snippet or tail (default: ${DEFAULT_MAX_LINES}).
  --context <n>       Lines of context around the failure marker (default: ${DEFAULT_CONTEXT_LINES}).
  --json              Emit JSON instead of the text report.
  -h, --help          Show this message and exit.

Every option that takes a value accepts either "--option value" or "--option=value".

Exit codes:
  0  No failing check was detected.
  1  Failing checks were analyzed and reported, or the inspection could not run.
  2  The arguments were invalid.

Note that 1 covers both a successful analysis of failing checks and a failure to run at all, so read the report rather than the exit code to tell them apart.
`;

// Mirrors the original's GhResult: a non-zero exit is data to inspect, not an exception.
function runGh(args, cwd) {
  try {
    const stdout = execFileSync('gh', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 256 * 1024 * 1024,
    });
    return { returncode: 0, stdout, stderr: '' };
  } catch (error) {
    const stdout = error.stdout ? String(error.stdout) : '';
    const stderr = error.stderr ? String(error.stderr) : (error.message ?? '');
    // A missing gh binary has no exit status of its own.
    return { returncode: error.status ?? 1, stdout, stderr };
  }
}

function parseJsonOr(text, fallback) {
  try {
    return JSON.parse(text || fallback);
  } catch {
    return undefined;
  }
}

// Splits `--option=value` into its name and its inline value, so both `--option value` and `--option=value` are accepted.
// Python's argparse took either form, and the tool this replaces was called both ways.
function splitOption(arg) {
  const equals = arg.startsWith('--') ? arg.indexOf('=') : -1;
  if (equals === -1) {
    return { name: arg, inlineValue: undefined };
  }
  return { name: arg.slice(0, equals), inlineValue: arg.slice(equals + 1) };
}

function parseArgs(argv) {
  const options = {
    repo: '.',
    pr: null,
    maxLines: DEFAULT_MAX_LINES,
    context: DEFAULT_CONTEXT_LINES,
    json: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const { name, inlineValue } = splitOption(arg);

    if (name === '-h' || name === '--help') {
      process.stdout.write(HELP);
      process.exit(0);
    }

    if (name === '--json') {
      if (inlineValue !== undefined) {
        console.error(`❌ Option --json takes no value, got: ${arg}`);
        process.exit(2);
      }
      options.json = true;
      continue;
    }

    const needsValue = ['--repo', '--pr', '--max-lines', '--context'].includes(
      name,
    );
    if (!needsValue) {
      console.error(`❌ Unknown option: ${arg}. Run with --help for usage.`);
      process.exit(2);
    }

    let value = inlineValue;
    if (value === undefined) {
      value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) {
        console.error(
          `❌ Option ${name} needs a value. Run with --help for usage.`,
        );
        process.exit(2);
      }
      i += 1;
    }

    if (name === '--repo') options.repo = value;
    if (name === '--pr') options.pr = value;
    if (name === '--max-lines' || name === '--context') {
      const parsed = Number.parseInt(value, 10);
      if (!Number.isFinite(parsed)) {
        console.error(`❌ Option ${name} needs an integer, got: ${value}`);
        process.exit(2);
      }
      if (name === '--max-lines') options.maxLines = parsed;
      else options.context = parsed;
    }
  }

  return options;
}

function findGitRoot(start) {
  try {
    const out = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd: start,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return out.trim();
  } catch {
    return null;
  }
}

function ensureGhAvailable(repoRoot) {
  const result = runGh(['auth', 'status'], repoRoot);
  if (result.returncode === 0) {
    return true;
  }
  const message = (result.stderr || result.stdout || '').trim();
  console.error(
    `❌ ${message || 'Error: gh is not installed, not on PATH, or not authenticated.'}`,
  );
  return false;
}

function resolvePr(prValue, repoRoot) {
  if (prValue) {
    return prValue;
  }
  const result = runGh(['pr', 'view', '--json', 'number'], repoRoot);
  if (result.returncode !== 0) {
    const message = (result.stderr || result.stdout || '').trim();
    console.error(`❌ ${message || 'Error: unable to resolve PR.'}`);
    return null;
  }
  const data = parseJsonOr(result.stdout, '{}');
  if (data === undefined) {
    console.error('❌ Error: unable to parse PR JSON.');
    return null;
  }
  if (!data?.number) {
    console.error('❌ Error: no PR number found.');
    return null;
  }
  return String(data.number);
}

// gh has changed the field names of `pr checks` across versions, so on a field error the available-field list in the message drives a second attempt.
function fetchChecks(prValue, repoRoot) {
  const primaryFields = [
    'name',
    'state',
    'conclusion',
    'detailsUrl',
    'startedAt',
    'completedAt',
  ];
  let result = runGh(
    ['pr', 'checks', prValue, '--json', primaryFields.join(',')],
    repoRoot,
  );

  if (result.returncode !== 0) {
    const message = [result.stderr, result.stdout]
      .filter(Boolean)
      .join('\n')
      .trim();
    const availableFields = parseAvailableFields(message);

    if (availableFields.length === 0) {
      console.error(`❌ ${message || 'Error: gh pr checks failed.'}`);
      return null;
    }

    const fallbackFields = [
      'name',
      'state',
      'bucket',
      'link',
      'startedAt',
      'completedAt',
      'workflow',
    ];
    const selectedFields = fallbackFields.filter((field) =>
      availableFields.includes(field),
    );
    if (selectedFields.length === 0) {
      console.error('❌ Error: no usable fields available for gh pr checks.');
      return null;
    }

    result = runGh(
      ['pr', 'checks', prValue, '--json', selectedFields.join(',')],
      repoRoot,
    );
    if (result.returncode !== 0) {
      const retryMessage = (result.stderr || result.stdout || '').trim();
      console.error(`❌ ${retryMessage || 'Error: gh pr checks failed.'}`);
      return null;
    }
  }

  const data = parseJsonOr(result.stdout, '[]');
  if (data === undefined) {
    console.error('❌ Error: unable to parse checks JSON.');
    return null;
  }
  if (!Array.isArray(data)) {
    console.error('❌ Error: unexpected checks JSON shape.');
    return null;
  }
  return data;
}

function normalizeField(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim().toLowerCase();
}

// gh reports an unsupported --json field by listing the supported ones after an "Available fields:" line, one per line.
// Every non-empty line after that marker is taken as a field name, matching the original tool.
function parseAvailableFields(message) {
  if (!message.includes('Available fields:')) {
    return [];
  }

  const fields = [];
  let collecting = false;
  for (const line of message.split(/\r?\n/)) {
    if (line.includes('Available fields:')) {
      collecting = true;
      continue;
    }
    if (!collecting) continue;
    const field = line.trim();
    if (field) fields.push(field);
  }
  return fields;
}

function isFailing(check) {
  if (FAILURE_CONCLUSIONS.has(normalizeField(check.conclusion))) {
    return true;
  }
  // `||` rather than `??`, so an empty `state` falls through to `status` the way the original tool's `or` did.
  // A check that reports its outcome only in `status` would otherwise be read as passing.
  if (FAILURE_STATES.has(normalizeField(check.state || check.status))) {
    return true;
  }
  return FAILURE_BUCKETS.has(normalizeField(check.bucket));
}

// Only the GitHub Actions path counts.
// A bare `/runs/<id>` also appears in external CI urls, and on GitHub it names a check run rather than a workflow run.
function extractRunId(url) {
  if (!url) return null;
  return /\/actions\/runs\/(\d+)/.exec(url)?.[1] ?? null;
}

function extractJobId(url) {
  if (!url) return null;
  return /\/actions\/runs\/\d+\/job\/(\d+)/.exec(url)?.[1] ?? null;
}

function fetchRunMetadata(runId, repoRoot) {
  const fields = [
    'conclusion',
    'status',
    'workflowName',
    'name',
    'event',
    'headBranch',
    'headSha',
    'url',
  ];
  const result = runGh(
    ['run', 'view', runId, '--json', fields.join(',')],
    repoRoot,
  );
  if (result.returncode !== 0) return null;

  const data = parseJsonOr(result.stdout, '{}');
  if (
    data === undefined ||
    data === null ||
    typeof data !== 'object' ||
    Array.isArray(data)
  ) {
    return null;
  }
  return data;
}

function isLogPendingMessage(message) {
  const lowered = message.toLowerCase();
  return PENDING_LOG_MARKERS.some((marker) => lowered.includes(marker));
}

function fetchRunLog(runId, repoRoot) {
  const result = runGh(['run', 'view', runId, '--log'], repoRoot);
  if (result.returncode !== 0) {
    const error = (result.stderr || result.stdout || '').trim();
    return { log: '', error: error || 'gh run view failed' };
  }
  return { log: result.stdout, error: '' };
}

// `gh run view --job` returns only that job's log.
// The REST logs endpoint is avoided because `gh api` refuses to print a log that holds terminal escape sequences, which most Actions logs do.
function fetchJobLog(jobId, repoRoot) {
  const result = runGh(['run', 'view', '--job', jobId, '--log'], repoRoot);
  if (result.returncode !== 0) {
    const error = (result.stderr || result.stdout || '').trim();
    return { log: '', error: error || 'gh run view --job failed' };
  }
  return { log: result.stdout, error: '' };
}

// A check that names a job reads that job's log first.
// The run log mixes every job in the run, so with several failed jobs the last failure marker could belong to a different check.
// The run log is the fallback when the job log cannot be read.
function fetchCheckLog(runId, jobId, repoRoot) {
  if (jobId) {
    const job = fetchJobLog(jobId, repoRoot);
    if (job.log) {
      return { log: job.log, error: '', status: 'ok' };
    }
    if (job.error && isLogPendingMessage(job.error)) {
      return { log: '', error: job.error, status: 'pending' };
    }
  }

  const { log, error } = fetchRunLog(runId, repoRoot);
  if (!error) {
    return { log, error: '', status: 'ok' };
  }

  if (isLogPendingMessage(error)) {
    return { log: '', error, status: 'pending' };
  }

  return { log: '', error, status: 'error' };
}

// Python's str.splitlines() drops a single trailing newline rather than yielding a trailing empty element, which a plain split on newline would produce.
function splitLines(text) {
  const lines = String(text).split(/\r\n|\n|\r/);
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines;
}

function findFailureIndex(lines) {
  for (let idx = lines.length - 1; idx >= 0; idx -= 1) {
    const lowered = lines[idx].toLowerCase();
    if (FAILURE_MARKERS.some((marker) => lowered.includes(marker))) {
      return idx;
    }
  }
  return null;
}

function extractFailureSnippet(logText, maxLines, context) {
  const lines = splitLines(logText);
  if (lines.length === 0) return '';

  const markerIndex = findFailureIndex(lines);
  if (markerIndex === null) {
    return lines.slice(Math.max(0, lines.length - maxLines)).join('\n');
  }

  const start = Math.max(0, markerIndex - context);
  const end = Math.min(lines.length, markerIndex + context);
  let window = lines.slice(start, end);
  if (window.length > maxLines) {
    window = window.slice(window.length - maxLines);
  }
  return window.join('\n');
}

function tailLines(text, maxLines) {
  if (maxLines <= 0) return '';
  const lines = splitLines(text);
  return lines.slice(Math.max(0, lines.length - maxLines)).join('\n');
}

function analyzeCheck(check, repoRoot, maxLines, context) {
  const url = check.detailsUrl || check.link || '';
  const runId = extractRunId(url);
  const jobId = extractJobId(url);
  const base = {
    name: check.name ?? '',
    detailsUrl: url,
    runId,
    jobId,
  };

  if (runId === null) {
    base.status = 'external';
    base.note = 'No GitHub Actions run id detected in detailsUrl.';
    return base;
  }

  const metadata = fetchRunMetadata(runId, repoRoot);
  const { log, error, status } = fetchCheckLog(runId, jobId, repoRoot);

  if (status === 'pending') {
    base.status = 'log_pending';
    base.note = error || 'Logs are not available yet.';
    if (metadata) base.run = metadata;
    return base;
  }

  if (error) {
    base.status = 'log_unavailable';
    base.error = error;
    if (metadata) base.run = metadata;
    return base;
  }

  base.status = 'ok';
  base.run = metadata ?? {};
  base.logSnippet = extractFailureSnippet(log, maxLines, context);
  base.logTail = tailLines(log, maxLines);
  return base;
}

function indentBlock(text, prefix = '  ') {
  return splitLines(text)
    .map((line) => `${prefix}${line}`)
    .join('\n');
}

function renderResults(prNumber, results) {
  console.log(`❌ PR #${prNumber}: ${results.length} failing checks analyzed.`);

  for (const result of results) {
    console.log('-'.repeat(60));
    console.log(`Check: ${result.name ?? ''}`);
    if (result.detailsUrl) console.log(`Details: ${result.detailsUrl}`);
    if (result.runId) console.log(`Run ID: ${result.runId}`);
    if (result.jobId) console.log(`Job ID: ${result.jobId}`);
    console.log(`Status: ${result.status ?? 'unknown'}`);

    const runMeta = result.run ?? {};
    if (Object.keys(runMeta).length > 0) {
      const branch = runMeta.headBranch ?? '';
      const sha = (runMeta.headSha ?? '').slice(0, 12);
      const workflow = runMeta.workflowName || runMeta.name || '';
      const conclusion = runMeta.conclusion || runMeta.status || '';
      console.log(`Workflow: ${workflow} (${conclusion})`);
      if (branch || sha) console.log(`Branch/SHA: ${branch} ${sha}`);
      if (runMeta.url) console.log(`Run URL: ${runMeta.url}`);
    }

    if (result.note) console.log(`Note: ${result.note}`);

    if (result.error) {
      console.log(`⚠️  Error fetching logs: ${result.error}`);
      continue;
    }

    const snippet = result.logSnippet || '';
    if (snippet) {
      console.log('Failure snippet:');
      console.log(indentBlock(snippet, '  '));
    } else {
      console.log('No snippet available.');
    }
  }

  console.log('-'.repeat(60));
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  const repoRoot = findGitRoot(options.repo);
  if (repoRoot === null) {
    console.error('❌ Error: not inside a Git repository.');
    return 1;
  }

  if (!ensureGhAvailable(repoRoot)) {
    return 1;
  }

  const prValue = resolvePr(options.pr, repoRoot);
  if (prValue === null) {
    return 1;
  }

  const checks = fetchChecks(prValue, repoRoot);
  if (checks === null) {
    return 1;
  }

  const failing = checks.filter(isFailing);
  if (failing.length === 0) {
    console.log(`✅ PR #${prValue}: no failing checks detected.`);
    return 0;
  }

  const maxLines = Math.max(1, options.maxLines);
  const context = Math.max(1, options.context);
  const results = failing.map((check) =>
    analyzeCheck(check, repoRoot, maxLines, context),
  );

  if (options.json) {
    console.log(JSON.stringify({ pr: prValue, results }, null, 2));
  } else {
    renderResults(prValue, results);
  }

  // Non-zero because failing checks were found, matching the original tool.
  return 1;
}

process.exitCode = main();
