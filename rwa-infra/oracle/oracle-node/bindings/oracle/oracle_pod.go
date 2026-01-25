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

// OraclePodMetaData contains all meta data concerning the OraclePod contract.
var OraclePodMetaData = &bind.MetaData{
	ABI: "[{\"type\":\"constructor\",\"inputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"PRICE_DECIMALS\",\"inputs\":[],\"outputs\":[{\"name\":\"\",\"type\":\"uint8\",\"internalType\":\"uint8\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"aggregatedPrice\",\"inputs\":[],\"outputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"fillPrices\",\"inputs\":[{\"name\":\"prices\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"},{\"name\":\"weights\",\"type\":\"uint256[]\",\"internalType\":\"uint256[]\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"fillSymbolPrice\",\"inputs\":[{\"name\":\"price\",\"type\":\"string\",\"internalType\":\"string\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"getPrice\",\"inputs\":[],\"outputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getPriceWithDecimals\",\"inputs\":[],\"outputs\":[{\"name\":\"price\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"decimals\",\"type\":\"uint8\",\"internalType\":\"uint8\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getSymbolPrice\",\"inputs\":[],\"outputs\":[{\"name\":\"\",\"type\":\"string\",\"internalType\":\"string\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"getUpdateTimestamp\",\"inputs\":[],\"outputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"initialize\",\"inputs\":[{\"name\":\"_initialOwner\",\"type\":\"address\",\"internalType\":\"address\"},{\"name\":\"_oracleManager\",\"type\":\"address\",\"internalType\":\"address\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"isDataFresh\",\"inputs\":[{\"name\":\"_maxAge\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[{\"name\":\"\",\"type\":\"bool\",\"internalType\":\"bool\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"marketPrice\",\"inputs\":[],\"outputs\":[{\"name\":\"\",\"type\":\"string\",\"internalType\":\"string\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"maxAge\",\"inputs\":[],\"outputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"oracleManager\",\"inputs\":[],\"outputs\":[{\"name\":\"\",\"type\":\"address\",\"internalType\":\"address\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"owner\",\"inputs\":[],\"outputs\":[{\"name\":\"\",\"type\":\"address\",\"internalType\":\"address\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"renounceOwnership\",\"inputs\":[],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"setOracleManager\",\"inputs\":[{\"name\":\"_oracleManager\",\"type\":\"address\",\"internalType\":\"address\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"transferOwnership\",\"inputs\":[{\"name\":\"newOwner\",\"type\":\"address\",\"internalType\":\"address\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"updateTimestamp\",\"inputs\":[],\"outputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"stateMutability\":\"view\"},{\"type\":\"event\",\"name\":\"Initialized\",\"inputs\":[{\"name\":\"version\",\"type\":\"uint64\",\"indexed\":false,\"internalType\":\"uint64\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"MarketPriceUpdated\",\"inputs\":[{\"name\":\"oldPrice\",\"type\":\"string\",\"indexed\":false,\"internalType\":\"string\"},{\"name\":\"price\",\"type\":\"string\",\"indexed\":false,\"internalType\":\"string\"},{\"name\":\"timestamp\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"OracleManagerUpdate\",\"inputs\":[{\"name\":\"oldManagerAddress\",\"type\":\"address\",\"indexed\":false,\"internalType\":\"address\"},{\"name\":\"newManagerAddress\",\"type\":\"address\",\"indexed\":false,\"internalType\":\"address\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"OwnershipTransferred\",\"inputs\":[{\"name\":\"previousOwner\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"newOwner\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"}],\"anonymous\":false},{\"type\":\"event\",\"name\":\"PriceUpdated\",\"inputs\":[{\"name\":\"oldPrice\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"},{\"name\":\"newPrice\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"},{\"name\":\"nodeCount\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"},{\"name\":\"timestamp\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"}],\"anonymous\":false},{\"type\":\"error\",\"name\":\"InvalidInitialization\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"NotInitializing\",\"inputs\":[]},{\"type\":\"error\",\"name\":\"OwnableInvalidOwner\",\"inputs\":[{\"name\":\"owner\",\"type\":\"address\",\"internalType\":\"address\"}]},{\"type\":\"error\",\"name\":\"OwnableUnauthorizedAccount\",\"inputs\":[{\"name\":\"account\",\"type\":\"address\",\"internalType\":\"address\"}]}]",
	Bin: "0x608060405234801561001057600080fd5b5061001961001e565b6100d0565b7ff0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a00805468010000000000000000900460ff161561006e5760405163f92ee8a960e01b815260040160405180910390fd5b80546001600160401b03908116146100cd5780546001600160401b0319166001600160401b0390811782556040519081527fc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d29060200160405180910390a15b50565b611099806100df6000396000f3fe608060405234801561001057600080fd5b50600436106101165760003560e01c8063715018a6116100a257806398d5fdca1161007157806398d5fdca1461022b578063ba1ae75b14610233578063e286b66414610256578063f1a640f81461025e578063f2fde38b1461027857600080fd5b8063715018a6146101c9578063831fa725146101d15780638da5cb5b146101e8578063929e2e081461021857600080fd5b80633a6b3e2d116100e95780633a6b3e2d1461016357806345a153881461016c578063485cc95514610181578063565d878c14610194578063687043c5146101bf57600080fd5b806304e93f6e1461011b5780630f07ce7b146101305780631c5be3d71461014757806328bb986c14610150575b600080fd5b61012e610129366004610b88565b61028b565b005b6002545b6040519081526020015b60405180910390f35b61013460025481565b61012e61015e366004610c0a565b6103ca565b61013460015481565b6101746104d8565b60405161013e9190610d01565b61012e61018f366004610d37565b610566565b6000546101a7906001600160a01b031681565b6040516001600160a01b03909116815260200161013e565b6101346201518081565b61012e61067e565b60015460408051918252600660208301520161013e565b7f9016d09d72d40fdae2fd8ceac6b6234c7706214fd39c1cd1e609a0528c199300546001600160a01b03166101a7565b61012e610226366004610d6a565b610692565b600154610134565b610246610241366004610d85565b61074a565b604051901515815260200161013e565b610174610763565b610266600681565b60405160ff909116815260200161013e565b61012e610286366004610d6a565b6107f5565b6000546001600160a01b031633146102be5760405162461bcd60e51b81526004016102b590610d9e565b60405180910390fd5b8261030b5760405162461bcd60e51b815260206004820152601d60248201527f4f7261636c65506f643a20656d7074792070726963657320617272617900000060448201526064016102b5565b82811461035a5760405162461bcd60e51b815260206004820152601a60248201527f4f7261636c65506f643a206c656e677468206d69736d6174636800000000000060448201526064016102b5565b600154600061036b86868686610833565b6001819055426002819055604080518581526020810184905290810188905260608101919091529091507fc6d3da45896ce1bca9d198309a2dbeea3c73a991748f8d88d796ffa06029de939060800160405180910390a1505050505050565b6000546001600160a01b031633146103f45760405162461bcd60e51b81526004016102b590610d9e565b60006003805461040390610de9565b80601f016020809104026020016040519081016040528092919081815260200182805461042f90610de9565b801561047c5780601f106104515761010080835404028352916020019161047c565b820191906000526020600020905b81548152906001019060200180831161045f57829003601f168201915b5050505050905081600390816104929190610e74565b504260028190556040517f2d61ba9f6e09d0b52de7637251a6d3681e5f26bd9de88995b0e5bbae55d38d9a916104cc918491600391610f34565b60405180910390a15050565b600380546104e590610de9565b80601f016020809104026020016040519081016040528092919081815260200182805461051190610de9565b801561055e5780601f106105335761010080835404028352916020019161055e565b820191906000526020600020905b81548152906001019060200180831161054157829003601f168201915b505050505081565b60006105706109ed565b805490915060ff600160401b820416159067ffffffffffffffff166000811580156105985750825b905060008267ffffffffffffffff1660011480156105b55750303b155b9050811580156105c3575080155b156105e15760405163f92ee8a960e01b815260040160405180910390fd5b845467ffffffffffffffff19166001178555831561060b57845460ff60401b1916600160401b1785555b61061487610a18565b600080546001600160a01b0319166001600160a01b038816179055831561067557845460ff60401b19168555604051600181527fc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d29060200160405180910390a15b50505050505050565b610686610a29565b6106906000610a84565b565b61069a610a29565b6001600160a01b0381166106f05760405162461bcd60e51b815260206004820152601760248201527f4f7261636c65506f643a207a65726f206164647265737300000000000000000060448201526064016102b5565b600080546001600160a01b038381166001600160a01b031983168117909355604080519190921680825260208201939093527f4fa3394c69c77ebdd11178f49beb82f9fb98c08f03c354b555f536535bc8421e91016104cc565b6000816002544261075b9190610fee565b111592915050565b60606003805461077290610de9565b80601f016020809104026020016040519081016040528092919081815260200182805461079e90610de9565b80156107eb5780601f106107c0576101008083540402835291602001916107eb565b820191906000526020600020905b8154815290600101906020018083116107ce57829003601f168201915b5050505050905090565b6107fd610a29565b6001600160a01b03811661082757604051631e4fbdf760e01b8152600060048201526024016102b5565b61083081610a84565b50565b60008080805b8681101561098757600088888381811061085557610855611001565b90506020020135116108a95760405162461bcd60e51b815260206004820152601860248201527f4f7261636c65506f643a20696e76616c6964207072696365000000000000000060448201526064016102b5565b60008686838181106108bd576108bd611001565b90506020020135116109115760405162461bcd60e51b815260206004820152601960248201527f4f7261636c65506f643a20696e76616c6964207765696768740000000000000060448201526064016102b5565b85858281811061092357610923611001565b9050602002013588888381811061093c5761093c611001565b9050602002013561094d9190611017565b610957908461102e565b925085858281811061096b5761096b611001565b905060200201358261097d919061102e565b9150600101610839565b50600081116109d85760405162461bcd60e51b815260206004820152601c60248201527f4f7261636c65506f643a207a65726f20746f74616c207765696768740000000060448201526064016102b5565b6109e28183611041565b979650505050505050565b6000807ff0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a005b92915050565b610a20610af5565b61083081610b1a565b33610a5b7f9016d09d72d40fdae2fd8ceac6b6234c7706214fd39c1cd1e609a0528c199300546001600160a01b031690565b6001600160a01b0316146106905760405163118cdaa760e01b81523360048201526024016102b5565b7f9016d09d72d40fdae2fd8ceac6b6234c7706214fd39c1cd1e609a0528c19930080546001600160a01b031981166001600160a01b03848116918217845560405192169182907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a3505050565b610afd610b22565b61069057604051631afcd79f60e31b815260040160405180910390fd5b6107fd610af5565b6000610b2c6109ed565b54600160401b900460ff16919050565b60008083601f840112610b4e57600080fd5b50813567ffffffffffffffff811115610b6657600080fd5b6020830191508360208260051b8501011115610b8157600080fd5b9250929050565b60008060008060408587031215610b9e57600080fd5b843567ffffffffffffffff80821115610bb657600080fd5b610bc288838901610b3c565b90965094506020870135915080821115610bdb57600080fd5b50610be887828801610b3c565b95989497509550505050565b634e487b7160e01b600052604160045260246000fd5b600060208284031215610c1c57600080fd5b813567ffffffffffffffff80821115610c3457600080fd5b818401915084601f830112610c4857600080fd5b813581811115610c5a57610c5a610bf4565b604051601f8201601f19908116603f01168101908382118183101715610c8257610c82610bf4565b81604052828152876020848701011115610c9b57600080fd5b826020860160208301376000928101602001929092525095945050505050565b6000815180845260005b81811015610ce157602081850181015186830182015201610cc5565b506000602082860101526020601f19601f83011685010191505092915050565b602081526000610d146020830184610cbb565b9392505050565b80356001600160a01b0381168114610d3257600080fd5b919050565b60008060408385031215610d4a57600080fd5b610d5383610d1b565b9150610d6160208401610d1b565b90509250929050565b600060208284031215610d7c57600080fd5b610d1482610d1b565b600060208284031215610d9757600080fd5b5035919050565b6020808252602b908201527f4f7261636c65506f643a2063616c6c6572206973206e6f7420746865206f726160408201526a31b6329036b0b730b3b2b960a91b606082015260800190565b600181811c90821680610dfd57607f821691505b602082108103610e1d57634e487b7160e01b600052602260045260246000fd5b50919050565b601f821115610e6f576000816000526020600020601f850160051c81016020861015610e4c5750805b601f850160051c820191505b81811015610e6b57828155600101610e58565b5050505b505050565b815167ffffffffffffffff811115610e8e57610e8e610bf4565b610ea281610e9c8454610de9565b84610e23565b602080601f831160018114610ed75760008415610ebf5750858301515b600019600386901b1c1916600185901b178555610e6b565b600085815260208120601f198616915b82811015610f0657888601518255948401946001909101908401610ee7565b5085821015610f245787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b606081526000610f476060830186610cbb565b60208382038185015260008654610f5d81610de9565b80855260018281168015610f785760018114610f9257610fc0565b60ff1984168787015282151560051b870186019450610fc0565b8a6000528560002060005b84811015610fb8578154898201890152908301908701610f9d565b880187019550505b50505050809350505050826040830152949350505050565b634e487b7160e01b600052601160045260246000fd5b81810381811115610a1257610a12610fd8565b634e487b7160e01b600052603260045260246000fd5b8082028115828204841417610a1257610a12610fd8565b80820180821115610a1257610a12610fd8565b60008261105e57634e487b7160e01b600052601260045260246000fd5b50049056fea2646970667358221220e3750fff33fd0ca6177807d9fc6a5f0ead5d0a877cac38faa3378da7d066c11f64736f6c63430008160033",
}

// OraclePodABI is the input ABI used to generate the binding from.
// Deprecated: Use OraclePodMetaData.ABI instead.
var OraclePodABI = OraclePodMetaData.ABI

// OraclePodBin is the compiled bytecode used for deploying new contracts.
// Deprecated: Use OraclePodMetaData.Bin instead.
var OraclePodBin = OraclePodMetaData.Bin

// DeployOraclePod deploys a new Ethereum contract, binding an instance of OraclePod to it.
func DeployOraclePod(auth *bind.TransactOpts, backend bind.ContractBackend) (common.Address, *types.Transaction, *OraclePod, error) {
	parsed, err := OraclePodMetaData.GetAbi()
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	if parsed == nil {
		return common.Address{}, nil, nil, errors.New("GetABI returned nil")
	}

	address, tx, contract, err := bind.DeployContract(auth, *parsed, common.FromHex(OraclePodBin), backend)
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	return address, tx, &OraclePod{OraclePodCaller: OraclePodCaller{contract: contract}, OraclePodTransactor: OraclePodTransactor{contract: contract}, OraclePodFilterer: OraclePodFilterer{contract: contract}}, nil
}

// OraclePod is an auto generated Go binding around an Ethereum contract.
type OraclePod struct {
	OraclePodCaller     // Read-only binding to the contract
	OraclePodTransactor // Write-only binding to the contract
	OraclePodFilterer   // Log filterer for contract events
}

// OraclePodCaller is an auto generated read-only Go binding around an Ethereum contract.
type OraclePodCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// OraclePodTransactor is an auto generated write-only Go binding around an Ethereum contract.
type OraclePodTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// OraclePodFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type OraclePodFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// OraclePodSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type OraclePodSession struct {
	Contract     *OraclePod        // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// OraclePodCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type OraclePodCallerSession struct {
	Contract *OraclePodCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts    // Call options to use throughout this session
}

// OraclePodTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type OraclePodTransactorSession struct {
	Contract     *OraclePodTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts    // Transaction auth options to use throughout this session
}

// OraclePodRaw is an auto generated low-level Go binding around an Ethereum contract.
type OraclePodRaw struct {
	Contract *OraclePod // Generic contract binding to access the raw methods on
}

// OraclePodCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type OraclePodCallerRaw struct {
	Contract *OraclePodCaller // Generic read-only contract binding to access the raw methods on
}

// OraclePodTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type OraclePodTransactorRaw struct {
	Contract *OraclePodTransactor // Generic write-only contract binding to access the raw methods on
}

// NewOraclePod creates a new instance of OraclePod, bound to a specific deployed contract.
func NewOraclePod(address common.Address, backend bind.ContractBackend) (*OraclePod, error) {
	contract, err := bindOraclePod(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &OraclePod{OraclePodCaller: OraclePodCaller{contract: contract}, OraclePodTransactor: OraclePodTransactor{contract: contract}, OraclePodFilterer: OraclePodFilterer{contract: contract}}, nil
}

// NewOraclePodCaller creates a new read-only instance of OraclePod, bound to a specific deployed contract.
func NewOraclePodCaller(address common.Address, caller bind.ContractCaller) (*OraclePodCaller, error) {
	contract, err := bindOraclePod(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &OraclePodCaller{contract: contract}, nil
}

// NewOraclePodTransactor creates a new write-only instance of OraclePod, bound to a specific deployed contract.
func NewOraclePodTransactor(address common.Address, transactor bind.ContractTransactor) (*OraclePodTransactor, error) {
	contract, err := bindOraclePod(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &OraclePodTransactor{contract: contract}, nil
}

// NewOraclePodFilterer creates a new log filterer instance of OraclePod, bound to a specific deployed contract.
func NewOraclePodFilterer(address common.Address, filterer bind.ContractFilterer) (*OraclePodFilterer, error) {
	contract, err := bindOraclePod(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &OraclePodFilterer{contract: contract}, nil
}

// bindOraclePod binds a generic wrapper to an already deployed contract.
func bindOraclePod(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := OraclePodMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_OraclePod *OraclePodRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _OraclePod.Contract.OraclePodCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_OraclePod *OraclePodRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _OraclePod.Contract.OraclePodTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_OraclePod *OraclePodRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _OraclePod.Contract.OraclePodTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_OraclePod *OraclePodCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _OraclePod.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_OraclePod *OraclePodTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _OraclePod.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_OraclePod *OraclePodTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _OraclePod.Contract.contract.Transact(opts, method, params...)
}

// PRICEDECIMALS is a free data retrieval call binding the contract method 0xf1a640f8.
//
// Solidity: function PRICE_DECIMALS() view returns(uint8)
func (_OraclePod *OraclePodCaller) PRICEDECIMALS(opts *bind.CallOpts) (uint8, error) {
	var out []interface{}
	err := _OraclePod.contract.Call(opts, &out, "PRICE_DECIMALS")

	if err != nil {
		return *new(uint8), err
	}

	out0 := *abi.ConvertType(out[0], new(uint8)).(*uint8)

	return out0, err

}

// PRICEDECIMALS is a free data retrieval call binding the contract method 0xf1a640f8.
//
// Solidity: function PRICE_DECIMALS() view returns(uint8)
func (_OraclePod *OraclePodSession) PRICEDECIMALS() (uint8, error) {
	return _OraclePod.Contract.PRICEDECIMALS(&_OraclePod.CallOpts)
}

// PRICEDECIMALS is a free data retrieval call binding the contract method 0xf1a640f8.
//
// Solidity: function PRICE_DECIMALS() view returns(uint8)
func (_OraclePod *OraclePodCallerSession) PRICEDECIMALS() (uint8, error) {
	return _OraclePod.Contract.PRICEDECIMALS(&_OraclePod.CallOpts)
}

// AggregatedPrice is a free data retrieval call binding the contract method 0x3a6b3e2d.
//
// Solidity: function aggregatedPrice() view returns(uint256)
func (_OraclePod *OraclePodCaller) AggregatedPrice(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _OraclePod.contract.Call(opts, &out, "aggregatedPrice")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// AggregatedPrice is a free data retrieval call binding the contract method 0x3a6b3e2d.
//
// Solidity: function aggregatedPrice() view returns(uint256)
func (_OraclePod *OraclePodSession) AggregatedPrice() (*big.Int, error) {
	return _OraclePod.Contract.AggregatedPrice(&_OraclePod.CallOpts)
}

// AggregatedPrice is a free data retrieval call binding the contract method 0x3a6b3e2d.
//
// Solidity: function aggregatedPrice() view returns(uint256)
func (_OraclePod *OraclePodCallerSession) AggregatedPrice() (*big.Int, error) {
	return _OraclePod.Contract.AggregatedPrice(&_OraclePod.CallOpts)
}

// GetPrice is a free data retrieval call binding the contract method 0x98d5fdca.
//
// Solidity: function getPrice() view returns(uint256)
func (_OraclePod *OraclePodCaller) GetPrice(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _OraclePod.contract.Call(opts, &out, "getPrice")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetPrice is a free data retrieval call binding the contract method 0x98d5fdca.
//
// Solidity: function getPrice() view returns(uint256)
func (_OraclePod *OraclePodSession) GetPrice() (*big.Int, error) {
	return _OraclePod.Contract.GetPrice(&_OraclePod.CallOpts)
}

// GetPrice is a free data retrieval call binding the contract method 0x98d5fdca.
//
// Solidity: function getPrice() view returns(uint256)
func (_OraclePod *OraclePodCallerSession) GetPrice() (*big.Int, error) {
	return _OraclePod.Contract.GetPrice(&_OraclePod.CallOpts)
}

// GetPriceWithDecimals is a free data retrieval call binding the contract method 0x831fa725.
//
// Solidity: function getPriceWithDecimals() view returns(uint256 price, uint8 decimals)
func (_OraclePod *OraclePodCaller) GetPriceWithDecimals(opts *bind.CallOpts) (struct {
	Price    *big.Int
	Decimals uint8
}, error) {
	var out []interface{}
	err := _OraclePod.contract.Call(opts, &out, "getPriceWithDecimals")

	outstruct := new(struct {
		Price    *big.Int
		Decimals uint8
	})
	if err != nil {
		return *outstruct, err
	}

	outstruct.Price = *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)
	outstruct.Decimals = *abi.ConvertType(out[1], new(uint8)).(*uint8)

	return *outstruct, err

}

// GetPriceWithDecimals is a free data retrieval call binding the contract method 0x831fa725.
//
// Solidity: function getPriceWithDecimals() view returns(uint256 price, uint8 decimals)
func (_OraclePod *OraclePodSession) GetPriceWithDecimals() (struct {
	Price    *big.Int
	Decimals uint8
}, error) {
	return _OraclePod.Contract.GetPriceWithDecimals(&_OraclePod.CallOpts)
}

// GetPriceWithDecimals is a free data retrieval call binding the contract method 0x831fa725.
//
// Solidity: function getPriceWithDecimals() view returns(uint256 price, uint8 decimals)
func (_OraclePod *OraclePodCallerSession) GetPriceWithDecimals() (struct {
	Price    *big.Int
	Decimals uint8
}, error) {
	return _OraclePod.Contract.GetPriceWithDecimals(&_OraclePod.CallOpts)
}

// GetSymbolPrice is a free data retrieval call binding the contract method 0xe286b664.
//
// Solidity: function getSymbolPrice() view returns(string)
func (_OraclePod *OraclePodCaller) GetSymbolPrice(opts *bind.CallOpts) (string, error) {
	var out []interface{}
	err := _OraclePod.contract.Call(opts, &out, "getSymbolPrice")

	if err != nil {
		return *new(string), err
	}

	out0 := *abi.ConvertType(out[0], new(string)).(*string)

	return out0, err

}

// GetSymbolPrice is a free data retrieval call binding the contract method 0xe286b664.
//
// Solidity: function getSymbolPrice() view returns(string)
func (_OraclePod *OraclePodSession) GetSymbolPrice() (string, error) {
	return _OraclePod.Contract.GetSymbolPrice(&_OraclePod.CallOpts)
}

// GetSymbolPrice is a free data retrieval call binding the contract method 0xe286b664.
//
// Solidity: function getSymbolPrice() view returns(string)
func (_OraclePod *OraclePodCallerSession) GetSymbolPrice() (string, error) {
	return _OraclePod.Contract.GetSymbolPrice(&_OraclePod.CallOpts)
}

// GetUpdateTimestamp is a free data retrieval call binding the contract method 0x0f07ce7b.
//
// Solidity: function getUpdateTimestamp() view returns(uint256)
func (_OraclePod *OraclePodCaller) GetUpdateTimestamp(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _OraclePod.contract.Call(opts, &out, "getUpdateTimestamp")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetUpdateTimestamp is a free data retrieval call binding the contract method 0x0f07ce7b.
//
// Solidity: function getUpdateTimestamp() view returns(uint256)
func (_OraclePod *OraclePodSession) GetUpdateTimestamp() (*big.Int, error) {
	return _OraclePod.Contract.GetUpdateTimestamp(&_OraclePod.CallOpts)
}

// GetUpdateTimestamp is a free data retrieval call binding the contract method 0x0f07ce7b.
//
// Solidity: function getUpdateTimestamp() view returns(uint256)
func (_OraclePod *OraclePodCallerSession) GetUpdateTimestamp() (*big.Int, error) {
	return _OraclePod.Contract.GetUpdateTimestamp(&_OraclePod.CallOpts)
}

// IsDataFresh is a free data retrieval call binding the contract method 0xba1ae75b.
//
// Solidity: function isDataFresh(uint256 _maxAge) view returns(bool)
func (_OraclePod *OraclePodCaller) IsDataFresh(opts *bind.CallOpts, _maxAge *big.Int) (bool, error) {
	var out []interface{}
	err := _OraclePod.contract.Call(opts, &out, "isDataFresh", _maxAge)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// IsDataFresh is a free data retrieval call binding the contract method 0xba1ae75b.
//
// Solidity: function isDataFresh(uint256 _maxAge) view returns(bool)
func (_OraclePod *OraclePodSession) IsDataFresh(_maxAge *big.Int) (bool, error) {
	return _OraclePod.Contract.IsDataFresh(&_OraclePod.CallOpts, _maxAge)
}

// IsDataFresh is a free data retrieval call binding the contract method 0xba1ae75b.
//
// Solidity: function isDataFresh(uint256 _maxAge) view returns(bool)
func (_OraclePod *OraclePodCallerSession) IsDataFresh(_maxAge *big.Int) (bool, error) {
	return _OraclePod.Contract.IsDataFresh(&_OraclePod.CallOpts, _maxAge)
}

// MarketPrice is a free data retrieval call binding the contract method 0x45a15388.
//
// Solidity: function marketPrice() view returns(string)
func (_OraclePod *OraclePodCaller) MarketPrice(opts *bind.CallOpts) (string, error) {
	var out []interface{}
	err := _OraclePod.contract.Call(opts, &out, "marketPrice")

	if err != nil {
		return *new(string), err
	}

	out0 := *abi.ConvertType(out[0], new(string)).(*string)

	return out0, err

}

// MarketPrice is a free data retrieval call binding the contract method 0x45a15388.
//
// Solidity: function marketPrice() view returns(string)
func (_OraclePod *OraclePodSession) MarketPrice() (string, error) {
	return _OraclePod.Contract.MarketPrice(&_OraclePod.CallOpts)
}

// MarketPrice is a free data retrieval call binding the contract method 0x45a15388.
//
// Solidity: function marketPrice() view returns(string)
func (_OraclePod *OraclePodCallerSession) MarketPrice() (string, error) {
	return _OraclePod.Contract.MarketPrice(&_OraclePod.CallOpts)
}

// MaxAge is a free data retrieval call binding the contract method 0x687043c5.
//
// Solidity: function maxAge() view returns(uint256)
func (_OraclePod *OraclePodCaller) MaxAge(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _OraclePod.contract.Call(opts, &out, "maxAge")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// MaxAge is a free data retrieval call binding the contract method 0x687043c5.
//
// Solidity: function maxAge() view returns(uint256)
func (_OraclePod *OraclePodSession) MaxAge() (*big.Int, error) {
	return _OraclePod.Contract.MaxAge(&_OraclePod.CallOpts)
}

// MaxAge is a free data retrieval call binding the contract method 0x687043c5.
//
// Solidity: function maxAge() view returns(uint256)
func (_OraclePod *OraclePodCallerSession) MaxAge() (*big.Int, error) {
	return _OraclePod.Contract.MaxAge(&_OraclePod.CallOpts)
}

// OracleManager is a free data retrieval call binding the contract method 0x565d878c.
//
// Solidity: function oracleManager() view returns(address)
func (_OraclePod *OraclePodCaller) OracleManager(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _OraclePod.contract.Call(opts, &out, "oracleManager")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// OracleManager is a free data retrieval call binding the contract method 0x565d878c.
//
// Solidity: function oracleManager() view returns(address)
func (_OraclePod *OraclePodSession) OracleManager() (common.Address, error) {
	return _OraclePod.Contract.OracleManager(&_OraclePod.CallOpts)
}

// OracleManager is a free data retrieval call binding the contract method 0x565d878c.
//
// Solidity: function oracleManager() view returns(address)
func (_OraclePod *OraclePodCallerSession) OracleManager() (common.Address, error) {
	return _OraclePod.Contract.OracleManager(&_OraclePod.CallOpts)
}

// Owner is a free data retrieval call binding the contract method 0x8da5cb5b.
//
// Solidity: function owner() view returns(address)
func (_OraclePod *OraclePodCaller) Owner(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _OraclePod.contract.Call(opts, &out, "owner")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// Owner is a free data retrieval call binding the contract method 0x8da5cb5b.
//
// Solidity: function owner() view returns(address)
func (_OraclePod *OraclePodSession) Owner() (common.Address, error) {
	return _OraclePod.Contract.Owner(&_OraclePod.CallOpts)
}

// Owner is a free data retrieval call binding the contract method 0x8da5cb5b.
//
// Solidity: function owner() view returns(address)
func (_OraclePod *OraclePodCallerSession) Owner() (common.Address, error) {
	return _OraclePod.Contract.Owner(&_OraclePod.CallOpts)
}

// UpdateTimestamp is a free data retrieval call binding the contract method 0x1c5be3d7.
//
// Solidity: function updateTimestamp() view returns(uint256)
func (_OraclePod *OraclePodCaller) UpdateTimestamp(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _OraclePod.contract.Call(opts, &out, "updateTimestamp")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// UpdateTimestamp is a free data retrieval call binding the contract method 0x1c5be3d7.
//
// Solidity: function updateTimestamp() view returns(uint256)
func (_OraclePod *OraclePodSession) UpdateTimestamp() (*big.Int, error) {
	return _OraclePod.Contract.UpdateTimestamp(&_OraclePod.CallOpts)
}

// UpdateTimestamp is a free data retrieval call binding the contract method 0x1c5be3d7.
//
// Solidity: function updateTimestamp() view returns(uint256)
func (_OraclePod *OraclePodCallerSession) UpdateTimestamp() (*big.Int, error) {
	return _OraclePod.Contract.UpdateTimestamp(&_OraclePod.CallOpts)
}

// FillPrices is a paid mutator transaction binding the contract method 0x04e93f6e.
//
// Solidity: function fillPrices(uint256[] prices, uint256[] weights) returns()
func (_OraclePod *OraclePodTransactor) FillPrices(opts *bind.TransactOpts, prices []*big.Int, weights []*big.Int) (*types.Transaction, error) {
	return _OraclePod.contract.Transact(opts, "fillPrices", prices, weights)
}

// FillPrices is a paid mutator transaction binding the contract method 0x04e93f6e.
//
// Solidity: function fillPrices(uint256[] prices, uint256[] weights) returns()
func (_OraclePod *OraclePodSession) FillPrices(prices []*big.Int, weights []*big.Int) (*types.Transaction, error) {
	return _OraclePod.Contract.FillPrices(&_OraclePod.TransactOpts, prices, weights)
}

// FillPrices is a paid mutator transaction binding the contract method 0x04e93f6e.
//
// Solidity: function fillPrices(uint256[] prices, uint256[] weights) returns()
func (_OraclePod *OraclePodTransactorSession) FillPrices(prices []*big.Int, weights []*big.Int) (*types.Transaction, error) {
	return _OraclePod.Contract.FillPrices(&_OraclePod.TransactOpts, prices, weights)
}

// FillSymbolPrice is a paid mutator transaction binding the contract method 0x28bb986c.
//
// Solidity: function fillSymbolPrice(string price) returns()
func (_OraclePod *OraclePodTransactor) FillSymbolPrice(opts *bind.TransactOpts, price string) (*types.Transaction, error) {
	return _OraclePod.contract.Transact(opts, "fillSymbolPrice", price)
}

// FillSymbolPrice is a paid mutator transaction binding the contract method 0x28bb986c.
//
// Solidity: function fillSymbolPrice(string price) returns()
func (_OraclePod *OraclePodSession) FillSymbolPrice(price string) (*types.Transaction, error) {
	return _OraclePod.Contract.FillSymbolPrice(&_OraclePod.TransactOpts, price)
}

// FillSymbolPrice is a paid mutator transaction binding the contract method 0x28bb986c.
//
// Solidity: function fillSymbolPrice(string price) returns()
func (_OraclePod *OraclePodTransactorSession) FillSymbolPrice(price string) (*types.Transaction, error) {
	return _OraclePod.Contract.FillSymbolPrice(&_OraclePod.TransactOpts, price)
}

// Initialize is a paid mutator transaction binding the contract method 0x485cc955.
//
// Solidity: function initialize(address _initialOwner, address _oracleManager) returns()
func (_OraclePod *OraclePodTransactor) Initialize(opts *bind.TransactOpts, _initialOwner common.Address, _oracleManager common.Address) (*types.Transaction, error) {
	return _OraclePod.contract.Transact(opts, "initialize", _initialOwner, _oracleManager)
}

// Initialize is a paid mutator transaction binding the contract method 0x485cc955.
//
// Solidity: function initialize(address _initialOwner, address _oracleManager) returns()
func (_OraclePod *OraclePodSession) Initialize(_initialOwner common.Address, _oracleManager common.Address) (*types.Transaction, error) {
	return _OraclePod.Contract.Initialize(&_OraclePod.TransactOpts, _initialOwner, _oracleManager)
}

// Initialize is a paid mutator transaction binding the contract method 0x485cc955.
//
// Solidity: function initialize(address _initialOwner, address _oracleManager) returns()
func (_OraclePod *OraclePodTransactorSession) Initialize(_initialOwner common.Address, _oracleManager common.Address) (*types.Transaction, error) {
	return _OraclePod.Contract.Initialize(&_OraclePod.TransactOpts, _initialOwner, _oracleManager)
}

// RenounceOwnership is a paid mutator transaction binding the contract method 0x715018a6.
//
// Solidity: function renounceOwnership() returns()
func (_OraclePod *OraclePodTransactor) RenounceOwnership(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _OraclePod.contract.Transact(opts, "renounceOwnership")
}

// RenounceOwnership is a paid mutator transaction binding the contract method 0x715018a6.
//
// Solidity: function renounceOwnership() returns()
func (_OraclePod *OraclePodSession) RenounceOwnership() (*types.Transaction, error) {
	return _OraclePod.Contract.RenounceOwnership(&_OraclePod.TransactOpts)
}

// RenounceOwnership is a paid mutator transaction binding the contract method 0x715018a6.
//
// Solidity: function renounceOwnership() returns()
func (_OraclePod *OraclePodTransactorSession) RenounceOwnership() (*types.Transaction, error) {
	return _OraclePod.Contract.RenounceOwnership(&_OraclePod.TransactOpts)
}

// SetOracleManager is a paid mutator transaction binding the contract method 0x929e2e08.
//
// Solidity: function setOracleManager(address _oracleManager) returns()
func (_OraclePod *OraclePodTransactor) SetOracleManager(opts *bind.TransactOpts, _oracleManager common.Address) (*types.Transaction, error) {
	return _OraclePod.contract.Transact(opts, "setOracleManager", _oracleManager)
}

// SetOracleManager is a paid mutator transaction binding the contract method 0x929e2e08.
//
// Solidity: function setOracleManager(address _oracleManager) returns()
func (_OraclePod *OraclePodSession) SetOracleManager(_oracleManager common.Address) (*types.Transaction, error) {
	return _OraclePod.Contract.SetOracleManager(&_OraclePod.TransactOpts, _oracleManager)
}

// SetOracleManager is a paid mutator transaction binding the contract method 0x929e2e08.
//
// Solidity: function setOracleManager(address _oracleManager) returns()
func (_OraclePod *OraclePodTransactorSession) SetOracleManager(_oracleManager common.Address) (*types.Transaction, error) {
	return _OraclePod.Contract.SetOracleManager(&_OraclePod.TransactOpts, _oracleManager)
}

// TransferOwnership is a paid mutator transaction binding the contract method 0xf2fde38b.
//
// Solidity: function transferOwnership(address newOwner) returns()
func (_OraclePod *OraclePodTransactor) TransferOwnership(opts *bind.TransactOpts, newOwner common.Address) (*types.Transaction, error) {
	return _OraclePod.contract.Transact(opts, "transferOwnership", newOwner)
}

// TransferOwnership is a paid mutator transaction binding the contract method 0xf2fde38b.
//
// Solidity: function transferOwnership(address newOwner) returns()
func (_OraclePod *OraclePodSession) TransferOwnership(newOwner common.Address) (*types.Transaction, error) {
	return _OraclePod.Contract.TransferOwnership(&_OraclePod.TransactOpts, newOwner)
}

// TransferOwnership is a paid mutator transaction binding the contract method 0xf2fde38b.
//
// Solidity: function transferOwnership(address newOwner) returns()
func (_OraclePod *OraclePodTransactorSession) TransferOwnership(newOwner common.Address) (*types.Transaction, error) {
	return _OraclePod.Contract.TransferOwnership(&_OraclePod.TransactOpts, newOwner)
}

// OraclePodInitializedIterator is returned from FilterInitialized and is used to iterate over the raw logs and unpacked data for Initialized events raised by the OraclePod contract.
type OraclePodInitializedIterator struct {
	Event *OraclePodInitialized // Event containing the contract specifics and raw log

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
func (it *OraclePodInitializedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(OraclePodInitialized)
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
		it.Event = new(OraclePodInitialized)
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
func (it *OraclePodInitializedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *OraclePodInitializedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// OraclePodInitialized represents a Initialized event raised by the OraclePod contract.
type OraclePodInitialized struct {
	Version uint64
	Raw     types.Log // Blockchain specific contextual infos
}

// FilterInitialized is a free log retrieval operation binding the contract event 0xc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d2.
//
// Solidity: event Initialized(uint64 version)
func (_OraclePod *OraclePodFilterer) FilterInitialized(opts *bind.FilterOpts) (*OraclePodInitializedIterator, error) {

	logs, sub, err := _OraclePod.contract.FilterLogs(opts, "Initialized")
	if err != nil {
		return nil, err
	}
	return &OraclePodInitializedIterator{contract: _OraclePod.contract, event: "Initialized", logs: logs, sub: sub}, nil
}

// WatchInitialized is a free log subscription operation binding the contract event 0xc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d2.
//
// Solidity: event Initialized(uint64 version)
func (_OraclePod *OraclePodFilterer) WatchInitialized(opts *bind.WatchOpts, sink chan<- *OraclePodInitialized) (event.Subscription, error) {

	logs, sub, err := _OraclePod.contract.WatchLogs(opts, "Initialized")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(OraclePodInitialized)
				if err := _OraclePod.contract.UnpackLog(event, "Initialized", log); err != nil {
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
func (_OraclePod *OraclePodFilterer) ParseInitialized(log types.Log) (*OraclePodInitialized, error) {
	event := new(OraclePodInitialized)
	if err := _OraclePod.contract.UnpackLog(event, "Initialized", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// OraclePodMarketPriceUpdatedIterator is returned from FilterMarketPriceUpdated and is used to iterate over the raw logs and unpacked data for MarketPriceUpdated events raised by the OraclePod contract.
type OraclePodMarketPriceUpdatedIterator struct {
	Event *OraclePodMarketPriceUpdated // Event containing the contract specifics and raw log

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
func (it *OraclePodMarketPriceUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(OraclePodMarketPriceUpdated)
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
		it.Event = new(OraclePodMarketPriceUpdated)
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
func (it *OraclePodMarketPriceUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *OraclePodMarketPriceUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// OraclePodMarketPriceUpdated represents a MarketPriceUpdated event raised by the OraclePod contract.
type OraclePodMarketPriceUpdated struct {
	OldPrice  string
	Price     string
	Timestamp *big.Int
	Raw       types.Log // Blockchain specific contextual infos
}

// FilterMarketPriceUpdated is a free log retrieval operation binding the contract event 0x2d61ba9f6e09d0b52de7637251a6d3681e5f26bd9de88995b0e5bbae55d38d9a.
//
// Solidity: event MarketPriceUpdated(string oldPrice, string price, uint256 timestamp)
func (_OraclePod *OraclePodFilterer) FilterMarketPriceUpdated(opts *bind.FilterOpts) (*OraclePodMarketPriceUpdatedIterator, error) {

	logs, sub, err := _OraclePod.contract.FilterLogs(opts, "MarketPriceUpdated")
	if err != nil {
		return nil, err
	}
	return &OraclePodMarketPriceUpdatedIterator{contract: _OraclePod.contract, event: "MarketPriceUpdated", logs: logs, sub: sub}, nil
}

// WatchMarketPriceUpdated is a free log subscription operation binding the contract event 0x2d61ba9f6e09d0b52de7637251a6d3681e5f26bd9de88995b0e5bbae55d38d9a.
//
// Solidity: event MarketPriceUpdated(string oldPrice, string price, uint256 timestamp)
func (_OraclePod *OraclePodFilterer) WatchMarketPriceUpdated(opts *bind.WatchOpts, sink chan<- *OraclePodMarketPriceUpdated) (event.Subscription, error) {

	logs, sub, err := _OraclePod.contract.WatchLogs(opts, "MarketPriceUpdated")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(OraclePodMarketPriceUpdated)
				if err := _OraclePod.contract.UnpackLog(event, "MarketPriceUpdated", log); err != nil {
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

// ParseMarketPriceUpdated is a log parse operation binding the contract event 0x2d61ba9f6e09d0b52de7637251a6d3681e5f26bd9de88995b0e5bbae55d38d9a.
//
// Solidity: event MarketPriceUpdated(string oldPrice, string price, uint256 timestamp)
func (_OraclePod *OraclePodFilterer) ParseMarketPriceUpdated(log types.Log) (*OraclePodMarketPriceUpdated, error) {
	event := new(OraclePodMarketPriceUpdated)
	if err := _OraclePod.contract.UnpackLog(event, "MarketPriceUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// OraclePodOracleManagerUpdateIterator is returned from FilterOracleManagerUpdate and is used to iterate over the raw logs and unpacked data for OracleManagerUpdate events raised by the OraclePod contract.
type OraclePodOracleManagerUpdateIterator struct {
	Event *OraclePodOracleManagerUpdate // Event containing the contract specifics and raw log

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
func (it *OraclePodOracleManagerUpdateIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(OraclePodOracleManagerUpdate)
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
		it.Event = new(OraclePodOracleManagerUpdate)
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
func (it *OraclePodOracleManagerUpdateIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *OraclePodOracleManagerUpdateIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// OraclePodOracleManagerUpdate represents a OracleManagerUpdate event raised by the OraclePod contract.
type OraclePodOracleManagerUpdate struct {
	OldManagerAddress common.Address
	NewManagerAddress common.Address
	Raw               types.Log // Blockchain specific contextual infos
}

// FilterOracleManagerUpdate is a free log retrieval operation binding the contract event 0x4fa3394c69c77ebdd11178f49beb82f9fb98c08f03c354b555f536535bc8421e.
//
// Solidity: event OracleManagerUpdate(address oldManagerAddress, address newManagerAddress)
func (_OraclePod *OraclePodFilterer) FilterOracleManagerUpdate(opts *bind.FilterOpts) (*OraclePodOracleManagerUpdateIterator, error) {

	logs, sub, err := _OraclePod.contract.FilterLogs(opts, "OracleManagerUpdate")
	if err != nil {
		return nil, err
	}
	return &OraclePodOracleManagerUpdateIterator{contract: _OraclePod.contract, event: "OracleManagerUpdate", logs: logs, sub: sub}, nil
}

// WatchOracleManagerUpdate is a free log subscription operation binding the contract event 0x4fa3394c69c77ebdd11178f49beb82f9fb98c08f03c354b555f536535bc8421e.
//
// Solidity: event OracleManagerUpdate(address oldManagerAddress, address newManagerAddress)
func (_OraclePod *OraclePodFilterer) WatchOracleManagerUpdate(opts *bind.WatchOpts, sink chan<- *OraclePodOracleManagerUpdate) (event.Subscription, error) {

	logs, sub, err := _OraclePod.contract.WatchLogs(opts, "OracleManagerUpdate")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(OraclePodOracleManagerUpdate)
				if err := _OraclePod.contract.UnpackLog(event, "OracleManagerUpdate", log); err != nil {
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

// ParseOracleManagerUpdate is a log parse operation binding the contract event 0x4fa3394c69c77ebdd11178f49beb82f9fb98c08f03c354b555f536535bc8421e.
//
// Solidity: event OracleManagerUpdate(address oldManagerAddress, address newManagerAddress)
func (_OraclePod *OraclePodFilterer) ParseOracleManagerUpdate(log types.Log) (*OraclePodOracleManagerUpdate, error) {
	event := new(OraclePodOracleManagerUpdate)
	if err := _OraclePod.contract.UnpackLog(event, "OracleManagerUpdate", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// OraclePodOwnershipTransferredIterator is returned from FilterOwnershipTransferred and is used to iterate over the raw logs and unpacked data for OwnershipTransferred events raised by the OraclePod contract.
type OraclePodOwnershipTransferredIterator struct {
	Event *OraclePodOwnershipTransferred // Event containing the contract specifics and raw log

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
func (it *OraclePodOwnershipTransferredIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(OraclePodOwnershipTransferred)
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
		it.Event = new(OraclePodOwnershipTransferred)
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
func (it *OraclePodOwnershipTransferredIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *OraclePodOwnershipTransferredIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// OraclePodOwnershipTransferred represents a OwnershipTransferred event raised by the OraclePod contract.
type OraclePodOwnershipTransferred struct {
	PreviousOwner common.Address
	NewOwner      common.Address
	Raw           types.Log // Blockchain specific contextual infos
}

// FilterOwnershipTransferred is a free log retrieval operation binding the contract event 0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0.
//
// Solidity: event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
func (_OraclePod *OraclePodFilterer) FilterOwnershipTransferred(opts *bind.FilterOpts, previousOwner []common.Address, newOwner []common.Address) (*OraclePodOwnershipTransferredIterator, error) {

	var previousOwnerRule []interface{}
	for _, previousOwnerItem := range previousOwner {
		previousOwnerRule = append(previousOwnerRule, previousOwnerItem)
	}
	var newOwnerRule []interface{}
	for _, newOwnerItem := range newOwner {
		newOwnerRule = append(newOwnerRule, newOwnerItem)
	}

	logs, sub, err := _OraclePod.contract.FilterLogs(opts, "OwnershipTransferred", previousOwnerRule, newOwnerRule)
	if err != nil {
		return nil, err
	}
	return &OraclePodOwnershipTransferredIterator{contract: _OraclePod.contract, event: "OwnershipTransferred", logs: logs, sub: sub}, nil
}

// WatchOwnershipTransferred is a free log subscription operation binding the contract event 0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0.
//
// Solidity: event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
func (_OraclePod *OraclePodFilterer) WatchOwnershipTransferred(opts *bind.WatchOpts, sink chan<- *OraclePodOwnershipTransferred, previousOwner []common.Address, newOwner []common.Address) (event.Subscription, error) {

	var previousOwnerRule []interface{}
	for _, previousOwnerItem := range previousOwner {
		previousOwnerRule = append(previousOwnerRule, previousOwnerItem)
	}
	var newOwnerRule []interface{}
	for _, newOwnerItem := range newOwner {
		newOwnerRule = append(newOwnerRule, newOwnerItem)
	}

	logs, sub, err := _OraclePod.contract.WatchLogs(opts, "OwnershipTransferred", previousOwnerRule, newOwnerRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(OraclePodOwnershipTransferred)
				if err := _OraclePod.contract.UnpackLog(event, "OwnershipTransferred", log); err != nil {
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
func (_OraclePod *OraclePodFilterer) ParseOwnershipTransferred(log types.Log) (*OraclePodOwnershipTransferred, error) {
	event := new(OraclePodOwnershipTransferred)
	if err := _OraclePod.contract.UnpackLog(event, "OwnershipTransferred", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// OraclePodPriceUpdatedIterator is returned from FilterPriceUpdated and is used to iterate over the raw logs and unpacked data for PriceUpdated events raised by the OraclePod contract.
type OraclePodPriceUpdatedIterator struct {
	Event *OraclePodPriceUpdated // Event containing the contract specifics and raw log

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
func (it *OraclePodPriceUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(OraclePodPriceUpdated)
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
		it.Event = new(OraclePodPriceUpdated)
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
func (it *OraclePodPriceUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *OraclePodPriceUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// OraclePodPriceUpdated represents a PriceUpdated event raised by the OraclePod contract.
type OraclePodPriceUpdated struct {
	OldPrice  *big.Int
	NewPrice  *big.Int
	NodeCount *big.Int
	Timestamp *big.Int
	Raw       types.Log // Blockchain specific contextual infos
}

// FilterPriceUpdated is a free log retrieval operation binding the contract event 0xc6d3da45896ce1bca9d198309a2dbeea3c73a991748f8d88d796ffa06029de93.
//
// Solidity: event PriceUpdated(uint256 oldPrice, uint256 newPrice, uint256 nodeCount, uint256 timestamp)
func (_OraclePod *OraclePodFilterer) FilterPriceUpdated(opts *bind.FilterOpts) (*OraclePodPriceUpdatedIterator, error) {

	logs, sub, err := _OraclePod.contract.FilterLogs(opts, "PriceUpdated")
	if err != nil {
		return nil, err
	}
	return &OraclePodPriceUpdatedIterator{contract: _OraclePod.contract, event: "PriceUpdated", logs: logs, sub: sub}, nil
}

// WatchPriceUpdated is a free log subscription operation binding the contract event 0xc6d3da45896ce1bca9d198309a2dbeea3c73a991748f8d88d796ffa06029de93.
//
// Solidity: event PriceUpdated(uint256 oldPrice, uint256 newPrice, uint256 nodeCount, uint256 timestamp)
func (_OraclePod *OraclePodFilterer) WatchPriceUpdated(opts *bind.WatchOpts, sink chan<- *OraclePodPriceUpdated) (event.Subscription, error) {

	logs, sub, err := _OraclePod.contract.WatchLogs(opts, "PriceUpdated")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(OraclePodPriceUpdated)
				if err := _OraclePod.contract.UnpackLog(event, "PriceUpdated", log); err != nil {
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

// ParsePriceUpdated is a log parse operation binding the contract event 0xc6d3da45896ce1bca9d198309a2dbeea3c73a991748f8d88d796ffa06029de93.
//
// Solidity: event PriceUpdated(uint256 oldPrice, uint256 newPrice, uint256 nodeCount, uint256 timestamp)
func (_OraclePod *OraclePodFilterer) ParsePriceUpdated(log types.Log) (*OraclePodPriceUpdated, error) {
	event := new(OraclePodPriceUpdated)
	if err := _OraclePod.contract.UnpackLog(event, "PriceUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
