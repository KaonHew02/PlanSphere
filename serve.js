/**
 * A static file server, and nothing else.
 *
 * PlanSphere is four files and a localStorage store — it has no build step
 * and no backend. This exists only because `file://` blocks the module and
 * fetch rules a browser applies to a real origin, so the app behaves subtly
 * differently opened from disk than it will once it is hosted.
 *
 *   node serve.js          → http://localhost:5173
 *   node serve.js 8080     → http://localhost:8080
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.argv[2]) || 5173;
const ROOT = __dirname;

const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'text/javascript; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.svg':  'image/svg+xml',
    '.json': 'application/json; charset=utf-8',
    '.md':   'text/markdown; charset=utf-8',
    '.png':  'image/png',
    '.ico':  'image/x-icon',
};

http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    const rel = url === '/' ? 'index.html' : url.replace(/^\/+/, '');

    /* Resolve first, then check the result is still inside ROOT. Checking the
       raw path for '..' misses the encoded and doubled-up forms. */
    const file = path.resolve(ROOT, rel);
    if (!file.startsWith(ROOT)) {
        res.writeHead(403).end('Forbidden');
        return;
    }

    fs.readFile(file, (err, body) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found: ' + rel);
            return;
        }
        res.writeHead(200, {
            'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
            'Cache-Control': 'no-store',
        }).end(body);
    });
}).listen(PORT, () => {
    console.log('PlanSphere on http://localhost:' + PORT);
});
