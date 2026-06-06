import { ethers } from "ethers";
import { deployer } from "../lib/ethers";

// ── Single unified contract ABI ────────────────────────────────
const HANDLE_REGISTRY_ABI = [
  // Credentials
  "function createCredential(bytes32 credentialId, bytes32 credentialHash, bytes32 policyHash) external",
  "function revokeCredential(bytes32 credentialId) external",
  "function verifyCredential(bytes32 credentialId) external view returns (bool)",
  "function getCredential(bytes32 credentialId) external view returns (address, bytes32, bytes32, bool, uint256)",
  // Audit
  "function recordAction(bytes32 actionId, bytes32 credentialId, bytes32 actionHash, string decision) external",
  "function verifyAction(bytes32 actionId, bytes32 expectedHash) external view returns (bool)",
  "function getAudit(bytes32 actionId) external view returns (bytes32, string, bytes32, uint256, address)",
  // Counters
  "function totalCredentials() external view returns (uint256)",
  "function totalActions() external view returns (uint256)",
  // Events
  "event CredentialCreated(bytes32 indexed credentialId, address indexed owner, bytes32 policyHash, uint256 timestamp)",
  "event CredentialRevoked(bytes32 indexed credentialId, uint256 timestamp)",
  "event ActionAudited(bytes32 indexed actionId, bytes32 indexed credentialId, string decision, uint256 timestamp)",
];

function getHandleRegistry() {
  const address = process.env.HANDLE_REGISTRY_ADDRESS;
  if (!address) throw new Error("HANDLE_REGISTRY_ADDRESS not set");
  return new ethers.Contract(address, HANDLE_REGISTRY_ABI, deployer);
}

// ── Hashing helper ─────────────────────────────────────────────
export function computeActionHash(
  actionId: string,
  decision: string,
  policyHash: string,
  timestamp: number
): string {
  return ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["string", "string", "string", "uint256"],
      [actionId, decision, policyHash, timestamp]
    )
  );
}

// ── Record action audit on-chain ───────────────────────────────
export async function recordAuditOnChain(
  actionId: string,
  decision: string,
  policyHash: string,
  credentialId: string = "demo-credential"
): Promise<{ txHash: string; actionHash: string }> {
  const timestamp = Math.floor(Date.now() / 1000);
  const actionHash = computeActionHash(actionId, decision, policyHash, timestamp);

  const actionIdBytes = ethers.keccak256(ethers.toUtf8Bytes(actionId));
  const credentialIdBytes = ethers.keccak256(ethers.toUtf8Bytes(credentialId));

  const contract = getHandleRegistry();
  const tx = await contract.recordAction(
    actionIdBytes,
    credentialIdBytes,
    actionHash as `0x${string}`,
    decision
  );
  const receipt = await tx.wait();

  return { txHash: receipt.hash, actionHash };
}

// ── Register a new credential on-chain ─────────────────────────
export async function registerCredentialOnChain(
  credentialId: string,
  credentialHash: string,
  policyHash: string
): Promise<string> {
  const credentialIdBytes = ethers.keccak256(ethers.toUtf8Bytes(credentialId));
  const credentialHashBytes = credentialHash.startsWith("0x") && credentialHash.length === 66
    ? (credentialHash as `0x${string}`)
    : ethers.keccak256(ethers.toUtf8Bytes(credentialHash));
  const policyHashBytes = policyHash.startsWith("0x") && policyHash.length === 66
    ? (policyHash as `0x${string}`)
    : ethers.keccak256(ethers.toUtf8Bytes(policyHash));

  const contract = getHandleRegistry();
  const tx = await contract.createCredential(
    credentialIdBytes,
    credentialHashBytes,
    policyHashBytes
  );
  const receipt = await tx.wait();
  return receipt.hash;
}

// ── Read global stats from the registry ────────────────────────
export async function getRegistryStats() {
  try {
    const contract = getHandleRegistry();
    const [totalCredentials, totalActions] = await Promise.all([
      contract.totalCredentials(),
      contract.totalActions(),
    ]);
    return {
      totalCredentials: Number(totalCredentials),
      totalActions: Number(totalActions),
      contractAddress: process.env.HANDLE_REGISTRY_ADDRESS,
    };
  } catch (err) {
    console.error("[Registry stats] error:", err);
    return { totalCredentials: 0, totalActions: 0, contractAddress: null };
  }
}
