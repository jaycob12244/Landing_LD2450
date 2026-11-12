import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';

const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/landing.js', ['landing.js', 'text/javascript; charset=utf-8']],
  ['/assets/ld2450-inicio.webp', ['assets/ld2450-inicio.webp', 'image/webp']],
  ['/assets/ld2450-despiece.webp', ['assets/ld2450-despiece.webp', 'image/webp']],
  ['/assets/ld2450-scroll.mp4', ['assets/ld2450-scroll.mp4', 'video/mp4']],
  ['/assets/animacion_scrolleo.mp4', ['assets/animacion_scrolleo.mp4', 'video/mp4']],
]);

function byteRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) return null;

  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  return start <= end ? { start, end } : null;
}

const port = Number(process.argv[2] ?? 8080);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('Indica un puerto entre 1 y 65535.');
  process.exit(1);
}

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  const entry = files.get(request.url.split('?')[0]);
  if (!entry) {
    response.writeHead(404).end();
    return;
  }

  const [path, type] = entry;
  const file = new URL(path, import.meta.url);
  const info = await stat(file).catch(() => null);
  if (!info?.isFile()) {
    response.writeHead(404).end();
    return;
  }

  const headers = { 'Content-Type': type, 'Content-Length': info.size };
  let range;
  if (type === 'video/mp4') {
    headers['Accept-Ranges'] = 'bytes';
    if (request.method === 'GET' && request.headers.range) {
      range = byteRange(request.headers.range, info.size);
      if (!range) {
        response.writeHead(416, { 'Content-Range': `bytes */${info.size}` }).end();
        return;
      }
      headers['Content-Range'] = `bytes ${range.start}-${range.end}/${info.size}`;
      headers['Content-Length'] = range.end - range.start + 1;
    }
  }

  response.writeHead(range ? 206 : 200, headers);
  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  const stream = createReadStream(file, range ?? undefined);
  stream.once('error', () => response.destroy());
  response.once('close', () => stream.destroy());
  stream.pipe(response);
});

server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE'
    ? `El puerto ${port} está ocupado. Prueba con node server.mjs ${port === 8081 ? 8080 : 8081}.`
    : error.message);
  process.exitCode = 1;
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Presentación disponible en http://localhost:${port}`);
});
