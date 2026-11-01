# Prompts

Reusable AI prompt files (`*.prompt.md`) for this repository.
Each file defines a task-specific instruction set to run with an AI assistant.

`.claude/commands` is a symlink to this folder, so Claude Code also lists every Markdown file here, including this `README.md`, as a custom slash command named after the file.


## Usage

To use a prompt, reference the prompt's file path in the AI interface (VS Code extension, terminal prompt, or desktop app) with the appropriate prefix for the AI tool.

| Tool           | Input                                    | Example                                          |
| -------------- | ---------------------------------------- | ------------------------------------------------ |
| Claude         | `Follow prompts/<prompt-file>.prompt.md` | `Follow prompts/example.prompt.md for README.md` |
| Codex          | `Follow prompts/<prompt-file>.prompt.md` | `Follow prompts/example.prompt.md for README.md` |
| GitHub Copilot | `#prompts/<prompt-file>.prompt.md`       | `#prompts/example.prompt.md for README.md`       |


## Contents

This folder holds no prompts yet.
When you add one, list it here in a table with a one-line description, and keep the rows sorted alphabetically.

The original build specification, [start-prompt.prompt.md](../start-prompt.prompt.md), lives at the repository root instead.
It describes the first build of the app rather than a reusable task, so do not move it here, where it would also become a slash command.
