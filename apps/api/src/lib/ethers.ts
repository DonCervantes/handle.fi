import { ethers } from "ethers";

export const provider = new ethers.JsonRpcProvider(
  process.env.ARBITRUM_SEPOLIA_RPC_URL
);

export const deployer = new ethers.Wallet(
  process.env.DEPLOYER_PRIVATE_KEY!,
  provider
);
