"""金融信息提取场景"""

import textwrap
from typing import Dict, List

import langextract as lx

from app.scenarios.base import BaseScenario


class FinanceScenario(BaseScenario):
    """金融信息提取场景"""

    name = "金融分析"
    description = "从金融报告、投资分析、交易记录中提取结构化信息，包括机构、人物、金额、指标、事件等"
    extract_classes = ["机构", "人物", "金额", "时间", "事件", "指标", "产品"]

    def get_prompt(self) -> str:
        return textwrap.dedent("""\
            从金融文本中提取以下信息:

            - 机构: 金融机构、公司、投资基金、监管部门等组织名称
            - 人物: 高管、分析师、投资人等人名及其职位
            - 金额: 投资额、收益、估值、融资额等金融数字（保留单位）
            - 时间: 交易日期、报告期间、发布时间等
            - 事件: 融资、并购、上市、发布会等重要事件
            - 指标: 财务指标、增长率、市盈率、市值等数据
            - 产品: 金融产品、基金、股票代码、理财产品等

            要求:
            1. extraction_text 必须是原文的精确子串，不要改写或总结
            2. 金额必须保留原文的单位（如：亿元、万美元）
            3. 为人物添加职位和所属机构属性
            4. 为指标添加类型属性（如：增长率、估值、收益等）
            5. 为事件添加类型属性（如：融资、并购、发布等）
            6. 按照在文本中出现的顺序提取
            """)

    def get_examples(self) -> List[lx.data.ExampleData]:
        example_text = "2024年12月15日，红杉资本中国宣布完成对AI初创公司智谱科技的B轮投资，投资金额达5亿美元。智谱科技CEO王小川表示，公司估值已达50亿美元。"

        return [
            lx.data.ExampleData(
                text=example_text,
                extractions=[
                    lx.data.Extraction(
                        extraction_class="时间",
                        extraction_text="2024年12月15日",
                        attributes={"类型": "具体日期"}
                    ),
                    lx.data.Extraction(
                        extraction_class="机构",
                        extraction_text="红杉资本中国",
                        attributes={"类型": "投资机构"}
                    ),
                    lx.data.Extraction(
                        extraction_class="机构",
                        extraction_text="智谱科技",
                        attributes={"类型": "AI公司", "轮次": "B轮"}
                    ),
                    lx.data.Extraction(
                        extraction_class="事件",
                        extraction_text="B轮投资",
                        attributes={"类型": "融资", "参与方": "红杉资本中国"}
                    ),
                    lx.data.Extraction(
                        extraction_class="金额",
                        extraction_text="5亿美元",
                        attributes={"类型": "投资金额"}
                    ),
                    lx.data.Extraction(
                        extraction_class="人物",
                        extraction_text="王小川",
                        attributes={"职位": "CEO", "所属机构": "智谱科技"}
                    ),
                    lx.data.Extraction(
                        extraction_class="指标",
                        extraction_text="50亿美元",
                        attributes={"类型": "估值"}
                    ),
                ]
            )
        ]

    def get_samples(self) -> List[Dict[str, str]]:
        return [
            {
                "id": "finance_sample_1",
                "title": "投资并购报告",
                "text": textwrap.dedent("""\
                    2024年12月15日，普华永道发布的《2024年中国金融科技投资报告》显示，今年前三季度，中国金融科技领域共发生投融资事件287起，总金额达到652亿元人民币，同比增长23.5%。

                    报告指出，蚂蚁集团以2850亿美元估值位居榜首，其次是京东科技（456亿美元）和微众银行（380亿美元）。值得注意的是，红杉资本中国基金在本季度参与了15笔交易，累计投资金额超过80亿元。

                    在具体案例方面，10月18日，总部位于上海浦东的数字支付公司「连连数字」宣布完成D轮融资，融资金额达12.8亿元人民币。本轮融资由高瓴资本领投，老股东IDG资本、光速中国跟投。连连数字CEO朱晓松表示，本轮融资将主要用于跨境支付技术研发和东南亚市场拓展。
                    """).strip()
            },
            {
                "id": "finance_sample_2",
                "title": "季度财报分析",
                "text": textwrap.dedent("""\
                    腾讯控股（0700.HK）于2024年11月13日晚间发布2024年第三季度财报。报告显示，公司实现营业收入1672亿元，同比增长8.2%；净利润532亿元，同比大涨54%，超出市场预期的485亿元。

                    财务总监罗硕瀚在业绩电话会上解读称，本季度业绩增长主要得益于视频号广告收入的爆发式增长（同比+80%）以及游戏业务的企稳回升。瑞银分析师刘源在研报中将腾讯目标价从420港元上调至480港元，维持「买入」评级。

                    受财报利好刺激，腾讯股价次日大涨6.8%，收于398.6港元，市值重返3.8万亿港元。
                    """).strip()
            }
        ]
