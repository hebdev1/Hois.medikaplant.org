'use server';

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type ContactInsert = Database['public']['Tables']['contact_messages']['Insert'];

const TOPIC_VALUES = ['general', 'support', 'partnership', 'press', 'plant'] as const;
type Topic = (typeof TOPIC_VALUES)[number];

export type ContactState =
  | { status: 'idle' }
  | { status: 'error'; error: string }
  | { status: 'ok' };

export async function submitContactMessage(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  // ── Honeypot ─────────────────────────────────────────────────────────
  // Bots tend to fill every input including hidden ones; the company_name
  // field has aria-hidden=true and is visually hidden — a non-empty value
  // here is almost certainly automated. We silently "succeed" so the bot
  // doesn't realise it was caught.
  if (formData.get('company_name')) {
    return { status: 'ok' };
  }

  const fullName = (formData.get('full_name')?.toString() ?? '').trim();
  const email = (formData.get('email')?.toString() ?? '').trim().toLowerCase();
  const phone = (formData.get('phone')?.toString() ?? '').trim() || null;
  const subject = (formData.get('subject')?.toString() ?? '').trim();
  const message = (formData.get('message')?.toString() ?? '').trim();
  const topicRaw = (formData.get('topic')?.toString() ?? 'general').trim();
  const topic: Topic = TOPIC_VALUES.includes(topicRaw as Topic)
    ? (topicRaw as Topic)
    : 'general';

  if (fullName.length < 2) {
    return { status: 'error', error: 'Tanpri ekri non w (omwen 2 karaktè).' };
  }
  if (fullName.length > 120) {
    return { status: 'error', error: 'Non w twò long.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: 'error', error: 'Imèl la pa valid.' };
  }
  if (subject.length < 3) {
    return { status: 'error', error: 'Sijè a twò kout (omwen 3 karaktè).' };
  }
  if (subject.length > 200) {
    return { status: 'error', error: 'Sijè a twò long.' };
  }
  if (message.length < 10) {
    return { status: 'error', error: 'Mesaj la twò kout (omwen 10 karaktè).' };
  }
  if (message.length > 5000) {
    return { status: 'error', error: 'Mesaj la twò long (maks 5000 karaktè).' };
  }
  if (phone && !/^[+]?[0-9\s\-()]{7,20}$/.test(phone)) {
    return { status: 'error', error: 'Nimewo telefòn pa valid.' };
  }

  const supabase = createClient();

  // Capture user_id if the visitor happens to already be signed in —
  // helpful for follow-up from the admin side. RLS allows anon inserts
  // either way.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const insert: ContactInsert = {
    user_id: user?.id ?? null,
    full_name: fullName,
    email,
    phone,
    subject,
    message,
    topic,
  };

  const { error } = await supabase.from('contact_messages').insert(insert);
  if (error) {
    return { status: 'error', error: error.message };
  }

  return { status: 'ok' };
}
