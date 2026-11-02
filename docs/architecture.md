# Architecture

Tokyo Comedy Dating Bingo is a single-page Vue 3 app with no router, no backend, and no global state library.
Everything the game needs lives in the browser: a reactive store, LocalStorage, and a canvas for the export image.


## Phases and views

The game is a state machine with three phases, stored in `GameState.phase`:

| Phase     | View                        | What the player does                                              |
| --------- | --------------------------- | ----------------------------------------------------------------- |
| `welcome` | `src/views/WelcomeView.vue` | Reads the rules, picks a language, starts or resumes a game.      |
| `playing` | `src/views/GameView.vue`    | Answers 24 cards by swiping, pressing buttons, or using the keys. |
| `results` | `src/views/ResultsView.vue` | Sees the 5x5 board, edits answers, exports or shares the image.   |

`src/App.vue` maps the phase to a view and wraps the switch in a `<Transition>` so the views cross-fade.
The phase is the only thing `App.vue` reads.
Every view calls `useGame()` to get the same store instance.


## Data flow for one swipe

1. The player drags the top `SwipeCard` past the threshold, flicks it, presses a `SwipeControls` button, or presses an arrow key.
2. All four paths end in `SwipeDeck.swipe(direction)`.
   The deck records the card as "leaving" (so its exit animation can play) and emits `answer`.
3. `GameView.onAnswer` converts the direction to an answer (`right` = `yes`, `left` = `no`) and calls `game.answer(value)`.
4. The store writes the answer under the question ID, pushes the ID onto the undo history, and advances `currentQuestionIndex`.
   After the 24th answer it generates the board and switches the phase to `results`.
5. A synchronous deep watcher in the store saves the whole state to LocalStorage after every mutation.
6. The deck's `questionIds` prop shrinks on the next render, the next card becomes interactive, and a live region announces the answer for screen readers.

Undo is the same path in reverse: `GameView.onUndo` calls `game.undo()`, then asks the deck to play the "card flies back" animation in the direction the card originally left.


## Layers

| Layer      | Folder             | Responsibility                                                               |
| ---------- | ------------------ | ---------------------------------------------------------------------------- |
| Data       | `src/data/`        | The 24 questions with stable IDs and EN/JA text.                             |
| Types      | `src/types/`       | `GameState`, `Answer`, `BoardCellId`, `BingoResult`, and the message schema. |
| Pure logic | `src/utils/`       | Shuffle, board generation, winning-line evaluation, canvas export.           |
| Store      | `src/composables/` | The reactive game store, LocalStorage persistence, and locale helpers.       |
| i18n       | `src/i18n/`        | Vue I18n setup, locale detection, and the EN and JA catalogues.              |
| Components | `src/components/`  | Reusable pieces: swipe card and deck, controls, board, cells, dialogs.       |
| Views      | `src/views/`       | One component per phase, composed from the components above.                 |
| Tests      | `src/tests/`       | Vitest suites for every layer, plus helpers for mounting the app with i18n.  |

The pure logic layer never imports Vue and never sees translated text.
It works on question IDs only, which is what makes language switching safe at any point in the game (see [i18n.md](i18n.md)).


## Key design decisions

* **Question IDs are the only keys.**
  Answers, the shuffled order, and the board arrangement all store IDs such as `q07`.
  Text is looked up at render time for the current locale.
* **One store, created lazily.**
  `useGame()` returns a module-level singleton built by `createGameStore()`.
  Tests call `createGameStore()` directly with an in-memory storage and a seeded random source, and `resetGameStore()` between tests.
* **State is exposed read-only.**
  The store returns `readonly(state)`, so views can only change the game through the store's named functions.
* **Animations are CSS; timing lives in one place.**
  Components only toggle classes and inline transforms.
  `SwipeDeck` owns the single `EXIT_MS` timer constant.
  It matches the 320ms return animation in `SwipeCard.vue`, and it must be at least the 280ms exit transition there, so a leaving card is removed only after it has left.
* **Native platform features first.**
  The modal uses the native `<dialog>` element, sharing uses the Web Share API with a download fallback, and gestures use Pointer Events instead of a library.


## Folder layout

```text
src/
  App.vue                      phase to view mapping
  main.ts                      creates i18n with the saved or detected locale, mounts the app
  style.css                    theme tokens, typography, shared buttons, motion preferences
  components/
    SwipeCard.vue              one card: pointer gestures, flick detection, stamps, exit and return CSS
    SwipeDeck.vue              the stack, the leaving list, the undo animation, the swipe() entry point
    SwipeControls.vue          No, Undo, and Yes buttons
    ProgressIndicator.vue      "Question n of 24" and the progress bar
    BingoBoard.vue             5x5 grid with arrow-key navigation
    BingoCell.vue              one square with marked, free, and winning states
    ResultSummary.vue          Bingo or No Bingo heading and the three statistics
    CellDetailModal.vue        tap a square: full text, answer, winning status, change answer
    ConfirmDialog.vue          confirmation before discarding a game
    ModalDialog.vue            accessible <dialog> wrapper
    LanguageSwitcher.vue       English | 日本語
  composables/
    useGame.ts                 the store and all game rules
    useGameStorage.ts          LocalStorage wrapper with strict validation
    useLocale.ts               locale switching, preference saving, <html lang> and title
  data/questions.ts            the 24 bilingual questions
  i18n/                        createI18n, detection, preference storage, locales/en.ts, locales/ja.ts
  types/                       game.ts and i18n.ts
  utils/                       shuffle.ts, board.ts, bingo.ts, exportImage.ts
  tests/                       Vitest suites, setup.ts, helpers.ts
```
