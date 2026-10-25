/* global process */
import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, resolve, relative, extname, sep, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), '../..'));
const port = Number(process.env.PORT || 5180);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT phải là số nguyên từ 1 đến 65535');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml' };
const inside = (path) => { const rel = relative(root, path); return !isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`) && !resolve(path).startsWith('\\\\'); };
createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    const path = decodeURIComponent(req.url.split('?')[0]);
    if (path.includes('\\') || path.includes('\0') || path.split('/').includes('..')) { res.writeHead(403); res.end('Forbidden'); return; }
    let file = resolve(root, `.${path}`);
    if (!inside(file)) { res.writeHead(403); res.end('Forbidden'); return; }
    file = await realpath(file);
    if (!inside(file)) { res.writeHead(403); res.end('Forbidden'); return; }
    if ((await stat(file)).isDirectory()) file = await realpath(resolve(file, 'index.html'));
    if (!inside(file)) { res.writeHead(403); res.end('Forbidden'); return; }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file).toLowerCase()] || 'application/octet-stream', 'Content-Length': body.length });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (error) { res.writeHead(error instanceof URIError ? 400 : 404); res.end('Không tìm thấy tệp'); }
}).listen(port, '127.0.0.1', () => console.log(`Asset admin: http://localhost:${port}/tools/asset-admin/index.html`));
