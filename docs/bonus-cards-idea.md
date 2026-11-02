# Bonus cards idea

This note proposes two bonus cards that give Tokyo Comedy Bar and Yurié Collins a shoutout inside the game, and it compares three ways to add them.
Option A is built: `q28` and `q29` are in the question pool in `src/data/questions.ts`.
Options B and C are not built, and they stay here as fallbacks if option A does not work out.
See "Status" for the checks that remain before the cards ship.
The results-screen shoutout that links to both is already built; see "Results screen" in [bingo-and-export.md](bingo-and-export.md).


## The two cards

| ID    | English                                  | Japanese                              |
| ----- | ---------------------------------------- | ------------------------------------- |
| `q28` | Date night at Tokyo Comedy Bar           | `Tokyo Comedy Barでデートした`        |
| `q29` | My date took me to Yurié's stand-up show | `デートでユリエ コリンズを観に行った` |

* The cards take the next free IDs after `q27`.
* The swipe cards show the Lucide `FaceGrinning` icon for `q28` and `Drama` for `q29`.
  `FaceGrinning` stands for laughing through a comedy night, and it joins the reaction faces on `q01`, `q25`, and `q26`.
  It is the closest Lucide has to a laughing face: `Laugh` is its old name, and neither Lucide 1.66.0 nor Lucide Lab has another one.
  The owner chose it over a hand-drawn laughing face.
  It replaced `Theater`, whose stage curtains read as a stage rather than as comedy or a date at card size.
  The cards do not use `Mic`, because `Mic` already stands for the results-screen shoutout, and they do not use `Wine`, because it looks too close to the `Martini` on `q08`.
* Both labels describe something the player did, so they fit the "swipe right if you experienced it" rule.
  A "No" answer works as a nudge to go.
* The two cards overlap.
  Yurié Collins performs Tokyo Hoe Tales at Tokyo Comedy Bar, so a player who saw that show on a date answers "Yes" to both.


### Wording notes

* The owner reworded the English label for `q29` from "Date took me to a Yurié Collins comedy show" to "My date took me to Yurié's stand-up show".
  It spells "stand-up" with a hyphen, as the results-screen shoutout does, and it uses a typographic apostrophe in `src/data/questions.ts`, as the other labels do.
  It names her by her first name only, so the full name appears only in the credits, the shoutout, and the share text.
* The Japanese name `ユリエ コリンズ` matches `creditName` in `src/i18n/locales/ja.ts` and the Japanese share text.
* The first Japanese draft for `q29`, `デートでユリエ コリンズのコメディショーに連れて行ってもらった`, has 31 characters, which is far too long for a board cell.
* The chosen label has 18 characters.
  It drops "took me" and keeps the point: the player went to see her on a date.
  `観に行った` already implies a performance, so the label does not need `コメディショー`.
* An earlier short draft, `デートでユリエ コリンズのショーに行った`, has 20 characters.
  It names the show, but it is longer than any Japanese label from `q01` to `q27`.


### Label length

* Before these cards, the longest Japanese labels in the pool were `q20` (19 characters, 6 of them Latin letters) and `q10` and `q23` (18 characters each).
* On a screen narrower than 420px, a board cell shows at most 3 lines of text (`.cell__text` in `src/components/BingoCell.vue`).
* `sizeClass` in the same file shrinks the font only for labels longer than 22 characters.
  It counts characters, not width, so a Japanese label of 22 characters or fewer keeps the largest font size and is the most likely to be cut off.
* The PNG export fits a label into at most 4 lines and cuts off one that still does not fit with "…" (`fitLines` in `src/utils/exportImage.ts`).
* The `q28` label has 22 characters, but 16 of them are the Latin letters and spaces of "Tokyo Comedy Bar", which are narrower and can wrap at the spaces.
* Check both labels in a swipe card, a board cell, and the PNG export on a phone before they ship.


## Options at a glance

| Option                  | Who sees the cards              | Bingo wins          | Saved games    | Size of the change                                       |
| ----------------------- | ------------------------------- | ------------------- | -------------- | -------------------------------------------------------- |
| A: add to the pool      | Each card in about 83% of games | Fewer               | Stay valid     | Two data entries, test updates, and two README edits     |
| B: bonus row on results | Every player, outside the board | Unchanged           | Discarded once | A separate card list, new saved state, and a new control |
| C: deal both every game | Every player, on the board      | Fewer in every game | Stay valid     | A `drawDeck` change and tests, and it breaks a game rule |


## Option A: add them to the question pool

Add the two cards to the pool, and let the game deal them like any other card.
`drawDeck` in `src/utils/board.ts` deals 24 cards at random from every question in `src/data/questions.ts`, and `q25` to `q27` joined the pool the same way.

Changes:

* Add the two entries under the fan additions comment in `src/data/questions.ts`.
* Update the pool size from 27 to 29 and the fan-made card checks in `src/tests/questions.test.ts`.
* In the README, list the new IDs as fan additions in "Credits", and update the pool size in the `questions.test.ts` entry under "Testing".

What stays the same:

* Swiping, the board, Bingo lines, the PNG export, and saved games need no code change.
* Old saves stay valid, because adding a card removes no ID from the pool, and `parseGameState` accepts any 24 different IDs that are still in the pool.

Effects:

* With 29 cards in the pool, a game deals each bonus card about 83% of the time (24 of 29) and both cards about 68% of the time.
  An average board holds about 1.7 bonus cards.
* Expect fewer Bingo wins.
  Only a "Yes" square or the free center counts toward a line (`isCellMarked` in `src/utils/bingo.ts`), and most players have probably done neither thing.
  A bonus card then usually lands as a "No" square that blocks its row, its column, and its diagonal if it sits on one: 2 or 3 of the 12 lines.
* A swipe card cannot hold a link, because the whole card is a swipe target.
  The results-screen shoutout already links to both, so every player still gets the links.


## Option B: a bonus row on the results screen

Show the two cards as a "Bonus squares" row below the board, styled like board squares but outside the 5x5 grid.

```text
        [ 5x5 Bingo board ]

+-----------------------------------------+
| Bonus squares                           |
|  +------------------+ +---------------+ |
|  | Date night at    | | My date took  | |
|  | Tokyo Comedy Bar | | me to Yurié's | |
|  |                  | | stand-up show | |
|  |    Yes / No      | |               | |
|  +------------------+ |   Yes / No    | |
|                       +---------------+ |
+-----------------------------------------+
```

Changes:

* The bonus cards cannot join the `questions` array, because `drawDeck` deals from every ID in it (`QUESTION_IDS`).
  Keep them in a separate list with its own ID check, so that the deck and `isQuestionId` never see them.
* Answering a bonus square needs new saved state: a field such as `bonusAnswers`, a `GAME_STATE_VERSION` bump, and a `parseGameState` update.
  Without saved state, the bonus answers would reset on every reload.
  Restarting the game must clear them.
* Each bonus square is a new control.
  It needs localized labels in `src/i18n/locales/en.ts` and `src/i18n/locales/ja.ts`, keyboard support, visible focus, and a "Yes" or "No" state that does not rely on color alone.
* The board is a `role="grid"` that moves focus with the arrow keys, and the bonus row sits outside it, so each bonus square needs its own Tab stop.
* `CellDetailModal` takes only the text, the answer, and two flags, not a board position, so a bonus square can reuse it to switch between "Yes" and "No".

Effects:

* Every player sees both cards in every game.
* The bonus squares never count toward Bingo lines, so the board rules and the Bingo odds stay the same.
* The version bump discards every saved game once, including a game in progress.

Open decisions:

* Whether a bonus "Yes" counts in the Yes and No totals and in the share text.
* Whether the PNG export draws the bonus row, or leaves it out as it leaves out the shoutout.


## Option C: deal both cards in every game

Reserve two deck slots for the bonus cards and deal the other 22 cards at random.

* Every player swipes both cards, and the board shuffle places them like any other card.
* This breaks the "dealt at random from the pool" game invariant in [AGENTS.md](../AGENTS.md), so it needs the owner's explicit approval, a `drawDeck` change, and new tests.
* Saved games stay valid, because the deck format does not change.
* Every board then shows the same two squares, which makes shared board images less varied.
* Every board also holds two likely "No" squares, so the drop in Bingo wins from option A applies to every game.


## Open questions

* Should every player see the cards (options B and C), or are most players enough (option A)?
* Are fewer Bingo wins acceptable (options A and C)?
* Which wording ships?
  English question labels are final once they ship, so settle both languages before the cards are added.
* Is Yurié Collins comfortable with a card that names her?
  The original 24 questions already belong to her, so ask her before a card uses her name.
* The cards name a real venue and a real performer.
  Keep the wording a fan shoutout, so it does not read as an advertisement or as a partnership next to the "Not affiliated" notice.


## Recommendation

Start with option A.
It needs only two data entries, test updates, and two README edits, and it follows the pool rules that `q25` to `q27` already use.
The results-screen shoutout already gives every player the links, so the cards do not need to carry them.

Move to option B if every player must see the cards, or if fewer Bingo wins is a problem.
Option B is a much larger change: a separate card list, new saved state, a new control in both languages, and a one-time reset of every saved game.


## Status

Done:

* The two cards are in the pool with the labels in "The two cards", and `q29` uses the 18-character Japanese label.
* `src/tests/questions.test.ts` checks the pool size of 29 and both labels in both languages.
* `src/tests/icons.test.ts` checks the swipe card artwork.
* The README lists `q25` to `q29` as fan additions in "Credits" and gives the pool size of 29 under "Testing".

Still to do before the cards ship:

1. Confirm the English labels, because they become final once they ship.
2. Ask Yurié Collins before the card that names her ships.
3. Check both cards in a swipe card, a board cell, and the PNG export on a phone, in both languages.

Every push to `main` deploys, so do not push these cards until the three checks are done.
