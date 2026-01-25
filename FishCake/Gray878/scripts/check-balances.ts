/**
 * 检查所有测试网的余额
 * 用于部署前确认是否有足够的测试币
 */

import { ethers } from "hardhat";
import hre from "hardhat";

interface NetworkInfo {
  name: string;
  chainId: number;
  rpcUrl: string;
  minBalance: string; // 最低建议余额（ETH）
}

const TESTNETS: NetworkInfo[] = [
  {
    name: "Sepolia",
    chainId: 11155111,
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    minBalance: "0.01"
  },
  {
    name: "BSC Testnet",
    chainId: 97,
    rpcUrl: "https://bsc-testnet-rpc.publicnode.com",
    minBalance: "0.01"
  },
  {
    name: "Optimism Sepolia",
    chainId: 11155420,
    rpcUrl: "https://optimism-sepolia-rpc.publicnode.com",
    minBalance: "0.005"
  },
  {
    name: "Base Sepolia",
    chainId: 84532,
    rpcUrl: "https://base-sepolia-rpc.publicnode.com",
    minBalance: "0.005"
  },
  {
    name: "Arbitrum Sepolia",
    chainId: 421614,
    rpcUrl: "https://arbitrum-sepolia-rpc.publicnode.com",
    minBalance: "0.005"
  }
];

async function checkBalance(network: NetworkInfo, address: string) {
  try {
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);
    const balance = await provider.getBalance(address);
    const balanceEth = ethers.formatEther(balance);
    const minBalance = parseFloat(network.minBalance);
    const hasEnough = parseFloat(balanceEth) >= minBalance;

    return {
      network: network.name,
      chainId: network.chainId,
      balance: balanceEth,
      minBalance: network.minBalance,
      hasEnough,
      status: hasEnough ? "✅" : "❌"
    };
  } catch (error: any) {
    return {
      network: network.name,
      chainId: network.chainId,
      balance: "Error",
      minBalance: network.minBalance,
      hasEnough: false,
      status: "⚠️",
      error: error.message
    };
  }
}

async function main() {
  console.log("🔍 Checking testnet balances...\n");

  // 获取部署账户地址
  const [deployer] = await ethers.getSigners();
  const address = deployer.address;

  console.log("📍 Checking address:", address);
  console.log("━".repeat(80));

  // 检查所有测试网
  const results = await Promise.all(
    TESTNETS.map(network => checkBalance(network, address))
  );

  // 显示结果表格
  console.log("\n📊 Balance Summary:\n");
  console.log("Network              | Chain ID  | Balance      | Min Required | Status");
  console.log("━".repeat(80));

  let allReady = true;
  const needFunding: string[] = [];

  results.forEach(result => {
    const networkPadded = result.network.padEnd(20);
    const chainIdPadded = result.chainId.toString().padEnd(10);
    const balancePadded = (result.balance + " ETH").padEnd(13);
    const minPadded = (result.minBalance + " ETH").padEnd(13);

    console.log(
      `${networkPadded}| ${chainIdPadded}| ${balancePadded}| ${minPadded}| ${result.status}`
    );

    if (!result.hasEnough) {
      allReady = false;
      needFunding.push(result.network);
    }

    if (result.error) {
      console.log(`   ⚠️  Error: ${result.error}`);
    }
  });

  console.log("━".repeat(80));

  // 总结
  if (allReady) {
    console.log("\n✅ All testnets have sufficient balance!");
    console.log("🚀 You can proceed with deployment.\n");
  } else {
    console.log("\n❌ Some testnets need funding:\n");
    needFunding.forEach(network => {
      console.log(`   • ${network}`);
    });
    console.log("\n📝 Get testnet tokens from:");
    console.log("   • Sepolia: https://sepoliafaucet.com/");
    console.log("   • BSC Testnet: https://testnet.bnbchain.org/faucet-smart");
    console.log("   • Optimism Sepolia: https://app.optimism.io/faucet");
    console.log("   • Base Sepolia: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet");
    console.log("   • Arbitrum Sepolia: https://faucet.triangleplatform.com/arbitrum/sepolia");
    console.log("\n💡 Tip: You can also bridge from Sepolia to L2 testnets!");
    console.log("   • Optimism Bridge: https://app.optimism.io/bridge");
    console.log("   • Base Bridge: https://bridge.base.org/");
    console.log("   • Arbitrum Bridge: https://bridge.arbitrum.io/\n");
  }

  // 返回状态码
  process.exit(allReady ? 0 : 1);
}

main()
  .then(() => {})
  .catch((error) => {
    console.error("❌ Error checking balances:", error);
    process.exit(1);
  });
