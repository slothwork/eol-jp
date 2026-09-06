import { loadCatalog } from './catalog-runtime.ts';
import {
  buildBadgeSvg,
  buildProductIndex,
  buildProductPayload
} from './public-api.ts';
import type { WorkerRuntimeEnv } from './runtime-types.ts';

const PUBLIC_CACHE_CONTROL = 'public, max-age=300, s-maxage=3600';

function publicJson(data: unknown, status = 200, head = false): Response {
  const body = head ? null : JSON.stringify(data);
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': status === 200 ? PUBLIC_CACHE_CONTROL : 'public, max-age=60',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

export async function handlePublicApi(request: Request, env: WorkerRuntimeEnv): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return publicJson({ error: 'method_not_allowed' }, 405, request.method === 'HEAD');
  }

  const catalog = await loadCatalog(env);
  const head = request.method === 'HEAD';
  if (url.pathname === '/api/v1/products' || url.pathname === '/api/v1/products/') {
    return publicJson(buildProductIndex(catalog), 200, head);
  }

  const match = /^\/api\/v1\/products\/([a-z0-9._-]+)\/?$/i.exec(url.pathname);
  if (!match) return publicJson({ error: 'not_found' }, 404, head);
  const version = url.searchParams.get('version')?.trim() || null;
  const payload = buildProductPayload(catalog, match[1], version, new Date());
  if (!payload) return publicJson({ error: version ? 'version_not_found' : 'product_not_found' }, 404, head);
  return publicJson(payload, 200, head);
}

export async function handleBadge(request: Request, env: WorkerRuntimeEnv): Promise<Response> {
  const url = new URL(request.url);
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  const match = /^\/badge\/([a-z0-9._-]+)\.svg$/i.exec(url.pathname);
  if (!match) return new Response(null, { status: 404 });

  const catalog = await loadCatalog(env);
  const version = url.searchParams.get('version')?.trim() || null;
  const badge = buildBadgeSvg(catalog, match[1], version, new Date());
  return new Response(request.method === 'HEAD' ? null : badge.svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': PUBLIC_CACHE_CONTROL,
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
      'X-EOL-Badge-Found': badge.found ? '1' : '0'
    }
  });
}
