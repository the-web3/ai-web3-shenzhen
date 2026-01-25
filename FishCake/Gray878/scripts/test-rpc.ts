/**
 * RPC 节点测试脚本
 * 用于测试各个 RPC 节点的可用性和响应速度
 */

import { ethers } from "ethers";

const SEPOLIA_RPCS = [
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://rpc.sepolia.org",
  "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
  "https://sepolia.gateway.tenderly.co",
  "https://sepolia.drpc.org",
  "https://1rpc.io/sepolia",
];

async function testRpc(rpcUrl: string, chainId: number): Promise<{ success: boolean; latency: number; error?: string }> {
  const startTime = Date.now();
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl, chainId, { staticNetwork: true });
    await Promise.race([
      provider.getBlockNumber(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
    ]);
    const latency = Date.now() - startTime;
    return { success: true, latency };
  } catch (error: any) {
    const latency = Date.now() - startTime;
    return { success: false, latency, error: error.message };
  }
}

async function findBestRpc(rpcs: string[], chainId: number): Promise<string | null> {
  console.log(`\n🔍 Testing ${rpcs.length} RPC nodes for chain ID ${chainId}...\n`);
  
  const results = await Promise.all(
    rpcs.map(async (rpc) => {
      const result = await testRpc(rpc, chainId);
      const status = result.success ? "✅" : "❌";
      const latency = result.latency < 1000 ? `${result.latency}ms` : `${(result.latency / 1000).toFixed(1)}s`;
      console.log(`${status} ${rpc.padEnd(60)} ${latency.padStart(8)} ${result.error || ""}`);
      return { rpc, ...result };
    })
  );

  const workingRpcs = results.filter(r => r.success).sort((a, b) => a.latency - b.latency);
  
  if (workingRpcs.length === 0) {
    console.log("\n❌ No working RPC nodes found!");
    return null;
  }

  const best = workingRpcs[0];
  console.log(`\n✅ Best RPC: ${best.rpc} (${best.latency}ms)`);
  return best.rpc;
}

async function main() {
  console.log("🚀 RPC Node Tester\n");
  
  const bestSepolia = await findBestRpc(SEPOLIA_RPCS, 11155111);
  
  if (bestSepolia) {
    console.log(`\n💡 Recommended RPC for Sepolia:`);
    console.log(`   ${bestSepolia}`);
    console.log(`\n📝 Add to your .env file:`);
    console.log(`   SEPOLIA_RPC_URL=${bestSepolia}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
