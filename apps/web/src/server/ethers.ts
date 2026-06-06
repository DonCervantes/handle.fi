import { ethers } from "ethers";

let _provider: ethers.JsonRpcProvider | null = null;
let _deployer: ethers.Wallet | null = null;

export function getProvider(): ethers.JsonRpcProvider {
  if (_provider) return _provider;
  _provider = new ethers.JsonRpcProvider(process.env.ARBITRUM_SEPOLIA_RPC_URL);
  return _provider;
}

export function getDeployer(): ethers.Wallet {
  if (_deployer) return _deployer;
  _deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, getProvider());
  return _deployer;
}

// Backward compat exports
export const provider = new Proxy({} as ethers.JsonRpcProvider, {
  get(_, prop) {
    return (getProvider() as any)[prop];
  },
});

export const deployer = new Proxy({} as ethers.Wallet, {
  get(_, prop) {
    return (getDeployer() as any)[prop];
  },
});
