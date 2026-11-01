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
     This is what makes a quick thumb flick feel right on a phone.
4. `pointercancel` and `lostpointercapture` abort the drag without a decision.

After the decision `dx` and `dy` reset to zero.
If nothing was committed, removing the `transition: none` override lets the card's CSS transition snap it back.
If a swipe was committed, the deck marks the card as leaving and the same element transitions from wherever the finger released it to the off-screen position.

The interactive card sets `touch-action: none`.
With the previous `pan-y` value, iOS Safari treated any drag with a vertical component as a page scroll and fired `pointercancel`, so diagonal swipes snapped back.
The page can still scroll from anywhere outside the top card.

`committed` guards against a second decision for the same drag, and `onPointerDown` refuses to start a drag on a card that is already leaving.


## SwipeDeck: the stack and the animations

The deck receives `questionIds` (the remaining IDs, current first) and renders a single `v-for` over a computed `cards` list:

* Up to three **stack** cards: depth 0 is interactive, depths 1 and 2 are scaled down and faded behind it via inline transforms.
* Any number of **leaving** cards in front of them.

The important detail is that a leaving card keeps its original key (the question ID).
Vue therefore patches the existing element and only changes its props, and the CSS transition on `.card` animates the transform from the drag position to `.card--leaving-left` or `.card--leaving-right`.
The earlier implementation rendered the leaving card under a new key, which remounted it already off screen, so the exit never animated.

Leaving cards are listed first and stack cards after them, so a swipe never reorders existing elements (a DOM move would also break the transition).
Each leaving entry has its own timer; after `EXIT_MS` (320ms, or 0 with reduced motion) it is removed.
Several cards can be in flight at once, which is what makes rapid keyboard answering look right.

`swipe(direction)` is the one entry point:

1. Read the current ID from `questionIds[0]`.
2. Ignore the call if that ID is already leaving.
   Props only update on the next render, so a duplicate event in the same tick targets the same card and is dropped here.
3. Add the card to the leaving list and emit `answer`.

`playReturn(direction)` sets a `returning` flag on the top card for `EXIT_MS`.
The card gets `.card--returning-left` or `.card--returning-right`, whose keyframe animation flies it in from the side it left on.
If the undone card is still in the leaving list, the stack entry wins in the render list, so the same element switches straight from leaving to returning.


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

The hint under the deck shows the shortcuts only on devices with a fine pointer and hover, via a media query, because they are noise on a phone.
The deck's `aria-label` describes the same keys for screen-reader users.


## Buttons

`SwipeControls` emits `no`, `yes`, and `undo`.
`GameView` routes the first two through `deck.swipe()` so the card animates exactly as it does for a gesture, and routes `undo` through `onUndo`, which also plays the return animation.


## Mobile and iPhone notes

* The swipe screen is designed to fit a phone viewport without scrolling.
  The deck is a flex item with `min-height: 240px` and `max-height: min(480px, 58dvh)`, so it shrinks on short screens (iPhone SE) and grows on tall ones.
* `100dvh` sizes the app to the visible viewport as Safari's toolbars collapse; a `@supports` fallback uses `vh` on old browsers.
* `touch-action: manipulation` on `body` removes the double-tap zoom delay while keeping pinch zoom.
* `-webkit-tap-highlight-color: transparent` and `-webkit-touch-callout: none` stop the grey tap flash and the long-press callout on cards and buttons.
* `env(safe-area-inset-*)` padding keeps content clear of the notch and the home indicator; `viewport-fit=cover` in `index.html` enables it.
* Buttons are at least 44px tall, including the language switcher.
* The modal uses the native `<dialog>` (iOS 15.4 and newer) with `max-height: 90dvh` and internal scrolling.
* Reduced motion (`prefers-reduced-motion: reduce`) sets all transitions to near zero, skips the reveal delay, and skips confetti.


## Tests

`src/tests/swipe.test.ts` covers gestures, the store rules, the double-event guard, the preserved element during the exit animation, the leaving-to-returning switch on undo, and the flick rules with fake timers.
`src/tests/keyboard.test.ts` covers the page-wide keys, key repeat, modifiers, listener cleanup, and the board's arrow-key navigation.
jsdom has no `PointerEvent` constructor, so `helpers.ts` builds a `MouseEvent` and defines the pointer properties on it.
