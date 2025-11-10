'use strict';

const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const ROOT = __dirname;

/** Simple content-type map */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function send(res, statusCode, content, headers = {}) {
  res.writeHead(statusCode, { 'Cache-Control': 'no-store', ...headers });
  res.end(content);
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        send(res, 404, 'Not Found', { 'Content-Type': 'text/plain; charset=utf-8' });
      } else {
        send(res, 500, 'Internal Server Error', { 'Content-Type': 'text/plain; charset=utf-8' });
      }
      return;
    }
    send(res, 200, data, { 'Content-Type': type });
  });
}

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let pathname = url.pathname;

    if (pathname === '/' || pathname === '/index') {
      return serveFile(res, path.join(ROOT, 'index.html'));
    }

    // Prevent path traversal
    const safePath = path.normalize(path.join(ROOT, pathname.replace(/^\/+/, '')));
    if (!safePath.startsWith(ROOT)) {
      return send(res, 403, 'Forbidden', { 'Content-Type': 'text/plain; charset=utf-8' });
    }

    fs.stat(safePath, (err, stat) => {
      if (err || !stat.isFile()) {
        return send(res, 404, 'Not Found', { 'Content-Type': 'text/plain; charset=utf-8' });
      }
      serveFile(res, safePath);
    });
  } catch (e) {
    send(res, 500, 'Internal Server Error', { 'Content-Type': 'text/plain; charset=utf-8' });
  }
});

server.listen(PORT, () => {
  console.log(`Planning Poker en écoute sur http://localhost:${PORT}`);
});


