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

    // Headers de segurança são definidos apenas em _headers (fonte única).
    newResponse.headers.set('X-Edge-Served-By', 'Cloudflare Pages Functions');

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
