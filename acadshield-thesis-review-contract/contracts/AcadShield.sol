// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract AcadShield is AccessControl, ReentrancyGuard {
    bytes32 public constant STUDENT_ROLE = keccak256("STUDENT_ROLE");
    bytes32 public constant REVIEWER_ROLE = keccak256("REVIEWER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    enum ThesisState {
        NOT_SUBMITTED,
        SUBMITTED,
        UNDER_REVIEW,
        FINALIZED,
        REJECTED
    }

    struct Thesis {
        uint256 id;
        address submitter;
        string thesisCID;
        ThesisState state;
        uint8 score;
        address reviewer;
        string reviewCID;
        uint256 submittedAt;
        uint256 reviewedAt;
    }

    mapping(uint256 => Thesis) public theses;
    mapping(address => uint256[]) public studentTheses;
    uint256 public nextThesisId;

    event ThesisSubmitted(
        uint256 indexed thesisId,
        address indexed submitter,
        string thesisCID,
        uint256 timestamp
    );

    event ThesisReviewed(
        uint256 indexed thesisId,
        address indexed reviewer,
        uint8 score,
        string reviewCID
    );

    event GradeFinalized(uint256 indexed thesisId, uint8 finalScore);

    event ThesisRejected(
        uint256 indexed thesisId,
        address indexed admin,
        uint256 timestamp
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function submitThesis(string memory thesisCID) external onlyRole(STUDENT_ROLE) {
        uint256 thesisId = nextThesisId++;

        Thesis storage thesis = theses[thesisId];
        thesis.id = thesisId;
        thesis.submitter = msg.sender;
        thesis.thesisCID = thesisCID;
        thesis.state = ThesisState.SUBMITTED;
        thesis.submittedAt = block.timestamp;

        studentTheses[msg.sender].push(thesisId);

        emit ThesisSubmitted(thesisId, msg.sender, thesisCID, block.timestamp);
    }

    function reviewThesis(
        uint256 thesisId,
        uint8 score,
        string memory reviewCID
    ) external onlyRole(REVIEWER_ROLE) {
        Thesis storage thesis = theses[thesisId];
        require(thesis.state == ThesisState.SUBMITTED, "Thesis not in SUBMITTED state");
        require(thesis.reviewer == address(0), "Thesis already reviewed");

        thesis.state = ThesisState.UNDER_REVIEW;
        thesis.score = score;
        thesis.reviewer = msg.sender;
        thesis.reviewCID = reviewCID;
        thesis.reviewedAt = block.timestamp;

        emit ThesisReviewed(thesisId, msg.sender, score, reviewCID);
    }

    function finalizeGrade(uint256 thesisId) external onlyRole(ADMIN_ROLE) {
        Thesis storage thesis = theses[thesisId];
        require(thesis.state == ThesisState.UNDER_REVIEW, "Thesis not in UNDER_REVIEW state");
        require(thesis.reviewer != address(0), "No review exists");

        thesis.state = ThesisState.FINALIZED;

        emit GradeFinalized(thesisId, thesis.score);
    }

    function rejectThesis(uint256 thesisId) external onlyRole(ADMIN_ROLE) {
        Thesis storage thesis = theses[thesisId];
        require(
            thesis.state == ThesisState.SUBMITTED || thesis.state == ThesisState.UNDER_REVIEW,
            "Cannot reject thesis in current state"
        );

        thesis.state = ThesisState.REJECTED;

        emit ThesisRejected(thesisId, msg.sender, block.timestamp);
    }

    function getThesisDetails(uint256 thesisId) external view returns (Thesis memory) {
        return theses[thesisId];
    }

    function getStudentTheses(address student) external view returns (uint256[] memory) {
        return studentTheses[student];
    }

    function getThesisCount() external view returns (uint256) {
        return nextThesisId;
    }
}
