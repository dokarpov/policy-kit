/**
 * Tool/action policy: AUTO | ASK | BLOCK
 * Optional blast-radius tiers for product/ops language.
 */

export const POLICY_VERSION = '0.3.0';

export const BLAST_TIERS = [
  'read',
  'write_reversible',
  'write_irreversible',
  'external',
  'privilege',
  'money'
];

const BLAST_RANK = {
  read: 0,
  write_reversible: 1,
  write_irreversible: 2,
  external: 3,
  privilege: 4,
  money: 5
};

/**
 * @param {{
 *   id: string,
 *   allowed?: boolean,
 *   clear?: boolean,
 *   consequential?: boolean,
 *   reversible?: boolean,
 *   blastRadius?: string,
 *   kind?: string,
 *   label?: string
 * }} action
 */
export function routeAction(action) {
  if (!action || typeof action !== 'object') {
    throw new TypeError('action is required');
  }
  if (action.allowed === false) {
    return { route: 'BLOCK', reason: 'tool_not_allowed', policyVersion: POLICY_VERSION };
  }

  if (action.blastRadius && ['money', 'privilege', 'external'].includes(action.blastRadius)) {
    return {
      route: 'ASK',
      reason: `blast_${action.blastRadius}`,
      policyVersion: POLICY_VERSION
    };
  }
  if (action.blastRadius === 'write_irreversible') {
    return {
      route: 'ASK',
      reason: 'blast_write_irreversible',
      policyVersion: POLICY_VERSION
    };
  }

  if (
    action.clear === true &&
    action.consequential === false &&
    action.reversible === true
  ) {
    return {
      route: 'AUTO',
      reason: 'clear_low_consequence_reversible',
      policyVersion: POLICY_VERSION
    };
  }
  if (action.clear === false && action.consequential === true) {
    return {
      route: 'ASK',
      reason: 'ambiguous_and_consequential',
      policyVersion: POLICY_VERSION
    };
  }
  if (action.clear === false) {
    return { route: 'ASK', reason: 'ambiguous', policyVersion: POLICY_VERSION };
  }
  if (action.reversible === false) {
    return { route: 'ASK', reason: 'hard_to_reverse', policyVersion: POLICY_VERSION };
  }
  return { route: 'ASK', reason: 'consequential', policyVersion: POLICY_VERSION };
}

export function auditEvent(action, decision) {
  return {
    action: action.id,
    route: decision.route,
    reason: decision.reason,
    policyVersion: decision.policyVersion || POLICY_VERSION,
    blastRadius: action.blastRadius || null,
    kind: action.kind || 'synthetic',
    at: new Date().toISOString()
  };
}

export function blastRank(name) {
  return BLAST_RANK[name] ?? -1;
}
