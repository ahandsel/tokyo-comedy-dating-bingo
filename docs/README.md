# Documentation

This folder explains how the Tokyo Comedy Dating Bingo code works, and it holds the repository style guides and the README screenshots.
Each page under "Pages" covers one layer of the app and points at the source files that implement it.


## Pages

* [architecture.md](architecture.md) - an overview: phases, views, the data flow from a swipe to the saved state, and the folder layout.
* [game-state.md](game-state.md) - the game store, the saved-state shape, the strict LocalStorage validation, and the rules for undo, resume, and restart.
* [swiping.md](swiping.md) - the swipe card gesture engine, the deck animation model, the page-wide keyboard controls, and the mobile (iPhone) considerations.
* [bingo-and-export.md](bingo-and-export.md) - board generation, winning-line evaluation, and the PNG export and share flow.
* [i18n.md](i18n.md) - locale detection, the saved language preference, the typed message catalogues, and how question text is translated.
* [development.md](development.md) - the toolchain (Node 24, pnpm 12), the scripts, the test suite, formatting, and the GitHub Pages deployment.


## Images

The `images/` folder holds the screenshots at the top of the root [README](../README.md): the welcome, swipe, and results screens, each in English (`-en.png`) and Japanese (`-ja.png`).
They were captured from `pnpm preview` in headless Chrome at a phone size of 390x844 CSS pixels and a device pixel ratio of 2.
Capture them again when a change alters the look of one of those screens.


## Style guides

* [markdown-style-guide.md](markdown-style-guide.md) - the markdownlint rules, alert banners, and link style for every Markdown file in the repository.
* [repo-commit-style-guide.md](repo-commit-style-guide.md) - the commit title format, the body format, and the commit type emojis.

The English writing rules (straight quotes, no contractions, the Oxford comma, and one sentence per line) live in the "Writing style" and "One sentence per line" sections of [AGENTS.md](../AGENTS.md).


## Reading order

Start with [architecture.md](architecture.md), then read the page for the layer you are changing.
The [README](../README.md) at the repository root covers the game rules, the open-source research, and the deployment setup from a user's point of view.
