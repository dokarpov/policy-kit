import test from 'node:test';
import assert from 'node:assert/strict';
import { decide, record, routeAction, toActionTraits, pipeline } from '../src/index.js';

const safe = {
  clear: true,
  consequential: false,
  reversible: true,
  actionId: 'sample_local_action',
  blastRadius: 'write_reversible'
};

test('decision ownership requires explicit reversibility', () => {
  assert.equal(decide({ clear: true, consequential: false }).reason, 'reversibility_unverified');
  assert.equal(decide({ clear: true, consequential: false }).decider, 'person');
  assert.equal(decide({ clear: true, consequential: false, reversible: true }).decider, 'system');
});

test('execution is denied by default, even for a clear safe-looking action', () => {
  assert.equal(pipeline(safe).outcome, 'blocked');
  assert.equal(pipeline({ ...safe, allowed: null }).outcome, 'blocked');
  assert.equal(pipeline({ ...safe, allowed: 'true' }).outcome, 'blocked');
  assert.equal(pipeline({ ...safe, allowed: true }).outcome, 'execute');
});

test('direct action policy cannot bypass explicit authorization', () => {
  const action = { id: 'read_ledger', clear: true, consequential: false,
    reversible: true, blastRadius: 'read' };
  assert.equal(routeAction(action).route, 'BLOCK');
  assert.equal(routeAction({ ...action, allowed: 1 }).route, 'BLOCK');
  assert.equal(routeAction({ ...action, allowed: true }).route, 'AUTO');
});

test('unknown and missing action classifications never authorize AUTO', () => {
  for (const radius of [undefined, 'new_future_action']) {
    const r = routeAction({ id: 'unknown_action', allowed: true, clear: true,
      consequential: false, reversible: true, blastRadius: radius });
    assert.equal(r.route, 'ASK');
    assert.equal(r.reason, 'blast_radius_unverified');
  }
});

test('bridge verifies provenance of decision state before granting permission', () => {
  const human = record({ happened: 'Ambiguous record', next: 'Resolve identity',
    clear: false, consequential: true, reversible: false });
  assert.equal(toActionTraits(human, { allowed: true }).allowed, false);
  const system = record({ happened: 'Verified input', next: 'Create draft',
    clear: true, consequential: false, reversible: true });
  assert.equal(toActionTraits(system).allowed, false);
  assert.equal(toActionTraits(system, { allowed: true }).allowed, true);
  assert.throws(() => toActionTraits({ ...system, decider: 'person' }, { allowed: true }), TypeError);
  assert.throws(() => toActionTraits({ ...human, traits: { ...human.traits, clear: true,
    consequential: false, reversible: true } }, { allowed: true }), TypeError);
});

test('uncertain input and even explicit grants cannot cause automatic execution', () => {
  assert.equal(pipeline({ clear: true, consequential: false,
    allowed: true, blastRadius: 'write_reversible' }).outcome, 'human');
  assert.equal(pipeline({ ...safe, allowed: true, blastRadius: 'money' }).outcome, 'human');
  assert.equal(pipeline({ ...safe, allowed: true, blastRadius: 'external' }).outcome, 'human');
});
