/**
 * Policy Kit demo server — zero dependencies (Node >= 18).
 *
 *   npm run demo
 *   open http://127.0.0.1:8787
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, normalize } from 'node:path';
import {
  pipeline,
  decide,
  routeAction,
  BLAST_TIERS,
  POLICY_VERSION
} from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PORT = Number(process.env.PORT) || 8787;
const HOST = process.env.HOST || '127.0.0.1';

const scenarios = JSON.parse(
  readFileSync(join(__dirname, 'scenarios.json'), 'utf8')
);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

function send(res, status, body, type = 'application/json; charset=utf-8') {
  const data = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('invalid_json'));
      }
    });
    req.on('error', reject);
  });
}

function bool(v, defaultValue = false) {
  if (v === undefined || v === null) return defaultValue;
  if (typeof v === 'boolean') return v;
  if (v === 'true' || v === '1') return true;
  if (v === 'false' || v === '0') return false;
  return Boolean(v);
}

function safeJoin(root, reqPath) {
  const cleaned = normalize(reqPath).replace(/^(\.\.[/\\])+/, '');
  const full = join(root, cleaned);
  if (!full.startsWith(root)) return null;
  return full;
}

function serveStatic(res, urlPath) {
  let rel = urlPath === '/' ? 'demo/playground.html' : urlPath.replace(/^\//, '');
  const file = safeJoin(ROOT, rel);
  if (!file || !existsSync(file) || !statSync(file).isFile()) return false;
  const data = readFileSync(file);
  const type = MIME[extname(file)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(data);
  return true;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);
  const path = url.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  try {
    if (path === '/api/health' && req.method === 'GET') {
      return send(res, 200, {
        ok: true,
        policyVersion: POLICY_VERSION,
        kit: '0.3.0',
        blastTiers: BLAST_TIERS
      });
    }

    if (path === '/api/scenarios' && req.method === 'GET') {
      return send(res, 200, { scenarios });
    }

    if (path === '/api/pipeline' && req.method === 'POST') {
      const body = await readBody(req);
      const result = pipeline({
        happened: body.happened,
        next: body.next,
        clear: bool(body.clear),
        consequential: bool(body.consequential),
        reversible: body.reversible === undefined ? true : bool(body.reversible),
        actionId: body.actionId || 'demo_action',
        allowed: body.allowed === undefined ? true : bool(body.allowed),
        blastRadius: body.blastRadius || undefined,
        label: body.label,
        kind: body.kind || 'demo'
      });
      return send(res, 200, result);
    }

    if (path === '/api/decide' && req.method === 'POST') {
      const body = await readBody(req);
      const input = {
        clear: bool(body.clear),
        consequential: bool(body.consequential)
      };
      if (body.reversible !== undefined) input.reversible = bool(body.reversible);
      return send(res, 200, decide(input));
    }

    if (path === '/api/approve' && req.method === 'POST') {
      const body = await readBody(req);
      return send(
        res,
        200,
        routeAction({
          id: body.id || 'demo',
          allowed: body.allowed === undefined ? true : bool(body.allowed),
          clear: bool(body.clear),
          consequential: bool(body.consequential),
          reversible: bool(body.reversible),
          blastRadius: body.blastRadius
        })
      );
    }

    if (path === '/api/report' && req.method === 'GET') {
      const reportPath = join(ROOT, 'evals', 'EVAL_REPORT.json');
      if (!existsSync(reportPath)) {
        return send(res, 404, {
          error: 'report_missing',
          hint: 'Run: npm run report'
        });
      }
      const report = JSON.parse(readFileSync(reportPath, 'utf8'));
      return send(res, 200, {
        summary: report.summary,
        byClass: report.byClass,
        version: report.version,
        generatedAt: report.generatedAt
      });
    }

    if (req.method === 'GET' && serveStatic(res, path)) return;

    send(res, 404, { error: 'not_found', path });
  } catch (err) {
    const status = err.message === 'invalid_json' ? 400 : 500;
    send(res, status, { error: err.message || 'server_error' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Policy Kit demo → http://${HOST}:${PORT}`);
  console.log(`  playground  http://${HOST}:${PORT}/`);
  console.log(`  health      http://${HOST}:${PORT}/api/health`);
  console.log(`  scenarios   http://${HOST}:${PORT}/api/scenarios`);
});
