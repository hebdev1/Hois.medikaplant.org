import { Stethoscope, ArrowRight, Video, Phone, Users, ExternalLink } from 'lucide-react';

/**
 * Consultations panel. Used to host an in-app request/scheduling flow,
 * now replaced by a single external CTA — bookings happen on
 * medikaplantshop.com/consultation (their checkout + scheduling stack).
 * Keeps the visual rhythm of the health page but reduces dashboard
 * complexity since consultation lifecycle is no longer ours to manage.
 */
export default function ConsultationsPanel() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-forest-800 to-forest-900 text-cream-50 border border-forest-700 rounded-2xl p-5 md:p-7 shadow-card">
      <div
        className="absolute -top-12 -right-10 w-64 h-64 bg-gold-400/15 rounded-full blur-3xl pointer-events-none"
        aria-hidden
      />

      <div className="relative z-10 grid md:grid-cols-[1fr_auto] gap-5 md:gap-8 items-center">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-gold-300 font-semibold mb-2">
            <Stethoscope className="w-3 h-3" strokeWidth={2.4} />
            Konsiltasyon Hoïs
          </div>
          <h2 className="font-display text-xl md:text-2xl font-bold leading-snug">
            Mande yon{' '}
            <em className="text-gold-300 not-italic font-bold">
              konsiltasyon pèsonèl
            </em>
          </h2>
          <p className="mt-2 text-sm text-cream-200/90 leading-relaxed max-w-xl">
            Pwograme yon randevou ak yon doktè Hoïs sou medikaplantshop.com.
            Videyo, telefòn. chwazi sa ki pi bon pou ou epi
            peye dirèkteman sou boutik la.
          </p>

          {/* Modality chips */}
          <ul className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold">
            <ModalityChip
              icon={<Video className="w-3 h-3" strokeWidth={2.4} />}
              label="Videyo"
            />
            <ModalityChip
              icon={<Phone className="w-3 h-3" strokeWidth={2.4} />}
              label="Telefòn"
            />
            <ModalityChip
              icon={<Users className="w-3 h-3" strokeWidth={2.4} />}
              label="An pèsòn"
            />
          </ul>
        </div>

        <a
          href="https://medikaplantshop.com/consultation"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gold-400 hover:bg-gold-300 text-forest-900 font-bold text-sm shadow-lg transition shrink-0 whitespace-nowrap"
        >
          Pran randevou
          <ArrowRight className="w-4 h-4" strokeWidth={2.4} />
          <ExternalLink className="w-3 h-3 opacity-70" strokeWidth={2.4} />
        </a>
      </div>
    </section>
  );
}

function ModalityChip({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <li className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cream-50/10 border border-cream-50/15 text-cream-50">
      {icon}
      {label}
    </li>
  );
}
