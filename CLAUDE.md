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

**Smart contract** (`AcadShield.sol`): Inherits OpenZeppelin `AccessControl` + `ReentrancyGuard`. Three roles (`STUDENT_ROLE`, `REVIEWER_ROLE`, `ADMIN_ROLE`) enforce RBAC. State machine: `NOT_SUBMITTED → SUBMITTED → UNDER_REVIEW → FINALIZED`. Key functions: `submitThesis(cid)`, `reviewThesis(id, score, reviewCID)`, `finalizeGrade(id)`.

**Frontend** (`src/`): Vue 3 Composition API with Ant Design of Vue and Ant Design Web3 for wallet connection. `composables/useWeb3.js` wraps ethers.js v6 for contract interaction. Four views: Home (Hero/Workflow/Architecture), Student (upload + progress), Reviewer (list + scoring panel), Admin (stats table + finalize panel).

## Common Commands

### Contract project (`acadshield-thesis-review-contract/`)
```bash
npm install
npx hardhat compile          # Compile Solidity
npx hardhat test             # Run all unit tests (≥8 test cases)
npx hardhat node             # Start local Hardhat node
npx hardhat run scripts/deploy.js  # Deploy to local network
```

### Frontend project (`acadshield-thesis-review-frontend/`)
```bash
npm install
npm run dev                  # Start Vite dev server
npm run build                # Production build
```

## Design Conventions (from prototype.html)

- **Color palette**: Dark ink `#0F172A` (primary), warm paper `#F5F1E8` (background), blue accent `#1E3A8A`
- **Typography**: Noto Serif SC for Chinese headings/data, Inter for Latin/body, SF Mono for hashes/addresses
- **Layout**: No card-heavy stacking; use typography and `border-bottom` dividers between sections
- **Status badges**: Blue (`#DBEAFE`/`#1E40AF`) = SUBMITTED, Yellow (`#FEF3C7`/`#92400E`) = UNDER_REVIEW, Green (`#DCFCE7`/`#166534`) = FINALIZED
- **Score display**: Large serif numerals (96px) in the reviewer scoring panel

## Key Contract Events

Frontend should listen to these for real-time updates:
- `ThesisSubmitted(thesisId, submitter, thesisCID, timestamp)`
- `ThesisReviewed(thesisId, reviewer, score, reviewCID)`
- `GradeFinalized(thesisId, finalScore)`

## Development Notes

- The contract ABI is exported to `acadshield-thesis-review-frontend/src/abi/AcadShield.json` after compilation/deployment
- Two projects are independent — each has its own `package.json`; they do not share dependencies
- The deploy script auto-assigns roles (STUDENT/REVIEWER/ADMIN) to test accounts
- IPFS is simulated locally during development (generate mock CIDs)
- All UI text is in Chinese (zh-CN)
