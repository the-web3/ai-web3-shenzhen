// Ceres Protocol AI Agent Demo Frontend Script
class CeresAIDemo {
  constructor() {
    this.isRunning = false;
    this.currentScenario = "competitive";
    this.demoResults = {};
    this.startTime = null;
    this.runtimeInterval = null;
    this.apiBaseUrl = "http://localhost:8000/api";
    this.useRealAPI = true; // 设置为false使用纯前端模拟

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupCharts();
    this.updateStatus("待机中", false);
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.switchScenario(e.target.dataset.scenario);
      });
    });

    // Demo controls
    document.getElementById("startDemo").addEventListener("click", () => {
      this.startDemo();
    });

    document.getElementById("resetDemo").addEventListener("click", () => {
      this.resetDemo();
    });
  }

  setupCharts() {
    // Price comparison chart
    const priceCtx = document.getElementById("priceChart");
    if (priceCtx) {
      this.priceChart = new Chart(priceCtx, {
        type: "bar",
        data: {
          labels: ["人类预测", "AI预测"],
          datasets: [
            {
              label: "YES价格",
              data: [0, 0],
              backgroundColor: ["#667eea", "#38a169"],
              borderRadius: 8,
              maxBarThickness: 80,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 1,
              ticks: {
                callback: function (value) {
                  return value * 100 + "%";
                },
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
          },
        },
      });
    }

    // Gauge charts for trend analysis
    this.setupGaugeCharts();
  }

  setupGaugeCharts() {
    // Trend strength gauge
    const trendCtx = document.getElementById("trendStrengthGauge");
    if (trendCtx) {
      this.trendStrengthGauge = new Chart(trendCtx, {
        type: "doughnut",
        data: {
          datasets: [
            {
              data: [0, 100],
              backgroundColor: ["#667eea", "#e2e8f0"],
              borderWidth: 0,
              cutout: "70%",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
          },
        },
      });
    }

    // Confidence gauge
    const confCtx = document.getElementById("confidenceGauge");
    if (confCtx) {
      this.confidenceGauge = new Chart(confCtx, {
        type: "doughnut",
        data: {
          datasets: [
            {
              data: [0, 100],
              backgroundColor: ["#38a169", "#e2e8f0"],
              borderWidth: 0,
              cutout: "70%",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
          },
        },
      });
    }
  }

  switchScenario(scenario) {
    // Update active tab
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    document
      .querySelector(`[data-scenario="${scenario}"]`)
      .classList.add("active");

    // Update active panel
    document.querySelectorAll(".scenario-panel").forEach((panel) => {
      panel.classList.remove("active");
    });
    document.getElementById(scenario).classList.add("active");

    this.currentScenario = scenario;
  }

  async startDemo() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTime = Date.now();
    this.updateStatus("运行中", true);

    // Disable start button, enable reset
    document.getElementById("startDemo").disabled = true;
    document.getElementById("resetDemo").disabled = false;

    // Start runtime counter
    this.startRuntimeCounter();

    // Show loading
    this.showLoading("AI正在初始化...");

    try {
      // Run demo scenarios sequentially
      await this.runCompetitiveJudgment();
      await this.runTrendAnalysis();
      await this.runExternalHotspot();
      await this.showSummary();

      this.updateStatus("演示完成", false);
    } catch (error) {
      console.error("Demo failed:", error);
      this.updateStatus("演示失败", false);
    } finally {
      this.hideLoading();
      document.getElementById("startDemo").disabled = false;
      this.isRunning = false;
    }
  }

  async runCompetitiveJudgment() {
    this.switchScenario("competitive");
    this.updateScenarioStatus("competitive", "运行中", "running");

    // Show human event
    const humanEvent = {
      description: "全球平均温度是否会在2030年前超过工业化前水平1.5°C？",
      yes_price: 0.65,
      no_price: 0.35,
      stake: 2.5,
    };

    this.displayHumanEvent(humanEvent);

    // Show AI thinking animation
    this.showAIThinking();

    // Simulate AI analysis time
    await this.delay(3000);

    // Generate AI result
    const aiResult = this.simulateCompetitiveAnalysis(humanEvent);
    this.displayAIAnalysis(aiResult);

    // Update price chart
    this.updatePriceChart(humanEvent.yes_price, aiResult.yes_price);

    // Show disagreement
    this.showDisagreement(humanEvent.yes_price, aiResult.yes_price);

    this.demoResults.competitive = aiResult;
    this.updateScenarioStatus("competitive", "已完成", "completed");
    this.updateEventCount();

    await this.delay(2000);
  }

  async runTrendAnalysis() {
    this.switchScenario("trend");
    this.updateScenarioStatus("trend", "运行中", "running");

    // Show trending market
    const trendingMarket = {
      description: "亚太地区可再生能源采用率是否会在2025年达到40%？",
      volume: 15.5,
      participants: 8,
      volatility: 0.12,
      momentum: 0.25,
    };

    this.displayTrendingMarket(trendingMarket);

    await this.delay(2000);

    // Generate trend analysis
    const trendAnalysis = this.simulateTrendAnalysis(trendingMarket);
    this.displayTrendAnalysis(trendAnalysis);

    // Generate derivatives
    const derivatives = this.generateDerivatives(trendingMarket);
    this.displayDerivatives(derivatives);

    this.demoResults.trend = { analysis: trendAnalysis, derivatives };
    this.updateScenarioStatus("trend", "已完成", "completed");
    this.updateEventCount();

    await this.delay(2000);
  }

  async runExternalHotspot() {
    this.switchScenario("hotspot");
    this.updateScenarioStatus("hotspot", "运行中", "running");

    // Show data source monitoring
    this.startDataSourceMonitoring();

    await this.delay(3000);

    // Generate hotspot events
    const hotspots = this.generateHotspotEvents();
    this.displayHotspots(hotspots);

    this.demoResults.hotspot = hotspots;
    this.updateScenarioStatus("hotspot", "已完成", "completed");
    this.updateEventCount();

    await this.delay(2000);
  }

  async showSummary() {
    this.switchScenario("summary");
    this.updateScenarioStatus("summary", "已完成", "completed");

    // Calculate totals
    const totalEvents =
      1 +
      (this.demoResults.trend?.derivatives?.length || 0) +
      (this.demoResults.hotspot?.filter((h) => h.confidence >= 0.5).length ||
        0);

    // Update summary cards with animation
    this.animateNumber("totalEvents", totalEvents);
    this.animateNumber("competitiveJudgments", 1);
    this.animateNumber(
      "trendDerivatives",
      this.demoResults.trend?.derivatives?.length || 0,
    );
    this.animateNumber(
      "hotspotMarkets",
      this.demoResults.hotspot?.filter((h) => h.confidence >= 0.5).length || 0,
    );

    // Update success rate
    this.animateSuccessRate(100);

    // Show capabilities with staggered animation
    this.animateCapabilities();
  }

  // Simulation methods
  simulateCompetitiveAnalysis(humanEvent) {
    const baseDisagreement = Math.random() * 0.06 + 0.02; // 2-8%
    const aiYesPrice = Math.max(
      0.15,
      Math.min(
        0.85,
        humanEvent.yes_price +
          (Math.random() > 0.5 ? baseDisagreement : -baseDisagreement),
      ),
    );

    return {
      description:
        "AI气候分析: 全球平均温度是否会在2030年前超过工业化前水平1.5°C？(探索性分析)",
      yes_price: Math.round(aiYesPrice * 1000) / 1000,
      no_price: Math.round((1 - aiYesPrice) * 1000) / 1000,
      confidence: Math.random() * 0.4 + 0.5, // 0.5-0.9
      reasoning:
        "基于季节模式和长期气候数据分析，特别关注温度变化趋势和历史模式",
    };
  }

  simulateTrendAnalysis(market) {
    return {
      trend_strength: Math.random() * 0.4 + 0.6, // 0.6-1.0
      confidence: Math.random() * 0.3 + 0.6, // 0.6-0.9
      recommended_action:
        Math.random() > 0.5 ? "create_derivative_market" : "monitor_closely",
    };
  }

  generateDerivatives(market) {
    return [
      {
        description: `该市场的交易量是否会超过${(market.volume * 1.5).toFixed(1)} HKTC？`,
        confidence: 0.7,
        timeframe: "24小时内",
      },
      {
        description: "该市场是否会出现超过20%的价格波动？",
        confidence: 0.8,
        timeframe: "12小时内",
      },
    ];
  }

  generateHotspotEvents() {
    const events = [
      {
        description: "全球海平面是否会在2025年前上升超过18厘米？",
        confidence: 0.64,
        urgency: "high",
        category: "sea_level",
      },
      {
        description: "印度的可再生能源采用率是否会在未来6个月内达到79%？",
        confidence: 0.73,
        urgency: "medium",
        category: "energy",
      },
      {
        description: "全球海平面是否会在2030年前上升超过36厘米？",
        confidence: 0.68,
        urgency: "medium",
        category: "sea_level",
      },
    ];

    return events;
  }

  // Display methods
  displayHumanEvent(event) {
    document.querySelector(".event-description").textContent =
      event.description;
    document.getElementById("humanYes").textContent =
      event.yes_price.toFixed(2);
    document.getElementById("humanNo").textContent = event.no_price.toFixed(2);
    document.getElementById("humanStake").textContent = event.stake;
  }

  showAIThinking() {
    document.getElementById("thinkingAnimation").style.display = "flex";
    document.getElementById("analysisResult").style.display = "none";
  }

  displayAIAnalysis(result) {
    document.getElementById("thinkingAnimation").style.display = "none";
    document.getElementById("analysisResult").style.display = "block";

    document.getElementById("aiDescription").textContent = result.description;
    document.getElementById("aiReasoning").textContent = result.reasoning;
    document.getElementById("aiConfidence").textContent =
      result.confidence.toFixed(2);
  }

  updatePriceChart(humanPrice, aiPrice) {
    if (this.priceChart) {
      this.priceChart.data.datasets[0].data = [humanPrice, aiPrice];
      this.priceChart.update();
    }
  }

  showDisagreement(humanPrice, aiPrice) {
    const disagreement = Math.abs(humanPrice - aiPrice);
    const indicator = document.getElementById("disagreementIndicator");

    let level, text;
    if (disagreement > 0.1) {
      level = "high";
      text = `价格分歧: ${(disagreement * 100).toFixed(1)}% (显著分歧)`;
    } else if (disagreement > 0.05) {
      level = "medium";
      text = `价格分歧: ${(disagreement * 100).toFixed(1)}% (中等分歧)`;
    } else {
      level = "low";
      text = `价格分歧: ${(disagreement * 100).toFixed(1)}% (轻微分歧)`;
    }

    indicator.className = `disagreement-indicator ${level}`;
    indicator.textContent = text;
  }

  displayTrendingMarket(market) {
    document.getElementById("marketDescription").textContent =
      market.description;
    document.getElementById("marketVolume").textContent = market.volume;
    document.getElementById("marketParticipants").textContent =
      market.participants;
    document.getElementById("marketVolatility").textContent =
      `${(market.volatility * 100).toFixed(1)}%`;
    document.getElementById("marketMomentum").textContent =
      `${(market.momentum * 100).toFixed(1)}%`;
  }

  displayTrendAnalysis(analysis) {
    // Update gauges
    if (this.trendStrengthGauge) {
      const strength = analysis.trend_strength * 100;
      this.trendStrengthGauge.data.datasets[0].data = [
        strength,
        100 - strength,
      ];
      this.trendStrengthGauge.update();
    }

    if (this.confidenceGauge) {
      const confidence = analysis.confidence * 100;
      this.confidenceGauge.data.datasets[0].data = [
        confidence,
        100 - confidence,
      ];
      this.confidenceGauge.update();
    }

    // Update recommendation
    const actionMap = {
      create_derivative_market: "🚀 创建衍生市场",
      monitor_closely: "👀 密切监控",
      no_action: "⏸️ 暂无行动",
    };
    document.getElementById("recommendedAction").textContent =
      actionMap[analysis.recommended_action] || analysis.recommended_action;
  }

  displayDerivatives(derivatives) {
    const container = document.getElementById("derivativesList");
    container.innerHTML = "";

    derivatives.forEach((derivative, index) => {
      const item = document.createElement("div");
      item.className = "derivative-item";
      item.innerHTML = `
                <div class="derivative-description">${derivative.description}</div>
                <div class="derivative-meta">
                    <span>信心度: ${derivative.confidence.toFixed(2)}</span>
                    <span>时间框架: ${derivative.timeframe}</span>
                </div>
            `;
      container.appendChild(item);

      // Animate in
      setTimeout(() => {
        item.style.opacity = "0";
        item.style.transform = "translateY(20px)";
        item.style.transition = "all 0.5s ease";
        setTimeout(() => {
          item.style.opacity = "1";
          item.style.transform = "translateY(0)";
        }, 100);
      }, index * 200);
    });
  }

  startDataSourceMonitoring() {
    const sources = [
      "weatherStatus",
      "newsStatus",
      "socialStatus",
      "satelliteStatus",
    ];

    sources.forEach((sourceId, index) => {
      setTimeout(() => {
        const element = document.getElementById(sourceId);
        element.textContent = "扫描中...";
        element.className = "source-status scanning";

        setTimeout(() => {
          element.textContent = "已完成";
          element.className = "source-status completed";
        }, 2000);
      }, index * 500);
    });
  }

  displayHotspots(hotspots) {
    const container = document.getElementById("hotspotsRadar");
    container.innerHTML = "";

    hotspots.forEach((hotspot, index) => {
      const item = document.createElement("div");
      item.className = "hotspot-item";

      const categoryIcons = {
        sea_level: "🌊",
        energy: "⚡",
        temperature: "🌡️",
        precipitation: "🌧️",
      };

      item.innerHTML = `
                <div class="hotspot-header">
                    <div class="hotspot-title">
                        <span>${categoryIcons[hotspot.category] || "📊"}</span>
                        <span>热点 ${index + 1}</span>
                    </div>
                    <div class="hotspot-confidence">
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${hotspot.confidence * 100}%"></div>
                        </div>
                        <span>${hotspot.confidence.toFixed(2)}</span>
                    </div>
                </div>
                <div class="hotspot-description">${hotspot.description}</div>
                <div class="hotspot-meta">
                    <span>紧急度: ${hotspot.urgency}</span>
                    <span>类别: ${hotspot.category}</span>
                </div>
            `;

      container.appendChild(item);

      // Animate in
      setTimeout(() => {
        item.style.opacity = "0";
        item.style.transform = "translateX(-20px)";
        item.style.transition = "all 0.5s ease";
        setTimeout(() => {
          item.style.opacity = "1";
          item.style.transform = "translateX(0)";
        }, 100);
      }, index * 300);
    });

    // Update qualifying events count
    const qualifying = hotspots.filter((h) => h.confidence >= 0.5).length;
    document.getElementById("qualifyingCount").textContent = qualifying;
    document.getElementById("totalHotspots").textContent = hotspots.length;
  }

  // Animation methods
  animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const startValue = 0;
    const duration = 2000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentValue = Math.floor(
        startValue + (targetValue - startValue) * progress,
      );

      element.textContent = currentValue;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  animateSuccessRate(rate) {
    const fill = document.getElementById("successFill");
    const text = document.getElementById("successRate");

    setTimeout(() => {
      fill.style.width = `${rate}%`;
      text.textContent = `${rate}%`;
    }, 500);
  }

  animateCapabilities() {
    const items = document.querySelectorAll(".capability-item");
    items.forEach((item, index) => {
      setTimeout(() => {
        item.style.opacity = "0";
        item.style.transform = "translateX(-20px)";
        item.style.transition = "all 0.5s ease";
        setTimeout(() => {
          item.style.opacity = "1";
          item.style.transform = "translateX(0)";
        }, 100);
      }, index * 200);
    });
  }

  // Utility methods
  updateStatus(status, isActive) {
    document.getElementById("aiStatusText").textContent = status;
    const indicator = document.getElementById("aiStatus");
    if (isActive) {
      indicator.classList.add("active");
    } else {
      indicator.classList.remove("active");
    }
  }

  updateScenarioStatus(scenario, status, className) {
    const element = document.getElementById(`${scenario}Status`);
    element.textContent = status;
    element.className = `scenario-status ${className}`;
  }

  updateEventCount() {
    const competitive = this.demoResults.competitive ? 1 : 0;
    const trend = this.demoResults.trend?.derivatives?.length || 0;
    const hotspot =
      this.demoResults.hotspot?.filter((h) => h.confidence >= 0.5).length || 0;
    const total = competitive + trend + hotspot;

    document.getElementById("eventCount").textContent = total;
  }

  startRuntimeCounter() {
    this.runtimeInterval = setInterval(() => {
      if (this.startTime) {
        const elapsed = Date.now() - this.startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        document.getElementById("runtime").textContent =
          `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      }
    }, 1000);
  }

  showLoading(text) {
    const overlay = document.getElementById("loadingOverlay");
    const textElement = overlay.querySelector(".loading-text");
    textElement.textContent = text;
    overlay.style.display = "flex";
  }

  hideLoading() {
    document.getElementById("loadingOverlay").style.display = "none";
  }

  resetDemo() {
    // Reset state
    this.isRunning = false;
    this.demoResults = {};
    this.startTime = null;

    if (this.runtimeInterval) {
      clearInterval(this.runtimeInterval);
      this.runtimeInterval = null;
    }

    // Reset UI
    this.updateStatus("待机中", false);
    document.getElementById("eventCount").textContent = "0";
    document.getElementById("runtime").textContent = "00:00";

    // Reset scenario statuses
    ["competitive", "trend", "hotspot", "summary"].forEach((scenario) => {
      this.updateScenarioStatus(scenario, "等待开始", "");
    });

    // Reset buttons
    document.getElementById("startDemo").disabled = false;
    document.getElementById("resetDemo").disabled = true;

    // Reset charts
    if (this.priceChart) {
      this.priceChart.data.datasets[0].data = [0, 0];
      this.priceChart.update();
    }

    // Clear content
    document.querySelector(".event-description").textContent = "等待AI分析...";
    document.getElementById("humanYes").textContent = "--";
    document.getElementById("humanNo").textContent = "--";
    document.getElementById("humanStake").textContent = "--";

    document.getElementById("thinkingAnimation").style.display = "flex";
    document.getElementById("analysisResult").style.display = "none";

    document.getElementById("disagreementIndicator").textContent = "";
    document.getElementById("disagreementIndicator").className =
      "disagreement-indicator";

    // Switch to first scenario
    this.switchScenario("competitive");
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Initialize demo when page loads
document.addEventListener("DOMContentLoaded", () => {
  window.ceresDemo = new CeresAIDemo();
});

// API调用扩展方法
CeresAIDemo.prototype.callAPI = async function (
  endpoint,
  method = "GET",
  data = null,
) {
  try {
    const options = {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (data && method !== "GET") {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.apiBaseUrl}${endpoint}`, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API调用失败:", error);
    throw error;
  }
};

// 检查API连接状态
CeresAIDemo.prototype.checkAPIConnection = async function () {
  try {
    const response = await this.callAPI("/status");
    return response.status === "active";
  } catch (error) {
    return false;
  }
};

// 初始化API连接
CeresAIDemo.prototype.initializeAPI = async function () {
  const isConnected = await this.checkAPIConnection();
  if (isConnected) {
    console.log("✅ API连接成功");
    this.useRealAPI = true;

    // 更新状态显示
    const statusElement = document.getElementById("aiStatusText");
    if (statusElement) {
      statusElement.textContent = "已连接API";
    }
  } else {
    console.log("⚠️ API连接失败，使用模拟模式");
    this.useRealAPI = false;

    // 更新状态显示
    const statusElement = document.getElementById("aiStatusText");
    if (statusElement) {
      statusElement.textContent = "模拟模式";
    }
  }
};

// 增强的竞争性判断方法
CeresAIDemo.prototype.runCompetitiveJudgmentEnhanced = async function () {
  this.switchScenario("competitive");
  this.updateScenarioStatus("competitive", "运行中", "running");

  // Show human event
  const humanEvent = {
    description: "全球平均温度是否会在2030年前超过工业化前水平1.5°C？",
    yes_price: 0.65,
    no_price: 0.35,
    stake: 2.5,
  };

  this.displayHumanEvent(humanEvent);
  this.showAIThinking();

  // Get AI analysis from API or simulate
  let aiResult;
  if (this.useRealAPI) {
    try {
      const response = await this.callAPI("/demo/competitive");
      if (response.success && response.ai_analysis) {
        const analysis = response.ai_analysis.competitive_judgment;
        aiResult = {
          description: analysis.description,
          yes_price: analysis.yes_price,
          no_price: analysis.no_price,
          confidence: analysis.confidence,
          reasoning: analysis.reasoning,
        };
      } else {
        throw new Error("API调用失败");
      }
    } catch (error) {
      console.warn("API调用失败，使用模拟数据:", error);
      await this.delay(3000);
      aiResult = this.simulateCompetitiveAnalysis(humanEvent);
    }
  } else {
    await this.delay(3000);
    aiResult = this.simulateCompetitiveAnalysis(humanEvent);
  }

  this.displayAIAnalysis(aiResult);
  this.updatePriceChart(humanEvent.yes_price, aiResult.yes_price);
  this.showDisagreement(humanEvent.yes_price, aiResult.yes_price);

  this.demoResults.competitive = aiResult;
  this.updateScenarioStatus("competitive", "已完成", "completed");
  this.updateEventCount();

  await this.delay(2000);
};

// 增强的趋势分析方法
CeresAIDemo.prototype.runTrendAnalysisEnhanced = async function () {
  this.switchScenario("trend");
  this.updateScenarioStatus("trend", "运行中", "running");

  const trendingMarket = {
    description: "亚太地区可再生能源采用率是否会在2025年达到40%？",
    volume: 15.5,
    participants: 8,
    volatility: 0.12,
    momentum: 0.25,
  };

  this.displayTrendingMarket(trendingMarket);
  await this.delay(2000);

  let trendAnalysis, derivatives;
  if (this.useRealAPI) {
    try {
      const response = await this.callAPI("/demo/trend");
      if (response.success && response.trend_analysis) {
        trendAnalysis = response.trend_analysis.trend_analysis;
        derivatives = response.trend_analysis.derivative_predictions || [];
      } else {
        throw new Error("API调用失败");
      }
    } catch (error) {
      console.warn("API调用失败，使用模拟数据:", error);
      trendAnalysis = this.simulateTrendAnalysis(trendingMarket);
      derivatives = this.generateDerivatives(trendingMarket);
    }
  } else {
    trendAnalysis = this.simulateTrendAnalysis(trendingMarket);
    derivatives = this.generateDerivatives(trendingMarket);
  }

  this.displayTrendAnalysis(trendAnalysis);
  this.displayDerivatives(derivatives);

  this.demoResults.trend = { analysis: trendAnalysis, derivatives };
  this.updateScenarioStatus("trend", "已完成", "completed");
  this.updateEventCount();

  await this.delay(2000);
};

// 增强的外部热点方法
CeresAIDemo.prototype.runExternalHotspotEnhanced = async function () {
  this.switchScenario("hotspot");
  this.updateScenarioStatus("hotspot", "运行中", "running");

  this.startDataSourceMonitoring();
  await this.delay(3000);

  let hotspots;
  if (this.useRealAPI) {
    try {
      const response = await this.callAPI("/demo/hotspot");
      if (response.success && response.hotspot_events) {
        hotspots = response.hotspot_events;
      } else {
        throw new Error("API调用失败");
      }
    } catch (error) {
      console.warn("API调用失败，使用模拟数据:", error);
      hotspots = this.generateHotspotEvents();
    }
  } else {
    hotspots = this.generateHotspotEvents();
  }

  this.displayHotspots(hotspots);

  this.demoResults.hotspot = hotspots;
  this.updateScenarioStatus("hotspot", "已完成", "completed");
  this.updateEventCount();

  await this.delay(2000);
};

// 修改原始的演示启动方法以使用增强版本
CeresAIDemo.prototype.startDemoEnhanced = async function () {
  if (this.isRunning) return;

  this.isRunning = true;
  this.startTime = Date.now();
  this.updateStatus("运行中", true);

  document.getElementById("startDemo").disabled = true;
  document.getElementById("resetDemo").disabled = false;

  this.startRuntimeCounter();
  this.showLoading("AI正在初始化...");

  // 初始化API连接
  await this.initializeAPI();

  try {
    // 使用增强版本的方法
    await this.runCompetitiveJudgmentEnhanced();
    await this.runTrendAnalysisEnhanced();
    await this.runExternalHotspotEnhanced();
    await this.showSummary();

    this.updateStatus("演示完成", false);
  } catch (error) {
    console.error("Demo failed:", error);
    this.updateStatus("演示失败", false);
  } finally {
    this.hideLoading();
    document.getElementById("startDemo").disabled = false;
    this.isRunning = false;
  }
};

// 页面加载完成后初始化
document.addEventListener("DOMContentLoaded", () => {
  window.ceresDemo = new CeresAIDemo();

  // 替换原始的开始演示方法
  const originalStartDemo = window.ceresDemo.startDemo;
  window.ceresDemo.startDemo = window.ceresDemo.startDemoEnhanced;

  // 初始化API连接检查
  window.ceresDemo.initializeAPI();
});
