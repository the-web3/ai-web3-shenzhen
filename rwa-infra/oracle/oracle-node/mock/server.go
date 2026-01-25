package main

import (
	"encoding/json"
	"fmt"
	"math"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"
)

// Mock Server for RWA Data Sources
// 模拟各种 RWA 资产的价格数据源

type PriceResponse struct {
	Code    int       `json:"code"`
	Message string    `json:"message"`
	Data    PriceData `json:"data"`
}

type PriceData struct {
	Symbol    string  `json:"symbol"`
	Name      string  `json:"name"`
	Price     float64 `json:"price"`
	Bid       float64 `json:"bid"`
	Ask       float64 `json:"ask"`
	Change    float64 `json:"change"`
	Timestamp int64   `json:"timestamp"`
}

// 模拟资产配置
var assets = map[string]struct {
	name       string
	basePrice  float64
	volatility float64
}{
	"maotai":   {"贵州茅台", 1800.00, 50.0},     // 股票
	"gold":     {"黄金现货", 2650.00, 30.0},     // 黄金
	"oil":      {"原油期货", 78.50, 5.0},        // 原油
	"house_sz": {"深圳房价指数", 65000.00, 500.0}, // 房产
	"wine":     {"茅台酒价格", 2899.00, 100.0},   // 白酒
	"silver":   {"白银现货", 31.50, 2.0},        // 白银
	"copper":   {"铜期货", 9500.00, 200.0},     // 铜
	"btc":      {"比特币", 105000.00, 2000.0},  // 加密货币
}

func init() {
	rand.Seed(time.Now().UnixNano())
}

type cachedQuote struct {
	bucket    int64
	price     float64
	bid       float64
	ask       float64
	changePct float64
	ts        int64 // window start timestamp
}

var (
	cacheMu sync.Mutex
	cache   = map[string]cachedQuote{}
)

func envWindowSeconds() int64 {
	// Default window: 15s. This makes the demo stable while still looking "alive".
	// You can override by setting MOCK_WINDOW_SECONDS, e.g. 10/15/30.
	const def = int64(15)
	v := os.Getenv("MOCK_WINDOW_SECONDS")
	if v == "" {
		return def
	}
	n, err := strconv.ParseInt(v, 10, 64)
	if err != nil || n <= 0 {
		return def
	}
	return n
}

func roundToDecimals(x float64, decimals int) float64 {
	pow := math.Pow10(decimals)
	return math.Round(x*pow) / pow
}

func makeWindowedQuote(symbol string, assetName string, basePrice float64, volatility float64, bucket int64, windowSeconds int64) cachedQuote {
	// In demo, each symbol updates once per window, so all nodes see the same price in the same round.
	delta := (rand.Float64()*2 - 1) * volatility // [-volatility, +volatility]
	price := basePrice + delta
	if price < 0.01 {
		price = 0.01
	}
	price = roundToDecimals(price, 6)

	spread := 0.001
	bid := roundToDecimals(price-spread, 6)
	ask := roundToDecimals(price+spread, 6)

	changePct := roundToDecimals((rand.Float64()-0.5)*4, 4) // -2% ~ +2% (display only)
	ts := bucket * windowSeconds

	_ = symbol
	_ = assetName
	return cachedQuote{bucket: bucket, price: price, bid: bid, ask: ask, changePct: changePct, ts: ts}
}

func priceHandler(w http.ResponseWriter, r *http.Request) {
	symbol := r.URL.Query().Get("symbol")
	if symbol == "" {
		symbol = "maotai" // 默认茅台
	}

	asset, exists := assets[symbol]
	if !exists {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{
			"error": fmt.Sprintf("unknown symbol: %s", symbol),
		})
		return
	}

	windowSeconds := envWindowSeconds()
	now := time.Now().Unix()
	bucket := now / windowSeconds

	cacheMu.Lock()
	q, ok := cache[symbol]
	if !ok || q.bucket != bucket {
		q = makeWindowedQuote(symbol, asset.name, asset.basePrice, asset.volatility, bucket, windowSeconds)
		cache[symbol] = q
	}
	cacheMu.Unlock()

	resp := PriceResponse{
		Code:    0,
		Message: "success",
		Data: PriceData{
			Symbol:    symbol,
			Name:      asset.name,
			Price:     q.price,
			Bid:       q.bid,
			Ask:       q.ask,
			Change:    q.changePct,
			Timestamp: q.ts,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
		"time":   time.Now().Format(time.RFC3339),
	})
}

func listAssetsHandler(w http.ResponseWriter, r *http.Request) {
	type AssetInfo struct {
		Symbol    string  `json:"symbol"`
		Name      string  `json:"name"`
		BasePrice float64 `json:"base_price"`
	}

	var list []AssetInfo
	for symbol, info := range assets {
		list = append(list, AssetInfo{
			Symbol:    symbol,
			Name:      info.name,
			BasePrice: info.basePrice,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"code":   0,
		"assets": list,
	})
}

func main() {
	http.HandleFunc("/api/price", priceHandler)
	http.HandleFunc("/api/assets", listAssetsHandler)
	http.HandleFunc("/health", healthHandler)

	port := ":8888"
	windowSeconds := envWindowSeconds()
	fmt.Printf("🚀 RWA Mock Server starting on http://127.0.0.1%s\n", port)
	fmt.Printf("🕒 Price window: %ds (set env MOCK_WINDOW_SECONDS to override)\n", windowSeconds)
	fmt.Println("📊 Available endpoints:")
	fmt.Println("   GET /api/price?symbol=maotai  - 获取资产价格")
	fmt.Println("   GET /api/assets               - 列出所有资产")
	fmt.Println("   GET /health                   - 健康检查")
	fmt.Println("")
	fmt.Println("📈 Available symbols:")
	for symbol, info := range assets {
		fmt.Printf("   %-10s - %s (base: %.2f)\n", symbol, info.name, info.basePrice)
	}

	if err := http.ListenAndServe(port, nil); err != nil {
		fmt.Printf("Server failed: %v\n", err)
	}
}
