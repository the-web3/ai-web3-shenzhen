#!/usr/bin/env bash
set -euo pipefail

#
# One-click local devnet (Anvil + Oracle system + RWA contracts)
# - Starts long-running processes in background (anvil / mock server / oracle manager / 3 nodes)
# - Deploys oracle contracts then RWA contracts
# - Writes addresses, roles, private keys, configs, logs, pids to: script/state/
#
# Usage:
#   bash script/devnet.sh up
#   bash script/devnet.sh down
#

CMD="${1:-up}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

STATE_DIR="$SCRIPT_DIR/state"
LOG_DIR="$STATE_DIR/logs"
PID_DIR="$STATE_DIR/pids"
CFG_DIR="$STATE_DIR/config"

mkdir -p "$STATE_DIR" "$LOG_DIR" "$PID_DIR" "$CFG_DIR"

RPC_URL="${RPC_URL:-http://127.0.0.1:8545}"
CHAIN_ID="${CHAIN_ID:-31337}"

# -----------------------------
# Anvil default accounts (0-9)
# -----------------------------
DEPLOYER="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
DEPLOYER_PK="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

ISSUER="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
ISSUER_PK="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"

COMPLIANCE="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
COMPLIANCE_PK="0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"

USER="0x90F79bf6EB2c4f870365E785982E1f101E93b906"
USER_PK="0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"

ACC4="0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
ACC4_PK="0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"
ACC5="0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"
ACC5_PK="0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba"
ACC6="0x976EA74026E726554dB657fA54763abd0C3a0aa9"
ACC6_PK="0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e"
ACC7="0x14dC79964da2C08b23698B3D3cc7Ca32193d9955"
ACC7_PK="0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356"
ACC8="0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f"
ACC8_PK="0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97"
ACC9="0xa0Ee7A142d267C1f36714E4a8F75612F20a79720"
ACC9_PK="0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6"

# Oracle nodes use accounts 4/5/6 (separate from roles 0-3).
NODE1="$ACC4"
NODE1_PK="$ACC4_PK"
NODE2="$ACC5"
NODE2_PK="$ACC5_PK"
NODE3="$ACC6"
NODE3_PK="$ACC6_PK"

ANVIL_PID="$PID_DIR/anvil.pid"
MOCK_PID="$PID_DIR/mock.pid"
OMGR_PID="$PID_DIR/oracle_manager.pid"
NODE1_PID="$PID_DIR/node1.pid"
NODE2_PID="$PID_DIR/node2.pid"
NODE3_PID="$PID_DIR/node3.pid"

json_get() {
  local file="$1"
  local key="$2"
  python3 - "$file" "$key" <<'PY'
import json, sys
path, key = sys.argv[1], sys.argv[2]
with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)
v = data.get(key)
if v is None:
    raise SystemExit(f"missing key: {key} in {path}")
print(v)
PY
}

is_pid_running() {
  local pid_file="$1"
  [[ -f "$pid_file" ]] || return 1
  local pid
  pid="$(cat "$pid_file" || true)"
  [[ -n "$pid" ]] || return 1
  kill -0 "$pid" >/dev/null 2>&1
}

kill_pidfile() {
  local pid_file="$1"
  if is_pid_running "$pid_file"; then
    local pid
    pid="$(cat "$pid_file")"
    echo "Stopping pid=$pid ($pid_file)"
    kill "$pid" >/dev/null 2>&1 || true
    sleep 0.5 || true
    kill -9 "$pid" >/dev/null 2>&1 || true
  fi
  rm -f "$pid_file"
}

kill_port() {
  local port="$1"
  # macOS: lsof is available by default. We only kill processes that are listening on the devnet ports.
  local pids
  pids="$(lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -z "$pids" ]]; then
    return 0
  fi
  echo "Stopping processes listening on tcp:${port}: $pids"
  # shellcheck disable=SC2086
  kill $pids >/dev/null 2>&1 || true
  sleep 0.2 || true
  # shellcheck disable=SC2086
  kill -9 $pids >/dev/null 2>&1 || true
}

kill_devnet_ports() {
  # 8545: anvil RPC
  # 8888: mock server
  # 8081: oracle manager WS
  # 34567: oracle manager HTTP
  kill_port 8545
  kill_port 8888
  kill_port 8081
  kill_port 34567
}

kill_devnet_processes_fallback() {
  # Fallback killer when pidfiles are missing (e.g. user deleted script/state).
  # We only kill processes clearly started by this script (match config path under script/state).
  local patterns=(
    "$CFG_DIR/manager.yaml"
    "$CFG_DIR/node1.yaml"
    "$CFG_DIR/node2.yaml"
    "$CFG_DIR/node3.yaml"
    "go run mock/server.go"
    "anvil --chain-id $CHAIN_ID"
  )

  for pat in "${patterns[@]}"; do
    local pids
    # macOS has pgrep by default. -f matches full command line.
    # NOTE: always use `--` because patterns may start with '-' in other cases.
    pids="$(pgrep -f -- "$pat" 2>/dev/null || true)"
    if [[ -z "$pids" ]]; then
      continue
    fi
    echo "Stopping processes matching: $pat"
    # shellcheck disable=SC2086
    kill $pids >/dev/null 2>&1 || true
    sleep 0.2 || true
    # shellcheck disable=SC2086
    kill -9 $pids >/dev/null 2>&1 || true
  done
}

wait_rpc() {
  echo "Waiting for RPC: $RPC_URL"
  for _ in $(seq 1 60); do
    if cast block-number --rpc-url "$RPC_URL" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.25
  done
  echo "RPC not ready: $RPC_URL" >&2
  return 1
}

write_accounts_report() {
  cat > "$STATE_DIR/anvil_accounts.md" <<EOF
## Anvil 默认 10 个账号（固定）

| # | 地址 | 私钥 | 用途 | 是否占用 |
|---:|---|---|---|---|
| 0 | $DEPLOYER | $DEPLOYER_PK | 部署者 / RWA ADMIN / Oracle Manager 进程 | 已使用 |
| 1 | $ISSUER | $ISSUER_PK | RWA 发行方（ISSUER_ROLE） | 已使用 |
| 2 | $COMPLIANCE | $COMPLIANCE_PK | RWA 合规方（COMPLIANCE_ROLE） | 已使用 |
| 3 | $USER | $USER_PK | Demo 用户（持有/赎回） | 已使用 |
| 4 | $ACC4 | $ACC4_PK | Oracle Node1 | 已使用 |
| 5 | $ACC5 | $ACC5_PK | Oracle Node2 | 已使用 |
| 6 | $ACC6 | $ACC6_PK | Oracle Node3 | 已使用 |
| 7 | $ACC7 | $ACC7_PK | 备用测试账号 | 可用 |
| 8 | $ACC8 | $ACC8_PK | 备用测试账号 | 可用 |
| 9 | $ACC9 | $ACC9_PK | 备用测试账号 | 可用 |
EOF
}

clean_oracle_keys() {
  echo "Cleaning oracle local keys/state: /tmp/oracle"
  rm -rf /tmp/oracle
  mkdir -p /tmp/oracle
  mkdir -p /tmp/oracle/bls/node1.key /tmp/oracle/bls/node2.key /tmp/oracle/bls/node3.key
  mkdir -p /tmp/oracle/node1_storage /tmp/oracle/node2_storage /tmp/oracle/node3_storage /tmp/oracle/manager_storage
}

start_anvil_bg() {
  if is_pid_running "$ANVIL_PID"; then
    echo "Anvil already running (pid $(cat "$ANVIL_PID"))."
    return 0
  fi
  echo "Starting anvil in background..."
  nohup anvil --chain-id "$CHAIN_ID" --host 127.0.0.1 --port 8545 >"$LOG_DIR/anvil.log" 2>&1 &
  echo $! > "$ANVIL_PID"
}

deploy_oracle() {
  echo "Deploying oracle contracts..."
  local oracle_dir="$ROOT_DIR/oracle/oracle-contracts"
  pushd "$oracle_dir" >/dev/null

  # Clean previous build/deploy outputs (recommended when anvil restarts).
  rm -f deployed_addresses.json
  rm -rf broadcast cache out || true

  export PRIVATE_KEY="$DEPLOYER_PK"
  export RELAYER_MANAGER="$DEPLOYER"

  forge script script/deployOracle.s.sol:deployOracleScript \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    --broadcast \
    --non-interactive \
    --skip-simulation >"$LOG_DIR/oracle_deploy.log" 2>&1

  local bls_registry
  local oracle_manager
  bls_registry="$(json_get deployed_addresses.json proxyBlsApkRegistry)"
  oracle_manager="$(json_get deployed_addresses.json proxyOracleManager)"

  export ORACLE_MANAGER="$oracle_manager"
  forge script script/deployOraclePod.s.sol:deployOraclePodScript \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    --broadcast \
    --non-interactive \
    --skip-simulation >"$LOG_DIR/oracle_pod_deploy.log" 2>&1

  local oracle_pod
  oracle_pod="$(json_get deployed_addresses.json proxyOraclePod)"

  popd >/dev/null

  # Export for outer scope
  ORACLE_BLS_REGISTRY="$bls_registry"
  ORACLE_MANAGER_PROXY="$oracle_manager"
  ORACLE_POD_PROXY="$oracle_pod"
}

whitelist_oracle_nodes() {
  echo "Whitelisting oracle node operators..."
  # OracleManager operatorWhitelist
  cast send "$ORACLE_MANAGER_PROXY" "addOrRemoveOperatorWhitelist(address,bool)" "$NODE1" true \
    --private-key "$DEPLOYER_PK" --rpc-url "$RPC_URL" >"$LOG_DIR/oracle_whitelist.log" 2>&1
  cast send "$ORACLE_MANAGER_PROXY" "addOrRemoveOperatorWhitelist(address,bool)" "$NODE2" true \
    --private-key "$DEPLOYER_PK" --rpc-url "$RPC_URL" >>"$LOG_DIR/oracle_whitelist.log" 2>&1
  cast send "$ORACLE_MANAGER_PROXY" "addOrRemoveOperatorWhitelist(address,bool)" "$NODE3" true \
    --private-key "$DEPLOYER_PK" --rpc-url "$RPC_URL" >>"$LOG_DIR/oracle_whitelist.log" 2>&1

  # BLSApkRegistry blsRegisterWhitelist
  cast send "$ORACLE_BLS_REGISTRY" "addOrRemoveBlsRegisterWhitelist(address,bool)" "$NODE1" true \
    --private-key "$DEPLOYER_PK" --rpc-url "$RPC_URL" >>"$LOG_DIR/oracle_whitelist.log" 2>&1
  cast send "$ORACLE_BLS_REGISTRY" "addOrRemoveBlsRegisterWhitelist(address,bool)" "$NODE2" true \
    --private-key "$DEPLOYER_PK" --rpc-url "$RPC_URL" >>"$LOG_DIR/oracle_whitelist.log" 2>&1
  cast send "$ORACLE_BLS_REGISTRY" "addOrRemoveBlsRegisterWhitelist(address,bool)" "$NODE3" true \
    --private-key "$DEPLOYER_PK" --rpc-url "$RPC_URL" >>"$LOG_DIR/oracle_whitelist.log" 2>&1
}

write_oracle_configs() {
  echo "Writing oracle-node configs to $CFG_DIR"
  local on="$ROOT_DIR/oracle/oracle-node"

  cat > "$CFG_DIR/manager.yaml" <<EOF
cp_chain_rpc: "$RPC_URL"
cp_chain_id: $CHAIN_ID
cp_chain_starting_height: 1
block_step: 100

oracle_manager_address: "$ORACLE_MANAGER_PROXY"
bls_registry_address: "$ORACLE_BLS_REGISTRY"
cpusdt_pod_address: "$ORACLE_POD_PROXY"

private_key: "${DEPLOYER_PK#0x}"

manager:
  level_db_folder: "/tmp/oracle/manager_storage"
  ws_addr: "tcp://0.0.0.0:8081"
  http_addr: "127.0.0.1:34567"
  sign_timeout: "5s"
  submit_price_time: "10s"
  node_members: "$NODE1,$NODE2,$NODE3"
EOF

  # Nodes (use mock server @ 127.0.0.1:8888)
  cat > "$CFG_DIR/node1.yaml" <<EOF
cp_chain_rpc: "$RPC_URL"
cp_chain_id: $CHAIN_ID
cp_chain_starting_height: 1
block_step: 100

oracle_manager_address: "$ORACLE_MANAGER_PROXY"
bls_registry_address: "$ORACLE_BLS_REGISTRY"
cpusdt_pod_address: "$ORACLE_POD_PROXY"

private_key: "${NODE1_PK#0x}"

node:
  level_db_folder: "/tmp/oracle/node1_storage"
  key_path: "/tmp/oracle/bls/node1.key"
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
EOF

  cat > "$CFG_DIR/node2.yaml" <<EOF
cp_chain_rpc: "$RPC_URL"
cp_chain_id: $CHAIN_ID
cp_chain_starting_height: 1
block_step: 100

oracle_manager_address: "$ORACLE_MANAGER_PROXY"
bls_registry_address: "$ORACLE_BLS_REGISTRY"
cpusdt_pod_address: "$ORACLE_POD_PROXY"

private_key: "${NODE2_PK#0x}"

node:
  level_db_folder: "/tmp/oracle/node2_storage"
  key_path: "/tmp/oracle/bls/node2.key"
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
EOF

  cat > "$CFG_DIR/node3.yaml" <<EOF
cp_chain_rpc: "$RPC_URL"
cp_chain_id: $CHAIN_ID
cp_chain_starting_height: 1
block_step: 100

oracle_manager_address: "$ORACLE_MANAGER_PROXY"
bls_registry_address: "$ORACLE_BLS_REGISTRY"
cpusdt_pod_address: "$ORACLE_POD_PROXY"

private_key: "${NODE3_PK#0x}"

node:
  level_db_folder: "/tmp/oracle/node3_storage"
  key_path: "/tmp/oracle/bls/node3.key"
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
EOF

  # Keep a copy for quick diff/debug
  cp "$CFG_DIR/manager.yaml" "$STATE_DIR/manager.yaml"
  cp "$CFG_DIR/node1.yaml" "$STATE_DIR/node1.yaml"
  cp "$CFG_DIR/node2.yaml" "$STATE_DIR/node2.yaml"
  cp "$CFG_DIR/node3.yaml" "$STATE_DIR/node3.yaml"
}

build_oracle_node() {
  echo "Building oracle-node..."
  pushd "$ROOT_DIR/oracle/oracle-node" >/dev/null
  go build -o oracle-node ./cmd >"$LOG_DIR/oracle_build.log" 2>&1
  popd >/dev/null
}

start_mock_bg() {
  if is_pid_running "$MOCK_PID"; then
    echo "Mock server already running (pid $(cat "$MOCK_PID"))."
    return 0
  fi
  echo "Starting mock server in background..."
  pushd "$ROOT_DIR/oracle/oracle-node" >/dev/null
  nohup go run mock/server.go >"$LOG_DIR/mock_server.log" 2>&1 &
  echo $! > "$MOCK_PID"
  popd >/dev/null
}

start_oracle_manager_bg() {
  if is_pid_running "$OMGR_PID"; then
    echo "Oracle manager already running (pid $(cat "$OMGR_PID"))."
    return 0
  fi
  echo "Starting oracle manager in background..."
  pushd "$ROOT_DIR/oracle/oracle-node" >/dev/null
  nohup ./oracle-node manager --config "$CFG_DIR/manager.yaml" --private-key "${DEPLOYER_PK#0x}" \
    >"$LOG_DIR/oracle_manager.log" 2>&1 &
  echo $! > "$OMGR_PID"
  popd >/dev/null
}

register_bls() {
  : # no-op (kept for backward compatibility)
}

start_nodes_bg() {
  echo "Starting oracle nodes in background..."
  pushd "$ROOT_DIR/oracle/oracle-node" >/dev/null

  if ! is_pid_running "$NODE1_PID"; then
    nohup ./oracle-node node --config "$CFG_DIR/node1.yaml" --private-key "${NODE1_PK#0x}" >"$LOG_DIR/node1.log" 2>&1 &
    echo $! > "$NODE1_PID"
  fi
  if ! is_pid_running "$NODE2_PID"; then
    nohup ./oracle-node node --config "$CFG_DIR/node2.yaml" --private-key "${NODE2_PK#0x}" >"$LOG_DIR/node2.log" 2>&1 &
    echo $! > "$NODE2_PID"
  fi
  if ! is_pid_running "$NODE3_PID"; then
    nohup ./oracle-node node --config "$CFG_DIR/node3.yaml" --private-key "${NODE3_PK#0x}" >"$LOG_DIR/node3.log" 2>&1 &
    echo $! > "$NODE3_PID"
  fi

  popd >/dev/null
}

deploy_rwa() {
  echo "Deploying RWA contracts..."
  local rwa_dir="$ROOT_DIR/rwa-contracts"
  pushd "$rwa_dir" >/dev/null

  rm -f deployed_addresses.json
  rm -rf broadcast cache out || true

  export PRIVATE_KEY="$DEPLOYER_PK"
  export ADMIN="$DEPLOYER"
  export ISSUER="$ISSUER"
  export COMPLIANCE="$COMPLIANCE"
  export ORACLE_POD="$ORACLE_POD_PROXY"

  forge script script/deployRWA.s.sol:deployRWAScript \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    --broadcast \
    --non-interactive \
    --skip-simulation >"$LOG_DIR/rwa_deploy.log" 2>&1

  RWA1155_ADDR="$(json_get deployed_addresses.json rwa1155)"
  RWA_MANAGER_PROXY="$(json_get deployed_addresses.json rwaManagerProxy)"

  popd >/dev/null
}

write_state_files() {
  cat > "$STATE_DIR/devnet_state.env" <<EOF
# Generated by script/devnet.sh

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
EOF

  cat > "$STATE_DIR/devnet_state.json" <<EOF
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
EOF

  # Frontend-friendly env example (copy to apps/rwa-demo-frontend/.env.local manually)
  cat > "$STATE_DIR/frontend.env.local.example" <<EOF
NEXT_PUBLIC_CHAIN_ID=$CHAIN_ID
NEXT_PUBLIC_RPC_URL=$RPC_URL

NEXT_PUBLIC_RWA_MANAGER_ADDRESS=$RWA_MANAGER_PROXY
NEXT_PUBLIC_RWA1155_ADDRESS=$RWA1155_ADDR
NEXT_PUBLIC_ORACLE_POD_ADDRESS=$ORACLE_POD_PROXY
NEXT_PUBLIC_TOKEN_ID_1=1
NEXT_PUBLIC_TOKEN_ID_2=2

NEXT_PUBLIC_ISSUER_ADDRESS=$ISSUER
NEXT_PUBLIC_COMPLIANCE_ADDRESS=$COMPLIANCE
EOF
}

write_frontend_env_local() {
  local fe_dir="$ROOT_DIR/apps/rwa-demo-frontend"
  local fe_env="$fe_dir/.env.local"
  local fe_env_copy="$fe_dir/.env.local.devnet"

  mkdir -p "$fe_dir"

  # Backup existing .env.local if present
  if [[ -f "$fe_env" ]]; then
    local ts
    ts="$(date +%Y%m%d-%H%M%S)"
    cp "$fe_env" "$fe_env.bak.$ts" || true
  fi

  # Write a stable devnet env file (avoid heredoc inside command substitution)
  cat > "$fe_env_copy" <<EOF
NEXT_PUBLIC_CHAIN_ID=$CHAIN_ID
NEXT_PUBLIC_RPC_URL=$RPC_URL

# Deployed by script/devnet.sh (do not edit by hand unless you know what you're doing)
NEXT_PUBLIC_RWA_MANAGER_ADDRESS=$RWA_MANAGER_PROXY
NEXT_PUBLIC_RWA1155_ADDRESS=$RWA1155_ADDR
NEXT_PUBLIC_ORACLE_POD_ADDRESS=$ORACLE_POD_PROXY
NEXT_PUBLIC_TOKEN_ID_1=1
NEXT_PUBLIC_TOKEN_ID_2=2

# Role addresses (for frontend gating / UI)
NEXT_PUBLIC_ISSUER_ADDRESS=$ISSUER
NEXT_PUBLIC_COMPLIANCE_ADDRESS=$COMPLIANCE
EOF

  cp "$fe_env_copy" "$fe_env"
}

print_summary() {
  echo ""
  echo "================= Devnet Ready ================="
  echo "RPC_URL:            $RPC_URL"
  echo "CHAIN_ID:           $CHAIN_ID"
  echo ""
  echo "Oracle:"
  echo "  BLSApkRegistry:   $ORACLE_BLS_REGISTRY"
  echo "  OracleManager:    $ORACLE_MANAGER_PROXY"
  echo "  OraclePod:        $ORACLE_POD_PROXY"
  echo ""
  echo "RWA:"
  echo "  RWA1155:          $RWA1155_ADDR"
  echo "  RWAManager(proxy):$RWA_MANAGER_PROXY"
  echo ""
  echo "Roles:"
  echo "  DEPLOYER(0):      $DEPLOYER"
  echo "  ISSUER(1):        $ISSUER"
  echo "  COMPLIANCE(2):    $COMPLIANCE"
  echo "  USER(3):          $USER"
  echo ""
  echo "State output:"
  echo "  $STATE_DIR/devnet_state.env"
  echo "  $STATE_DIR/devnet_state.json"
  echo "  $STATE_DIR/frontend.env.local.example"
  echo "  $STATE_DIR/anvil_accounts.md"
  echo ""
  echo "Frontend env written:"
  echo "  $ROOT_DIR/apps/rwa-demo-frontend/.env.local"
  echo "  $ROOT_DIR/apps/rwa-demo-frontend/.env.local.devnet"
  echo ""
  echo "Logs: $LOG_DIR"
  echo "PIDs: $PID_DIR"
  echo "================================================"
}

up() {
  # Stop previous runs (best-effort) then start fresh.
  down || true
  # In case previous state/pidfiles were removed manually, ensure ports are clean before starting.
  kill_devnet_ports || true

  write_accounts_report
  clean_oracle_keys

  start_anvil_bg
  wait_rpc

  deploy_oracle
  whitelist_oracle_nodes
  write_oracle_configs

  build_oracle_node
  start_mock_bg
  start_oracle_manager_bg

  # NOTE: do NOT run `register-bls` here. That subcommand may keep the node running
  # (won't exit), which will block this script. Nodes will generate keys if missing
  # and can register during normal run.
  sleep 1
  start_nodes_bg

  deploy_rwa
  write_state_files
  write_frontend_env_local
  print_summary
}

down() {
  kill_pidfile "$NODE3_PID"
  kill_pidfile "$NODE2_PID"
  kill_pidfile "$NODE1_PID"
  kill_pidfile "$OMGR_PID"
  kill_pidfile "$MOCK_PID"
  kill_pidfile "$ANVIL_PID"

  # Fallback: if pidfiles are missing (e.g. user deleted script/state), still ensure ports are free.
  kill_devnet_ports
  kill_devnet_processes_fallback
}

case "$CMD" in
  up) up ;;
  down) down ;;
  *)
    echo "Unknown command: $CMD"
    echo "Usage: bash script/devnet.sh [up|down]"
    exit 1
    ;;
esac

