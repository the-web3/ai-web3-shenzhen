# 本地一键 Devnet（Anvil + Oracle + RWA）

这个目录提供一个脚本：**一次性启动本地 anvil、部署 oracle 合约、启动 oracle(Manager + 3 节点 + Mock Server)、部署 RWA 合约**，并把所有关键地址/私钥/配置输出到 `script/state/`，方便调试。

## 前置依赖

- Foundry：`anvil` / `forge` / `cast`
- Go 1.21+

## 使用

在仓库根目录执行：

```bash
chmod +x script/devnet.sh
bash script/devnet.sh up
```

停止所有后台进程：

```bash
bash script/devnet.sh down
```

## 输出文件（非常重要）

启动成功后会生成：

- `script/state/devnet_state.env`：方便 `source` 的环境变量
- `script/state/devnet_state.json`：结构化信息
- `script/state/frontend.env.local.example`：前端 `.env.local` 参考（手动复制到 `apps/rwa-demo-frontend/.env.local`）
- `script/state/anvil_accounts.md`：10 个 anvil 账号（哪些已占用/哪些可用）
- `script/state/config/*.yaml`：oracle-node 启动用的配置（自动生成）
- `script/state/logs/*`：所有进程与部署日志
- `script/state/pids/*`：后台进程 pid（用于 down）
- `apps/rwa-demo-frontend/.env.local`：前端本地配置（脚本会自动写入）
- `apps/rwa-demo-frontend/.env.local.devnet`：同内容备份一份（方便对比/复制）

## 账号占用约定

脚本默认使用 anvil 的固定账号：

- Account(0)：部署者 / RWA ADMIN / Oracle Manager 进程
- Account(1)：RWA 发行方（ISSUER_ROLE）
- Account(2)：RWA 合规方（COMPLIANCE_ROLE）
- Account(3)：Demo 用户（持有/赎回）
- Account(4)：Oracle Node1（BLS 签名节点）
- Account(5)：Oracle Node2（BLS 签名节点）
- Account(6)：Oracle Node3（BLS 签名节点）
- Account(7-9)：保留给你自由测试

## 每次运行的清理行为

`up` 会自动：

- 停掉上一轮后台进程（best-effort）
- 清理 `/tmp/oracle`（BLS key 与 leveldb 会重新生成）
- 清理 oracle/rwa 合约工程的 `broadcast/cache/out`（避免 anvil 重启后状态不一致）

## 关于 register-bls

脚本 **不会单独执行** `oracle-node ... register-bls`。

原因：该子命令在某些实现中会继续进入节点运行流程（不退出），导致一键脚本卡住。

脚本的做法是：直接后台启动 `oracle-node node ...`，若本地缺少 BLS key 会自动生成，并在正常运行中完成注册/上报（日志见 `script/state/logs/node*.log`）。

## 启动前端（可选）

脚本 **不会** 启动前端，只会写好 `apps/rwa-demo-frontend/.env.local`。

你手动启动：

```bash
cd apps/rwa-demo-frontend
npm install
npm run dev
```
