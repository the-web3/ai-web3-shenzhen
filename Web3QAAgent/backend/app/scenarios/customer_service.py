"""客服信息提取场景"""

import textwrap
from typing import Dict, List

import langextract as lx

from app.scenarios.base import BaseScenario


class CustomerServiceScenario(BaseScenario):
    """客服信息提取场景"""

    name = "客服工单"
    description = "从客服对话记录、工单、投诉反馈中提取关键信息，用于问题分析和服务改进"
    extract_classes = ["客户", "订单", "问题", "情绪", "时间", "解决方案", "责任方", "满意度"]

    def get_prompt(self) -> str:
        return textwrap.dedent("""\
            从客服文本中提取以下信息:

            - 客户: 客户姓名、会员等级、联系方式、客户类型
            - 订单: 订单号、商品信息、订单金额
            - 问题: 问题类型、问题描述、问题等级
            - 情绪: 客户情绪状态（如：愤怒、不满、焦急、平和等）
            - 时间: 问题发生时间、处理时限、响应时间
            - 解决方案: 处理措施、补偿方案、具体金额
            - 责任方: 问题归属部门、责任人
            - 满意度: 客户评价、NPS评分、好评率

            要求:
            1. extraction_text 必须是原文的精确子串，不要改写或总结
            2. 为客户添加会员等级和联系方式属性
            3. 为问题添加类型和等级属性
            4. 为解决方案添加补偿金额或措施属性
            5. 准确识别客户情绪变化
            6. 按照在文本中出现的顺序提取
            """)

    def get_examples(self) -> List[lx.data.ExampleData]:
        example_text = "客户王先生（钻石会员）投诉订单DD2024001延迟发货，情绪非常愤怒。客服赠送100元优惠券作为补偿。最终客户评价4星，表示基本满意。"

        return [
            lx.data.ExampleData(
                text=example_text,
                extractions=[
                    lx.data.Extraction(
                        extraction_class="客户",
                        extraction_text="王先生",
                        attributes={"会员等级": "钻石会员"}
                    ),
                    lx.data.Extraction(
                        extraction_class="订单",
                        extraction_text="DD2024001",
                        attributes={"类型": "订单号"}
                    ),
                    lx.data.Extraction(
                        extraction_class="问题",
                        extraction_text="延迟发货",
                        attributes={"类型": "物流问题", "等级": "投诉"}
                    ),
                    lx.data.Extraction(
                        extraction_class="情绪",
                        extraction_text="非常愤怒",
                        attributes={"阶段": "会话开始"}
                    ),
                    lx.data.Extraction(
                        extraction_class="解决方案",
                        extraction_text="100元优惠券",
                        attributes={"类型": "补偿", "形式": "优惠券"}
                    ),
                    lx.data.Extraction(
                        extraction_class="满意度",
                        extraction_text="4星",
                        attributes={"评价": "基本满意"}
                    ),
                ]
            )
        ]

    def get_samples(self) -> List[Dict[str, str]]:
        return [
            {
                "id": "cs_sample_1",
                "title": "电商客服对话",
                "text": textwrap.dedent("""\
                    会话ID：CS-2024122098765
                    会话时间：2024年12月20日 15:32:18 - 16:08:45
                    客服坐席：张小美（工号：KF-0892）

                    客户信息：
                    用户名：王先生
                    会员等级：钻石会员（年消费8.6万元）
                    注册手机：186****7890

                    对话摘要：
                    客户投诉12月15号下的订单（订单号DD20241215789456），购买戴森V15吸尘器，订单金额4299元，承诺18号送达但未收到。客户情绪开始时非常愤怒，多次强调"骗人"。

                    经核实，包裹在北京转运中心分拣时标签脱落导致延迟。

                    解决方案：
                    1. 赠送100元无门槛优惠券
                    2. 赠送价值299元的戴森原装配件包
                    3. 承诺当日6点前未送达则全额退款

                    工单信息：
                    工单号：WO2024122098765
                    问题分类：物流延迟 > 转运异常
                    问题等级：P2（重要客户投诉）
                    责任部门：物流部-北京转运中心
                    处理时长：36分27秒
                    客户情绪变化：愤怒 → 平和
                    客户评价：4星
                    客户反馈："客服态度不错，但物流需要改进"
                    """).strip()
            },
            {
                "id": "cs_sample_2",
                "title": "技术支持工单",
                "text": textwrap.dedent("""\
                    工单号：TK-2024-SZ-056789
                    创建时间：2024年12月18日 09:15
                    工单状态：已完结

                    客户信息：
                    姓名：李女士
                    公司：深圳市XX科技有限公司
                    联系电话：0755-2888****
                    客户类型：企业客户（年服务费12万元）
                    服务等级：SLA-Gold（响应时限4小时）

                    问题描述：
                    标题：ERP系统频繁报错无法登录
                    问题类型：系统故障 > 登录异常
                    紧急程度：紧急
                    影响范围：全公司50人无法使用系统

                    处理过程：
                    第1次处理：一线技术支持张工，远程排查客户网络，问题未解决，升级至二线
                    第2次处理：二线技术专家王工发现数据库连接池耗尽，重启服务后恢复正常

                    根因：定时备份任务异常占用大量数据库连接

                    补偿方案：
                    1. 本月服务费减免20%（2000元）
                    2. 赠送额外1个月服务期
                    3. 提供专属技术顾问一对一支持

                    响应时效：30分钟（达标）
                    解决时效：2小时（达标）
                    客户满意度：5星
                    客户反馈："处理速度很快，补偿方案也很合理"
                    """).strip()
            }
        ]
