import { expect } from "chai";
import { ethers } from "hardhat";

describe("CredentialRegistry", function () {
  it("should create and verify a credential", async function () {
    const [owner] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("CredentialRegistry");
    const registry = await Registry.deploy();

    const credId = ethers.keccak256(ethers.toUtf8Bytes("agent-1"));
    const credHash = ethers.keccak256(ethers.toUtf8Bytes("cred-hash"));
    const policyHash = ethers.keccak256(ethers.toUtf8Bytes("policy-hash"));

    await registry.createCredential(credId, credHash, policyHash);
    expect(await registry.verifyCredential(credId)).to.equal(true);
  });

  it("should revoke a credential", async function () {
    const [owner] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("CredentialRegistry");
    const registry = await Registry.deploy();

    const credId = ethers.keccak256(ethers.toUtf8Bytes("agent-2"));
    const credHash = ethers.keccak256(ethers.toUtf8Bytes("cred-hash-2"));
    const policyHash = ethers.keccak256(ethers.toUtf8Bytes("policy-hash-2"));

    await registry.createCredential(credId, credHash, policyHash);
    await registry.revokeCredential(credId);
    expect(await registry.verifyCredential(credId)).to.equal(false);
  });
});

describe("AuditRegistry", function () {
  it("should record and verify an action", async function () {
    const Audit = await ethers.getContractFactory("AuditRegistry");
    const audit = await Audit.deploy();

    const actionId = ethers.keccak256(ethers.toUtf8Bytes("action-1"));
    const actionHash = ethers.keccak256(ethers.toUtf8Bytes("hash-data"));

    await audit.recordAction(actionId, actionHash, "APPROVED");

    const entry = await audit.getEntry(actionId);
    expect(entry.decision).to.equal("APPROVED");
    expect(await audit.verifyAction(actionId, actionHash)).to.equal(true);
  });

  it("should not allow duplicate action records", async function () {
    const Audit = await ethers.getContractFactory("AuditRegistry");
    const audit = await Audit.deploy();

    const actionId = ethers.keccak256(ethers.toUtf8Bytes("action-dup"));
    const actionHash = ethers.keccak256(ethers.toUtf8Bytes("hash"));

    await audit.recordAction(actionId, actionHash, "APPROVED");
    await expect(
      audit.recordAction(actionId, actionHash, "APPROVED")
    ).to.be.revertedWith("Action already recorded");
  });
});
