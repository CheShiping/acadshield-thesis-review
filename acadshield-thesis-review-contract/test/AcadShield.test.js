const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AcadShield", function () {
  let acadShield;
  let admin, student, reviewer, other;

  const STUDENT_ROLE = ethers.keccak256(ethers.toUtf8Bytes("STUDENT_ROLE"));
  const REVIEWER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REVIEWER_ROLE"));
  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));

  beforeEach(async function () {
    [admin, student, reviewer, other] = await ethers.getSigners();

    const AcadShield = await ethers.getContractFactory("AcadShield");
    acadShield = await AcadShield.deploy();
    await acadShield.waitForDeployment();

    await acadShield.grantRole(STUDENT_ROLE, student.address);
    await acadShield.grantRole(REVIEWER_ROLE, reviewer.address);
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await acadShield.getAddress()).to.be.properAddress;
    });

    it("Should grant ADMIN_ROLE to deployer", async function () {
      expect(await acadShield.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
    });
  });

  describe("submitThesis", function () {
    it("Should allow student to submit thesis", async function () {
      const tx = await acadShield.connect(student).submitThesis("QmTestCID123");
      await expect(tx).to.emit(acadShield, "ThesisSubmitted");

      const thesis = await acadShield.getThesisDetails(0);
      expect(thesis.submitter).to.equal(student.address);
      expect(thesis.thesisCID).to.equal("QmTestCID123");
      expect(thesis.state).to.equal(1);
    });

    it("Should allow student to submit multiple theses", async function () {
      await acadShield.connect(student).submitThesis("QmCID1");
      await acadShield.connect(student).submitThesis("QmCID2");

      const theses = await acadShield.getStudentTheses(student.address);
      expect(theses.length).to.equal(2);
      expect(theses[0]).to.equal(0);
      expect(theses[1]).to.equal(1);
    });

    it("Should revert if non-student tries to submit", async function () {
      await expect(
        acadShield.connect(other).submitThesis("QmTestCID123")
      ).to.be.reverted;
    });
  });

  describe("reviewThesis", function () {
    beforeEach(async function () {
      await acadShield.connect(student).submitThesis("QmTestCID123");
    });

    it("Should allow reviewer to review thesis", async function () {
      const tx = await acadShield.connect(reviewer).reviewThesis(0, 85, "QmReviewCID123");
      await expect(tx).to.emit(acadShield, "ThesisReviewed");

      const thesis = await acadShield.getThesisDetails(0);
      expect(thesis.reviewer).to.equal(reviewer.address);
      expect(thesis.score).to.equal(85);
      expect(thesis.reviewCID).to.equal("QmReviewCID123");
      expect(thesis.state).to.equal(2);
    });

    it("Should revert if non-reviewer tries to review", async function () {
      await expect(
        acadShield.connect(other).reviewThesis(0, 85, "QmReviewCID123")
      ).to.be.reverted;
    });

    it("Should revert if thesis is not in SUBMITTED state", async function () {
      await acadShield.connect(reviewer).reviewThesis(0, 85, "QmReviewCID123");
      await expect(
        acadShield.connect(reviewer).reviewThesis(0, 90, "QmReviewCID456")
      ).to.be.reverted;
    });
  });

  describe("finalizeGrade", function () {
    beforeEach(async function () {
      await acadShield.connect(student).submitThesis("QmTestCID123");
      await acadShield.connect(reviewer).reviewThesis(0, 85, "QmReviewCID123");
    });

    it("Should allow admin to finalize grade", async function () {
      const tx = await acadShield.connect(admin).finalizeGrade(0);
      await expect(tx).to.emit(acadShield, "GradeFinalized");

      const thesis = await acadShield.getThesisDetails(0);
      expect(thesis.state).to.equal(3);
    });

    it("Should revert if non-admin tries to finalize", async function () {
      await expect(
        acadShield.connect(other).finalizeGrade(0)
      ).to.be.reverted;
    });

    it("Should revert if thesis is not in UNDER_REVIEW state", async function () {
      await acadShield.connect(admin).finalizeGrade(0);
      await expect(
        acadShield.connect(admin).finalizeGrade(0)
      ).to.be.reverted;
    });
  });

  describe("rejectThesis", function () {
    it("Should allow admin to reject SUBMITTED thesis", async function () {
      await acadShield.connect(student).submitThesis("QmTestCID123");

      const tx = await acadShield.connect(admin).rejectThesis(0);
      await expect(tx).to.emit(acadShield, "ThesisRejected");

      const thesis = await acadShield.getThesisDetails(0);
      expect(thesis.state).to.equal(4);
    });

    it("Should allow admin to reject UNDER_REVIEW thesis", async function () {
      await acadShield.connect(student).submitThesis("QmTestCID123");
      await acadShield.connect(reviewer).reviewThesis(0, 85, "QmReviewCID123");

      const tx = await acadShield.connect(admin).rejectThesis(0);
      await expect(tx).to.emit(acadShield, "ThesisRejected");

      const thesis = await acadShield.getThesisDetails(0);
      expect(thesis.state).to.equal(4);
    });

    it("Should revert if non-admin tries to reject", async function () {
      await acadShield.connect(student).submitThesis("QmTestCID123");

      await expect(
        acadShield.connect(other).rejectThesis(0)
      ).to.be.reverted;
    });

    it("Should revert if trying to review rejected thesis", async function () {
      await acadShield.connect(student).submitThesis("QmTestCID123");
      await acadShield.connect(admin).rejectThesis(0);

      await expect(
        acadShield.connect(reviewer).reviewThesis(0, 85, "QmReviewCID123")
      ).to.be.reverted;
    });

    it("Should revert if trying to finalize rejected thesis", async function () {
      await acadShield.connect(student).submitThesis("QmTestCID123");
      await acadShield.connect(reviewer).reviewThesis(0, 85, "QmReviewCID123");
      await acadShield.connect(admin).rejectThesis(0);

      await expect(
        acadShield.connect(admin).finalizeGrade(0)
      ).to.be.reverted;
    });
  });

  describe("Query functions", function () {
    it("Should return correct thesis count", async function () {
      await acadShield.connect(student).submitThesis("QmCID1");
      await acadShield.connect(student).submitThesis("QmCID2");

      expect(await acadShield.getThesisCount()).to.equal(2);
    });

    it("Should return empty array for student with no theses", async function () {
      const theses = await acadShield.getStudentTheses(student.address);
      expect(theses.length).to.equal(0);
    });
  });

  describe("Complete workflow", function () {
    it("Should complete full workflow: submit -> review -> finalize", async function () {
      await acadShield.connect(student).submitThesis("QmThesisCID");

      let thesis = await acadShield.getThesisDetails(0);
      expect(thesis.state).to.equal(1);

      await acadShield.connect(reviewer).reviewThesis(0, 92, "QmReviewCID");

      thesis = await acadShield.getThesisDetails(0);
      expect(thesis.state).to.equal(2);
      expect(thesis.score).to.equal(92);

      await acadShield.connect(admin).finalizeGrade(0);

      thesis = await acadShield.getThesisDetails(0);
      expect(thesis.state).to.equal(3);
    });
  });
});
