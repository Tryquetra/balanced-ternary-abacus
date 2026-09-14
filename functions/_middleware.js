export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);

  console.log(JSON.stringify({
    level: 'info',
    message: 'Edge Request',
    method: request.method,
    url: url.pathname,
    ip: request.headers.get('CF-Connecting-IP')
  }));

  try {
    const response = await context.next();
    const newResponse = new Response(response.body, response);

    newResponse.headers.set('X-Edge-Served-By', 'Cloudflare Pages Functions');
    newResponse.headers.set('X-Content-Type-Options', 'nosniff');
    newResponse.headers.set('X-Frame-Options', 'DENY');
    newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    newResponse.headers.set('Permissions-Policy', 'document-domain=()');
    newResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    return newResponse;
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal Edge Error', message: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Edge-Served-By': 'Cloudflare Pages Functions'
      }
    });
  }
}
