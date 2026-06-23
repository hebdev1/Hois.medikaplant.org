import DOMPurify from 'isomorphic-dompurify';

// Shared HTML sanitizer for content the admin pastes into the rich-text
// editor (guides → body_html, and any future Tiptap-edited surface).
//
// We allow a permissive but bounded tag set — the same set Tiptap can
// emit from StarterKit + Underline + Image + Link + TextAlign — and
// strip everything else. Specifically: no <script>, no <iframe>, no
// inline event handlers, no javascript: URIs.

const ALLOWED_TAGS = [
  'p',
  'br',
  'span',
  'div',
  'strong',
  'em',
  'u',
  's',
  'code',
  'pre',
  'blockquote',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'a',
  'img',
] as const;

const ALLOWED_ATTR = [
  'href',
  'src',
  'alt',
  'title',
  'target',
  'rel',
  // Tiptap TextAlign writes alignment to a `style` attribute (text-align).
  // We allow inline style but DOMPurify strips JS-y values automatically.
  'style',
  // Tiptap may stamp a few helper classes for ordered/list markers.
  'class',
] as const;

export function sanitizeGuideHtml(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...ALLOWED_TAGS],
    ALLOWED_ATTR: [...ALLOWED_ATTR],
    // Force opening links in a new tab + drop the referer header.
    ADD_ATTR: ['target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}
