"""销售信息提取场景"""

import textwrap
from typing import Dict, List

import langextract as lx

from app.scenarios.base import BaseScenario


class SalesScenario(BaseScenario):
    """销售信息提取场景"""

    name = "销售商机"
    description = "从销售报告、客户沟通记录、商务合同中提取关键业务信息，包括客户、产品、金额、需求等"
    extract_classes = ["客户", "产品", "金额", "时间", "数量", "需求", "竞争对手", "跟进状态"]

    def get_prompt(self) -> str:
        return textwrap.dedent("""\
            从销售文本中提取以下信息:

            - 客户: 客户公司名称、联系人姓名、联系方式
            - 产品: 产品名称、型号规格、服务内容
            - 金额: 订单金额、报价、预算、折扣等（保留单位）
            - 时间: 签约日期、交付时间、跟进时间
            - 数量: 采购数量、库存数量
            - 需求: 客户需求描述、痛点问题
            - 竞争对手: 竞品公司、竞品报价
            - 跟进状态: 商机阶段、签约概率、下一步行动

            要求:
            1. extraction_text 必须是原文的精确子串，不要改写或总结
            2. 为客户添加联系人和联系方式属性
            3. 为金额添加类型属性（如：报价、预算、成交价）
            4. 为竞争对手添加其报价或优劣势属性
            5. 为跟进状态添加概率和时间属性
            6. 按照在文本中出现的顺序提取
            """)

    def get_examples(self) -> List[lx.data.ExampleData]:
        example_text = "客户：华为技术有限公司，联系人张经理（139****8888）。采购需求：服务器100台，预算500万元。竞争对手：戴尔报价480万。我方报价520万，预计下周签约，概率70%。"

        return [
            lx.data.ExampleData(
                text=example_text,
                extractions=[
                    lx.data.Extraction(
                        extraction_class="客户",
                        extraction_text="华为技术有限公司",
                        attributes={"联系人": "张经理", "电话": "139****8888"}
                    ),
                    lx.data.Extraction(
                        extraction_class="产品",
                        extraction_text="服务器",
                        attributes={"类型": "硬件设备"}
                    ),
                    lx.data.Extraction(
                        extraction_class="数量",
                        extraction_text="100台",
                        attributes={"产品": "服务器"}
                    ),
                    lx.data.Extraction(
                        extraction_class="金额",
                        extraction_text="500万元",
                        attributes={"类型": "预算"}
                    ),
                    lx.data.Extraction(
                        extraction_class="竞争对手",
                        extraction_text="戴尔",
                        attributes={"报价": "480万"}
                    ),
                    lx.data.Extraction(
                        extraction_class="金额",
                        extraction_text="520万",
                        attributes={"类型": "我方报价"}
                    ),
                    lx.data.Extraction(
                        extraction_class="跟进状态",
                        extraction_text="预计下周签约",
                        attributes={"概率": "70%", "阶段": "商务谈判"}
                    ),
                ]
            )
        ]

    def get_samples(self) -> List[Dict[str, str]]:
        return [
            {
                "id": "sales_sample_1",
                "title": "大客户销售周报",
                "text": textwrap.dedent("""\
                    销售周报 | 2024年第51周
                    汇报人：华东区大客户经理 陈志远

                    【商机1】中国银行数据中心服务器采购项目
                    客户信息：中国银行股份有限公司信息科技部
                    客户联系人：IT采购总监 周明华（139****8890）
                    项目预算：4500万元
                    我方报价：4280万元（含三年运维服务）
                    主要竞争对手：华为（报价4150万）、浪潮（报价4050万）
                    采购内容：高性能服务器200台，存储设备50套
                    项目阶段：技术评标已通过，进入商务谈判
                    本周进展：12月18日与客户CFO王建国进行了价格沟通，客户希望总价控制在4000万以内
                    下一步行动：申请5%额外折扣授权，预计12月28日前完成签约
                    签约概率：75%

                    【商机2】比亚迪汽车智能制造MES系统
                    客户信息：比亚迪股份有限公司深圳坪山工厂
                    客户联系人：智能制造部经理 李工（电话：186****2345）
                    项目预算：1200万元
                    我方报价：980万元
                    采购内容：生产执行系统（MES）软件许可500点
                    本周进展：12月19日进行了现场需求调研，发现客户核心痛点是产线数据孤岛问题
                    竞争对手：西门子（已提交方案）、Rockwell
                    签约概率：60%
                    """).strip()
            },
            {
                "id": "sales_sample_2",
                "title": "渠道合作协议",
                "text": textwrap.dedent("""\
                    战略渠道合作协议
                    协议编号：CH-2024-SH-0892
                    签约日期：2024年12月20日

                    甲方（供应商）：深圳市云智科技有限公司
                    联系人：渠道总监 王芳（电话：0755-8888****）

                    乙方（渠道商）：上海数通信息技术有限公司
                    联系人：采购经理 赵丽（电话：021-5050****）

                    合作产品：云智企业协同办公平台V5.0
                    授权区域：上海市、江苏省、浙江省
                    授权级别：金牌代理商
                    合作期限：2025年1月1日至2025年12月31日

                    销售目标及返点：年销售额1000万以上，返点22%，额外年终奖励15万

                    首批采购订单：
                    产品：云智企业版 100套
                    单价：3.8万元/套
                    总金额：380万元（含税）
                    交货时间：2025年1月15日前
                    """).strip()
            }
        ]
