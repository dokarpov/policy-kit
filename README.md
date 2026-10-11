# @dokarpov/policy-kit v0.3

**Executable policy primitives for agentic systems: who decides, what may run, and when automation must stop.**

```text
signal
  ↓
decide: system or person?
  ↓
if system → routeAction
             ├─ AUTO  → execute
             ├─ ASK   → human approval
             └─ BLOCK → do not execute
```

`policy-kit` exists because two questions that are often collapsed in agent demos are actually different:

1. **Decision right:** is the situation clear enough for the system to make the next decision?
2. **Execution permission:** even if the decision is clear, is this particular tool action safe to run automatically?

A payment can be perfectly clear and still require approval. A tool can be disallowed even when the workflow is unambiguous. This package keeps those boundaries explicit and executable.

## Core primitives

- `decide()` — routes workflow decisions to `system` or `person` using clarity, consequence and reversibility.
- `routeAction()` — returns `AUTO`, `ASK` or `BLOCK` from action policy / blast radius.
- `pipeline()` — composes both layers into one outcome: `execute`, `human` or `blocked`.
- `bridge` helpers — keep traits explicit between decision and action policy instead of hiding them in prompts.

## Failure classes covered

The eval suite is organized around failures that matter in real agentic products, not only happy-path demos:

- false fit;
- proof inflation;
- provenance loss;
- review bypass;
- gap suppression;
- bad auto-approval for money / external send / privilege;
- rubber-stamp review;
- excessive agency / destructive actions;
- identity collision;
- consent bypass;
- idempotency blindness;
- policy drift.

The repository currently passes **10/10 core scenarios + 16/16 failure-class evals**.

```bash
npm test
npm run report
```

`npm run report` writes a machine-readable JSON report and a human-readable `docs/EVAL_REPORT.md`.

## Quick start

```js
import { pipeline } from '@dokarpov/policy-kit';

const result = pipeline({
  happened: 'Lead validated and consent passed',
  next: 'Create CRM contact',
  clear: true,
  consequential: false,
  reversible: true,
  actionId: 'crm_create',
  blastRadius: 'write_reversible'
});

// result.outcome: 'execute' | 'human' | 'blocked'
```

## Try the demo

```bash
npm run demo
# http://127.0.0.1:8787
```

Or:

```bash
docker compose up --build
```

Preset scenarios include safe CRM write, identity conflict, payment, external email, disallowed tool and missing consent.

## Why this is separate from Decision Systems

[`decision-systems`](https://github.com/dokarpov/decision-systems) intentionally answers one small question: **who decides the next step?**

`policy-kit` adds the second control boundary needed by tool-using agents: **may this action execute?** The separation keeps workflow ambiguity and execution risk independently testable.

```text
decision-systems     policy-kit
who decides?    →    may the tool run?
```

## Status boundary

This is an executable reference policy and eval harness. It is not production authorization, IAM, transaction approval infrastructure or compliance certification. Real deployments still need authenticated principals, policy ownership/versioning, durable audit, provider-specific tool controls and operational review design.

---

Built by **Daria Karpova** · Product Systems & AI · 0→1 · [dokarpov](https://github.com/dokarpov)
