export const DYNAMIC_SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
  'X-Permitted-Cross-Domain-Policies': 'none'
} as const;

export const DYNAMIC_CONTENT_SECURITY_POLICY = "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'";

export function withDynamicSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(DYNAMIC_SECURITY_HEADERS)) {
    if (!headers.has(name)) headers.set(name, value);
  }
  if (!headers.has('Content-Security-Policy')) {
    headers.set('Content-Security-Policy', DYNAMIC_CONTENT_SECURITY_POLICY);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
