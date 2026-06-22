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

// ── Boot-time env var check ─────────────────────────────────────────────
// Print a loud table of what's set vs missing before Next.js gets a
// chance to crash silently. Hostinger's panel surfaces stdout in the
// Application Logs tab, so this is the cheapest possible "what's wrong"
// for the operator. We don't ABORT on missing — Next.js may still serve
// pages that don't depend on those env vars — but the warning is the
// first thing the operator sees.
const REQUIRED_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SITE_URL',
];
const OPTIONAL_ENV = [
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'SUPABASE_AUTH_HOOK_SECRET',
  'SUPABASE_SERVICE_ROLE_KEY',
  'HUBSPOT_PRIVATE_APP_TOKEN',
];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
const optMissing = OPTIONAL_ENV.filter((k) => !process.env[k]);
console.log(
  `[boot] Node ${process.version} · env: ` +
    `${REQUIRED_ENV.length - missing.length}/${REQUIRED_ENV.length} required, ` +
    `${OPTIONAL_ENV.length - optMissing.length}/${OPTIONAL_ENV.length} optional`
);
if (missing.length) {
  console.warn(`[boot] ⚠ Missing REQUIRED env vars: ${missing.join(', ')}`);
  console.warn(
    '[boot]   ↳ pages that read these will return 500 until they are set'
  );
}
if (optMissing.length) {
  console.log(`[boot] ℹ Missing optional env vars: ${optMissing.join(', ')}`);
}

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

function bindSocketWithRetry(server, socketPath, attempt = 1) {
  // The old process from a previous deploy holds an fd on the socket
  // file even after we unlinkSync it — listen() then EADDRINUSE's. Retry
  // a few times with a short backoff so an overlapping restart heals
  // automatically instead of leaving us 503'd.
  try {
    fs.unlinkSync(socketPath);
  } catch (_) {
    /* fine if it didn't exist */
  }
  const onError = (err) => {
    server.removeListener('listening', onListening);
    if (err && err.code === 'EADDRINUSE' && attempt < 6) {
      const delay = 250 * attempt; // 250ms, 500ms, 750ms, 1s, 1.25s, 1.5s
      console.warn(
        `[boot] socket busy (attempt ${attempt}/6), retrying in ${delay}ms…`
      );
      setTimeout(
        () => bindSocketWithRetry(server, socketPath, attempt + 1),
        delay
      );
      return;
    }
    console.error('[boot] failed to bind socket:', err);
    // Last-resort fallback: bind TCP so the process at least answers
    // /api/health and Hostinger can show a useful "process running but
    // socket unbound" state instead of pure 503.
    console.warn(
      `[boot] falling back to TCP 0.0.0.0:${port} so health probes can land`
    );
    server.listen(port, '0.0.0.0', () => {
      console.log(`> Ready on http://0.0.0.0:${port} (TCP fallback)`);
    });
  };
  const onListening = () => {
    server.removeListener('error', onError);
    try {
      fs.chmodSync(socketPath, 0o666);
    } catch (_) {
      /* best-effort */
    }
    console.log(`> Ready on socket ${socketPath}`);
  };
  server.once('error', onError);
  server.once('listening', onListening);
  server.listen(socketPath);
}

// Hostinger sometimes restarts the app abruptly (deploy hooks, healthcheck
// timeouts). Catch unhandled rejections + exceptions so a transient blip
// in a third-party SDK call doesn't bring down the entire process and
// trigger another deploy-restart loop.
process.on('unhandledRejection', (reason) => {
  console.error('[boot] unhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[boot] uncaughtException:', err);
});

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
    bindSocketWithRetry(server, rawHost);
  } else {
    server.listen(port, tcpHost, () => {
      console.log(`> Ready on http://${tcpHost}:${port}`);
    });
  }
});
