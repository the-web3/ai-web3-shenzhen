package node

import (
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/log"

	"github.com/cpchain-network/oracle-node/common/bigint"
)

type HeaderTraversal struct {
	ethClient EthClient

	latestHeader        *types.Header
	lastTraversedHeader *types.Header

	blockConfirmationDepth *big.Int
}

func NewHeaderTraversal(ethClient EthClient, fromHeader *types.Header, confDepth *big.Int) *HeaderTraversal {
	return &HeaderTraversal{
		ethClient:              ethClient,
		lastTraversedHeader:    fromHeader,
		blockConfirmationDepth: confDepth,
	}
}

func (f *HeaderTraversal) LatestHeader() *types.Header {
	return f.latestHeader
}

func (f *HeaderTraversal) LastTraversedHeader() *types.Header {
	return f.lastTraversedHeader
}

func (f *HeaderTraversal) NextHeaders(maxSize uint64) ([]types.Header, error) {
	latestHeader, err := f.ethClient.BlockHeaderByNumber(nil)
	if err != nil {
		return nil, fmt.Errorf("unable to query latest block: %w", err)
	} else if latestHeader == nil {
		return nil, fmt.Errorf("latest header unreported")
	} else {
		f.latestHeader = latestHeader
	}
	log.Info("header traversal db latest header: ", "height", latestHeader.Number)

	endHeight := new(big.Int).Sub(latestHeader.Number, f.blockConfirmationDepth)
	if endHeight.Sign() < 0 {
		// No blocks with the provided confirmation depth available
		return nil, nil
	}

	if f.lastTraversedHeader != nil {
		cmp := f.lastTraversedHeader.Number.Cmp(endHeight)
		if cmp == 0 {
			return nil, nil
		} else if cmp > 0 {
			return nil, ErrHeaderTraversalAheadOfProvider
		}
	}

	nextHeight := bigint.Zero
	if f.lastTraversedHeader != nil {
		nextHeight = new(big.Int).Add(f.lastTraversedHeader.Number, bigint.One)
	}

	endHeight = bigint.Clamp(nextHeight, endHeight, maxSize)
	headers, err := f.ethClient.BlockHeadersByRange(nextHeight, endHeight)
	if err != nil {
		return nil, fmt.Errorf("error querying blocks by range: %w", err)
	}
	if len(headers) == 0 {
		return nil, nil
	}
	numHeaders := len(headers)
	if numHeaders == 0 {
		return nil, nil
	} else if f.lastTraversedHeader != nil && headers[0].Number.Uint64() != new(big.Int).Add(f.lastTraversedHeader.Number, big.NewInt(1)).Uint64() {
		log.Error("Err header traversal and provider mismatched state", "number = ", headers[0].Number.Uint64(), "parentNumber = ", f.lastTraversedHeader.Number.Uint64())
		return nil, ErrHeaderTraversalAndProviderMismatchedState
	}
	f.lastTraversedHeader = &headers[numHeaders-1]
	return headers, nil
}

func (f *HeaderTraversal) checkHeaderListByHash(dbLatestHeader *types.Header, headerList []types.Header) error {
	if len(headerList) == 0 {
		return nil
	}
	if len(headerList) == 1 {
		return nil
	}
	// check input and db
	// input first ParentHash = dbLatestHeader.Hash
	if dbLatestHeader != nil && headerList[0].ParentHash != dbLatestHeader.Hash() {
		log.Error("check header list by hash", "parentHash = ", headerList[0].ParentHash.String(), "hash", dbLatestHeader.Hash().String())
		return ErrHeaderTraversalCheckHeaderByHashDelDbData
	}

	// check input
	for i := 1; i < len(headerList); i++ {
		if headerList[i].ParentHash != headerList[i-1].Hash() {
			return fmt.Errorf("check header list by hash: block parent hash not equal parent block hash")
		}
	}
	return nil
}

func (f *HeaderTraversal) ChangeLastTraversedHeaderByDelAfter(dbLatestHeader *types.Header) {
	f.lastTraversedHeader = dbLatestHeader
}
