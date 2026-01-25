package contracts

import (
	"context"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/log"

	"github.com/cpchain-network/oracle-node/bindings/bls"
	"github.com/cpchain-network/oracle-node/store"
)

type BlsRegister struct {
	BlsRegisterAbi    *abi.ABI
	BlsRegisterFilter *bls.BLSApkRegistryFilterer
	BlsRegisterCtx    context.Context
	log               log.Logger
}

func NewBlsRegister(log log.Logger) (*BlsRegister, error) {
	BlsRegisterAbi, err := bls.BLSApkRegistryMetaData.GetAbi()
	if err != nil {
		log.Error("get bls register meta data abi fail", "err", err)
		return nil, err
	}

	BlsRegisterUnpack, err := bls.NewBLSApkRegistryFilterer(common.Address{}, nil)
	if err != nil {
		log.Error("new bls register fail", "err", err)
		return nil, err
	}

	return &BlsRegister{
		BlsRegisterAbi:    BlsRegisterAbi,
		BlsRegisterFilter: BlsRegisterUnpack,
		BlsRegisterCtx:    context.Background(),
		log:               log,
	}, nil
}

func (brg *BlsRegister) ProcessNewPubkeyRegistrationEvent(db *store.Storage, event store.ContractEvent) error {
	var newPubkeyRegistrationDb *store.NewPubkeyRegistration
	if event.EventSignature.String() == brg.BlsRegisterAbi.Events["NewPubkeyRegistration"].ID.String() {
		newPubkeyRegistration, err := brg.BlsRegisterFilter.ParseNewPubkeyRegistration(*event.RLPLog)
		if err != nil {
			brg.log.Error("parse new public registration fail", "err", err)
			return err
		}
		log.Info("parse operator new public registration success", "operator", newPubkeyRegistration.Operator.String())

		newPubkeyRegistrationDb = &store.NewPubkeyRegistration{
			BlockNumber: int64(newPubkeyRegistration.Raw.BlockNumber),
			TxHash:      newPubkeyRegistration.Raw.TxHash,
			Operator:    newPubkeyRegistration.Operator,
			PubkeyG1:    newPubkeyRegistration.PubkeyG1,
			PubkeyG2:    newPubkeyRegistration.PubkeyG2,
			Timestamp:   newPubkeyRegistration.Raw.BlockTimestamp,
		}
	}
	if newPubkeyRegistrationDb != nil {
		if err := db.SetNewPubkeyRegistrationEvent(*newPubkeyRegistrationDb); err != nil {
			return err
		}
		brg.log.Info("store operator add success")
	}
	return nil
}
