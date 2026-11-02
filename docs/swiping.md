# Swiping, keyboard, and mobile

Three files implement the swipe screen:

* `src/components/SwipeCard.vue` turns pointer input on one card into a `swipe` event.
* `src/components/SwipeDeck.vue` renders the stack, plays the exit and return animations, and is the single entry point for every way of answering.
* `src/views/GameView.vue` wires the deck to the store and owns the page-wide keyboard controls.


## SwipeCard: the gesture engine

The card listens to Pointer Events, which cover touch, mouse, and pen with one code path.

1. `pointerdown` on the interactive top card records the start point, captures the pointer so later events arrive even when the finger leaves the card, and starts a velocity sample list.
   Only the primary mouse button starts a drag, and a second pointer is ignored while one is active.
2. `pointermove` updates `dx` and `dy`.
   The card follows the finger: `translate(dx, dy * 0.4) rotate(dx * 0.06deg)`.
   The YES and NO stamps fade in with `dx / threshold`.
   While dragging the inline style sets `transition: none`, so the card tracks the finger with no lag.
3. `pointerup` decides.
   The card commits a swipe when either rule holds:
   * **Distance:** `|dx| >= threshold`, where the threshold is 35% of the card width, capped at 120px.
   * **Flick:** `|dx| >= 40px` and the velocity over the last 120ms is at least 0.5px per millisecond in the same direction.
     This rule lets a quick thumb flick on a phone count as a swipe.
4. `pointercancel` and `lostpointercapture` abort the drag without a decision.

After the decision `dx` and `dy` reset to zero.
If nothing was committed, removing the `transition: none` override lets the card's CSS transition snap it back.
If a swipe was committed, the deck marks the card as leaving and the same element transitions from wherever the finger released it to the off-screen position.

The interactive card sets `touch-action: none`.
With the previous `pan-y` value, iOS Safari treated any drag with a vertical component as a page scroll and fired `pointercancel`, so diagonal swipes snapped back.
The page can still scroll from anywhere outside the top card.

`committed` guards against a second decision for the same drag, and `onPointerDown` refuses to start a drag on a card that is already leaving.


### Text selection

The app leaves visible text selectable wherever the browser allows it, so a player can copy a question, translate it, look up a word, or have it read aloud.
On the top card, the same drag would both answer and select, so each input type gets one meaning:

* **Mouse and pen:** a drag moves the card.
  `onSelectStart` cancels `selectstart` while the drag is active, so the drag never highlights text.
  A double or triple click selects a word or the whole question, because `onMouseDown` sees a click count (`detail`) of 2 or more and calls `stopDrag()`, so that press never moves the card.
  A drag that starts on text that is already selected still moves the card.
* **Touch:** a drag never selects text, so `selectstart` is left alone, and a long press selects text as it does on any page.
  The card does not cancel `contextmenu` or set `-webkit-touch-callout: none`, so the long press can open the system menu with Copy.
  A finger that rests on the card long enough to count as a long press selects text instead of swiping.

The cards behind the top card (`card--behind`) and the YES and NO stamps set `user-select: none`.
The top card hides the first, and the second are invisible until a drag, so their text would only add noise to a select-all copy.

Buttons do not set `user-select: none`, but Chrome never starts a selection from a press inside a `<button>`, even with `user-select: text`.
A drag that starts outside a button, or a select-all, still includes its label.
The question on a board cell can also be selected in the cell detail dialog.


## SwipeDeck: the stack and the animations

The deck receives `questionIds` (the remaining IDs, current first) and renders a single `v-for` over a computed `cards` list:

* Up to three **stack** cards: depth 0 is interactive, depths 1 and 2 are scaled down and faded behind it via inline transforms.
* Any number of **leaving** cards in front of them.

The important detail is that a leaving card keeps its original key (the question ID).
Vue therefore patches the existing element and only changes its props, and the CSS transition on `.card` animates the transform from the drag position to `.card--leaving-left` or `.card--leaving-right`.
The earlier implementation rendered the leaving card under a new key, which remounted it already off screen, so the exit never animated.

Leaving cards are listed first and stack cards after them, so a swipe never reorders existing elements (a DOM move would also break the transition).
Each leaving entry has its own timer; after `EXIT_MS` (320ms, or 0 with reduced motion) it is removed.
Several cards can be in flight at once, so each card still animates out when the player answers quickly with the keyboard.

`swipe(direction)` is the one entry point:

1. Read the current ID from `questionIds[0]`.
2. Ignore the call if that ID is already leaving.
   Props only update on the next render, so a duplicate event in the same tick targets the same card and is dropped here.
3. Add the card to the leaving list and emit `answer`.

`playReturn(id, direction)` removes the undone card from the leaving list and sets a `returning` flag on the top card for `EXIT_MS`.
The card gets `.card--returning-left` or `.card--returning-right`, whose keyframe animation flies it in from the side it left on.
The card keeps its key, so the same element switches straight from leaving to returning.
Because the card is no longer leaving, a new swipe on it counts at once, even while its first exit timer is still pending.


## Keyboard controls

`GameView` registers one `keydown` listener on `window` while the game screen is mounted, so the keys work without focusing anything first.

| Key                   | Action |
| --------------------- | ------ |
| Right arrow           | Yes    |
| Left arrow            | No     |
| Down arrow, Backspace | Undo   |
| Ctrl+Z or Cmd+Z       | Undo   |

Rules:

* `event.repeat` is ignored, so holding a key answers one card, not thirty.
* Keys are ignored while a `<dialog>` is open or while focus is in a text field.
* Other modifier combinations are left to the browser.
* The handled keys call `preventDefault()`, so Backspace never navigates back.

The hint under the deck shows the shortcuts only on devices with a fine pointer and hover, via a media query, because they are not useful on a phone.
The deck's `aria-label` describes the same keys for screen-reader users.


## Buttons

`SwipeControls` emits `no`, `yes`, and `undo`.
`GameView` routes the first two through `deck.swipe()` so the card animates exactly as it does for a gesture, and routes `undo` through `onUndo`, which also plays the return animation.


## Mobile and iPhone notes

* The swipe screen is designed to fit a phone viewport without scrolling.
  The deck is a flex item with `min-height: 240px` and `max-height: min(480px, 58dvh)`, so it shrinks on short screens (iPhone SE) and grows on tall ones.
* `100dvh` sizes the app to the visible viewport as Safari's toolbars collapse; a `@supports` fallback uses `vh` on old browsers.
* `touch-action: manipulation` on `body` removes the double-tap zoom delay while keeping pinch zoom.
* `-webkit-tap-highlight-color: transparent` stops the grey tap flash on cards and buttons.
  A long press on a card selects its text, as described in "Text selection".
* `env(safe-area-inset-*)` padding keeps content clear of the notch and the home indicator; `viewport-fit=cover` in `index.html` enables it.
* Buttons are at least 44px tall, including the language switcher.
* The modal uses the native `<dialog>` (iOS 15.4 and newer) with `max-height: 90dvh` and internal scrolling.
* Reduced motion (`prefers-reduced-motion: reduce`) sets all transitions to near zero, skips the reveal delay, and skips confetti.


## Tests

`src/tests/swipe.test.ts` covers gestures, the store rules, the double-event guard, the preserved element during the exit animation, the leaving-to-returning switch on undo, a new answer right after an undo, and the flick rules with fake timers.
It also covers which events the card cancels for text selection, but jsdom cannot select text, so check selection itself in a real browser and on a phone.
`src/tests/keyboard.test.ts` covers the page-wide keys, key repeat, modifiers, listener cleanup, and the board's arrow-key navigation.
jsdom has no `PointerEvent` constructor, so `helpers.ts` builds a `MouseEvent` and defines the pointer properties on it.
