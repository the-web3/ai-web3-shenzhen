import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { anvil } from "wagmi/chains";

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";

export const wagmiConfig = createConfig({
  chains: [anvil],
  connectors: [injected()],
  transports: {
    [anvil.id]: http(rpcUrl),
  },
  ssr: true,
});

