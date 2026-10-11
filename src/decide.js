/**
 * Decision layer: happened → next → who decides
 * Automate certainty. Route ambiguity.
 */

/**
 * @param {{ clear: boolean, consequential: boolean, reversible?: boolean }} input
 * @returns {{ decider: 'system'|'person', reason: string, traits: object }}
 */
export function decide(input) {
  if (!input || typeof input !== 'object') {
    throw new TypeError('decide input is required');
  }
  const { clear, consequential, reversible } = input;
  if (typeof clear !== 'boolean' || typeof consequential !== 'boolean') {
    throw new TypeError('clear and consequential must be booleans');
  }
  if (reversible !== undefined && typeof reversible !== 'boolean') {
    throw new TypeError('reversible must be a boolean when provided');
  }

  const traits = {
    clear,
    consequential,
    reversible: reversible === undefined ? null : reversible
  };

  if (reversible === false) {
    return { decider: 'person', reason: 'hard_to_reverse', traits };
  }
  if (clear && !consequential) {
    return { decider: 'system', reason: 'clear_low_consequence', traits };
  }
  if (!clear && consequential) {
    return { decider: 'person', reason: 'ambiguous_and_consequential', traits };
  }
  if (!clear) {
    return { decider: 'person', reason: 'ambiguous', traits };
  }
  return { decider: 'person', reason: 'consequential', traits };
}

/**
 * Full decision record for queues / audit.
 */
export function record({ happened, next, clear, consequential, reversible }) {
  if (typeof happened !== 'string' || !happened.trim()) {
    throw new TypeError('happened must be a non-empty string');
  }
  if (typeof next !== 'string' || !next.trim()) {
    throw new TypeError('next must be a non-empty string');
  }
  const result = decide({ clear, consequential, reversible });
  return {
    happened: happened.trim(),
    next: next.trim(),
    decider: result.decider,
    reason: result.reason,
    traits: result.traits
  };
}
