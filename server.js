import { resolve, normalize } from 'path';

const PUBLIC_DIR = resolve('.');

const server = Bun.serve({
  port: 8000,
  fetch(req) {
    const url = new URL(req.url);
    let pathname = normalize(url.pathname);
    if (pathname === '/' || pathname === '') {
      pathname = '/index.html';
    }

    const safePath = resolve(PUBLIC_DIR, '.' + pathname);
    if (!safePath.startsWith(PUBLIC_DIR)) {
      return new Response('Acesso negado', { status: 403 });
    }

    const file = Bun.file(safePath);

    const isStaticAsset = /\.(css|js|webp|png|ico|webmanifest|txt|xml)$/.test(pathname);
    const headers = new Headers({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    });

    if (isStaticAsset) {
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    }

    return new Response(file, { headers });
  },
});

console.log(`Servidor local seguro ativo em http://localhost:${server.port}`);
