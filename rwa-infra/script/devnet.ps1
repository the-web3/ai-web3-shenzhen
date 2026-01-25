<#
Win10-friendly devnet script (PowerShell)
Usage:
  powershell -ExecutionPolicy Bypass -File script\devnet.ps1 up
  powershell -ExecutionPolicy Bypass -File script\devnet.ps1 down
#>

param(
  [ValidateSet('up','down')]
  [string]$Cmd = 'up'
)

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Resolve-Path (Join-Path $ScriptDir '..')

$StateDir = Join-Path $ScriptDir 'state'
$LogDir = Join-Path $StateDir 'logs'
$PidDir = Join-Path $StateDir 'pids'
$CfgDir = Join-Path $StateDir 'config'

New-Item -ItemType Directory -Force -Path $StateDir,$LogDir,$PidDir,$CfgDir | Out-Null

$RPC_URL = if ($env:RPC_URL) { $env:RPC_URL } else { 'http://127.0.0.1:8545' }
$CHAIN_ID = if ($env:CHAIN_ID) { $env:CHAIN_ID } else { '31337' }

# Anvil default accounts (0-9)
$DEPLOYER = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
$DEPLOYER_PK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

$ISSUER = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
$ISSUER_PK = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'

$COMPLIANCE = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
$COMPLIANCE_PK = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'

$USER = '0x90F79bf6EB2c4f870365E785982E1f101E93b906'
$USER_PK = '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6'

$ACC4 = '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65'
$ACC4_PK = '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a'
$ACC5 = '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc'
$ACC5_PK = '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba'
$ACC6 = '0x976EA74026E726554dB657fA54763abd0C3a0aa9'
$ACC6_PK = '0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e'
$ACC7 = '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955'
$ACC7_PK = '0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356'
$ACC8 = '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f'
$ACC8_PK = '0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97'
$ACC9 = '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720'
$ACC9_PK = '0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6'

$NODE1 = $ACC4; $NODE1_PK = $ACC4_PK
$NODE2 = $ACC5; $NODE2_PK = $ACC5_PK
$NODE3 = $ACC6; $NODE3_PK = $ACC6_PK

$ANVIL_PID = Join-Path $PidDir 'anvil.pid'
$MOCK_PID = Join-Path $PidDir 'mock.pid'
$OMGR_PID = Join-Path $PidDir 'oracle_manager.pid'
$NODE1_PID = Join-Path $PidDir 'node1.pid'
$NODE2_PID = Join-Path $PidDir 'node2.pid'
$NODE3_PID = Join-Path $PidDir 'node3.pid'

$OracleTmp = Join-Path $env:TEMP 'oracle'
$OracleTmpFs = $OracleTmp -replace '\\','/'

function Set-LocalRpcEnv {
  $env:NO_PROXY = '127.0.0.1,localhost'
  $env:no_proxy = '127.0.0.1,localhost'
  Remove-Item Env:HTTP_PROXY -ErrorAction SilentlyContinue
  Remove-Item Env:HTTPS_PROXY -ErrorAction SilentlyContinue
  Remove-Item Env:http_proxy -ErrorAction SilentlyContinue
  Remove-Item Env:https_proxy -ErrorAction SilentlyContinue
}

function Json-Get($file, $key) {
  $raw = Get-Content -Path $file -Raw -ErrorAction Stop
  $data = $raw | ConvertFrom-Json
  $val = $data.$key
  if (-not $val) { throw "missing key: $key in $file" }
  return $val
}

function Is-PidRunning($pidFile) {
  if (!(Test-Path $pidFile)) { return $false }
  $procId = Get-Content $pidFile -ErrorAction SilentlyContinue
  if (-not $procId) { return $false }
  try {
    $null = Get-Process -Id $procId -ErrorAction Stop
    return $true
  } catch {
    return $false
  }
}

function Kill-PidFile($pidFile) {
  if (Is-PidRunning $pidFile) {
    $procId = Get-Content $pidFile
    Write-Host "Stopping pid=$procId ($pidFile)"
    try { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue } catch {}
    Start-Sleep -Milliseconds 500
  }
  Remove-Item -Force -ErrorAction SilentlyContinue $pidFile
}

function Kill-Port($port) {
  $conns = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
  if (-not $conns) { return }
  $procIds = $conns | Select-Object -ExpandProperty OwningProcess -Unique
  if (-not $procIds) { return }
  Write-Host "Stopping processes listening on tcp:${port}: $($procIds -join ', ')"
  foreach ($procId in $procIds) {
    try { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue } catch {}
  }
  Start-Sleep -Milliseconds 200
}

function Kill-DevnetPorts {
  Kill-Port 8545
  Kill-Port 8888
  Kill-Port 8081
  Kill-Port 34567
}

function Kill-DevnetProcessesFallback {
  $patterns = @(
    "$CfgDir\manager.yaml",
    "$CfgDir\node1.yaml",
    "$CfgDir\node2.yaml",
    "$CfgDir\node3.yaml",
    'go run mock/server.go',
    "anvil --chain-id $CHAIN_ID"
  )

  foreach ($pat in $patterns) {
    $procs = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*$pat*" }
    foreach ($p in $procs) {
      Write-Host "Stopping process matching: $pat (pid $($p.ProcessId))"
      try { Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue } catch {}
    }
  }
}

function Wait-Rpc {
  Write-Host "Waiting for RPC: $RPC_URL"
  $uri = $null
  try { $uri = [System.Uri]$RPC_URL } catch { $uri = $null }
  $rpcHost = if ($uri) { $uri.Host } else { '127.0.0.1' }
  $rpcPort = if ($uri -and $uri.Port -gt 0) { $uri.Port } else { 8545 }
  for ($i=0; $i -lt 60; $i++) {
    try {
      $client = New-Object System.Net.Sockets.TcpClient
      $iar = $client.BeginConnect($rpcHost, $rpcPort, $null, $null)
      if ($iar.AsyncWaitHandle.WaitOne(500)) {
        $client.EndConnect($iar) | Out-Null
        $client.Close()
        return
      }
      $client.Close()
    } catch {
      # ignore transient connect errors while waiting
    }
    Start-Sleep -Milliseconds 250
  }
  throw "RPC not ready: $RPC_URL"
}

function Write-AccountsReport {
  $content = @"
## Anvil default accounts (fixed)

| # | address | privateKey | purpose | inUse |
|---:|---|---|---|---|
| 0 | $DEPLOYER | $DEPLOYER_PK | Deployer / RWA admin / Oracle Manager | yes |
| 1 | $ISSUER | $ISSUER_PK | RWA issuer (ISSUER_ROLE) | yes |
| 2 | $COMPLIANCE | $COMPLIANCE_PK | RWA compliance (COMPLIANCE_ROLE) | yes |
| 3 | $USER | $USER_PK | Demo user | yes |
| 4 | $ACC4 | $ACC4_PK | Oracle Node1 | yes |
| 5 | $ACC5 | $ACC5_PK | Oracle Node2 | yes |
| 6 | $ACC6 | $ACC6_PK | Oracle Node3 | yes |
| 7 | $ACC7 | $ACC7_PK | spare | no |
| 8 | $ACC8 | $ACC8_PK | spare | no |
| 9 | $ACC9 | $ACC9_PK | spare | no |
"@
  Set-Content -Path (Join-Path $StateDir 'anvil_accounts.md') -Value $content -Encoding UTF8
}

function Clean-OracleKeys {
  Write-Host "Cleaning oracle local keys/state: $OracleTmp"
  Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $OracleTmp
  New-Item -ItemType Directory -Force -Path $OracleTmp | Out-Null
  New-Item -ItemType Directory -Force -Path (Join-Path $OracleTmp 'bls\node1.key'),(Join-Path $OracleTmp 'bls\node2.key'),(Join-Path $OracleTmp 'bls\node3.key') | Out-Null
  New-Item -ItemType Directory -Force -Path (Join-Path $OracleTmp 'node1_storage'),(Join-Path $OracleTmp 'node2_storage'),(Join-Path $OracleTmp 'node3_storage'),(Join-Path $OracleTmp 'manager_storage') | Out-Null
}

function Start-AnvilBg {
  if (Is-PidRunning $ANVIL_PID) {
    Write-Host "Anvil already running (pid $(Get-Content $ANVIL_PID))."
    return
  }
  Write-Host 'Starting anvil in background...'
  $outLog = Join-Path $LogDir 'anvil.out.log'
  $errLog = Join-Path $LogDir 'anvil.err.log'
  $p = Start-Process -FilePath 'anvil' -ArgumentList "--chain-id $CHAIN_ID --host 127.0.0.1 --port 8545" -NoNewWindow -RedirectStandardOutput $outLog -RedirectStandardError $errLog -PassThru
  Set-Content -Path $ANVIL_PID -Value $p.Id -Encoding ASCII
}

function Deploy-Oracle {
  Write-Host 'Deploying oracle contracts...'
  $oracleDir = Join-Path $RootDir 'oracle\oracle-contracts'
  Push-Location $oracleDir

  Remove-Item -Force -ErrorAction SilentlyContinue deployed_addresses.json
  Remove-Item -Recurse -Force -ErrorAction SilentlyContinue broadcast,cache,out

  $env:PRIVATE_KEY = $DEPLOYER_PK
  $env:RELAYER_MANAGER = $DEPLOYER

  & forge script script/deployOracle.s.sol:deployOracleScript --rpc-url $RPC_URL --private-key $env:PRIVATE_KEY --broadcast --non-interactive --skip-simulation *> (Join-Path $LogDir 'oracle_deploy.log')

  $bls_registry = Json-Get (Join-Path $oracleDir 'deployed_addresses.json') 'proxyBlsApkRegistry'
  $oracle_manager = Json-Get (Join-Path $oracleDir 'deployed_addresses.json') 'proxyOracleManager'

  $env:ORACLE_MANAGER = $oracle_manager
  & forge script script/deployOraclePod.s.sol:deployOraclePodScript --rpc-url $RPC_URL --private-key $env:PRIVATE_KEY --broadcast --non-interactive --skip-simulation *> (Join-Path $LogDir 'oracle_pod_deploy.log')

  $oracle_pod = Json-Get (Join-Path $oracleDir 'deployed_addresses.json') 'proxyOraclePod'

  Pop-Location

  $script:ORACLE_BLS_REGISTRY = $bls_registry
  $script:ORACLE_MANAGER_PROXY = $oracle_manager
  $script:ORACLE_POD_PROXY = $oracle_pod
}

function Whitelist-OracleNodes {
  Write-Host 'Whitelisting oracle node operators...'
  & cast send $ORACLE_MANAGER_PROXY "addOrRemoveOperatorWhitelist(address,bool)" $NODE1 true --private-key $DEPLOYER_PK --rpc-url $RPC_URL *> (Join-Path $LogDir 'oracle_whitelist.log')
  & cast send $ORACLE_MANAGER_PROXY "addOrRemoveOperatorWhitelist(address,bool)" $NODE2 true --private-key $DEPLOYER_PK --rpc-url $RPC_URL >> (Join-Path $LogDir 'oracle_whitelist.log')
  & cast send $ORACLE_MANAGER_PROXY "addOrRemoveOperatorWhitelist(address,bool)" $NODE3 true --private-key $DEPLOYER_PK --rpc-url $RPC_URL >> (Join-Path $LogDir 'oracle_whitelist.log')

  & cast send $ORACLE_BLS_REGISTRY "addOrRemoveBlsRegisterWhitelist(address,bool)" $NODE1 true --private-key $DEPLOYER_PK --rpc-url $RPC_URL >> (Join-Path $LogDir 'oracle_whitelist.log')
  & cast send $ORACLE_BLS_REGISTRY "addOrRemoveBlsRegisterWhitelist(address,bool)" $NODE2 true --private-key $DEPLOYER_PK --rpc-url $RPC_URL >> (Join-Path $LogDir 'oracle_whitelist.log')
  & cast send $ORACLE_BLS_REGISTRY "addOrRemoveBlsRegisterWhitelist(address,bool)" $NODE3 true --private-key $DEPLOYER_PK --rpc-url $RPC_URL >> (Join-Path $LogDir 'oracle_whitelist.log')
}

function Write-OracleConfigs {
  Write-Host "Writing oracle-node configs to $CfgDir"

  $manager = @"
cp_chain_rpc: "$RPC_URL"
cp_chain_id: $CHAIN_ID
cp_chain_starting_height: 1
block_step: 100

oracle_manager_address: "$ORACLE_MANAGER_PROXY"
bls_registry_address: "$ORACLE_BLS_REGISTRY"
cpusdt_pod_address: "$ORACLE_POD_PROXY"

private_key: "$($DEPLOYER_PK.TrimStart('0x'))"

manager:
  level_db_folder: "$OracleTmpFs/manager_storage"
  ws_addr: "tcp://0.0.0.0:8081"
  http_addr: "127.0.0.1:34567"
  sign_timeout: "5s"
  submit_price_time: "10s"
  node_members: "$NODE1,$NODE2,$NODE3"
"@
  Set-Content -Path (Join-Path $CfgDir 'manager.yaml') -Value $manager -Encoding UTF8

  $node1 = @"
cp_chain_rpc: "$RPC_URL"
cp_chain_id: $CHAIN_ID
cp_chain_starting_height: 1
block_step: 100

oracle_manager_address: "$ORACLE_MANAGER_PROXY"
bls_registry_address: "$ORACLE_BLS_REGISTRY"
cpusdt_pod_address: "$ORACLE_POD_PROXY"

private_key: "$($NODE1_PK.TrimStart('0x'))"

node:
  level_db_folder: "$OracleTmpFs/node1_storage"
  key_path: "$OracleTmpFs/bls/node1.key"
  ws_addr: "tcp://127.0.0.1:8081"
  sign_timeout: "3s"
  wait_scan_interval: "2s"
  data_source:
    asset_type: "liquor"
    asset_name: "Maotai"
    url: "http://127.0.0.1:8888/api/price?symbol=maotai"
    method: "GET"
    price_path: "data.price"
    decimals: 6
    weight: 1
"@
  Set-Content -Path (Join-Path $CfgDir 'node1.yaml') -Value $node1 -Encoding UTF8

  $node2 = @"
cp_chain_rpc: "$RPC_URL"
cp_chain_id: $CHAIN_ID
cp_chain_starting_height: 1
block_step: 100

oracle_manager_address: "$ORACLE_MANAGER_PROXY"
bls_registry_address: "$ORACLE_BLS_REGISTRY"
cpusdt_pod_address: "$ORACLE_POD_PROXY"

private_key: "$($NODE2_PK.TrimStart('0x'))"

node:
  level_db_folder: "$OracleTmpFs/node2_storage"
  key_path: "$OracleTmpFs/bls/node2.key"
  ws_addr: "tcp://127.0.0.1:8081"
  sign_timeout: "3s"
  wait_scan_interval: "2s"
  data_source:
    asset_type: "liquor"
    asset_name: "Maotai"
    url: "http://127.0.0.1:8888/api/price?symbol=maotai"
    method: "GET"
    price_path: "data.price"
    decimals: 6
    weight: 1
"@
  Set-Content -Path (Join-Path $CfgDir 'node2.yaml') -Value $node2 -Encoding UTF8

  $node3 = @"
cp_chain_rpc: "$RPC_URL"
cp_chain_id: $CHAIN_ID
cp_chain_starting_height: 1
block_step: 100

oracle_manager_address: "$ORACLE_MANAGER_PROXY"
bls_registry_address: "$ORACLE_BLS_REGISTRY"
cpusdt_pod_address: "$ORACLE_POD_PROXY"

private_key: "$($NODE3_PK.TrimStart('0x'))"

node:
  level_db_folder: "$OracleTmpFs/node3_storage"
  key_path: "$OracleTmpFs/bls/node3.key"
  ws_addr: "tcp://127.0.0.1:8081"
  sign_timeout: "3s"
  wait_scan_interval: "2s"
  data_source:
    asset_type: "liquor"
    asset_name: "Maotai"
    url: "http://127.0.0.1:8888/api/price?symbol=maotai"
    method: "GET"
    price_path: "data.price"
    decimals: 6
    weight: 1
"@
  Set-Content -Path (Join-Path $CfgDir 'node3.yaml') -Value $node3 -Encoding UTF8

  Copy-Item -Force (Join-Path $CfgDir 'manager.yaml') (Join-Path $StateDir 'manager.yaml')
  Copy-Item -Force (Join-Path $CfgDir 'node1.yaml') (Join-Path $StateDir 'node1.yaml')
  Copy-Item -Force (Join-Path $CfgDir 'node2.yaml') (Join-Path $StateDir 'node2.yaml')
  Copy-Item -Force (Join-Path $CfgDir 'node3.yaml') (Join-Path $StateDir 'node3.yaml')
}

function Build-OracleNode {
  Write-Host 'Building oracle-node...'
  $dir = Join-Path $RootDir 'oracle\oracle-node'
  Push-Location $dir
  $log = Join-Path $LogDir 'oracle_build.log'
  $prev = $ErrorActionPreference
  try {
    $ErrorActionPreference = 'Continue'
    & go build -o oracle-node.exe ./cmd *> $log
    $code = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $prev
  }
  if ($code -ne 0) {
    throw "go build failed with exit code $code (see $log)"
  }
  Pop-Location
}

function Start-MockBg {
  if (Is-PidRunning $MOCK_PID) {
    Write-Host "Mock server already running (pid $(Get-Content $MOCK_PID))."
    return
  }
  Write-Host 'Starting mock server in background...'
  $dir = Join-Path $RootDir 'oracle\oracle-node'
  Push-Location $dir
  $outLog = Join-Path $LogDir 'mock_server.out.log'
  $errLog = Join-Path $LogDir 'mock_server.err.log'
  $p = Start-Process -FilePath 'go' -ArgumentList 'run mock/server.go' -NoNewWindow -RedirectStandardOutput $outLog -RedirectStandardError $errLog -PassThru
  Set-Content -Path $MOCK_PID -Value $p.Id -Encoding ASCII
  Pop-Location
}

function Start-OracleManagerBg {
  if (Is-PidRunning $OMGR_PID) {
    Write-Host "Oracle manager already running (pid $(Get-Content $OMGR_PID))."
    return
  }
  Write-Host 'Starting oracle manager in background...'
  $dir = Join-Path $RootDir 'oracle\oracle-node'
  Push-Location $dir
  $outLog = Join-Path $LogDir 'oracle_manager.out.log'
  $errLog = Join-Path $LogDir 'oracle_manager.err.log'
  $args = @(
    'manager',
    '--config', (Join-Path $CfgDir 'manager.yaml'),
    '--private-key', $DEPLOYER_PK.TrimStart('0x')
  )
  $p = Start-Process -FilePath (Join-Path $dir 'oracle-node.exe') -ArgumentList $args -NoNewWindow -RedirectStandardOutput $outLog -RedirectStandardError $errLog -PassThru
  Set-Content -Path $OMGR_PID -Value $p.Id -Encoding ASCII
  Pop-Location
}

function Start-NodesBg {
  Write-Host 'Starting oracle nodes in background...'
  $dir = Join-Path $RootDir 'oracle\oracle-node'
  Push-Location $dir

  if (-not (Is-PidRunning $NODE1_PID)) {
    $outLog = Join-Path $LogDir 'node1.out.log'
    $errLog = Join-Path $LogDir 'node1.err.log'
    $args = @(
      'node',
      '--config', (Join-Path $CfgDir 'node1.yaml'),
      '--private-key', $NODE1_PK.TrimStart('0x')
    )
    $p = Start-Process -FilePath (Join-Path $dir 'oracle-node.exe') -ArgumentList $args -NoNewWindow -RedirectStandardOutput $outLog -RedirectStandardError $errLog -PassThru
    Set-Content -Path $NODE1_PID -Value $p.Id -Encoding ASCII
  }
  if (-not (Is-PidRunning $NODE2_PID)) {
    $outLog = Join-Path $LogDir 'node2.out.log'
    $errLog = Join-Path $LogDir 'node2.err.log'
    $args = @(
      'node',
      '--config', (Join-Path $CfgDir 'node2.yaml'),
      '--private-key', $NODE2_PK.TrimStart('0x')
    )
    $p = Start-Process -FilePath (Join-Path $dir 'oracle-node.exe') -ArgumentList $args -NoNewWindow -RedirectStandardOutput $outLog -RedirectStandardError $errLog -PassThru
    Set-Content -Path $NODE2_PID -Value $p.Id -Encoding ASCII
  }
  if (-not (Is-PidRunning $NODE3_PID)) {
    $outLog = Join-Path $LogDir 'node3.out.log'
    $errLog = Join-Path $LogDir 'node3.err.log'
    $args = @(
      'node',
      '--config', (Join-Path $CfgDir 'node3.yaml'),
      '--private-key', $NODE3_PK.TrimStart('0x')
    )
    $p = Start-Process -FilePath (Join-Path $dir 'oracle-node.exe') -ArgumentList $args -NoNewWindow -RedirectStandardOutput $outLog -RedirectStandardError $errLog -PassThru
    Set-Content -Path $NODE3_PID -Value $p.Id -Encoding ASCII
  }

  Pop-Location
}

function Deploy-Rwa {
  Write-Host 'Deploying RWA contracts...'
  $rwaDir = Join-Path $RootDir 'rwa-contracts'
  Push-Location $rwaDir

  Remove-Item -Force -ErrorAction SilentlyContinue deployed_addresses.json
  Remove-Item -Recurse -Force -ErrorAction SilentlyContinue broadcast,cache,out

  $env:PRIVATE_KEY = $DEPLOYER_PK
  $env:ADMIN = $DEPLOYER
  $env:ISSUER = $ISSUER
  $env:COMPLIANCE = $COMPLIANCE
  $env:ORACLE_POD = $ORACLE_POD_PROXY

  & forge script script/deployRWA.s.sol:deployRWAScript --rpc-url $RPC_URL --private-key $env:PRIVATE_KEY --broadcast --non-interactive --skip-simulation *> (Join-Path $LogDir 'rwa_deploy.log')

  $script:RWA1155_ADDR = Json-Get (Join-Path $rwaDir 'deployed_addresses.json') 'rwa1155'
  $script:RWA_MANAGER_PROXY = Json-Get (Join-Path $rwaDir 'deployed_addresses.json') 'rwaManagerProxy'

  Pop-Location
}

function Write-StateFiles {
  $envContent = @"
# Generated by script/devnet.ps1

export CHAIN_ID=$CHAIN_ID
export RPC_URL="$RPC_URL"

# Roles (Anvil default accounts)
export DEPLOYER="$DEPLOYER"
export DEPLOYER_PK="$DEPLOYER_PK"
export ISSUER="$ISSUER"
export ISSUER_PK="$ISSUER_PK"
export COMPLIANCE="$COMPLIANCE"
export COMPLIANCE_PK="$COMPLIANCE_PK"
export USER="$USER"
export USER_PK="$USER_PK"

# Oracle nodes (separate accounts)
export ORACLE_NODE1="$NODE1"
export ORACLE_NODE1_PK="$NODE1_PK"
export ORACLE_NODE2="$NODE2"
export ORACLE_NODE2_PK="$NODE2_PK"
export ORACLE_NODE3="$NODE3"
export ORACLE_NODE3_PK="$NODE3_PK"

# Oracle contracts
export ORACLE_BLS_REGISTRY="$ORACLE_BLS_REGISTRY"
export ORACLE_MANAGER_PROXY="$ORACLE_MANAGER_PROXY"
export ORACLE_POD_PROXY="$ORACLE_POD_PROXY"

# RWA contracts (use proxy for RWAManager)
export RWA1155="$RWA1155_ADDR"
export RWA_MANAGER_PROXY="$RWA_MANAGER_PROXY"
"@
  Set-Content -Path (Join-Path $StateDir 'devnet_state.env') -Value $envContent -Encoding UTF8

  $json = @"
{
  "chainId": $CHAIN_ID,
  "rpcUrl": "$RPC_URL",
  "roles": {
    "deployer": {"address": "$DEPLOYER", "privateKey": "$DEPLOYER_PK"},
    "issuer": {"address": "$ISSUER", "privateKey": "$ISSUER_PK"},
    "compliance": {"address": "$COMPLIANCE", "privateKey": "$COMPLIANCE_PK"},
    "user": {"address": "$USER", "privateKey": "$USER_PK"}
  },
  "oracleNodes": {
    "node1": {"address": "$NODE1", "privateKey": "$NODE1_PK"},
    "node2": {"address": "$NODE2", "privateKey": "$NODE2_PK"},
    "node3": {"address": "$NODE3", "privateKey": "$NODE3_PK"}
  },
  "oracle": {
    "proxyBlsApkRegistry": "$ORACLE_BLS_REGISTRY",
    "proxyOracleManager": "$ORACLE_MANAGER_PROXY",
    "proxyOraclePod": "$ORACLE_POD_PROXY"
  },
  "rwa": {
    "rwa1155": "$RWA1155_ADDR",
    "rwaManagerProxy": "$RWA_MANAGER_PROXY"
  }
}
"@
  Set-Content -Path (Join-Path $StateDir 'devnet_state.json') -Value $json -Encoding UTF8

  $fe = @"
NEXT_PUBLIC_CHAIN_ID=$CHAIN_ID
NEXT_PUBLIC_RPC_URL=$RPC_URL

NEXT_PUBLIC_RWA_MANAGER_ADDRESS=$RWA_MANAGER_PROXY
NEXT_PUBLIC_RWA1155_ADDRESS=$RWA1155_ADDR
NEXT_PUBLIC_ORACLE_POD_ADDRESS=$ORACLE_POD_PROXY
NEXT_PUBLIC_TOKEN_ID_1=1
NEXT_PUBLIC_TOKEN_ID_2=2

NEXT_PUBLIC_ISSUER_ADDRESS=$ISSUER
NEXT_PUBLIC_COMPLIANCE_ADDRESS=$COMPLIANCE
"@
  Set-Content -Path (Join-Path $StateDir 'frontend.env.local.example') -Value $fe -Encoding UTF8
}

function Write-FrontendEnvLocal {
  $feDir = Join-Path $RootDir 'apps\rwa-demo-frontend'
  $feEnv = Join-Path $feDir '.env.local'
  $feEnvCopy = Join-Path $feDir '.env.local.devnet'

  New-Item -ItemType Directory -Force -Path $feDir | Out-Null

  if (Test-Path $feEnv) {
    $ts = Get-Date -Format 'yyyyMMdd-HHmmss'
    Copy-Item -Force $feEnv "$feEnv.bak.$ts"
  }

  $content = @"
NEXT_PUBLIC_CHAIN_ID=$CHAIN_ID
NEXT_PUBLIC_RPC_URL=$RPC_URL

# Deployed by script/devnet.ps1 (do not edit by hand unless you know what you're doing)
NEXT_PUBLIC_RWA_MANAGER_ADDRESS=$RWA_MANAGER_PROXY
NEXT_PUBLIC_RWA1155_ADDRESS=$RWA1155_ADDR
NEXT_PUBLIC_ORACLE_POD_ADDRESS=$ORACLE_POD_PROXY
NEXT_PUBLIC_TOKEN_ID_1=1
NEXT_PUBLIC_TOKEN_ID_2=2

# Role addresses (for frontend gating / UI)
NEXT_PUBLIC_ISSUER_ADDRESS=$ISSUER
NEXT_PUBLIC_COMPLIANCE_ADDRESS=$COMPLIANCE
"@
  Set-Content -Path $feEnvCopy -Value $content -Encoding UTF8
  Copy-Item -Force $feEnvCopy $feEnv
}

function Print-Summary {
  Write-Host ''
  Write-Host '================= Devnet Ready ================='
  Write-Host "RPC_URL:            $RPC_URL"
  Write-Host "CHAIN_ID:           $CHAIN_ID"
  Write-Host ''
  Write-Host 'Oracle:'
  Write-Host "  BLSApkRegistry:   $ORACLE_BLS_REGISTRY"
  Write-Host "  OracleManager:    $ORACLE_MANAGER_PROXY"
  Write-Host "  OraclePod:        $ORACLE_POD_PROXY"
  Write-Host ''
  Write-Host 'RWA:'
  Write-Host "  RWA1155:          $RWA1155_ADDR"
  Write-Host "  RWAManager(proxy):$RWA_MANAGER_PROXY"
  Write-Host ''
  Write-Host 'Roles:'
  Write-Host "  DEPLOYER(0):      $DEPLOYER"
  Write-Host "  ISSUER(1):        $ISSUER"
  Write-Host "  COMPLIANCE(2):    $COMPLIANCE"
  Write-Host "  USER(3):          $USER"
  Write-Host ''
  Write-Host 'State output:'
  Write-Host "  $StateDir\devnet_state.env"
  Write-Host "  $StateDir\devnet_state.json"
  Write-Host "  $StateDir\frontend.env.local.example"
  Write-Host "  $StateDir\anvil_accounts.md"
  Write-Host ''
  Write-Host 'Frontend env written:'
  Write-Host "  $RootDir\apps\rwa-demo-frontend\.env.local"
  Write-Host "  $RootDir\apps\rwa-demo-frontend\.env.local.devnet"
  Write-Host ''
  Write-Host "Logs: $LogDir"
  Write-Host "PIDs: $PidDir"
  Write-Host '================================================'
}

function Up {
  Down
  Kill-DevnetPorts
  Set-LocalRpcEnv

  Write-AccountsReport
  Clean-OracleKeys

  Start-AnvilBg
  Wait-Rpc

  Deploy-Oracle
  Whitelist-OracleNodes
  Write-OracleConfigs

  Build-OracleNode
  Start-MockBg
  Start-OracleManagerBg

  Start-Sleep -Seconds 1
  Start-NodesBg

  Deploy-Rwa
  Write-StateFiles
  Write-FrontendEnvLocal
  Print-Summary
}

function Down {
  Kill-PidFile $NODE3_PID
  Kill-PidFile $NODE2_PID
  Kill-PidFile $NODE1_PID
  Kill-PidFile $OMGR_PID
  Kill-PidFile $MOCK_PID
  Kill-PidFile $ANVIL_PID

  Kill-DevnetPorts
  Kill-DevnetProcessesFallback
}

switch ($Cmd) {
  'up' { Up }
  'down' { Down }
}
