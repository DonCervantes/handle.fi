"use client";
import { PrivyProvider } from "@privy-io/react-auth";

const arbitrumSepolia = {
  id: 421614,
  name: "Arbitrum Sepolia",
  network: "arbitrum-sepolia",
  nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://sepolia-rollup.arbitrum.io/rpc"] },
    public: { http: ["https://sepolia-rollup.arbitrum.io/rpc"] },
  },
  blockExplorers: {
    default: { name: "Arbiscan", url: "https://sepolia.arbiscan.io" },
  },
  testnet: true,
};

export function PrivyWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ["email", "wallet"],
        appearance: {
          theme: "dark",
          accentColor: "#7c3aed",
        },
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
        defaultChain: arbitrumSepolia as any,
        supportedChains: [arbitrumSepolia as any],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
