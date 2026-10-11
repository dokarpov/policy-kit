import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { decide, routeAction, pipeline } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cases = JSON.parse(readFileSync(join(__dirname, 'cases.json'), 'utf8'));

let passed = 0;
let failed = 0;

for (const c of cases) {
  let ok = true;
  let detail = '';

  if (c.layer === 'decide') {
    const r = decide(c.input);
    if (c.expected.decider && r.decider !== c.expected.decider) ok = false;
    if (c.expected.reason && r.reason !== c.expected.reason) ok = false;
    detail = `decider=${r.decider} reason=${r.reason}`;
  } else if (c.layer === 'approve') {
    const r = routeAction(c.input);
    if (c.expected.route && r.route !== c.expected.route) ok = false;
    detail = `route=${r.route} reason=${r.reason}`;
  } else {
    const r = pipeline(c.input);
    if (c.expected.outcome && r.outcome !== c.expected.outcome) ok = false;
    if (c.expected.decider && r.decision.decider !== c.expected.decider) ok = false;
    if (c.expected.route && r.approval && r.approval.route !== c.expected.route) ok = false;
    if (c.expected.route && !r.approval && c.expected.route) {
      // person path may have no approval
      if (r.outcome !== 'human') ok = false;
    }
    detail = `outcome=${r.outcome} decider=${r.decision.decider}${
      r.approval ? ` route=${r.approval.route}` : ''
    }`;
  }

  console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.id}: ${detail}`);
  if (ok) passed += 1;
  else failed += 1;
}

console.log(`\n${passed}/${cases.length} passed`);
if (failed) process.exit(1);
