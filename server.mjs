import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const publicFiles = new Set(['index.html', 'style.css', 'main.js', 'works.js']);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml' };
createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = pathname === '/' ? 'index.html' : pathname.slice(1);
    const isAsset = file.startsWith('assets/') && ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg'].includes(path.extname(file).toLowerCase());
    if (!publicFiles.has(file) && !isAsset) { res.writeHead(404); res.end('Not found'); return; }
    const resolved = await realpath(path.resolve(root, file));
    if (!resolved.startsWith(root + path.sep) || (isAsset && !resolved.startsWith(path.join(root, 'assets') + path.sep))) { res.writeHead(404); res.end('Not found'); return; }
    const content = await readFile(resolved);
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)], 'Cache-Control': 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch { res.writeHead(400); res.end('Bad request'); }
}).listen(port, '127.0.0.1', () => console.log(`Ollama Atelier: http://127.0.0.1:${port}`));
