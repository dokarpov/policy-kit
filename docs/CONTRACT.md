# Contract

## Decision input

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| clear | boolean | yes | Next step is unambiguous |
| consequential | boolean | yes | Wrong action has meaningful cost |
| reversible | boolean | no | Action is easy to undo; `false` forces person |

## Decision output

| Field | Meaning |
|-------|---------|
| decider | `system` \| `person` |
| reason | machine-readable code |
| traits | echo of inputs (reversible may be null) |

## Approval input

| Field | Required | Meaning |
|-------|----------|---------|
| id | yes | Tool/action id |
| allowed | yes | Registry permission |
| clear | yes | |
| consequential | yes | |
| reversible | yes | |
| blastRadius | no | Product tier |

## Approval output

| Field | Meaning |
|-------|---------|
| route | `AUTO` \| `ASK` \| `BLOCK` |
| reason | machine-readable |
| policyVersion | policy kit version |

## Pipeline outcome

| outcome | Meaning |
|---------|---------|
| execute | system decided + AUTO |
| human | person path or ASK |
| blocked | tool not allowed |
