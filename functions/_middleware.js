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
    newResponse.headers.set('X-Frame-Options', 'SAMEORIGIN');
    newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    newResponse.headers.set('Permissions-Policy', 'document-domain=()');
    newResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    newResponse.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src 'self' https://cdn.jsdelivr.net https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' https://cdn.jsdelivr.net; worker-src 'self';");

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
