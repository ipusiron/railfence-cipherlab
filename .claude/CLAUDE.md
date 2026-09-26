# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RailFence CipherLab is an educational web tool for visualizing and learning Rail Fence cipher encryption/decryption. It provides interactive visualization of the cipher algorithm with 4 main tabs: Encryption, Decryption, Study (座学), and Lab (実験室).

Part of the "生成AIで作るセキュリティツール100" (100 Security Tools Made with Generative AI) project - Day 034.

**Live Demo**: https://ipusiron.github.io/railfence-cipherlab/

## Development

This is a pure frontend project with no build system required.

- **Local testing**: Open `index.html` directly in a browser
- **Automated tests**: Run `npm test` with Node.js 22; no install step
- **Browser checks**: Verify both local HTTP and file:// in Chromium
- **Deployment**: GitHub Pages (static files)

No npm/yarn dependencies, no bundlers, no transpilers.

## Architecture

### File Structure
```
├── index.html      # Main HTML with all 4 tabs, help modal
├── style.css       # All styling including animations
└── js/
    ├── railfence-core.js # Pure cipher functions, shared by UI and Node tests
    ├── i18n.js     # Japanese/English dictionaries and language selection
    ├── common.js   # Shared DOM rendering, tabs, warnings, toast, clipboard, help
    ├── encrypt.js  # Encryption tab logic + animation
    ├── decrypt.js  # Decryption tab logic + animation
    └── lab.js      # Brute-force experiment + statistics analysis
```

### Key Design Patterns

**Security**: Build output with `createElement`, `textContent`, and `append`; clear it with `replaceChildren`.
Never introduce `innerHTML`, HTML-string rendering, inline event handlers, style attributes, or `.style` assignments.
The meta CSP allows only same-origin scripts and styles, without `unsafe-inline`.
Use classes and attributes for visual state. Keep `rel="noopener noreferrer"` on external links.
No external API, CDN, font, dependency, or input transmission is allowed.

**Real-time Mode**: Both encrypt/decrypt tabs support real-time processing via checkbox toggle. When enabled, results update on every keystroke without animation.

**Animation State**: Each tab maintains its own animation state object (`animationState` in encrypt.js, `decryptAnimationState` in decrypt.js) for step-by-step visualization control.

**Cipher Implementation**: Put all cipher operations only in `js/railfence-core.js`.
Keep its reference functions DOM-independent and export `RailfenceCore` plus conditional CommonJS `module.exports`.
UI code calls `encrypt`, `decrypt`, `pattern`, and `cleanText`; do not duplicate rail-placement algorithms.
Extended-key UI code calls `normalizeKey`, `keyPattern`, `encryptKey`, and `decryptKey`.
An extended key contains rails, method, start offset, and direction; offset is normalized within the method period.
Use `permutation` and `movement` for character-position diagrams and statistics, never `indexOf` on repeated characters.
The Lab ranks English candidates with the immutable `railfence-bigrams.js` table through `bigramScore` and `bruteForce`.
`transpositionCheck` is a teaching aid: it reports short input, likely transposition, or likely substitution from English chi-square.
Two methods are supported:
- `sequential` (方式1): Simple round-robin distribution across rails (equivalent to columnar transposition)
- `zigzag` (方式2): Bounce pattern between first and last rail

Use Unicode code points (`Array.from`), not UTF-16 indices. Combining sequences may contain multiple code points.
`cleanText` removes line breaks. Space removal and symbol removal are independent; symbol removal retains spaces and marks.
For three rails, `HELLO` produces `HLEOL` (sequential) or `HOELL` (zigzag).
Sample 1 is `Hello, world!` and its sequential ciphertext is `Hl r!eowll,od`.
Sample 2 has 27 code points; its Japanese plaintext and ciphertext are fixed by `test/core.test.js`.
Load sample settings (three rails, sequential, no removal) before processing the decryption input.
Do not trim actual Lab inputs or change the existing readability-scoring algorithm in this iteration.

### Core Functions

**Encryption** (`encrypt.js`):
- `encrypt()` / `encryptWithoutAnimation()` - Share `renderEncryption(animate)` and call the core
- `displayRailGrid()` - Renders rail matrix visualization

**Decryption** (`decrypt.js`):
- `performDecryptionLogic()` - Calls the core and builds UI data (plaintext, railMatrix, pattern)
- `syncFromEncryptTab()` - Copies settings from encryption tab

**Lab** (`lab.js`):
- `performBruteForce()` - Tries all rail counts (2-6) and methods, scores by readability
- `performStatistics()` - Analyzes character movement distance and entropy changes

### Character Limits

Defined in `common.js`:
- Soft warning at 100 chars
- Hard limit at 500 chars
- Info display starts at 50 chars

## Languages and state

The target audience includes students, educators, and CTF participants. Provide complete Japanese and English UI text.
Keep both dictionaries in `js/i18n.js` with identical keys and interpolation placeholders.
Use `i18n.t()` in logic and `data-i18n` attributes for static HTML, including hidden content and accessible attributes.
Keep Japanese literals out of other JS files except comments and Sample 2's plaintext/ciphertext.
Translate warnings, toasts, help, Study, Lab results, exports, print headings, and CSS-generated labels.
Priority: `?lang=ja|en`, saved language, then browser language (`ja` prefix means Japanese; otherwise English).
The only localStorage key is `railfence-language`; guard reads and writes with try/catch.
Do not save inputs or results. Switching languages must preserve tabs, inputs, settings, results, and animation position.

## Runtime and accessibility

Keep classic scripts, in dependency order: core, i18n, common, encrypt, decrypt, lab.
Do not convert to ES modules: direct file:// use is part of the offline contract.
Support 320px layouts without page-level horizontal scrolling; rail diagrams may scroll inside their container.
Keep checkbox boxes at 20px and targets at least 44px through their labels.
Preserve tab arrow-key navigation, modal focus trapping/Escape/return focus, live regions, and reduced-motion support.
Text contrast must be at least 4.5:1, including hover/focus. Focus outlines need 3:1 against their background.
Exports use native canvas and download APIs. A blocked print popup must show a toast, not throw.

## Tests and documentation

`npm test` uses `node --test`; GitHub Actions runs it on push and pull_request with Node.js 22.

- `test/core.test.js`: 14 known answers, two samples, eight preprocessing cases, 410 round trips, and pattern bounds
- `test/format.test.js`: maximum line lengths and minimum source-file lengths; keep readable, non-minified sources
- `test/html.test.js`: CSP, ARIA, safe DOM rules, core calls, and exact sample ciphertexts
- `test/i18n.test.js`: dictionary parity, placeholders, references, forbidden literals, and language priority
- `test/contrast.test.js`: nine CSS-variable color pairs at or above 4.5:1
- `test/readme.test.js`: five known answers in both READMEs, diagrams, YAML, headings, complete trees, and images

Do not change cipher expectations to make tests pass. Browser checks must include HTTP/file://, both languages,
four widths (1280/768/390/320), all tabs, keyboard operations, storage denial, exports, and zero console/CSP errors.
README.md and README.en.md have matching section order and hierarchy. Keep the Japanese YAML block structure intact.
Document all versioned files and the three screenshots; exclude Git internals and ignored local settings.
The screenshots show zigzag encryption, restored Japanese Sample 2, and English Study examples.
