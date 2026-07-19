import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-white">
      <section className="hidden lg:flex relative flex-col justify-between p-12 bg-brand-gradient text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }} aria-hidden />
        <div className="relative">
          <Link href="/" className="inline-flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-hois.png"
              alt="Hoïs"
              className="h-11 w-auto shrink-0"
            />
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
