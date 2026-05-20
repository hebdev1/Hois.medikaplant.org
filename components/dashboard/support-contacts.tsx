import { MessageCircle, Mail, Phone, Instagram, Facebook, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';

type Contact = Database['public']['Tables']['support_contacts']['Row'];
type ContactKind = Database['public']['Enums']['support_contact_kind'];

const KIND_META: Record<
  ContactKind,
  { icon: LucideIcon; bg: string; iconColor: string }
> = {
  whatsapp: {
    icon: MessageCircle,
    bg: 'bg-emerald-100',
    iconColor: 'text-emerald-700',
  },
  email: {
    icon: Mail,
    bg: 'bg-indigo-100',
    iconColor: 'text-indigo-700',
  },
  phone: {
    icon: Phone,
    bg: 'bg-amber-100',
    iconColor: 'text-amber-700',
  },
  instagram: {
    icon: Instagram,
    bg: 'bg-rose-100',
    iconColor: 'text-rose-700',
  },
  facebook: {
    icon: Facebook,
    bg: 'bg-sky-100',
    iconColor: 'text-sky-700',
  },
};

function ContactCard({ contact }: { contact: Contact }) {
  const meta = KIND_META[contact.kind];
  const Icon = meta.icon;
  const href = contact.href ?? null;
  const isExternal = href?.startsWith('http');

  const inner = (
    <>
      <span
        className={cn(
          'grid place-items-center w-11 h-11 rounded-xl shrink-0',
          meta.bg,
          meta.iconColor
        )}
      >
        <Icon className="w-5 h-5" strokeWidth={2} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-ink">{contact.label}</div>
        <div className="text-[11px] text-earth-600 truncate">
          {contact.sub_label ?? contact.value}
        </div>
      </div>
      {href && (
        <ChevronRight
          className="w-4 h-4 text-earth-500 group-hover:text-forest-700 transition shrink-0"
          strokeWidth={2}
        />
      )}
    </>
  );

  const className =
    'group flex items-center gap-3 px-4 py-3 rounded-xl bg-cream-50 border border-cream-200 hover:border-forest-200 hover:bg-white transition';

  if (href) {
    return (
      <a
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noreferrer' : undefined}
        className={className}
      >
        {inner}
      </a>
    );
  }
  return <div className={className}>{inner}</div>;
}

export default function SupportContacts({ contacts }: { contacts: Contact[] }) {
  if (contacts.length === 0) {
    return (
      <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
        <h3 className="font-display text-lg font-bold text-ink mb-2">
          Lòt fason pou kontakte nou
        </h3>
        <p className="text-sm text-earth-600">
          Poko gen chanèl ekstèn ki konfigire.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
      <header className="mb-4">
        <h3 className="font-display text-lg font-bold text-ink">
          Lòt fason pou <em className="text-forest-600 not-italic font-bold">kontakte nou</em>
        </h3>
        <p className="text-xs text-earth-600 mt-0.5">
          Chwazi chanèl ki pi alèz pou ou.
        </p>
      </header>
      <div className="space-y-2.5">
        {contacts.map((c) => (
          <ContactCard key={c.id} contact={c} />
        ))}
      </div>
    </section>
  );
}
