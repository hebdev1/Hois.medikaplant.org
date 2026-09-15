import Link from 'next/link';
import { Facebook, Instagram, Youtube, Mail } from 'lucide-react';
import { getSiteChrome } from '@/lib/site-chrome';

export default async function Footer() {
  const chrome = await getSiteChrome();
  const columns = chrome.footerColumns;

  const socials = [
    { Icon: Facebook, label: 'Facebook', href: chrome.socials.facebook },
    { Icon: Instagram, label: 'Instagram', href: chrome.socials.instagram },
    { Icon: Youtube, label: 'YouTube', href: chrome.socials.youtube },
    { Icon: Mail, label: 'Email', href: chrome.socials.email },
  ].filter((s) => s.href && s.href.trim());

  return (
    <footer className="bg-ink text-white/80">
      <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32 py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-hois.png" alt="Hoïs" className="h-11 w-auto shrink-0" />
            </Link>
            <p className="text-sm leading-relaxed max-w-sm">{chrome.footerTagline}</p>

            {socials.length > 0 && (
              <div className="mt-6 flex items-center gap-3">
                {socials.map(({ Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="grid place-items-center w-9 h-9 rounded-full bg-white/10 hover:bg-brand-600 transition-colors"
                  >
                    <Icon className="w-4 h-4" strokeWidth={2} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Columns */}
          {columns.map((col, i) => (
            <div key={`${col.title}-${i}`}>
              <h4 className="text-white font-semibold mb-4 text-sm tracking-wide uppercase">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((l, j) => (
                  <li key={`${l.label}-${j}`}>
                    <a
                      href={l.url || '#'}
                      target={l.target === '_blank' ? '_blank' : undefined}
                      rel={l.target === '_blank' ? 'noopener noreferrer' : undefined}
                      className="text-sm hover:text-brand-300 transition-colors"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} MedikaPlant · Hoïs Inivèsite. Tout dwa rezève.
          </p>
          <div className="flex items-center gap-6 text-xs text-white/60">
            <Link href="/konfidansyalite" className="hover:text-white">
              Konfidansyalite
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
