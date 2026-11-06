/**
 * Bridge: Decision Systems ↔ Agentic Approval
 * One pipeline for product and agent runtimes.
 */

import { decide, record } from './decide.js';
import { routeAction, auditEvent } from './approve.js';

/**
 * Map decide() result → action traits for routeAction().
 */
export function toActionTraits(decisionResult, meta = {}) {
  if (!decisionResult || !decisionResult.traits || !['system', 'person'].includes(decisionResult.decider)) {
    throw new TypeError('decisionResult with valid decider and traits is required');
  }
  const t = decisionResult.traits;
  if (typeof t.clear !== 'boolean' || typeof t.consequential !== 'boolean' ||
      !(t.reversible === null || typeof t.reversible === 'boolean')) {
    throw new TypeError('invalid decision traits');
  }
  const verified = decide({ clear: t.clear, consequential: t.consequential,
    ...(t.reversible === null ? {} : { reversible: t.reversible }) });
  if (verified.decider !== decisionResult.decider || verified.reason !== decisionResult.reason) {
    throw new TypeError('decisionResult conflicts with its supplied traits');
  }
  return {
    id: meta.id || 'workflow_step',
    label: meta.label,
    kind: meta.kind || 'workflow',
    allowed: meta.allowed === true && decisionResult.decider === 'system',
    clear: t.clear === true,
    consequential: t.consequential === true,
    reversible: t.reversible === true,
    blastRadius: meta.blastRadius
  };
}

/**
 * Map decide() result into an action object (alias used by Approval Lab).
 */
export function fromDecision(decisionResult, meta = {}) {
  return toActionTraits(decisionResult, meta);
}

/**
 * Full pipeline:
 * signal traits → decide → if system, routeAction → audit
 *
 * @returns {{
 *   decision: object,
 *   approval: object|null,
 *   audit: object|null,
 *   outcome: 'execute'|'human'|'blocked'
 * }}
 */
export function pipeline({
  clear,
  consequential,
  reversible,
  happened,
  next,
  actionId,
  allowed = false,
  blastRadius,
  label,
  kind
}) {
  const decisionInput = { clear, consequential, reversible };
  const decision = happened && next
    ? record({ happened, next, ...decisionInput })
    : decide(decisionInput);

  if (decision.decider === 'person') {
    return {
      decision,
      approval: null,
      audit: null,
      outcome: 'human'
    };
  }

  const action = toActionTraits(decision, {
    id: actionId || 'pipeline_action',
    allowed,
    blastRadius,
    label,
    kind
  });
  const approval = routeAction(action);

  if (approval.route === 'BLOCK') {
    return {
      decision,
      approval,
      audit: auditEvent(action, approval),
      outcome: 'blocked'
    };
  }
  if (approval.route === 'ASK') {
    return {
      decision,
      approval,
      audit: auditEvent(action, approval),
      outcome: 'human'
    };
  }

  return {
    decision,
    approval,
    audit: auditEvent(action, approval),
    outcome: 'execute'
  };
}
