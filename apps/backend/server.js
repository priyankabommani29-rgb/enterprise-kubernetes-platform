const http = require('http');
const port = process.env.PORT || 5678;

const server = http.createServer((req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200);
    return res.end('ok');
  }
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from backend API v1 (built by CI)\n');
});

server.listen(port, () => console.log('listening on ' + port));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
