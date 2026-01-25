package contracts

import (
	"context"
	"go.uber.org/zap"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/log"

	"github.com/cpchain-network/oracle-node/bindings/oracle"
	"github.com/cpchain-network/oracle-node/store"
)

type OracleManager struct {
	OracleManagerFilterer *oracle.OracleManagerFilterer
	OracleManagerABI      *abi.ABI
	OracleManagerCtx      context.Context
	log                   log.Logger
}

func NewOracleManager(log log.Logger) (*OracleManager, error) {
	oracleManagerAbi, err := oracle.OracleManagerMetaData.GetAbi()
	if err != nil {
		log.Error("get oracle manger metadata abi fail", zap.String("err", err.Error()))
		return nil, err
	}

	oracleManagerUnpack, err := oracle.NewOracleManagerFilterer(common.Address{}, nil)
	if err != nil {
		log.Error("new oracle manger filter fail", zap.String("err", err.Error()))
		return nil, err
	}

	return &OracleManager{
		log:                   log,
		OracleManagerFilterer: oracleManagerUnpack,
		OracleManagerABI:      oracleManagerAbi,
		OracleManagerCtx:      context.Background(),
	}, nil
}

func (om *OracleManager) ProcessSubmitDataWithSignature(db *store.Storage, event store.ContractEvent) error {
	var verifyOracleSig *store.VerifyOracleSig
	header, err := db.GetEthBlockHeader(int64(event.BlockHeight))
	if err != nil {
		om.log.Error("ProcessDelegationEvent db Blocks BlockHeader by BlockHash fail", "err", err)
		return err
	}
	if event.EventSignature.String() == om.OracleManagerABI.Events["VerifyOracleSig"].ID.String() {
		verifyOracleSigEvent, err := om.OracleManagerFilterer.ParseVerifyOracleSig(*event.RLPLog)
		if err != nil {
			om.log.Error("parse verify signature with price fail", "err", err)
			return err
		}

		log.Info("parse verify signature with price success", "MarketPrice", verifyOracleSigEvent.MarketPrice)

		verifyOracleSig = &store.VerifyOracleSig{
			BlockNumber:         header.Number,
			TxHash:              verifyOracleSigEvent.Raw.TxHash,
			ConfirmBatchId:      verifyOracleSigEvent.BatchId.Uint64(),
			TotalStaking:        verifyOracleSigEvent.TotalStaking.Uint64(),
			SignatoryRecordHash: verifyOracleSigEvent.SignatoryRecordHash,
			SymbolPrice:         verifyOracleSigEvent.MarketPrice,
			Timestamp:           verifyOracleSigEvent.Raw.BlockTimestamp,
		}
	}
	if verifyOracleSig != nil {
		if err = db.SetVerifyOracleSigEvent(*verifyOracleSig); err != nil {
			return err
		}
		om.log.Info("store verify oracle sign event success")
	}
	return nil
}

func (om *OracleManager) ProcessOperatorRegisteredEvent(db *store.Storage, event store.ContractEvent) error {
	var operatorRegistered *store.OperatorRegistered
	header, err := db.GetEthBlockHeader(int64(event.BlockHeight))
	if err != nil {
		om.log.Error("ProcessOperatorRegisteredEvent db Blocks BlockHeader by BlockHash fail", "err", err)
		return err
	}

	if event.EventSignature.String() == om.OracleManagerABI.Events["OperatorRegistered"].ID.String() {
		operatorRegisteredEvent, err := om.OracleManagerFilterer.ParseOperatorRegistered(*event.RLPLog)
		if err != nil {
			om.log.Error("parse operator registered fail", "err", err)
			return err
		}

		log.Info("parse operator registered success", "operator", operatorRegisteredEvent.Operator.String())

		operatorRegistered = &store.OperatorRegistered{
			BlockNumber: header.Number,
			TxHash:      event.TransactionHash,
			Operator:    operatorRegisteredEvent.Operator,
			NodeUrl:     operatorRegisteredEvent.NodeUrl,
			Timestamp:   event.Timestamp,
		}
	}

	if operatorRegistered != nil {
		if err = db.SetOperatorRegisteredEvent(*operatorRegistered); err != nil {
			return err
		}
		om.log.Info("store operator registered success")
	}

	return nil
}

func (om *OracleManager) ProcessDeOperatorRegisteredEvent(db *store.Storage, event store.ContractEvent) error {
	var operatorDeRegisteredDb *store.OperatorDeRegistered

	if event.EventSignature.String() == om.OracleManagerABI.Events["OperatorDeRegistered"].ID.String() {
		operatorDeRegistered, err := om.OracleManagerFilterer.ParseOperatorDeRegistered(*event.RLPLog)
		if err != nil {
			om.log.Error("parse operator deregistered fail", "err", err)
			return err
		}

		log.Info("parse operator deregistered success", "operator", operatorDeRegistered.Operator.String())

		operatorDeRegisteredDb = &store.OperatorDeRegistered{
			BlockNumber: int64(operatorDeRegistered.Raw.BlockNumber),
			TxHash:      operatorDeRegistered.Raw.TxHash,
			Operator:    operatorDeRegistered.Operator.String(),
		}
	}

	if operatorDeRegisteredDb != nil {
		if err := db.SetOperatorDeRegisteredEvent(*operatorDeRegisteredDb); err != nil {
			return err
		}
		om.log.Info("store operator deregistered success")
	}
	return nil
}
