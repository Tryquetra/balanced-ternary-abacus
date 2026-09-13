const server = Bun.serve({
  port: 8000,
  fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;
    if (pathname === '/' || pathname === '') {
      pathname = '/index.html';
    }
    const file = Bun.file('.' + pathname);
    return new Response(file);
  },
});

console.log(`Servidor local ativo em http://localhost:${server.port}`);
