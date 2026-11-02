# The owner reworded the q13 and q17 English labels

* Type: Wording
* Added: 2026-11-02
* Source: a 2026-11-02 Claude Code session where the owner asked to change `q13` and `q17` in `src/data/questions.ts`

AGENTS.md calls the English labels final, but the owner approved two changes:

* `q13` changed from "Unplanned visit to a military base" to "Visited a military base".
  The Japanese label dropped `なりゆきで` to match and is now `軍の基地に行った`.
* `q17` changed from "Experienced 告白" to "Experienced 告白 (kokuhaku)", so English readers can say the word.

[start-prompt.prompt.md](../start-prompt.prompt.md) still lists the old labels, and its acceptance checklist still expects "Unplanned visit to a military base".

How to apply: treat the labels in `src/data/questions.ts` as canonical.
Do not restore the spec wording, and do not report the difference as a defect in an audit.
