"""药物信息提取场景"""

import textwrap
from typing import Dict, List

import langextract as lx

from app.scenarios.base import BaseScenario


class MedicationScenario(BaseScenario):
    """药物信息提取场景"""

    name = "药物信息"
    description = "从病历或处方中提取药物相关信息，包括药物名称、剂量、用法、频率、适应症等"
    extract_classes = ["药物", "剂量", "用法", "频率", "疗程", "适应症"]

    def get_prompt(self) -> str:
        return textwrap.dedent("""\
            从医疗文本中提取药物处方信息:

            - 药物: 药物名称
            - 剂量: 用药剂量 (如 100mg, 0.5g)
            - 用法: 给药途径 (如 口服、静脉注射)
            - 频率: 用药频率 (如 每日3次、每8小时一次)
            - 疗程: 用药时长 (如 连续5天、长期服用)
            - 适应症: 用药目的或治疗的疾病

            要求:
            1. extraction_text 必须是原文的精确子串
            2. 使用 medication_group 属性将同一药物的信息关联
            3. 按在文本中出现的顺序提取
            """)

    def get_examples(self) -> List[lx.data.ExampleData]:
        example_text = "患者服用阿司匹林肠溶片100mg，每日1次，口服，长期服用，用于预防心血管疾病。"

        return [
            lx.data.ExampleData(
                text=example_text,
                extractions=[
                    lx.data.Extraction(
                        extraction_class="药物",
                        extraction_text="阿司匹林肠溶片",
                        attributes={"medication_group": "阿司匹林肠溶片"}
                    ),
                    lx.data.Extraction(
                        extraction_class="剂量",
                        extraction_text="100mg",
                        attributes={"medication_group": "阿司匹林肠溶片"}
                    ),
                    lx.data.Extraction(
                        extraction_class="频率",
                        extraction_text="每日1次",
                        attributes={"medication_group": "阿司匹林肠溶片"}
                    ),
                    lx.data.Extraction(
                        extraction_class="用法",
                        extraction_text="口服",
                        attributes={"medication_group": "阿司匹林肠溶片"}
                    ),
                    lx.data.Extraction(
                        extraction_class="疗程",
                        extraction_text="长期服用",
                        attributes={"medication_group": "阿司匹林肠溶片"}
                    ),
                    lx.data.Extraction(
                        extraction_class="适应症",
                        extraction_text="预防心血管疾病",
                        attributes={"medication_group": "阿司匹林肠溶片"}
                    ),
                ]
            )
        ]

    def get_samples(self) -> List[Dict[str, str]]:
        return [
            {
                "id": "med_sample_1",
                "title": "心内科出院医嘱",
                "text": textwrap.dedent("""\
                    出院医嘱

                    诊断: 1. 不稳定型心绞痛  2. 高血压病3级 极高危  3. 2型糖尿病

                    出院带药:
                    1. 阿司匹林肠溶片 100mg 口服 每日1次 长期服用，用于抗血小板聚集
                    2. 阿托伐他汀钙片 20mg 口服 每晚1次 长期服用，用于调脂稳定斑块
                    3. 美托洛尔缓释片 47.5mg 口服 每日1次，用于控制心率
                    4. 厄贝沙坦片 150mg 口服 每日1次，用于降压治疗
                    5. 二甲双胍缓释片 500mg 口服 每日2次 餐时服用，用于控制血糖
                    6. 单硝酸异山梨酯缓释片 50mg 口服 每日1次，用于缓解心绞痛

                    注意事项: 按时服药，定期复查，如有不适及时就诊。
                    """).strip()
            },
            {
                "id": "med_sample_2",
                "title": "感染科处方",
                "text": textwrap.dedent("""\
                    处方

                    诊断: 社区获得性肺炎

                    1. 头孢曲松钠 2g 静脉滴注 每日1次 连续使用5-7天
                    2. 阿奇霉素片 500mg 口服 每日1次 连续使用3天
                    3. 氨溴索口服液 30mg 口服 每日3次 餐后服用
                    4. 布洛芬缓释胶囊 300mg 口服 发热时服用 每日不超过3次

                    备注: 如体温持续不退或症状加重，请及时复诊
                    """).strip()
            }
        ]
