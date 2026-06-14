# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AcadShield (学术盾) is a blockchain-based thesis review system for Chinese universities. It provides immutable, transparent, and role-based thesis grading using Solidity smart contracts, with a Vue 3 frontend and IPFS for off-chain file storage.

## Architecture

Two independent sub-projects sharing a common prototype reference:

```
acadshield-thesis-review-contract/    # Hardhat + Solidity smart contract
acadshield-thesis-review-frontend/    # Vite + Vue 3 + Ant Design frontend
prototype.html                        # Static HTML prototype (design reference)
```

**Storage strategy**: Large files (PDFs, reviews) go to IPFS → only CIDs + metadata (score, address, timestamp) stored on-chain. This keeps gas costs low.

**Smart contract** (`AcadShield.sol`): Inherits OpenZeppelin `AccessControl` + `ReentrancyGuard`. Three roles (`STUDENT_ROLE`, `REVIEWER_ROLE`, `ADMIN_ROLE`) enforce RBAC. Four-state machine: `NOT_SUBMITTED → SUBMITTED → UNDER_REVIEW → FINALIZED` with `REJECTED` as a terminal state from either `SUBMITTED` or `UNDER_REVIEW`. Key functions: `submitThesis(cid)`, `reviewThesis(id, score, reviewCID)`, `finalizeGrade(id)`, `rejectThesis(id)`.

**Review model**: Single reviewer per thesis (first-come-first-served). Any `REVIEWER_ROLE` holder can review any `SUBMITTED` thesis. Only a `uint8` total score is stored on-chain; the four dimension scores (选题/创新/实现/写作) are UI-only.

**Student submissions**: Students can submit multiple theses (stored in `studentTheses[address]` array), each receiving a unique `thesisId`.

**Frontend** (`src/`): Vue 3 Composition API with Ant Design of Vue. Wallet state managed by Pinia store (`stores/wallet.js`) with localStorage persistence for auto-reconnect. Four views: Home (Hero/Workflow/Architecture), Student (upload + progress), Reviewer (list + scoring panel), Admin (stats table + finalize/reject panel + role management). AdminView listens to contract events (`ThesisSubmitted`, `ThesisReviewed`, `GradeFinalized`, `ThesisRejected`) for real-time updates.

## Common Commands

### Contract project (`acadshield-thesis-review-contract/`)
```bash
npm install
npm run compile              # or: npx hardhat compile
npm test                     # or: npx hardhat test (≥16 test cases)
npm run node                 # or: npx hardhat node (local blockchain)
npm run deploy               # or: npx hardhat run scripts/deploy.js
```

### Frontend project (`acadshield-thesis-review-frontend/`)
```bash
npm install
npm run dev                  # Start Vite dev server (port 5173)
npm run build                # Production build
npm run preview              # Preview production build
```

## Design Conventions

- **Color palette**: Dark ink `#0F172A` (primary), warm paper `#F5F1E8` (background), blue accent `#1E3A8A`
- **Typography**: Noto Serif SC for Chinese headings/data, Inter for Latin/body, JetBrains Mono for hashes/addresses (loaded via Google Fonts in `index.html`)
- **Layout**: No card-heavy stacking; use typography and `border-bottom` dividers between sections
- **Status badges** (defined in `App.vue` global styles and `RoleBadge.vue`):
  - SUBMITTED: Blue (`#DBEAFE`/`#1E40AF`) — state `1`
  - UNDER_REVIEW: Yellow (`#FEF3C7`/`#92400E`) — state `2`
  - FINALIZED: Green (`#DCFCE7`/`#166534`) — state `3`
  - REJECTED: Red (`#FEE2E2`/`#991B1B`) — state `4`
- **Score display**: Large serif numerals (96px) in the reviewer scoring panel

## Key Contract Events

Frontend listens to these (set up in `AdminView.vue` `setupEventListener()`):
- `ThesisSubmitted(thesisId, submitter, thesisCID, timestamp)`
- `ThesisReviewed(thesisId, reviewer, score, reviewCID)`
- `GradeFinalized(thesisId, finalScore)`
- `ThesisRejected(thesisId, admin, timestamp)`

## Development Notes

- The contract ABI must be exported to `acadshield-thesis-review-frontend/src/abi/AcadShield.json` after compilation/deployment (this file does not exist yet — generate it via the deploy script)
- Two projects are independent — each has its own `package.json`; they do not share dependencies
- The deploy script auto-assigns roles (STUDENT/REVIEWER/ADMIN) to test accounts
- IPFS is simulated locally during development — `Qm` + random base58 string generates mock CIDs
- All UI text is in Chinese (zh-CN)
- Contract project uses Solidity 0.8.24 with Hardhat (chainId 31337)
- Frontend uses Ant Design of Vue 4.x with global registration in `main.js`

## Gotchas

- **Use `shallowRef` for ethers.js objects** — Vue's `ref()` wraps objects in a deep Proxy which breaks ethers.js v6 private field access ("Cannot read from private field"). Use `shallowRef` for `provider`, `signer`, `contract`.
- **Never run `npx hardhat test` while the frontend is connected** — Hardhat test uses snapshot/revert which wipes deployed contracts from the running node. Always redeploy after running tests.
- **`@ant-design/web3` is React-only** — The project uses a custom `WalletModal.vue` with `ant-design-vue` components for wallet selection. The Vue equivalent package (`@ant-design/web3-vue`) is not installed.
