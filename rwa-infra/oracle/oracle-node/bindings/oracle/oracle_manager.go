// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package oracle

import (
	"errors"
	"math/big"
	"strings"

	ethereum "github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/event"
)

// Reference imports to suppress errors if they are not otherwise used.
var (
	_ = errors.New
	_ = big.NewInt
	_ = strings.NewReader
	_ = ethereum.NotFound
	_ = bind.Bind
	_ = common.Big1
	_ = types.BloomLookup
	_ = event.NewSubscription
	_ = abi.ConvertType
)

// BN254G1Point is an auto generated low-level Go binding around an user-defined struct.
type BN254G1Point struct {
	X *big.Int
	Y *big.Int
}

// BN254G2Point is an auto generated low-level Go binding around an user-defined struct.
type BN254G2Point struct {
	X [2]*big.Int
	Y [2]*big.Int
}

// IBLSApkRegistryOracleNonSignerAndSignature is an auto generated low-level Go binding around an user-defined struct.
type IBLSApkRegistryOracleNonSignerAndSignature struct {
	NonSignerPubkeys []BN254G1Point
	ApkG2            BN254G2Point
	Sigma            BN254G1Point
	TotalStake       *big.Int
}

// IOracleManagerOracleBatch is an auto generated low-level Go binding around an user-defined struct.
type IOracleManagerOracleBatch struct {
	SymbolPrice string
	BlockHash   [32]byte
	BlockNumber *big.Int
	MsgHash     [32]byte
}

// IOracleManagerOraclePriceBatch is an auto generated low-level Go binding around an user-defined struct.
type IOracleManagerOraclePriceBatch struct {
	Prices      []*big.Int
	Weights     []*big.Int
	BlockHash   [32]byte
	BlockNumber *big.Int
	MsgHash     [32]byte
}

// OracleManagerMetaData contains all meta data concerning the OracleManager contract.
var OracleManagerMetaData = &bind.MetaData{
	ABI: "[{\"type\":\"constructor\",\"inputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"addOrRemoveOperatorWhitelist\",\"inputs\":[{\"name\":\"operator\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"isAdd\",\"type\":\"bool\",\"internalType\":\"bool\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"addOraclePodToFillWhitelist\",\"inputs\":[{\"name\":\"oraclePod\",\"type\":\"address\",\"internalType\":\"contractIOraclePod\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"aggregatorAddress\",\"inputs\":[],\"outputs\":[{\"name\":\"\",\"type\":\"address\",\"internalType\":\"address\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"blsApkRegistry\",\"inputs\":[],\"outputs\":[{\"name\":\"\",\"type\":\"address\",\"internalType\":\"contractIBLSApkRegistry\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"confirmBatchId\",\"inputs\":[],\"outputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"deRegisterOperator\",\"inputs\":[],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"fillPricesWithSignature\",\"inputs\":[{\"name\":\"oraclePod\",\"type\":\"address\",\"internalType\":\"contractIOraclePod\"},{\"name\":\"priceBatch\",\"type\":\"tuple\",\"internalType\":\"structIOracleManager.OraclePriceBatch\",\"components\":[{\"name\":\"prices\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"},{\"name\":\"weights\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"},{\"name\":\"blockHash\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"},{\"name\":\"blockNumber\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"msgHash\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"}]},{\"name\":\"oracleNonSignerAndSignature\",\"type\":\"tuple\",\"internalType\":\"structIBLSApkRegistry.OracleNonSignerAndSignature\",\"components\":[{\"name\":\"nonSignerPubkeys\",\"type\":\"tuple[]\",\"internalType\":\"structBN254.G1Point[]\",\"components\":[{\"name\":\"X\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"Y\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"name\":\"apkG2\",\"type\":\"tuple\",\"internalType\":\"structBN254.G2Point\",\"components\":[{\"name\":\"X\",\"type\":\"uint256[2]\",\"internalType\":\"uint256[2]\"},{\"name\":\"Y\",\"type\":\"uint256[2]\",\"internalType\":\"uint256[2]\"}]},{\"name\":\"sigma\",\"type\":\"tuple\",\"internalType\":\"structBN254.G1Point\",\"components\":[{\"name\":\"X\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"Y\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"name\":\"totalStake\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"fillSymbolPriceWithSignature\",\"inputs\":[{\"name\":\"oraclePod\",\"type\":\"address\",\"internalType\":\"contractIOraclePod\"},{\"name\":\"oracleBatch\",\"type\":\"tuple\",\"internalType\":\"structIOracleManager.OracleBatch\",\"components\":[{\"name\":\"symbolPrice\",\"type\":\"string\",\"internalType\":\"string\"},{\"name\":\"blockHash\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"},{\"name\":\"blockNumber\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"msgHash\",\"type\":\"bytes32\",\"internalType\":\"bytes32\"}]},{\"name\":\"oracleNonSignerAndSignature\",\"type\":\"tuple\",\"internalType\":\"structIBLSApkRegistry.OracleNonSignerAndSignature\",\"components\":[{\"name\":\"nonSignerPubkeys\",\"type\":\"tuple[]\",\"internalType\":\"structBN254.G1Point[]\",\"components\":[{\"name\":\"X\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"Y\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"name\":\"apkG2\",\"type\":\"tuple\",\"internalType\":\"structBN254.G2Point\",\"components\":[{\"name\":\"X\",\"type\":\"uint256[2]\",\"internalType\":\"uint256[2]\"},{\"name\":\"Y\",\"type\":\"uint256[2]\",\"internalType\":\"uint256[2]\"}]},{\"name\":\"sigma\",\"type\":\"tuple\",\"internalType\":\"structBN254.G1Point\",\"components\":[{\"name\":\"X\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"Y\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]},{\"name\":\"totalStake\",\"type\":\"uint256\",\"internalType\":\"uint256\"}]}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"initialize\",\"inputs\":[{\"name\":\"_initialOwner\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"_blsApkRegistry\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"_aggregatorAddress\",\"type\":\"address\",\"internalType\":\"address\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"operatorWhitelist\",\"inputs\":[{\"name\":\"\",\"type\":\"address\",\"internalType\":\"address\"}],\"outputs\":[{\"name\":\"\",\"type\":\"bool\",\"internalType\":\"bool\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"owner\",\"inputs\":[],\"outputs\":[{\"name\":\"\",\"type\":\"address\",\"internalType\":\"address\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"podIsWhitelistedForFill\",\"inputs\":[{\"name\":\"\",\"type\":\"address\",\"internalType\":\"contractIOraclePod\"}],\"outputs\":[{\"name\":\"\",\"type\":\"bool\",\"internalType\":\"bool\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"registerOperator\",\"inputs\":[{\"name\":\"nodeUrl\",\"type\":\"string\",\"internalType\":\"string\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"removeOraclePodToFillWhitelist\",\"inputs\":[{\"name\":\"oraclePod\",\"type\":\"address\",\"internalType\":\"contractIOraclePod\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"renounceOwnership\",\"inputs\":[],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"setAggregatorAddress\",\"inputs\":[{\"name\":\"_aggregatorAddress\",\"type\":\"address\",\"internalType\":\"address\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"transferOwnership\",\"inputs\":[{\"name\":\"newOwner\",\"type\":\"address\",\"internalType\":\"address\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"event\",\"name\":\"Initialized\",\"inputs\":[{\"name\":\"version\",\"type\":\"uint64\",\"indexed\":false,\"internalType\":\"uint64\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"OperatorDeRegistered\",\"inputs\":[{\"name\":\"operator\",\"type\":\"address\",\"indexed\":false,\"internalType\":\"address\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"OperatorRegistered\",\"inputs\":[{\"name\":\"operator\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"nodeUrl\",\"type\":\"string\",\"indexed\":false,\"internalType\":\"string\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"OraclePodAddedToFillWhitelist\",\"inputs\":[{\"name\":\"oralePod\",\"type\":\"address\",\"indexed\":false,\"internalType\":\"contractIOraclePod\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"OraclePodRemoveToFillWhitelist\",\"inputs\":[{\"name\":\"oralePod\",\"type\":\"address\",\"indexed\":false,\"internalType\":\"contractIOraclePod\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"OwnershipTransferred\",\"inputs\":[{\"name\":\"previousOwner\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"newOwner\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"PricesSubmitted\",\"inputs\":[{\"name\":\"batchId\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"},{\"name\":\"aggregatedPrice\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"},{\"name\":\"nodeCount\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"},{\"name\":\"signatoryRecordHash\",\"type\":\"bytes32\",\"indexed\":false,\"internalType\":\"bytes32\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"VerifyOracleSig\",\"inputs\":[{\"name\":\"batchId\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"},{\"name\":\"totalStaking\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"},{\"name\":\"signatoryRecordHash\",\"type\":\"bytes32\",\"indexed\":false,\"internalType\":\"bytes32\"},{\"name\":\"marketPrice\",\"type\":\"string\",\"indexed\":false,\"internalType\":\"string\"}],\"anonymous\":false},{\"type\":\"error\",\"name\":\"InvalidInitialization\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"NotInitializing\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"OwnableInvalidOwner\",\"inputs\":[{\"name\":\"owner\",\"type\":\"address\",\"internalType\":\"address\"}]},{\"type\":\"error\",\"name\":\"OwnableUnauthorizedAccount\",\"inputs\":[{\"name\":\"account\",\"type\":\"address\",\"internalType\":\"address\"}]}]",
	Bin: "0x608060405234801561001057600080fd5b5061001961001e565b6100d0565b7ff0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a00805468010000000000000000900460ff161561006e5760405163f92ee8a960e01b815260040160405180910390fd5b80546001600160401b03908116146100cd5780546001600160401b0319166001600160401b0390811782556040519081527fc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d29060200160405180910390a15b50565b611778806100df6000396000f3fe608060405234801561001057600080fd5b506004361061010b5760003560e01c80638c76d2bd116100a2578063bc5db18e11610071578063bc5db18e1461023e578063c0c53b8b14610251578063e03c863214610264578063f2fde38b14610287578063fa5db51b1461029a57600080fd5b80638c76d2bd146101dc5780638da5cb5b146101f3578063a2a2111614610223578063b9a0634d1461023657600080fd5b806347b32448116100de57806347b324481461019b5780635df45946146101ae578063715018a6146101c15780637943b99f146101c957600080fd5b8063097c4af11461011057806310659b7b14610125578063380bbe53146101385780633fd407d414610168575b600080fd5b61012361011e366004610eff565b6102ad565b005b6101236101333660046111c5565b6103c6565b60025461014b906001600160a01b031681565b6040516001600160a01b0390911681526020015b60405180910390f35b61018b610176366004611243565b60036020526000908152604090205460ff1681565b604051901515815260200161015f565b6101236101a9366004611243565b610682565b60005461014b906001600160a01b031681565b610123610702565b6101236101d7366004611243565b610716565b6101e560015481565b60405190815260200161015f565b7f9016d09d72d40fdae2fd8ceac6b6234c7706214fd39c1cd1e609a0528c199300546001600160a01b031661014b565b610123610231366004611243565b61079b565b610123610816565b61012361024c366004611267565b61091b565b61012361025f3660046112b8565b610aeb565b61018b610272366004611243565b60046020526000908152604090205460ff1681565b610123610295366004611243565b610c18565b6101236102a8366004611303565b610c56565b3360009081526004602052604090205460ff166103225760405162461bcd60e51b815260206004820152602860248201527f4f7261636c654d616e616765723a206e6f207065726d697373696f6e20746f206044820152673932b3b4b9ba32b960c11b60648201526084015b60405180910390fd5b6000546040516303682a4560e41b81523360048201526001600160a01b0390911690633682a45090602401600060405180830381600087803b15801561036757600080fd5b505af115801561037b573d6000803e3d6000fd5b50505050336001600160a01b03167f11a85ea4a40584362c3d9c17685709a2e02b466ac78d5eb00b6aff73d90f580583836040516103ba929190611341565b60405180910390a25050565b6002546001600160a01b031633146103f05760405162461bcd60e51b815260040161031990611370565b6001600160a01b038316600090815260036020526040902054839060ff1661042a5760405162461bcd60e51b8152600401610319906113b9565b60006104368480611401565b9050116104855760405162461bcd60e51b815260206004820152601b60248201527f4f7261636c654d616e616765723a20656d7074792070726963657300000000006044820152606401610319565b6104926020840184611401565b905061049e8480611401565b9050146104ed5760405162461bcd60e51b815260206004820152601e60248201527f4f7261636c654d616e616765723a206c656e677468206d69736d6174636800006044820152606401610319565b6000805460405163063dfbcb60e21b815282916001600160a01b0316906318f7ef2c9061052a9060808901359060608a013590899060040161149d565b6040805180830381865afa158015610546573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061056a919061155a565b9092509050600061059061057e8780611401565b61058b60208a018a611401565b610d01565b90506001600160a01b0387166304e93f6e6105ab8880611401565b6105b860208b018b611401565b6040518563ffffffff1660e01b81526004016105d794939291906115b0565b600060405180830381600087803b1580156105f157600080fd5b505af1158015610605573d6000803e3d6000fd5b5050600180547fbc192003fc5fd7ea4fcc4efea093a25e49bc8529fcf435c1e423118c5e5f221593509150600061063b836115f8565b909155508261064a8980611401565b60405161067194939250879093845260208401929092526040830152606082015260800190565b60405180910390a150505050505050565b61068a610db0565b6001600160a01b0381166106e05760405162461bcd60e51b815260206004820152601b60248201527f4f7261636c654d616e616765723a207a65726f206164647265737300000000006044820152606401610319565b600280546001600160a01b0319166001600160a01b0392909216919091179055565b61070a610db0565b6107146000610e0b565b565b6002546001600160a01b031633146107405760405162461bcd60e51b815260040161031990611370565b6001600160a01b038116600081815260036020908152604091829020805460ff1916600117905590519182527f7da7409f8db3ec60d78c584483d3becc82a2c4891002c9eb6d4d41f2983f46f391015b60405180910390a150565b6002546001600160a01b031633146107c55760405162461bcd60e51b815260040161031990611370565b6001600160a01b038116600081815260036020908152604091829020805460ff1916905590519182527f760913fd095411dc9e223313517b8b336ac92746a9efaf1760ce1b4590bb45b99101610790565b3360009081526004602052604090205460ff166108885760405162461bcd60e51b815260206004820152602a60248201527f4f7261636c654d616e616765723a206e6f207065726d697373696f6e20746f206044820152693232b932b3b4b9ba32b960b11b6064820152608401610319565b600054604051636c67cc6560e11b81523360048201526001600160a01b039091169063d8cf98ca90602401600060405180830381600087803b1580156108cd57600080fd5b505af11580156108e1573d6000803e3d6000fd5b50506040513381527fb2c38c6252ee2d17f80059fb47a790e20f7bd75e7ba577685375e5484f412d739250602001905060405180910390a1565b6002546001600160a01b031633146109455760405162461bcd60e51b815260040161031990611370565b6001600160a01b038316600090815260036020526040902054839060ff1661097f5760405162461bcd60e51b8152600401610319906113b9565b600080546040805163063dfbcb60e21b815283926001600160a01b0316916318f7ef2c916109bc9160608a013591908a013590899060040161149d565b6040805180830381865afa1580156109d8573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906109fc919061155a565b90925090506000610a0d8680611611565b8080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525050604051630a2ee61b60e21b8152929350506001600160a01b038916916328bb986c9150610a7090849060040161169e565b600060405180830381600087803b158015610a8a57600080fd5b505af1158015610a9e573d6000803e3d6000fd5b5050600180547f2f8b976598490503c5965cf40bc6629717a2aa0b1c5be9b4b4d6570a9dc6a80e935091506000610ad4836115f8565b9190505584848460405161067194939291906116b1565b6000610af5610e7c565b805490915060ff600160401b820416159067ffffffffffffffff16600081158015610b1d5750825b905060008267ffffffffffffffff166001148015610b3a5750303b155b905081158015610b48575080155b15610b665760405163f92ee8a960e01b815260040160405180910390fd5b845467ffffffffffffffff191660011785558315610b9057845460ff60401b1916600160401b1785555b610b9988610ea7565b600080546001600160a01b03808a166001600160a01b031992831617835560028054918a16919092161790556001558315610c0e57845460ff60401b19168555604051600181527fc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d29060200160405180910390a15b5050505050505050565b610c20610db0565b6001600160a01b038116610c4a57604051631e4fbdf760e01b815260006004820152602401610319565b610c5381610e0b565b50565b6002546001600160a01b03163314610c805760405162461bcd60e51b815260040161031990611370565b6001600160a01b038216610cd65760405162461bcd60e51b815260206004820152601b60248201527f4f7261636c654d616e616765723a207a65726f206164647265737300000000006044820152606401610319565b6001600160a01b03919091166000908152600460205260409020805460ff1916911515919091179055565b60008080805b86811015610d8557858582818110610d2157610d216116e0565b90506020020135888883818110610d3a57610d3a6116e0565b90506020020135610d4b91906116f6565b610d55908461170d565b9250858582818110610d6957610d696116e0565b9050602002013582610d7b919061170d565b9150600101610d07565b5080600003610d9957600092505050610da8565b610da38183611720565b925050505b949350505050565b33610de27f9016d09d72d40fdae2fd8ceac6b6234c7706214fd39c1cd1e609a0528c199300546001600160a01b031690565b6001600160a01b0316146107145760405163118cdaa760e01b8152336004820152602401610319565b7f9016d09d72d40fdae2fd8ceac6b6234c7706214fd39c1cd1e609a0528c19930080546001600160a01b031981166001600160a01b03848116918217845560405192169182907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a3505050565b6000807ff0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a005b92915050565b610eaf610eb8565b610c5381610edd565b610ec0610ee5565b61071457604051631afcd79f60e31b815260040160405180910390fd5b610c20610eb8565b6000610eef610e7c565b54600160401b900460ff16919050565b60008060208385031215610f1257600080fd5b823567ffffffffffffffff80821115610f2a57600080fd5b818501915085601f830112610f3e57600080fd5b813581811115610f4d57600080fd5b866020828501011115610f5f57600080fd5b60209290920196919550909350505050565b6001600160a01b0381168114610c5357600080fd5b634e487b7160e01b600052604160045260246000fd5b6040805190810167ffffffffffffffff81118282101715610fbf57610fbf610f86565b60405290565b6040516080810167ffffffffffffffff81118282101715610fbf57610fbf610f86565b604051601f8201601f1916810167ffffffffffffffff8111828210171561101157611011610f86565b604052919050565b60006040828403121561102b57600080fd5b611033610f9c565b9050813581526020820135602082015292915050565b600082601f83011261105a57600080fd5b611062610f9c565b80604084018581111561107457600080fd5b845b8181101561108e578035845260209384019301611076565b509095945050505050565b6000608082840312156110ab57600080fd5b6110b3610f9c565b90506110bf8383611049565b81526110ce8360408401611049565b602082015292915050565b600061010082840312156110ec57600080fd5b6110f4610fc5565b9050813567ffffffffffffffff8082111561110e57600080fd5b818401915084601f83011261112257600080fd5b813560208282111561113657611136610f86565b611144818360051b01610fe8565b828152818101935060069290921b84018101918783111561116457600080fd5b938101935b8285101561118d5761117b8886611019565b84528184019350604085019450611169565b855261119b87878301611099565b81860152505050506111b08360a08401611019565b604082015260e0820135606082015292915050565b6000806000606084860312156111da57600080fd5b83356111e581610f71565b9250602084013567ffffffffffffffff8082111561120257600080fd5b9085019060a0828803121561121657600080fd5b9092506040850135908082111561122c57600080fd5b50611239868287016110d9565b9150509250925092565b60006020828403121561125557600080fd5b813561126081610f71565b9392505050565b60008060006060848603121561127c57600080fd5b833561128781610f71565b9250602084013567ffffffffffffffff808211156112a457600080fd5b908501906080828803121561121657600080fd5b6000806000606084860312156112cd57600080fd5b83356112d881610f71565b925060208401356112e881610f71565b915060408401356112f881610f71565b809150509250925092565b6000806040838503121561131657600080fd5b823561132181610f71565b91506020830135801515811461133657600080fd5b809150509250929050565b60208152816020820152818360408301376000818301604090810191909152601f909201601f19160101919050565b60208082526029908201527f4f7261636c654d616e616765723a206e6f74207468652061676772656761746f60408201526872206164647265737360b81b606082015260800190565b60208082526028908201527f4f7261636c654d616e616765723a206f7261636c65506f64206e6f74207768696040820152671d195b1a5cdd195960c21b606082015260800190565b6000808335601e1984360301811261141857600080fd5b83018035915067ffffffffffffffff82111561143357600080fd5b6020019150600581901b360382131561144b57600080fd5b9250929050565b8060005b6002811015611475578151845260209384019390910190600101611456565b50505050565b611486828251611452565b60208101516114986040840182611452565b505050565b838152600060208460208401526040606060408501526101608401855161010080606088015282825180855261018089019150602084019450600093505b8084101561150c576114f882865180518252602090810151910152565b9386019360019390930192908501906114db565b5060208901519550611521608089018761147b565b6040890151955061153e8289018780518252602090810151910152565b6060890151610140890152809650505050505050949350505050565b6000806040838503121561156d57600080fd5b505080516020909101519092909150565b81835260006001600160fb1b0383111561159757600080fd5b8260051b80836020870137939093016020019392505050565b6040815260006115c460408301868861157e565b82810360208401526115d781858761157e565b979650505050505050565b634e487b7160e01b600052601160045260246000fd5b60006001820161160a5761160a6115e2565b5060010190565b6000808335601e1984360301811261162857600080fd5b83018035915067ffffffffffffffff82111561164357600080fd5b60200191503681900382131561144b57600080fd5b6000815180845260005b8181101561167e57602081850181015186830182015201611662565b506000602082860101526020601f19601f83011685010191505092915050565b6020815260006112606020830184611658565b8481528360208201528260408201526080606082015260006116d66080830184611658565b9695505050505050565b634e487b7160e01b600052603260045260246000fd5b8082028115828204841417610ea157610ea16115e2565b80820180821115610ea157610ea16115e2565b60008261173d57634e487b7160e01b600052601260045260246000fd5b50049056fea26469706673582212207bbe32c6c458a5d0f50e7779788c9b7a2e5783a901f539d8721ab1a210a9ec4364736f6c63430008160033",
}

// OracleManagerABI is the input ABI used to generate the binding from.
// Deprecated: Use OracleManagerMetaData.ABI instead.
var OracleManagerABI = OracleManagerMetaData.ABI

// OracleManagerBin is the compiled bytecode used for deploying new contracts.
// Deprecated: Use OracleManagerMetaData.Bin instead.
var OracleManagerBin = OracleManagerMetaData.Bin

// DeployOracleManager deploys a new Ethereum contract, binding an instance of OracleManager to it.
func DeployOracleManager(auth *bind.TransactOpts, backend bind.ContractBackend) (common.Address, *types.Transaction, *OracleManager, error) {
	parsed, err := OracleManagerMetaData.GetAbi()
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	if parsed == nil {
		return common.Address{}, nil, nil, errors.New("GetABI returned nil")
	}

	address, tx, contract, err := bind.DeployContract(auth, *parsed, common.FromHex(OracleManagerBin), backend)
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	return address, tx, &OracleManager{OracleManagerCaller: OracleManagerCaller{contract: contract}, OracleManagerTransactor: OracleManagerTransactor{contract: contract}, OracleManagerFilterer: OracleManagerFilterer{contract: contract}}, nil
}

// OracleManager is an auto generated Go binding around an Ethereum contract.
type OracleManager struct {
	OracleManagerCaller     // Read-only binding to the contract
	OracleManagerTransactor // Write-only binding to the contract
	OracleManagerFilterer   // Log filterer for contract events
}

// OracleManagerCaller is an auto generated read-only Go binding around an Ethereum contract.
type OracleManagerCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// OracleManagerTransactor is an auto generated write-only Go binding around an Ethereum contract.
type OracleManagerTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// OracleManagerFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type OracleManagerFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// OracleManagerSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type OracleManagerSession struct {
	Contract     *OracleManager    // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// OracleManagerCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type OracleManagerCallerSession struct {
	Contract *OracleManagerCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts        // Call options to use throughout this session
}

// OracleManagerTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type OracleManagerTransactorSession struct {
	Contract     *OracleManagerTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts        // Transaction auth options to use throughout this session
}

// OracleManagerRaw is an auto generated low-level Go binding around an Ethereum contract.
type OracleManagerRaw struct {
	Contract *OracleManager // Generic contract binding to access the raw methods on
}

// OracleManagerCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type OracleManagerCallerRaw struct {
	Contract *OracleManagerCaller // Generic read-only contract binding to access the raw methods on
}

// OracleManagerTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type OracleManagerTransactorRaw struct {
	Contract *OracleManagerTransactor // Generic write-only contract binding to access the raw methods on
}

// NewOracleManager creates a new instance of OracleManager, bound to a specific deployed contract.
func NewOracleManager(address common.Address, backend bind.ContractBackend) (*OracleManager, error) {
	contract, err := bindOracleManager(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &OracleManager{OracleManagerCaller: OracleManagerCaller{contract: contract}, OracleManagerTransactor: OracleManagerTransactor{contract: contract}, OracleManagerFilterer: OracleManagerFilterer{contract: contract}}, nil
}

// NewOracleManagerCaller creates a new read-only instance of OracleManager, bound to a specific deployed contract.
func NewOracleManagerCaller(address common.Address, caller bind.ContractCaller) (*OracleManagerCaller, error) {
	contract, err := bindOracleManager(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &OracleManagerCaller{contract: contract}, nil
}

// NewOracleManagerTransactor creates a new write-only instance of OracleManager, bound to a specific deployed contract.
func NewOracleManagerTransactor(address common.Address, transactor bind.ContractTransactor) (*OracleManagerTransactor, error) {
	contract, err := bindOracleManager(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &OracleManagerTransactor{contract: contract}, nil
}

// NewOracleManagerFilterer creates a new log filterer instance of OracleManager, bound to a specific deployed contract.
func NewOracleManagerFilterer(address common.Address, filterer bind.ContractFilterer) (*OracleManagerFilterer, error) {
	contract, err := bindOracleManager(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &OracleManagerFilterer{contract: contract}, nil
}

// bindOracleManager binds a generic wrapper to an already deployed contract.
func bindOracleManager(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := OracleManagerMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_OracleManager *OracleManagerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _OracleManager.Contract.OracleManagerCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_OracleManager *OracleManagerRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _OracleManager.Contract.OracleManagerTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_OracleManager *OracleManagerRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _OracleManager.Contract.OracleManagerTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_OracleManager *OracleManagerCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _OracleManager.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_OracleManager *OracleManagerTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _OracleManager.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_OracleManager *OracleManagerTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _OracleManager.Contract.contract.Transact(opts, method, params...)
}

// AggregatorAddress is a free data retrieval call binding the contract method 0x380bbe53.
//
// Solidity: function aggregatorAddress() view returns(address)
func (_OracleManager *OracleManagerCaller) AggregatorAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _OracleManager.contract.Call(opts, &out, "aggregatorAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// AggregatorAddress is a free data retrieval call binding the contract method 0x380bbe53.
//
// Solidity: function aggregatorAddress() view returns(address)
func (_OracleManager *OracleManagerSession) AggregatorAddress() (common.Address, error) {
	return _OracleManager.Contract.AggregatorAddress(&_OracleManager.CallOpts)
}

// AggregatorAddress is a free data retrieval call binding the contract method 0x380bbe53.
//
// Solidity: function aggregatorAddress() view returns(address)
func (_OracleManager *OracleManagerCallerSession) AggregatorAddress() (common.Address, error) {
	return _OracleManager.Contract.AggregatorAddress(&_OracleManager.CallOpts)
}

// BlsApkRegistry is a free data retrieval call binding the contract method 0x5df45946.
//
// Solidity: function blsApkRegistry() view returns(address)
func (_OracleManager *OracleManagerCaller) BlsApkRegistry(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _OracleManager.contract.Call(opts, &out, "blsApkRegistry")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// BlsApkRegistry is a free data retrieval call binding the contract method 0x5df45946.
//
// Solidity: function blsApkRegistry() view returns(address)
func (_OracleManager *OracleManagerSession) BlsApkRegistry() (common.Address, error) {
	return _OracleManager.Contract.BlsApkRegistry(&_OracleManager.CallOpts)
}

// BlsApkRegistry is a free data retrieval call binding the contract method 0x5df45946.
//
// Solidity: function blsApkRegistry() view returns(address)
func (_OracleManager *OracleManagerCallerSession) BlsApkRegistry() (common.Address, error) {
	return _OracleManager.Contract.BlsApkRegistry(&_OracleManager.CallOpts)
}

// ConfirmBatchId is a free data retrieval call binding the contract method 0x8c76d2bd.
//
// Solidity: function confirmBatchId() view returns(uint256)
func (_OracleManager *OracleManagerCaller) ConfirmBatchId(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _OracleManager.contract.Call(opts, &out, "confirmBatchId")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// ConfirmBatchId is a free data retrieval call binding the contract method 0x8c76d2bd.
//
// Solidity: function confirmBatchId() view returns(uint256)
func (_OracleManager *OracleManagerSession) ConfirmBatchId() (*big.Int, error) {
	return _OracleManager.Contract.ConfirmBatchId(&_OracleManager.CallOpts)
}

// ConfirmBatchId is a free data retrieval call binding the contract method 0x8c76d2bd.
//
// Solidity: function confirmBatchId() view returns(uint256)
func (_OracleManager *OracleManagerCallerSession) ConfirmBatchId() (*big.Int, error) {
	return _OracleManager.Contract.ConfirmBatchId(&_OracleManager.CallOpts)
}

// OperatorWhitelist is a free data retrieval call binding the contract method 0xe03c8632.
//
// Solidity: function operatorWhitelist(address ) view returns(bool)
func (_OracleManager *OracleManagerCaller) OperatorWhitelist(opts *bind.CallOpts, arg0 common.Address) (bool, error) {
	var out []interface{}
	err := _OracleManager.contract.Call(opts, &out, "operatorWhitelist", arg0)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// OperatorWhitelist is a free data retrieval call binding the contract method 0xe03c8632.
//
// Solidity: function operatorWhitelist(address ) view returns(bool)
func (_OracleManager *OracleManagerSession) OperatorWhitelist(arg0 common.Address) (bool, error) {
	return _OracleManager.Contract.OperatorWhitelist(&_OracleManager.CallOpts, arg0)
}

// OperatorWhitelist is a free data retrieval call binding the contract method 0xe03c8632.
//
// Solidity: function operatorWhitelist(address ) view returns(bool)
func (_OracleManager *OracleManagerCallerSession) OperatorWhitelist(arg0 common.Address) (bool, error) {
	return _OracleManager.Contract.OperatorWhitelist(&_OracleManager.CallOpts, arg0)
}

// Owner is a free data retrieval call binding the contract method 0x8da5cb5b.
//
// Solidity: function owner() view returns(address)
func (_OracleManager *OracleManagerCaller) Owner(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _OracleManager.contract.Call(opts, &out, "owner")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// Owner is a free data retrieval call binding the contract method 0x8da5cb5b.
//
// Solidity: function owner() view returns(address)
func (_OracleManager *OracleManagerSession) Owner() (common.Address, error) {
	return _OracleManager.Contract.Owner(&_OracleManager.CallOpts)
}

// Owner is a free data retrieval call binding the contract method 0x8da5cb5b.
//
// Solidity: function owner() view returns(address)
func (_OracleManager *OracleManagerCallerSession) Owner() (common.Address, error) {
	return _OracleManager.Contract.Owner(&_OracleManager.CallOpts)
}

// PodIsWhitelistedForFill is a free data retrieval call binding the contract method 0x3fd407d4.
//
// Solidity: function podIsWhitelistedForFill(address ) view returns(bool)
func (_OracleManager *OracleManagerCaller) PodIsWhitelistedForFill(opts *bind.CallOpts, arg0 common.Address) (bool, error) {
	var out []interface{}
	err := _OracleManager.contract.Call(opts, &out, "podIsWhitelistedForFill", arg0)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// PodIsWhitelistedForFill is a free data retrieval call binding the contract method 0x3fd407d4.
//
// Solidity: function podIsWhitelistedForFill(address ) view returns(bool)
func (_OracleManager *OracleManagerSession) PodIsWhitelistedForFill(arg0 common.Address) (bool, error) {
	return _OracleManager.Contract.PodIsWhitelistedForFill(&_OracleManager.CallOpts, arg0)
}

// PodIsWhitelistedForFill is a free data retrieval call binding the contract method 0x3fd407d4.
//
// Solidity: function podIsWhitelistedForFill(address ) view returns(bool)
func (_OracleManager *OracleManagerCallerSession) PodIsWhitelistedForFill(arg0 common.Address) (bool, error) {
	return _OracleManager.Contract.PodIsWhitelistedForFill(&_OracleManager.CallOpts, arg0)
}

// AddOrRemoveOperatorWhitelist is a paid mutator transaction binding the contract method 0xfa5db51b.
//
// Solidity: function addOrRemoveOperatorWhitelist(address operator, bool isAdd) returns()
func (_OracleManager *OracleManagerTransactor) AddOrRemoveOperatorWhitelist(opts *bind.TransactOpts, operator common.Address, isAdd bool) (*types.Transaction, error) {
	return _OracleManager.contract.Transact(opts, "addOrRemoveOperatorWhitelist", operator, isAdd)
}

// AddOrRemoveOperatorWhitelist is a paid mutator transaction binding the contract method 0xfa5db51b.
//
// Solidity: function addOrRemoveOperatorWhitelist(address operator, bool isAdd) returns()
func (_OracleManager *OracleManagerSession) AddOrRemoveOperatorWhitelist(operator common.Address, isAdd bool) (*types.Transaction, error) {
	return _OracleManager.Contract.AddOrRemoveOperatorWhitelist(&_OracleManager.TransactOpts, operator, isAdd)
}

// AddOrRemoveOperatorWhitelist is a paid mutator transaction binding the contract method 0xfa5db51b.
//
// Solidity: function addOrRemoveOperatorWhitelist(address operator, bool isAdd) returns()
func (_OracleManager *OracleManagerTransactorSession) AddOrRemoveOperatorWhitelist(operator common.Address, isAdd bool) (*types.Transaction, error) {
	return _OracleManager.Contract.AddOrRemoveOperatorWhitelist(&_OracleManager.TransactOpts, operator, isAdd)
}

// AddOraclePodToFillWhitelist is a paid mutator transaction binding the contract method 0x7943b99f.
//
// Solidity: function addOraclePodToFillWhitelist(address oraclePod) returns()
func (_OracleManager *OracleManagerTransactor) AddOraclePodToFillWhitelist(opts *bind.TransactOpts, oraclePod common.Address) (*types.Transaction, error) {
	return _OracleManager.contract.Transact(opts, "addOraclePodToFillWhitelist", oraclePod)
}

// AddOraclePodToFillWhitelist is a paid mutator transaction binding the contract method 0x7943b99f.
//
// Solidity: function addOraclePodToFillWhitelist(address oraclePod) returns()
func (_OracleManager *OracleManagerSession) AddOraclePodToFillWhitelist(oraclePod common.Address) (*types.Transaction, error) {
	return _OracleManager.Contract.AddOraclePodToFillWhitelist(&_OracleManager.TransactOpts, oraclePod)
}

// AddOraclePodToFillWhitelist is a paid mutator transaction binding the contract method 0x7943b99f.
//
// Solidity: function addOraclePodToFillWhitelist(address oraclePod) returns()
func (_OracleManager *OracleManagerTransactorSession) AddOraclePodToFillWhitelist(oraclePod common.Address) (*types.Transaction, error) {
	return _OracleManager.Contract.AddOraclePodToFillWhitelist(&_OracleManager.TransactOpts, oraclePod)
}

// DeRegisterOperator is a paid mutator transaction binding the contract method 0xb9a0634d.
//
// Solidity: function deRegisterOperator() returns()
func (_OracleManager *OracleManagerTransactor) DeRegisterOperator(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _OracleManager.contract.Transact(opts, "deRegisterOperator")
}

// DeRegisterOperator is a paid mutator transaction binding the contract method 0xb9a0634d.
//
// Solidity: function deRegisterOperator() returns()
func (_OracleManager *OracleManagerSession) DeRegisterOperator() (*types.Transaction, error) {
	return _OracleManager.Contract.DeRegisterOperator(&_OracleManager.TransactOpts)
}

// DeRegisterOperator is a paid mutator transaction binding the contract method 0xb9a0634d.
//
// Solidity: function deRegisterOperator() returns()
func (_OracleManager *OracleManagerTransactorSession) DeRegisterOperator() (*types.Transaction, error) {
	return _OracleManager.Contract.DeRegisterOperator(&_OracleManager.TransactOpts)
}

// FillPricesWithSignature is a paid mutator transaction binding the contract method 0x10659b7b.
//
// Solidity: function fillPricesWithSignature(address oraclePod, (uint256[],uint256[],bytes32,uint256,bytes32) priceBatch, ((uint256,uint256)[],(uint256[2],uint256[2]),(uint256,uint256),uint256) oracleNonSignerAndSignature) returns()
func (_OracleManager *OracleManagerTransactor) FillPricesWithSignature(opts *bind.TransactOpts, oraclePod common.Address, priceBatch IOracleManagerOraclePriceBatch, oracleNonSignerAndSignature IBLSApkRegistryOracleNonSignerAndSignature) (*types.Transaction, error) {
	return _OracleManager.contract.Transact(opts, "fillPricesWithSignature", oraclePod, priceBatch, oracleNonSignerAndSignature)
}

// FillPricesWithSignature is a paid mutator transaction binding the contract method 0x10659b7b.
//
// Solidity: function fillPricesWithSignature(address oraclePod, (uint256[],uint256[],bytes32,uint256,bytes32) priceBatch, ((uint256,uint256)[],(uint256[2],uint256[2]),(uint256,uint256),uint256) oracleNonSignerAndSignature) returns()
func (_OracleManager *OracleManagerSession) FillPricesWithSignature(oraclePod common.Address, priceBatch IOracleManagerOraclePriceBatch, oracleNonSignerAndSignature IBLSApkRegistryOracleNonSignerAndSignature) (*types.Transaction, error) {
	return _OracleManager.Contract.FillPricesWithSignature(&_OracleManager.TransactOpts, oraclePod, priceBatch, oracleNonSignerAndSignature)
}

// FillPricesWithSignature is a paid mutator transaction binding the contract method 0x10659b7b.
//
// Solidity: function fillPricesWithSignature(address oraclePod, (uint256[],uint256[],bytes32,uint256,bytes32) priceBatch, ((uint256,uint256)[],(uint256[2],uint256[2]),(uint256,uint256),uint256) oracleNonSignerAndSignature) returns()
func (_OracleManager *OracleManagerTransactorSession) FillPricesWithSignature(oraclePod common.Address, priceBatch IOracleManagerOraclePriceBatch, oracleNonSignerAndSignature IBLSApkRegistryOracleNonSignerAndSignature) (*types.Transaction, error) {
	return _OracleManager.Contract.FillPricesWithSignature(&_OracleManager.TransactOpts, oraclePod, priceBatch, oracleNonSignerAndSignature)
}

// FillSymbolPriceWithSignature is a paid mutator transaction binding the contract method 0xbc5db18e.
//
// Solidity: function fillSymbolPriceWithSignature(address oraclePod, (string,bytes32,uint256,bytes32) oracleBatch, ((uint256,uint256)[],(uint256[2],uint256[2]),(uint256,uint256),uint256) oracleNonSignerAndSignature) returns()
func (_OracleManager *OracleManagerTransactor) FillSymbolPriceWithSignature(opts *bind.TransactOpts, oraclePod common.Address, oracleBatch IOracleManagerOracleBatch, oracleNonSignerAndSignature IBLSApkRegistryOracleNonSignerAndSignature) (*types.Transaction, error) {
	return _OracleManager.contract.Transact(opts, "fillSymbolPriceWithSignature", oraclePod, oracleBatch, oracleNonSignerAndSignature)
}

// FillSymbolPriceWithSignature is a paid mutator transaction binding the contract method 0xbc5db18e.
//
// Solidity: function fillSymbolPriceWithSignature(address oraclePod, (string,bytes32,uint256,bytes32) oracleBatch, ((uint256,uint256)[],(uint256[2],uint256[2]),(uint256,uint256),uint256) oracleNonSignerAndSignature) returns()
func (_OracleManager *OracleManagerSession) FillSymbolPriceWithSignature(oraclePod common.Address, oracleBatch IOracleManagerOracleBatch, oracleNonSignerAndSignature IBLSApkRegistryOracleNonSignerAndSignature) (*types.Transaction, error) {
	return _OracleManager.Contract.FillSymbolPriceWithSignature(&_OracleManager.TransactOpts, oraclePod, oracleBatch, oracleNonSignerAndSignature)
}

// FillSymbolPriceWithSignature is a paid mutator transaction binding the contract method 0xbc5db18e.
//
// Solidity: function fillSymbolPriceWithSignature(address oraclePod, (string,bytes32,uint256,bytes32) oracleBatch, ((uint256,uint256)[],(uint256[2],uint256[2]),(uint256,uint256),uint256) oracleNonSignerAndSignature) returns()
func (_OracleManager *OracleManagerTransactorSession) FillSymbolPriceWithSignature(oraclePod common.Address, oracleBatch IOracleManagerOracleBatch, oracleNonSignerAndSignature IBLSApkRegistryOracleNonSignerAndSignature) (*types.Transaction, error) {
	return _OracleManager.Contract.FillSymbolPriceWithSignature(&_OracleManager.TransactOpts, oraclePod, oracleBatch, oracleNonSignerAndSignature)
}

// Initialize is a paid mutator transaction binding the contract method 0xc0c53b8b.
//
// Solidity: function initialize(address _initialOwner, address _blsApkRegistry, address _aggregatorAddress) returns()
func (_OracleManager *OracleManagerTransactor) Initialize(opts *bind.TransactOpts, _initialOwner common.Address, _blsApkRegistry common.Address, _aggregatorAddress common.Address) (*types.Transaction, error) {
	return _OracleManager.contract.Transact(opts, "initialize", _initialOwner, _blsApkRegistry, _aggregatorAddress)
}

// Initialize is a paid mutator transaction binding the contract method 0xc0c53b8b.
//
// Solidity: function initialize(address _initialOwner, address _blsApkRegistry, address _aggregatorAddress) returns()
func (_OracleManager *OracleManagerSession) Initialize(_initialOwner common.Address, _blsApkRegistry common.Address, _aggregatorAddress common.Address) (*types.Transaction, error) {
	return _OracleManager.Contract.Initialize(&_OracleManager.TransactOpts, _initialOwner, _blsApkRegistry, _aggregatorAddress)
}

// Initialize is a paid mutator transaction binding the contract method 0xc0c53b8b.
//
// Solidity: function initialize(address _initialOwner, address _blsApkRegistry, address _aggregatorAddress) returns()
func (_OracleManager *OracleManagerTransactorSession) Initialize(_initialOwner common.Address, _blsApkRegistry common.Address, _aggregatorAddress common.Address) (*types.Transaction, error) {
	return _OracleManager.Contract.Initialize(&_OracleManager.TransactOpts, _initialOwner, _blsApkRegistry, _aggregatorAddress)
}

// RegisterOperator is a paid mutator transaction binding the contract method 0x097c4af1.
//
// Solidity: function registerOperator(string nodeUrl) returns()
func (_OracleManager *OracleManagerTransactor) RegisterOperator(opts *bind.TransactOpts, nodeUrl string) (*types.Transaction, error) {
	return _OracleManager.contract.Transact(opts, "registerOperator", nodeUrl)
}

// RegisterOperator is a paid mutator transaction binding the contract method 0x097c4af1.
//
// Solidity: function registerOperator(string nodeUrl) returns()
func (_OracleManager *OracleManagerSession) RegisterOperator(nodeUrl string) (*types.Transaction, error) {
	return _OracleManager.Contract.RegisterOperator(&_OracleManager.TransactOpts, nodeUrl)
}

// RegisterOperator is a paid mutator transaction binding the contract method 0x097c4af1.
//
// Solidity: function registerOperator(string nodeUrl) returns()
func (_OracleManager *OracleManagerTransactorSession) RegisterOperator(nodeUrl string) (*types.Transaction, error) {
	return _OracleManager.Contract.RegisterOperator(&_OracleManager.TransactOpts, nodeUrl)
}

// RemoveOraclePodToFillWhitelist is a paid mutator transaction binding the contract method 0xa2a21116.
//
// Solidity: function removeOraclePodToFillWhitelist(address oraclePod) returns()
func (_OracleManager *OracleManagerTransactor) RemoveOraclePodToFillWhitelist(opts *bind.TransactOpts, oraclePod common.Address) (*types.Transaction, error) {
	return _OracleManager.contract.Transact(opts, "removeOraclePodToFillWhitelist", oraclePod)
}

// RemoveOraclePodToFillWhitelist is a paid mutator transaction binding the contract method 0xa2a21116.
//
// Solidity: function removeOraclePodToFillWhitelist(address oraclePod) returns()
func (_OracleManager *OracleManagerSession) RemoveOraclePodToFillWhitelist(oraclePod common.Address) (*types.Transaction, error) {
	return _OracleManager.Contract.RemoveOraclePodToFillWhitelist(&_OracleManager.TransactOpts, oraclePod)
}

// RemoveOraclePodToFillWhitelist is a paid mutator transaction binding the contract method 0xa2a21116.
//
// Solidity: function removeOraclePodToFillWhitelist(address oraclePod) returns()
func (_OracleManager *OracleManagerTransactorSession) RemoveOraclePodToFillWhitelist(oraclePod common.Address) (*types.Transaction, error) {
	return _OracleManager.Contract.RemoveOraclePodToFillWhitelist(&_OracleManager.TransactOpts, oraclePod)
}

// RenounceOwnership is a paid mutator transaction binding the contract method 0x715018a6.
//
// Solidity: function renounceOwnership() returns()
func (_OracleManager *OracleManagerTransactor) RenounceOwnership(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _OracleManager.contract.Transact(opts, "renounceOwnership")
}

// RenounceOwnership is a paid mutator transaction binding the contract method 0x715018a6.
//
// Solidity: function renounceOwnership() returns()
func (_OracleManager *OracleManagerSession) RenounceOwnership() (*types.Transaction, error) {
	return _OracleManager.Contract.RenounceOwnership(&_OracleManager.TransactOpts)
}

// RenounceOwnership is a paid mutator transaction binding the contract method 0x715018a6.
//
// Solidity: function renounceOwnership() returns()
func (_OracleManager *OracleManagerTransactorSession) RenounceOwnership() (*types.Transaction, error) {
	return _OracleManager.Contract.RenounceOwnership(&_OracleManager.TransactOpts)
}

// SetAggregatorAddress is a paid mutator transaction binding the contract method 0x47b32448.
//
// Solidity: function setAggregatorAddress(address _aggregatorAddress) returns()
func (_OracleManager *OracleManagerTransactor) SetAggregatorAddress(opts *bind.TransactOpts, _aggregatorAddress common.Address) (*types.Transaction, error) {
	return _OracleManager.contract.Transact(opts, "setAggregatorAddress", _aggregatorAddress)
}

// SetAggregatorAddress is a paid mutator transaction binding the contract method 0x47b32448.
//
// Solidity: function setAggregatorAddress(address _aggregatorAddress) returns()
func (_OracleManager *OracleManagerSession) SetAggregatorAddress(_aggregatorAddress common.Address) (*types.Transaction, error) {
	return _OracleManager.Contract.SetAggregatorAddress(&_OracleManager.TransactOpts, _aggregatorAddress)
}

// SetAggregatorAddress is a paid mutator transaction binding the contract method 0x47b32448.
//
// Solidity: function setAggregatorAddress(address _aggregatorAddress) returns()
func (_OracleManager *OracleManagerTransactorSession) SetAggregatorAddress(_aggregatorAddress common.Address) (*types.Transaction, error) {
	return _OracleManager.Contract.SetAggregatorAddress(&_OracleManager.TransactOpts, _aggregatorAddress)
}

// TransferOwnership is a paid mutator transaction binding the contract method 0xf2fde38b.
//
// Solidity: function transferOwnership(address newOwner) returns()
func (_OracleManager *OracleManagerTransactor) TransferOwnership(opts *bind.TransactOpts, newOwner common.Address) (*types.Transaction, error) {
	return _OracleManager.contract.Transact(opts, "transferOwnership", newOwner)
}

// TransferOwnership is a paid mutator transaction binding the contract method 0xf2fde38b.
//
// Solidity: function transferOwnership(address newOwner) returns()
func (_OracleManager *OracleManagerSession) TransferOwnership(newOwner common.Address) (*types.Transaction, error) {
	return _OracleManager.Contract.TransferOwnership(&_OracleManager.TransactOpts, newOwner)
}

// TransferOwnership is a paid mutator transaction binding the contract method 0xf2fde38b.
//
// Solidity: function transferOwnership(address newOwner) returns()
func (_OracleManager *OracleManagerTransactorSession) TransferOwnership(newOwner common.Address) (*types.Transaction, error) {
	return _OracleManager.Contract.TransferOwnership(&_OracleManager.TransactOpts, newOwner)
}

// OracleManagerInitializedIterator is returned from FilterInitialized and is used to iterate over the raw logs and unpacked data for Initialized events raised by the OracleManager contract.
type OracleManagerInitializedIterator struct {
	Event *OracleManagerInitialized // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *OracleManagerInitializedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(OracleManagerInitialized)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(OracleManagerInitialized)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *OracleManagerInitializedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *OracleManagerInitializedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// OracleManagerInitialized represents a Initialized event raised by the OracleManager contract.
type OracleManagerInitialized struct {
	Version uint64
	Raw     types.Log // Blockchain specific contextual infos
}

// FilterInitialized is a free log retrieval operation binding the contract event 0xc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d2.
//
// Solidity: event Initialized(uint64 version)
func (_OracleManager *OracleManagerFilterer) FilterInitialized(opts *bind.FilterOpts) (*OracleManagerInitializedIterator, error) {

	logs, sub, err := _OracleManager.contract.FilterLogs(opts, "Initialized")
	if err != nil {
		return nil, err
	}
	return &OracleManagerInitializedIterator{contract: _OracleManager.contract, event: "Initialized", logs: logs, sub: sub}, nil
}

// WatchInitialized is a free log subscription operation binding the contract event 0xc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d2.
//
// Solidity: event Initialized(uint64 version)
func (_OracleManager *OracleManagerFilterer) WatchInitialized(opts *bind.WatchOpts, sink chan<- *OracleManagerInitialized) (event.Subscription, error) {

	logs, sub, err := _OracleManager.contract.WatchLogs(opts, "Initialized")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(OracleManagerInitialized)
				if err := _OracleManager.contract.UnpackLog(event, "Initialized", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseInitialized is a log parse operation binding the contract event 0xc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d2.
//
// Solidity: event Initialized(uint64 version)
func (_OracleManager *OracleManagerFilterer) ParseInitialized(log types.Log) (*OracleManagerInitialized, error) {
	event := new(OracleManagerInitialized)
	if err := _OracleManager.contract.UnpackLog(event, "Initialized", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// OracleManagerOperatorDeRegisteredIterator is returned from FilterOperatorDeRegistered and is used to iterate over the raw logs and unpacked data for OperatorDeRegistered events raised by the OracleManager contract.
type OracleManagerOperatorDeRegisteredIterator struct {
	Event *OracleManagerOperatorDeRegistered // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *OracleManagerOperatorDeRegisteredIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(OracleManagerOperatorDeRegistered)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(OracleManagerOperatorDeRegistered)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *OracleManagerOperatorDeRegisteredIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *OracleManagerOperatorDeRegisteredIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// OracleManagerOperatorDeRegistered represents a OperatorDeRegistered event raised by the OracleManager contract.
type OracleManagerOperatorDeRegistered struct {
	Operator common.Address
	Raw      types.Log // Blockchain specific contextual infos
}

// FilterOperatorDeRegistered is a free log retrieval operation binding the contract event 0xb2c38c6252ee2d17f80059fb47a790e20f7bd75e7ba577685375e5484f412d73.
//
// Solidity: event OperatorDeRegistered(address operator)
func (_OracleManager *OracleManagerFilterer) FilterOperatorDeRegistered(opts *bind.FilterOpts) (*OracleManagerOperatorDeRegisteredIterator, error) {

	logs, sub, err := _OracleManager.contract.FilterLogs(opts, "OperatorDeRegistered")
	if err != nil {
		return nil, err
	}
	return &OracleManagerOperatorDeRegisteredIterator{contract: _OracleManager.contract, event: "OperatorDeRegistered", logs: logs, sub: sub}, nil
}

// WatchOperatorDeRegistered is a free log subscription operation binding the contract event 0xb2c38c6252ee2d17f80059fb47a790e20f7bd75e7ba577685375e5484f412d73.
//
// Solidity: event OperatorDeRegistered(address operator)
func (_OracleManager *OracleManagerFilterer) WatchOperatorDeRegistered(opts *bind.WatchOpts, sink chan<- *OracleManagerOperatorDeRegistered) (event.Subscription, error) {

	logs, sub, err := _OracleManager.contract.WatchLogs(opts, "OperatorDeRegistered")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(OracleManagerOperatorDeRegistered)
				if err := _OracleManager.contract.UnpackLog(event, "OperatorDeRegistered", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseOperatorDeRegistered is a log parse operation binding the contract event 0xb2c38c6252ee2d17f80059fb47a790e20f7bd75e7ba577685375e5484f412d73.
//
// Solidity: event OperatorDeRegistered(address operator)
func (_OracleManager *OracleManagerFilterer) ParseOperatorDeRegistered(log types.Log) (*OracleManagerOperatorDeRegistered, error) {
	event := new(OracleManagerOperatorDeRegistered)
	if err := _OracleManager.contract.UnpackLog(event, "OperatorDeRegistered", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// OracleManagerOperatorRegisteredIterator is returned from FilterOperatorRegistered and is used to iterate over the raw logs and unpacked data for OperatorRegistered events raised by the OracleManager contract.
type OracleManagerOperatorRegisteredIterator struct {
	Event *OracleManagerOperatorRegistered // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *OracleManagerOperatorRegisteredIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(OracleManagerOperatorRegistered)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(OracleManagerOperatorRegistered)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *OracleManagerOperatorRegisteredIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *OracleManagerOperatorRegisteredIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// OracleManagerOperatorRegistered represents a OperatorRegistered event raised by the OracleManager contract.
type OracleManagerOperatorRegistered struct {
	Operator common.Address
	NodeUrl  string
	Raw      types.Log // Blockchain specific contextual infos
}

// FilterOperatorRegistered is a free log retrieval operation binding the contract event 0x11a85ea4a40584362c3d9c17685709a2e02b466ac78d5eb00b6aff73d90f5805.
//
// Solidity: event OperatorRegistered(address indexed operator, string nodeUrl)
func (_OracleManager *OracleManagerFilterer) FilterOperatorRegistered(opts *bind.FilterOpts, operator []common.Address) (*OracleManagerOperatorRegisteredIterator, error) {

	var operatorRule []interface{}
	for _, operatorItem := range operator {
		operatorRule = append(operatorRule, operatorItem)
	}

	logs, sub, err := _OracleManager.contract.FilterLogs(opts, "OperatorRegistered", operatorRule)
	if err != nil {
		return nil, err
	}
	return &OracleManagerOperatorRegisteredIterator{contract: _OracleManager.contract, event: "OperatorRegistered", logs: logs, sub: sub}, nil
}

// WatchOperatorRegistered is a free log subscription operation binding the contract event 0x11a85ea4a40584362c3d9c17685709a2e02b466ac78d5eb00b6aff73d90f5805.
//
// Solidity: event OperatorRegistered(address indexed operator, string nodeUrl)
func (_OracleManager *OracleManagerFilterer) WatchOperatorRegistered(opts *bind.WatchOpts, sink chan<- *OracleManagerOperatorRegistered, operator []common.Address) (event.Subscription, error) {

	var operatorRule []interface{}
	for _, operatorItem := range operator {
		operatorRule = append(operatorRule, operatorItem)
	}

	logs, sub, err := _OracleManager.contract.WatchLogs(opts, "OperatorRegistered", operatorRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(OracleManagerOperatorRegistered)
				if err := _OracleManager.contract.UnpackLog(event, "OperatorRegistered", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseOperatorRegistered is a log parse operation binding the contract event 0x11a85ea4a40584362c3d9c17685709a2e02b466ac78d5eb00b6aff73d90f5805.
//
// Solidity: event OperatorRegistered(address indexed operator, string nodeUrl)
func (_OracleManager *OracleManagerFilterer) ParseOperatorRegistered(log types.Log) (*OracleManagerOperatorRegistered, error) {
	event := new(OracleManagerOperatorRegistered)
	if err := _OracleManager.contract.UnpackLog(event, "OperatorRegistered", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// OracleManagerOraclePodAddedToFillWhitelistIterator is returned from FilterOraclePodAddedToFillWhitelist and is used to iterate over the raw logs and unpacked data for OraclePodAddedToFillWhitelist events raised by the OracleManager contract.
type OracleManagerOraclePodAddedToFillWhitelistIterator struct {
	Event *OracleManagerOraclePodAddedToFillWhitelist // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *OracleManagerOraclePodAddedToFillWhitelistIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(OracleManagerOraclePodAddedToFillWhitelist)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(OracleManagerOraclePodAddedToFillWhitelist)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *OracleManagerOraclePodAddedToFillWhitelistIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *OracleManagerOraclePodAddedToFillWhitelistIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// OracleManagerOraclePodAddedToFillWhitelist represents a OraclePodAddedToFillWhitelist event raised by the OracleManager contract.
type OracleManagerOraclePodAddedToFillWhitelist struct {
	OralePod common.Address
	Raw      types.Log // Blockchain specific contextual infos
}

// FilterOraclePodAddedToFillWhitelist is a free log retrieval operation binding the contract event 0x7da7409f8db3ec60d78c584483d3becc82a2c4891002c9eb6d4d41f2983f46f3.
//
// Solidity: event OraclePodAddedToFillWhitelist(address oralePod)
func (_OracleManager *OracleManagerFilterer) FilterOraclePodAddedToFillWhitelist(opts *bind.FilterOpts) (*OracleManagerOraclePodAddedToFillWhitelistIterator, error) {

	logs, sub, err := _OracleManager.contract.FilterLogs(opts, "OraclePodAddedToFillWhitelist")
	if err != nil {
		return nil, err
	}
	return &OracleManagerOraclePodAddedToFillWhitelistIterator{contract: _OracleManager.contract, event: "OraclePodAddedToFillWhitelist", logs: logs, sub: sub}, nil
}

// WatchOraclePodAddedToFillWhitelist is a free log subscription operation binding the contract event 0x7da7409f8db3ec60d78c584483d3becc82a2c4891002c9eb6d4d41f2983f46f3.
//
// Solidity: event OraclePodAddedToFillWhitelist(address oralePod)
func (_OracleManager *OracleManagerFilterer) WatchOraclePodAddedToFillWhitelist(opts *bind.WatchOpts, sink chan<- *OracleManagerOraclePodAddedToFillWhitelist) (event.Subscription, error) {

	logs, sub, err := _OracleManager.contract.WatchLogs(opts, "OraclePodAddedToFillWhitelist")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(OracleManagerOraclePodAddedToFillWhitelist)
				if err := _OracleManager.contract.UnpackLog(event, "OraclePodAddedToFillWhitelist", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseOraclePodAddedToFillWhitelist is a log parse operation binding the contract event 0x7da7409f8db3ec60d78c584483d3becc82a2c4891002c9eb6d4d41f2983f46f3.
//
// Solidity: event OraclePodAddedToFillWhitelist(address oralePod)
func (_OracleManager *OracleManagerFilterer) ParseOraclePodAddedToFillWhitelist(log types.Log) (*OracleManagerOraclePodAddedToFillWhitelist, error) {
	event := new(OracleManagerOraclePodAddedToFillWhitelist)
	if err := _OracleManager.contract.UnpackLog(event, "OraclePodAddedToFillWhitelist", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// OracleManagerOraclePodRemoveToFillWhitelistIterator is returned from FilterOraclePodRemoveToFillWhitelist and is used to iterate over the raw logs and unpacked data for OraclePodRemoveToFillWhitelist events raised by the OracleManager contract.
type OracleManagerOraclePodRemoveToFillWhitelistIterator struct {
	Event *OracleManagerOraclePodRemoveToFillWhitelist // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *OracleManagerOraclePodRemoveToFillWhitelistIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(OracleManagerOraclePodRemoveToFillWhitelist)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(OracleManagerOraclePodRemoveToFillWhitelist)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *OracleManagerOraclePodRemoveToFillWhitelistIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *OracleManagerOraclePodRemoveToFillWhitelistIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// OracleManagerOraclePodRemoveToFillWhitelist represents a OraclePodRemoveToFillWhitelist event raised by the OracleManager contract.
type OracleManagerOraclePodRemoveToFillWhitelist struct {
	OralePod common.Address
	Raw      types.Log // Blockchain specific contextual infos
}

// FilterOraclePodRemoveToFillWhitelist is a free log retrieval operation binding the contract event 0x760913fd095411dc9e223313517b8b336ac92746a9efaf1760ce1b4590bb45b9.
//
// Solidity: event OraclePodRemoveToFillWhitelist(address oralePod)
func (_OracleManager *OracleManagerFilterer) FilterOraclePodRemoveToFillWhitelist(opts *bind.FilterOpts) (*OracleManagerOraclePodRemoveToFillWhitelistIterator, error) {

	logs, sub, err := _OracleManager.contract.FilterLogs(opts, "OraclePodRemoveToFillWhitelist")
	if err != nil {
		return nil, err
	}
	return &OracleManagerOraclePodRemoveToFillWhitelistIterator{contract: _OracleManager.contract, event: "OraclePodRemoveToFillWhitelist", logs: logs, sub: sub}, nil
}

// WatchOraclePodRemoveToFillWhitelist is a free log subscription operation binding the contract event 0x760913fd095411dc9e223313517b8b336ac92746a9efaf1760ce1b4590bb45b9.
//
// Solidity: event OraclePodRemoveToFillWhitelist(address oralePod)
func (_OracleManager *OracleManagerFilterer) WatchOraclePodRemoveToFillWhitelist(opts *bind.WatchOpts, sink chan<- *OracleManagerOraclePodRemoveToFillWhitelist) (event.Subscription, error) {

	logs, sub, err := _OracleManager.contract.WatchLogs(opts, "OraclePodRemoveToFillWhitelist")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(OracleManagerOraclePodRemoveToFillWhitelist)
				if err := _OracleManager.contract.UnpackLog(event, "OraclePodRemoveToFillWhitelist", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseOraclePodRemoveToFillWhitelist is a log parse operation binding the contract event 0x760913fd095411dc9e223313517b8b336ac92746a9efaf1760ce1b4590bb45b9.
//
// Solidity: event OraclePodRemoveToFillWhitelist(address oralePod)
func (_OracleManager *OracleManagerFilterer) ParseOraclePodRemoveToFillWhitelist(log types.Log) (*OracleManagerOraclePodRemoveToFillWhitelist, error) {
	event := new(OracleManagerOraclePodRemoveToFillWhitelist)
	if err := _OracleManager.contract.UnpackLog(event, "OraclePodRemoveToFillWhitelist", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// OracleManagerOwnershipTransferredIterator is returned from FilterOwnershipTransferred and is used to iterate over the raw logs and unpacked data for OwnershipTransferred events raised by the OracleManager contract.
type OracleManagerOwnershipTransferredIterator struct {
	Event *OracleManagerOwnershipTransferred // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *OracleManagerOwnershipTransferredIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(OracleManagerOwnershipTransferred)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(OracleManagerOwnershipTransferred)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *OracleManagerOwnershipTransferredIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *OracleManagerOwnershipTransferredIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// OracleManagerOwnershipTransferred represents a OwnershipTransferred event raised by the OracleManager contract.
type OracleManagerOwnershipTransferred struct {
	PreviousOwner common.Address
	NewOwner      common.Address
	Raw           types.Log // Blockchain specific contextual infos
}

// FilterOwnershipTransferred is a free log retrieval operation binding the contract event 0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0.
//
// Solidity: event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
func (_OracleManager *OracleManagerFilterer) FilterOwnershipTransferred(opts *bind.FilterOpts, previousOwner []common.Address, newOwner []common.Address) (*OracleManagerOwnershipTransferredIterator, error) {

	var previousOwnerRule []interface{}
	for _, previousOwnerItem := range previousOwner {
		previousOwnerRule = append(previousOwnerRule, previousOwnerItem)
	}
	var newOwnerRule []interface{}
	for _, newOwnerItem := range newOwner {
		newOwnerRule = append(newOwnerRule, newOwnerItem)
	}

	logs, sub, err := _OracleManager.contract.FilterLogs(opts, "OwnershipTransferred", previousOwnerRule, newOwnerRule)
	if err != nil {
		return nil, err
	}
	return &OracleManagerOwnershipTransferredIterator{contract: _OracleManager.contract, event: "OwnershipTransferred", logs: logs, sub: sub}, nil
}

// WatchOwnershipTransferred is a free log subscription operation binding the contract event 0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0.
//
// Solidity: event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
func (_OracleManager *OracleManagerFilterer) WatchOwnershipTransferred(opts *bind.WatchOpts, sink chan<- *OracleManagerOwnershipTransferred, previousOwner []common.Address, newOwner []common.Address) (event.Subscription, error) {

	var previousOwnerRule []interface{}
	for _, previousOwnerItem := range previousOwner {
		previousOwnerRule = append(previousOwnerRule, previousOwnerItem)
	}
	var newOwnerRule []interface{}
	for _, newOwnerItem := range newOwner {
		newOwnerRule = append(newOwnerRule, newOwnerItem)
	}

	logs, sub, err := _OracleManager.contract.WatchLogs(opts, "OwnershipTransferred", previousOwnerRule, newOwnerRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(OracleManagerOwnershipTransferred)
				if err := _OracleManager.contract.UnpackLog(event, "OwnershipTransferred", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseOwnershipTransferred is a log parse operation binding the contract event 0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0.
//
// Solidity: event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
func (_OracleManager *OracleManagerFilterer) ParseOwnershipTransferred(log types.Log) (*OracleManagerOwnershipTransferred, error) {
	event := new(OracleManagerOwnershipTransferred)
	if err := _OracleManager.contract.UnpackLog(event, "OwnershipTransferred", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// OracleManagerPricesSubmittedIterator is returned from FilterPricesSubmitted and is used to iterate over the raw logs and unpacked data for PricesSubmitted events raised by the OracleManager contract.
type OracleManagerPricesSubmittedIterator struct {
	Event *OracleManagerPricesSubmitted // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *OracleManagerPricesSubmittedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(OracleManagerPricesSubmitted)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(OracleManagerPricesSubmitted)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *OracleManagerPricesSubmittedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *OracleManagerPricesSubmittedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// OracleManagerPricesSubmitted represents a PricesSubmitted event raised by the OracleManager contract.
type OracleManagerPricesSubmitted struct {
	BatchId             *big.Int
	AggregatedPrice     *big.Int
	NodeCount           *big.Int
	SignatoryRecordHash [32]byte
	Raw                 types.Log // Blockchain specific contextual infos
}

// FilterPricesSubmitted is a free log retrieval operation binding the contract event 0xbc192003fc5fd7ea4fcc4efea093a25e49bc8529fcf435c1e423118c5e5f2215.
//
// Solidity: event PricesSubmitted(uint256 batchId, uint256 aggregatedPrice, uint256 nodeCount, bytes32 signatoryRecordHash)
func (_OracleManager *OracleManagerFilterer) FilterPricesSubmitted(opts *bind.FilterOpts) (*OracleManagerPricesSubmittedIterator, error) {

	logs, sub, err := _OracleManager.contract.FilterLogs(opts, "PricesSubmitted")
	if err != nil {
		return nil, err
	}
	return &OracleManagerPricesSubmittedIterator{contract: _OracleManager.contract, event: "PricesSubmitted", logs: logs, sub: sub}, nil
}

// WatchPricesSubmitted is a free log subscription operation binding the contract event 0xbc192003fc5fd7ea4fcc4efea093a25e49bc8529fcf435c1e423118c5e5f2215.
//
// Solidity: event PricesSubmitted(uint256 batchId, uint256 aggregatedPrice, uint256 nodeCount, bytes32 signatoryRecordHash)
func (_OracleManager *OracleManagerFilterer) WatchPricesSubmitted(opts *bind.WatchOpts, sink chan<- *OracleManagerPricesSubmitted) (event.Subscription, error) {

	logs, sub, err := _OracleManager.contract.WatchLogs(opts, "PricesSubmitted")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(OracleManagerPricesSubmitted)
				if err := _OracleManager.contract.UnpackLog(event, "PricesSubmitted", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParsePricesSubmitted is a log parse operation binding the contract event 0xbc192003fc5fd7ea4fcc4efea093a25e49bc8529fcf435c1e423118c5e5f2215.
//
// Solidity: event PricesSubmitted(uint256 batchId, uint256 aggregatedPrice, uint256 nodeCount, bytes32 signatoryRecordHash)
func (_OracleManager *OracleManagerFilterer) ParsePricesSubmitted(log types.Log) (*OracleManagerPricesSubmitted, error) {
	event := new(OracleManagerPricesSubmitted)
	if err := _OracleManager.contract.UnpackLog(event, "PricesSubmitted", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// OracleManagerVerifyOracleSigIterator is returned from FilterVerifyOracleSig and is used to iterate over the raw logs and unpacked data for VerifyOracleSig events raised by the OracleManager contract.
type OracleManagerVerifyOracleSigIterator struct {
	Event *OracleManagerVerifyOracleSig // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *OracleManagerVerifyOracleSigIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(OracleManagerVerifyOracleSig)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(OracleManagerVerifyOracleSig)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *OracleManagerVerifyOracleSigIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *OracleManagerVerifyOracleSigIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// OracleManagerVerifyOracleSig represents a VerifyOracleSig event raised by the OracleManager contract.
type OracleManagerVerifyOracleSig struct {
	BatchId             *big.Int
	TotalStaking        *big.Int
	SignatoryRecordHash [32]byte
	MarketPrice         string
	Raw                 types.Log // Blockchain specific contextual infos
}

// FilterVerifyOracleSig is a free log retrieval operation binding the contract event 0x2f8b976598490503c5965cf40bc6629717a2aa0b1c5be9b4b4d6570a9dc6a80e.
//
// Solidity: event VerifyOracleSig(uint256 batchId, uint256 totalStaking, bytes32 signatoryRecordHash, string marketPrice)
func (_OracleManager *OracleManagerFilterer) FilterVerifyOracleSig(opts *bind.FilterOpts) (*OracleManagerVerifyOracleSigIterator, error) {

	logs, sub, err := _OracleManager.contract.FilterLogs(opts, "VerifyOracleSig")
	if err != nil {
		return nil, err
	}
	return &OracleManagerVerifyOracleSigIterator{contract: _OracleManager.contract, event: "VerifyOracleSig", logs: logs, sub: sub}, nil
}

// WatchVerifyOracleSig is a free log subscription operation binding the contract event 0x2f8b976598490503c5965cf40bc6629717a2aa0b1c5be9b4b4d6570a9dc6a80e.
//
// Solidity: event VerifyOracleSig(uint256 batchId, uint256 totalStaking, bytes32 signatoryRecordHash, string marketPrice)
func (_OracleManager *OracleManagerFilterer) WatchVerifyOracleSig(opts *bind.WatchOpts, sink chan<- *OracleManagerVerifyOracleSig) (event.Subscription, error) {

	logs, sub, err := _OracleManager.contract.WatchLogs(opts, "VerifyOracleSig")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(OracleManagerVerifyOracleSig)
				if err := _OracleManager.contract.UnpackLog(event, "VerifyOracleSig", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseVerifyOracleSig is a log parse operation binding the contract event 0x2f8b976598490503c5965cf40bc6629717a2aa0b1c5be9b4b4d6570a9dc6a80e.
//
// Solidity: event VerifyOracleSig(uint256 batchId, uint256 totalStaking, bytes32 signatoryRecordHash, string marketPrice)
func (_OracleManager *OracleManagerFilterer) ParseVerifyOracleSig(log types.Log) (*OracleManagerVerifyOracleSig, error) {
	event := new(OracleManagerVerifyOracleSig)
	if err := _OracleManager.contract.UnpackLog(event, "VerifyOracleSig", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
