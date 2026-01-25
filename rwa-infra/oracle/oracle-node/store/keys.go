package store

import "encoding/binary"

var (
	MarketMessageKeyPrefix      = []byte{0x01}
	ContractEventKeyPrefix      = []byte{0x02}
	ActiveMemberKeyPrefix       = []byte{0x03}
	EthBlockHeaderKeyPrefix     = []byte{0x04}
	EthScannedHeightKeyPrefix   = []byte{0x05}
	VerifyOracleSigKeyMsgPrefix = []byte{0x06}
	VerifyOracleSigKeyPrefix    = []byte{0x07}
	NewPubkeyRegistrationfix    = []byte{0x10}
)

func getMarketPriceMessageKey(txHash []byte) []byte {
	return append(MarketMessageKeyPrefix, txHash[:]...)
}

func getContractEventKey(txHash []byte) []byte {
	return append(ContractEventKeyPrefix, txHash[:]...)
}

func getActiveMemberKey() []byte {
	return ActiveMemberKeyPrefix
}

func getEthBlockHeaderKey(number int64) []byte {
	numberBz := make([]byte, 8)
	binary.BigEndian.PutUint64(numberBz, uint64(number))
	return append(EthBlockHeaderKeyPrefix, numberBz...)
}

func getEthScannedHeightKey() []byte {
	return EthScannedHeightKeyPrefix
}

func getVerifyOracleSigMsgKey(txHash []byte) []byte {
	return append(VerifyOracleSigKeyMsgPrefix, txHash[:]...)
}

func getVerifyOracleSigKey(timestamp uint64) []byte {
	timestampBz := make([]byte, 8)
	binary.BigEndian.PutUint64(timestampBz, timestamp)
	return append(VerifyOracleSigKeyPrefix, timestampBz...)
}

func getNewPubkeyRegistrationKey(txHash []byte) []byte {
	return append(NewPubkeyRegistrationfix, txHash[:]...)
}
