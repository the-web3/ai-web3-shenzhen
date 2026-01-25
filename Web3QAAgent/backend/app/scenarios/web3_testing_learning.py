"""Web3 测试学习场景"""

import textwrap
from typing import Dict, List

import langextract as lx

from app.scenarios.base import BaseScenario


class Web3TestingLearningScenario(BaseScenario):
    """Web3 测试学习场景"""

    name = "Web3 测试学习"
    description = "从 Web3 测试/安全笔记中提取测试类型、用例、风险、工具和步骤"
    extract_classes = ["测试类型", "测试用例", "合约/接口", "步骤", "工具", "风险/漏洞", "环境", "数据/指标"]

    def get_prompt(self) -> str:
        return textwrap.dedent(
            """
            从 Web3 测试或安全相关笔记中提取以下信息：

            - 测试类型：单元/集成/端到端/模糊/安全/负载/审计等
            - 测试用例：具体测试点或断言
            - 步骤：执行顺序或关键操作
            - 工具：测试/审计/监控工具（Foundry、Hardhat、Echidna、Slither、Tenderly 等），注明用途
            - 风险/漏洞：潜在风险（重入、溢出、权限、签名重放、跨链验证等）及缓解措施
            - 环境：测试网/主网/本地节点设置
            - 数据/指标：覆盖率、Gas、延迟、通过率等
            - 关系链：用 attributes.mechanism_group 串联同一测试流/攻击链路的实体（工具-目标合约-风险-环境-指标等），用「-」连接核心节点，如 Foundry-多签-重放-Sepolia-Gas 或 Echidna-跨链桥-chainId/nonce

            要求：
            1) extraction_text 必须是原文的精确子串。
            2) 风险/漏洞注明类型；工具注明用途；步骤标注阶段；指标写清含义。
            3) 同一测试/攻击链路中的实体共享相同的 attributes.mechanism_group（可为单个实体设置多个 mechanism_group）。
            4) 按文本出现顺序提取。
            """
        )

    def get_examples(self) -> List[lx.data.ExampleData]:
        example_text = (
            "用 Foundry fuzz 测试多签合约的 owner 变更，并在 Sepolia 上做重放攻击验证，"
            "同时用 Slither 检查可重入点，记录 Gas 变化。"
        )

        return [
            lx.data.ExampleData(
                text=example_text,
                extractions=[
                    lx.data.Extraction(
                        extraction_class="工具",
                        extraction_text="Foundry fuzz",
                        attributes={
                            "用途": "模糊测试",
                            "mechanism_group": "Foundry-多签-重放-Sepolia-Gas"
                        },
                    ),
                    lx.data.Extraction(
                        extraction_class="合约/接口",
                        extraction_text="多签合约",
                        attributes={
                            "职责": "权限管理",
                            "mechanism_group": "Foundry-多签-重放-Sepolia-Gas"
                        },
                    ),
                    lx.data.Extraction(
                        extraction_class="测试用例",
                        extraction_text="owner 变更",
                        attributes={
                            "断言": "权限正确",
                            "mechanism_group": "Foundry-多签-重放-Sepolia-Gas"
                        },
                    ),
                    lx.data.Extraction(
                        extraction_class="环境",
                        extraction_text="Sepolia",
                        attributes={
                            "类型": "测试网",
                            "mechanism_group": "Foundry-多签-重放-Sepolia-Gas"
                        },
                    ),
                    lx.data.Extraction(
                        extraction_class="风险/漏洞",
                        extraction_text="重放攻击",
                        attributes={
                            "类型": "签名重放",
                            "mechanism_group": "Foundry-多签-重放-Sepolia-Gas"
                        },
                    ),
                    lx.data.Extraction(
                        extraction_class="工具",
                        extraction_text="Slither",
                        attributes={
                            "用途": "静态分析",
                            "mechanism_group": "Slither-多签-重放-静态分析"
                        },
                    ),
                    lx.data.Extraction(
                        extraction_class="数据/指标",
                        extraction_text="Gas 变化",
                        attributes={
                            "类型": "性能指标",
                            "mechanism_group": "Foundry-多签-重放-Sepolia-Gas"
                        },
                    ),
                ],
            )
        ]

    def get_samples(self) -> List[Dict[str, str]]:
        return [
            {
                "id": "web3_testing_sample_1",
                "title": "跨链桥测试要点",
                "text": textwrap.dedent(
                    """
                    针对跨链桥，需要在本地节点和测试网验证 chainId 校验、nonce 递增、
                    重放防护和 timelock，使用 Echidna 做模糊测试，
                    用 Tenderly 观察主网交易回放，记录通过率和 Gas 开销。
                    """
                ).strip(),
            },
            {
                "id": "web3_testing_sample_2",
                "title": "账户抽象安全测试",
                "text": textwrap.dedent(
                    """
                    对 EntryPoint 和 Paymaster 做权限与额度测试，
                    检查签名校验与 nonce 消耗，
                    在本地 Anvil 环境跑端到端测试，再同步到测试网。
                    """
                ).strip(),
            },
        ]
