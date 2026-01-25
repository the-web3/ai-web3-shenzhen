GITCOMMIT := $(shell git rev-parse HEAD)
GITDATE := $(shell git show -s --format='%ct')

LDFLAGSSTRING +=-X main.GitCommit=$(GITCOMMIT)
LDFLAGSSTRING +=-X main.GitDate=$(GITDATE)
LDFLAGS := -ldflags "$(LDFLAGSSTRING)"

BLSApkRegistryAbiPath := ./abis/BLSApkRegistry.sol/BLSApkRegistry.json
OracleManagerAbiPath := ./abis/OracleManager.sol/OracleManager.json
OraclePodAbiPath := ./abis/OraclePod.sol/OraclePod.json

build:
	env GO111MODULE=on go build -o oracle-node ./cmd

clean:
	rm oracle-node

test:
	go test -v ./...

lint:
	golangci-lint run ./...

compile:
	cd ./l2fp-contracts && forge install && forge build && cd ../

bindings: binding-bls binding-oracle binding-oracle-manager


binding-bls:
	$(eval temp := $(shell mktemp))

	cat $(BLSApkRegistryAbiPath) \
    	| jq -r .bytecode.object > $(temp)

	cat $(BLSApkRegistryAbiPath) \
		| jq .abi \
		| abigen --pkg bls \
		--abi - \
		--out bindings/bls/bls_apk_registry.go \
		--type BLSApkRegistry \
		--bin $(temp)

		rm $(temp)


binding-oracle:
	$(eval temp := $(shell mktemp))

	cat $(OraclePodAbiPath) \
    	| jq -r .bytecode.object > $(temp)

	cat $(OraclePodAbiPath) \
		| jq .abi \
		| abigen --pkg oracle \
		--abi - \
		--out bindings/oracle/oracle_pod.go \
		--type OraclePod \
		--bin $(temp)

		rm $(temp)


binding-oracle-manager:
	$(eval temp := $(shell mktemp))

	cat $(OracleManagerAbiPath) \
    	| jq -r .bytecode.object > $(temp)

	cat $(OracleManagerAbiPath) \
		| jq .abi \
		| abigen --pkg oracle \
		--abi - \
		--out bindings/oracle/oracle_manager.go \
		--type OracleManager \
		--bin $(temp)

		rm $(temp)


.PHONY: \
	 build \
	 compile \
	 bindings \
	 binding-bls \
	 binding-oracle \
	 binding-oracle-manage \
	 clean \
	 test \
	 lint \