'use client';

// Tiptap-based WYSIWYG editor used by the admin guide form. Wrapped in
// a tiny toolbar so a non-technical admin can format text the way they
// would in Word/Docs: headings, bold/italic/underline, lists, alignment,
// inline images via URL, links, undo/redo.
//
// Output: HTML. The host form stores it in guides.body_html; the
// dashboard read-side sanitizes it with isomorphic-dompurify before
// rendering.

import React from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Image as ImageIcon,
  ImagePlus,
  Loader2,
  Link as LinkIcon,
  Link2Off,
  Undo2,
  Redo2,
  RemoveFormatting,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Server action signature for uploading inline images. The host form
// (guide-form.tsx) passes its own server action so the editor stays
// surface-agnostic — any future Tiptap host can plug in a different
// upload backend.
export type ImageUploader = (
  formData: FormData
) => Promise<{ ok: true; url: string } | { ok: false; error: string }>;

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Min editor body height (px). Defaults to 360. */
  minHeight?: number;
  /** When provided, the toolbar exposes a "upload imaj" button that
   *  POSTs a File to this action and inserts the returned URL. */
  uploadImage?: ImageUploader;
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Kòmanse ekri atik la la a…',
  minHeight = 360,
  uploadImage,
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: 'text-forest-700 underline underline-offset-2',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
    ],
    content: value || '<p></p>',
    immediatelyRender: false, // SSR-safe (Next.js)
    editorProps: {
      attributes: {
        class: cn(
          'tiptap-body prose prose-sm max-w-none focus:outline-none',
          'min-h-[var(--rte-min-h,360px)] px-4 py-3 text-ink',
          // Word-like body type
          'leading-relaxed'
        ),
        style: `--rte-min-h: ${minHeight}px`,
        'data-placeholder': placeholder,
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // If the parent feeds a different `value` (e.g. after a server
  // revalidation), reconcile WITHOUT triggering onUpdate — calling
  // setContent with the second arg `false` skips emitting an update.
  React.useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((value || '<p></p>') !== current) {
      editor.commands.setContent(value || '<p></p>', { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) {
    return (
      <div
        className="rounded-xl border border-cream-200 bg-cream-50 px-4 py-6 text-sm text-earth-600"
        style={{ minHeight }}
      >
        Editè ap chaje…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-cream-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-forest-200 focus-within:border-forest-300 transition">
      <Toolbar editor={editor} uploadImage={uploadImage} />
      <EditorContent editor={editor} />
      <PlaceholderStyles />
    </div>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────

function Toolbar({
  editor,
  uploadImage,
}: {
  editor: Editor;
  uploadImage?: ImageUploader;
}) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-2 bg-cream-50 border-b border-cream-200 sticky top-0 z-10">
      <ToolGroup>
        <ToolButton
          icon={Heading1}
          label="Tit prensipal (H1)"
          active={editor.isActive('heading', { level: 1 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        />
        <ToolButton
          icon={Heading2}
          label="Soutit (H2)"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        />
        <ToolButton
          icon={Heading3}
          label="Soutit pi piti (H3)"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        />
      </ToolGroup>

      <ToolGroup>
        <ToolButton
          icon={Bold}
          label="Gra (Ctrl+B)"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolButton
          icon={Italic}
          label="Italik (Ctrl+I)"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolButton
          icon={UnderlineIcon}
          label="Souliye (Ctrl+U)"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <ToolButton
          icon={Strikethrough}
          label="Bare"
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
      </ToolGroup>

      <ToolGroup>
        <ToolButton
          icon={List}
          label="Lis pwen"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolButton
          icon={ListOrdered}
          label="Lis nimewote"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolButton
          icon={Quote}
          label="Sitasyon"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />
      </ToolGroup>

      <ToolGroup>
        <ToolButton
          icon={AlignLeft}
          label="Aliyen agoch"
          active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        />
        <ToolButton
          icon={AlignCenter}
          label="Aliyen sant"
          active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        />
        <ToolButton
          icon={AlignRight}
          label="Aliyen adwat"
          active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        />
        <ToolButton
          icon={AlignJustify}
          label="Jistifye"
          active={editor.isActive({ textAlign: 'justify' })}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        />
      </ToolGroup>

      <ToolGroup>
        <ToolButton
          icon={LinkIcon}
          label="Ajoute oswa edite yon lyen"
          active={editor.isActive('link')}
          onClick={() => promptLink(editor)}
        />
        <ToolButton
          icon={Link2Off}
          label="Retire lyen"
          disabled={!editor.isActive('link')}
          onClick={() => editor.chain().focus().unsetLink().run()}
        />
        {uploadImage && (
          <ImageUploadButton editor={editor} uploadImage={uploadImage} />
        )}
        <ToolButton
          icon={ImageIcon}
          label="Ajoute imaj via URL"
          onClick={() => promptImage(editor)}
        />
      </ToolGroup>

      <ToolGroup>
        <ToolButton
          icon={RemoveFormatting}
          label="Efase fòmatay"
          onClick={() =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }
        />
      </ToolGroup>

      <ToolGroup className="ml-auto">
        <ToolButton
          icon={Undo2}
          label="Defèt (Ctrl+Z)"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        />
        <ToolButton
          icon={Redo2}
          label="Refè (Ctrl+Y)"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        />
      </ToolGroup>
    </div>
  );
}

function ToolGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-0.5 px-1 border-r border-cream-200 last:border-r-0',
        className
      )}
    >
      {children}
    </div>
  );
}

function ToolButton({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active ? true : undefined}
      className={cn(
        'inline-flex items-center justify-center w-8 h-8 rounded-md transition',
        active
          ? 'bg-forest-100 text-forest-800'
          : 'text-earth-700 hover:bg-cream-100 hover:text-ink',
        disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent'
      )}
    >
      <Icon className="w-4 h-4" strokeWidth={2.1} />
    </button>
  );
}

// ─── Prompts ──────────────────────────────────────────────────────────────

function promptLink(editor: Editor) {
  const current = (editor.getAttributes('link') as { href?: string }).href ?? '';
  const next = window.prompt('URL lyen an (kite vid pou retire):', current);
  if (next === null) return; // cancelled
  if (next === '') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }
  // Force https-only to dodge javascript: URIs (DOMPurify will strip on
  // the read side too, but it's friendlier to block them here).
  if (!/^https?:\/\//i.test(next)) {
    window.alert('Lyen an dwe kòmanse pa http:// oswa https://');
    return;
  }
  editor.chain().focus().extendMarkRange('link').setLink({ href: next }).run();
}

function promptImage(editor: Editor) {
  const url = window.prompt('URL imaj la (https://…):');
  if (!url) return;
  if (!/^https?:\/\//i.test(url)) {
    window.alert('URL imaj la dwe kòmanse pa http:// oswa https://');
    return;
  }
  const alt = window.prompt('Tèks alternatif (deskripsyon imaj la):') ?? '';
  editor.chain().focus().setImage({ src: url, alt }).run();
}

// ─── Upload-from-disk button ─────────────────────────────────────────────
// Wraps a hidden <input type="file"> so the admin can pick an image from
// their machine, POST it to the host action, and insert the returned URL
// in one click. Shows a spinner while the upload is in flight.

function ImageUploadButton({
  editor,
  uploadImage,
}: {
  editor: Editor;
  uploadImage: ImageUploader;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function handleFileChosen(file: File) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set('file', file);
      const res = await uploadImage(fd);
      if (!res.ok) {
        window.alert(`Pa rive telechaje imaj la: ${res.error}`);
        return;
      }
      // Prompt for alt text so the published image is accessible.
      const alt =
        window.prompt(
          'Tèks alternatif (deskripsyon kout pou aksesiblite):',
          file.name.replace(/\.[^.]+$/, '')
        ) ?? '';
      editor.chain().focus().setImage({ src: res.url, alt }).run();
    } catch (e) {
      window.alert(`Erè telechajman: ${(e as Error).message}`);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <>
      <ToolButton
        icon={busy ? Loader2 : ImagePlus}
        label="Telechaje yon imaj soti nan òdinatè w"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFileChosen(f);
        }}
      />
    </>
  );
}

// ─── Placeholder styling ──────────────────────────────────────────────────
// Tiptap doesn't ship a placeholder out of the box — we inject a tiny
// CSS rule that shows the data-placeholder attribute when the editor
// only contains the initial empty paragraph.

function PlaceholderStyles() {
  return (
    <style jsx global>{`
      .tiptap-body p.is-editor-empty:first-child::before,
      .tiptap-body[data-placeholder]:not(:focus-within):empty::before,
      .tiptap-body[data-placeholder]
        > p:first-child:only-child:empty::before {
        content: attr(data-placeholder);
        float: left;
        color: #a4a0b3;
        pointer-events: none;
        height: 0;
      }
      .tiptap-body h1 {
        font-family: var(--font-playfair, Georgia, serif);
        font-size: 1.75rem;
        font-weight: 700;
        margin: 1.25rem 0 0.5rem;
        color: #050040;
      }
      .tiptap-body h2 {
        font-family: var(--font-playfair, Georgia, serif);
        font-size: 1.4rem;
        font-weight: 700;
        margin: 1.1rem 0 0.4rem;
        color: #050040;
      }
      .tiptap-body h3 {
        font-family: var(--font-playfair, Georgia, serif);
        font-size: 1.15rem;
        font-weight: 600;
        margin: 0.9rem 0 0.3rem;
        color: #050040;
      }
      .tiptap-body p {
        margin: 0.5rem 0;
      }
      .tiptap-body ul {
        list-style: disc;
        margin: 0.5rem 0 0.5rem 1.5rem;
      }
      .tiptap-body ol {
        list-style: decimal;
        margin: 0.5rem 0 0.5rem 1.5rem;
      }
      .tiptap-body blockquote {
        border-left: 3px solid #5a9138;
        margin: 0.75rem 0;
        padding: 0.25rem 0.75rem;
        color: #5b5a7a;
        font-style: italic;
      }
      .tiptap-body img {
        max-width: 100%;
        height: auto;
        border-radius: 0.75rem;
        margin: 0.75rem 0;
      }
      .tiptap-body a {
        color: #2d5a1b;
        text-decoration: underline;
        text-underline-offset: 2px;
      }
      .tiptap-body code {
        background: #f1ead7;
        padding: 0.1rem 0.3rem;
        border-radius: 0.25rem;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 0.9em;
      }
    `}</style>
  );
}
