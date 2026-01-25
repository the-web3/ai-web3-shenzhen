const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying DepositManager to Ethereum Sepolia...");

  // 获取合约工厂
  const DepositManager = await hre.ethers.getContractFactory("DepositManager");
  
  // 部署合约
  console.log("📝 Deploying contract...");
  const depositManager = await DepositManager.deploy();

  await depositManager.waitForDeployment();

  const address = await depositManager.getAddress();
  console.log("✅ DepositManager deployed to:", address);
  console.log("📋 Transaction hash:", depositManager.deploymentTransaction().hash);
  
  // 等待区块确认
  console.log("⏳ Waiting for 5 block confirmations...");
  await depositManager.deploymentTransaction().wait(5);
  console.log("✅ Confirmed!");
  
  // 验证合约（可选）
  try {
    console.log("🔍 Verifying contract on Etherscan...");
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [],
    });
    console.log("✅ Contract verified!");
  } catch (error) {
    console.log("⚠️ Verification failed (this is normal if already verified):", error.message);
  }

  console.log("\n📝 Next steps:");
  console.log("1. Update DEPOSIT_CONTRACT_ADDRESS in config/contractConfig.ts");
  console.log("2. Update depositContractService.ts with the new address");
  console.log(`   Address: ${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
