# RWA Oracle 系统部署指南

本指南详细介绍如何在本地 Anvil 测试网上部署和测试 RWA（Real World Assets）Oracle 系统。

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mock Server                               │
│                    (模拟 RWA 数据源)                              │
│                   http://localhost:8888                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTP API
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌───────────┐  ┌───────────┐  ┌───────────┐
│  Node 1   │  │  Node 2   │  │  Node 3   │
│ (账户 1)  │  │ (账户 2)  │  │ (账户 3)  │
│ BLS 签名  │  │ BLS 签名  │  │ BLS 签名  │
└─────┬─────┘  └─────┬─────┘  └─────┬─────┘
      │              │              │
      │   WebSocket  │              │
      └──────────────┼──────────────┘
                     ▼
           ┌─────────────────┐
           │    Manager      │
           │   (账户 0)      │
           │  聚合 BLS 签名  │
           └────────┬────────┘
                    │ 提交交易
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Anvil 本地测试网                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │BLSApkRegistry│  │OracleManager │  │  OraclePod   │          │
│  │  (BLS 注册)  │  │  (验签聚合)  │  │  (存储价格)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## 前置要求

- Go 1.21+
- Foundry (forge, cast, anvil)
- Make

## 目录结构

```
oracle/
├── oracle-contracts/     # Solidity 智能合约
│   ├── src/
│   ├── script/
│   └── ...
├── oracle-node/          # Go 节点程序
│   ├── cmd/
│   ├── config/
│   ├── mock/
│   └── ...
└── README.md             # 本文档
```

---

## （推荐）从头重跑：一键清理环境

> 适用场景：你**重启过 anvil**、或**重新部署过合约**、或遇到 `signature is invalid`、或不确定本地 `/tmp/oracle` 里是哪一套 key/数据。
>
> 原因：anvil 重启会清空链上状态（合约存储/事件/区块），但你本地 `/tmp/oracle` 不会自动清空，容易造成“本地 key/状态”和“链上注册状态”不一致。

### 0.1 手动停止旧进程（建议按顺序 Ctrl+C）

- Node1 / Node2 / Node3
- Manager
- Mock Server
- Anvil

### 0.2 清理本地数据（会删除 BLS key 与 leveldb）

```bash
rm -rf /tmp/oracle
```

### 0.3 清理合约部署输出（可选，但推荐）

```bash
cd /Users/wenqirui/Desktop/rwa/oracle/oracle-contracts
rm -f deployed_addresses.json
rm -rf broadcast cache out
```

## 第一步：启动 Anvil 本地测试网

在新终端中启动 Anvil：

```bash
anvil
```

Anvil 会输出 10 个预置账户（每次直接 `anvil` 启动都一样）。建议先记录前 4 个：

| 账户 | 地址 | 私钥 | 用途 |
|------|------|------|------|
| 0 | 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 | 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 | Manager/部署者 |
| 1 | 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 | 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d | Node 1 |
| 2 | 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC | 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a | Node 2 |
| 3 | 0x90F79bf6EB2c4f870365E785982E1f101E93b906 | 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6 | Node 3 |

> 注意：Foundry（forge/cast）使用的私钥建议带 `0x` 前缀；`oracle-node` 的 `--private-key` 参数如果报解析错误，可用 bash 去前缀：`${NODE1_PK#0x}`。

---

## 第二步：部署智能合约

### 2.1 进入合约目录

```bash
cd oracle/oracle-contracts
```

### 2.2 设置环境变量

```bash
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
export RPC_URL=http://127.0.0.1:8545
```

### 2.3 部署 BLSApkRegistry 和 OracleManager

```bash
export RELAYER_MANAGER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# 注意：脚本合约名是 deployOracleScript（不是 DeployOracle）
forge script script/deployOracle.s.sol:deployOracleScript \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

记录输出的合约地址：
- **BLSApkRegistry**: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
- **OracleManager**: `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`

### 2.4 部署 OraclePod

```bash
# 先从上一步生成的 deployed_addresses.json 取出 OracleManager 代理地址
cat /Users/wenqirui/Desktop/rwa/oracle/oracle-contracts/deployed_addresses.json

# 将 proxyOracleManager 填到这里（示例）：
export ORACLE_MANAGER=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9

# 注意：脚本合约名是 deployOraclePodScript（不是 DeployOraclePod）
forge script script/deployOraclePod.s.sol:deployOraclePodScript \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

记录输出的 **OraclePod** 地址：`0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6`

### 2.5 配置合约白名单

将 3 个 Node 地址添加到白名单：

```bash
# 添加到 operatorWhitelist（OracleManager）
cast send 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 \
  "addOrRemoveOperatorWhitelist(address,bool)" \
  0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \
  true \
  --private-key $PRIVATE_KEY --rpc-url $RPC_URL

cast send 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 \
  "addOrRemoveOperatorWhitelist(address,bool)" \
  0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC \
  true \
  --private-key $PRIVATE_KEY --rpc-url $RPC_URL

cast send 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 \
  "addOrRemoveOperatorWhitelist(address,bool)" \
  0x90F79bf6EB2c4f870365E785982E1f101E93b906 \
  true \
  --private-key $PRIVATE_KEY --rpc-url $RPC_URL

# 添加到 blsRegisterWhitelist（BLSApkRegistry）
cast send 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 \
  "addOrRemoveBlsRegisterWhitelist(address,bool)" \
  0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \
  true \
  --private-key $PRIVATE_KEY --rpc-url $RPC_URL

cast send 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 \
  "addOrRemoveBlsRegisterWhitelist(address,bool)" \
  0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC \
  true \
  --private-key $PRIVATE_KEY --rpc-url $RPC_URL

cast send 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 \
  "addOrRemoveBlsRegisterWhitelist(address,bool)" \
  0x90F79bf6EB2c4f870365E785982E1f101E93b906 \
  true \
  --private-key $PRIVATE_KEY --rpc-url $RPC_URL
```

---

## 第三步：创建目录（BLS 密钥会自动生成）

### 3.1 创建必要的目录

```bash
# BLS 密钥目录
mkdir -p /tmp/oracle/bls/node1.key
mkdir -p /tmp/oracle/bls/node2.key
mkdir -p /tmp/oracle/bls/node3.key

# 存储目录
mkdir -p /tmp/oracle/node1_storage
mkdir -p /tmp/oracle/node2_storage
mkdir -p /tmp/oracle/node3_storage
mkdir -p /tmp/oracle/manager_storage
```

### 3.2 进入 oracle-node 目录

```bash
cd oracle/oracle-node
```

### 3.3 编译程序

```bash
go build -o oracle-node ./cmd
```

> 说明：**不需要手动生成 BLS key**。当你首次运行 `./oracle-node node ...` 时，如果 `node.key_path` 目录下不存在 `on_bls.piv/on_bls.pub`，程序会自动生成并写入。

---

## 第四步：配置文件

### 4.1 Manager 配置 (config/manager.yaml)

```yaml
cp_chain_rpc: "http://127.0.0.1:8545"
cp_chain_id: 31337
cp_chain_starting_height: 1
block_step: 100

oracle_manager_address: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
bls_registry_address: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
cpusdt_pod_address: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"

private_key: "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

manager:
  level_db_folder: "/tmp/oracle/manager_storage"
  ws_addr: "tcp://0.0.0.0:8081"
  http_addr: "127.0.0.1:34567"
  sign_timeout: "5s"
  submit_price_time: "10s"
  node_members: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8,0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC,0x90F79bf6EB2c4f870365E785982E1f101E93b906"
```

### 4.2 Node 1 配置 (config/node1.yaml)

```yaml
cp_chain_rpc: "http://127.0.0.1:8545"
cp_chain_id: 31337
cp_chain_starting_height: 1
block_step: 100

oracle_manager_address: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
bls_registry_address: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
cpusdt_pod_address: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"

# Node 1 私钥 (Anvil 账户 1)
private_key: "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"

node:
  level_db_folder: "/tmp/oracle/node1_storage"
  key_path: "/tmp/oracle/bls/node1.key"
  ws_addr: "tcp://127.0.0.1:8081"
  sign_timeout: "3s"
  wait_scan_interval: "2s"
  data_source:
    asset_type: "liquor"
    asset_name: "Maotai"
    url: "http://localhost:8888/api/price?symbol=maotai"
    method: "GET"
    price_path: "data.price"
    decimals: 6
    weight: 1
```

### 4.3 Node 2 配置 (config/node2.yaml)

```yaml
cp_chain_rpc: "http://127.0.0.1:8545"
cp_chain_id: 31337
cp_chain_starting_height: 1
block_step: 100

oracle_manager_address: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
bls_registry_address: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
cpusdt_pod_address: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"

# Node 2 私钥 (Anvil 账户 2)
private_key: "5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"

node:
  level_db_folder: "/tmp/oracle/node2_storage"
  key_path: "/tmp/oracle/bls/node2.key"
  ws_addr: "tcp://127.0.0.1:8081"
  sign_timeout: "3s"
  wait_scan_interval: "2s"
  data_source:
    asset_type: "liquor"
    asset_name: "Maotai"
    url: "http://localhost:8888/api/price?symbol=maotai"
    method: "GET"
    price_path: "data.price"
    decimals: 6
    weight: 1
```

### 4.4 Node 3 配置 (config/node3.yaml)

```yaml
cp_chain_rpc: "http://127.0.0.1:8545"
cp_chain_id: 31337
cp_chain_starting_height: 1
block_step: 100

oracle_manager_address: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
bls_registry_address: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
cpusdt_pod_address: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"

# Node 3 私钥 (Anvil 账户 3)
private_key: "7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"

node:
  level_db_folder: "/tmp/oracle/node3_storage"
  key_path: "/tmp/oracle/bls/node3.key"
  ws_addr: "tcp://127.0.0.1:8081"
  sign_timeout: "3s"
  wait_scan_interval: "2s"
  data_source:
    asset_type: "liquor"
    asset_name: "Maotai"
    url: "http://localhost:8888/api/price?symbol=maotai"
    method: "GET"
    price_path: "data.price"
    decimals: 6
    weight: 1
```

---

## 第五步：启动 Mock Server（先启动，避免 Node 获取价格失败）

> 说明：Node 在 `register-bls` / 运行过程中会从 `data_source.url` 拉取价格（默认 `http://localhost:8888/...`）。因此 **必须先启动 Mock Server**，否则会出现 `connect: connection refused`。

在新终端中启动 Mock Server 模拟 RWA 数据源（**方案 B：时间窗缓存**，同一时间窗内所有节点拿到相同价格）：

```bash
cd oracle/oracle-node
go run mock/server.go
```

快速验证：

```bash
curl "http://127.0.0.1:8888/api/price?symbol=maotai"
```

Mock Server 默认 **每 15 秒**刷新一次价格（窗口内固定），可用环境变量调整：

```bash
export MOCK_WINDOW_SECONDS=15
```

> 我们已经把 `oracle-node/config/*.yaml` 里的数据源 url 统一改成 `http://127.0.0.1:8888/...`，避免 `localhost` 走 IPv6（`::1`）导致连接失败。

---

## 第六步：启动 Manager（再启动，保证 Node 能连上）

> 说明：`register-bls` 会连接 `manager.ws_addr`（默认 `tcp://127.0.0.1:8081`），因此也需要先启动 Manager。

在新终端中启动 Manager：

```bash
cd oracle/oracle-node
export MANAGER_PK="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
./oracle-node manager --config config/manager.yaml \
  --private-key ${MANAGER_PK#0x}
```

确认 Manager 已监听 `tcp://0.0.0.0:8081`（或你配置的 ws_addr）后再进行下一步。

---

## 第七步：注册 BLS 公钥

每个 Node 需要将 BLS 公钥注册到链上（请确保第五步 Manager 已启动）：

```bash
cd oracle/oracle-node

# Node 1 注册
export NODE1_PK="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
./oracle-node node --config config/node1.yaml \
  --private-key ${NODE1_PK#0x} \
  register-bls

# Node 2 注册
export NODE2_PK="0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
./oracle-node node --config config/node2.yaml \
  --private-key ${NODE2_PK#0x} \
  register-bls

# Node 3 注册
export NODE3_PK="0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"
./oracle-node node --config config/node3.yaml \
  --private-key ${NODE3_PK#0x} \
  register-bls
```

---

Mock Server 会在 `http://127.0.0.1:8888` 启动，提供以下 API：

| 端点 | 说明 |
|------|------|
| GET /api/price?symbol=maotai | 获取茅台价格 (~1800 元) |
| GET /api/price?symbol=gold | 获取黄金价格 (~450 美元/盎司) |
| GET /api/price?symbol=eth | 获取 ETH 价格 (~3500 美元) |
| GET /api/assets | 获取所有支持的资产列表 |

---

## 第八步：启动 Oracle 节点

### 8.1 启动 Node 1 (新终端)

```bash
cd oracle/oracle-node
./oracle-node node --config config/node1.yaml \
  --private-key ${NODE1_PK#0x}
```

### 8.2 启动 Node 2 (新终端)

```bash
cd oracle/oracle-node
./oracle-node node --config config/node2.yaml \
  --private-key ${NODE2_PK#0x}
```

### 8.3 启动 Node 3 (新终端)

```bash
cd oracle/oracle-node
./oracle-node node --config config/node3.yaml \
  --private-key ${NODE3_PK#0x}
```

---

## 第九步：启动 Oracle 聚合与上链（Manager 侧日志）

等待看到以下日志表示系统正常运行：
```
INFO signature verification isValid=true
INFO success to send verify finality signature transaction
INFO parse verify signature with price success
```

---

## 第十步：测试验证

### 9.1 查询链上价格

```bash
cast call 0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6 \
  "getSymbolPrice()(string)" \
  --rpc-url http://127.0.0.1:8545
```

预期输出：
```
"1800.494331"
```

### 9.2 查询更新时间戳

```bash
cast call 0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6 \
  "getUpdateTimestamp()(uint256)" \
  --rpc-url http://127.0.0.1:8545
```

### 9.3 查询 Mock Server

```bash
curl "http://127.0.0.1:8888/api/price?symbol=maotai"
```

预期输出：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "symbol": "maotai",
    "name": "贵州茅台",
    "price": 1800.123456,
    "bid": 1799.923456,
    "ask": 1800.323456,
    "timestamp": 1705401234
  }
}
```

---

## 常见问题

### Q1: 签名验证失败 (signature is invalid)

**原因**: 各节点获取的价格整数部分不一致

**解决**: 
- 确保 Mock Server 返回的价格整数部分一致（约 1800）
- 检查 `mock/server.go` 中的 `getRandomPrice` 函数

### Q2: Node 启动失败 (no such file or directory)

**原因**: BLS 密钥目录不存在

**解决**: 运行第三步创建目录命令

### Q3: 合约调用失败 (does not have any code)

**原因**: 使用了错误的合约地址或 Anvil 重启导致状态丢失

**解决**: 
- 重新部署合约
- 使用 `manager.yaml` 中配置的正确地址

### Q4: Node 无法连接 Manager

**原因**: Manager 未启动或 WebSocket 地址配置错误

**解决**:
- 确保 Manager 先于 Node 启动
- 检查 `ws_addr` 配置

---

## 支持的 RWA 资产

| 资产代码 | 名称 | 基准价格 | 类型 |
|---------|------|---------|------|
| maotai | 贵州茅台 | 1800 元 | 白酒 |
| wuliangye | 五粮液 | 1200 元 | 白酒 |
| gold | 黄金 | 450 美元/盎司 | 贵金属 |
| silver | 白银 | 25 美元/盎司 | 贵金属 |
| eth | 以太坊 | 3500 美元 | 加密货币 |
| btc | 比特币 | 42000 美元 | 加密货币 |

---

## 进程清单

完整运行需要以下进程：

| # | 进程 | 端口 | 说明 |
|---|------|------|------|
| 1 | Anvil | 8545 | 本地测试网 |
| 2 | Mock Server | 8888 | 模拟 RWA 数据源 |
| 3 | Manager | 8081 (WS) | 签名聚合服务 |
| 4 | Node 1 | - | Oracle 节点 |
| 5 | Node 2 | - | Oracle 节点 |
| 6 | Node 3 | - | Oracle 节点 |

---

## 停止服务

按以下顺序停止：

1. Ctrl+C 停止 Node 1/2/3
2. Ctrl+C 停止 Manager
3. Ctrl+C 停止 Mock Server
4. Ctrl+C 停止 Anvil

---

## License

MIT
