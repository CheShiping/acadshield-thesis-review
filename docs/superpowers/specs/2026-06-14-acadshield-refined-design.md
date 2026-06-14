# AcadShield Refined Design — 2026-06-14

Refinements to the original spec at `.claude/specs/acadshield-thesis-review/spec.md`. This document supersedes the original where they conflict.

## Summary of Changes

| Area | Original Spec | Refined Design |
|------|--------------|----------------|
| Reviews per thesis | Single (implied) | **Single** (explicit) — one reviewer per thesis |
| Reviewer assignment | Undefined | **Open** — any REVIEWER_ROLE can review any SUBMITTED thesis |
| Scoring model | Single `uint8 score` | **Single `uint8 score` on-chain** — 4 dimensions are UI-only hints |
| Submissions per student | One (`mapping(address => bool)`) | **Multiple** (`mapping(address => uint256[])`) |
| State machine | 3 states: SUBMITTED → UNDER_REVIEW → FINALIZED | **4 states**: adds REJECTED from SUBMITTED or UNDER_REVIEW |
| Rejection | Not supported | **Admin can reject** — permanent, from SUBMITTED or UNDER_REVIEW |

---

## 1. State Machine

```
NOT_SUBMITTED → SUBMITTED → UNDER_REVIEW → FINALIZED
                     ↓              ↓
                  REJECTED       REJECTED
                  (permanent)    (permanent)
```

### Transitions

| Function | From | To | Role |
|---|---|---|---|
| `submitThesis(string thesisCID)` | NOT_SUBMITTED | SUBMITTED | STUDENT_ROLE |
| `reviewThesis(uint256 id, uint8 score, string reviewCID)` | SUBMITTED | UNDER_REVIEW | REVIEWER_ROLE |
| `finalizeGrade(uint256 id)` | UNDER_REVIEW | FINALIZED | ADMIN_ROLE |
| `rejectThesis(uint256 id)` | SUBMITTED or UNDER_REVIEW | REJECTED | ADMIN_ROLE |

### Rules

- A student may submit multiple theses (each gets a unique `thesisId`)
- Any REVIEWER_ROLE holder can review any SUBMITTED thesis (open reviewing)
- Only one review per thesis (first reviewer to submit wins)
- REJECTED is permanent — no further transitions allowed
- FINALIZED is permanent — no further transitions allowed
- `finalizeGrade` requires that a review exists (score > 0 or reviewer != address(0))

---

## 2. Contract Data Structures

### ThesisState Enum

```solidity
enum ThesisState {
    NOT_SUBMITTED,  // 0 — default, never stored
    SUBMITTED,      // 1
    UNDER_REVIEW,   // 2
    FINALIZED,      // 3
    REJECTED        // 4
}
```

### Thesis Struct

```solidity
struct Thesis {
    uint256 id;
    address submitter;       // student address
    string thesisCID;        // IPFS CID of the thesis PDF
    ThesisState state;
    uint8 score;             // reviewer score (0-100), 0 until reviewed
    address reviewer;        // reviewer who scored, address(0) until reviewed
    string reviewCID;        // IPFS CID of the review document
    uint256 submittedAt;     // block timestamp
    uint256 reviewedAt;      // block timestamp, 0 until reviewed
}
```

### Mappings & State

```solidity
mapping(uint256 => Thesis) public theses;
mapping(address => uint256[]) public studentTheses;
uint256 public nextThesisId;
```

---

## 3. Contract Functions

### Core Functions

```solidity
function submitThesis(string memory thesisCID) external onlyRole(STUDENT_ROLE)
```
- Creates a new Thesis with state SUBMITTED
- Appends thesisId to `studentTheses[msg.sender]`
- Emits `ThesisSubmitted(thesisId, msg.sender, thesisCID, block.timestamp)`

```solidity
function reviewThesis(uint256 thesisId, uint8 score, string memory reviewCID) external onlyRole(REVIEWER_ROLE)
```
- Requires thesis state is SUBMITTED
- Sets score, reviewer, reviewCID, reviewedAt
- Changes state to UNDER_REVIEW
- Emits `ThesisReviewed(thesisId, msg.sender, score, reviewCID)`

```solidity
function finalizeGrade(uint256 thesisId) external onlyRole(ADMIN_ROLE)
```
- Requires thesis state is UNDER_REVIEW
- Requires review exists (reviewer != address(0))
- Changes state to FINALIZED
- Emits `GradeFinalized(thesisId, thesis.score)`

```solidity
function rejectThesis(uint256 thesisId) external onlyRole(ADMIN_ROLE)
```
- Requires thesis state is SUBMITTED or UNDER_REVIEW
- Changes state to REJECTED
- Emits `ThesisRejected(thesisId, msg.sender, block.timestamp)`

### Query Functions

```solidity
function getThesisDetails(uint256 thesisId) external view returns (Thesis memory)
function getStudentTheses(address student) external view returns (uint256[] memory)
function getThesisCount() external view returns (uint256)
```

---

## 4. Events

```solidity
event ThesisSubmitted(uint256 indexed thesisId, address indexed submitter, string thesisCID, uint256 timestamp);
event ThesisReviewed(uint256 indexed thesisId, address indexed reviewer, uint8 score, string reviewCID);
event GradeFinalized(uint256 indexed thesisId, uint8 finalScore);
event ThesisRejected(uint256 indexed thesisId, address indexed admin, uint256 timestamp);
```

---

## 5. RBAC (unchanged)

Three roles via OpenZeppelin `AccessControl`:
- `STUDENT_ROLE` — can call `submitThesis`
- `REVIEWER_ROLE` — can call `reviewThesis`
- `ADMIN_ROLE` — can call `finalizeGrade`, `rejectThesis`, and grant/revoke roles

Constructor grants `ADMIN_ROLE` to deployer. Deploy script assigns roles to test accounts.

---

## 6. Frontend View Changes

### AdminView — Adjusted

**Remove:**
- 3-reviewer averaging panel (导师 A/B/C scores with average)
- "X/3 导师" counts in the table

**Replace with:**
- Single reviewer display: reviewer address + score + review CID link
- "Reviewed by: 0xAbCd...1234 · Score: 88 · Review: QmYk4...1FdA"

**Add:**
- Reject button alongside finalize button in the side panel
- `ThesisRejected` events in the contract event log
- REJECTED status badge (red: `#FEE2E2` / `#991B1B`)

**Stats grid adjustment:**
- "待评审" = count of SUBMITTED
- "评审中" = count of UNDER_REVIEW
- "已定稿" = count of FINALIZED
- Add "已驳回" = count of REJECTED (or merge into a single "其他" row)

### Status Badge Colors (updated)

| State | Background | Text |
|---|---|---|
| SUBMITTED | `#DBEAFE` | `#1E40AF` |
| UNDER_REVIEW | `#FEF3C7` | `#92400E` |
| FINALIZED | `#DCFCE7` | `#166534` |
| REJECTED | `#FEE2E2` | `#991B1B` |

### StudentView — No Changes

- Multiple submissions already shown in prototype ✓
- Steps progress bar unchanged
- File upload + IPFS simulation unchanged

### ReviewerView — No Changes

- Single score slider (0-100) ✓
- 4-dimension sliders remain as UI-only hints (not stored on-chain)
- Review text → IPFS → CID on-chain ✓

### HomeView — No Changes

---

## 7. IPFS Simulation (Development)

During development, IPFS is simulated locally:
- Generate mock CIDs using `Qm` + random base58 string
- File content is not actually uploaded anywhere
- CID is passed directly to the contract
- Production would use a real IPFS node or Pinata/web3.storage

---

## 8. Unit Test Updates

The original 10 test cases remain valid. Add these new cases for REJECTED state:

| # | Test | Type |
|---|---|---|
| 11 | Admin rejects a SUBMITTED thesis | Positive |
| 12 | Admin rejects an UNDER_REVIEW thesis | Positive |
| 13 | Non-admin tries to reject (expect revert) | Negative |
| 14 | Try to review a REJECTED thesis (expect revert) | Negative |
| 15 | Try to finalize a REJECTED thesis (expect revert) | Negative |
| 16 | Student submits multiple theses | Positive |

Total: ≥16 test cases (up from ≥8).

---

## 9. Updated Checklist Delta

Add to the original checklist:

### Smart Contract
- [ ] `rejectThesis` function: ADMIN_ROLE can reject from SUBMITTED or UNDER_REVIEW
- [ ] REJECTED state is permanent — no further transitions
- [ ] `studentTheses` mapping stores array of thesisIds per student
- [ ] `ThesisRejected` event emitted on rejection

### Unit Tests
- [ ] Admin rejects SUBMITTED thesis (expect state REJECTED)
- [ ] Admin rejects UNDER_REVIEW thesis (expect state REJECTED)
- [ ] Non-admin rejection attempt (expect revert)
- [ ] Review REJECTED thesis (expect revert)
- [ ] Finalize REJECTED thesis (expect revert)
- [ ] Student submits multiple theses (both tracked)

### Frontend
- [ ] Admin view shows single reviewer info (not 3-reviewer averaging)
- [ ] Admin view has reject button
- [ ] REJECTED status badge with red styling
- [ ] Event log shows ThesisRejected events
