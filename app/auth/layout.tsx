import Link from 'next/link';
import { Leaf } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-white">
      <section className="hidden lg:flex relative flex-col justify-between p-12 bg-brand-gradient text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }} aria-hidden />
        <div className="relative">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm">
              <Leaf className="w-5 h-5" strokeWidth={2.4} />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-bold text-lg">MedikaPlant</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/70 font-medium">
                Hoïs Inivèsite
              </span>
            </span>
          </Link>
        </div>
        <div className="relative">
          <blockquote className="text-2xl font-medium leading-snug max-w-md">
            &ldquo;Lasante kò ak nanm soti nan lanati. MedikaPlant la pou akonpaye chak pa nan vwayaj ou.&rdquo;
          </blockquote>
          <p className="mt-4 text-white/80 text-sm">— Vye Ewòl, Hoïs Inivèsite</p>
        </div>
      </section>
      <section className="flex flex-col justify-center px-6 sm:px-12 py-12">
        <div className="w-full max-w-md mx-auto">{children}</div>
      </section>
    </main>
  );
}
