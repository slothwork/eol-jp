import { gzipSync } from 'node:zlib';
import path from 'node:path';

export function gzipBytes(value) {
  return gzipSync(value, { level: 9 }).byteLength;
}

export function extractPageAssets(html) {
  const scripts = [];
  const stylesheets = [];
  const inlineScripts = [];
  const inlineStyles = [];

  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = match[1] ?? '';
    const body = match[2] ?? '';
    const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1] ?? null;
    const type = /\btype\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1]?.toLowerCase() ?? '';
    if (src) {
      if (isLocalAsset(src)) scripts.push(src);
      continue;
    }
    if (type === 'application/ld+json' || type === 'application/json' || type === 'importmap') continue;
    if (body.trim()) inlineScripts.push(body);
  }

  for (const match of html.matchAll(/<link\b([^>]+)>/gi)) {
    const attrs = match[1] ?? '';
    const rel = /\brel\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1]?.toLowerCase() ?? '';
    if (!rel.split(/\s+/).includes('stylesheet')) continue;
    const href = /\bhref\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1] ?? null;
    if (href && isLocalAsset(href)) stylesheets.push(href);
  }

  for (const match of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    const body = match[1] ?? '';
    if (body.trim()) inlineStyles.push(body);
  }

  return {
    scripts: [...new Set(scripts)],
    stylesheets: [...new Set(stylesheets)],
    inlineScripts,
    inlineStyles
  };
}

export function isLocalAsset(value) {
  return !/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(value) && !/^(?:data|blob|mailto|tel):/i.test(value);
}

export function resolveAssetPath(distDir, htmlFile, assetUrl) {
  const clean = assetUrl.split(/[?#]/, 1)[0];
  const candidate = clean.startsWith('/')
    ? path.resolve(distDir, `.${clean}`)
    : path.resolve(path.dirname(htmlFile), clean);
  const root = path.resolve(distDir);
  if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Asset escapes dist directory: ${assetUrl}`);
  }
  return candidate;
}

export function formatKiB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}
