import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  console.log("\nDeploying HandleRegistry...");
  const HandleRegistry = await ethers.getContractFactory("HandleRegistry");
  const handleRegistry = await HandleRegistry.deploy();
  await handleRegistry.waitForDeployment();
  const handleRegistryAddress = await handleRegistry.getAddress();
  console.log("HandleRegistry deployed to:", handleRegistryAddress);

  const deployment = {
    network: "arbitrumSepolia",
    chainId: 421614,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      HandleRegistry: handleRegistryAddress,
    },
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentsDir, "arbitrum-sepolia.json"),
    JSON.stringify(deployment, null, 2)
  );

  console.log("\n✅ Deployment complete!");
  console.log("=".repeat(60));
  console.log("Add this to your apps/api/.env:");
  console.log(`HANDLE_REGISTRY_ADDRESS=${handleRegistryAddress}`);
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
