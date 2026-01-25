package store

import (
	"encoding/json"

	"github.com/ethereum/go-ethereum/common"

	"github.com/cpchain-network/oracle-node/bindings/bls"
)

type NewPubkeyRegistration struct {
	BlockNumber int64            `json:"block_number"`
	TxHash      common.Hash      `json:"tx_hash"`
	Operator    common.Address   `json:"operator"`
	PubkeyG1    bls.BN254G1Point `json:"pubkey_g1"`
	PubkeyG2    bls.BN254G2Point `json:"pubkey_g2"`
	Timestamp   uint64           `json:"timestamp"`
}

func (s *Storage) SetNewPubkeyRegistrationEvent(event NewPubkeyRegistration) error {
	bz, err := json.Marshal(event)
	if err != nil {
		return err
	}
	return s.db.Put(getNewPubkeyRegistrationKey(event.TxHash.Bytes()), bz, nil)
}
