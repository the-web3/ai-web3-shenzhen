import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Starting EventManager deployment...\n");

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying contracts with account:", deployer.address);

  // 查询账户余额
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // 部署 EventManager 合约
  console.log("📝 Deploying EventManager contract...");
  const EventManager = await ethers.getContractFactory("EventManager");
  const eventManager = await EventManager.deploy();

  await eventManager.waitForDeployment();

  const address = await eventManager.getAddress();
  console.log("✅ EventManager deployed to:", address);

  // 获取网络信息
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name);
  console.log("🔗 Chain ID:", network.chainId.toString());

  // 等待区块确认（带重试机制）
  console.log("\n⏳ Waiting for block confirmations...");
  const deployTx = eventManager.deploymentTransaction();
  if (deployTx) {
    let confirmed = false;
    const maxRetries = 3;
    const confirmations = 1; // 减少到1个确认以提高成功率
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        await deployTx.wait(confirmations);
        console.log(`✅ Transaction confirmed in ${confirmations} block(s)`);
        confirmed = true;
        break;
      } catch (error: any) {
        const errorMsg = error.message || String(error);
        if (errorMsg.includes("Temporary internal error") || error.code === 19) {
          console.log(`⚠️  RPC temporary error (attempt ${i + 1}/${maxRetries}), retrying...`);
          if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // 等待3秒后重试
            continue;
          }
        }
        // 如果是其他错误或重试次数用完，记录警告但继续
        console.warn(`⚠️  Could not wait for confirmations: ${errorMsg}`);
        console.warn(`    Transaction may still be pending. Check on block explorer: https://sepolia.etherscan.io/tx/${deployTx.hash}`);
        break;
      }
    }
    
    if (!confirmed) {
      console.log("\n💡 Tip: The contract may still be deploying. Check the transaction on:");
      console.log(`   https://sepolia.etherscan.io/tx/${deployTx.hash}`);
    }
  }

  // 保存部署信息到文件
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contractAddress: address,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    blockNumber: deployTx?.blockNumber,
    transactionHash: deployTx?.hash
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const fileName = `${network.name}_${network.chainId}.json`;
  const filePath = path.join(deploymentsDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n📄 Deployment info saved to:", filePath);

  // 提示更新 deployedContracts.ts
  console.log("\n📝 Next steps:");
  console.log("1. Update src/config/deployedContracts.ts with the deployed address:");
  const networkMap: Record<string, string> = {
    'sepolia': 'sepolia',
    'bscTestnet': 'bscTestnet',
    'optimismSepolia': 'optimismSepolia',
    'baseSepolia': 'baseSepolia',
    'arbitrumSepolia': 'arbitrumSepolia'
  };
  const configKey = networkMap[network.name];
  if (configKey) {
    console.log(`   ${configKey}: "${address}",`);
  } else {
    console.log(`   Add entry for ${network.name} (Chain ID: ${network.chainId})`);
  }
  console.log("2. Rebuild the SDK: npm run build");

  // 显示验证命令
  console.log("\n🔍 To verify the contract on block explorer, run:");
  console.log(`npx hardhat verify --network ${network.name} ${address}\n`);

  console.log("🎉 Deployment completed successfully!\n");

  // 返回部署地址供其他脚本使用
  return address;
}

// 执行部署
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
