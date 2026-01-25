"""新闻信息提取场景"""

import textwrap
from typing import Dict, List

import langextract as lx

from app.scenarios.base import BaseScenario


class NewsScenario(BaseScenario):
    """新闻信息提取场景"""

    name = "新闻信息"
    description = "从新闻报道中提取结构化信息，包括人物、地点、机构、时间、事件等"
    extract_classes = ["人物", "地点", "机构", "时间", "事件"]

    def get_prompt(self) -> str:
        return textwrap.dedent("""\
            从新闻文本中提取以下信息:

            - 人物: 文中提到的人名
            - 地点: 文中提到的地理位置
            - 机构: 文中提到的组织、公司、政府部门等
            - 时间: 文中提到的时间信息
            - 事件: 文中描述的重要事件

            要求:
            1. extraction_text 必须是原文的精确子串，不要改写或总结
            2. 不要重复提取相同的实体
            3. 为每个实体添加有意义的属性以增加上下文信息
            4. 按照在文本中出现的顺序提取
            """)

    def get_examples(self) -> List[lx.data.ExampleData]:
        example_text = "2024年3月15日，华为公司在深圳总部发布了最新的5G技术。华为CEO任正非表示，这项技术将改变通信行业。"

        return [
            lx.data.ExampleData(
                text=example_text,
                extractions=[
                    lx.data.Extraction(
                        extraction_class="时间",
                        extraction_text="2024年3月15日",
                        attributes={"类型": "具体日期"}
                    ),
                    lx.data.Extraction(
                        extraction_class="机构",
                        extraction_text="华为公司",
                        attributes={"类型": "科技公司"}
                    ),
                    lx.data.Extraction(
                        extraction_class="地点",
                        extraction_text="深圳总部",
                        attributes={"类型": "公司地址"}
                    ),
                    lx.data.Extraction(
                        extraction_class="事件",
                        extraction_text="发布了最新的5G技术",
                        attributes={"类型": "产品发布"}
                    ),
                    lx.data.Extraction(
                        extraction_class="人物",
                        extraction_text="任正非",
                        attributes={"职位": "CEO", "所属机构": "华为"}
                    ),
                ]
            )
        ]

    def get_samples(self) -> List[Dict[str, str]]:
        return [
            {
                "id": "news_sample_1",
                "title": "科技新闻",
                "text": textwrap.dedent("""\
                    北京时间2024年12月20日，中国科学院在北京举行新闻发布会，宣布中国自主研发的量子计算机"九章三号"取得重大突破。

                    中科院院长侯建国在发布会上介绍，"九章三号"在特定任务上的计算速度达到了传统超级计算机的百万倍。这一成果由中国科学技术大学潘建伟团队历时五年研发完成。

                    清华大学物理系教授王向斌表示，这标志着中国在量子计算领域已处于世界领先地位。该成果已在《自然》杂志上发表。

                    据悉，下一步研究团队将继续优化系统性能，并探索量子计算在密码学、药物研发等领域的应用。
                    """).strip()
            },
            {
                "id": "news_sample_2",
                "title": "财经新闻",
                "text": textwrap.dedent("""\
                    2024年12月18日，阿里巴巴集团在杭州西溪园区召开年度战略发布会。

                    阿里巴巴CEO吴泳铭宣布，公司将在未来三年投资1000亿元用于人工智能基础设施建设。这是继腾讯、百度之后，又一家科技巨头加大AI领域投入。

                    会上，阿里云智能总裁张勇介绍了通义千问大模型的最新进展。他表示，通义千问已服务超过100万企业客户，日处理请求超过10亿次。

                    摩根士丹利分析师指出，这一战略将有助于阿里巴巴在激烈的AI竞争中保持领先优势。受此消息影响，阿里巴巴美股盘前上涨3.5%。
                    """).strip()
            }
        ]
