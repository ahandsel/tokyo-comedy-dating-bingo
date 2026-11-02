# AI Coding Agent Prompt: Tokyo Comedy Dating Bingo

Your role

You are a senior Vue.js engineer, TypeScript developer, game developer, UI/UX designer, and internationalization specialist.

Build a complete, polished, production-ready web application called Tokyo Comedy Dating Bingo.

The application combines Tinder-style swiping with a traditional 5x5 Bingo game.

Users answer 24 dating-related questions by swiping left or right. After completing all questions, they receive a randomized Bingo board showing their answers and whether they achieved Bingo.

The application must support English and Japanese from the first release.

It must use pnpm as the exclusive package manager and be deployable to GitHub Pages without a backend.

Do not deliver only a plan or mockup. Implement the working application, tests, documentation, and deployment configuration.

⸻

1. Technical requirements

Required stack

* Vue 3
* TypeScript
* Vite
* Vue Composition API
* pnpm
* Vue I18n
* CSS or Tailwind CSS
* LocalStorage
* Vitest
* GitHub Actions
* GitHub Pages

Optional:

* VueUse
* Pinia
* A lightweight swipe gesture component
* A lightweight animation or confetti library
* A browser-based image export library
* Playwright for end-to-end tests

Do not require:

* A backend
* A database
* User authentication
* Paid services
* API keys
* External translation APIs
* Third-party analytics

All gameplay, localization, storage, and Bingo calculations must run client-side.

Package management

Use pnpm for everything.

Do not use npm or Yarn for dependency installation, builds, tests, CI, or README instructions.

Initialize the project using:

pnpm create vite tokyo-comedy-dating-bingo --template vue-ts
cd tokyo-comedy-dating-bingo
pnpm install
pnpm add vue-i18n@11

Use pnpm commands throughout:

pnpm dev
pnpm build
pnpm preview
pnpm test
pnpm typecheck

Additional requirements:

* Generate and commit pnpm-lock.yaml.
* Do not commit package-lock.json or yarn.lock.
* Specify a compatible, exact pnpm version using the packageManager field in package.json.
* Use a supported Node.js LTS version compatible with the selected Vite release.
* Use frozen-lockfile installation in CI.
* Ensure all documented scripts exist.

⸻

1. Research open-source components before implementation

Research existing projects to determine whether they can accelerate the implementation.

Tinder-style swiping

Investigate:

Vue 3 Flashcards

<https://github.com/vad1ym/vue3-flashcards>

Tallman Swiper

<https://github.com/tallmancode/tallman-swiper>

Vue Tinder

<https://github.com/shanlh/vue-tinder>

VueUse

<https://vueuse.org/>

Evaluate:

* Vue 3 compatibility
* TypeScript support
* Touch and mouse gestures
* Directional swiping
* Animation quality
* Card stacking
* Undo support
* Keyboard compatibility
* Accessibility
* Project maintenance
* Dependency size

Bingo implementations

Investigate:

Vue 3 Bingo Generator

<https://github.com/mengxiaozhi/Bingo>

bingo-ts

<https://github.com/ya-s-u/bingo-ts>

Additional Bingo reference

<https://github.com/lucasnetau/bingo>

Evaluate:

* Board randomization
* 5x5 grid generation
* Free center handling
* Horizontal win detection
* Vertical win detection
* Diagonal win detection
* Support for custom text labels
* Compatibility with TypeScript

Research decisions

Verify licenses, compatibility, and documentation before selecting libraries.

Prefer lightweight, maintained, compatible implementations.

A simple custom TypeScript Bingo engine may be preferable to adapting a number-based Bingo library.

Document which components were evaluated and why they were selected or rejected.

Preserve open-source attribution when required.

⸻

1. Internationalization requirements

English and Japanese are equally important product requirements.

The initial release must be fully functional in both languages.

Do not build an English-only application and leave translation for later.

Supported languages

* English: en
* Japanese: ja

Use Vue I18n with its Composition API.

Configure it using legacy: false.

Use English as the fallback locale.

Keep translation assets bundled locally. No runtime translation service is allowed.

Language selection

Add a language switcher displaying:

EN | 日本語

The switcher must be accessible on:

* Welcome screen
* Swipe game screen
* Results screen

Changing the language must:

1. Update the interface immediately.
2. Update the current question.
3. Update all visible buttons and instructions.
4. Update progress indicators.
5. Update the Bingo board labels.
6. Update results and statistics.
7. Update export and sharing text.
8. Preserve all recorded answers.
9. Preserve the question order.
10. Preserve the final board arrangement.

Changing languages must never restart the game.

Default language detection

When a user visits for the first time:

1. Check for a saved language preference.
2. If none exists, detect the browser language using navigator.languages or navigator.language.
3. If the preferred language starts with ja, select Japanese.
4. Otherwise, select English.

If the browser reports an unsupported language, use English.

Save the selected language in LocalStorage independently of game progress.

Restarting the game must not reset the language preference.

Localization scope

Translate all user-facing content, including:

* Welcome title or supporting subtitle
* Game instructions
* All 24 questions
* Yes and No labels
* Swipe instructions
* Undo button
* Question progress
* Remaining question count
* Loading and transition messages
* Free space label
* Results heading
* Bingo and No Bingo messages
* Statistics
* Restart confirmation
* Error messages
* Sharing messages
* Image export text
* Accessibility labels
* Confirmation dialogs
* Empty states

Use appropriate Japanese phrasing rather than direct, unnatural translations.

Keep the game brand "Tokyo Comedy Dating" unchanged in both languages.

The word "BINGO" may also remain unchanged.

Japanese typography

Ensure:

* Japanese characters render correctly.
* CJK-compatible font fallbacks are available.
* Font rendering does not produce missing glyphs.
* Japanese text wraps correctly.
* Cards accommodate different text lengths.
* Japanese text is legible inside the Bingo board.
* Exported PNG images correctly display Japanese text.

Use a font stack with Japanese support, such as Noto Sans JP or appropriate system fallbacks.

Avoid relying solely on a decorative Latin font.

Set document.documentElement.lang according to the selected language.

Make document titles and accessible labels language-aware.

⸻

1. Complete bilingual question dataset

Use exactly 24 questions.

Every question must have:

* Stable unique ID
* English text
* Japanese text

The English labels are finalized and must not be changed.

The Japanese labels below are initial translations to use in the application. Preserve their intent while allowing natural-language review before release.

ID English Japanese
q01 Knew as soon as the date started that it was a NO デートが始まってすぐ「この人はナシ」と思った
q02 Paid for the whole date デート代を全額払った
q03 Foreigner fetish 外国人フェチ
q04 Matched with someone I know 知り合いとマッチングした
q05 Went to a love hotel ラブホテルに行った
q06 I was ghosted 突然連絡を絶たれた
q07 Had an affair 浮気をした
q08 Met at the club クラブで出会った
q09 Still lives with their ex デート相手が元恋人とまだ同居していた
q10 Have a type I know is bad for me 自分に良くないと分かっているタイプに惹かれる
q11 Found out my date was married デート相手が既婚者だと後から知った
q12 Unsolicited dick pic 頼んでいない性器の写真が送られてきた
q13 Unplanned visit to a military base 予定外に軍の基地を訪れた
q14 Friends with benefits セフレ関係になった
q15 Stayed because the sex was good セックスが良かったから関係を続けた
q16 My date didn't speak my language デート相手が自分の言語を話せなかった
q17 Experienced 告白 告白を経験した
q18 Open relationship オープン・リレーションシップを経験した
q19 "meet me in front of Hachiko" 「ハチ公前で待ち合わせしよう」と言われた
q20 Bumble date Bumble で知り合った人とデートした
q21 Kissed in public in Tokyo 東京で人前でキスした
q22 I was un-matched mid convo 会話の途中でマッチを解除された
q23 Accidentally liked an ex's photo 元恋人の写真にうっかり「いいね」した
q24 Japanese fetish 日本人フェチ

Free center

English:

FREE SPACE ❤️

Japanese:

フリースペース ❤️

The center is not one of the 24 questions.

Data architecture

Store questions centrally in:

src/data/questions.ts

Suggested TypeScript model:

type Locale = 'en' | 'ja';
interface Question {
id: string;
text: Record<Locale, string>;
}

Example:

const questions: Question[] = [
{
id: 'q01',
text: {
en: 'Knew as soon as the date started that it was a NO',
ja: 'デートが始まってすぐ「この人はナシ」と思った'
}
},
{
id: 'q12',
text: {
en: 'Unsolicited dick pic',
ja: '頼んでいない性器の写真が送られてきた'
}
},
{
id: 'q13',
text: {
en: 'Unplanned visit to a military base',
ja: '予定外に軍の基地を訪れた'
}
}
];

Include all 24 questions in the actual file.

Use question IDs for gameplay and storage.

Do not store English or Japanese question text as the answer key.

For example:

type Answer = 'yes' | 'no';
type Answers = Record<string, Answer>;

This ensures language switching does not break answer mapping or Bingo calculations.

Translation structure

Suggested:

src/
data/
questions.ts
i18n/
index.ts
locales/
en.ts
ja.ts

Store interface messages in the locale modules.

Keep question translations in one centrally managed dataset, unless a cleaner structure provides equally reliable ID mapping.

Use typed message keys where practical.

Do not hardcode user-facing strings in Vue components.

⸻

1. Welcome screen

Create a playful and visually polished welcome page.

English

Title:

"Tokyo Comedy Dating"

Subtitle:

"BINGO"

Tagline:

"How chaotic is your Tokyo dating life?"

Instructions:

"Swipe right if you've experienced it. Swipe left if you haven't. Answer all 24 cards to reveal your Bingo board!"

Button:

"Start Swiping"

Japanese

Title:

"Tokyo Comedy Dating"

Subtitle:

"BINGO"

Tagline:

"あなたの東京での恋愛、どれくらい波乱万丈？"

Instructions:

"経験したことがあれば右へ、なければ左へスワイプ！24 枚すべてに答えて、ビンゴカードを完成させよう！"

Button:

"スワイプ開始"

Design

Include:

* Romantic pink background
* Handwritten-style title
* Large BINGO heading
* Heart motifs
* Clear start button
* Language selector
* Short explanation of the rules
* Small notice about mature dating-related content

The language can be switched before starting.

⸻

1. Tinder-style swipe screen

Display all 24 questions one at a time.

Main interaction

Swipe right:

* Answer YES
* Japanese label: はい
* Pink/heart visual feedback

Swipe left:

* Answer NO
* Japanese label: いいえ
* Muted visual feedback

Question card

Each card shows:

* Question number
* Total questions
* Large question text
* Left and right swipe indicators
* Progress bar

English:

"Question 8 of 24"

Japanese:

"24 問中 8 問目"

The progress text must be dynamically localized.

Controls

Include:

* No button
* Yes button
* Undo button

Japanese:

* いいえ
* はい
* 取り消す

Swipe functionality

Support:

* Touch drag
* Mouse drag
* Keyboard arrows
* Animated card rotation
* Directional overlays
* Swipe threshold detection
* Snap-back below threshold
* Smooth exit animation
* Card stack effect
* Undo last answer

Avoid double-answering due to repeated events.

Question randomization

Shuffle the 24 question IDs once when starting a new game.

Store the shuffled order.

Do not regenerate the question order when the language changes.

Language switching during gameplay

If a user is on question 8 and changes from English to Japanese:

* Remain on question 8.
* Display the Japanese translation.
* Keep the same question ID.
* Preserve all seven previous answers.
* Preserve the remaining question order.
* Continue without interruption.

No additional swipes should be triggered by changing languages.

⸻

1. Results screen

After the final answer, transition to the results screen.

Show a brief reveal animation.

The results screen must also support immediate English/Japanese language switching.

English outcomes

If Bingo:

"BINGO!"

"Your Tokyo dating life is iconic!"

If no Bingo:

"No Bingo!"

"But what a dating history!"

Japanese outcomes

If Bingo:

"ビンゴ！"

"あなたの東京恋愛ライフ、伝説級！"

If no Bingo:

"ビンゴならず！"

"でも、なかなか濃い恋愛遍歴！"

Statistics

Show:

* Number of YES answers
* Number of NO answers
* Number of winning lines

Japanese:

* はいの数
* いいえの数
* ビンゴ成立ライン数

The statistics must always match the recorded answers.

The free center is not included in the YES count.

Randomized 5x5 Bingo board

Display:

* Exactly 25 cells
* 24 experience questions
* One free center square
* Correct answer indicators
* Highlighted winning lines

Every question must appear exactly once.

All questions must be visible regardless of whether the answer is YES or NO.

Cell colors

YES:

* Saturated rose pink
* Heart or checkmark

NO:

* Muted blush or gray
* Unmarked appearance

FREE:

* Contrasting center square
* Heart
* Always marked

Winning lines:

* Distinct highlight or border

Use accessible indicators instead of relying solely on color.

Localized board labels

The board must dynamically display each question using the selected language.

Example:

English:

"Unsolicited dick pic"

Japanese:

"頼んでいない性器の写真が送られてきた"

Changing the language must only change the displayed text.

Never reshuffle the Bingo board when switching languages.

Cell details

Allow a user to tap any cell to see:

* Complete localized question
* Their answer
* Whether it belongs to a winning line

Use a localized popover or modal.

⸻

1. Bingo board generation

Implement a pure TypeScript board generator.

Rules

1. Take the 24 unique question IDs.
2. Shuffle with Fisher-Yates.
3. Create a 25-cell grid.
4. Insert the FREE cell at the center.
5. Populate the other 24 positions.
6. Match answers using stable question IDs.
7. Return the board.

Use zero-based indexing.

The center is:

* Row 2
* Column 2
* Flat index 12

Never overwrite the center.

Fairness

Board randomization must be independent of player answers.

Do not:

* Force Bingo
* Prevent Bingo
* Cluster YES answers
* Arrange NO answers to alter the outcome
* Recalculate the arrangement when changing languages

Persistence

Generate the board once after the final answer.

Store its question ID arrangement in LocalStorage.

Preserve it across:

* Refreshes
* Language changes
* Return visits
* Results editing
* Exporting
* Sharing

Only starting a new game creates a new board arrangement.

⸻

1. Bingo detection

A square is marked when:

* The answer is YES
* It is the FREE center square

NO answers are unmarked.

Winning lines

Check:

* 5 horizontal rows
* 5 vertical columns
* 2 diagonals

Total potential winning lines: 12.

A completed line of 5 marked squares counts as Bingo.

Result model

interface BingoResult {
hasBingo: boolean;
winningLines: number[][];
winningCellIndices: number[];
totalWinningLines: number;
}

Support multiple completed lines.

Deduplicate overlapping winning cell indices.

Bingo calculation must be language-independent.

Never compare translated question text to determine a winner.

Use only stable question IDs, board positions, answers, and free-space status.

⸻

1. State management

Implement application state using Vue composables or Pinia if justified.

Store:

interface GameState {
version: number;
phase: 'welcome' | 'playing' | 'results';
questionOrder: string[];
currentQuestionIndex: number;
answers: Record<string, 'yes' | 'no'>;
answerHistory: string[];
boardQuestionIds: (string | 'free')[] | null;
}

The structure may be adjusted if needed.

Separate language preference

Store the language separately:

interface UserPreferences {
locale: 'en' | 'ja';
}

Language selection is a user preference, not part of the game outcome.

Restarting a game must preserve language preference.

LocalStorage

Persist automatically:

* Current game phase
* Question order
* Current index
* Answers
* Undo history
* Final board arrangement
* Language preference

Handle corrupted or incompatible saved data safely.

Privacy

Do not transmit answers to third-party services.

Store personal answers locally only.

Do not include answers in analytics, URLs, or remote logs.

Sharing must be initiated explicitly by the user.

⸻

1. Undo, restart, and editing

Undo

Allow users to undo their most recent answer.

Undo must:

* Reopen the previous question
* Remove its answer
* Update progress
* Allow a new answer
* Update LocalStorage

Restart

Add a "Play Again" button.

Japanese:

"もう一度プレイ"

Before restarting, ask for confirmation.

English:

"Start a new game? Your current answers and Bingo board will be cleared."

Japanese:

"新しいゲームを始めますか？現在の回答とビンゴカードは消去されます。"

Restart must reset game progress while preserving language choice.

Edit previous answers

If practical, allow players to review and edit answers from the results screen.

Changing an answer must:

* Update statistics
* Recalculate Bingo
* Update cell markings
* Preserve board positions
* Preserve selected language

⸻

1. Visual design

Use a cohesive Tokyo dating-game aesthetic.

Style keywords:

* Romantic
* Retro pink
* Social party game
* Playful
* Slightly cheeky
* Premium mobile experience

Suggested palette

* Light blush: #FCE4EC
* Rose pink: #E97CA6
* Deep berry: #A83F70
* Cream: #FFF8F4
* Dark text: #261A21

Typography

Use:

* Decorative script font for the main title
* Clear sans-serif for English questions
* Legible Japanese font for Japanese content
* Bold typography for Bingo results

Responsive behavior

Optimize for:

* iPhone
* Android
* Tablets
* Desktop

The swipe interface should fit comfortably on a phone.

The Bingo board must remain a true 5-column grid.

Japanese text may be longer or have different wrapping behavior.

Ensure:

* Legible labels
* Consistent cell dimensions
* Reasonable font scaling
* Tap-to-expand cell text
* No horizontal overflow
* No cropped important content

Accessibility

Implement:

* Keyboard navigation
* Focus indicators
* Screen-reader labels in the current language
* Reduced-motion support
* Accessible buttons
* Adequate contrast
* Semantic HTML
* Localized status announcements

⸻

1. Shareable Bingo image

Implement a downloadable Bingo card PNG if feasible.

The exported image must use the currently selected language.

English export

Include:

* Tokyo Comedy Dating Bingo title
* English question labels
* YES and NO markings
* FREE SPACE
* Highlighted winning lines
* Result summary

Japanese export

Include:

* Tokyo Comedy Dating Bingo title
* Japanese question labels
* はい / いいえ markings as appropriate
* フリースペース
* Highlighted winning lines
* Japanese result summary

Important

Use a large enough export resolution for text readability.

Ensure the export includes all 25 cells.

Ensure Japanese glyphs render correctly.

Load required fonts before capturing the image.

Perform image generation locally in the browser.

Provide a fallback download option when Web Share API is unavailable.

⸻

1. Project architecture

Use a clear, maintainable structure:

tokyo-comedy-dating-bingo/
public/
favicon.svg
src/
assets/
components/
LanguageSwitcher.vue
SwipeCard.vue
SwipeDeck.vue
SwipeControls.vue
ProgressIndicator.vue
BingoBoard.vue
BingoCell.vue
ResultSummary.vue
views/
WelcomeView.vue
GameView.vue
ResultsView.vue
composables/
useGame.ts
useGameStorage.ts
useLocale.ts
data/
questions.ts
i18n/
index.ts
locales/
en.ts
ja.ts
types/
game.ts
i18n.ts
utils/
shuffle.ts
bingo.ts
board.ts
exportImage.ts
tests/
questions.test.ts
i18n.test.ts
swipe.test.ts
board.test.ts
bingo.test.ts
storage.test.ts
App.vue
main.ts
style.css
.github/
workflows/
deploy.yml
index.html
vite.config.ts
package.json
pnpm-lock.yaml
tsconfig.json
README.md

Adjust the architecture where justified.

Keep game rules independent from translated display text.

Avoid duplicated translations and unnecessary abstraction.

⸻

1. Testing requirements

Use Vitest.

Add browser interaction tests with an appropriate tool if practical.

Dataset tests

Verify:

1. Exactly 24 questions exist.
2. IDs are unique.
3. All 24 questions have English translations.
4. All 24 questions have Japanese translations.
5. No translated label is empty.
6. The corrected English text "Unsolicited dick pic" exists.
7. The corrected English text "Unplanned visit to a military base" exists.
8. 告白 renders correctly.

Language tests

Verify:

1. English is selected for an unsupported browser locale.
2. Japanese is selected for a Japanese browser locale.
3. A saved locale overrides browser detection.
4. Switching languages changes every visible question.
5. Switching languages does not change question IDs.
6. Switching languages does not change answers.
7. Switching languages does not reset progress.
8. Switching languages does not reshuffle the final board.
9. Switching languages updates results text.
10. Switching languages updates button labels.
11. Refresh preserves language preference.
12. Restart preserves language preference.
13. All required interface translation keys exist in both languages.
14. Missing translations fall back to English.
15. Exported board labels use the selected language.

Swipe tests

1. Left swipe records NO.
2. Right swipe records YES.
3. Buttons and gestures produce equivalent answers.
4. Every question appears exactly once.
5. Undo restores the previous question.
6. Re-answering does not produce duplicate answers.
7. The game completes only after 24 answers.

Board tests

1. Board has 25 cells.
2. Center is FREE.
3. All 24 questions appear exactly once.
4. No question is lost during shuffling.
5. Answers remain linked to correct IDs.
6. Saved board order remains stable.
7. Board layout is independent of the selected language.

Bingo tests

1. Horizontal Bingo works.
2. Vertical Bingo works.
3. Both diagonals work.
4. Free center counts correctly.
5. All NO answers produce No Bingo.
6. All YES answers produce 12 winning lines.
7. Multiple wins count correctly.
8. Shared cells are deduplicated.
9. Four marked cells alone do not produce Bingo.
10. Bingo results are identical in English and Japanese for the same saved game.

Persistence tests

1. Refresh preserves answers.
2. Refresh preserves question order.
3. Refresh preserves final board positions.
4. Restart clears the game correctly.
5. Corrupted LocalStorage is handled safely.
6. Updating an answer recalculates Bingo without reshuffling.

Build and deployment tests

1. TypeScript checks pass.
2. Production Vite build succeeds.
3. pnpm frozen-lockfile installation works.
4. GitHub Pages asset paths are correct.
5. Browser refresh does not trigger a routing 404.
6. Japanese and English render correctly in production.
7. No missing translation keys appear in the production interface.

⸻

1. GitHub Pages deployment with pnpm

Deploy the app to:

<https://USERNAME.github.io/REPOSITORY/>

Use the official Vite deployment documentation:

<https://vite.dev/guide/static-deploy>

GitHub Actions setup

Create:

.github/workflows/deploy.yml

Use a current supported pnpm setup action, preferably:

<https://github.com/pnpm/setup>

Configure a compatible Node.js runtime and install the pnpm version specified in package.json.

The workflow must:

1. Trigger on push to main.
2. Support manual deployment.
3. Check out the repository.
4. Set up pnpm and Node.js.
5. Install dependencies with a frozen lockfile.
6. Run tests.
7. Run TypeScript checks.
8. Build the application.
9. Configure GitHub Pages.
10. Upload the generated dist directory.
11. Deploy with the official GitHub Pages action.

Use commands equivalent to:

pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm build

Do not use npm ci or any npm-based install step.

Use current maintained GitHub Actions versions and appropriate permissions:

* contents: read
* pages: write
* id-token: write

Vite base path

For a project repository:

`/<REPOSITORY>/`

For a root GitHub Pages site or custom domain:

`/`

Make the base path straightforward to configure.

Prefer a single-page app without unnecessary route paths.

If routing is introduced, ensure GitHub Pages refreshes work.

Language routing

Do not require separate routes such as /en/ and /ja/.

A visible language switcher is sufficient.

Language selection should be stored locally.

The same static GitHub Pages deployment must serve both languages.

No server-side localization is required.

⸻

1. README documentation

Create a complete README describing:

* Project overview
* Game rules
* English and Japanese support
* Language switching
* Browser-language detection
* Bilingual question management
* Game-state persistence
* Technology stack
* Open-source research findings
* Dependencies and licenses
* Local development
* Testing
* Production builds
* GitHub Pages deployment
* Custom domain setup
* Updating questions
* Editing translations
* Adding a future third language
* Theme customization
* Privacy behavior
* Known limitations

Local development commands

Use:

pnpm install
pnpm dev
pnpm test
pnpm typecheck
pnpm build
pnpm preview

Document the required Node.js and pnpm versions.

Ensure these commands match package.json.

The README must not contain obsolete npm or Yarn setup instructions.

⸻

1. Implementation phases

Follow these phases.

Phase 1: Research

Research open-source swiping and Bingo implementations.

Confirm compatibility, license, maintenance, and suitability.

Document selected technologies.

Phase 2: pnpm project initialization

Create the Vue 3 + TypeScript + Vite project using pnpm.

Configure dependencies, scripts, and the lockfile.

Phase 3: Internationalization

Implement Vue I18n before building the primary interface.

Create:

* English translation resources
* Japanese translation resources
* Language preference persistence
* Browser-language detection
* Language switcher
* Reactive language switching

Add all 24 bilingual questions.

Phase 4: Core game logic

Implement:

* Question randomization
* Answer state
* Undo
* Board generation
* Bingo detection
* LocalStorage persistence

Phase 5: Welcome screen

Build the bilingual welcome page and visual identity.

Phase 6: Swipe interface

Implement:

* Tinder-style card swiping
* Yes/No buttons
* Undo
* Progress
* Language switching during gameplay
* Responsive animations

Phase 7: Results screen

Build:

* Randomized 5x5 board
* Localized cell labels
* Winning-line highlighting
* Statistics
* Bingo and No Bingo messages
* Language switching after completion

Phase 8: Visual polish

Improve:

* Typography
* Japanese font handling
* Mobile layout
* Animation smoothness
* Accessibility
* Bingo board readability

Phase 9: Optional enhancements

Implement:

* PNG export
* Native sharing
* Confetti
* Answer editing

Keep these features fully bilingual.

Phase 10: Testing

Run all unit and interaction tests.

Fix failures.

Verify English and Japanese behavior independently.

Verify both languages with a saved game in progress.

Phase 11: GitHub Pages

Configure pnpm-based GitHub Actions deployment.

Test the production build and repository base path.

Phase 12: Documentation

Complete the README and provide deployment instructions.

⸻

1. Definition of done

The application is complete only when:

Core gameplay

* All 24 approved questions are included.
* Every question appears exactly once.
* Users can swipe left or right.
* Yes and No buttons work.
* Undo works.
* Progress is tracked.
* Results are generated after 24 answers.

Bingo

* A randomized 5x5 board is generated.
* The free space is centered.
* Every answer appears at its correct randomized position.
* All 12 winning combinations are supported.
* Multiple winning lines are counted.
* Winning lines are highlighted.
* The board is stable across refreshes.

Internationalization

* English works completely.
* Japanese works completely.
* Every question is translated.
* All user-facing interface text is translated.
* Language switching works on all three screens.
* Switching languages does not change answers.
* Switching languages does not reshuffle the board.
* A saved language preference is respected.
* Browser-language detection works.
* Japanese text is rendered correctly.
* Image exports use the selected language.

pnpm and deployment

* pnpm is the only package manager used.
* pnpm-lock.yaml is committed.
* No competing package-manager lockfiles exist.
* pnpm install --frozen-lockfile succeeds.
* pnpm test passes.
* pnpm typecheck passes.
* pnpm build succeeds.
* GitHub Actions uses pnpm.
* GitHub Pages is configured.
* The production application works without a backend.

UX and quality

* Mobile layout is polished.
* Desktop layout works.
* Buttons and controls are accessible.
* State persists.
* Restart works.
* Long questions remain readable.
* Both languages are visually polished.
* No placeholder interactions remain.

⸻

1. Final instructions

Implement the actual application from start to finish.

Do not stop after creating a specification or development plan.

Make reasonable technical decisions independently.

The following requirements are non-negotiable:

1. Vue 3 with TypeScript and Vite.
2. pnpm as the exclusive package manager.
3. Full English and Japanese support from the first release.
4. All 24 approved questions, including the two corrected labels.
5. Tinder-style swipe interactions.
6. A truly randomized 5x5 Bingo board.
7. Accurate Bingo detection.
8. Stable question IDs across languages.
9. Language changes without resetting gameplay.
10. Static deployment compatibility with GitHub Pages.

Run the tests and build before declaring the project complete.

In your final implementation report, provide:

* Summary of completed features
* Open-source projects researched
* Final dependency choices
* Project structure
* Local setup instructions using pnpm
* Test and build results
* GitHub Pages deployment instructions
* Known limitations, if any

Deliver a complete, playable, bilingual Tokyo Comedy Dating Bingo game that can be deployed to GitHub Pages.
