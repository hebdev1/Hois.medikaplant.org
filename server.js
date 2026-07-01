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
  // Bearer token for /api/cron/* + /api/webhooks/badge-unlocked. Cron
  // and the badge trigger both send this header, and the endpoints 401
  // silently if it's missing. Kept optional at boot so the app still
  // starts when the operator is mid-setup, but a missing value means
  // the entire notification/scheduling stack is dark until it lands.
  'CRON_SECRET',
  'CONTACT_REPLY_TO',
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

const MAX_BIND_ATTEMPTS = 20;

function bindSocketWithRetry(server, socketPath, attempt = 1) {
  // The old process from a previous deploy holds an fd on the socket
  // file even after we unlinkSync it — listen() then EADDRINUSE's.
  // Hostinger's process-swap window can leave the old worker holding
  // the socket for 10-15 seconds during graceful shutdown, so we
  // retry patiently with a longer total budget. Better to take 20s
  // to come up than to fall through to TCP (where LSWS can't reach
  // us) and serve 503 for the whole worker lifetime.
  try {
    fs.unlinkSync(socketPath);
  } catch (_) {
    /* fine if it didn't exist */
  }
  const onError = (err) => {
    server.removeListener('listening', onListening);
    if (err && err.code === 'EADDRINUSE' && attempt < MAX_BIND_ATTEMPTS) {
      // 1s flat — predictable cadence is easier to read in logs than
      // a varying backoff, and matches LSWS' typical worker-swap pace.
      const delay = 1000;
      console.warn(
        `[boot] socket busy (attempt ${attempt}/${MAX_BIND_ATTEMPTS}), retrying in ${delay}ms…`
      );
      setTimeout(
        () => bindSocketWithRetry(server, socketPath, attempt + 1),
        delay
      );
      return;
    }
    console.error('[boot] failed to bind socket after retries:', err);
    // Last-resort fallback so the process at least answers /api/health.
    // LSWS itself only routes to the socket, so this will only help
    // direct TCP probes (Hostinger's panel + our own monitoring).
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

// Graceful shutdown — if the next deploy SIGTERMs us, close the HTTP
// server and unlink the socket so the new worker can bind cleanly
// instead of fighting us for 20 seconds of EADDRINUSE retries.
function attachShutdownHandlers(server, socketPath) {
  const cleanup = (signal) => {
    console.log(`[boot] received ${signal}, closing server…`);
    const finish = () => {
      if (socketPath) {
        try {
          fs.unlinkSync(socketPath);
          console.log('[boot] socket unlinked');
        } catch (_) {
          /* fine */
        }
      }
      process.exit(0);
    };
    // server.close stops accepting new connections, then fires its
    // callback once existing ones drain. Force-exit after 5s so a
    // hung connection can't keep us alive past the deploy window.
    let exited = false;
    const forceTimer = setTimeout(() => {
      if (!exited) {
        exited = true;
        console.warn('[boot] force-exit after 5s drain timeout');
        finish();
      }
    }, 5000);
    server.close(() => {
      if (!exited) {
        exited = true;
        clearTimeout(forceTimer);
        finish();
      }
    });
  };
  process.on('SIGTERM', () => cleanup('SIGTERM'));
  process.on('SIGINT', () => cleanup('SIGINT'));
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

  attachShutdownHandlers(server, isSocket ? rawHost : null);

  if (isSocket) {
    bindSocketWithRetry(server, rawHost);
  } else {
    server.listen(port, tcpHost, () => {
      console.log(`> Ready on http://${tcpHost}:${port}`);
    });
  }
});
