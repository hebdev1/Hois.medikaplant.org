'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FolderPlus,
  Copy,
  Trash2,
  X,
  Loader2,
  Check,
  Images,
} from 'lucide-react';
import {
  uploadMedia,
  updateMediaAsset,
  deleteMediaAsset,
  createMediaFolder,
} from './actions';

type Folder = { id: string; name: string; slug: string; sort_order: number };
type Asset = {
  id: string;
  url: string;
  filename: string;
  title: string | null;
  alt_text: string | null;
  caption: string | null;
  folder_id: string | null;
  mime_type: string;
  bytes: number;
  width: number | null;
  height: number | null;
  created_at: string;
};

function fmtBytes(n: number) {
  if (!n) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default function MediaLibrary({
  folders,
  assets,
}: {
  folders: Folder[];
  assets: Asset[];
}) {
  const router = useRouter();
  const [folderFilter, setFolderFilter] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<Asset | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);
  const [msg, setMsg] = React.useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const [newFolder, setNewFolder] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const shown = folderFilter
    ? assets.filter((a) => a.folder_id === folderFilter)
    : assets;
  const countFor = (id: string) => assets.filter((a) => a.folder_id === id).length;

  async function doUpload(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    setUploading(true);
    setMsg(null);
    const fd = new FormData();
    list.forEach((f) => fd.append('files', f));
    const res = await uploadMedia(folderFilter, fd);
    setUploading(false);
    if (res.ok) {
      setMsg({
        tone: res.error ? 'err' : 'ok',
        text: res.error
          ? `${res.uploaded} monte · ${res.error}`
          : `${res.uploaded} imaj monte`,
      });
      router.refresh();
    } else {
      setMsg({ tone: 'err', text: res.error ?? 'Echwe.' });
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  async function doCreateFolder() {
    if (!newFolder.trim()) return;
    setCreating(true);
    const res = await createMediaFolder(newFolder);
    setCreating(false);
    if (res.ok) {
      setNewFolder('');
      router.refresh();
    } else {
      setMsg({ tone: 'err', text: res.error ?? 'Echwe.' });
    }
  }

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1320px] mx-auto">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
            <Images className="w-3.5 h-3.5" strokeWidth={2.2} />
            Bibliyotèk Medya
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Medya
          </h1>
          <p className="mt-1.5 text-sm text-earth-600">
            {assets.length} fichye · JPG, PNG, WEBP (maks 8 Mo)
          </p>
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-700 text-white text-sm font-bold shadow-card hover:bg-forest-800 disabled:opacity-60 transition"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
          ) : (
            <UploadCloud className="w-4 h-4" strokeWidth={2.4} />
          )}
          {uploading ? 'Ap monte…' : 'Upload imaj'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => e.target.files && doUpload(e.target.files)}
        />
      </header>

      {msg && (
        <div
          className={`mb-4 text-sm rounded-xl px-3.5 py-2.5 border ${
            msg.tone === 'ok'
              ? 'bg-forest-50 border-forest-200 text-forest-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="grid lg:grid-cols-[220px_1fr] gap-5">
        {/* ── Folder rail ─────────────────────────────────────────────── */}
        <aside className="space-y-1.5">
          <FolderButton
            active={folderFilter === null}
            label="Tout medya"
            count={assets.length}
            onClick={() => setFolderFilter(null)}
          />
          {folders.map((f) => (
            <FolderButton
              key={f.id}
              active={folderFilter === f.id}
              label={f.name}
              count={countFor(f.id)}
              onClick={() => setFolderFilter(f.id)}
            />
          ))}

          <div className="pt-2 flex items-center gap-1.5">
            <input
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doCreateFolder()}
              placeholder="Nouvo dosye…"
              className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-cream-200 bg-white text-xs text-ink focus:outline-none focus:ring-2 focus:ring-forest-200"
            />
            <button
              type="button"
              onClick={doCreateFolder}
              disabled={creating || !newFolder.trim()}
              aria-label="Kreye dosye"
              className="grid place-items-center w-8 h-8 rounded-lg bg-cream-100 hover:bg-cream-200 text-earth-700 disabled:opacity-50 transition shrink-0"
            >
              {creating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.4} />
              ) : (
                <FolderPlus className="w-3.5 h-3.5" strokeWidth={2.4} />
              )}
            </button>
          </div>
        </aside>

        {/* ── Grid + dropzone ─────────────────────────────────────────── */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files?.length) doUpload(e.dataTransfer.files);
          }}
          className={`rounded-2xl border-2 border-dashed transition min-h-[360px] p-4 ${
            dragOver
              ? 'border-forest-400 bg-forest-50/50'
              : 'border-cream-300 bg-white/40'
          }`}
        >
          {shown.length === 0 ? (
            <div className="h-[320px] grid place-items-center text-center">
              <div>
                <UploadCloud
                  className="w-10 h-10 mx-auto text-earth-300"
                  strokeWidth={1.6}
                />
                <p className="mt-3 text-sm text-earth-600 font-medium">
                  Trennen imaj isit la, oswa klike “Upload imaj”.
                </p>
                <p className="text-xs text-earth-400 mt-1">
                  Yo pral nan dosye:{' '}
                  {folderFilter
                    ? folders.find((f) => f.id === folderFilter)?.name
                    : 'Tout medya (san dosye)'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {shown.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelected(a)}
                  className="group text-left rounded-xl overflow-hidden border border-cream-200 bg-white hover:border-forest-300 hover:shadow-card transition"
                >
                  <div className="relative aspect-square bg-cream-50 grid place-items-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.url}
                      alt={a.alt_text || a.title || a.filename}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="px-2 py-1.5">
                    <div className="text-[11px] font-semibold text-ink truncate">
                      {a.title || a.filename}
                    </div>
                    <div className="text-[9px] text-earth-500 uppercase tracking-wide">
                      {a.mime_type.replace('image/', '')} · {fmtBytes(a.bytes)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <AssetModal
          asset={selected}
          folders={folders}
          onClose={() => setSelected(null)}
          onChanged={() => {
            setSelected(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function FolderButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
        active
          ? 'bg-forest-700 text-white shadow-card'
          : 'text-earth-700 hover:bg-cream-100'
      }`}
    >
      <span className="truncate">{label}</span>
      <span
        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
          active ? 'bg-white/20 text-white' : 'bg-cream-200 text-earth-600'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function AssetModal({
  asset,
  folders,
  onClose,
  onChanged,
}: {
  asset: Asset;
  folders: Folder[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [title, setTitle] = React.useState(asset.title ?? '');
  const [alt, setAlt] = React.useState(asset.alt_text ?? '');
  const [caption, setCaption] = React.useState(asset.caption ?? '');
  const [folderId, setFolderId] = React.useState<string | null>(asset.folder_id);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [confirmDel, setConfirmDel] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function save() {
    setSaving(true);
    setErr(null);
    const res = await updateMediaAsset(asset.id, {
      title,
      alt_text: alt,
      caption,
      folder_id: folderId,
    });
    setSaving(false);
    if (res.ok) onChanged();
    else setErr(res.error ?? 'Echwe.');
  }

  async function remove() {
    setDeleting(true);
    setErr(null);
    const res = await deleteMediaAsset(asset.id);
    setDeleting(false);
    if (res.ok) onChanged();
    else setErr(res.error ?? 'Echwe.');
  }

  function copyUrl() {
    navigator.clipboard?.writeText(asset.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fèmen"
        onClick={onClose}
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-3xl max-h-[88vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-cream-200">
        <div className="flex items-center justify-between px-5 py-3 border-b border-cream-100 sticky top-0 bg-white/95 backdrop-blur">
          <h2 className="font-display text-lg font-bold text-ink truncate pr-4">
            {asset.filename}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fèmen"
            className="grid place-items-center w-8 h-8 rounded-lg hover:bg-cream-100 text-earth-700 shrink-0"
          >
            <X className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-5 p-5">
          {/* Preview + facts */}
          <div>
            <div className="rounded-xl overflow-hidden border border-cream-200 bg-cream-50 grid place-items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.url}
                alt={asset.alt_text || asset.title || asset.filename}
                className="w-full h-auto max-h-[320px] object-contain"
              />
            </div>
            <dl className="mt-3 text-xs text-earth-600 space-y-1">
              <Fact k="Tip" v={asset.mime_type.replace('image/', '').toUpperCase()} />
              <Fact k="Gwosè" v={fmtBytes(asset.bytes)} />
              {asset.width && asset.height && (
                <Fact k="Dimansyon" v={`${asset.width}×${asset.height}`} />
              )}
              <Fact
                k="Dat"
                v={new Date(asset.created_at).toLocaleDateString('fr-FR')}
              />
            </dl>

            <div className="mt-3 flex items-center gap-2">
              <input
                readOnly
                value={asset.url}
                className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-cream-200 bg-cream-50 text-[11px] text-earth-600 font-mono"
              />
              <button
                type="button"
                onClick={copyUrl}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cream-100 hover:bg-cream-200 text-earth-700 text-xs font-semibold shrink-0 transition"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-forest-600" strokeWidth={2.6} />
                ) : (
                  <Copy className="w-3.5 h-3.5" strokeWidth={2.2} />
                )}
                {copied ? 'Kopye' : 'Kopye URL'}
              </button>
            </div>
          </div>

          {/* Metadata form */}
          <div className="space-y-3">
            <Field label="Tit">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-cream-200 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest-200"
              />
            </Field>
            <Field label="Alt text (deskripsyon pou aksesibilite/SEO)">
              <input
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-cream-200 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest-200"
              />
            </Field>
            <Field label="Lejand (caption)">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-cream-200 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest-200 resize-none"
              />
            </Field>
            <Field label="Dosye">
              <select
                value={folderId ?? ''}
                onChange={(e) => setFolderId(e.target.value || null)}
                className="w-full px-3 py-2 rounded-lg border border-cream-200 text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-forest-200"
              >
                <option value="">— San dosye —</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </Field>

            {err && <p className="text-xs text-rose-700">{err}</p>}

            <div className="flex items-center justify-between gap-2 pt-1">
              {!confirmDel ? (
                <button
                  type="button"
                  onClick={() => setConfirmDel(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-rose-700 hover:bg-rose-50 text-sm font-semibold transition"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={2.2} />
                  Efase
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={remove}
                    disabled={deleting}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 disabled:opacity-60 transition"
                  >
                    {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Konfime efase
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDel(false)}
                    className="px-3 py-2 rounded-lg text-earth-600 hover:bg-cream-100 text-sm font-semibold transition"
                  >
                    Anile
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-forest-700 text-white text-sm font-bold shadow-card hover:bg-forest-800 disabled:opacity-60 transition"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Anrejistre
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wider text-earth-600">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-earth-400 uppercase tracking-wider text-[10px] font-bold">
        {k}
      </dt>
      <dd className="font-mono text-earth-700">{v}</dd>
    </div>
  );
}
