package synchronizer

import (
	"github.com/ethereum/go-ethereum/log"

	"github.com/cpchain-network/oracle-node/store"
	"github.com/cpchain-network/oracle-node/synchronizer/contracts"
)

type EventProcess struct {
	db                *store.Storage
	log               log.Logger
	contractEventChan chan store.ContractEvent
	oracleManager     *contracts.OracleManager
	blsRegister       *contracts.BlsRegister
}

func NewEventProcess(db *store.Storage, logger log.Logger, contractEventChan chan store.ContractEvent) (*EventProcess, error) {
	oracleManager, err := contracts.NewOracleManager(logger)
	if err != nil {
		logger.Error("new oracle manager fail", "err", err)
		return nil, err
	}

	blsRegister, err := contracts.NewBlsRegister(logger)
	if err != nil {
		logger.Error("new bls register fail", "err", err)
		return nil, err
	}

	return &EventProcess{
		db:                db,
		log:               logger,
		contractEventChan: contractEventChan,
		oracleManager:     oracleManager,
		blsRegister:       blsRegister,
	}, nil
}

func (e *EventProcess) Start() error {
	for {
		select {
		case event := <-e.contractEventChan:
			e.log.Info("handle contract message", "ContractAddress", event.ContractAddress.String(), "TransactionHash", event.TransactionHash.String())
			if err := e.oracleManager.ProcessOperatorRegisteredEvent(e.db, event); err != nil {
				e.log.Error("failed to process ProcessOperatorRegisteredEvent event", "err", err)
				continue
			}
			if err := e.oracleManager.ProcessDeOperatorRegisteredEvent(e.db, event); err != nil {
				e.log.Error("failed to process ProcessDeOperatorRegisteredEvent event", "err", err)
				continue
			}
			if err := e.oracleManager.ProcessSubmitDataWithSignature(e.db, event); err != nil {
				e.log.Error("failed to process ProcessSubmitDataWithSignature event", "err", err)
				continue
			}
			if err := e.blsRegister.ProcessNewPubkeyRegistrationEvent(e.db, event); err != nil {
				e.log.Error("failed to process ProcessNewPubkeyRegistrationEvent event", "err", err)
				continue
			}
		}
	}
}
