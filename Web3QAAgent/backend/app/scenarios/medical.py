"""中医药多组学机制信息提取场景"""

import textwrap
from typing import Dict, List

import langextract as lx

from app.scenarios.base import BaseScenario


class MedicalScenario(BaseScenario):
    """
    中医药多组学 / 机制研究信息提取场景
    （适用于综述论文、基础研究、机制研究文本）
    """

    name = "中医药机制研究"
    description = (
        "从中医药与疾病机制研究文本中提取可用于构建知识图谱的结构化信息，"
        "包括中药/成分、分子靶点、信号通路、细胞类型、生物过程、疾病及组学证据等"
    )

    # 🔑 GraphRAG 友好的实体类型
    extract_classes = [
        "中药",
        "活性成分",
        "基因",
        "蛋白",
        "非编码RNA",
        "信号通路",
        "细胞类型",
        "生物过程",
        "表型",
        "疾病",
        "组学类型",
        "实验模型",
    ]

    def get_prompt(self) -> str:
        return textwrap.dedent("""\
            从中医药与疾病机制研究文本中提取可用于构建知识图谱的实体信息。

            重点关注以下机制链路中的实体：
            - 中药 / 方剂 / 药对
            - 活性成分
            - 分子靶点（基因、蛋白、miRNA、circRNA 等）
            - 信号通路（如 TGF-β/Smad、PI3K/Akt、PPAR、AMPK 等）
            - 作用的细胞类型（如 HSC、巨噬细胞等）
            - 生物过程或表型（如 HSC 活化、凋亡、铁死亡、自噬）
            - 疾病或病理状态
            - 组学类型（转录组、蛋白质组、代谢组等）
            - 实验模型（如 CCl4 诱导模型、小鼠模型等）

            要求：
            1. extraction_text 必须是原文中的精确子串，不得改写或总结
            2. 使用 mechanism_group 属性将同一机制链路中的实体进行关联
            3. 同一实体可参与多个 mechanism_group
            4. 不推断、不补充原文未明确出现的信息
            5. 按实体在文本中出现的顺序进行抽取
            """
        )

    def get_examples(self) -> List[lx.data.ExampleData]:
        example_text = (
            "研究表明，三七皂苷R1可通过激活PPAR-γ信号通路，"
            "抑制TGF-β1诱导的肝星状细胞活化，从而减轻CCl4诱导的小鼠肝纤维化。"
        )

        return [
            lx.data.ExampleData(
                text=example_text,
                extractions=[
                    lx.data.Extraction(
                        extraction_class="活性成分",
                        extraction_text="三七皂苷R1",
                        attributes={"mechanism_group": "三七皂苷R1-PPARγ-HSC"}
                    ),
                    lx.data.Extraction(
                        extraction_class="信号通路",
                        extraction_text="PPAR-γ信号通路",
                        attributes={"mechanism_group": "三七皂苷R1-PPARγ-HSC"}
                    ),
                    lx.data.Extraction(
                        extraction_class="蛋白",
                        extraction_text="TGF-β1",
                        attributes={"mechanism_group": "三七皂苷R1-PPARγ-HSC"}
                    ),
                    lx.data.Extraction(
                        extraction_class="细胞类型",
                        extraction_text="肝星状细胞",
                        attributes={"mechanism_group": "三七皂苷R1-PPARγ-HSC"}
                    ),
                    lx.data.Extraction(
                        extraction_class="生物过程",
                        extraction_text="肝星状细胞活化",
                        attributes={"mechanism_group": "三七皂苷R1-PPARγ-HSC"}
                    ),
                    lx.data.Extraction(
                        extraction_class="疾病",
                        extraction_text="肝纤维化",
                        attributes={"mechanism_group": "三七皂苷R1-PPARγ-HSC"}
                    ),
                    lx.data.Extraction(
                        extraction_class="实验模型",
                        extraction_text="CCl4诱导的小鼠",
                        attributes={"mechanism_group": "三七皂苷R1-PPARγ-HSC"}
                    ),
                ]
            )
        ]

    def get_samples(self) -> List[Dict[str, str]]:
        return [
            {
                "id": "mechanism_sample_1",
                "title": "中医药抗肝纤维化机制研究",
                "text": (
                    "多项研究表明，中药复方及其活性成分可通过调控TGF-β/Smad、"
                    "PI3K/Akt等信号通路，抑制肝星状细胞活化，促进细胞凋亡或铁死亡，"
                    "从而改善肝纤维化进程。转录组和蛋白质组学研究为上述机制提供了分子证据。"
                )
            }
        ]
