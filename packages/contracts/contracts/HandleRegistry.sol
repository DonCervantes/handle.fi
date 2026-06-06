// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title HandleRegistry
/// @notice Single registry combining KYA credentials + audit trail for Handle.Fi
/// @dev Replaces CredentialRegistry + AuditRegistry. One contract, two responsibilities.
contract HandleRegistry {
    // ── Credential structure (KYA) ──────────────────────────────
    struct Credential {
        address owner;
        bytes32 credentialHash;
        bytes32 policyHash;
        bool active;
        uint256 createdAt;
    }

    // ── Audit entry structure ───────────────────────────────────
    struct AuditEntry {
        bytes32 actionHash;
        string decision;   // "APPROVED" | "REJECTED"
        bytes32 credentialId; // links action to the credential that authorized it
        uint256 timestamp;
        address submitter;
    }

    // ── State ───────────────────────────────────────────────────
    mapping(bytes32 => Credential) public credentials;
    mapping(bytes32 => AuditEntry) public auditEntries;

    // Quick counter so UIs can show "X actions audited"
    uint256 public totalCredentials;
    uint256 public totalActions;

    // ── Events ──────────────────────────────────────────────────
    event CredentialCreated(
        bytes32 indexed credentialId,
        address indexed owner,
        bytes32 policyHash,
        uint256 timestamp
    );
    event CredentialRevoked(bytes32 indexed credentialId, uint256 timestamp);
    event ActionAudited(
        bytes32 indexed actionId,
        bytes32 indexed credentialId,
        string decision,
        uint256 timestamp
    );

    // ── Credential management ───────────────────────────────────
    function createCredential(
        bytes32 credentialId,
        bytes32 credentialHash,
        bytes32 policyHash
    ) external {
        require(credentials[credentialId].createdAt == 0, "Credential already exists");
        credentials[credentialId] = Credential({
            owner: msg.sender,
            credentialHash: credentialHash,
            policyHash: policyHash,
            active: true,
            createdAt: block.timestamp
        });
        totalCredentials += 1;
        emit CredentialCreated(credentialId, msg.sender, policyHash, block.timestamp);
    }

    function revokeCredential(bytes32 credentialId) external {
        Credential storage c = credentials[credentialId];
        require(c.owner == msg.sender, "Not the credential owner");
        require(c.active, "Credential already revoked");
        c.active = false;
        emit CredentialRevoked(credentialId, block.timestamp);
    }

    function verifyCredential(bytes32 credentialId) external view returns (bool) {
        return credentials[credentialId].active;
    }

    function getCredential(bytes32 credentialId)
        external
        view
        returns (
            address owner,
            bytes32 credentialHash,
            bytes32 policyHash,
            bool active,
            uint256 createdAt
        )
    {
        Credential memory c = credentials[credentialId];
        return (c.owner, c.credentialHash, c.policyHash, c.active, c.createdAt);
    }

    // ── Audit ───────────────────────────────────────────────────
    function recordAction(
        bytes32 actionId,
        bytes32 credentialId,
        bytes32 actionHash,
        string calldata decision
    ) external {
        require(auditEntries[actionId].timestamp == 0, "Action already recorded");
        auditEntries[actionId] = AuditEntry({
            actionHash: actionHash,
            decision: decision,
            credentialId: credentialId,
            timestamp: block.timestamp,
            submitter: msg.sender
        });
        totalActions += 1;
        emit ActionAudited(actionId, credentialId, decision, block.timestamp);
    }

    function verifyAction(bytes32 actionId, bytes32 expectedHash)
        external
        view
        returns (bool)
    {
        return auditEntries[actionId].actionHash == expectedHash;
    }

    function getAudit(bytes32 actionId)
        external
        view
        returns (
            bytes32 actionHash,
            string memory decision,
            bytes32 credentialId,
            uint256 timestamp,
            address submitter
        )
    {
        AuditEntry memory e = auditEntries[actionId];
        return (e.actionHash, e.decision, e.credentialId, e.timestamp, e.submitter);
    }
}
