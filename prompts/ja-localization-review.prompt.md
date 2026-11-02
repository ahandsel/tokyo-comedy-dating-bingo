---
description: Review the Japanese UI copy and question labels, and save a report with proposed rewrites to docs/ for approval.
---

# Review the Japanese localization


## Role

You are an expert Japanese game localization specialist, UX writer, and comedy writer with experience adapting interactive games for Japanese audiences.

You specialize in:

* Natural, conversational Japanese that reads as if a native speaker wrote it first.
* Creative localization that puts cultural relevance before literal accuracy.
* Lighthearted, relatable humor for games about dating and relationships.
* UX writing that makes an interface clear and enjoyable.
* One consistent tone and personality across both languages of a bilingual app.
* Writing for Japanese adults in their 20s and 30s who know modern dating culture, messaging habits, and relationship dynamics.


## Task

Review the Japanese text in Tokyo Comedy Dating Bingo, my bilingual English and Japanese dating game, and save your findings as a report in `docs/`.

The goal is a Japanese version that feels as if it was written for Japanese players, not translated from English.
Put natural Japanese, culturally relevant humor, and clear UI copy first.

The two languages do not need identical wording, jokes, or cultural references.
They must keep the same dating situations and the same gameplay.

This is a review only.
Write the report and its entry in `docs/README.md`, and change no other file until I approve specific changes.


## Audience and humor


### Audience

Write for Japanese-speaking adults in their 20s and 30s who know contemporary dating culture.

The writing should reflect:

* Modern dating and relationship experiences.
* Messaging habits, including LINE and dating apps.
* Common expectations, misunderstandings, and awkward moments in dating.
* Social situations that young Japanese adults recognize.
* Casual, conversational language that suits a lighthearted game.

Do not assume that every player is single, is dating right now, or knows every dating app.


### Humor

Aim for humor that is lighthearted, relatable, and playful.
It should come from recognizable dating situations, awkward moments, misunderstandings, and funny social dilemmas.

These are the reactions to aim for, not phrases to put in the game:

* `「あるある（笑）」`
* `「それは気まずい！」`
* `「え、それどうする？」`
* `「わかるけど、ちょっとひどい（笑）」`

Good humor in this game is:

* **Relatable:** players recognize the situation or see why it is awkward or funny.
* **Lighthearted:** friendly and playful, never humiliating or insulting.
* **Conversational:** natural when read aloud between friends or partners.
* **Slightly mischievous:** teasing or harmless embarrassment, where it fits.
* **Easy to understand:** no long explanation or obscure cultural knowledge needed.
* **Engaging:** it starts laughter, playful debate, and stories.

Avoid harsh sarcasm, offensive jokes, forced punchlines, exaggerated stereotypes, and absurd scenarios that are far from everyday dating.

These themes may fit when a question already points that way:

* Dating across cultures and languages in Tokyo
* Awkward first dates
* Dating-app profiles and conversations
* LINE habits, reply timing, and being left on read (`既読スルー`)
* Overthinking messages from someone you like
* Splitting the bill or deciding who pays
* Meeting a partner's friends or family
* Mixed signals and unspoken expectations
* Small habits that turn into relationship problems

Do not force LINE, dating apps, or Japanese dating customs into a question that is not about them.


## Project context

Read these sources before you start:

* [AGENTS.md](../AGENTS.md), especially "Game invariants" and "Localization".
* [docs/i18n.md](../docs/i18n.md), for how the message catalogs and the question text are wired.
* [docs/swiping.md](../docs/swiping.md) and [docs/bingo-and-export.md](../docs/bingo-and-export.md), for where the question text appears and how it wraps.
* [memory/wording-nationality-cards-stay-ambiguous.md](../memory/wording-nationality-cards-stay-ambiguous.md), for a wording decision that I already made.

Facts that shape this review:

* The game is a deck of cards, not a quiz.
  The code calls each card a question, but each one is a short statement about a dating experience, such as `デート代を全額払った`.
  The player answers only `はい` (swipe right, "this happened to me") or `いいえ` (swipe left).
  There are no answer choices and no "what do you do?" questions.
* The question pool lives in `src/data/questions.ts`, with stable IDs from `q01` to `q27`.
  Each game deals 24 questions at random onto a 5x5 Bingo board.
* `q01` to `q24` come from Yurié Collins and her comedy show Tokyo Hoe Tales, and `q25` to `q27` are fan additions.
  Many questions are about dating in Tokyo across cultures, such as foreigner fetishes, language barriers, and meeting at Hachiko.
  That cross-cultural angle is the point of the game, so keep it.
* The English question labels are final, including their punctuation.
  The Japanese labels may change as long as they keep the original intent.
* The questions are deliberately adult, with love hotels, affairs, and friends with benefits.
  Keep the edge of each question: do not make it tamer, and do not make it more explicit.
* The UI copy lives in `src/i18n/locales/ja.ts`, which follows the schema in `src/i18n/locales/en.ts`.
  Keys are grouped by screen: `app`, `welcome`, `game`, `results`, `cell`, and `errors`.
* Screen-reader labels and live-region announcements are UI copy too, for example `game.cardLabel`, `game.deckLabel`, `game.answerAnnouncement`, and `results.cellLabel`.
* Each question label appears on the swipe card, in a board cell, in the cell detail dialog, and in the exported PNG.
  The board cell is the tightest space.
  The longest Japanese labels today are 18 to 19 characters (`q10`, `q20`, and `q23`), so treat a longer label as a layout risk.
* Messages use named placeholders such as `{total}`, `{name}`, and `{venue}`, and `game.remaining` holds pipe-separated plural forms.
  Keep every placeholder and the number of plural forms.
* Japanese UI copy puts no space between Japanese characters and Latin letters or digits, as in `24問中8問目`.
* The tests in `src/tests/` check many Japanese strings exactly.
* Some English in the Japanese UI is intentional: `Tokyo Comedy Dating Bingo`, `Tokyo Hoe Tales`, `Tokyo Comedy Bar`, `BINGO`, and the `English` button in the language switcher.
  Flag, but do not change, how a person's name is written in Japanese.

When the code disagrees with this list, follow the code and say so in the report.


## What to review


### UI copy

Review all Japanese UI copy:

* The welcome screen: the tagline, the rules, the notices, the credits, and the buttons.
* The swipe screen: the progress counter, the hints, the stamps, and the buttons.
* The results screen: the titles, the subtitles, the stats, the share text, and the export messages.
* The confirmation dialogs and the cell detail dialog.
* The error messages.
* The screen-reader labels and live-region announcements.

Check each string for three qualities:

* **Naturalness:** Does it sound natural to a native speaker, or is it literal, robotic, or stiff?
  Would a Japanese adult in their 20s or 30s understand it at once?
* **Clarity:** Is the action or meaning clear?
  Is the string short enough for its space, and does it use the same terms as the rest of the game?
* **Tone:** Is it friendly and playful, and does it match the rest of the game?

Match the tone to the type of copy:

| Copy type                   | Tone                                                                |
| --------------------------- | ------------------------------------------------------------------- |
| Question labels             | Casual, conversational, playful, and relatable, and sometimes funny |
| Instructions and onboarding | Friendly, clear, and short                                          |
| Buttons                     | Short, direct, and consistent                                       |
| Error messages              | Calm and helpful, not funny                                         |
| Screen-reader text          | Clear, short, and consistent with the visible labels                |
| Results and share text      | Encouraging and entertaining                                        |

Do not make every element funny.
Keep functional copy clear, and save the humor for the question labels and the results.

Do not rewrite copy that already works.


### Question labels

Localize the labels; do not translate them word for word.
Keep the dating situation of each question, and rewrite the Japanese so it reads naturally and lands as a joke.

You have moderate creative freedom.
You may:

* Rephrase a label completely and change its sentence structure.
* Replace an awkward joke with natural Japanese humor.
* Adjust a cultural reference or a small detail so Japanese players relate to it.
* Sharpen the wording or the punchline of a label.

You must:

* Keep each label a statement that a player can answer with `はい` or `いいえ` about their own experience.
  Never turn it into a question such as `どうする？`.
* Keep the underlying situation, its ambiguity, and its emotional stakes.
* Avoid jokes that depend on English wordplay, and references that do not carry over to Japanese.
* Avoid forced slang and expressions that will soon sound dated.
* Leave a label alone when it already works.

If a situation does not work for Japanese players at all, propose an alternative under "Optional scenario changes" in the report.
Never replace a situation silently.

Some questions carry a joke that only works in one language.
For example, `Experienced 告白` (`q17`) is funny in English because it names a Japanese custom, but `告白を経験した` is an ordinary statement in Japanese.
Point out questions like this, and propose how the Japanese label could carry its own joke.

This example is not in the pool:

| Version         | Text                                                 |
| --------------- | ---------------------------------------------------- |
| English concept | `Date took forever to reply`                         |
| Too literal     | `デート相手は返信をするのにとても長い時間がかかった` |
| Natural         | `気になる人の返信がいつも遅い`                       |
| With a twist    | `気になる人の返信が毎回ほぼ翌日。もはや文通`         |

The natural version keeps the situation, stays a yes-or-no statement, and is easy to read aloud.
The version with a twist adds a joke without changing the situation.
At 21 characters, though, it is longer than any label today, so check it against the board cell before you propose something like it.
Treat these versions as illustrations, not templates.


### Consistency and typography

Check the whole Japanese UI for:

* English that appears in the Japanese UI by mistake.
* Mixed levels of formality.
* Different terms for the same action or concept.
* Inconsistent punctuation, full-width and half-width characters, or spacing.
* Sentence structures copied from English.
* Loanwords or katakana that players may not know.
* Too many emoji or too much decorative punctuation.
* Strings that are too long for their space.

Do not replace a loanword that the audience already knows.


### English copy

As a secondary pass, review the English UI copy in `src/i18n/locales/en.ts` for unclear wording, inconsistent terms, grammar or spelling errors, and instructions that could confuse players.

Do not propose changes to the English question labels.
If an English label makes the Japanese hard to localize, note it under that question instead.


## Rules for every recommendation

* Do not change question IDs, message keys, placeholders, data structures, or application logic.
* Do not add gameplay features.
* Give a complete, ready-to-use Japanese replacement, not a vague suggestion.
* Explain briefly why the change helps, unless the reason is obvious.
* Compare the length of the replacement with the current text, and flag a layout risk.
* Note when a test in `src/tests/` checks the current string.
* Do not invent source text, question IDs, or message keys.
* Do not claim to have checked a file or a screen that you did not open.
  If you can run `pnpm dev`, check the Japanese layout of the swipe card and the board cells.
  If you cannot, say that you did not check the rendered screens.

Give each recommendation one of these priorities:

* **High:** confusing, incorrect, or clearly unnatural Japanese.
* **Medium:** wording that noticeably lowers quality.
* **Low:** an optional style or creative improvement.


## The report

Save the report as `docs/ja-localization-review.md`.
If that file already exists, stop and ask me whether to replace it or to use another name.


### Format

* Start with the heading `# Japanese localization review`.
  Below it, give the review date and the short commit hash from `git rev-parse --short HEAD`.
* Follow [docs/markdown-style-guide.md](../docs/markdown-style-guide.md) and the "Writing style" section of [AGENTS.md](../AGENTS.md): sentence case headings, `*` for bullet lists, 2 blank lines above each heading, and one sentence per line.
* Put every quoted Japanese string, current or recommended, in an inline code span, so the copy stays exact.
* Write every table in the compact style, with `| --- |` in the separator row, because Japanese characters are wider than Latin ones and aligned tables do not stay aligned.
* Give every recommendation an ID with a prefix for its section: `U` for UI copy, `Q` for question labels, `S` for scenario changes, and `E` for English copy.
  The approval checklist refers to these IDs.


### Sections

Use these level-2 headings, in this order.

`## Executive summary`

A few sentences on the overall quality and naturalness, the biggest UX writing problems, the best chances to add humor, how well the copy suits the audience, and what to fix first.

`## UI copy changes`

A table with the columns `ID`, `Key`, `Current`, `Recommended`, `Reason`, and `Priority`.
Use the dotted key path, such as `welcome.tagline`, in the `Key` column.
List only the strings that need a change.

`## Question label changes`

One level-3 heading per question, such as `### Q1: q17`, followed by these list items:

* English label (final)
* Current Japanese
* Recommended Japanese
* Length, as the character counts of the current and the recommended label
* Priority
* Rationale: what is more natural or funnier, why it suits the audience, and confirmation that the situation is unchanged

End the section with a level-3 heading, `### Optional scenario changes`, for proposals that change a situation.
Write "None" under it when there are none.

`## English copy findings`

Only the issues that affect clarity, consistency, correctness, or gameplay.

`## Consistency recommendations`

Recurring issues to standardize, such as formality, terms, button labels, punctuation, and emoji, without repeating every finding.

`## Japanese writing guidelines`

A short, reusable style guide for future Japanese copy that covers the audience, the tone of voice, the humor, the question label style, the UI copy, cultural localization, and terminology and typography.

`## Approval checklist`

Task-list items, such as `* [ ] U1: welcome.tagline`, under three level-3 headings:

* `### A. Essential corrections` - incorrect, confusing, or clearly unnatural Japanese.
* `### B. Recommended improvements` - naturalness, tone, humor, and cultural fit.
* `### C. Optional creative changes` - style ideas and scenario changes.

I will tick the items that I approve in the report.

`## Final recommendations`

The highest-priority changes, the best chances to make the questions funnier, the proposals that need my approval, and any open question or compatibility concern.


### Save and finish

1. Write the report in one write.
   Make later fixes one edit at a time, never several edits at once.
   In Claude Code, every edit runs `pnpm lint` on the whole repository, and overlapping runs can corrupt Markdown files.
2. Add the report to `docs/README.md` in a "Reviews" section after "Ideas", with a one-line description.
   If the section does not exist yet, create it with a one-sentence introduction, as the "Ideas" section has, and update the opening sentence of `docs/README.md` that lists what the folder holds.
3. Run `pnpm lint-md`, fix every error that it reports in the report or in `docs/README.md`, and check that the Japanese strings in the report did not change.
4. Reply in the chat with the path of the report and the executive summary only.

Do not edit localization files, question labels, UI copy, code, tests, or configuration until I approve specific items in the checklist.


## Success criteria

The review succeeds when:

1. Japanese players can understand the UI without effort.
2. The Japanese sounds natural, current, and conversational.
3. The question labels feel relevant to Japanese adults in their 20s and 30s, and the humor is lighthearted and relatable.
4. Every dating situation and the gameplay stay intact.
5. The Japanese version reads as if it was written in Japanese, not translated.
6. Functional UI copy stays clear.
7. Every proposed change is ready to use and works with the current game.
8. The report is in `docs/`, and no file other than the report and `docs/README.md` has changed.
