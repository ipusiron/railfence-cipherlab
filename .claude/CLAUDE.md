# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RailFence CipherLab is an educational web tool for visualizing and learning Rail Fence cipher encryption/decryption. It provides interactive visualization of the cipher algorithm with 4 main tabs: Encryption, Decryption, Study (座学), and Lab (実験室).

Part of the "生成AIで作るセキュリティツール100" (100 Security Tools Made with Generative AI) project - Day 034.

**Live Demo**: https://ipusiron.github.io/railfence-cipherlab/

## Development

This is a pure frontend project with no build system required.

- **Local testing**: Open `index.html` directly in a browser
- **Deployment**: GitHub Pages (static files)

No npm/yarn dependencies, no bundlers, no transpilers.

## Architecture

### File Structure
```
├── index.html      # Main HTML with all 4 tabs, help modal
├── style.css       # All styling including animations
└── js/
    ├── common.js   # Shared utilities (tab switching, XSS protection, toast, clipboard)
    ├── encrypt.js  # Encryption tab logic + animation
    ├── decrypt.js  # Decryption tab logic + animation
    └── lab.js      # Brute-force experiment + statistics analysis
```

### Key Design Patterns

**Security**: All user input displayed in HTML uses `escapeHtml()` from `common.js`. Copy buttons are created via `createCopyButton()` to prevent XSS.

**Real-time Mode**: Both encrypt/decrypt tabs support real-time processing via checkbox toggle. When enabled, results update on every keystroke without animation.

**Animation State**: Each tab maintains its own animation state object (`animationState` in encrypt.js, `decryptAnimationState` in decrypt.js) for step-by-step visualization control.

**Cipher Implementation**: Two methods supported:
- `sequential` (方式1): Simple round-robin distribution across rails (equivalent to columnar transposition)
- `zigzag` (方式2): Bounce pattern between first and last rail

### Core Functions

**Encryption** (`encrypt.js`):
- `encrypt()` / `encryptWithoutAnimation()` - Main encryption logic
- `displayRailGrid()` - Renders rail matrix visualization

**Decryption** (`decrypt.js`):
- `performDecryptionLogic()` - Core decryption algorithm (returns plaintext, railMatrix, pattern)
- `syncFromEncryptTab()` - Copies settings from encryption tab

**Lab** (`lab.js`):
- `performBruteForce()` - Tries all rail counts (2-6) and methods, scores by readability
- `performStatistics()` - Analyzes character movement distance and entropy changes

### Character Limits

Defined in `common.js`:
- Soft warning at 100 chars
- Hard limit at 500 chars
- Info display starts at 50 chars

## Japanese Language

The UI and documentation are primarily in Japanese. The target audience includes Japanese students, educators, and CTF participants learning classical cryptography.
