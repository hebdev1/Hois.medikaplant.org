'use client';

import * as React from 'react';
import Link from 'next/link';
import { Camera, ImagePlus, X, Check, ArrowLeft, Loader2 } from 'lucide-react';
import { uploadContributionPhoto, submitContribution } from './actions';
import type { ContributionInput } from './types';

export type PlantLite = { id: string; k: string; n: string; f: string };

const DEPARTMAN: [string, string][] = [
  ['AR', 'Latibonit'], ['CE', 'Sant'], ['GA', 'Grandans'], ['NI', 'Nip'],
  ['NO', 'Nò'], ['NE', 'Nòdès'], ['NW', 'Nòdwès'], ['OU', 'Lwès'],
  ['SU', 'Sid'], ['SE', 'Sidès'],
];
const SOUS: [string, string][] = [
  ['mwen-menm', 'Se konsa mwen rele l'],
  ['fanmi', 'Se konsa fanmi m rele l'],
  ['tande', 'Mwen tande moun rele l konsa'],
  ['pratikan', 'Mwen se doktè fèy / machann fèy'],
];
const KONFIM: [string, string][] = [
  ['wi', 'Wi, se plant sa a'],
  ['non', 'Non, se pa sa'],
  ['pa-si', 'Mwen pa fin sèten'],
];

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const binom = (n: string) => (n ? n.split(/\s+/).slice(0, 2).join(' ') : '');

/* Reduce + re-encode a picked photo. Drawing to a canvas strips EXIF (incl. any
   GPS the camera embeds) before it ever leaves the device. */
function reduiFoto(file: File, maks = 1024, kalite = 0.8): Promise<string> {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = () => rej(new Error('Pa ka li fichye a'));
    fr.onload = () => {
      const im = new Image();
      im.onerror = () => rej(new Error('Pa yon imaj'));
      im.onload = () => {
        let { width: w, height: h } = im;
        if (Math.max(w, h) > maks) {
          const r = maks / Math.max(w, h);
          w = Math.round(w * r);
          h = Math.round(h * r);
        }
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        c.getContext('2d')!.drawImage(im, 0, 0, w, h);
        res(c.toDataURL('image/jpeg', kalite));
      };
      im.src = fr.result as string;
    };
    fr.readAsDataURL(file);
  });
}

type RefPhoto = { url: string; att: string; lis: string };
async function chècheReferans(sci: string): Promise<RefPhoto[]> {
  const q = binom(sci);
  if (!q) return [];
  const url =
    'https://api.inaturalist.org/v1/taxa?q=' +
    encodeURIComponent(q) +
    '&rank=species&per_page=1';
  const r = await fetch(url);
  if (!r.ok) throw new Error('API a pa reponn');
  const j = await r.json();
  const t = (j.results || [])[0];
  if (!t) return [];
  return (t.taxon_photos || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((tp: any) => tp.photo)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((p: any) => p && p.license_code)
    .slice(0, 4)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((p: any) => ({
      url: (p.medium_url || p.url || '').replace('square', 'medium'),
      att: p.attribution || '',
      lis: (p.license_code || '').toUpperCase(),
    }));
}

type Chosen = { id: string | null; k: string; n: string; nouvo?: boolean } | null;
type Photo = { key: string; url: string | null; err?: boolean };

export default function ContributionForm({ plants }: { plants: PlantLite[] }) {
  const index = React.useMemo(
    () => plants.map((p) => ({ ...p, _h: norm(p.k + ' ' + (p.n || '')) })),
    [plants]
  );
  const gaps = React.useMemo(
    () => plants.filter((p) => !p.n || !p.f).slice(0, 10),
    [plants]
  );

  const [chwazi, setChwazi] = React.useState<Chosen>(null);
  const [q, setQ] = React.useState('');
  const [dropOpen, setDropOpen] = React.useState(false);

  const [refState, setRefState] = React.useState<{
    loading: boolean;
    photos: RefPhoto[];
    error: boolean;
  }>({ loading: false, photos: [], error: false });
  const [konfimasyon, setKonfimasyon] = React.useState<string | null>(null);

  const [kind, setKind] = React.useState('');
  const [non, setNon] = React.useState('');
  const [nòt, setNòt] = React.useState('');
  const [photos, setPhotos] = React.useState<Photo[]>([]);
  const [fotoErr, setFotoErr] = React.useState('');

  const [dep, setDep] = React.useState('');
  const [komin, setKomin] = React.useState('');
  const [lok, setLok] = React.useState('');
  const [sous, setSous] = React.useState('');

  const [kon, setKon] = React.useState('');
  const [kontak, setKontak] = React.useState('');
  const [vleSite, setVleSite] = React.useState(false);
  const [lisansOk, setLisansOk] = React.useState(false);

  const [errors, setErrors] = React.useState<Record<string, boolean>>({});
  const [sending, setSending] = React.useState(false);
  const [done, setDone] = React.useState<number | null>(null);

  const fileRef = React.useRef<HTMLInputElement>(null);
  const capRef = React.useRef<HTMLInputElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [kamOn, setKamOn] = React.useState(false);

  // ── Plant selection ────────────────────────────────────────────────────
  function pick(p: Chosen) {
    setChwazi(p);
    setKonfimasyon(null);
    setDropOpen(false);
    setQ('');
    setRefState({ loading: false, photos: [], error: false });
    if (p && p.n) {
      setRefState({ loading: true, photos: [], error: false });
      chècheReferans(p.n)
        .then((photos) => setRefState({ loading: false, photos, error: false }))
        .catch(() => setRefState({ loading: false, photos: [], error: true }));
    }
  }
  const hits = q.trim()
    ? index.filter((p) => p._h.includes(norm(q.trim()))).slice(0, 8)
    : [];

  // ── Photos ─────────────────────────────────────────────────────────────
  async function addFiles(files: File[]) {
    setFotoErr('');
    for (const f of files) {
      if (photos.filter((p) => p.url).length + photos.filter((p) => !p.url && !p.err).length >= 6) {
        setFotoErr('6 foto se maksimòm nan.');
        break;
      }
      const key = Math.random().toString(36).slice(2);
      setPhotos((prev) => [...prev, { key, url: null }]);
      try {
        const dataUrl = await reduiFoto(f);
        const res = await uploadContributionPhoto(dataUrl);
        setPhotos((prev) =>
          prev.map((p) =>
            p.key === key
              ? res.url
                ? { key, url: res.url }
                : { key, url: null, err: true }
              : p
          )
        );
        if (res.error) setFotoErr(res.error);
      } catch {
        setPhotos((prev) => prev.map((p) => (p.key === key ? { key, url: null, err: true } : p)));
        setFotoErr('Youn nan foto yo pa t ka louvri.');
      }
    }
  }
  function removePhoto(key: string) {
    setPhotos((prev) => prev.filter((p) => p.key !== key));
  }

  async function openKam() {
    setFotoErr('');
    if (!navigator.mediaDevices?.getUserMedia) {
      capRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
      streamRef.current = stream;
      setKamOn(true);
      // wait a tick for the <video> to mount
      requestAnimationFrame(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      capRef.current?.click();
    }
  }
  function closeKam() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setKamOn(false);
  }
  async function snap() {
    const v = videoRef.current;
    if (!v) return;
    const c = document.createElement('canvas');
    const w = v.videoWidth, h = v.videoHeight, m = 1024;
    const r = Math.max(w, h) > m ? m / Math.max(w, h) : 1;
    c.width = Math.round(w * r);
    c.height = Math.round(h * r);
    c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height);
    const dataUrl = c.toDataURL('image/jpeg', 0.8);
    closeKam();
    if (photos.filter((p) => p.url || !p.err).length >= 6) {
      setFotoErr('6 foto se maksimòm nan.');
      return;
    }
    const key = Math.random().toString(36).slice(2);
    setPhotos((prev) => [...prev, { key, url: null }]);
    const res = await uploadContributionPhoto(dataUrl);
    setPhotos((prev) =>
      prev.map((p) => (p.key === key ? (res.url ? { key, url: res.url } : { key, url: null, err: true }) : p))
    );
  }
  React.useEffect(() => () => closeKam(), []);

  // ── Submit ─────────────────────────────────────────────────────────────
  async function submit() {
    const bezwenNon = kind !== 'koreksyon';
    const uploading = photos.some((p) => !p.url && !p.err);
    const e: Record<string, boolean> = {
      kalite: !kind,
      non: bezwenNon && non.trim().length < 2,
      dep: !dep,
      kon: kon.trim().length < 2,
    };
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;
    const ready = photos.filter((p) => p.url).map((p) => p.url as string);
    if (ready.length && !lisansOk) {
      setFotoErr('Tanpri dakò pou nou sèvi ak foto yo, oswa retire yo.');
      return;
    }
    if (uploading) {
      setFotoErr('Tann foto yo fin monte anvan…');
      return;
    }

    const payload: ContributionInput = {
      plant_id: chwazi?.nouvo ? null : chwazi?.id ?? null,
      plant_not_in_list: chwazi?.nouvo ? chwazi.k : null,
      plant_name: chwazi?.k ?? '',
      plant_scientific: chwazi?.n ?? '',
      kind,
      proposed_name: non.trim(),
      note: nòt.trim(),
      department_code: dep,
      commune: komin.trim(),
      locality: lok.trim(),
      knowledge_source: sous,
      photo_confirmation: konfimasyon,
      photos: ready,
      contributor_name: kon.trim(),
      contributor_contact: kontak.trim(),
      allow_cite: vleSite,
    };
    setSending(true);
    const res = await submitContribution(payload);
    setSending(false);
    if (!res.ok) {
      setFotoErr(res.error);
      return;
    }
    setDone(ready.length);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetAll() {
    closeKam();
    setChwazi(null); setQ(''); setKind(''); setNon(''); setNòt('');
    setPhotos([]); setFotoErr(''); setDep(''); setKomin(''); setLok('');
    setSous(''); setKon(''); setKontak(''); setVleSite(false); setLisansOk(false);
    setErrors({}); setKonfimasyon(null); setDone(null);
  }

  // ── Done screen ──────────────────────────────────────────────────────────
  if (done !== null) {
    return (
      <div className="gc">
        <div className="gc-wrap">
          <Masthead />
          <div className="gc-ok">
            <h3>Mèsi!</h3>
            <p>
              Kontribisyon ou an rive
              {done ? ` ak ${done} foto` : ''}. Yon kiratè ap gade l anvan li
              parèt nan glosè a.
            </p>
            <button className="gc-go" onClick={resetAll}>
              Ajoute yon lòt non
            </button>
          </div>
          <Link href="/glose" className="gc-back">
            <ArrowLeft size={16} strokeWidth={2} /> Tounen nan glosè a
          </Link>
        </div>
      </div>
    );
  }

  const uploadingCount = photos.filter((p) => !p.url && !p.err).length;

  return (
    <div className="gc">
      <div className="gc-wrap">
        <Masthead />

        {gaps.length > 0 && (
          <div className="gc-gaps">
            <h3>Plant nou poko konnen</h3>
            <p>
              Plant sa yo nan glosè a san non syantifik ni fanmi. Si ou rekonèt
              youn — sitou ak yon foto — se yon gwo èd.
            </p>
            <div className="gc-chips">
              {gaps.map((g) => (
                <button
                  key={g.id}
                  className="gc-chip"
                  onClick={() => pick({ id: g.id, k: g.k, n: g.n })}
                >
                  {g.k}
                </button>
              ))}
            </div>
          </div>
        )}

        <h2>1. Ki plant?</h2>
        <p className="gc-hint">
          Chèche non plant la nan glosè a, oswa ekri l si li pa nan lis la.
        </p>

        {chwazi ? (
          <div className="gc-chosen">
            <span>
              <b>{chwazi.k}</b>
              {chwazi.n ? <i> {chwazi.n}</i> : null}
            </span>
            <button onClick={() => { setChwazi(null); setKonfimasyon(null); }}>
              chanje
            </button>
          </div>
        ) : (
          <div className="gc-pick">
            <input
              type="search"
              autoComplete="off"
              placeholder="Ekri non plant la…"
              value={q}
              onChange={(e) => { setQ(e.target.value); setDropOpen(true); }}
              onFocus={() => setDropOpen(true)}
            />
            {dropOpen && q.trim() && (
              <div className="gc-drop">
                {hits.map((p) => (
                  <div key={p.id} onClick={() => pick({ id: p.id, k: p.k, n: p.n })}>
                    {p.k}
                    {p.n ? <i> {p.n}</i> : null}
                  </div>
                ))}
                <div onClick={() => pick({ id: null, k: q.trim(), n: '', nouvo: true })}>
                  <b>+ «{q.trim()}»</b> <i>— plant sa a pa nan lis la</i>
                </div>
              </div>
            )}
          </div>
        )}

        {/* iNaturalist reference */}
        {chwazi && chwazi.n && (
          <div className="gc-ref">
            <h3>Èske se plant sa a?</h3>
            {refState.loading ? (
              <p className="gc-lod">
                N ap chèche foto referans pou <i>{binom(chwazi.n)}</i>…
              </p>
            ) : refState.error ? (
              <p>
                Nou pa t ka chaje foto referans yo kounye a. Sa pa anpeche w
                kontribye — si ou gen yon foto pa ou, se li ki pi enpòtan.
              </p>
            ) : refState.photos.length === 0 ? (
              <p>
                Nou pa gen okenn foto ak lisans lib pou <i>{binom(chwazi.n)}</i>.
                Se yon rezon anplis pou voye pa ou a.
              </p>
            ) : (
              <>
                <p>
                  Foto sa yo soti nan iNaturalist, pou <i>{binom(chwazi.n)}</i>.
                  Gade yo byen — si se pa menm plant ou konnen an, di nou.
                </p>
                <div className="gc-refgrid">
                  {refState.photos.map((f, i) => (
                    <div className="gc-rcard" key={i}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.url} alt="" loading="lazy" />
                      <div className="att">{f.att} · {f.lis}</div>
                    </div>
                  ))}
                </div>
                <div className="gc-konfim">
                  {KONFIM.map(([k, v]) => (
                    <button
                      key={k}
                      aria-pressed={konfimasyon === k}
                      onClick={() => setKonfimasyon(k)}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {chwazi && (
          <>
            <h2>2. Ki kalite enfòmasyon?</h2>
            <div className="gc-kalite">
              {[
                ['lot-non', 'Yon lòt non pou plant sa a', 'Lakay mwen yo rele plant sa a yon lòt jan.'],
                ['diferan', 'Non sa a vle di yon lòt plant lakay mwen', 'Menm non an, men se yon lòt plant nèt nan zòn mwen.'],
                ['koreksyon', 'Gen yon bagay ki pa kòrèk', 'Non syantifik la, fanmi an, oswa lòt enfòmasyon an gen yon erè.'],
              ].map(([val, t, d]) => (
                <label key={val}>
                  <input
                    type="radio"
                    name="kalite"
                    value={val}
                    checked={kind === val}
                    onChange={() => setKind(val)}
                  />
                  <span><b>{t}</b><span>{d}</span></span>
                </label>
              ))}
            </div>
            {errors.kalite && <div className="gc-err">Chwazi yon kalite.</div>}

            <fieldset className="gc-fs">
              <legend>Enfòmasyon an</legend>
              <label>
                {kind === 'koreksyon' ? 'Non kòrèk la' : 'Non an kreyòl'}
                {kind === 'koreksyon' && <span className="opt"> — si sa aplikab</span>}
              </label>
              <input
                type="text"
                placeholder="Non an jan ou di l"
                value={non}
                onChange={(e) => setNon(e.target.value)}
              />
              {errors.non && <div className="gc-err">Ekri non an.</div>}
              <label>Nòt <span className="opt">— si ou vle esplike plis</span></label>
              <textarea
                placeholder="Pa egzanp: ki pati yo itilize, kilè yo rele l konsa…"
                value={nòt}
                onChange={(e) => setNòt(e.target.value)}
              />
            </fieldset>

            <h2>3. Foto</h2>
            <p className="gc-hint">
              Yon foto se pi bon prèv la. Ak yon foto, yon botanis ka konfime ki
              plant ou vle di — menm lè non an chanje soti nan yon zòn rive nan
              yon lòt.
            </p>
            <fieldset className="gc-fs">
              <legend>Foto ou yo</legend>
              <div style={{ fontSize: '13.5px', color: '#5F5C52' }}>
                Si ou kapab, pran plizyè foto:
              </div>
              <div className="gc-parti">
                <span>Fèy la</span><span>Flè a</span><span>Fwi a</span>
                <span>Tij / ekòs la</span><span>Plant la nèt</span>
              </div>
              <div className="gc-fbar">
                <button type="button" className="gc-fbtn" onClick={openKam}>
                  <Camera size={16} strokeWidth={2} style={{ verticalAlign: '-3px', marginRight: 6 }} />
                  Pran yon foto
                </button>
                <button type="button" className="gc-fbtn" onClick={() => fileRef.current?.click()}>
                  <ImagePlus size={16} strokeWidth={2} style={{ verticalAlign: '-3px', marginRight: 6 }} />
                  Chwazi yon fichye
                </button>
                <input
                  ref={fileRef} type="file" accept="image/*" multiple hidden
                  onChange={(e) => { addFiles([...(e.target.files || [])]); e.target.value = ''; }}
                />
                <input
                  ref={capRef} type="file" accept="image/*" capture="environment" hidden
                  onChange={(e) => { addFiles([...(e.target.files || [])]); e.target.value = ''; }}
                />
              </div>

              {kamOn && (
                <div className="gc-kam">
                  <video ref={videoRef} playsInline muted />
                  <div className="gc-fbar">
                    <button type="button" className="gc-fbtn" onClick={snap}>Pran l</button>
                    <button type="button" className="gc-fbtn" onClick={closeKam}>Anile</button>
                  </div>
                </div>
              )}

              {fotoErr && <div className="gc-err">{fotoErr}</div>}

              {photos.length > 0 && (
                <div className="gc-fotogrid">
                  {photos.map((p) =>
                    p.url ? (
                      <div className="gc-fcard" key={p.key}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.url} alt="" />
                        <button onClick={() => removePhoto(p.key)} aria-label="Retire">×</button>
                      </div>
                    ) : (
                      <div className="gc-fcard up" key={p.key}>
                        {p.err ? 'erè' : <Loader2 size={18} className="gc-spin" />}
                        <button onClick={() => removePhoto(p.key)} aria-label="Retire">×</button>
                      </div>
                    )
                  )}
                </div>
              )}

              <div className="gc-konsantman" style={{ marginTop: 14 }}>
                <b>Sou foto ou yo</b>
                Nou retire enfòmasyon kote ki kache nan fichye foto a anvan nou
                sere l. Tanpri pa pran foto moun — se plant la nou bezwen.
                <label className="gc-chk">
                  <input type="checkbox" checked={lisansOk} onChange={(e) => setLisansOk(e.target.checked)} />
                  <span>Mwen dakò pou Medikaplant sèvi ak foto sa yo nan glosè piblik la.</span>
                </label>
              </div>
            </fieldset>

            <h2>4. Kote ou konnen non sa a</h2>
            <fieldset className="gc-fs">
              <legend>Kote</legend>
              <p className="gc-hint" style={{ margin: '6px 0 0' }}>
                Se kote a ki bay enfòmasyon an valè. Yon non san yon kote pa di
                nou anpil.
              </p>
              <div className="gc-row">
                <div>
                  <label>Depatman</label>
                  <select value={dep} onChange={(e) => setDep(e.target.value)}>
                    <option value="">— Chwazi —</option>
                    {DEPARTMAN.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  {errors.dep && <div className="gc-err">Chwazi yon depatman.</div>}
                </div>
                <div>
                  <label>Komin <span className="opt">— si ou konnen l</span></label>
                  <input type="text" placeholder="Pa egzanp: Jakmèl" value={komin} onChange={(e) => setKomin(e.target.value)} />
                </div>
              </div>
              <label>Lokalite oswa seksyon kominal <span className="opt">— si ou konnen l</span></label>
              <input type="text" value={lok} onChange={(e) => setLok(e.target.value)} />
              <label>Kijan ou konnen non sa a?</label>
              <select value={sous} onChange={(e) => setSous(e.target.value)}>
                <option value="">— Chwazi —</option>
                {SOUS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </fieldset>

            <h2>5. Ki moun ou ye</h2>
            <fieldset className="gc-fs">
              <legend>Kontribitè</legend>
              <label>Non ou</label>
              <input type="text" placeholder="Non ou" value={kon} onChange={(e) => setKon(e.target.value)} />
              {errors.kon && <div className="gc-err">Ekri non ou.</div>}
              <label>Telefòn oswa imèl <span className="opt">— si nou bezwen mande w yon bagay</span></label>
              <input type="text" value={kontak} onChange={(e) => setKontak(e.target.value)} />
              <div className="gc-konsantman">
                <b>Sa n ap fè ak enfòmasyon ou bay la</b>
                Non ou bay la ap antre nan yon glosè piblik pou elèv ak pratikan
                Medsin Tradisyonèl Ayisyen. Yon kiratè ap gade l anvan li parèt.
                Kontak ou p ap janm parèt an piblik.
                <label className="gc-chk">
                  <input type="checkbox" checked={vleSite} onChange={(e) => setVleSite(e.target.checked)} />
                  <span>Nou mèt site non m kòm moun ki bay enfòmasyon an.</span>
                </label>
              </div>
            </fieldset>

            <button className="gc-go" onClick={submit} disabled={sending || uploadingCount > 0}>
              {sending ? 'N ap voye…' : 'Voye kontribisyon an'}
            </button>
          </>
        )}

        <Link href="/glose" className="gc-back">
          <ArrowLeft size={16} strokeWidth={2} /> Tounen nan glosè a
        </Link>
      </div>
    </div>
  );
}

function Masthead() {
  return (
    <header className="gc-mast">
      <div className="gc-eyebrow">Medikaplant ◆ Glosè Plant Ayisyen</div>
      <h1 className="gc-h1">Kontribye nan Glosè a</h1>
      <p className="gc-dek">
        Non plant yo chanje soti nan yon rejyon rive nan yon lòt. Si ou konnen
        yon non nou pa genyen, se ou menm ki gen enfòmasyon an.
      </p>
    </header>
  );
}
