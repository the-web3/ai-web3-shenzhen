# x402 Stack (Fast-Run Skeleton)

Minimal, runnable monorepo for:
- `apps/fact-api`: Event API with paid `/attest`.
- `apps/facilitator`: x402 verify/settle (dev dry-run).
- `apps/mcp-server`: MCP tools for Claude Code.
- `packages/shared`: Zod schemas.

## Quick start

1) Install dependencies

```
npm install
```

2) Copy env samples and edit values

```
cp apps/fact-api/env.sample apps/fact-api/.env
cp apps/facilitator/env.sample apps/facilitator/.env
cp apps/mcp-server/env.sample apps/mcp-server/.env
```

3) Run services (separate terminals)

```
npm run dev:facilitator
npm run dev:fact
npm run dev:mcp
```

## MCP one-click flow (Cursor)

1) Add MCP server config (project root: `.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "x402-mcp": {
      "command": "npx",
      "args": ["tsx", "apps/mcp-server/src/server.ts"],
      "cwd": "/mnt/c/Users/cyh/Desktop/x402",
      "env": {
        "FACT_API_URL": "http://localhost:8787"
      }
    }
  }
}
```

2) In Cursor, enable the MCP server `x402-mcp`.

3) Ask AI to run the full flow (example prompt)

```
Use MCP tools to run the full flow:
1) register_event
2) resolve_event
3) get_attestation

Use eventId: event-001, outcome YES, and a simple evidence item.
```

Chinese prompt example (detailed scenario)
```
请使用 MCP tools 运行完整流程（register_event -> resolve_event -> get_attestation），
场景：电竞比赛结果。

事件：
- id: match-2026-01-24-001
- title: CS2 Grand Final: Team A vs Team B
- description: Outcome: Team A win
- deadline: 2026-01-24T24:00:00.000Z
- sourceUrls:
  - https://example.com/tournament/bracket
  - https://example.com/tournament/results

证据：
- outcome: YES
- items:
  - source: official-site
  - url: https://example.com/tournament/results
  - excerpt: Final result: Team A 3 - 1 Team B
  - observedAt: 2026-01-24T21:30:00.000Z
```

4) Manual tool arguments (if you prefer)

register_event
```json
{
  "id": "event-001",
  "title": "HashKey Testnet block height >= 1000",
  "description": "Check block height threshold",
  "deadline": "2030-01-01T00:00:00.000Z",
  "sourceUrls": ["https://testnet.hsk.xyz"]
}
```

resolve_event
```json
{
  "eventId": "event-001",
  "outcome": "YES",
  "items": [
    {
      "source": "rpc",
      "url": "https://testnet.hsk.xyz",
      "excerpt": "block height >= 1000",
      "observedAt": "2026-01-24T12:00:00.000Z"
    }
  ]
}
```

get_attestation
```json
{
  "eventId": "event-001"
}
```

## Example scenarios (detailed)

### Scenario A: Esports match result

**Goal**: pay to get a signed attestation of a match outcome (TEAM_A win).

Event setup (register_event)
```json
{
  "id": "match-2026-01-24-001",
  "title": "CS2 Grand Final: Team A vs Team B",
  "description": "Outcome: Team A win",
  "deadline": "2026-01-24T20:00:00.000Z",
  "sourceUrls": [
    "https://example.com/tournament/bracket",
    "https://example.com/tournament/results"
  ]
}
```

Evidence submission (resolve_event)
```json
{
  "eventId": "match-2026-01-24-001",
  "outcome": "YES",
  "items": [
    {
      "source": "official-site",
      "url": "https://example.com/tournament/results",
      "excerpt": "Final result: Team A 3 - 1 Team B",
      "observedAt": "2026-01-24T21:30:00.000Z"
    }
  ]
}
```

Paid proof retrieval (get_attestation)
```json
{
  "eventId": "match-2026-01-24-001"
}
```

**Returns**: attestation + evidence + txHash, which can be used in an on-chain resolver contract.

### Scenario B: Crypto event (token listing)

**Goal**: pay to get a signed attestation that a token was listed on an exchange.

Event setup (register_event)
```json
{
  "id": "listing-2026-01-24-xyz",
  "title": "Token XYZ listed on Exchange Z",
  "description": "Outcome: listing confirmed",
  "deadline": "2026-01-25T00:00:00.000Z",
  "sourceUrls": [
    "https://exchange.example.com/announcements"
  ]
}
```

Evidence submission (resolve_event)
```json
{
  "eventId": "listing-2026-01-24-xyz",
  "outcome": "YES",
  "items": [
    {
      "source": "exchange-announcement",
      "url": "https://exchange.example.com/announcements/xyz",
      "excerpt": "We will list XYZ at 10:00 UTC",
      "observedAt": "2026-01-24T09:55:00.000Z"
    }
  ]
}
```

Paid proof retrieval (get_attestation)
```json
{
  "eventId": "listing-2026-01-24-xyz"
}
```

**Returns**: attestation + evidence + txHash.

### Scenario C: Sports match result

**Goal**: pay to get a signed attestation of a football match outcome.

Event setup (register_event)
```json
{
  "id": "football-2026-01-24-ars-che",
  "title": "Premier League: Arsenal vs Chelsea",
  "description": "Outcome: Arsenal win",
  "deadline": "2026-01-24T18:00:00.000Z",
  "sourceUrls": [
    "https://example.com/league/schedule",
    "https://example.com/league/results"
  ]
}
```

Evidence submission (resolve_event)
```json
{
  "eventId": "football-2026-01-24-ars-che",
  "outcome": "YES",
  "items": [
    {
      "source": "official-league",
      "url": "https://example.com/league/results",
      "excerpt": "Arsenal 2 - 0 Chelsea",
      "observedAt": "2026-01-24T19:50:00.000Z"
    }
  ]
}
```

Paid proof retrieval (get_attestation)
```json
{
  "eventId": "football-2026-01-24-ars-che"
}
```

**Returns**: attestation + evidence + txHash.

## Deploy testnet token (EIP-3009)

```
cd packages/contracts
cp env.sample .env
npm install
npm run compile
npm run deploy
```

After deploy, set:
- `PAYMENT_ASSET` in `apps/fact-api/.env` to the deployed token address.

Mint test tokens:

```
cd packages/contracts
npm run mint
```

## Env vars

Fact API (`apps/fact-api/.env`)
- `PORT`: HTTP server port
- `FACILITATOR_URL`: self-hosted facilitator base URL
- `PAYMENT_ASSET`: EIP-3009 token address
- `PAYMENT_NETWORK`: CAIP-2 network id (e.g. `eip155:133`)
- `PAYMENT_SCHEME`: x402 scheme (`exact`)
- `PAYMENT_PRICE`: token price in smallest unit
- `ATTESTOR_PRIVATE_KEY`: signer private key (0x + 64 hex)
- `DEV_BYPASS_PAYMENT`: `true` to skip payment checks

Facilitator (`apps/facilitator/.env`)
- `PORT`: HTTP server port
- `RPC_URL`: chain RPC URL
- `NETWORK`: CAIP-2 network id (e.g. `eip155:133`)
- `DRY_RUN`: `true` to skip on-chain settlement
- `SETTLE_TX_HASH`: dummy tx hash for dry-run
- `TOKEN_ADDRESS`: EIP-3009 token address
- `SETTLE_PRIVATE_KEY`: hot wallet key for settlement

MCP Server (`apps/mcp-server/.env`)
- `FACT_API_URL`: Fact API base URL
- `BUYER_PRIVATE_KEY`: buyer wallet private key (for auto payment)
- `BUYER_RPC_URL`: RPC URL for signing/chain info
- `BUYER_CHAIN_ID`: chain id (e.g. `133`)
- `PAYMENT_TOKEN_NAME`: token name fallback

## Notes

- `apps/fact-api` uses `DEV_BYPASS_PAYMENT=true` by default for fastest testing.
- `apps/facilitator` runs with `DRY_RUN=true` and returns a dummy `txHash`.
- To implement real `transferWithAuthorization`, extend `apps/facilitator/src/server.ts`.
- The facilitator expects `PAYMENT-SIGNATURE` to be JSON (or base64-encoded JSON) with fields: `from`, `to`, `value`, `validAfter`, `validBefore`, `nonce`, `v`, `r`, `s`.
