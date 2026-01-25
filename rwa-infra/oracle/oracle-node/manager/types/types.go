package types

import (
	"context"
	"math/big"

	"github.com/cpchain-network/oracle-node/sign"
)

type RequestBody struct {
	BlockNumber uint64 `json:"block_number"`
	RequestId   string `json:"request_id"`
}

type NodeSignRequest struct {
	Nodes       []string    `json:"nodes"`
	RequestBody RequestBody `json:"request_body"`
}

type SignMsgResponse struct {
	Signature       []byte  `json:"signature"`
	G2Point         []byte  `json:"g2_point"`
	NonSignerPubkey []byte  `json:"non_signer_pubkey"`
	AssetPrice      float64 `json:"asset_price"` // 改名：MarketPrice -> AssetPrice
}

// PriceSubmission 单个节点的价格提交
type PriceSubmission struct {
	NodePubKey string  `json:"node_pub_key"` // 节点公钥
	Price      float64 `json:"price"`        // 价格
	Weight     uint64  `json:"weight"`       // 权重
}

// SignResult 签名结果（包含所有节点的价格）
type SignResult struct {
	Signature        *sign.G1Point   `json:"signature"`
	G2Point          *sign.G2Point   `json:"g2_point"`
	NonSignerPubkeys []*sign.G1Point `json:"non_signer_pubkeys"`

	// 价格数组（不再是聚合后的单个值）
	Prices  []float64 `json:"prices"`  // 各节点价格
	Weights []uint64  `json:"weights"` // 各节点权重

	// 保留旧字段兼容性（deprecated）
	MarketPrice string `json:"market_price,omitempty"`
}

// ToBigIntPrices 转换为合约需要的 big.Int 格式（18位小数）
func (r *SignResult) ToBigIntPrices(decimals int) []*big.Int {
	multiplier := new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(decimals)), nil)
	result := make([]*big.Int, len(r.Prices))

	for i, price := range r.Prices {
		// 先乘以 1e6 保留精度，再转换
		priceInt := int64(price * 1e6)
		priceBig := big.NewInt(priceInt)

		// 调整到目标精度
		if decimals > 6 {
			factor := new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(decimals-6)), nil)
			priceBig.Mul(priceBig, factor)
		} else if decimals < 6 {
			factor := new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(6-decimals)), nil)
			priceBig.Div(priceBig, factor)
		}

		result[i] = priceBig
	}

	_ = multiplier // 避免未使用警告
	return result
}

// ToBigIntWeights 转换权重为 big.Int
func (r *SignResult) ToBigIntWeights() []*big.Int {
	result := make([]*big.Int, len(r.Weights))
	for i, w := range r.Weights {
		result[i] = big.NewInt(int64(w))
	}
	return result
}

// CalculateWeightedAverage 计算加权平均（用于日志/调试）
func (r *SignResult) CalculateWeightedAverage() float64 {
	if len(r.Prices) == 0 || len(r.Weights) == 0 {
		return 0
	}

	var totalPrice float64
	var totalWeight uint64

	for i := range r.Prices {
		weight := uint64(1)
		if i < len(r.Weights) {
			weight = r.Weights[i]
		}
		totalPrice += r.Prices[i] * float64(weight)
		totalWeight += weight
	}

	if totalWeight == 0 {
		return 0
	}

	return totalPrice / float64(totalWeight)
}

type Method string

const (
	NotifyNodeSubmitPriceWithSignature Method = "signMsgBatch"
)

func (m Method) String() string {
	return string(m)
}

// Context ---------------------------------------------
type Context struct {
	ctx            context.Context
	requestId      string
	availableNodes []string
	approvers      []string
	unApprovers    []string
	electionId     uint64
	stateBatchRoot [32]byte
}

func NewContext() Context {
	return Context{
		ctx: context.Background(),
	}
}

func (c Context) RequestId() string {
	return c.requestId
}

func (c Context) AvailableNodes() []string {
	return c.availableNodes
}
func (c Context) Approvers() []string {
	return c.approvers
}

func (c Context) UnApprovers() []string {
	return c.unApprovers
}

func (c Context) StateBatchRoot() [32]byte {
	return c.stateBatchRoot
}

func (c Context) WithRequestId(requestId string) Context {
	c.requestId = requestId
	return c
}

func (c Context) WithAvailableNodes(nodes []string) Context {
	c.availableNodes = nodes
	return c
}

func (c Context) WithApprovers(nodes []string) Context {
	c.approvers = nodes
	return c
}

func (c Context) WithUnApprovers(nodes []string) Context {
	c.unApprovers = nodes
	return c
}

func (c Context) WithStateBatchRoot(stateBatchRoot [32]byte) Context {
	c.stateBatchRoot = stateBatchRoot
	return c
}
