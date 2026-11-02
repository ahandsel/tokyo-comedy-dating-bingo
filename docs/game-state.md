# Game state and persistence

The store in `src/composables/useGame.ts` holds the whole game as one reactive object.
`src/composables/useGameStorage.ts` saves it to LocalStorage and validates it strictly on load.


## State shape

```ts
interface GameState {
  version: number; // GAME_STATE_VERSION, currently 1
  phase: 'welcome' | 'playing' | 'results';
  questionOrder: string[]; // the 24 IDs dealt from the pool, shuffled once per game
  currentQuestionIndex: number; // 0-based position in questionOrder
  answers: Record<string, 'yes' | 'no'>; // keyed by question ID
  answerHistory: string[]; // IDs in the order answered, for undo
  boardQuestionIds: (string | 'free')[] | null; // 25 cells, generated after the last answer
}
```

Two more values live in the store but are not part of the saved state:

* `revealPending` is a ref set to `true` by `finish()` and cleared by the results screen after it has shown the reveal animation.
  Reopening a saved board from the welcome screen therefore skips the reveal and the confetti.
* `loadedCorruptedData` and `storageAvailable` drive the one-line notice on the welcome screen.
  `storageAvailable` is a plain boolean.
  `loadedCorruptedData` is a read-only ref that turns `false` when `start()` begins a new game, because the new save replaces the unreadable one.


## Store API

| Function           | Allowed in phase | Effect                                                                                     |
| ------------------ | ---------------- | ------------------------------------------------------------------------------------------ |
| `start()`          | any              | Replaces the state with a fresh `playing` game and deals 24 cards in a new shuffled order. |
| `resume()`         | `welcome`        | Goes to `results` if a board exists, to `playing` if an order exists, otherwise `start()`. |
| `answer(value)`    | `playing`        | Records the answer for the current card and advances. Returns `false` if ignored.          |
| `undo()`           | `playing`        | Pops the history, deletes that answer, and moves the index back. Returns the reopened ID.  |
| `setAnswer(id, v)` | `results`        | Edits one answer. The board arrangement is untouched; Bingo and stats recompute.           |
| `restart()`        | any              | Resets to the initial state and removes the saved game. The language preference survives.  |
| `goToWelcome()`    | any              | Switches the phase to `welcome` and keeps everything else, so the game can be resumed.     |
| `clearReveal()`    | any              | Marks the reveal animation as consumed.                                                    |

Derived values are computed refs: `currentQuestionId`, `upcomingQuestionIds` (the current card first), `answeredCount`, `remainingCount`, `canUndo`, `hasPausedGame`, `hasSavedResults`, `bingo` (a `BingoResult` or `null`), and `stats`.

`answer()` refuses a second answer for the same ID.
Together with the deck's leaving list (see [swiping.md](swiping.md)) this is the double-answer protection.


## Saving

A deep watcher with `flush: 'sync'` calls `storage.save(state)` after every mutation.
Synchronous flushing matters for `restart()`: the reset state is written first, then `storage.clear()` removes the key, so a reload after a restart starts clean instead of finding the reset state.

Saving swallows quota and permission errors.
If LocalStorage is missing or throws (for example some private-browsing modes), `safeLocalStorage()` returns `undefined`, the storage wrapper reports `available: false`, and the game keeps running in memory.


## Loading and validation

`parseGameState(raw)` accepts unknown JSON and returns a `GameState` or `null`.
It is deliberately strict: anything that could put the UI in an impossible position is rejected, and the game starts fresh with a notice.

Checks, in order:

1. `version` must equal `GAME_STATE_VERSION`.
2. `phase` must be one of the three phases.
3. `questionOrder` must hold 24 different question IDs from the pool, except for a fresh welcome state where it is empty.
4. `currentQuestionIndex` must be an integer from 0 to 24.
5. `answers` must be an object whose keys are question IDs and whose values are `yes` or `no`.
6. `answerHistory` must contain unique question IDs that all have answers.
7. `answerHistory` must hold exactly the answered IDs, in the same order as the start of `questionOrder`.
   Every answer starts as a swipe, so an answer outside the history would block its card, and a history out of order would make undo jump to the wrong card.
8. `boardQuestionIds` must be `null` or a valid board (25 cells, `free` at index 12, and 24 different question IDs).
9. A board requires all 24 answers.
   It must also hold exactly the IDs in `questionOrder`, so it shows only the cards this game dealt.
10. `results` requires a board.
11. `playing` requires no board.
12. Without a board, the index must be below 24, so the current card always exists, also when a paused game resumes.
13. Without a board, the history length must equal the index, so undo stays consistent.
14. A fresh welcome state must have no answers, no history, and no board.

Unknown extra properties are dropped; the loader rebuilds the object from the validated fields.

Change `GAME_STATE_VERSION` whenever the shape changes.
Old saves are then discarded safely rather than misread.


## Welcome-screen behaviour

* A `playing` game that was left via the back button is a **paused game**: the welcome screen offers "Continue game" and shows how many cards are answered.
* A `results` board that was left via the back button is a **saved board**: the welcome screen offers "View my board".
* When either exists, the start button reads "New game" instead of "Start swiping", and it asks for confirmation, because starting over discards them.
  The confirmation opens with focus on "Cancel", so a doubled or held Enter keeps the saved game.
  The "Play again" confirmation on the results screen works the same way.


## Storage keys

| Key                | Content                      | Cleared by       |
| ------------------ | ---------------------------- | ---------------- |
| `tcdb:game`        | The `GameState` JSON         | `restart()`      |
| `tcdb:preferences` | `{ "locale": "en" \| "ja" }` | Never by the app |

The two keys are independent, so restarting a game never resets the language.
