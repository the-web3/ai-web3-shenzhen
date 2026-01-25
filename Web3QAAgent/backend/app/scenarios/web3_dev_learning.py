"""Web3 开发学习场景"""

import textwrap
from typing import Dict, List

import langextract as lx

from app.scenarios.base import BaseScenario


class Web3DevLearningScenario(BaseScenario):
    """Web3 开发学习场景"""

    name = "Web3 开发学习"
    description = "从 Web3/区块链开发笔记中提取核心概念、工具、合约职责、安全实践和实现步骤"
    extract_classes = ["概念", "协议/链", "工具", "合约/接口", "安全实践", "步骤", "角色"]

    def get_prompt(self) -> str:
        return textwrap.dedent(
            """
            从 Web3 开发学习笔记中提取以下信息：

            - 概念：关键技术概念或机制（账户抽象、L2、MEV、防重放等）
            - 协议/链：涉及的链/测试网/协议名称（以太坊、Base、Sepolia、Optimism 等），标注层级
            - 工具：SDK/框架/CLI（Hardhat、Foundry、Ethers.js、Wagmi 等），注明用途或生态
            - 合约/接口：核心合约、标准或入口（ERC-20/4337 EntryPoint/Router），说明职责
            - 安全实践：风险点与防护措施（权限控制、重入、签名校验、延时执行）
            - 步骤：开发、测试、部署或监控的关键操作
            - 角色：用户、合约、预言机、验证者等参与方
            - 关系链：用 attributes.mechanism_group 将同一流程/机制中的实体串联起来（同一链上的实体使用相同的 mechanism_group，格式用「-」连接核心节点，如：EntryPoint-4337-账户抽象 或 Hardhat-部署-Sepolia-ERC-20）

            要求：
            1) extraction_text 必须是原文的精确子串，不要改写。
            2) 工具注明用途/生态；合约注明类型/职责；安全实践注明风险类型或适用场景；步骤注明所属阶段。
            3) 同一机制链路中的实体共享同一个 attributes.mechanism_group（可为单个实体设置多个 mechanism_group）。
            4) 按文本出现顺序提取。
            """
        )

    def get_examples(self) -> List[lx.data.ExampleData]:
        example_text = (
            "使用 Hardhat 在 Sepolia 部署 ERC-20 合约时，要在构造函数里设置 Ownable，"
            "并在部署后用 Foundry 测试重入和权限，再切主网。"
        )

        return [
            lx.data.ExampleData(
                text=example_text,
                extractions=[
                    lx.data.Extraction(
                        extraction_class="工具",
                        extraction_text="Hardhat",
                        attributes={
                            "用途": "部署",
                            "生态": "EVM",
                            "mechanism_group": "Hardhat-ERC-20-部署-Sepolia"
                        },
                    ),
                    lx.data.Extraction(
                        extraction_class="协议/链",
                        extraction_text="Sepolia",
                        attributes={
                            "类型": "以太坊测试网",
                            "mechanism_group": "Hardhat-ERC-20-部署-Sepolia"
                        },
                    ),
                    lx.data.Extraction(
                        extraction_class="合约/接口",
                        extraction_text="ERC-20 合约",
                        attributes={
                            "类型": "代币",
                            "职责": "资产发行与转账",
                            "mechanism_group": "Hardhat-ERC-20-部署-Sepolia"
                        },
                    ),
                    lx.data.Extraction(
                        extraction_class="合约/接口",
                        extraction_text="Ownable",
                        attributes={
                            "类型": "权限控制",
                            "职责": "限制管理操作",
                            "mechanism_group": "Hardhat-ERC-20-部署-Sepolia"
                        },
                    ),
                    lx.data.Extraction(
                        extraction_class="工具",
                        extraction_text="Foundry",
                        attributes={
                            "用途": "测试",
                            "mechanism_group": "Foundry-测试-重入/权限"
                        },
                    ),
                    lx.data.Extraction(
                        extraction_class="安全实践",
                        extraction_text="测试重入和权限",
                        attributes={
                            "风险": "重入/权限",
                            "阶段": "测试",
                            "mechanism_group": "Foundry-测试-重入/权限"
                        },
                    ),
                    lx.data.Extraction(
                        extraction_class="步骤",
                        extraction_text="再切主网",
                        attributes={
                            "流程": "部署",
                            "mechanism_group": "Hardhat-ERC-20-部署-Sepolia"
                        },
                    ),
                ],
            )
        ]

    def get_samples(self) -> List[Dict[str, str]]:
        return [
            {
                "id": "web3_dev_sample_1",
                "title": "账户抽象部署流程",
                "text": textwrap.dedent(
                    """
                    在 Base 启用账户抽象时，需要部署或引用 ERC-4337 的 EntryPoint，
                    前端用 Wagmi + RainbowKit 支持智能账号签名；Paymaster 必须校验白名单，
                    Bundler 需要做可用性与费用监控。
                    """
                ).strip(),
            },
            {
                "id": "web3_dev_sample_2",
                "title": "跨链桥合约注意事项",
                "text": textwrap.dedent(
                    """
                    Bridge Router 合约要限制 owner 权限并设置 timelock，
                    预言机喂价需多签验证，目标链要校验 chainId 和 nonce，防止重放。
                    """
                ).strip(),
            },
        ]
