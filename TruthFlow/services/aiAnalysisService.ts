// AI 风险评估 API 服务

const API_CONFIG = {
    BASE_URL: 'https://ai-production-f4f1.up.railway.app',
    ENDPOINTS: {
        HEALTH: '/api/health',
        ANALYZE: '/api/analyze'
    }
};

export interface AIAnalysisRequest {
    detailed_info: string;
    companies?: { name: string }[];
    persons?: { name: string }[];
}

export interface AIAnalysisResponse {
    timestamp: string;
    analysis: string;
    probability: number;
    confidence: number;
    success_odds: number;
    failure_odds: number;
    adjusted_probability: number;
}

export class AIAnalysisService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
    }

    /**
     * 健康检查
     */
    async checkHealth(): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.HEALTH}`);
            const data = await response.json();
            return { success: true, data };
        } catch (error: any) {
            console.error('健康检查失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 分析事件并生成赔率
     */
    async analyzeEvent(params: {
        question: string;
        companies?: string[];
        persons?: string[];
    }): Promise<{ success: boolean; data?: AIAnalysisResponse; error?: string }> {
        try {
            const { question, companies = [], persons = [] } = params;

            if (!question) {
                throw new Error('事件描述不能为空');
            }

            // 构建请求体
            const requestBody: AIAnalysisRequest = {
                detailed_info: question,
                companies: companies.map(name => ({ name })),
                persons: persons.map(name => ({ name }))
            };

            console.log('📤 发送 API 请求:', requestBody);

            const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.ANALYZE}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `API 请求失败: ${response.status}`);
            }

            const data: AIAnalysisResponse = await response.json();
            console.log('📥 API 响应:', data);

            return { success: true, data };

        } catch (error: any) {
            console.error('事件分析失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 将 AI 概率转换为池子金额
     * 使用 CPMM 公式: Price(Yes) = NoPool / (YesPool + NoPool)
     * 给定 adjusted_probability (YES 的概率)，计算初始池子
     */
    calculateInitialPools(adjustedProbability: number, totalLiquidity: number = 100000): {
        yesPool: number;
        noPool: number;
    } {
        // adjustedProbability 是 YES 的概率 (0-100)
        const yesProb = adjustedProbability / 100;
        
        // CPMM: yesProb = noPool / (yesPool + noPool)
        // 设 totalLiquidity = yesPool + noPool
        // 则: yesProb = noPool / totalLiquidity
        // noPool = yesProb * totalLiquidity
        // yesPool = totalLiquidity - noPool
        
        const noPool = Math.round(yesProb * totalLiquidity);
        const yesPool = totalLiquidity - noPool;
        
        return { yesPool, noPool };
    }
}

// 创建全局实例
export const aiAnalysisService = new AIAnalysisService();
