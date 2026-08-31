'use client';

import React from 'react';

export type GlossTerm = {
  code: string;
  name: string;
  variants: string[];
  family: string;
  scientific: string;
  tramil: string; // 'konfime' | 'pa-jwenn'
  status: string; // 'verifye' | 'pwovizwa' | 'pwoblèm'
  note: string;
  letter: string;
};

const LABEL: Record<string, string> = {
  verifye: 'Verifye',
  pwovizwa: 'Pwovizwa',
  'pwoblèm': 'Pou revizyon',
};
// CSS-safe status key (pwoblèm → pwoblem for class names)
const CLS = (s: string) => (s === 'pwoblèm' ? 'pwoblem' : s);
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const PATHS: Record<string, React.ReactNode> = {
  search: (<><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></>),
  check: <path d="M5 12.5l4.5 4.5L19 6.5" />,
  clock: (<><circle cx="12" cy="12" r="8" /><path d="M12 8v4.5l3 2" /></>),
  alert: (<><path d="M12 4.5l8.5 15h-17z" /><path d="M12 10v4.2" /><path d="M12 17.4v.05" /></>),
  leaf: (<><path d="M5 19.5C4 12 10 5 20 4.5c.5 10-6.5 16-15 15z" /><path d="M5.5 19c3.5-5.5 7.5-8.5 11.5-10.5" /></>),
  dash: <path d="M6 12h12" />,
  quill: (<><path d="M4 20c6-1 9-4 12-9 1.5-2.5 2-5 2-7-3 .3-6 1.2-8.5 3.5C8 13 5.5 16 4 20z" /><path d="M4 20l5-5" /></>),
  copy: (<><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15V6a2.5 2.5 0 0 1 2.5-2.5H16" /></>),
  link: (<><path d="M9 15l6-6" /><path d="M11 6l1-1a4 4 0 0 1 6 6l-1 1" /><path d="M13 18l-1 1a4 4 0 0 1-6-6l1-1" /></>),
  chev: <path d="M6 9l6 6 6-6" />,
  back: <path d="M14 6l-6 6 6 6" />,
};
function Ic({ name }: { name: string }) {
  return (
    <svg className="gl-ic" viewBox="0 0 24 24" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
const STATUS_ICON: Record<string, string> = {
  verifye: 'check',
  pwovizwa: 'clock',
  'pwoblèm': 'alert',
};

export default function GlossaryReader({ terms }: { terms: GlossTerm[] }) {
  const withHay = React.useMemo(
    () =>
      terms.map((t) => ({
        ...t,
        _h: norm(
          [t.name, t.variants.join(' '), t.scientific, t.family, t.note].join(' ')
        ),
      })),
    [terms]
  );

  const letters = React.useMemo(
    () => Array.from(new Set(terms.map((t) => t.letter))).sort(),
    [terms]
  );
  const families = React.useMemo(
    () => Array.from(new Set(terms.map((t) => t.family).filter(Boolean))).sort(),
    [terms]
  );

  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [family, setFamily] = React.useState('');
  const [tramilOnly, setTramilOnly] = React.useState(false);
  const [letter, setLetter] = React.useState(() => letters[0] ?? 'A');
  const [cur, setCur] = React.useState<string | null>(null);
  const [viewing, setViewing] = React.useState(false);
  const searchRef = React.useRef<HTMLInputElement>(null);

  const t = norm(query.trim());
  const results = React.useMemo(() => {
    const base = t ? withHay : withHay.filter((d) => d.letter === letter);
    return base.filter(
      (d) =>
        (!t || d._h.includes(t)) &&
        (!status || d.status === status) &&
        (!family || d.family === family) &&
        (!tramilOnly || d.tramil === 'konfime')
    );
  }, [withHay, t, letter, status, family, tramilOnly]);

  // keep a valid selection
  React.useEffect(() => {
    if (results.length === 0) {
      setCur(null);
      return;
    }
    if (!cur || !results.some((d) => d.code === cur)) setCur(results[0].code);
  }, [results, cur]);

  // deep-link on mount
  React.useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.slice(1));
    const hit = terms.find((d) => d.code === hash);
    if (hit) {
      setLetter(hit.letter);
      setCur(hit.code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reflect selection in the URL hash
  React.useEffect(() => {
    if (cur) window.history.replaceState(null, '', '#' + cur);
  }, [cur]);

  // lock body scroll while the mobile detail overlay is open
  React.useEffect(() => {
    const mobile = window.matchMedia('(max-width:820px)').matches;
    document.body.style.overflow = viewing && mobile ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [viewing]);

  // keyboard
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement !== searchRef.current) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (viewing) setViewing(false);
        else if (document.activeElement === searchRef.current) setQuery('');
      } else if (
        (e.key === 'ArrowDown' || e.key === 'ArrowUp') &&
        !window.matchMedia('(max-width:820px)').matches &&
        results.length
      ) {
        e.preventDefault();
        let i = results.findIndex((d) => d.code === cur);
        i =
          e.key === 'ArrowDown'
            ? Math.min(results.length - 1, i + 1)
            : Math.max(0, i - 1);
        setCur(results[i].code);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [results, cur, viewing]);

  function pick(code: string) {
    setCur(code);
    if (window.matchMedia('(max-width:820px)').matches) setViewing(true);
  }
  function chooseLetter(l: string) {
    setLetter(l);
    setQuery('');
    setCur(null);
  }

  const count = (k: string) => terms.filter((d) => d.status === k).length;
  const tramilCount = terms.filter((d) => d.tramil === 'konfime').length;

  const term = cur ? terms.find((d) => d.code === cur) ?? null : null;

  const [copied, setCopied] = React.useState('');
  function copy(kind: string) {
    if (!term) return;
    let txt = term.scientific || term.name;
    if (kind === 'cite')
      txt =
        term.name +
        (term.scientific ? ', ' + term.scientific : '') +
        (term.family ? ' (' + term.family + ')' : '') +
        ' · ' +
        term.code +
        ' · Glosè Plant Ayisyen, Medikaplant';
    if (kind === 'link')
      txt = window.location.href.split('#')[0] + '#' + term.code;
    navigator.clipboard?.writeText(txt).then(() => {
      setCopied(kind);
      setTimeout(() => setCopied(''), 1500);
    });
  }

  return (
    <div className={`gl-app${viewing ? ' viewing' : ''}`}>
      <div className="gl-wrap">
        <header className="gl-mast">
          <div className="gl-mast-top">
            <div className="gl-letter">{letter}</div>
            <div className="gl-title-b">
              <h1 className="gl-h1">Glosè Plant Ayisyen</h1>
              <p className="gl-edition">
                Edisyon travay pou revizyon nan <em>Medikaplant</em>. Non kreyòl, non
                syantifik, ak fanmi botanik, kontwole ak TRAMIL.
              </p>
            </div>
          </div>
          <hr className="gl-rule" />
          <ul className="gl-ledger">
            <li><b>{terms.length}</b> antre</li>
            <li><b>{count('verifye')}</b> verifye</li>
            <li className="lo"><b>{count('pwovizwa')}</b> pwovizwa</li>
            <li className="clay"><b>{count('pwoblèm')}</b> pou revizyon</li>
            <li><b>{tramilCount}</b> konfime pa TRAMIL</li>
          </ul>
          <nav className="gl-az" aria-label="Chwazi yon lèt">
            {ALPHABET.map((l) => {
              const has = letters.includes(l);
              return (
                <button
                  key={l}
                  disabled={!has}
                  aria-current={!t && l === letter ? 'true' : 'false'}
                  onClick={() => chooseLetter(l)}
                >
                  {l}
                </button>
              );
            })}
          </nav>
        </header>

        <div className="gl-tools">
          <div className="gl-tools-row">
            <label className="gl-search">
              <Ic name="search" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Chèche yon non, yon espès, yon fanmi…"
                autoComplete="off"
                aria-label="Chèche"
              />
            </label>
            <div className="gl-seg" role="group" aria-label="Estati editoryal">
              {['', 'verifye', 'pwovizwa', 'pwoblèm'].map((s) => (
                <button
                  key={s || 'all'}
                  aria-pressed={status === s}
                  onClick={() => setStatus(s)}
                >
                  {s && <span className={`gl-dot gl-m-${CLS(s)}`} />}
                  {s ? LABEL[s] : 'Tout'}
                </button>
              ))}
            </div>
            <div className="gl-selwrap">
              <select
                value={family}
                onChange={(e) => setFamily(e.target.value)}
                aria-label="Fanmi botanik"
              >
                <option value="">Tout fanmi</option>
                {families.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <Ic name="chev" />
            </div>
            <button
              className="gl-tram"
              aria-pressed={tramilOnly}
              onClick={() => setTramilOnly((v) => !v)}
            >
              <Ic name="check" />
              Konfime TRAMIL
            </button>
            <span className="gl-count">
              <b>{results.length}</b> sou {terms.length}
            </span>
          </div>
        </div>

        <div className="gl-board">
          <nav className="gl-index" aria-label="Lis antre yo">
            {results.length === 0 ? (
              <p className="gl-empty">Pa gen antre ki koresponn. Eseye retire yon filtè.</p>
            ) : (
              <>
                <div className="gl-idx-head">
                  {t ? 'Rezilta rechèch' : `Antre nan Lèt ${letter}`}
                </div>
                {results.map((d) => (
                  <button
                    key={d.code}
                    className="gl-item"
                    aria-current={d.code === cur ? 'true' : 'false'}
                    onClick={() => pick(d.code)}
                  >
                    <span className={`gl-mark gl-m-${CLS(d.status)}`} />
                    <span className="gl-nm">{d.name}</span>
                    <span className="gl-sc">
                      {d.scientific || 'non syantifik poko dokimante'}
                    </span>
                  </button>
                ))}
              </>
            )}
          </nav>

          <article className="gl-detail" aria-live="polite">
            {term ? (
              <div key={term.code} className="gl-detail-body enter">
                <button className="gl-back" onClick={() => setViewing(false)}>
                  <Ic name="back" />
                  Tounen nan lis la
                </button>
                <span className="gl-code">{term.code}</span>
                <h2 className="gl-name">{term.name}</h2>
                {term.variants.length > 0 && (
                  <p className="gl-vari">
                    <b>Lòt non:</b> {term.variants.join(', ')}
                  </p>
                )}
                {term.scientific ? (
                  <div className="gl-sci">{term.scientific}</div>
                ) : (
                  <div className="gl-sci none">Non syantifik poko dokimante</div>
                )}
                <div className="gl-meta">
                  <span className={`gl-badge gl-b-${CLS(term.status)}`}>
                    <Ic name={STATUS_ICON[term.status]} />
                    {LABEL[term.status]}
                  </span>
                  {term.family ? (
                    <span className="gl-fam"><Ic name="leaf" />{term.family}</span>
                  ) : (
                    <span className="gl-fam none"><Ic name="leaf" />Fanmi poko dokimante</span>
                  )}
                </div>
                {term.tramil === 'konfime' ? (
                  <div className="gl-tramil ok">
                    <Ic name="check" />
                    <div>
                      <div className="tl">TRAMIL</div>
                      <div className="tt">Non an konfime nan baz done TRAMIL la.</div>
                    </div>
                  </div>
                ) : (
                  <div className="gl-tramil no">
                    <Ic name="dash" />
                    <div>
                      <div className="tl">TRAMIL</div>
                      <div className="tt">Pa jwenn nan rechèch TRAMIL la. Kontwòl la rete pou fè.</div>
                    </div>
                  </div>
                )}
                {term.note && (
                  <div className={`gl-note${term.status === 'pwoblèm' ? ' rev' : ''}`}>
                    <span className="gl-note-h">
                      <Ic name="quill" />
                      {term.status === 'pwoblèm' ? 'Desizyon pou pran' : 'Nòt editoryal'}
                    </span>
                    <p>{term.note}</p>
                  </div>
                )}
                <div className="gl-actions">
                  <button className={`gl-act${copied === 'sci' ? ' done' : ''}`} onClick={() => copy('sci')}>
                    <Ic name={copied === 'sci' ? 'check' : 'copy'} />
                    {copied === 'sci' ? 'Kopye!' : 'Kopye non syantifik'}
                  </button>
                  <button className={`gl-act${copied === 'cite' ? ' done' : ''}`} onClick={() => copy('cite')}>
                    <Ic name={copied === 'cite' ? 'check' : 'copy'} />
                    {copied === 'cite' ? 'Kopye!' : 'Kopye referans'}
                  </button>
                  <button className={`gl-act${copied === 'link' ? ' done' : ''}`} onClick={() => copy('link')}>
                    <Ic name={copied === 'link' ? 'check' : 'link'} />
                    {copied === 'link' ? 'Kopye!' : 'Kopye lyen'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="gl-empty">Chwazi yon antre nan lis la.</p>
            )}
          </article>
        </div>

        <footer className="gl-foot">
          <b>Metodoloji.</b> Lis preliminè ki soti sou medikaplant.org, kontwole ak
          baz done TRAMIL (tramil.net) pou non syantifik ak sinonim. Antre ki make{' '}
          <b>Pou revizyon</b> gen yon kontradiksyon oswa yon vid nan sous la epi yo
          bezwen yon desizyon anvan piblikasyon.
        </footer>
      </div>
    </div>
  );
}
