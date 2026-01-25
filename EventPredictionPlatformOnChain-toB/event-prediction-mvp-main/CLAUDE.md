# Event Prediction Frontend

## Project Overview

This is a **Prediction Market dApp** built on **Scaffold-ETH 2 (SE-2)**. Users can create events, place orders on outcomes, and settle predictions. The system uses a Vendor model where each Vendor manages their own prediction markets.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Web3**: RainbowKit, Wagmi, Viem
- **Database**: Supabase (PostgreSQL)
- **Auth**: Wallet signature + JWT
- **Smart Contracts**: Hardhat (EVM)
- **Styling**: Tailwind CSS, DaisyUI

## Monorepo Structure

```
packages/
├── nextjs/          # Frontend application
│   ├── app/         # Next.js App Router pages & API routes
│   ├── components/  # React components
│   ├── hooks/       # Custom hooks (including scaffold-eth hooks)
│   ├── lib/         # Utilities, auth, supabase clients
│   └── contracts/   # Contract ABIs (deployedContracts.ts, externalContracts.ts)
├── hardhat/         # Smart contracts
│   ├── contracts/   # Solidity contracts
│   ├── deploy/      # Deployment scripts
│   └── test/        # Contract tests
supabase/
├── schema.sql       # Database schema
└── seed.sql         # Test data
```

## Key Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page (redirects based on auth) |
| `/join` | Join vendor via invite code |
| `/home` | Event list for authenticated users |
| `/event/[eventId]` | Event details with orderbook |
| `/portfolio` | User positions and orders |
| `/dapp` | Vendor management dashboard |
| `/admin` | Platform admin panel |
| `/apply` | Apply to become a vendor |

## API Routes

```
/api/auth/verify     # POST - Wallet signature verification
/api/auth/me         # GET - Current user info
/api/events          # GET/POST - Events CRUD
/api/orders          # GET/POST - Orders CRUD
/api/portfolio       # GET - User positions
/api/invite/*        # Invite code management
/api/dapp/*          # Vendor management
/api/admin/*         # Admin operations
```

## Database Tables

- `vendors` - Vendor organizations
- `vendor_invite_codes` - Invite codes for joining vendors
- `user_vendors` - User-Vendor membership
- `events` - Prediction events
- `orders` - Order book entries
- `admin_users` - Platform administrators
- `vendor_applications` - Vendor registration applications

## Smart Contract Interaction

Use SE-2 hooks for all contract interactions:

```typescript
// Reading from contract
const { data } = useScaffoldReadContract({
  contractName: "YourContract",
  functionName: "functionName",
  args: [arg1, arg2],
});

// Writing to contract
const { writeContractAsync } = useScaffoldWriteContract({
  contractName: "YourContract"
});
await writeContractAsync({
  functionName: "functionName",
  args: [arg1, arg2],
  value: parseEther("0.1"), // for payable
});

// Watching events
const { data: events } = useScaffoldEventHistory({
  contractName: "YourContract",
  eventName: "EventName",
  watch: true,
});
```

## Authentication Flow

1. User connects wallet via RainbowKit
2. Frontend requests signature of a challenge message
3. `POST /api/auth/verify` validates signature, returns JWT
4. JWT stored in httpOnly cookie (`auth-token`)
5. `useAuth()` hook provides auth state across app

```typescript
const { user, isAuthenticated, signIn, signOut } = useAuth();
```

## Display Components

Use SE-2 components for blockchain data:

- `<Address address="0x..." />` - Display ETH address
- `<AddressInput onChange={setAddress} />` - Address input
- `<Balance address="0x..." />` - Show balance
- `<EtherInput value={amount} onChange={setAmount} />` - ETH input

## Formatting Utilities

```typescript
import { formatTokenAmount, formatPrice, formatAddress } from "~~/lib/utils/format";

formatTokenAmount(amount)     // Handles both wei and decimal formats
formatPrice(6500)             // "65.00%" (basis points to percentage)
formatAddress("0x...")        // "0x1234...5678"
```

## Environment Variables

Required in `packages/nextjs/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=                    # Min 32 chars
NEXT_PUBLIC_TARGET_CHAIN_ID=   # 31337 for local
```

## Development Commands

```bash
yarn chain       # Start local Hardhat node
yarn deploy      # Deploy contracts
yarn start       # Start frontend (port 3000)
```

## Code Conventions

1. **File naming**: kebab-case for files, PascalCase for components
2. **API responses**: Always return `{ success, data?, error? }`
3. **Database**: Use `supabaseAdmin` for server-side, `supabaseClient` for client
4. **Auth**: Always validate JWT in API routes via `verifyAuth()`
5. **Addresses**: Always lowercase for comparisons, use `normalizeAddress()`
6. **Amounts**: Database stores NUMERIC(36,18) as decimals, not wei

## Important Notes

- Price is stored in **basis points** (0-10000 = 0%-100%)
- Order side: `0` = Sell, `1` = Buy
- Event status: `0` = Created, `1` = Active, `2` = Settled, `3` = Cancelled
- Invite status: `0` = Revoked, `1` = Active, `2` = Expired
