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
  if (!decisionResult || !decisionResult.traits) {
    throw new TypeError('decisionResult with traits is required');
  }
  const t = decisionResult.traits;
  return {
    id: meta.id || 'workflow_step',
    label: meta.label,
    kind: meta.kind || 'workflow',
    allowed: meta.allowed !== false,
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
  allowed = true,
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
