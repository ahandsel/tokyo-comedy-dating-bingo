# Scripts

Shell and Node.js scripts that support repository tooling.
Most are also exposed as `pnpm` scripts in `package.json`.
Run [index.sh][] to list the available `pnpm` scripts.

Skills carry their own scripts under `skills/<skill-name>/scripts/`, and each skill's `SKILL.md` describes them.
The "Scripts" section of [AGENTS.md](../AGENTS.md) holds the authoring rules, and the `script-auditor` skill checks them.


## Contents

| Script       | pnpm command | Description                                        | Last updated |
| ------------ | ------------ | -------------------------------------------------- | ------------ |
| [index.sh][] | `pnpm index` | List all `pnpm` scripts defined in `package.json`. | 2026-11-02   |

[index.sh]: index.sh
