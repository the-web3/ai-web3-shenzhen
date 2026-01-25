import { envAddress, envNumber } from "./constants";

export function getEnv() {
  // Prefer env vars (local overrides). For smooth MVP demo, fallback to the repo's current
  // default deployment addresses (copied from `rwa-contracts/deployed_addresses.json`).
  //
  // NOTE: We intentionally do NOT import JSON from outside the Next.js app directory,
  // because Turbopack/Next may block cross-directory imports for Client Components.
  const DEFAULTS = {
    rwaManager: "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d",
    rwa1155: "0x68B1D87F95878fE05B998F19b66F4baba5De1aed",
    oraclePod: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
    tokenId1: 1,
    tokenId2: 2,
    // Anvil default accounts
    issuer: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    compliance: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  } as const;

  const rwaManager = envAddress("NEXT_PUBLIC_RWA_MANAGER_ADDRESS") ?? (DEFAULTS.rwaManager as `0x${string}`);
  const rwa1155 = envAddress("NEXT_PUBLIC_RWA1155_ADDRESS") ?? (DEFAULTS.rwa1155 as `0x${string}`);
  const oraclePod = envAddress("NEXT_PUBLIC_ORACLE_POD_ADDRESS") ?? (DEFAULTS.oraclePod as `0x${string}`);
  const tokenId1 = envNumber("NEXT_PUBLIC_TOKEN_ID_1", DEFAULTS.tokenId1);
  const tokenId2 = envNumber("NEXT_PUBLIC_TOKEN_ID_2", DEFAULTS.tokenId2);
  const issuer = envAddress("NEXT_PUBLIC_ISSUER_ADDRESS") ?? (DEFAULTS.issuer as `0x${string}`);
  const compliance = envAddress("NEXT_PUBLIC_COMPLIANCE_ADDRESS") ?? (DEFAULTS.compliance as `0x${string}`);

  return { rwaManager, rwa1155, oraclePod, tokenId1, tokenId2, issuer, compliance };
}
