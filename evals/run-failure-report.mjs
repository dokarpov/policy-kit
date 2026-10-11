/**
 * Batch 2: run failure-class cases and emit a structured eval report.
 * Asserts expected routing; documents anti_patterns without executing them.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { decide, routeAction, pipeline, POLICY_VERSION } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cases = JSON.parse(
  readFileSync(join(__dirname, 'failure-cases.json'), 'utf8')
);

const results = [];
let passed = 0;
let failed = 0;

for (const c of cases) {
  let ok = true;
  let actual = {};

  try {
    if (c.layer === 'decide') {
      const r = decide(c.input);
      actual = { decider: r.decider, reason: r.reason };
      if (c.expected.decider && r.decider !== c.expected.decider) ok = false;
      if (c.expected.reason && r.reason !== c.expected.reason) ok = false;
    } else if (c.layer === 'approve') {
      const r = routeAction(c.input);
      actual = {
        route: r.route,
        reason: r.reason,
        policyVersion: r.policyVersion
      };
      if (c.expected.route && r.route !== c.expected.route) ok = false;
      if (c.expected.policyVersionPresent && !r.policyVersion) ok = false;
    } else {
      const r = pipeline(c.input);
      actual = {
        outcome: r.outcome,
        decider: r.decision.decider,
        reason: r.decision.reason,
        route: r.approval?.route ?? null,
        policyVersion: r.approval?.policyVersion ?? null
      };
      if (c.expected.outcome && r.outcome !== c.expected.outcome) ok = false;
      if (c.expected.decider && r.decision.decider !== c.expected.decider) ok = false;
      if (c.expected.route && r.approval?.route !== c.expected.route) ok = false;
    }
  } catch (err) {
    ok = false;
    actual = { error: err.message };
  }

  if (ok) passed += 1;
  else failed += 1;

  results.push({
    id: c.id,
    failure_class: c.failure_class,
    narrative: c.narrative,
    layer: c.layer,
    ok,
    expected: c.expected,
    actual,
    anti_pattern: c.anti_pattern
  });

  console.log(
    `${ok ? 'PASS' : 'FAIL'}  [${c.failure_class}] ${c.id}`
  );
}

// Aggregate by class
const byClass = {};
for (const r of results) {
  if (!byClass[r.failure_class]) {
    byClass[r.failure_class] = { total: 0, passed: 0, failed: 0 };
  }
  byClass[r.failure_class].total += 1;
  if (r.ok) byClass[r.failure_class].passed += 1;
  else byClass[r.failure_class].failed += 1;
}

const report = {
  title: 'Policy Kit Eval Report — Failure Classes',
  version: '0.3.0',
  policyVersion: POLICY_VERSION,
  generatedAt: new Date().toISOString(),
  summary: {
    total: cases.length,
    passed,
    failed,
    passRate: cases.length ? +(passed / cases.length).toFixed(4) : 0
  },
  byClass,
  results,
  notes: [
    'Cases are synthetic / anonymized-style.',
    'They test routing behavior under failure-class pressure, not model quality or business ROI.',
    'anti_pattern fields document what a weak policy would do; they are not executed.'
  ]
};

const reportJsonPath = join(__dirname, 'EVAL_REPORT.json');
writeFileSync(reportJsonPath, JSON.stringify(report, null, 2));

// Markdown report
const lines = [
  '# Eval Report — Failure Classes',
  '',
  `**Policy kit:** v0.3.0 · **Policy version stamp:** ${POLICY_VERSION}`,
  `**Generated:** ${report.generatedAt}`,
  '',
  '## Summary',
  '',
  `| Metric | Value |`,
  `|--------|-------|`,
  `| Total cases | ${report.summary.total} |`,
  `| Passed | ${report.summary.passed} |`,
  `| Failed | ${report.summary.failed} |`,
  `| Pass rate | ${(report.summary.passRate * 100).toFixed(1)}% |`,
  '',
  '## By failure class',
  '',
  '| Class | Passed | Total |',
  '|-------|--------|-------|'
];

for (const [cls, s] of Object.entries(byClass).sort()) {
  lines.push(`| \`${cls}\` | ${s.passed} | ${s.total} |`);
}

lines.push('', '## Cases', '');

for (const r of results) {
  lines.push(`### ${r.ok ? 'PASS' : 'FAIL'} · \`${r.id}\``);
  lines.push('');
  lines.push(`- **Class:** \`${r.failure_class}\``);
  lines.push(`- **Narrative:** ${r.narrative}`);
  lines.push(`- **Expected:** \`${JSON.stringify(r.expected)}\``);
  lines.push(`- **Actual:** \`${JSON.stringify(r.actual)}\``);
  lines.push(`- **Anti-pattern (not executed):** ${r.anti_pattern}`);
  lines.push('');
}

lines.push('## Notes');
lines.push('');
for (const n of report.notes) lines.push(`- ${n}`);
lines.push('');

const reportMdPath = join(__dirname, '../docs/EVAL_REPORT.md');
writeFileSync(reportMdPath, lines.join('\n'));

console.log(`\n${passed}/${cases.length} passed`);
console.log(`Wrote ${reportJsonPath}`);
console.log(`Wrote ${reportMdPath}`);

if (failed) process.exit(1);
