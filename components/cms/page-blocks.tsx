// Shared CMS page-block model + public renderer. Used by the admin block
// editor (live preview) and the public /paj/[slug] route so what an editor
// builds is exactly what visitors see.

import Link from 'next/link';
import { sanitizeGuideHtml } from '@/lib/sanitize-html';

export type Block =
  | { id: string; type: 'heading'; text: string; level: 2 | 3 }
  | { id: string; type: 'paragraph'; text: string }
  | { id: string; type: 'richtext'; html: string }
  | { id: string; type: 'image'; url: string; alt?: string; caption?: string }
  | { id: string; type: 'button'; label: string; href: string; variant: 'primary' | 'secondary' }
  | { id: string; type: 'divider' };

export type BlockType = Block['type'];

export const BLOCK_LABELS: Record<BlockType, string> = {
  heading: 'Tit',
  paragraph: 'Paragraf',
  richtext: 'Tèks rich',
  image: 'Imaj',
  button: 'Bouton',
  divider: 'Liy separasyon',
};


let counter = 0;
function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `b_${Date.now()}_${counter++}`;
}

/** Factory for a fresh block of the given type with sensible defaults. */
export function newBlock(type: BlockType): Block {
  switch (type) {
    case 'heading':
      return { id: uid(), type, text: 'Nouvo tit', level: 2 };
    case 'paragraph':
      return { id: uid(), type, text: '' };
    case 'richtext':
      return { id: uid(), type, html: '' };
    case 'image':
      return { id: uid(), type, url: '', alt: '', caption: '' };
    case 'button':
      return { id: uid(), type, label: 'Klike la', href: '#', variant: 'primary' };
    case 'divider':
      return { id: uid(), type };
  }
}

/** Renders an ordered list of blocks as the public page body. */
export function PageBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((b) => (
        <BlockView key={b.id} block={b} />
      ))}
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'heading':
      return block.level === 3 ? (
        <h3 className="font-display text-xl md:text-2xl font-bold text-ink tracking-tight">
          {block.text}
        </h3>
      ) : (
        <h2 className="font-display text-2xl md:text-3xl font-bold text-ink tracking-tight">
          {block.text}
        </h2>
      );
    case 'paragraph':
      return (
        <p className="text-ink/80 leading-relaxed whitespace-pre-wrap md:text-lg">
          {block.text}
        </p>
      );
    case 'richtext': {
      const clean = sanitizeGuideHtml(block.html || '');
      if (!clean || clean === '<p></p>') return null;
      return (
        <div
          className="text-ink/80 leading-relaxed md:text-lg space-y-3 [&_h1]:font-display [&_h1]:text-2xl [&_h1]:md:text-3xl [&_h1]:font-bold [&_h1]:text-ink [&_h2]:font-display [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:font-bold [&_h2]:text-ink [&_h2]:tracking-tight [&_h3]:font-display [&_h3]:text-xl [&_h3]:md:text-2xl [&_h3]:font-bold [&_h3]:text-ink [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_a]:text-forest-700 [&_a]:underline [&_strong]:font-bold [&_blockquote]:border-l-2 [&_blockquote]:border-cream-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-earth-600 [&_img]:rounded-xl [&_img]:border [&_img]:border-cream-200 [&_img]:my-2"
          dangerouslySetInnerHTML={{ __html: clean }}
        />
      );
    }
    case 'image':
      if (!block.url) return null;
      return (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.url}
            alt={block.alt || ''}
            className="w-full h-auto rounded-2xl border border-cream-200"
            loading="lazy"
          />
          {block.caption && (
            <figcaption className="mt-2 text-center text-sm text-earth-500">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    case 'button': {
      const cls =
        block.variant === 'secondary'
          ? 'bg-white text-ink border border-cream-300 hover:border-forest-300'
          : 'bg-forest-700 text-white hover:bg-forest-800';
      const external = /^https?:\/\//i.test(block.href);
      return (
        <div>
          {external ? (
            <a
              href={block.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center px-6 py-3 rounded-xl font-bold shadow-card transition ${cls}`}
            >
              {block.label}
            </a>
          ) : (
            <Link
              href={block.href || '#'}
              className={`inline-flex items-center px-6 py-3 rounded-xl font-bold shadow-card transition ${cls}`}
            >
              {block.label}
            </Link>
          )}
        </div>
      );
    }
    case 'divider':
      return <hr className="border-cream-200" />;
  }
}
