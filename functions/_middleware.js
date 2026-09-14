export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);
  
  // Rate limiting stub, analytics, or security checks could go here.
  // Edge SRE Audit: log requests structurally.
  console.log(JSON.stringify({
    level: 'info',
    message: 'Edge Request',
    method: request.method,
    url: url.pathname,
    ip: request.headers.get('CF-Connecting-IP')
  }));

  const response = await context.next();
  
  // Custom Edge Headers
  response.headers.set('X-Edge-Served-By', 'Cloudflare Pages Functions');
  
  return response;
}
