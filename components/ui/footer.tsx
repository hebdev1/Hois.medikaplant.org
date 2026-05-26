import Link from 'next/link';
import { Leaf, Facebook, Instagram, Youtube, Mail } from 'lucide-react';

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Pwodui',
    links: [
      { label: 'Medikaplant', href: 'https://medikaplant.org/' },
      { label: 'Boutik', href: 'https://medikaplantshop.com' },
      { label: 'Konsiltasyon', href: 'https://medikaplantshop.com/consultation' },
      
    ],
  },
  {
    title: 'Hoïs Inivèsite',
    links: [
      { label: 'Plan VIP', href: '#pri' },
      { label: 'Fòmasyon', href: '' },
      { label: 'Blòg', href: '' },
      { label: 'Evènman', href: '' },
    ],
  },
  {
    title: 'Hoïs Inivèsite',
    links: [
      { label: 'Itwa nou', href: '#istwa' },
      { label: 'Kontak', href: '#' },
      { label: 'Klas', href: '#' },
      { label: 'Konfidansyalite', href: '#' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-ink text-white/80">
      <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32 py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="grid place-items-center w-10 h-10 rounded-xl bg-brand-gradient text-white shadow-md">
                <Leaf className="w-5 h-5" strokeWidth={2.4} />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="font-bold text-lg text-white">MedikaPlant</span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-brand-300 font-medium">
                  Hoïs Inivèsite
                </span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-sm">
              Platfòm natiropatik #1 nan kominote Ayisyèn nan, yon pon ant medsin tradisyonèl ak teknoloji modèn pou byennèt total ou.
            </p>

            <div className="mt-6 flex items-center gap-3">
              {[
                { Icon: Facebook, label: 'Facebook', href: '#' },
                { Icon: Instagram, label: 'Instagram', href: '#' },
                { Icon: Youtube, label: 'YouTube', href: '#' },
                { Icon: Mail, label: 'Email', href: 'mailto:hello@medikaplant.org' },
              ].map(({ Icon, label, href }) => (
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
          </div>

          {/* Columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-white font-semibold mb-4 text-sm tracking-wide uppercase">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-sm hover:text-brand-300 transition-colors">
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
            <a href="#" className="hover:text-white">Tèm sèvis</a>
            <a href="#" className="hover:text-white">Konfidansyalite</a>
            <a href="#" className="hover:text-white">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
