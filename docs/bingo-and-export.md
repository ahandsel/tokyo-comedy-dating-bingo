# Bingo engine and image export

The Bingo logic is pure TypeScript in `src/utils/`.
It knows nothing about Vue or about the current language.


## Board generation (`utils/board.ts`)

* `BOARD_SIZE` is 5, `CELL_COUNT` is 25, and `CENTER_INDEX` is 12 (row 2, column 2, zero-based).
* `generateBoard(questionIds, random)` shuffles the 24 IDs with Fisher-Yates and places them around the `free` marker at index 12.
  It throws if it does not receive exactly 24 unique IDs.
* `isValidBoard(value)` is the structural check used when loading a saved game.
* `indexToRowCol` and `rowColToIndex` convert between flat indices and coordinates.

The board is generated once, right after the 24th answer, with a shuffle that is independent of the swipe order and of the answers.
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


## Tests

* `src/tests/board.test.ts` - shuffle, structure, independence from answers and order, stability across reloads and edits.
* `src/tests/bingo.test.ts` - every line type, the free centre, all NO, all YES, overlapping wins, four in a row.
* `src/tests/export.test.ts` - tokenizing, wrapping, drawing all 25 cells in both languages, the icon marks and their match with `@lucide/vue`, the share fallback.
