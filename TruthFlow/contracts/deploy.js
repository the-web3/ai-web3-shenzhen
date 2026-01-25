const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying TruthArenaV2 contract (with Dynamic Yield Strategy)...");
  console.log("=" .repeat(50));

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy TruthArena
  console.log("\n⏳ Deploying TruthArenaV2 (with Dynamic Yield Strategy)...");
  const TruthArenaV2 = await hre.ethers.getContractFactory("TruthArenaV2");
  const truthArena = await TruthArenaV2.deploy();

  await truthArena.waitForDeployment();
  const address = await truthArena.getAddress();

  console.log("✅ TruthArenaV2 deployed to:", address);
  console.log("=" .repeat(50));

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    address: address,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };

  const deploymentPath = path.join(__dirname, "../config/deployment.json");
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n📄 Deployment info saved to:", deploymentPath);

  // Update contract config
  const configPath = path.join(__dirname, "../config/contractConfig.ts");
  if (fs.existsSync(configPath)) {
    let config = fs.readFileSync(configPath, "utf8");
    // Update POLYMARKET_CONTRACT_ADDRESS
    config = config.replace(
      /POLYMARKET_CONTRACT_ADDRESS:\s*['"]0x[a-fA-F0-9]{40}['"]/,
      `POLYMARKET_CONTRACT_ADDRESS: '${address}'`
    );
    fs.writeFileSync(configPath, config);
    console.log("✅ Updated contractConfig.ts with new address");
  }

  // Verify contract if not on localhost
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n⏳ Waiting for block confirmations...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    try {
      console.log("🔍 Verifying contract on Explorer...");
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: []
      });
      console.log("✅ Contract verified!");
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("🎉 Deployment complete!");
  console.log("=" .repeat(50));
  console.log("\n📋 Next steps:");
  console.log("1. Update frontend config with new address");
  console.log("2. Test contract functions");
  console.log("3. Create your first market!");
  console.log("\n🔗 Contract address:", address);
  console.log("🌐 Network:", hre.network.name);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
