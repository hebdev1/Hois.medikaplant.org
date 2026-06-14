// ───────────────────────────────────────────────────────────────────────────
// Custom Next.js server for Hostinger LiteSpeed.
//
// Hostinger's Node.js hosting runs apps under LiteSpeed (LSWS), which talks
// to your process over a **Unix domain socket** at a path like
//   /usr/local/lsws/extapp-sock/<domain>:_.sock
// rather than a TCP port. `next start` only knows how to listen on a TCP
// port, so the bare `next start` boots up, prints "Starting…", LSWS gives
// up waiting for a response on the socket, kills the process, and we end
// up in a loop where the app never reaches "Ready" — exactly the symptom
// we just saw in the runtime logs.
//
// This tiny custom server checks the HOSTNAME env var:
//   • If it looks like a socket path (starts with '/' or ends with .sock),
//     bind there with fs cleanup + permissive chmod so LSWS can reach it.
//   • Otherwise, fall back to TCP on PORT (Vercel, local dev, anywhere
//     that isn't socket-based).
//
// We invoke it with `node server.js`, which is what `npm start` now does.
// ───────────────────────────────────────────────────────────────────────────

const { createServer } = require('http');
const { parse } = require('url');
const fs = require('fs');
const next = require('next');

const port = parseInt(process.env.PORT || '3000', 10);
const rawHost = process.env.HOSTNAME || '';

// Socket path heuristic: an absolute path (starts with /) OR a non-empty
// string ending in .sock. LSWS uses both forms across plan tiers.
const isSocket =
  rawHost.startsWith('/') || rawHost.endsWith('.sock');

const tcpHost = isSocket ? '0.0.0.0' : rawHost || '0.0.0.0';

// Next.js still expects `hostname` + `port` for its own internal URL
// resolution (it shows them in the boot log). When binding to a socket we
// just feed it innocuous values — they aren't used for the actual listen.
const app = next({ hostname: tcpHost, port, dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url || '/', true);
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request', err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  if (isSocket) {
    // Clean up a stale socket file from a previous run; if it's still
    // there `listen` would EADDRINUSE.
    try {
      fs.unlinkSync(rawHost);
    } catch (_) {
      /* fine if it didn't exist */
    }
    server.listen(rawHost, () => {
      // LSWS runs as a different uid than our Node process; without this
      // it can't read/write to the socket and falls back to 503.
      try {
        fs.chmodSync(rawHost, 0o666);
      } catch (_) {
        /* best-effort */
      }
      console.log(`> Ready on socket ${rawHost}`);
    });
  } else {
    server.listen(port, tcpHost, () => {
      console.log(`> Ready on http://${tcpHost}:${port}`);
    });
  }
});
