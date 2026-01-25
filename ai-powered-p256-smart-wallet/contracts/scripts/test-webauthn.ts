const hre = require("hardhat");

async function main() {
  console.log("Deploying WebAuthnDebug contract...");
  
  const WebAuthnDebug = await hre.ethers.getContractFactory("WebAuthnDebug");
  const debug = await WebAuthnDebug.deploy();
  await debug.waitForDeployment();
  
  const debugAddress = await debug.getAddress();
  console.log(`WebAuthnDebug deployed at: ${debugAddress}`);
  
  // Test data from the failed transaction
  const signature = "0x050eb3a1048e6a1dde9bd2d384478cca1eec7e5171222c52d1f25eff7e214c5f7ceeccdcee9fa28ee5f0253a1fa6bee9770cc3dbd12913eee514db79313ee983002549960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97631d000000007b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a22626e44436f48456c75306b736d51414147592d36444d4a6c6b6a6b69734e6a5362435a74395a49564e6463222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a33303030222c2263726f73734f726967696e223a66616c73657d";
  
  const publicKeyX = "0xf81f8ea92c0cf33bc5df8b48884531f0d0f68f01e75c588c098673176034f1c5";
  const publicKeyY = "0xcc430dcb14c1855bb9f55319bb3f7972201e72696baf00721fbb58bc51b6d8f9";
  
  console.log("\nTesting signature parsing...");
  const result = await debug.testSignatureParsing(signature);
  
  console.log("\nParsed signature:");
  console.log("r:", result.r);
  console.log("s:", result.s);
  console.log("authDataLength:", result.authDataLength);
  console.log("clientDataHash:", result.clientDataHash);
  console.log("messageHash:", result.messageHash);
  
  // Expected from Go test
  const expectedMessageHash = "0x06b5160647d63df126b3e09fc2d9d010a0582743a465b8c85086a718bf411340";
  
  console.log("\nExpected messageHash:", expectedMessageHash);
  console.log("Computed messageHash:", result.messageHash);
  console.log("Match:", result.messageHash.toLowerCase() === expectedMessageHash.toLowerCase());
  
  console.log("\nTesting P-256 verification...");
  const isValid = await debug.testP256Verify(
    result.messageHash,
    result.r,
    result.s,
    publicKeyX,
    publicKeyY
  );
  
  console.log("P-256 verification result:", isValid);
  
  if (!isValid) {
    console.log("\n❌ RIP-7212 precompile returned false!");
    console.log("This means either:");
    console.log("  1. The precompile has a bug");
    console.log("  2. The messageHash computation is wrong");
    console.log("  3. The public key doesn't match");
  } else {
    console.log("\n✅ Verification successful!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
