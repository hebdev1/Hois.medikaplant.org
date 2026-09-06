'use client';

import * as React from 'react';
import Link from 'next/link';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { REGIONS } from '../eksplorate/facets';
import { uploadLabPhoto, submitLabContribution } from './actions';

function reduiFoto(file: File, maks = 1024, kalite = 0.8): Promise<string> {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = () => rej(new Error('x'));
    fr.onload = () => {
      const im = new Image();
      im.onerror = () => rej(new Error('x'));
      im.onload = () => {
        let { width: w, height: h } = im;
        if (Math.max(w, h) > maks) { const r = maks / Math.max(w, h); w = Math.round(w * r); h = Math.round(h * r); }
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d')!.drawImage(im, 0, 0, w, h);
        res(c.toDataURL('image/jpeg', kalite));
      };
      im.src = fr.result as string;
    };
    fr.readAsDataURL(file);
  });
}

export default function ContributeForm({ plants }: { plants: { slug: string; name_kr: string; id: string }[] }) {
  const [plantId, setPlantId] = React.useState('');
  const [localName, setLocalName] = React.useState('');
  const [region, setRegion] = React.useState('');
  const [body, setBody] = React.useState('');
  const [photo, setPhoto] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function onFile(f: File) {
    setErr(''); setUploading(true);
    try {
      const dataUrl = await reduiFoto(f);
      const r = await uploadLabPhoto(dataUrl);
      if (r.url) setPhoto(r.url); else setErr(r.error ?? 'Foto a pa monte.');
    } catch { setErr('Foto a pa t ka louvri.'); }
    setUploading(false);
  }

  async function submit() {
    setErr('');
    if (localName.trim().length < 2 && body.trim().length < 2) {
      setErr('Ekri omwen yon non lokal oswa yon nòt.'); return;
    }
    setSending(true);
    const r = await submitLabContribution({
      plant_id: plantId || null,
      local_name: localName.trim(),
      region,
      body: body.trim(),
      photo_path: photo,
    });
    setSending(false);
    if (r.ok) { setDone(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else setErr(r.error);
  }

  if (done) {
    return (
      <div className="lab-status" style={{ textAlign: 'center', padding: 24 }}>
        <div style={{ fontFamily: 'var(--ff-disp)', fontSize: 20, fontWeight: 600, color: 'var(--fey)' }}>Mèsi!</div>
        <p style={{ margin: '6px 0 14px' }}>
          Soumisyon w rive ak estati bouyon. Yon moun nan ekip la ap revize l anvan li parèt.
        </p>
        <Link href="/laboratwa/eksplorate" className="lab-btn out" style={{ display: 'inline-flex' }}>
          Tounen nan Eksploratè a
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="lab-fld">
        <label>Plant lan <span className="opt">— si li nan achiv la</span></label>
        <select value={plantId} onChange={(e) => setPlantId(e.target.value)}>
          <option value="">— Chwazi yon plant —</option>
          {plants.map((p) => <option key={p.id} value={p.id}>{p.name_kr}</option>)}
        </select>
      </div>

      <div className="lab-fld">
        <label>Non lokal lan</label>
        <input type="text" value={localName} onChange={(e) => setLocalName(e.target.value)}
          placeholder="Non ou konnen plant la" />
      </div>

      <div className="lab-fld">
        <label>Rejyon <span className="opt">— kote yo rele l konsa</span></label>
        <div className="lab-chips">
          {REGIONS.map(([code, name]) => (
            <button type="button" key={code}
              className={`lab-chip ${region === code ? 'on' : ''}`}
              onClick={() => setRegion((r) => (r === code ? '' : code))}>
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="lab-fld">
        <label>Sa w konnen</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)}
          placeholder="Pa egzanp: ki pati yo itilize, kijan yo rele l lakay ou…" />
        <div className="lab-req">
          Pa mete enfòmasyon sou sante w ni sou sante yon lòt moun isit la.
        </div>
      </div>

      <div className="lab-fld">
        <label>Foto <span className="opt">— opsyonèl</span></label>
        {photo ? (
          <div style={{ position: 'relative', width: 120 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--liy)' }} />
            <button type="button" onClick={() => setPhoto(null)} aria-label="Retire"
              style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.6)', color: '#fff', cursor: 'pointer' }}>×</button>
          </div>
        ) : (
          <button type="button" className="lab-btn ghost" style={{ display: 'inline-flex' }}
            onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} strokeWidth={2} />}
            {uploading ? 'N ap monte…' : 'Chwazi yon foto'}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
      </div>

      {err && <div className="lab-err" style={{ color: '#9B3226', fontSize: 13 }}>{err}</div>}

      <div className="lab-status">
        Soumisyon w ap gen estati <span className="lab-qty">bouyon</span> jiskaske yon moun
        nan ekip la revize l. Anyen pa parèt piblikman san revizyon.
      </div>

      <button className="lab-btn pri" onClick={submit} disabled={sending || uploading}
        style={{ display: 'inline-flex' }}>
        {sending ? 'N ap voye…' : 'Voye pou revizyon'}
      </button>
    </div>
  );
}
