import Link from 'next/link';
import { ArrowRight, Leaf } from 'lucide-react';

export default function CtaSection() {
  return (
    <section className="relative w-full py-24 md:py-32 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
        <div className="relative isolate rounded-[2.5rem] overflow-hidden bg-brand-gradient text-white p-10 md:p-16 lg:p-20 shadow-card">
          {/* Decorative pattern */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
              backgroundSize: '24px 24px',
            }}
            aria-hidden
          />
          <div className="absolute -top-20 -right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" aria-hidden />
          <div className="absolute -bottom-16 -left-10 w-72 h-72 bg-emerald-300/20 rounded-full blur-3xl" aria-hidden />

          <div className="relative grid lg:grid-cols-[1.4fr_0.6fr] gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
                <Leaf className="w-4 h-4" strokeWidth={2.2} />
                Pare pou kòmanse?
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight max-w-[680px]">
                Rantre nan kominote Hoïs la jodi a pou w pran swen kò w ak nanm ou.
              </h2>
              <p className="mt-5 text-white/85 max-w-[560px] text-base md:text-lg leading-relaxed">
                Plis pase 500 manm deja swiv pwogresyon yo, dekouvri remèd fèy yo ak Hoïs Medikaplant.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
              <Link
                href="#pri"
                className="group inline-flex items-center justify-center gap-2 bg-white text-brand-700 hover:bg-slate-50 px-7 py-3.5 rounded-full font-semibold shadow-lg transition-all w-full lg:w-auto"
              >
                Wè plan yo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.4} />
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 hover:bg-white/25 text-white px-7 py-3.5 rounded-full font-medium transition-all w-full lg:w-auto"
              >
                Kreye kont ou Jodi a
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
