# Bingo engine and image export

The Bingo logic is pure TypeScript in `src/utils/`.
It knows nothing about Vue or about the current language.


## Board generation (`utils/board.ts`)

* `BOARD_SIZE` is 5, `CELL_COUNT` is 25, `CENTER_INDEX` is 12 (row 2, column 2, zero-based), and `DECK_SIZE` is 24.
* `drawDeck(pool, random)` deals the cards for one game: 24 different IDs drawn at random from the question pool, already in swipe order.
  It throws if the pool holds fewer than 24 unique IDs.
* `generateBoard(questionIds, random)` shuffles the 24 dealt IDs with Fisher-Yates and places them around the `free` marker at index 12.
  It throws if it does not receive exactly 24 unique IDs.
* `isValidBoard(value)` is the structural check used when loading a saved game.
* `indexToRowCol` and `rowColToIndex` convert between flat indices and coordinates.

The board is generated once, right after the 24th answer, with a shuffle that is independent of the swipe order and of the answers.
The game store puts the dealt IDs back in pool order before it calls `generateBoard`, so the swipe order cannot leak into the board.
It is stored as IDs in `GameState.boardQuestionIds` and never regenerated: editing an answer or switching language keeps every square where it is.


## Winning lines (`utils/bingo.ts`)

`WINNING_LINES` is built once: five rows, five columns, and two diagonals, each a list of five flat indices.

`evaluateBoard(board, answers)`:

1. Marks a cell when it is `free` or its answer is `yes`.
2. Keeps every line whose five cells are all marked.
3. Returns a `BingoResult` with `hasBingo`, the `winningLines`, the deduplicated sorted `winningCellIndices`, and `totalWinningLines`.

Four marked cells in a line are not a Bingo.
All 24 YES answers give 12 lines.
The free centre is never counted in the YES total shown in the statistics; it only helps complete lines.


## Shuffle (`utils/shuffle.ts`)

`shuffle(items, random)` is an immutable Fisher-Yates that takes an injectable random source.
`seededRandom(seed)` is a small mulberry32 generator so tests get the same board every run.


## Results screen

`ResultsView` reads `game.bingo` and `game.stats`, both computed from the store, so editing an answer in the cell dialog updates the heading, the statistics, and the gold winning-line outlines at once.

`BingoBoard` builds a `CellView` per square (text for the current locale, marked, winning) and renders five rows of `BingoCell` buttons inside a `role="grid"`.
Arrow keys, Home, and End move focus between cells.
Tapping a cell opens `CellDetailModal`, which shows the full text and offers "Change to Yes" or "Change to No".
The dialog opens with focus on "Close", so when the Enter press that opened it repeats, it closes the dialog instead of changing the answer.

After the reveal, a shoutout card below the status line points players to Yurié Collins's live shows and to Tokyo Comedy Bar.
It renders `results.shoutout` with `I18nT`, and the `{name}` and `{venue}` slots each hold a `CreditLink`.
The card sits below the status line so that export and share messages stay next to the buttons.
It is not part of the PNG export.


## Image export (`utils/exportImage.ts`)

`drawBoardImage(ctx, options)` draws the whole card on a 2D context.
It is a pure function of its options, which is what the tests exercise with a fake context.

* The canvas is 1080px wide; the height is derived from the header, board, statistics, and footer bands.
* Every string comes in through `ExportLabels`, already translated by the caller, plus a `getText(id)` callback for question labels.
  The export therefore matches the language selected on screen.
* `tokenize` splits English on spaces and CJK characters one by one, and `wrapText` greedily wraps with a `measure` callback.
  A word wider than the line is split by character, whether it starts the line or follows another word.
  `fitLines` shrinks the font step by step until the text fits the allowed number of lines, then adds an ellipsis as a last resort.
* Marked cells are rose, the free centre is berry, and winning cells get a double gold outline and a star.
* The check, cross, heart, and star marks are the same Lucide icons that the board and the statistics show on screen.
  `src/utils/` must not import Vue, so the module copies their SVG path data into `EXPORT_ICON_PATHS` and draws each one with `Path2D`.

`renderBoardImage(options)` waits for `document.fonts` (Noto Sans JP and Pacifico), sets the canvas `lang` attribute so CJK glyph selection is correct, draws, and returns a PNG `Blob`.

`shareOrDownload(blob, filename, payload)` uses the Web Share API when `navigator.canShare` accepts a file (mobile Safari, Chrome on Android, macOS Safari).
Dismissing the share sheet returns `cancelled`; any other failure, or no file support, falls back to `downloadBlob`, which clicks a temporary `<a download>` link.
The Share button is only rendered when `canShareFiles()` is true.
The share text ends with a link to the game: `appUrl()` in `ResultsView.vue` takes the page address and drops any query or fragment, so no answers can travel with it.
The link goes in the text rather than in the `url` field of the share data, because many apps drop that field when the share also carries a file.

`saveImage(blob, filename)` backs the "Save image" button.
On an iPhone or iPad, a download lands in the Files app, so `saveImage` opens the share sheet with only the image instead, and its first action, "Save Image", adds the image to Photos.
It sends no title or text, because extra text can hide that action.
`isAppleMobile()` detects the device from the user agent, and it also treats a Mac user agent with a touch screen as an iPad, because iPadOS reports itself as a Mac.
Everywhere else, and whenever the share sheet is unavailable or fails, `saveImage` calls `downloadBlob`.
Dismissing the share sheet returns `cancelled`, and the status line then says that the image was not saved.


## Tests

* `src/tests/board.test.ts` - shuffle, dealing, structure, independence from answers and order, stability across reloads and edits.
* `src/tests/bingo.test.ts` - every line type, the free centre, all NO, all YES, overlapping wins, four in a row.
* `src/tests/export.test.ts` - tokenizing, wrapping, drawing all 25 cells in both languages, the icon marks and their match with `@lucide/vue`, the share fallback, and saving to Photos on an iPhone.
