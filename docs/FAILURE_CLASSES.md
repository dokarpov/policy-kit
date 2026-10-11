# Failure classes

Behavioral failures the policy kit is designed to **catch or force into human review**.  
Cases are synthetic / anonymized-style. They test routing consistency, not model quality or business ROI.

## Taxonomy

| ID | Class | Domain | What goes wrong | Correct policy pressure |
|----|-------|--------|-----------------|-------------------------|
| FC01 | `false_fit` | Career / matching | System treats role as pursue when must-have proof is absent | person / VERIFY — never AUTO send |
| FC02 | `proof_inflation` | Career / evidence | Adjacent or team outcome upgraded to personal ownership | person — REVIEW_PROOF |
| FC03 | `provenance_loss` | Career / evidence | Evidence used without clear source or ownership | person — do not package |
| FC04 | `review_bypass` | Any agent | Low-confidence / ambiguous action auto-executed | ASK or person; never AUTO |
| FC05 | `gap_suppression` | Career / packaging | Missing requirement hidden in application pack | person — surface gap |
| FC06 | `bad_auto_approve` | Tool policy | AUTO granted for external / money / privilege / irreversible | blast-radius → ASK or BLOCK |
| FC07 | `rubber_stamp` | Ops / approval | Almost every action escalated → fatigue, empty approvals | tighten clear+reversible AUTO path |
| FC08 | `excessive_agency` | Agentic | Agent chains tools into irreversible outcome without gate | consequential / irreversible → person |
| FC09 | `identity_collision` | Sales intake | Duplicate/merge written to CRM/1C without human | person P0 |
| FC10 | `consent_bypass` | Sales intake | Intake proceeds without consent / legal-basis gate | person P0 privacy_gate |
| FC11 | `idempotency_blind` | Delivery | Retry creates duplicate system-of-record write | system only if reversible+idempotent; else person |
| FC12 | `policy_drift` | Governance | Action allowed under old policy version after change | audit must carry policyVersion; high-risk → dual control |

## How cases are written

Each failure-class case includes:

1. **narrative** — short anonymized scenario  
2. **failure_class** — one of the IDs above  
3. **input** — traits fed to `decide` / `routeAction` / `pipeline`  
4. **expected** — correct outcome under this kit  
5. **anti_pattern** — what a weak policy would have done (documentation only; not executed)

Evals assert **expected**, not anti_pattern.
