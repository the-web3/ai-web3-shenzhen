const hre = require("hardhat");

/**
 * Deploy P256Account Factory and Implementation
 * 
 * Sepolia EntryPoint: 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
 */
async function main() {
  console.log("🚀 Deploying P256Account Factory...\n");

  // EntryPoint addresses (ERC-4337 v0.6)
  const ENTRYPOINT_ADDRESSES = {
    hashkeyTestnet: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
    sepolia: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
    polygon: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
    polygonAmoy: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  };

  const network = hre.network.name;
  const entryPointAddress = ENTRYPOINT_ADDRESSES[network] || ENTRYPOINT_ADDRESSES.sepolia;

  console.log(`📍 Network: ${network}`);
  console.log(`📍 EntryPoint: ${entryPointAddress}\n`);

  // Deploy P256AccountFactory
  console.log("📦 Deploying P256AccountFactory...");
  const P256AccountFactory = await hre.ethers.getContractFactory("P256AccountFactory");
  const factory = await P256AccountFactory.deploy(entryPointAddress);
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log(`✅ P256AccountFactory deployed at: ${factoryAddress}`);

  // Get implementation address
  const implementationAddress = await factory.accountImplementation();
  console.log(`✅ P256Account implementation at: ${implementationAddress}\n`);

  // Test: Compute a sample wallet address
  console.log("🧪 Testing address computation...");
  const sampleX = "0x1234567890123456789012345678901234567890123456789012345678901234";
  const sampleY = "0x5678901234567890123456789012345678901234567890123456789012345678";
  const salt = 0;

  const computedAddress = await factory.getAddress(sampleX, sampleY, salt);
  console.log(`✅ Sample wallet address: ${computedAddress}\n`);

  // Save deployment info
  const deploymentInfo = {
    network,
    entryPoint: entryPointAddress,
    factory: factoryAddress,
    implementation: implementationAddress,
    timestamp: new Date().toISOString(),
  };

  console.log("📝 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Verify contracts on block explorer (if not localhost)
  if (network !== "hardhat" && network !== "localhost" && network !== "hashkeyTestnet") {
    console.log("\n⏳ Waiting 30s before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    try {
      console.log("\n🔍 Verifying P256AccountFactory on Etherscan...");
      await hre.run("verify:verify", {
        address: factoryAddress,
        constructorArguments: [entryPointAddress],
      });
      console.log("✅ Factory verified!");

      console.log("\n🔍 Verifying P256Account implementation...");
      await hre.run("verify:verify", {
        address: implementationAddress,
        constructorArguments: [entryPointAddress],
      });
      console.log("✅ Implementation verified!");
    } catch (error) {
      console.log("⚠️  Verification failed (might be already verified):", error.message);
    }
  }

  console.log("\n🎉 Deployment complete!");
  console.log("\n📌 Add these to your .env:");
  console.log(`FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`IMPLEMENTATION_ADDRESS=${implementationAddress}`);
  console.log(`ENTRYPOINT_ADDRESS=${entryPointAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
