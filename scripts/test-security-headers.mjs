import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { DYNAMIC_CONTENT_SECURITY_POLICY, DYNAMIC_SECURITY_HEADERS, withDynamicSecurityHeaders } from '../worker/security-headers.ts';

const ROOT = process.cwd();
const STATIC_HEADERS_PATH = path.join(ROOT, 'public', '_headers');
const BUILT_HEADERS_PATH = path.join(ROOT, 'dist', '_headers');
const WRANGLER_PATH = path.join(ROOT, 'wrangler.jsonc');
const SECURITY_RUNTIME_PATH = path.join(ROOT, 'worker', 'security-runtime.ts');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseHeaderRule(text) {
  const lines = text.split(/\r?\n/);
  const rootIndex = lines.findIndex((line) => line.trim() === '/*');
  assert(rootIndex >= 0, 'public/_headers must contain a /* rule');

  const headers = new Map();
  for (const line of lines.slice(rootIndex + 1)) {
    if (!line.trim()) continue;
    if (!/^\s/.test(line)) break;
    const match = /^\s+([^:]+):\s*(.*)$/.exec(line);
    assert(match, `Invalid _headers line: ${line}`);
    headers.set(match[1].trim().toLowerCase(), match[2].trim());
  }
  return headers;
}

const sourceText = await readFile(STATIC_HEADERS_PATH, 'utf8');
const builtText = await readFile(BUILT_HEADERS_PATH, 'utf8');
assert(sourceText === builtText, 'dist/_headers must exactly match public/_headers after build');

const wranglerConfig = JSON.parse(await readFile(WRANGLER_PATH, 'utf8'));
assert(
  wranglerConfig.main === './worker/security-runtime.ts',
  'wrangler.jsonc must use worker/security-runtime.ts so dynamic responses are hardened'
);
const securityRuntimeText = await readFile(SECURITY_RUNTIME_PATH, 'utf8');
assert(
  securityRuntimeText.includes('withDynamicSecurityHeaders(await runtime.fetch(request, env))'),
  'Worker security runtime must wrap fetch responses with common security headers'
);

const staticHeaders = parseHeaderRule(sourceText);
const requiredStaticHeaders = {
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
  'x-permitted-cross-domain-policies': 'none'
};

for (const [name, expected] of Object.entries(requiredStaticHeaders)) {
  assert(staticHeaders.get(name) === expected, `Static header ${name} must be ${expected}`);
}

const csp = staticHeaders.get('content-security-policy') ?? '';
for (const directive of [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "connect-src 'self' https://api.github.com https://challenges.cloudflare.com",
  'frame-src https://challenges.cloudflare.com',
  'upgrade-insecure-requests'
]) {
  assert(csp.includes(directive), `Static CSP is missing: ${directive}`);
}
assert(!csp.includes("'unsafe-eval'"), "Static CSP must not allow 'unsafe-eval'");
assert(!/(^|\s)http:($|\s|;)/.test(csp), 'Static CSP must not allow insecure http: sources');
assert(!/(^|\s)\*($|\s|;)/.test(csp), 'Static CSP must not contain wildcard sources');

const hardened = withDynamicSecurityHeaders(new Response(JSON.stringify({ ok: true }), {
  headers: { 'Content-Type': 'application/json; charset=utf-8' }
}));
for (const [name, expected] of Object.entries(DYNAMIC_SECURITY_HEADERS)) {
  assert(hardened.headers.get(name) === expected, `Worker header ${name} must be ${expected}`);
}
assert(
  hardened.headers.get('Content-Security-Policy') === DYNAMIC_CONTENT_SECURITY_POLICY,
  'Worker response must receive the default restrictive CSP'
);

const badgePolicy = "default-src 'none'";
const badgeLike = withDynamicSecurityHeaders(new Response('<svg></svg>', {
  headers: { 'Content-Security-Policy': badgePolicy }
}));
assert(
  badgeLike.headers.get('Content-Security-Policy') === badgePolicy,
  'Worker hardening must preserve a route-specific stricter CSP'
);

console.log('Security header tests passed.');
