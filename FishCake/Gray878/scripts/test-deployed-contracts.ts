/**
 * Test Deployed Contracts
 * 
 * 验证所有已部署的合约是否可用
 */

import { ethers } from 'ethers'
import { DEPLOYED_CONTRACTS } from '../src/config/deployedContracts'

// Chain RPC URLs
const CHAIN_RPCS: Record<string, string> = {
  sepolia: 'https://ethereum-sepolia-rpc.publicnode.com',
  bscTestnet: 'https://bsc-testnet-rpc.publicnode.com',
  optimismSepolia: 'https://optimism-sepolia-rpc.publicnode.com',
  baseSepolia: 'https://base-sepolia-rpc.publicnode.com',
  arbitrumSepolia: 'https://arbitrum-sepolia-rpc.publicnode.com'
}

// EventManager ABI (只需要基本函数)
const EVENT_MANAGER_ABI = [
  'function eventCount() view returns (uint256)',
  'function getEvent(uint256 eventId) view returns (tuple(uint256 id, string title, string description, uint256 entryFee, uint256 maxParticipants, uint256 currentParticipants, address creator, bool isActive, uint256 totalPool))',
  'function owner() view returns (address)'
]

interface TestResult {
  chain: string
  address: string
  status: 'success' | 'failed' | 'skipped'
  message: string
  eventCount?: number
  owner?: string
}

async function testContract(
  chainName: string,
  contractAddress: string,
  rpcUrl: string
): Promise<TestResult> {
  try {
    console.log(`\n🔍 Testing ${chainName}...`)
    console.log(`   Contract: ${contractAddress}`)
    console.log(`   RPC: ${rpcUrl}`)

    // 创建 provider
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    
    // 测试 RPC 连接
    const blockNumber = await provider.getBlockNumber()
    console.log(`   ✓ RPC connected (block: ${blockNumber})`)

    // 创建合约实例
    const contract = new ethers.Contract(
      contractAddress,
      EVENT_MANAGER_ABI,
      provider
    )

    // 测试合约调用
    const eventCount = await contract.eventCount()
    console.log(`   ✓ Contract accessible (events: ${eventCount})`)

    // 获取 owner
    const owner = await contract.owner()
    console.log(`   ✓ Owner: ${owner}`)

    return {
      chain: chainName,
      address: contractAddress,
      status: 'success',
      message: 'Contract is accessible and working',
      eventCount: Number(eventCount),
      owner
    }
  } catch (error: any) {
    console.log(`   ✗ Error: ${error.message}`)
    return {
      chain: chainName,
      address: contractAddress,
      status: 'failed',
      message: error.message
    }
  }
}

async function main() {
  console.log('🚀 Testing Deployed Contracts\n')
  console.log('=' .repeat(60))

  const results: TestResult[] = []

  // 测试所有已配置的合约
  for (const [chainName, contractAddress] of Object.entries(DEPLOYED_CONTRACTS.eventManager)) {
    if (!contractAddress || contractAddress.trim() === '') {
      console.log(`\n⏭️  Skipping ${chainName} (no contract address)`)
      results.push({
        chain: chainName,
        address: '',
        status: 'skipped',
        message: 'No contract address configured'
      })
      continue
    }

    const rpcUrl = CHAIN_RPCS[chainName]
    if (!rpcUrl) {
      console.log(`\n⚠️  Skipping ${chainName} (no RPC URL)`)
      results.push({
        chain: chainName,
        address: contractAddress,
        status: 'skipped',
        message: 'No RPC URL configured'
      })
      continue
    }

    const result = await testContract(chainName, contractAddress, rpcUrl)
    results.push(result)
  }

  // 打印总结
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 Test Summary\n')

  const successCount = results.filter(r => r.status === 'success').length
  const failedCount = results.filter(r => r.status === 'failed').length
  const skippedCount = results.filter(r => r.status === 'skipped').length

  console.log(`✅ Success: ${successCount}`)
  console.log(`❌ Failed:  ${failedCount}`)
  console.log(`⏭️  Skipped: ${skippedCount}`)
  console.log(`📝 Total:   ${results.length}`)

  console.log('\n📋 Detailed Results:\n')
  
  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : result.status === 'failed' ? '❌' : '⏭️'
    console.log(`${icon} ${result.chain}`)
    console.log(`   Address: ${result.address || 'N/A'}`)
    console.log(`   Status: ${result.status}`)
    console.log(`   Message: ${result.message}`)
    if (result.eventCount !== undefined) {
      console.log(`   Events: ${result.eventCount}`)
    }
    if (result.owner) {
      console.log(`   Owner: ${result.owner}`)
    }
    console.log()
  })

  // 退出码
  process.exit(failedCount > 0 ? 1 : 0)
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
