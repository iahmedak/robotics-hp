/**
 * Measures maximum JSON-Schema nesting depth for every tool an MCP server
 * exposes. Anthropic's Messages API hard-fails past depth 10 with
 * "JSON schema exceeds the maximum nesting depth of 10 levels".
 *
 * Read-only: speaks MCP over stdio, prints a report, makes no changes.
 *
 *   node tools/depth-probe.mjs <command...> -- [--env K=V]
 */

import { spawn } from 'node:child_process';

const argv = process.argv.slice(2);
const envFlag = argv.indexOf('--env');
const commandArgs = envFlag === -1 ? argv : argv.slice(0, envFlag);
const extraEnv = {};
if (envFlag !== -1) {
  for (const pair of argv.slice(envFlag + 1)) {
    const i = pair.indexOf('=');
    if (i > 0) extraEnv[pair.slice(0, i)] = pair.slice(i + 1);
  }
}

/**
 * Depth of a JSON Schema node. Combinators (anyOf/oneOf/allOf), array
 * items and object properties each add a level — this is what counts
 * toward Anthropic's limit.
 */
function depth(node) {
  if (node === null || typeof node !== 'object') return 0;
  if (Array.isArray(node)) return 1 + Math.max(0, ...node.map(depth));

  let best = 0;
  for (const [key, value] of Object.entries(node)) {
    if (key === 'properties') {
      // properties maps name -> schema, so the map itself adds a level
      for (const sub of Object.values(value ?? {})) best = Math.max(best, depth(sub));
      best = Math.max(best, 1);
    } else if (key === 'items' || key === 'additionalProperties') {
      best = Math.max(best, 1 + depth(value));
    } else if (
      key === 'anyOf' || key === 'oneOf' || key === 'allOf' || key === 'prefixItems'
    ) {
      best = Math.max(best, 1 + depth(value));
    } else if (key === 'not') {
      best = Math.max(best, 1 + depth(value));
    } else if (key === '$defs' || key === 'definitions') {
      best = Math.max(best, 1 + depth(value));
    } else if (value && typeof value === 'object') {
      best = Math.max(best, depth(value));
    }
  }
  return best;
}

const proc = spawn(commandArgs[0], commandArgs.slice(1), {
  env: { ...process.env, ...extraEnv },
  stdio: ['pipe', 'pipe', 'pipe'],
});

let buf = '';
const pending = new Map();
let nextId = 1;

proc.stdout.on('data', (chunk) => {
  buf += chunk.toString();
  let idx;
  while ((idx = buf.indexOf('\n')) !== -1) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  }
});

let stderr = '';
proc.stderr.on('data', (c) => { stderr += c.toString(); });

function send(method, params) {
  const id = nextId++;
  const out = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';
  return new Promise((resolve) => {
    pending.set(id, resolve);
    proc.stdin.write(out);
    setTimeout(() => {
      if (pending.has(id)) { pending.delete(id); resolve({ error: { message: 'timeout' } }); }
    }, 120_000);
  });
}

function notify(method, params) {
  proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
}

const init = await send('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: { name: 'depth-probe', version: '1.0.0' },
});

if (init.error) {
  console.error('initialize failed:', JSON.stringify(init.error));
  if (stderr) console.error(stderr.slice(0, 800));
  process.exit(1);
}
notify('notifications/initialized', {});

const listed = await send('tools/list', {});
proc.kill();

if (listed.error) {
  console.error('tools/list failed:', JSON.stringify(listed.error));
  if (stderr) console.error(stderr.slice(0, 800));
  process.exit(1);
}

const tools = listed.result?.tools ?? [];
const scored = tools
  .map((t) => ({ name: t.name, depth: depth(t.inputSchema ?? {}) }))
  .sort((a, b) => b.depth - a.depth);

const LIMIT = 10;
const offenders = scored.filter((s) => s.depth > LIMIT);

console.log(`\nserver : ${commandArgs.join(' ')}`);
console.log(`tools  : ${tools.length}`);
console.log(`max depth: ${scored[0]?.depth ?? 0}  (limit ${LIMIT})`);
console.log(`offending tools (>${LIMIT}): ${offenders.length}`);
console.log('');
for (const s of scored.slice(0, 12)) {
  const flag = s.depth > LIMIT ? 'FAIL' : ' ok ';
  console.log(` ${flag} ${String(s.depth).padStart(2)}  ${s.name}`);
}
if (offenders.length > 12) {
  console.log(`  ... and ${offenders.length - 12} more`);
}
console.log(
  offenders.length === 0
    ? '\nSAFE — this server will not break Anthropic models.\n'
    : '\nUNSAFE — any model on the Anthropic Messages API will hard-fail.\n'
);
process.exit(0);