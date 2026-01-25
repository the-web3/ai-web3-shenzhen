/**
 * Verify Contracts
 * 
 * 检查合约地址是否有代码部署
 */

import { ethers } from 'ethers'
import { DEPLOYED_CONTRACTS } from '../src/config/deployedContracts'

const CHAIN_RPCS: Record<string, string> = {
  sepolia: 'https://ethereum-sepolia-rpc.publicnode.com',
  bscTestnet: 'https://bsc-testnet-rpc.publicnode.com',
  optimismSepolia: 'https://optimism-sepolia-rpc.publicnode.com',
  baseSepolia: 'https://base-sepolia-rpc.publicnode.com',
  arbitrumSepolia: 'https://arbitrum-sepolia-rpc.publicnode.com'
}

async function checkContract(chainName: string, address: string, rpcUrl: string) {
  try {
    console.log(`\n🔍 Checking ${chainName}...`)
    console.log(`   Address: ${address}`)
    
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    
    // 获取代码
    const code = await provider.getCode(address)
    
    if (code === '0x') {
      console.log(`   ❌ NO CODE - 地址上没有合约代码！`)
      console.log(`   💡 这个地址可能：`)
      console.log(`      1. 还没有部署合约`)
      console.log(`      2. 部署失败了`)
      console.log(`      3. 地址填写错误`)
      return false
    } else {
      console.log(`   ✅ HAS CODE - 合约已部署`)
      console.log(`   📏 Code size: ${(code.length - 2) / 2} bytes`)
      return true
    }
  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('🔎 Verifying Deployed Contracts\n')
  console.log('='.repeat(60))
  
  let hasCodeCount = 0
  let noCodeCount = 0
  let skippedCount = 0
  
  for (const [chainName, address] of Object.entries(DEPLOYED_CONTRACTS.eventManager)) {
    if (!address || address.trim() === '') {
      console.log(`\n⏭️  Skipping ${chainName} (no address configured)`)
      skippedCount++
      continue
    }
    
    const rpcUrl = CHAIN_RPCS[chainName]
    if (!rpcUrl) {
      console.log(`\n⚠️  Skipping ${chainName} (no RPC configured)`)
      skippedCount++
      continue
    }
    
    const hasCode = await checkContract(chainName, address, rpcUrl)
    if (hasCode) {
      hasCodeCount++
    } else {
      noCodeCount++
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 Summary:\n')
  console.log(`✅ Has Code:  ${hasCodeCount}`)
  console.log(`❌ No Code:   ${noCodeCount}`)
  console.log(`⏭️  Skipped:   ${skippedCount}`)
  
  if (noCodeCount > 0) {
    console.log('\n⚠️  警告：有 ${noCodeCount} 个地址没有合约代码！')
    console.log('请检查 src/config/deployedContracts.ts 中的地址是否正确。')
  }
}

main().catch(console.error)
