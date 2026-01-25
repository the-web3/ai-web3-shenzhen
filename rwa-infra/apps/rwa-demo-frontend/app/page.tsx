"use client";

import { useEffect } from "react";
import { Header } from "./_components/Header";
import { useMounted } from "../lib/useMounted";
import { Reveal } from "./_components/Reveal";

export default function Home() {
  const mounted = useMounted();

  // Disable browser scroll restoration and force scroll to top
  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <Header />
      <main className="landing">
        {/* Hero */}
        <Reveal>
          <section className="heroSection">
            <span className="kicker">合规金融 · RWA · 审计时间线</span>
            <h1 className="heroTitle">
              把现实资产流程<br />做成可审计的链上状态机
            </h1>
            <p className="heroSub">
              发行 / 冻结 / 赎回全流程上链留痕，链下证据用 hash 存证；<br />
              Oracle 价格更新同步进入审计时间线，打造机构级 RWA 基础设施。
            </p>
          </section>
        </Reveal>

        {/* 核心能力 - 带图标的卡片 */}
        <Reveal delayMs={80}>
          <section className="capSection">
            <h2 className="capTitle">核心能力</h2>
            <div className="capGrid">
              <div className="capCard">
                <div className="capIcon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="8" width="18" height="12" rx="2"/><path d="M7 8V6a5 5 0 0 1 10 0v2"/>
                  </svg>
                </div>
                <div className="capName">资产载体</div>
                <div className="capDesc">ERC-1155 多批次资产，禁止用户间转账，仅支持发行/赎回闭环</div>
              </div>
              <div className="capCard">
                <div className="capIcon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
                  </svg>
                </div>
                <div className="capName">双层冻结</div>
                <div className="capDesc">地址级冻结（司法管控）+ 份额级冻结（精细化资产锁定）</div>
              </div>
              <div className="capCard">
                <div className="capIcon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/>
                  </svg>
                </div>
                <div className="capName">链下存证</div>
                <div className="capDesc">docHash / evidenceHash / deliveryInfoHash 链上存证，原文留链下合规系统</div>
              </div>
              <div className="capCard">
                <div className="capIcon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18"/><path d="M18 9l-5 5-4-4-3 3"/>
                  </svg>
                </div>
                <div className="capName">Oracle 报价</div>
                <div className="capDesc">分布式节点签名聚合，价格更新同步进入审计时间线</div>
              </div>
              <div className="capCard">
                <div className="capIcon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div className="capName">角色权限</div>
                <div className="capDesc">Admin / Issuer / Compliance 三权分立，生产环境可替换为 MPC 多签</div>
              </div>
              <div className="capCard">
                <div className="capIcon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div className="capName">可升级运维</div>
                <div className="capDesc">透明代理模式，支持 pause / upgrade，适合企业级应急响应</div>
              </div>
            </div>
          </section>
        </Reveal>

        {/* 资产场景 */}
        <Reveal delayMs={160}>
          <section className="sceneSection">
            <div className="sceneContent">
              <div className="sceneText">
                <h2 className="sceneTitle">场景示例：白酒仓单</h2>
                <p className="sceneDesc">
                  以白酒仓储商品为例，每个 tokenId 代表一个批次（如 <code>飞天_2023批次</code>），
                  amount 语义为"瓶/箱/件"等实物单位（0 位精度）。
                </p>
                <ul className="sceneList">
                  <li><strong>发行</strong>：入库质检通过后，凭 docHash（仓单/质检报告）铸造份额</li>
                  <li><strong>冻结</strong>：司法查封时，凭 evidenceHash（法院文书）冻结账户或份额</li>
                  <li><strong>赎回</strong>：用户提交 deliveryInfoHash（交割地址），审批后 burn 完成闭环</li>
                </ul>
              </div>
              <div className="sceneVisual">
                <div className="sceneDiagram">
                  <div className="diagramStep">
                    <span className="stepNum">1</span>
                    <span className="stepLabel">入库</span>
                  </div>
                  <div className="diagramArrow">→</div>
                  <div className="diagramStep">
                    <span className="stepNum">2</span>
                    <span className="stepLabel">发行</span>
                  </div>
                  <div className="diagramArrow">→</div>
                  <div className="diagramStep">
                    <span className="stepNum">3</span>
                    <span className="stepLabel">持有</span>
                  </div>
                  <div className="diagramArrow">→</div>
                  <div className="diagramStep">
                    <span className="stepNum">4</span>
                    <span className="stepLabel">赎回</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        {/* 审计时间线 */}
        <Reveal delayMs={240}>
          <section className="timelineSection">
            <h2 className="sectionH2">审计时间线</h2>
            <p className="timelineDesc">
              所有关键操作（发行 / 冻结 / 赎回 / 价格更新）均以事件形式上链，<br />
              前端可回放完整审计轨迹，每条记录包含 txHash / blockNumber / timestamp / operator / evidenceHash。
            </p>
            <div className="timelinePreview">
              <div className="tlItem">
                <span className="tlDot green" />
                <span className="tlType">Issued</span>
                <span className="tlInfo">用户 0x1234...5678 获得 tokenId=1 的 100 份额</span>
              </div>
              <div className="tlItem">
                <span className="tlDot blue" />
                <span className="tlType">PriceUpdated</span>
                <span className="tlInfo">Oracle 价格更新 1200 → 1250（3/3 节点签名）</span>
              </div>
              <div className="tlItem">
                <span className="tlDot orange" />
                <span className="tlType">BalanceFrozen</span>
                <span className="tlInfo">冻结 0x1234...5678 的 50 份额（evidenceHash: 0xabc...）</span>
              </div>
              <div className="tlItem">
                <span className="tlDot purple" />
                <span className="tlType">RedeemApproved</span>
                <span className="tlInfo">赎回申请 #7 已批准并销毁</span>
              </div>
            </div>
          </section>
        </Reveal>

        {/* 演示路径 */}
        <Reveal delayMs={320}>
          <section className="demoSection">
            <h2 className="sectionH2">5 分钟演示路径</h2>
            <p className="demoHint">连接钱包后，点击右上角账户菜单进入对应页面</p>
            <div className="demoSteps">
              <div className="demoStep">
                <span className="demoNum">1</span>
                <div className="demoInfo">
                  <span className="demoRole">Admin</span>
                  <span className="demoAction">发行给用户（issueMint + docHash）</span>
                </div>
              </div>
              <div className="demoStep">
                <span className="demoNum">2</span>
                <div className="demoInfo">
                  <span className="demoRole">Admin</span>
                  <span className="demoAction">冻结 / 解冻（账户级 / 份额级 + evidenceHash）</span>
                </div>
              </div>
              <div className="demoStep">
                <span className="demoNum">3</span>
                <div className="demoInfo">
                  <span className="demoRole">Redeem</span>
                  <span className="demoAction">用户发起赎回申请（deliveryInfoHash）</span>
                </div>
              </div>
              <div className="demoStep">
                <span className="demoNum">4</span>
                <div className="demoInfo">
                  <span className="demoRole">Admin</span>
                  <span className="demoAction">审批赎回（approveRedeem → burn）</span>
                </div>
              </div>
              <div className="demoStep">
                <span className="demoNum">5</span>
                <div className="demoInfo">
                  <span className="demoRole">Timeline</span>
                  <span className="demoAction">回放所有事件做审计</span>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        {/* 技术栈 */}
        <Reveal delayMs={400}>
          <section className="techSection">
            <h2 className="sectionH2">技术栈</h2>
            <div className="techGrid">
              <div className="techItem">
                <span className="techLabel">合约</span>
                <span className="techValue">Solidity + Foundry + OpenZeppelin</span>
              </div>
              <div className="techItem">
                <span className="techLabel">资产标准</span>
                <span className="techValue">ERC-1155（多批次）</span>
              </div>
              <div className="techItem">
                <span className="techLabel">升级模式</span>
                <span className="techValue">TransparentUpgradeableProxy</span>
              </div>
              <div className="techItem">
                <span className="techLabel">Oracle</span>
                <span className="techValue">BLS 聚合签名 + OraclePod</span>
              </div>
              <div className="techItem">
                <span className="techLabel">前端</span>
                <span className="techValue">Next.js + RainbowKit + wagmi</span>
              </div>
              <div className="techItem">
                <span className="techLabel">网络</span>
                <span className="techValue">Anvil（本地演示）</span>
              </div>
            </div>
          </section>
        </Reveal>
      </main>
    </>
  );
}
