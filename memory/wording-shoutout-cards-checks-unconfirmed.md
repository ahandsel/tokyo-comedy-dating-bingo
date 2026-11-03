# The q28 and q29 shoutout cards shipped with two checks unconfirmed

* Type: Wording
* Added: 2026-11-03
* Source: a 2026-11-03 Claude Code session that built option A of `docs/bonus-cards-idea.md`, which added `q28` and `q29` to `src/data/questions.ts` in commit `dfe7241` and then deleted the note; the note's comparison of the three options is in the git history

`q28` ("Date night at Tokyo Comedy Bar") and `q29` ("My date took me to Yurié's stand-up show") were pushed to `main` on 2026-11-03, so they are live, and their English labels are now final under the rule in AGENTS.md.
The deleted note listed two more checks before the cards ship, and the session that built them did not see either one confirmed:

1. Yurié Collins agrees to a card that names her.
2. Both cards look right on a real iPhone in Safari, in a swipe card, a board cell, and the PNG export, in both languages.
   A headless Chrome check at iPhone widths of 375px and 430px on 2026-11-03 showed both labels in full on the swipe cards and in the PNG export, in both languages.
   In a board cell at 375px, both labels are cut off in both languages, as most labels in the pool are.
   At 430px, the English labels fit, and the Japanese labels lose their last characters, as the six longest older Japanese labels do.
   Safari can wrap and clip text differently from Chrome, so the check on a real iPhone is still open.

Wording decisions for `q29`:

* The owner reworded the English label from "Date took me to a Yurié Collins comedy show".
  It names her by her first name only, so do not restore the full name.
* "stand-up" takes a hyphen, as in the results-screen shoutout.
* The Japanese label `デートでユリエ コリンズを観に行った` keeps her full name, which matches `creditName` in `src/i18n/locales/ja.ts`, and it drops "took me" to fit a board cell in 18 characters.

How to apply: treat the two checks as open questions until the owner confirms them, then remove them from this memory.
