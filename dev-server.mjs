import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = __dirname;
const HOST = '127.0.0.1';
const PORT = 8765;

const MIME = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.gif', 'image/gif'],
  ['.ico', 'image/x-icon'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.xml', 'application/xml; charset=utf-8'],
  ['.mp4', 'video/mp4'],
  ['.webm', 'video/webm'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.ttf', 'font/ttf'],
]);

function safeResolve(p) {
  const resolved = path.normalize(path.join(ROOT, p));
  if (!resolved.startsWith(ROOT)) return null;
  return resolved;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  try {
    const u = new URL(req.url ?? '/', `http://${HOST}:${PORT}`);
    let pathname = decodeURIComponent(u.pathname);
    if (pathname === '/') pathname = '/index.html';

    const resolved = safeResolve(pathname);
    if (!resolved) return send(res, 403, 'Forbidden');

    let stat;
    try {
      stat = fs.statSync(resolved);
    } catch {
      return send(res, 404, 'Not found');
    }

    if (stat.isDirectory()) {
      const indexPath = path.join(resolved, 'index.html');
      try {
        const html = fs.readFileSync(indexPath);
        return send(res, 200, html, { 'Content-Type': MIME.get('.html') });
      } catch {
        return send(res, 404, 'Not found');
      }
    }

    const ext = path.extname(resolved).toLowerCase();
    const ct = MIME.get(ext) ?? 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': ct,
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(resolved).pipe(res);
  } catch (e) {
    send(res, 500, 'Server error');
  }
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`Dev server running on http://${HOST}:${PORT}`);
});

