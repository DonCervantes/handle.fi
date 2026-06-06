import { ParsedIntent } from "./intentParser";

export interface Policy {
  maxTransactionAmount: number;
  allowedCurrencies: string[];
  allowedActionTypes: string[];
  requireApprovalAbove?: number;
  allowedRecipients?: string[];
  dailyLimit?: number;
}

export interface PolicyDecision {
  approved: boolean;
  reason: string;
  checkedRules: string[];
}

export function evaluatePolicy(
  intent: ParsedIntent,
  policy: Policy,
  dailySpentSoFar: number = 0
): PolicyDecision {
  const checkedRules: string[] = [];

  checkedRules.push("actionType");
  if (!policy.allowedActionTypes.includes(intent.actionType)) {
    return {
      approved: false,
      reason: `Action type "${intent.actionType}" is not permitted by policy. Allowed: ${policy.allowedActionTypes.join(", ")}.`,
      checkedRules,
    };
  }

  if (intent.currency) {
    checkedRules.push("currency");
    if (!policy.allowedCurrencies.includes(intent.currency)) {
      return {
        approved: false,
        reason: `Currency "${intent.currency}" is not allowed. Permitted: ${policy.allowedCurrencies.join(", ")}.`,
        checkedRules,
      };
    }
  }

  if (intent.amount !== undefined) {
    checkedRules.push("maxTransactionAmount");
    if (intent.amount > policy.maxTransactionAmount) {
      return {
        approved: false,
        reason: `Amount $${intent.amount} exceeds per-transaction limit of $${policy.maxTransactionAmount}.`,
        checkedRules,
      };
    }
  }

  if (intent.amount !== undefined && policy.requireApprovalAbove !== undefined) {
    checkedRules.push("requireApprovalAbove");
    if (intent.amount > policy.requireApprovalAbove) {
      return {
        approved: false,
        reason: `Amount $${intent.amount} exceeds hard ceiling of $${policy.requireApprovalAbove}. Human approval required.`,
        checkedRules,
      };
    }
  }

  if (policy.dailyLimit !== undefined && intent.amount !== undefined) {
    checkedRules.push("dailyLimit");
    if (dailySpentSoFar + intent.amount > policy.dailyLimit) {
      return {
        approved: false,
        reason: `Daily limit of $${policy.dailyLimit} would be exceeded. Already spent today: $${dailySpentSoFar}.`,
        checkedRules,
      };
    }
  }

  if (policy.allowedRecipients && policy.allowedRecipients.length > 0 && intent.recipient) {
    checkedRules.push("allowedRecipients");
    if (!policy.allowedRecipients.includes(intent.recipient)) {
      return {
        approved: false,
        reason: `Recipient "${intent.recipient}" is not in the approved whitelist.`,
        checkedRules,
      };
    }
  }

  return {
    approved: true,
    reason: "All policy rules passed.",
    checkedRules,
  };
}
