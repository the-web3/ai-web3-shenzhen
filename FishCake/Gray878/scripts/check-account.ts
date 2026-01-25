/**
 * 检查部署账户脚本
 * 用于验证 .env 文件中的私钥是否正确配置
 */

import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  console.log("🔍 Checking deployment account configuration...\n");

  // 重新加载环境变量（确保读取最新的）
  delete require.cache[require.resolve('dotenv/config')];
  require('dotenv').config();
  
  // 检查环境变量
  const privateKey = process.env.PRIVATE_KEY;
  
  console.log(`📋 PRIVATE_KEY from env: ${privateKey ? privateKey.substring(0, 10) + '...' + privateKey.substring(privateKey.length - 6) : 'NOT FOUND'}`);
  
  if (!privateKey) {
    console.error("❌ PRIVATE_KEY not found in .env file!");
    console.log("\n💡 Please add your private key to .env file:");
    console.log("   PRIVATE_KEY=0x你的私钥");
    process.exit(1);
  }

  // 验证私钥格式
  if (!privateKey.startsWith("0x")) {
    console.error("❌ PRIVATE_KEY must start with 0x");
    process.exit(1);
  }

  if (privateKey.length !== 66) {
    console.error(`❌ PRIVATE_KEY length incorrect: ${privateKey.length} (expected 66)`);
    console.log("   Private key should be 64 hex characters + 0x prefix = 66 characters");
    process.exit(1);
  }

  // 从私钥创建钱包
  try {
    const wallet = new ethers.Wallet(privateKey);
    const address = wallet.address;
    
    console.log("✅ Private key format is correct");
    console.log(`📍 Wallet address: ${address}`);
    console.log(`\n🎯 Target address: 0x2f06e82553834f9c27Be98824fe15Fe47A823696`);
    
    if (address.toLowerCase() === "0x2f06e82553834f9c27Be98824fe15Fe47A823696".toLowerCase()) {
      console.log("✅ Address matches! Configuration is correct.\n");
    } else {
      console.log("❌ Address does NOT match!");
      console.log("\n💡 Please update your .env file with the correct private key");
      console.log("   for address: 0x2f06e82553834f9c27Be98824fe15Fe47A823696\n");
      process.exit(1);
    }

    // 检查网络配置
    const network = await ethers.provider.getNetwork();
    console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
    
    // 检查余额
    const balance = await ethers.provider.getBalance(address);
    const balanceEth = ethers.formatEther(balance);
    console.log(`💰 Balance: ${balanceEth} ETH`);
    
    if (parseFloat(balanceEth) < 0.001) {
      console.log("\n⚠️  Low balance! You may need more ETH for gas fees.");
      console.log("   Get testnet ETH from: https://sepoliafaucet.com/");
    } else {
      console.log("✅ Sufficient balance for deployment");
    }

  } catch (error: any) {
    console.error("❌ Error creating wallet from private key:", error.message);
    console.log("\n💡 Please check your PRIVATE_KEY in .env file");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
