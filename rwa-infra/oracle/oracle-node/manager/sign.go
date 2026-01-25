package manager

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"

	"github.com/cpchain-network/oracle-node/manager/types"
	"github.com/cpchain-network/oracle-node/sign"
	"github.com/cpchain-network/oracle-node/ws/server"

	tmjson "github.com/tendermint/tendermint/libs/json"
	tmtypes "github.com/tendermint/tendermint/rpc/jsonrpc/types"
)

func (m *Manager) sign(ctx types.Context, request types.RequestBody, method types.Method) (types.SignResult, error) {
	respChan := make(chan server.ResponseMsg)
	stopChan := make(chan struct{})

	if err := m.wsServer.RegisterResChannel(ctx.RequestId(), respChan, stopChan); err != nil {
		m.log.Error("failed to register response channel at signing step", "err", err)
		return types.SignResult{}, err
	}
	m.log.Info("Registered ResChannel with requestID", "requestID", ctx.RequestId())

	errSendChan := make(chan struct{})
	responseNodes := make(map[string]struct{})

	var err error
	var respNumber int
	var validSignResult types.SignResult
	var g2Point *sign.G2Point
	var g2Points []*sign.G2Point
	var g1Point *sign.G1Point
	var g1Points []*sign.G1Point
	var NonSignerPubkeys []*sign.G1Point

	// 改动：收集所有节点的价格（不做平均）
	var allPrices []float64
	var allWeights []uint64

	wg := &sync.WaitGroup{}
	wg.Add(1)
	go func() {
		cctx, cancel := context.WithTimeout(context.Background(), m.signTimeout)
		defer func() {
			m.log.Info("exit signing process")
			cancel()
			close(stopChan)
			wg.Done()
		}()
		for {
			select {
			case <-errSendChan:
				return
			case resp := <-respChan:
				m.log.Info(fmt.Sprintf("signed response: %s", resp.RpcResponse.String()), "node", resp.SourceNode)
				if !ExistsIgnoreCase(ctx.AvailableNodes(), resp.SourceNode) { // ignore the message which the sender should not be involved in approver set
					continue
				}
				respNumber++
				func() {
					defer func() {
						responseNodes[resp.SourceNode] = struct{}{}
					}()
					if resp.RpcResponse.Error != nil {
						m.log.Error("Unrecognized error code",
							"err_code", resp.RpcResponse.Error.Code,
							"err_data", resp.RpcResponse.Error.Data,
							"err_message", resp.RpcResponse.Error.Message)
						return
					} else {
						var signResponse types.SignMsgResponse
						if err = tmjson.Unmarshal(resp.RpcResponse.Result, &signResponse); err != nil {
							m.log.Error("failed to unmarshal sign response", "err", err)
							return
						}

						// 改动：使用 AssetPrice 字段
						if signResponse.AssetPrice <= 0 {
							g1Point, err = new(sign.G1Point).Deserialize(signResponse.NonSignerPubkey)
							if err != nil {
								m.log.Error("failed to deserialize g1Point", "err", err)
								return
							}
							NonSignerPubkeys = append(NonSignerPubkeys, g1Point)
							return
						} else {
							// 改动：收集单个价格到数组（不做累加）
							allPrices = append(allPrices, signResponse.AssetPrice)
							allWeights = append(allWeights, 1) // 默认权重为 1

							m.log.Info("collected price from node",
								"node", resp.SourceNode,
								"price", signResponse.AssetPrice)
						}

						dG2Point, err := g2Point.Deserialize(signResponse.G2Point)
						if err != nil {
							m.log.Error("failed to deserialize g2Point", "err", err)
							return
						}

						dSign, err := g1Point.Deserialize(signResponse.Signature)
						if err != nil {
							m.log.Error("failed to deserialize signature", "err", err)
							return
						}
						g2Points = append(g2Points, dG2Point)
						g1Points = append(g1Points, dSign)
						return
					}
				}()

			case <-cctx.Done():
				m.log.Warn("wait for signature timeout", "requestId", ctx.RequestId(), "received responses len", respNumber)
				return
			default:
				if respNumber == len(ctx.AvailableNodes()) {
					m.log.Info("received all signing responses", "requestId", ctx.RequestId(), "received responses len", respNumber)
					return
				}
			}
		}
	}()

	m.sendToNodes(ctx, request, method, errSendChan)
	wg.Wait()

	if respNumber < len(ctx.AvailableNodes())*2/3 {
		return validSignResult, errNotEnoughSignal
	}

	aSign, aG2Point := aggregateSignaturesAndG2Point(g1Points, g2Points)
	if aSign != nil {
		validSignResult = types.SignResult{
			NonSignerPubkeys: NonSignerPubkeys,
			Signature:        aSign,
			G2Point:          aG2Point,
			// 改动：存储价格数组（不是平均值）
			Prices:  allPrices,
			Weights: allWeights,
		}

		// 计算加权平均用于日志
		avgPrice := validSignResult.CalculateWeightedAverage()
		m.log.Info("collected all prices",
			"count", len(allPrices),
			"prices", allPrices,
			"weightedAverage", avgPrice)
	}
	return validSignResult, nil
}

func (m *Manager) sendToNodes(ctx types.Context, request types.RequestBody, method types.Method, errSendChan chan struct{}) {
	nodes := ctx.AvailableNodes()
	nodeRequest := types.NodeSignRequest{
		Nodes:       ctx.Approvers(),
		RequestBody: request,
	}
	requestBz, err := json.Marshal(nodeRequest)
	if err != nil {
		m.log.Error("failed to json marshal node request", "err", err)
		errSendChan <- struct{}{}
		return
	}

	rpcRequest := tmtypes.NewRPCRequest(tmtypes.JSONRPCStringID(ctx.RequestId()), method.String(), requestBz)
	for _, node := range nodes {
		go func(node string, request tmtypes.RPCRequest) {
			if err := m.wsServer.SendMsg(
				server.RequestMsg{
					RpcRequest: request,
					TargetNode: node,
				}); err != nil {
				m.log.Error("failed to send sign request to nodes", "err", err)
				errSendChan <- struct{}{}
				return
			}
		}(node, rpcRequest)
	}
}

func aggregateSignaturesAndG2Point(signatures []*sign.G1Point, points []*sign.G2Point) (*sign.G1Point, *sign.G2Point) {
	if len(signatures) == 0 {
		return nil, nil
	}
	var aggSig *sign.G1Point
	var g2Point *sign.G2Point

	for _, sig := range signatures {
		if aggSig == nil {
			aggSig = sig.Clone()
		} else {
			aggSig.Add(sig)
		}
	}

	for _, point := range points {
		if g2Point == nil {
			g2Point = point.Clone()
		} else {
			g2Point.Add(point)
		}
	}

	return aggSig, g2Point
}
