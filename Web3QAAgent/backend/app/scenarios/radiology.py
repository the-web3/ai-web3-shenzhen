"""放射学报告场景"""

import textwrap
from typing import Dict, List

import langextract as lx

from app.scenarios.base import BaseScenario


class RadiologyScenario(BaseScenario):
    """放射学报告提取场景"""

    name = "放射学报告"
    description = "从医学影像报告中提取结构化信息，包括检查类型、临床指征、发现、印象等"
    extract_classes = ["检查类型", "临床指征", "检查技术", "发现", "印象", "建议"]

    def get_prompt(self) -> str:
        return textwrap.dedent("""\
            从放射学报告中提取结构化信息:

            - 检查类型: 如CT、MRI、X光、超声等
            - 临床指征: 检查原因、主诉症状
            - 检查技术: 检查方法、对比剂使用等
            - 发现: 具体的影像发现，包括正常和异常
            - 印象: 诊断印象和结论
            - 建议: 后续检查或治疗建议

            要求:
            1. extraction_text 必须是原文的精确子串
            2. 为每个发现标注临床重要性 (normal/minor/significant)
            3. 按在文本中出现的顺序提取
            """)

    def get_examples(self) -> List[lx.data.ExampleData]:
        example_text = textwrap.dedent("""\
            CT检查报告
            临床指征: 腹痛待查
            检查技术: 腹部CT平扫+增强
            影像所见:
            肝脏大小形态正常，实质密度均匀，未见明显异常强化灶。
            胆囊壁轻度增厚，约4mm，腔内未见明显结石影。
            胰腺、脾脏未见明显异常。
            右肾见一直径约1.2cm低密度灶，边界清晰，考虑囊肿可能。
            印象:
            1. 胆囊壁轻度增厚，建议结合临床
            2. 右肾囊肿可能
            建议: 建议3个月后复查
            """).strip()

        return [
            lx.data.ExampleData(
                text=example_text,
                extractions=[
                    lx.data.Extraction(
                        extraction_class="检查类型",
                        extraction_text="CT检查报告",
                        attributes={"类型": "CT"}
                    ),
                    lx.data.Extraction(
                        extraction_class="临床指征",
                        extraction_text="腹痛待查",
                        attributes={"类型": "主诉"}
                    ),
                    lx.data.Extraction(
                        extraction_class="检查技术",
                        extraction_text="腹部CT平扫+增强",
                        attributes={"方法": "平扫+增强"}
                    ),
                    lx.data.Extraction(
                        extraction_class="发现",
                        extraction_text="肝脏大小形态正常，实质密度均匀，未见明显异常强化灶",
                        attributes={"部位": "肝脏", "significance": "normal"}
                    ),
                    lx.data.Extraction(
                        extraction_class="发现",
                        extraction_text="胆囊壁轻度增厚，约4mm",
                        attributes={"部位": "胆囊", "significance": "minor"}
                    ),
                    lx.data.Extraction(
                        extraction_class="发现",
                        extraction_text="右肾见一直径约1.2cm低密度灶，边界清晰，考虑囊肿可能",
                        attributes={"部位": "右肾", "significance": "minor"}
                    ),
                    lx.data.Extraction(
                        extraction_class="印象",
                        extraction_text="胆囊壁轻度增厚，建议结合临床",
                        attributes={"序号": "1"}
                    ),
                    lx.data.Extraction(
                        extraction_class="印象",
                        extraction_text="右肾囊肿可能",
                        attributes={"序号": "2"}
                    ),
                    lx.data.Extraction(
                        extraction_class="建议",
                        extraction_text="建议3个月后复查",
                        attributes={"类型": "随访"}
                    ),
                ]
            )
        ]

    def get_samples(self) -> List[Dict[str, str]]:
        return [
            {
                "id": "rad_sample_1",
                "title": "腹部CT报告",
                "text": textwrap.dedent("""\
                    CT检查报告

                    患者姓名: 张某  性别: 男  年龄: 55岁
                    临床指征: 上腹部不适1周
                    检查技术: 腹部CT平扫+增强扫描

                    影像所见:
                    肝脏: 大小形态正常，各叶比例协调，实质密度均匀，增强后未见异常强化灶。肝内外胆管未见扩张。
                    胆囊: 大小正常，壁不厚，腔内未见结石影。
                    胰腺: 形态正常，实质密度均匀，胰管未见扩张。
                    脾脏: 大小形态正常，实质密度均匀。
                    双肾: 大小形态正常，皮髓质分界清晰，肾盂肾盏未见扩张。右肾下极见一直径约0.8cm低密度灶，边界清晰，CT值约10HU，考虑囊肿。
                    腹膜后: 未见明显肿大淋巴结。

                    印象:
                    1. 右肾小囊肿
                    2. 腹部CT扫描未见其他明显异常

                    建议: 定期随访即可
                    """).strip()
            },
            {
                "id": "rad_sample_2",
                "title": "胸部X光报告",
                "text": textwrap.dedent("""\
                    胸部X线检查报告

                    临床指征: 咳嗽1周，发热
                    检查技术: 胸部正侧位片

                    影像所见:
                    两肺纹理清晰，右下肺野见斑片状模糊影，边界不清。
                    两肺门影不大，纵隔居中，心影大小形态正常。
                    两膈面光滑，肋膈角锐利。
                    胸廓对称，骨质未见明显异常。

                    印象:
                    右下肺感染性病变可能，建议结合临床及实验室检查，必要时CT进一步检查
                    """).strip()
            }
        ]
