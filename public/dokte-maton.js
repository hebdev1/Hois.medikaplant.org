/* =====================================================================
   Doktè Maton — embeddable natural-remedy assistant for medikaplantshop.com
   ---------------------------------------------------------------------
   A self-contained, dependency-free widget that reproduces the "Doktè
   Maton" assistant from the Hoïs site so it can live on the WordPress /
   WooCommerce shop. Drop it in with a single tag:

       <script src="https://hoismedikaplant.com/dokte-maton.js" defer></script>

   • NO runtime LLM. Matching is keyword-based over the same Supabase
     dictionary the Hoïs site uses (RPC get_remed_finder_data), fetched
     once per tab session and cached. Copy stays suggestion-only (never
     diagnostic); the FDA disclaimer is pinned and non-dismissable.
   • Renders inside a Shadow DOM so the shop's theme (Astra) can't alter
     the widget and the widget can't leak styles into the shop.
   • Each suggested product links straight to its shop page.

   The Supabase key below is the PUBLISHABLE (anon) key — safe for public
   client code, protected by row-level security. It is the same key the
   public Hoïs bundle already ships.
   ===================================================================== */
(function () {
  'use strict';

  // Guard against double-injection (e.g. the tag pasted twice).
  if (window.__dokteMatonLoaded) return;
  window.__dokteMatonLoaded = true;

  var RPC_URL =
    'https://kmzmtuthwssyuoklmydy.supabase.co/rest/v1/rpc/get_remed_finder_data';
  var ANON_KEY = 'sb_publishable_s0eA-T_46VT37JEBc8apwQ_IZPyiDwq';
  var DATA_KEY = 'dm-remed-data-v1';
  var SEEN_KEY = 'dm-remed-seen';

  // Where the launcher sits. Default: bottom-RIGHT, stacked just ABOVE the
  // shop's side-cart basket (which sits at ~bottom 113–183px, above the
  // HubSpot chat at 0–96px). Override from the <script> tag, e.g.:
  //   <script src=".../dokte-maton.js" defer
  //           data-side="left" data-bottom="96" data-margin="20"></script>
  // (defer scripts have a null document.currentScript, so find the tag by src.)
  function readCfg() {
    var s = document.querySelector('script[src*="dokte-maton"]');
    var d = (s && s.dataset) || {};
    var bottom = parseInt(d.bottom, 10);
    var margin = parseInt(d.margin, 10);
    return {
      side: d.side === 'left' ? 'left' : 'right',
      bottom: isNaN(bottom) ? 196 : bottom,
      margin: isNaN(margin) ? 14 : margin,
    };
  }
  var CFG = readCfg();

  var DISCLAIMER =
    'Pwodui sa yo pa fèt pou dyagnostike, trete, geri, oswa anpeche okenn ' +
    'maladi. Deklarasyon sa yo pa evalye pa FDA. Toujou konsilte yon ' +
    'pwofesyonèl sante anvan ou itilize remèd fèy, sitou si w ap pran ' +
    'medikaman. Kite yon espas 2 èdtan ant pwodui fèy yo ak medikaman ' +
    'preskri yo.';

  /* ---------------------------------------------------------------- data */

  var dataCache = null;
  var inflight = null;

  function loadData() {
    if (dataCache) return Promise.resolve(dataCache);

    try {
      var raw = sessionStorage.getItem(DATA_KEY);
      if (raw) {
        dataCache = JSON.parse(raw);
        return Promise.resolve(dataCache);
      }
    } catch (e) {
      /* private mode / quota — fall through to network */
    }

    if (!inflight) {
      inflight = fetch(RPC_URL, {
        method: 'POST',
        headers: {
          apikey: ANON_KEY,
          Authorization: 'Bearer ' + ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: '{}',
      })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (json) {
          dataCache = json;
          try {
            sessionStorage.setItem(DATA_KEY, JSON.stringify(json));
          } catch (e) {
            /* best-effort */
          }
          return json;
        })
        .finally(function () {
          inflight = null;
        });
    }
    return inflight;
  }

  // Derived lookups (built once per data load).
  var derived = null;
  function buildDerived(data) {
    if (derived) return derived;
    var productById = {};
    for (var i = 0; i < data.products.length; i++) {
      productById[data.products[i].id] = data.products[i];
    }
    var byCondition = {};
    for (var j = 0; j < data.mappings.length; j++) {
      var m = data.mappings[j];
      (byCondition[m.condition_id] = byCondition[m.condition_id] || []).push(m);
    }
    Object.keys(byCondition).forEach(function (k) {
      byCondition[k].sort(function (a, b) {
        return a.priority - b.priority;
      });
    });
    derived = { productById: productById, byCondition: byCondition };
    return derived;
  }

  function productsFor(conditionId, seen) {
    if (!derived) return [];
    var rows = derived.byCondition[conditionId] || [];
    var out = [];
    for (var i = 0; i < rows.length; i++) {
      var pid = rows[i].product_id;
      if (seen[pid]) continue;
      var p = derived.productById[pid];
      if (!p) continue;
      seen[pid] = true;
      out.push(p);
    }
    // In-stock first; out-of-stock still shown, at the end.
    var inStock = out.filter(function (p) { return p.in_stock; });
    var out_ = out.filter(function (p) { return !p.in_stock; });
    return inStock.concat(out_);
  }

  /* ------------------------------------------------------------- matching */

  function normalize(s) {
    return (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Bounded Levenshtein for light typo tolerance.
  function lev(a, b) {
    var al = a.length, bl = b.length;
    if (al === 0) return bl;
    if (bl === 0) return al;
    var prev = [], i, j;
    for (j = 0; j <= bl; j++) prev[j] = j;
    for (i = 1; i <= al; i++) {
      var cur = [i];
      for (j = 1; j <= bl; j++) {
        var cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      }
      prev = cur;
    }
    return prev[bl];
  }

  // Kreyòl/French particles that must never carry a match on their own —
  // they appear in almost every phrase ("pa ka dòmi", "sa k ap...").
  var STOP = {
    pa: 1, ka: 1, ki: 1, yon: 1, sou: 1, ak: 1, nan: 1, epi: 1, oswa: 1,
    mwen: 1, ou: 1, li: 1, yo: 1, se: 1, de: 1, la: 1, nou: 1, pou: 1,
    men: 1, sa: 1, gen: 1, kap: 1, nou: 1, ap: 1, kont: 1, twop: 1,
  };

  // Score how well a normalized query matches a single normalized term.
  function termScore(q, t) {
    if (!t) return 0;
    if (q === t) return 1;
    if (q.length < 2 || t.length < 2) return 0;
    // A) the query is a fragment/prefix of the keyword (user typed part of it).
    if (q.length >= 3 && t.indexOf(q) !== -1) {
      return 0.8 + 0.15 * (q.length / t.length);
    }
    // B) the keyword appears as a WHOLE WORD inside the query. Word-bounded so
    //    a short keyword like "ren" can't latch onto "mig-ren" / "si-ren".
    if (t.length >= 3 && (' ' + q + ' ').indexOf(' ' + t + ' ') !== -1) {
      return 0.82;
    }
    // token overlap — meaningful words only (>= 4 chars, not a particle).
    var qt = q.split(' '), tt = t.split(' '), k, l;
    for (k = 0; k < qt.length; k++) {
      var w = qt[k];
      if (w.length < 4 || STOP[w]) continue;
      for (l = 0; l < tt.length; l++) {
        if (w === tt[l]) return 0.76;
        if (tt[l].length >= 4 && tt[l].indexOf(w) === 0) return 0.64;
      }
    }
    // fuzzy whole-string (typos) — only when the two are comparable in length.
    if (Math.min(q.length, t.length) >= 4) {
      var d = lev(q, t);
      var r = d / Math.max(q.length, t.length);
      if (r <= 0.28) return 0.7 * (1 - r);
    }
    return 0;
  }

  function scoreCondition(q, cond) {
    var best = 0, i;
    var kws = cond.keywords || [];
    for (i = 0; i < kws.length; i++) {
      best = Math.max(best, termScore(q, normalize(kws[i])));
      if (best === 1) return 1;
    }
    var names = [cond.name_ht, cond.name_fr, cond.name_en];
    for (i = 0; i < names.length; i++) {
      if (names[i]) best = Math.max(best, termScore(q, normalize(names[i])) * 0.6);
    }
    return best;
  }

  function search(q, data) {
    var scored = [];
    for (var i = 0; i < data.conditions.length; i++) {
      var s = scoreCondition(q, data.conditions[i]);
      if (s >= 0.5) scored.push({ c: data.conditions[i], s: s });
    }
    scored.sort(function (a, b) { return b.s - a.s; });
    var seen = {}, out = [];
    for (var j = 0; j < scored.length && out.length < 3; j++) {
      var products = productsFor(scored[j].c.id, seen);
      if (products.length) out.push({ condition: scored[j].c, products: products });
    }
    return out;
  }

  /* ---------------------------------------------------------------- icons */

  var I = {
    steth:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.3.3 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>',
    search:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
    x:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    leaf:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
    ext:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
  };

  /* ------------------------------------------------------------------ css */

  var CSS =
    ':host{all:initial}' +
    '*{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}' +
    '.dm-btn{position:fixed;bottom:20px;right:20px;z-index:2147483000;display:inline-flex;align-items:center;gap:8px;padding:6px 14px 6px 6px;border:1px solid rgba(101,136,26,.55);border-radius:999px;background:linear-gradient(135deg,#547216,#33450e);color:#fefcf6;box-shadow:0 10px 30px -8px rgba(51,69,14,.55);cursor:pointer;transition:filter .2s,transform .2s;line-height:1}' +
    '.dm-btn:hover{filter:brightness(1.1)}' +
    '.dm-btn:active{transform:scale(.97)}' +
    '.dm-btn-av{position:relative;display:grid;place-items:center;width:32px;height:32px;border-radius:999px;background:#eaefce;color:#435b12;border:1px solid #dfe1b5;box-shadow:inset 0 1px 2px rgba(0,0,0,.08)}' +
    '.dm-btn-av svg{width:16px;height:16px}' +
    '.dm-dot{position:absolute;bottom:-2px;right:-2px;width:11px;height:11px;border-radius:999px;background:#e78e17;border:2px solid #33450e}' +
    '.dm-btn-tx{display:flex;flex-direction:column;align-items:flex-start;gap:1px}' +
    '.dm-btn-tx b{font-size:13px;font-weight:700;letter-spacing:-.01em}' +
    '.dm-btn-tx span{font-size:9px;text-transform:uppercase;letter-spacing:.14em;color:rgba(250,246,237,.85)}' +
    '.dm-pulse::before{content:"";position:absolute;inset:0;border-radius:999px;background:rgba(231,142,23,.35);animation:dm-pulse 2s ease-out infinite;pointer-events:none}' +
    '@keyframes dm-pulse{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.6);opacity:0}}' +
    // Mobile: collapse the labelled pill to a compact icon-only circle (~52px)
    // so it stays out of the way on a small, crowded screen.
    '@media(max-width:639px){.dm-btn{gap:0;padding:6px}.dm-btn-tx{display:none}.dm-btn-av{width:40px;height:40px}.dm-btn-av svg{width:20px;height:20px}}' +
    /* overlay + panel */
    '.dm-ov{position:fixed;inset:0;z-index:2147483600;display:flex;align-items:flex-end;justify-content:center}' +
    '.dm-bd{position:absolute;inset:0;background:rgba(5,0,64,.30);border:0;cursor:default}' +
    '.dm-panel{position:relative;width:100%;max-height:86vh;background:#fff;border:1px solid #f1ead7;border-radius:18px 18px 0 0;box-shadow:0 -10px 50px -12px rgba(5,0,64,.35);display:flex;flex-direction:column;overflow:hidden;animation:dm-up .28s cubic-bezier(.2,.8,.2,1)}' +
    '@keyframes dm-up{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}' +
    '@media(min-width:640px){.dm-ov{align-items:flex-end;justify-content:flex-end;padding:24px}.dm-ov.dm-left{justify-content:flex-start}.dm-bd{background:transparent}.dm-panel{width:400px;max-height:72vh;border-radius:18px}}' +
    /* header */
    '.dm-hd{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 14px 12px;border-bottom:1px solid #faf6ed;background:linear-gradient(to bottom,rgba(246,248,236,.6),transparent)}' +
    '.dm-hdl{display:flex;align-items:center;gap:10px;min-width:0}' +
    '.dm-av{position:relative;display:grid;place-items:center;width:36px;height:36px;border-radius:999px;background:#eaefce;color:#435b12;border:1px solid #dfe1b5;flex-shrink:0}' +
    '.dm-av svg{width:18px;height:18px}' +
    '.dm-av .dm-dot{border-color:#fff}' +
    '.dm-ttl{min-width:0}' +
    '.dm-ttl h2{font-size:16px;font-weight:700;color:#050040;line-height:1.15}' +
    '.dm-ttl p{font-size:11px;color:#5c3d2e;display:flex;align-items:center;gap:5px;margin-top:1px}' +
    '.dm-live{width:6px;height:6px;border-radius:999px;background:#65881a;display:inline-block}' +
    '.dm-close{display:grid;place-items:center;width:32px;height:32px;border:0;border-radius:9px;background:transparent;color:#3a2218;cursor:pointer;flex-shrink:0}' +
    '.dm-close:hover{background:#faf6ed}.dm-close svg{width:16px;height:16px}' +
    /* body */
    '.dm-bdy{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;min-height:150px}' +
    '.dm-row{display:flex;align-items:flex-start;gap:8px}' +
    '.dm-sav{display:grid;place-items:center;width:28px;height:28px;border-radius:999px;background:#eaefce;color:#435b12;border:1px solid #dfe1b5;flex-shrink:0}' +
    '.dm-sav svg{width:14px;height:14px}.dm-sav .dm-dot{width:9px;height:9px;border-color:#fff;bottom:-1px;right:-1px}' +
    '.dm-bub{border-radius:16px;border-top-left-radius:4px;background:#f6f8ec;border:1px solid #eaefce;padding:9px 12px;font-size:13px;line-height:1.45;color:#050040}' +
    '.dm-bub b{font-weight:700}.dm-bub i{font-style:italic}' +
    '.dm-indent{padding-left:36px;display:flex;flex-direction:column;gap:16px}' +
    '.dm-chips-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.16em;color:#8e6552;margin-bottom:8px}' +
    '.dm-chips{display:flex;flex-wrap:wrap;gap:6px}' +
    '.dm-chip{display:inline-flex;align-items:center;gap:4px;padding:6px 10px;border-radius:999px;background:#f6f8ec;border:1px solid #eaefce;color:#33450e;font-size:12px;font-weight:600;cursor:pointer;transition:background .15s,border-color .15s}' +
    '.dm-chip:hover{background:#eaefce;border-color:#c5cf5e}' +
    '.dm-sect h3{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.02em;color:#33450e;margin-bottom:8px;display:flex;align-items:center;gap:6px}' +
    '.dm-cards{display:flex;flex-direction:column;gap:8px}' +
    '.dm-card{display:flex;gap:12px;border:1px solid #f1ead7;background:#fff;border-radius:12px;padding:10px;transition:border-color .15s}' +
    '.dm-card:hover{border-color:#c5cf5e}' +
    '.dm-thumb{position:relative;width:56px;height:56px;border-radius:9px;overflow:hidden;background:#f6f8ec;flex-shrink:0;display:grid;place-items:center;color:#93b031}' +
    '.dm-thumb img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.dm-thumb svg{width:24px;height:24px}' +
    '.dm-cbody{flex:1;min-width:0}' +
    '.dm-crow{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}' +
    '.dm-cname{font-size:14px;font-weight:600;color:#050040;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
    '.dm-price{font-size:12px;font-weight:700;color:#33450e;white-space:nowrap;flex-shrink:0}' +
    '.dm-ben{margin-top:2px;font-size:11px;color:#5c3d2e;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
    '.dm-cfoot{margin-top:6px;display:flex;align-items:center;gap:8px}' +
    '.dm-link{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:#435b12;text-decoration:none}' +
    '.dm-link:hover{color:#23300a}.dm-link svg{width:12px;height:12px}' +
    '.dm-oos{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;padding:2px 6px;border-radius:999px;background:#f1ead7;color:#5c3d2e}' +
    '.dm-typing{display:flex;gap:4px;align-items:center;padding:10px 12px;border-radius:16px;border-top-left-radius:4px;background:#f6f8ec;border:1px solid #eaefce}' +
    '.dm-typing i{width:6px;height:6px;border-radius:999px;background:#65881a;display:inline-block;animation:dm-bounce 1s infinite}' +
    '.dm-typing i:nth-child(1){animation-delay:-.3s}.dm-typing i:nth-child(2){animation-delay:-.15s}' +
    '@keyframes dm-bounce{0%,80%,100%{transform:translateY(0);opacity:.5}40%{transform:translateY(-4px);opacity:1}}' +
    '.dm-load{display:flex;align-items:center;justify-content:center;gap:8px;padding:32px 0;font-size:14px;color:#5c3d2e}' +
    '.dm-spin{width:16px;height:16px;border:2px solid #dfe1b5;border-top-color:#547216;border-radius:999px;animation:dm-spin 1s linear infinite}' +
    '@keyframes dm-spin{to{transform:rotate(360deg)}}' +
    '.dm-err{border-radius:12px;background:#fff1f2;border:1px solid #fecdd3;padding:9px 12px;font-size:12px;color:#9f1239}' +
    /* composer + disclaimer */
    '.dm-comp{padding:8px 14px;border-top:1px solid #faf6ed;position:relative}' +
    '.dm-comp .dm-search{position:absolute;left:26px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#8e6552;pointer-events:none}' +
    '.dm-input{width:100%;padding:10px 14px 10px 36px;border-radius:999px;background:#fefcf6;border:1px solid #f1ead7;font-size:14px;color:#050040;outline:none;transition:border-color .15s,box-shadow .15s}' +
    '.dm-input::placeholder{color:#8e6552}' +
    '.dm-input:focus{border-color:#c5cf5e;box-shadow:0 0 0 3px rgba(197,207,94,.35)}' +
    '.dm-disc{padding:9px 14px;border-top:1px solid #f1ead7;background:#fefcf6}' +
    '.dm-disc p{font-size:9.5px;line-height:1.4;color:#5c3d2e}' +
    '@media(prefers-reduced-motion:reduce){.dm-panel,.dm-typing i,.dm-spin,.dm-pulse::before{animation:none}}';

  /* ---------------------------------------------------------------- utils */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function priceLabel(p) {
    if (p.price_min == null) return null;
    var min = '$' + Number(p.price_min).toFixed(2).replace(/\.00$/, '');
    if (p.price_max != null && p.price_max > p.price_min) return 'Apati ' + min;
    return min;
  }

  function productCardHTML(p) {
    var price = priceLabel(p);
    var thumb = p.image_url
      ? '<img src="' + esc(p.image_url) + '" alt="' + esc(p.name) + '" loading="lazy" onerror="this.style.display=\'none\'">' + I.leaf
      : I.leaf;
    return (
      '<div class="dm-card">' +
      '<div class="dm-thumb">' + thumb + '</div>' +
      '<div class="dm-cbody">' +
      '<div class="dm-crow"><span class="dm-cname">' + esc(p.name) + '</span>' +
      (price ? '<span class="dm-price">' + esc(price) + '</span>' : '') +
      '</div>' +
      (p.short_benefit_ht ? '<p class="dm-ben">' + esc(p.short_benefit_ht) + '</p>' : '') +
      '<div class="dm-cfoot">' +
      '<a class="dm-link" href="' + esc(p.shop_url) + '" target="_blank" rel="noopener noreferrer">Wè sou boutik la ' + I.ext + '</a>' +
      (p.in_stock ? '' : '<span class="dm-oos">Ripti stòk</span>') +
      '</div></div></div>'
    );
  }

  function savatar() {
    return '<span class="dm-sav">' + I.steth + '<span class="dm-dot"></span></span>';
  }

  /* ----------------------------------------------------------------- mount */

  var host = document.createElement('div');
  host.id = 'dokte-maton-root';
  var shadow = host.attachShadow({ mode: 'open' });
  var style = document.createElement('style');
  style.textContent = CSS;
  shadow.appendChild(style);

  var pulse = false;
  try { pulse = !sessionStorage.getItem(SEEN_KEY); } catch (e) {}

  // Launcher button
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'dm-btn' + (pulse ? ' dm-pulse' : '');
  btn.setAttribute('aria-label', 'Louvri Doktè Maton, asistan remèd natirèl');
  btn.innerHTML =
    '<span class="dm-btn-av">' + I.steth + '<span class="dm-dot"></span></span>' +
    '<span class="dm-btn-tx"><b>Doktè Maton</b><span>Asistan remèd</span></span>';
  // Position from config (overrides the CSS corner defaults).
  btn.style.bottom = CFG.bottom + 'px';
  btn.style[CFG.side] = CFG.margin + 'px';
  btn.style[CFG.side === 'left' ? 'right' : 'left'] = 'auto';
  shadow.appendChild(btn);

  var overlay = null;
  var state = { data: null, loading: false, error: null, query: '', results: [], thinking: false };
  var timers = { think: null };

  function markSeen() {
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) {}
  }

  function open() {
    if (overlay) return;
    btn.classList.remove('dm-pulse');
    markSeen();
    overlay = document.createElement('div');
    overlay.className = 'dm-ov' + (CFG.side === 'left' ? ' dm-left' : '');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Doktè Maton, asistan remèd natirèl');
    overlay.innerHTML =
      '<button class="dm-bd" type="button" aria-label="Fèmen"></button>' +
      '<div class="dm-panel">' +
      '<div class="dm-hd"><div class="dm-hdl"><span class="dm-av">' + I.steth + '<span class="dm-dot"></span></span>' +
      '<div class="dm-ttl"><h2>Doktè Maton</h2><p><span class="dm-live"></span>Asistan remèd natirèl · an liy</p></div></div>' +
      '<button class="dm-close" type="button" aria-label="Fèmen">' + I.x + '</button></div>' +
      '<div class="dm-bdy"></div>' +
      '<div class="dm-comp"><span class="dm-search">' + I.search + '</span>' +
      '<input class="dm-input" type="search" placeholder="Di Doktè Maton sa k ap deranje w…" aria-label="Ekri yon sentòm oswa kondisyon pou Doktè Maton"></div>' +
      '<div class="dm-disc"><p>' + esc(DISCLAIMER) + '</p></div>' +
      '</div>';
    shadow.appendChild(overlay);

    overlay.querySelector('.dm-bd').addEventListener('click', close);
    overlay.querySelector('.dm-close').addEventListener('click', close);
    var input = overlay.querySelector('.dm-input');
    input.addEventListener('input', function (e) { onQuery(e.target.value); });

    document.addEventListener('keydown', onEsc);

    // Fetch on first open.
    if (state.data) {
      render();
      input.focus();
    } else {
      state.loading = true;
      render();
      loadData()
        .then(function (d) {
          state.data = d;
          buildDerived(d);
          state.loading = false;
          state.error = null;
          render();
          input.focus();
        })
        .catch(function (err) {
          state.loading = false;
          state.error = err && err.message ? err.message : 'erè';
          render();
        });
    }
  }

  function close() {
    if (!overlay) return;
    document.removeEventListener('keydown', onEsc);
    if (timers.think) { clearTimeout(timers.think); timers.think = null; }
    overlay.remove();
    overlay = null;
    state.query = '';
    state.results = [];
    state.thinking = false;
  }

  function onEsc(e) { if (e.key === 'Escape') close(); }

  function onQuery(val) {
    state.query = val;
    var q = normalize(val);
    if (timers.think) { clearTimeout(timers.think); timers.think = null; }
    if (q.length < 2) {
      state.thinking = false;
      state.results = [];
      render();
      return;
    }
    state.thinking = true;
    render();
    timers.think = setTimeout(function () {
      state.thinking = false;
      state.results = state.data ? search(q, state.data) : [];
      render();
    }, 520);
  }

  function selectCondition(cond) {
    var input = overlay && overlay.querySelector('.dm-input');
    if (input) input.value = cond.name_ht;
    state.query = cond.name_ht;
    if (timers.think) { clearTimeout(timers.think); timers.think = null; }
    state.thinking = false;
    var seen = {};
    var products = productsFor(cond.id, seen);
    state.results = products.length ? [{ condition: cond, products: products }] : [];
    render();
  }

  function render() {
    if (!overlay) return;
    var body = overlay.querySelector('.dm-bdy');
    var q = normalize(state.query);
    var hasQuery = q.length >= 2;
    var html = '';

    if (state.loading) {
      html = '<div class="dm-load"><span class="dm-spin"></span>Ap prepare Doktè Maton…</div>';
      body.innerHTML = html;
      return;
    }
    if (state.error) {
      html +=
        '<div class="dm-err">Doktè Maton pa rive konekte (' + esc(state.error) +
        '). Tcheke koneksyon w epi eseye ankò.</div>';
      body.innerHTML = html;
      return;
    }

    if (!hasQuery) {
      // Intro: greeting + featured chips
      html +=
        '<div class="dm-row">' + savatar() +
        '<div class="dm-bub">Bonjou 👋 Mwen se <b>Doktè Maton</b>. Di m ki jan w santi w — ' +
        'yon sentòm oswa yon kondisyon, epi m ap sijere w kèk <b>remèd fèy natirèl</b> ki ka ede w.</div></div>';
      var featured = (state.data ? state.data.conditions : []).filter(function (c) { return c.is_featured; });
      if (featured.length) {
        var chips = '';
        for (var i = 0; i < featured.length; i++) {
          var c = featured[i];
          chips += '<button class="dm-chip" type="button" data-cid="' + esc(c.id) + '">' +
            (c.emoji ? '<span>' + c.emoji + '</span>' : '') + esc(c.name_ht) + '</button>';
        }
        html += '<div class="dm-indent"><div><div class="dm-chips-lbl">Kondisyon popilè</div><div class="dm-chips">' + chips + '</div></div></div>';
      }
    } else if (state.thinking) {
      html += '<div class="dm-row">' + savatar() +
        '<div class="dm-typing"><i></i><i></i><i></i></div></div>';
    } else if (state.results.length) {
      html +=
        '<div class="dm-row">' + savatar() +
        '<div class="dm-bub">Dapre sa w di m, men kèk remèd fèy ou ka konsidere 🌿 Chak lyen mennen w sou boutik la.</div></div>';
      var sections = '';
      for (var s = 0; s < state.results.length; s++) {
        var r = state.results[s];
        var cards = '';
        for (var p = 0; p < r.products.length; p++) cards += productCardHTML(r.products[p]);
        sections +=
          '<div class="dm-sect"><h3>' + (r.condition.emoji ? '<span>' + r.condition.emoji + '</span>' : '') +
          esc(r.condition.name_ht) + '</h3><div class="dm-cards">' + cards + '</div></div>';
      }
      html += '<div class="dm-indent">' + sections + '</div>';
    } else {
      html +=
        '<div class="dm-row">' + savatar() +
        '<div class="dm-bub">M pa jwenn anyen pou sa 🌿 Eseye yon lòt mo (egzanp: <i>tansyon</i>, <i>pa ka dòmi</i>), ' +
        'oswa chwazi youn nan kategori anwo yo.</div></div>';
    }

    body.innerHTML = html;

    // Wire chip taps.
    var chipEls = body.querySelectorAll('.dm-chip');
    for (var k = 0; k < chipEls.length; k++) {
      (function (el) {
        el.addEventListener('click', function () {
          var cid = el.getAttribute('data-cid');
          var cond = state.data.conditions.filter(function (c) { return c.id === cid; })[0];
          if (cond) selectCondition(cond);
        });
      })(chipEls[k]);
    }
  }

  btn.addEventListener('click', open);
  // Allow other scripts to open the assistant.
  window.addEventListener('open-remed-finder', open);

  document.body.appendChild(host);
})();
