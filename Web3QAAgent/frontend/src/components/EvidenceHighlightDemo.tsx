import React from 'react';
import {
  EvidenceHighlightProvider,
  EvidenceDataCard,
  EvidenceSourceDocument,
  EvidenceGrid,
  TrustIndicator,
  EvidenceLink,
} from './EvidenceHighlight';

// Demo component showing how to use the evidence highlighting system
export function EvidenceHighlightDemo() {
  // Sample document content
  const documentContent = `技术服务合同

甲方（服务提供方）：深圳创新科技有限公司
法定代表人：张伟
地址：深圳市南山区科技园路123号

乙方（客户）：广州数字解决方案公司
法定代表人：李娜
地址：广州市天河区创新大道456号

根据《中华人民共和国合同法》及相关法律法规，甲乙双方在平等自愿的基础上，就技术开发服务事宜达成如下协议：

第一条 合同金额
本合同总金额为人民币500万元（大写：伍佰万元整）。

第二条 付款方式
1. 签订合同后7个工作日内，乙方支付合同总额的30%，即150万元作为启动资金；
2. 项目中期验收合格后，支付40%，即200万元；
3. 项目最终验收合格后，支付剩余30%，即150万元。

第三条 合同期限
本合同自2024年1月15日起生效，至2024年12月31日止，有效期为12个月。

第四条 甲方责任
甲方负责项目的技术开发和实施，确保按时交付高质量的成果。

第五条 乙方责任
乙方负责提供必要的项目资料和技术支持，并按时支付合同款项。`;

  // Sample highlights - these would come from your extraction process
  const highlights = [
    { id: 'org1', text: '深圳创新科技有限公司', type: '组织' },
    { id: 'person1', text: '张伟', type: '人物' },
    { id: 'location1', text: '深圳市南山区科技园路123号', type: '地点' },
    { id: 'org2', text: '广州数字解决方案公司', type: '组织' },
    { id: 'person2', text: '李娜', type: '人物' },
    { id: 'location2', text: '广州市天河区创新大道456号', type: '地点' },
    { id: 'money1', text: '500万元', type: '金额' },
    { id: 'money2', text: '150万元', type: '金额' },
    { id: 'money3', text: '200万元', type: '金额' },
    { id: 'percent1', text: '30%', type: '百分比' },
    { id: 'percent2', text: '40%', type: '百分比' },
    { id: 'date1', text: '2024年1月15日', type: '日期' },
    { id: 'date2', text: '2024年12月31日', type: '日期' },
  ];

  return (
    <EvidenceHighlightProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-gray-900 mb-2">证据高亮系统演示</h1>
            <p className="text-gray-600">
              将鼠标悬停在右侧数据卡片上，左侧原文会自动高亮显示对应证据
            </p>
          </div>

          {/* Trust Indicator */}
          <TrustIndicator
            totalEvidence={highlights.length}
            verifiedEvidence={highlights.length}
          />

          {/* Main Layout */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: Source Document */}
            <div>
              <EvidenceSourceDocument
                content={documentContent}
                highlights={highlights}
                title="原始文档"
              />
            </div>

            {/* Right: Extracted Data */}
            <div className="space-y-6">
              {/* Organizations */}
              <div>
                <h3 className="text-gray-900 mb-3 flex items-center gap-2">
                  组织机构
                  <span className="text-xs text-gray-600">(2 个)</span>
                </h3>
                <EvidenceGrid columns={1}>
                  <EvidenceDataCard
                    id="org1"
                    type="组织"
                    value="深圳创新科技有限公司"
                    context="甲方（服务提供方）"
                    confidence={0.98}
                    sourceText="甲方（服务提供方）：深圳创新科技有限公司"
                  />
                  <EvidenceDataCard
                    id="org2"
                    type="组织"
                    value="广州数字解决方案公司"
                    context="乙方（客户）"
                    confidence={0.97}
                    sourceText="乙方（客户）：广州数字解决方案公司"
                  />
                </EvidenceGrid>
              </div>

              {/* People */}
              <div>
                <h3 className="text-gray-900 mb-3 flex items-center gap-2">
                  关键人物
                  <span className="text-xs text-gray-600">(2 个)</span>
                </h3>
                <EvidenceGrid columns={2}>
                  <EvidenceDataCard
                    id="person1"
                    type="人物"
                    value="张伟"
                    context="甲方法定代表人"
                    confidence={0.95}
                    sourceText="法定代表人：张伟"
                  />
                  <EvidenceDataCard
                    id="person2"
                    type="人物"
                    value="李娜"
                    context="乙方法定代表人"
                    confidence={0.96}
                    sourceText="法定代表人：李娜"
                  />
                </EvidenceGrid>
              </div>

              {/* Money */}
              <div>
                <h3 className="text-gray-900 mb-3 flex items-center gap-2">
                  金额信息
                  <span className="text-xs text-gray-600">(3 个)</span>
                </h3>
                <EvidenceGrid columns={3}>
                  <EvidenceDataCard
                    id="money1"
                    type="金额"
                    value="500万元"
                    context="合同总金额"
                    confidence={0.99}
                    sourceText="本合同总金额为人民币500万元"
                  />
                  <EvidenceDataCard
                    id="money2"
                    type="金额"
                    value="150万元"
                    context="首期付款"
                    confidence={0.97}
                    sourceText="即150万元作为启动资金"
                  />
                  <EvidenceDataCard
                    id="money3"
                    type="金额"
                    value="200万元"
                    context="中期付款"
                    confidence={0.98}
                    sourceText="支付40%，即200万元"
                  />
                </EvidenceGrid>
              </div>

              {/* Dates */}
              <div>
                <h3 className="text-gray-900 mb-3 flex items-center gap-2">
                  重要日期
                  <span className="text-xs text-gray-600">(2 个)</span>
                </h3>
                <EvidenceGrid columns={2}>
                  <EvidenceDataCard
                    id="date1"
                    type="日期"
                    value="2024年1月15日"
                    context="合同生效日期"
                    confidence={0.99}
                    sourceText="本合同自2024年1月15日起生效"
                  />
                  <EvidenceDataCard
                    id="date2"
                    type="日期"
                    value="2024年12月31日"
                    context="合同结束日期"
                    confidence={0.99}
                    sourceText="至2024年12月31日止"
                  />
                </EvidenceGrid>
              </div>

              {/* Using Evidence Links inline */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-5">
                <h4 className="text-indigo-900 mb-3">合同摘要（使用内联证据链接）</h4>
                <p className="text-sm text-indigo-800 leading-relaxed space-y-2">
                  <span className="block">
                    本合同由 <EvidenceLink id="org1" text="深圳创新科技有限公司" type="组织" /> 与{' '}
                    <EvidenceLink id="org2" text="广州数字解决方案公司" type="组织" /> 签订。
                  </span>
                  <span className="block">
                    合同总金额为 <EvidenceLink id="money1" text="500万元" type="金额" />，
                    分三期支付，首期 <EvidenceLink id="money2" text="150万元" type="金额" />。
                  </span>
                  <span className="block">
                    合同自 <EvidenceLink id="date1" text="2024年1月15日" type="日期" /> 生效，
                    至 <EvidenceLink id="date2" text="2024年12月31日" type="日期" /> 结束。
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Feature Explanation */}
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
              <div className="text-3xl mb-3">🎨</div>
              <h4 className="text-gray-900 mb-2">颜色编码</h4>
              <p className="text-sm text-gray-600">
                不同类型的数据使用不同的颜色，帮助您快速识别信息类别
              </p>
            </div>
            <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
              <div className="text-3xl mb-3">🔗</div>
              <h4 className="text-gray-900 mb-2">双向链接</h4>
              <p className="text-sm text-gray-600">
                悬停在数据卡片上时，原文自动高亮；反之亦然
              </p>
            </div>
            <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
              <div className="text-3xl mb-3">✅</div>
              <h4 className="text-gray-900 mb-2">置信度评分</h4>
              <p className="text-sm text-gray-600">
                每条数据显示AI提取的准确度，透明展示可靠性
              </p>
            </div>
          </div>
        </div>
      </div>
    </EvidenceHighlightProvider>
  );
}
