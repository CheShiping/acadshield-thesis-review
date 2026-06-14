const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer, student, reviewer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Student account:", student.address);
  console.log("Reviewer account:", reviewer.address);

  const AcadShield = await hre.ethers.getContractFactory("AcadShield");
  const acadShield = await AcadShield.deploy();
  await acadShield.waitForDeployment();

  const contractAddress = await acadShield.getAddress();
  console.log("AcadShield deployed to:", contractAddress);

  const STUDENT_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("STUDENT_ROLE"));
  const REVIEWER_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("REVIEWER_ROLE"));
  const ADMIN_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("ADMIN_ROLE"));

  await acadShield.grantRole(STUDENT_ROLE, student.address);
  console.log("Granted STUDENT_ROLE to:", student.address);

  await acadShield.grantRole(REVIEWER_ROLE, reviewer.address);
  console.log("Granted REVIEWER_ROLE to:", reviewer.address);

  await acadShield.grantRole(ADMIN_ROLE, deployer.address);
  console.log("Granted ADMIN_ROLE to:", deployer.address);

  const artifact = await hre.artifacts.readArtifact("AcadShield");
  const abiDir = path.join(__dirname, "../../acadshield-thesis-review-frontend/src/abi");

  if (!fs.existsSync(abiDir)) {
    fs.mkdirSync(abiDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(abiDir, "AcadShield.json"),
    JSON.stringify({ address: contractAddress, abi: artifact.abi }, null, 2)
  );

  console.log("ABI exported to frontend project");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
