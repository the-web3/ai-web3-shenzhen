package main

import (
	"context"
	"crypto/ecdsa"
	"encoding/hex"
	"errors"
	"fmt"
	"os"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/log"
	"github.com/urfave/cli/v2"

	"github.com/cpchain-network/oracle-node/common/cliapp"
	"github.com/cpchain-network/oracle-node/config"
	"github.com/cpchain-network/oracle-node/manager"
	"github.com/cpchain-network/oracle-node/node"
	"github.com/cpchain-network/oracle-node/node/conversion"
	"github.com/cpchain-network/oracle-node/sign"
	"github.com/cpchain-network/oracle-node/store"
	"github.com/cpchain-network/oracle-node/ws/server"
)

var (
	PrivateKeyFlagName     = "private-key"
	KeyPairFlagName        = "key-pair"
	DefaultPubKeyFilename  = "on_bls.pub"
	DefaultPrivKeyFilename = "on_bls.piv"
)

var (
	ConfigFlag = &cli.StringFlag{
		Name:    "config",
		Value:   "./oracle-node.yaml",
		Aliases: []string{"c"},
		Usage:   "path to config file",
		EnvVars: []string{"ORACLE_NODE_CONFIG"},
	}
	PrivateKeyFlag = &cli.StringFlag{
		Name:    PrivateKeyFlagName,
		Usage:   "Private Key corresponding to oracle node",
		EnvVars: []string{"ORACLE_NODE_PRIVATE_KEY"},
	}
	KeyPairFlag = &cli.StringFlag{
		Name:    KeyPairFlagName,
		Usage:   "key pair corresponding to oracle node",
		EnvVars: []string{"ORACLE_NODE_KEY_PAIR"},
	}
)

func newCli(GitCommit string, GitDate string) *cli.App {
	nodeFlags := []cli.Flag{ConfigFlag, PrivateKeyFlag, KeyPairFlag}
	managerFlags := []cli.Flag{ConfigFlag, PrivateKeyFlag}
	peerIDFlags := []cli.Flag{PrivateKeyFlag}
	return &cli.App{
		Version:              VersionWithCommit(GitCommit, GitDate),
		Description:          "A Oracle Price Data Feed",
		EnableBashCompletion: true,
		Commands: []*cli.Command{
			{
				Name:        "node",
				Flags:       nodeFlags,
				Description: "Runs the oracle node service",
				Action:      cliapp.LifecycleCmd(runNode),
			},
			{
				Name:        "manager",
				Flags:       managerFlags,
				Description: "Runs the oracle manager service",
				Action:      cliapp.LifecycleCmd(runManager),
			},
			{
				Name:        "parse-peer-id",
				Flags:       peerIDFlags,
				Description: "Parse peer id of the key",
				Action:      runParsePeerID,
			},
			{
				Name:        "version",
				Description: "print version",
				Action: func(ctx *cli.Context) error {
					cli.ShowVersion(ctx)
					return nil
				},
			},
		},
	}
}

func runNode(ctx *cli.Context, shutdown context.CancelCauseFunc) (cliapp.Lifecycle, error) {
	logger := log.NewLogger(log.NewTerminalHandlerWithLevel(os.Stdout, log.LevelDebug, true))
	log.SetDefault(logger)

	cfg, err := config.NewConfig(ctx.String(ConfigFlag.Name))
	if err != nil {
		log.Error("failed to load config", "err", err)
		return nil, err
	}

	var privKey *ecdsa.PrivateKey
	var shouldRegister bool
	if ctx.IsSet(PrivateKeyFlagName) {
		privKey, err = crypto.HexToECDSA(ctx.String(PrivateKeyFlagName))
		if err != nil {
			return nil, err
		}
	} else {
		return nil, errors.New("need to config private key")
	}

	var keyPairs *sign.KeyPair
	if ctx.IsSet(KeyPairFlagName) {
		keyPairs, err = sign.MakeKeyPairFromString(ctx.String(KeyPairFlagName))
		if err != nil {
			return nil, err
		}
	} else {
		privKeyPath := cfg.Node.KeyPath + "/" + DefaultPrivKeyFilename
		pubKeyPath := cfg.Node.KeyPath + "/" + DefaultPubKeyFilename
		if _, err := os.Stat(privKeyPath); err == nil {
			privKeyData, err := os.ReadFile(privKeyPath)
			if err != nil {
				return nil, err
			}
			keyPairs, err = sign.MakeKeyPairFromString(string(privKeyData))
			if err != nil {
				return nil, err
			}
		} else if errors.Is(err, os.ErrNotExist) {
			keyPairs, err = sign.GenRandomBlsKeys()
			if err != nil {
				return nil, err
			}
			err = os.WriteFile(pubKeyPath, []byte(keyPairs.PubKey.String()), 0o600)
			if err != nil {
				return nil, err
			}
			err = os.WriteFile(privKeyPath, []byte(keyPairs.PrivKey.String()), 0o600)
			if err != nil {
				return nil, err
			}
			shouldRegister = true
		} else {
			return nil, err
		}
	}
	logger.Info("create keyPairs", "pubkey:", keyPairs.PubKey.String())
	logger.Info("should register", "is", shouldRegister)

	db, err := store.NewStorage(cfg.Node.LevelDbFolder)
	if err != nil {
		return nil, err
	}

	return node.NewOracleNode(ctx.Context, db, privKey, keyPairs, shouldRegister, cfg, logger, shutdown)
}

func runManager(ctx *cli.Context, shutdown context.CancelCauseFunc) (cliapp.Lifecycle, error) {
	logger := log.NewLogger(log.NewTerminalHandlerWithLevel(os.Stdout, log.LevelDebug, true))
	log.SetDefault(logger)

	cfg, err := config.NewConfig(ctx.String(ConfigFlag.Name))
	if err != nil {
		log.Error("failed to load config", "err", err)
		return nil, err
	}

	var privKey *ecdsa.PrivateKey
	if ctx.IsSet(PrivateKeyFlagName) {
		privKey, err = crypto.HexToECDSA(ctx.String(PrivateKeyFlagName))
		if err != nil {
			return nil, err
		}
	} else {
		return nil, errors.New("need to config private key")
	}

	db, err := store.NewStorage(cfg.Manager.LevelDbFolder)
	if err != nil {
		return nil, err
	}

	wsServer, err := server.NewWSServer(cfg.Manager.WsAddr)
	if err != nil {
		return nil, err
	}
	return manager.NewOracleManager(ctx.Context, db, wsServer, cfg, shutdown, logger, privKey)
}

func runParsePeerID(ctx *cli.Context) error {
	privateKey := ctx.String(PrivateKeyFlag.Name)

	var publicBz []byte
	if len(privateKey) != 0 {
		privKey, err := crypto.HexToECDSA(privateKey)
		if err != nil {
			return err
		}
		pubkeybytes := crypto.CompressPubkey(&privKey.PublicKey)
		publicBz = pubkeybytes
	} else {
		return errors.New("pri-key needs to be specified")
	}
	pubkeyHex := hex.EncodeToString(publicBz)
	fmt.Println(fmt.Sprintf("pub key is (%s)", pubkeyHex))

	peerId, err := conversion.GetPeerIDFromSecp256PubKey(publicBz)
	if err != nil {
		return err
	}
	fmt.Println(fmt.Sprintf("peerId is (%s)", peerId))
	return nil
}
