import { ethers } from "ethers";

async function main() {
  console.log("🔍 Testing EventManager contract...\n");

  const contractAddress = "0x2f06e82553834f9c27Be98824fe15Fe47A823696";
  
  // 连接到 Sepolia 网络
  const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
  
  // EventManager ABI (简化版本，只包含我们需要测试的方法)
  const abi = [
    "function getTotalEvents() external view returns (uint256)",
    "function getEvent(uint256 eventId) external view returns (tuple(uint256 id, address creator, string title, string description, uint256 entryFee, uint256 maxParticipants, uint256 currentParticipants, uint256 createdAt, bool isActive))"
  ];

  try {
    // 创建合约实例
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    console.log("📍 Contract Address:", contractAddress);
    console.log("🌐 Network: Sepolia");
    
    // 测试 getTotalEvents 方法
    console.log("\n🔍 Testing getTotalEvents...");
    const totalEvents = await contract.getTotalEvents();
    console.log("✅ Total Events:", totalEvents.toString());
    
    // 如果有事件，尝试获取第一个事件的详情
    if (totalEvents > 0n) {
      console.log("\n🔍 Testing getEvent(0)...");
      const event = await contract.getEvent(0n);
      console.log("✅ Event 0 Details:");
      console.log("   ID:", event.id.toString());
      console.log("   Creator:", event.creator);
      console.log("   Title:", event.title);
      console.log("   Description:", event.description);
      console.log("   Entry Fee:", ethers.formatEther(event.entryFee), "ETH");
      console.log("   Max Participants:", event.maxParticipants.toString());
      console.log("   Current Participants:", event.currentParticipants.toString());
      console.log("   Is Active:", event.isActive);
    }
    
    console.log("\n✅ Contract is working correctly!");
    
  } catch (error: any) {
    console.error("❌ Contract test failed:", error.message);
    
    // 检查是否是合约不存在的错误
    if (error.message.includes("call revert exception") || error.message.includes("execution reverted")) {
      console.log("\n💡 This might mean:");
      console.log("   1. The contract is not deployed at this address");
      console.log("   2. The contract doesn't have the expected methods");
      console.log("   3. The network is different from expected");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });