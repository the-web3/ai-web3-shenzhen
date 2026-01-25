const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const { ethers, upgrades } = hre;

  console.log("Deploying TruthArenaUpgradeable (UUPS Proxy)...");

  const [deployer] = await ethers.getSigners();
  const TruthArenaUpgradeable = await ethers.getContractFactory("TruthArenaUpgradeable");
  const oracleAddress = deployer.address;

  const proxy = await upgrades.deployProxy(TruthArenaUpgradeable, [oracleAddress], {
    initializer: "initialize",
    kind: "uups"
  });

  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  const deploymentInfo = {
    network: hre.network.name,
    proxyAddress,
    implementationAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };

  const deploymentPath = path.join(__dirname, "../config/deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  const configPath = path.join(__dirname, "../config/contractConfig.ts");
  if (fs.existsSync(configPath)) {
    const config = fs.readFileSync(configPath, "utf8");
    const updatedConfig = config.replace(
      /POLYMARKET_CONTRACT_ADDRESS:\s*['"]0x[a-fA-F0-9]{40}['"]/,
      `POLYMARKET_CONTRACT_ADDRESS: '${proxyAddress}'`
    );
    fs.writeFileSync(configPath, updatedConfig);
  }

  console.log("Proxy:", proxyAddress);
  console.log("Implementation:", implementationAddress);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
