"""Web3 产品学习场景"""

import textwrap
from typing import Dict, List

import langextract as lx

from app.scenarios.base import BaseScenario


class Web3ProductLearningScenario(BaseScenario):
    """Web3 产品学习场景"""

    name = "Web3 产品学习"
    description = "从 Web3 产品笔记中提取用户角色、核心模块、用例、指标与经济模型要点"
    extract_classes = ["概念/模块", "协议/链", "用户角色", "用例/场景", "指标", "代币/经济模型", "风险/合规"]

    def get_prompt(self) -> str:
        return textwrap.dedent(
            """
            从 Web3 产品学习笔记中提取以下信息：

            - 概念/模块：产品核心模块或设计要点（钱包、Bridge、AA、社交图谱等）
            - 协议/链：所在链/协议（以太坊、Base、OP Stack 等），注明层级或定位
            - 用户角色：典型用户/机构及其诉求
            - 用例/场景：产品具体场景或业务流程
            - 指标：北极星/增长/留存/交易类指标及口径
            - 代币/经济模型：代币类型、分配、激励/治理逻辑
            - 风险/合规：风险点（合规、资金安全、欺诈）及对应控制
            - 关系链：用 attributes.mechanism_group 串联同一产品路径/激励闭环中的实体（链、场景、指标、用户、代币等），格式用「-」连接核心节点，如 任务产品-Base-DAU-积分+治理-新手/KOL

            要求：
            1) extraction_text 必须是原文精确子串。
            2) 指标注明口径或周期；代币注明用途/分配；风险注明类型或控制措施。
            3) 同一闭环的实体共享相同的 attributes.mechanism_group（可为单个实体设置多个 mechanism_group）。
            4) 按文本出现顺序提取。
            """
        )

    def get_examples(self) -> List[lx.data.ExampleData]:
        example_text = (
            "Base 上的链上任务产品以每日活跃钱包为北极星指标，"
            "任务奖励采用积分+治理代币双轨，用户角色包含新手和 KOL，两者权益不同。"
        )

        return [
            lx.data.ExampleData(
                text=example_text,
                extractions=[
                    lx.data.Extraction(
                        extraction_class="协议/链",
                        extraction_text="Base",
                        attributes={
                            "类型": "L2",
                            "mechanism_group": "链上任务-Base-DAU-积分+治理-新手/KOL"
                        },
                    ),
                    lx.data.Extraction(
                        extraction_class="指标",
                        extraction_text="每日活跃钱包",
                        attributes={
                            "口径": "DAU",
                            "mechanism_group": "链上任务-Base-DAU-积分+治理-新手/KOL"
                        },
                    ),
                    lx.data.Extraction(
                        extraction_class="代币/经济模型",
                        extraction_text="积分+治理代币双轨",
                        attributes={
                            "用途": "奖励/治理",
                            "mechanism_group": "链上任务-Base-DAU-积分+治理-新手/KOL"
                        },
                    ),
                    lx.data.Extraction(
                        extraction_class="用户角色",
                        extraction_text="新手",
                        attributes={
                            "权益": "基础奖励",
                            "mechanism_group": "链上任务-Base-DAU-积分+治理-新手/KOL"
                        },
                    ),
                    lx.data.Extraction(
                        extraction_class="用户角色",
                        extraction_text="KOL",
                        attributes={
                            "权益": "更高奖励/推广位",
                            "mechanism_group": "链上任务-Base-DAU-积分+治理-新手/KOL"
                        },
                    ),
                ],
            )
        ]

    def get_samples(self) -> List[Dict[str, str]]:
        return [
            {
                "id": "web3_product_sample_1",
                "title": "链上社交产品要点",
                "text": textwrap.dedent(
                    """
                    基于 Lens 的社交产品采用 handle 作为身份，关注关系存链，
                    北极星指标是周活跃发布数，货币化依赖收取镜像费用，
                    风险在于垃圾内容与女巫，需要引入信誉分和限频机制。
                    """
                ).strip(),
            },
            {
                "id": "web3_product_sample_2",
                "title": "跨链支付产品设计",
                "text": textwrap.dedent(
                    """
                    跨链支付需在前端展示汇率与 Gas 预估，
                    用例包括商户收单和个人转账，
                    代币侧采用稳定币+积分组合，合规上需要 KYB/KYC 与风控黑名单。
                    """
                ).strip(),
            },
        ]
