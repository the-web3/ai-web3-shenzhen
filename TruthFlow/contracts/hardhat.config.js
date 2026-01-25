require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.22",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true  // 启用 IR 优化，解决栈深度问题
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    hashkeyTestnet: {
      url: process.env.HASHKEY_RPC_URL || "https://hashkeychain-testnet.alt.technology",
      chainId: 133,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  etherscan: {}
};
