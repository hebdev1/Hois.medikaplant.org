'use client';

import React from 'react';
import Link from 'next/link';
import { Leaf, Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '#akey', label: 'Akèy' },
  { href: '#pwodui', label: 'Pwodui' },
  { href: '#istwa', label: 'Istwa' },
  { href: '#hois', label: 'HOÏS' },
  { href: '#pri', label: 'Pri' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    function onClickOutside(e: MouseEvent) {
      if (!menuRef.current) return;
      if (menuRef.current.contains(e.target as Node)) return;
      setMenuOpen(false);
    }
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }

    if (menuOpen) {
      document.addEventListener('keydown', onKey);
      document.addEventListener('click', onClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClickOutside);
      window.removeEventListener('scroll', onScroll);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all',
        scrolled
          ? 'bg-white/85 backdrop-blur-md shadow-sm border-b border-slate-200/60'
          : 'bg-transparent'
      )}
    >
      <nav className="flex items-center justify-between px-4 md:px-12 lg:px-20 xl:px-32 py-4 md:py-5 w-full max-w-[1400px] mx-auto">
        <Link href="/" aria-label="MedikaPlant home" className="flex items-center gap-2">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-brand-gradient text-white shadow-md">
            <Leaf className="w-5 h-5" strokeWidth={2.4} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-bold text-lg text-ink tracking-tight">
              MedikaPlant
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-brand-700 font-medium">
              Hoïs Inivèsite
            </span>
          </span>
        </Link>

        <div
          id="menu"
          ref={menuRef}
          className={cn(
            'max-md:fixed max-md:top-0 max-md:left-0 max-md:transition-all max-md:duration-300 max-md:overflow-hidden max-md:h-full max-md:bg-white/95 max-md:backdrop-blur-xl max-md:shadow-2xl',
            'flex items-center gap-8 font-medium text-ink',
            'max-md:flex-col max-md:justify-center',
            menuOpen ? 'max-md:w-full' : 'max-md:w-0'
          )}
          aria-hidden={!menuOpen}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="hover:text-brand-700 transition-colors"
            >
              {link.label}
            </a>
          ))}

          <div className="relative group flex items-center gap-1 cursor-pointer">
            <span>Plis</span>
            <ChevronDown className="w-4 h-4" strokeWidth={2} />
            <div className="absolute bg-white font-normal flex flex-col gap-2 w-max rounded-xl p-4 top-10 left-1/2 -translate-x-1/2 opacity-0 -translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 shadow-card border border-slate-100">
              <a href="#" className="hover:text-brand-700 transition-colors">MedikaplantShop</a>
              <a href="#" className="hover:text-brand-700 transition-colors">Inivèsite Hoïs</a>
              <a href="#" className="hover:text-brand-700 transition-colors">Blòg & Atik</a>
              <a href="#" className="hover:text-brand-700 transition-colors">Konsiltasyon</a>
            </div>
          </div>

          <button
            onClick={() => setMenuOpen(false)}
            className="md:hidden bg-ink hover:bg-black text-white p-2 rounded-md aspect-square transition absolute top-4 right-4"
            aria-label="Fèmen meni"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>

          <Link
            href="/auth/login"
            className="md:hidden bg-brand-gradient text-white px-6 py-3 rounded-full font-medium transition shadow-md"
            onClick={() => setMenuOpen(false)}
          >
            Konekte
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-ink hover:text-brand-700 font-medium transition"
          >
            Konekte
          </Link>
          <Link
            href="#pri"
            className="bg-brand-gradient hover:brightness-110 text-white px-5 py-2.5 rounded-full font-medium transition shadow-md"
          >
            Vin manm
          </Link>
        </div>

        <button
          id="open-menu"
          onClick={() => setMenuOpen(true)}
          className="md:hidden bg-ink hover:bg-black text-white p-2 rounded-md aspect-square transition"
          aria-label="Louvri meni"
        >
          <Menu className="w-5 h-5" strokeWidth={2} />
        </button>
      </nav>
    </header>
  );
}
