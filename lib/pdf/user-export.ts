'use client';

// User-data PDF export. Renders the JSON blob returned by
// app/dashboard/settings/actions.ts → exportUserData() into a multi-page
// branded PDF that a member can download for their records (or hand to
// a clinician). jspdf is small, well-supported, and runs entirely in
// the browser — no server-side PDF dependency.

import jsPDF from 'jspdf';

type ExportData = Record<string, unknown>;

const COLORS = {
  ink: [5, 0, 64] as [number, number, number],
  forest: [63, 117, 34] as [number, number, number],
  earth: [92, 61, 46] as [number, number, number],
  muted: [120, 110, 130] as [number, number, number],
  rule: [220, 215, 200] as [number, number, number],
} as const;

const PAGE_MARGIN = 50;
const LINE_HEIGHT = 14;
const PAGE_BOTTOM_GUARD = 70; // reserve room for the footer
const MAX_LIST_ROWS = 25;

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDate(value: unknown): string {
  if (!value || typeof value !== 'string') return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateOnly(value: unknown): string {
  if (!value || typeof value !== 'string') return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  });
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is Record<string, unknown> => v !== null && typeof v === 'object'
  );
}

function safe(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Wi' : 'Non';
  if (Array.isArray(value)) return value.length === 0 ? '—' : value.join(', ');
  return String(value);
}

// ─── PDF builder ───────────────────────────────────────────────────────────

class PdfBuilder {
  private doc: jsPDF;
  private y: number;
  private pageWidth: number;
  private pageHeight: number;

  constructor() {
    this.doc = new jsPDF({ unit: 'pt', format: 'a4' });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.y = PAGE_MARGIN;
  }

  private ensureRoom(needed: number) {
    if (this.y + needed > this.pageHeight - PAGE_BOTTOM_GUARD) {
      this.doc.addPage();
      this.y = PAGE_MARGIN;
    }
  }

  header(title: string, subtitle: string) {
    // Brand strip
    const [fr, fg, fb] = COLORS.forest;
    this.doc.setFillColor(fr, fg, fb);
    this.doc.rect(0, 0, this.pageWidth, 70, 'F');

    // Brand mark
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(20);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('Hoïs · MedikaPlant', PAGE_MARGIN, 32);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(230, 241, 222);
    this.doc.text(subtitle, PAGE_MARGIN, 52);

    this.y = 110;

    // Document title
    const [ir, ig, ib] = COLORS.ink;
    this.doc.setTextColor(ir, ig, ib);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(22);
    this.doc.text(title, PAGE_MARGIN, this.y);
    this.y += 26;

    this.doc.setFont('helvetica', 'italic');
    this.doc.setFontSize(10);
    const [mr, mg, mb] = COLORS.muted;
    this.doc.setTextColor(mr, mg, mb);
    this.doc.text(
      `Jenere ${formatDate(new Date().toISOString())} · Hoïs Inivèsite`,
      PAGE_MARGIN,
      this.y
    );
    this.y += 24;
  }

  sectionTitle(label: string) {
    this.ensureRoom(40);
    const [fr, fg, fb] = COLORS.forest;
    this.doc.setFillColor(fr, fg, fb);
    this.doc.rect(PAGE_MARGIN, this.y, 3, 16, 'F');

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(13);
    const [ir, ig, ib] = COLORS.ink;
    this.doc.setTextColor(ir, ig, ib);
    this.doc.text(label, PAGE_MARGIN + 10, this.y + 12);
    this.y += 24;
  }

  paragraph(text: string) {
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    const [er, eg, eb] = COLORS.earth;
    this.doc.setTextColor(er, eg, eb);
    const lines = this.doc.splitTextToSize(
      text,
      this.pageWidth - 2 * PAGE_MARGIN
    );
    for (const line of lines) {
      this.ensureRoom(LINE_HEIGHT);
      this.doc.text(line, PAGE_MARGIN, this.y);
      this.y += LINE_HEIGHT;
    }
    this.y += 4;
  }

  keyValueTable(rows: Array<[string, string]>) {
    if (rows.length === 0) {
      this.paragraph('— Pa gen okenn done —');
      return;
    }
    const keyCol = PAGE_MARGIN;
    const valCol = PAGE_MARGIN + 160;
    const maxValWidth = this.pageWidth - valCol - PAGE_MARGIN;

    for (const [k, v] of rows) {
      const valueLines = this.doc.splitTextToSize(v || '—', maxValWidth);
      const rowHeight = Math.max(LINE_HEIGHT, valueLines.length * LINE_HEIGHT);
      this.ensureRoom(rowHeight + 4);

      // Key
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(9);
      const [mr, mg, mb] = COLORS.muted;
      this.doc.setTextColor(mr, mg, mb);
      this.doc.text(k, keyCol, this.y);

      // Value
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(10);
      const [ir, ig, ib] = COLORS.ink;
      this.doc.setTextColor(ir, ig, ib);
      this.doc.text(valueLines, valCol, this.y);

      this.y += rowHeight + 2;

      // Faint rule
      const [rr, rg, rb] = COLORS.rule;
      this.doc.setDrawColor(rr, rg, rb);
      this.doc.setLineWidth(0.5);
      this.doc.line(
        PAGE_MARGIN,
        this.y,
        this.pageWidth - PAGE_MARGIN,
        this.y
      );
      this.y += 6;
    }
    this.y += 6;
  }

  listRows(
    rows: Array<Record<string, string>>,
    columns: Array<{ key: string; label: string; width: number }>
  ) {
    if (rows.length === 0) {
      this.paragraph('— Pa gen okenn done —');
      return;
    }

    const truncated = rows.slice(0, MAX_LIST_ROWS);
    const remaining = rows.length - truncated.length;

    // Header row
    this.ensureRoom(18);
    this.doc.setFillColor(245, 240, 224);
    this.doc.rect(
      PAGE_MARGIN,
      this.y - 2,
      this.pageWidth - 2 * PAGE_MARGIN,
      16,
      'F'
    );
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(8);
    const [mr, mg, mb] = COLORS.muted;
    this.doc.setTextColor(mr, mg, mb);

    let cursor = PAGE_MARGIN + 6;
    for (const col of columns) {
      this.doc.text(col.label.toUpperCase(), cursor, this.y + 9);
      cursor += col.width;
    }
    this.y += 18;

    // Body rows
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    const [ir, ig, ib] = COLORS.ink;
    this.doc.setTextColor(ir, ig, ib);

    for (const row of truncated) {
      this.ensureRoom(LINE_HEIGHT + 2);
      let x = PAGE_MARGIN + 6;
      for (const col of columns) {
        const txt = String(row[col.key] ?? '—');
        const lines = this.doc.splitTextToSize(txt, col.width - 6);
        this.doc.text(lines[0] ?? '—', x, this.y);
        x += col.width;
      }
      this.y += LINE_HEIGHT;

      const [rr, rg, rb] = COLORS.rule;
      this.doc.setDrawColor(rr, rg, rb);
      this.doc.setLineWidth(0.25);
      this.doc.line(
        PAGE_MARGIN,
        this.y,
        this.pageWidth - PAGE_MARGIN,
        this.y
      );
      this.y += 4;
    }

    if (remaining > 0) {
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(8);
      const [mr, mg, mb] = COLORS.muted;
      this.doc.setTextColor(mr, mg, mb);
      this.doc.text(
        `+${remaining} antre adisyonèl pa parèt nan PDF la (yo enkli nan total konte yo).`,
        PAGE_MARGIN,
        this.y + 4
      );
      this.y += 14;
    }
    this.y += 4;
  }

  finalizeFooter() {
    const pageCount = this.doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      const [mr, mg, mb] = COLORS.muted;
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(mr, mg, mb);
      this.doc.text(
        'Done konfidansyèl · Hoïs Inivèsite · hoismedikaplant.com',
        PAGE_MARGIN,
        this.pageHeight - 30
      );
      this.doc.text(
        `Paj ${i} / ${pageCount}`,
        this.pageWidth - PAGE_MARGIN - 50,
        this.pageHeight - 30
      );
      const [rr, rg, rb] = COLORS.rule;
      this.doc.setDrawColor(rr, rg, rb);
      this.doc.setLineWidth(0.5);
      this.doc.line(
        PAGE_MARGIN,
        this.pageHeight - 42,
        this.pageWidth - PAGE_MARGIN,
        this.pageHeight - 42
      );
    }
  }

  save(filename: string) {
    this.finalizeFooter();
    this.doc.save(filename);
  }
}

// ─── Section builders ──────────────────────────────────────────────────────

function renderIdentity(b: PdfBuilder, data: ExportData) {
  b.sectionTitle('1 · Idantite');
  const user = asRecord(data.user) ?? {};
  const profile = asRecord(data.profile) ?? {};
  b.keyValueTable([
    ['Imèl', safe(user.email)],
    ['Non konplè', safe(profile.full_name)],
    ['Prenon', safe(profile.first_name)],
    ['Non fanmi', safe(profile.last_name)],
    ['Plan aktyèl', safe(profile.plan)],
    ['Wòl', safe(profile.role)],
    ['Telefòn', safe(profile.phone)],
    ['Peyi', safe(profile.country)],
    ['Vil', safe(profile.city)],
    ['Dat enskripsyon', formatDate(user.created_at)],
    ['Dènye koneksyon', formatDate(user.last_sign_in_at)],
  ]);
}

function renderProfile(b: PdfBuilder, data: ExportData) {
  const profile = asRecord(data.profile);
  if (!profile) return;
  b.sectionTitle('2 · Pwofil');
  b.keyValueTable([
    ['Dat nesans', formatDateOnly(profile.date_of_birth)],
    ['Sèks', safe(profile.gender)],
    ['Adrès liy 1', safe(profile.address_line1)],
    ['Adrès liy 2', safe(profile.address_line2)],
    ['Vil', safe(profile.city)],
    ['Depatman', safe(profile.region)],
    ['Kòd postal', safe(profile.postal_code)],
    ['Kontak ijans', safe(profile.emergency_contact_name)],
    ['Tel. ijans', safe(profile.emergency_contact_phone)],
    ['Bio', safe(profile.bio)],
  ]);
}

function renderMedical(b: PdfBuilder, data: ExportData) {
  const med = asRecord(data.medical_info);
  if (!med) return;
  b.sectionTitle('3 · Enfòmasyon Sante');
  b.keyValueTable([
    ['Wotè', med.height_cm ? `${med.height_cm} cm` : '—'],
    ['Tip san', safe(med.blood_type)],
    ['Kondisyon medikal', safe(med.conditions)],
    ['Objektif prensipal', safe(med.health_goal)],
    ['Detay objektif "Lòt"', safe(med.health_goal_other)],
    ['Alèji', safe(med.allergies)],
    ['Medikaman', safe(med.medications)],
    ['Maladi kwonik', safe(med.chronic_diseases)],
    ['Operasyon pase', safe(med.past_surgeries)],
    ['Doktè', safe(med.doctor_name)],
    ['Telefòn doktè', safe(med.doctor_phone)],
    ['Famasi prefere', safe(med.preferred_pharmacy)],
    ['Lòt nòt', safe(med.notes)],
  ]);
}

function renderPreferences(b: PdfBuilder, data: ExportData) {
  const prefs = asRecord(data.preferences);
  if (!prefs) return;
  b.sectionTitle('4 · Preferans');
  b.keyValueTable([
    ['Aksan koulè', safe(prefs.accent)],
    ['Densite', safe(prefs.density)],
    ['Mòd fonse', safe(prefs.dark_mode)],
    ['Lang', safe(prefs.language)],
    ['Gwosè tèks', prefs.font_size ? `${prefs.font_size}px` : '—'],
    ['Notifikasyon imèl', safe(prefs.email_notifications)],
    ['Push navigatè', safe(prefs.push_notifications)],
    ['Konsèy chak jou', safe(prefs.daily_advice_email)],
    ['Rezime semèn', safe(prefs.weekly_summary_email)],
    ['Rapèl badj', safe(prefs.badge_unlock_email)],
    ['Èdtan rapèl', safe(prefs.reminder_time)],
    ['Sib pwa', prefs.target_weight_kg ? `${prefs.target_weight_kg} kg` : '—'],
    [
      'Sib sik (mg/dL)',
      `${safe(prefs.target_blood_sugar_min)} – ${safe(prefs.target_blood_sugar_max)}`,
    ],
    ['Dlo pa jou', prefs.daily_water_liters ? `${prefs.daily_water_liters} L` : '—'],
    ['Inite pwa', safe(prefs.weight_unit)],
  ]);
}

function renderSubscriptions(b: PdfBuilder, data: ExportData) {
  const rows = asArray(data.subscriptions);
  b.sectionTitle(`5 · Sibskripsyon (${rows.length})`);
  b.listRows(
    rows.map((r) => ({
      plan: safe(r.plan),
      status: safe(r.status),
      start: formatDateOnly(r.start_date),
      end: formatDateOnly(r.end_date),
      amount: r.amount != null ? `$${r.amount}` : '—',
    })),
    [
      { key: 'plan', label: 'Plan', width: 90 },
      { key: 'status', label: 'Eta', width: 70 },
      { key: 'start', label: 'Kòmanse', width: 110 },
      { key: 'end', label: 'Fini', width: 110 },
      { key: 'amount', label: 'Montan', width: 80 },
    ]
  );
}

function renderHealthLogs(b: PdfBuilder, data: ExportData) {
  const rows = asArray(data.health_logs);
  b.sectionTitle(`6 · Log Sante (${rows.length})`);
  b.listRows(
    rows.map((r) => ({
      when: formatDate(r.logged_at),
      type: safe(r.metric_type),
      value: safe(r.value),
      notes: safe(r.notes),
    })),
    [
      { key: 'when', label: 'Dat', width: 140 },
      { key: 'type', label: 'Tip', width: 100 },
      { key: 'value', label: 'Valè', width: 80 },
      { key: 'notes', label: 'Nòt', width: 140 },
    ]
  );
}

function renderPrograms(b: PdfBuilder, data: ExportData) {
  const rows = asArray(data.programs);
  b.sectionTitle(`7 · Pwogram (${rows.length})`);
  b.listRows(
    rows.map((r) => ({
      program: safe(r.program_id),
      status: safe(r.status),
      progress: r.progress_percent != null ? `${r.progress_percent}%` : '—',
      started: formatDateOnly(r.started_at),
    })),
    [
      { key: 'program', label: 'Pwogram', width: 200 },
      { key: 'status', label: 'Eta', width: 90 },
      { key: 'progress', label: 'Pwogrè', width: 80 },
      { key: 'started', label: 'Kòmanse', width: 110 },
    ]
  );
}

function renderBadges(b: PdfBuilder, data: ExportData) {
  const rows = asArray(data.badges);
  b.sectionTitle(`8 · Badj (${rows.length})`);
  b.listRows(
    rows.map((r) => ({
      badge: safe(r.badge_id ?? r.code),
      earned: formatDate(r.earned_at ?? r.unlocked_at),
    })),
    [
      { key: 'badge', label: 'Badj', width: 280 },
      { key: 'earned', label: 'Resevwa', width: 200 },
    ]
  );
}

function renderConsultations(b: PdfBuilder, data: ExportData) {
  const rows = asArray(data.consultations);
  b.sectionTitle(`9 · Konsiltasyon (${rows.length})`);
  b.listRows(
    rows.map((r) => ({
      when: formatDate(r.scheduled_at),
      type: safe(r.type),
      status: safe(r.status),
    })),
    [
      { key: 'when', label: 'Dat', width: 180 },
      { key: 'type', label: 'Tip', width: 180 },
      { key: 'status', label: 'Eta', width: 100 },
    ]
  );
}

// ─── Public API ────────────────────────────────────────────────────────────

export function buildUserExportPdf(data: ExportData, filename: string): void {
  const profile = asRecord(data.profile);
  const user = asRecord(data.user);
  const name =
    (profile?.full_name as string | undefined) ||
    (user?.email as string | undefined) ||
    'Manm Hoïs';

  const b = new PdfBuilder();
  b.header('Eksport Done Pèsonèl', `Pou : ${name}`);

  b.paragraph(
    'Dokiman sa a gen tout done Hoïs MedikaPlant gen sou ou nan dat ki ' +
      'endike anlè a. Li respekte dwa pòtabilite done ou (GDPR / lwa enfòmasyon ' +
      'pèsonèl). Ou ka kenbe l pou tèt ou, oswa pataje l ak yon doktè / ' +
      'kondisyon medikal.'
  );

  renderIdentity(b, data);
  renderProfile(b, data);
  renderMedical(b, data);
  renderPreferences(b, data);
  renderSubscriptions(b, data);
  renderHealthLogs(b, data);
  renderPrograms(b, data);
  renderBadges(b, data);
  renderConsultations(b, data);

  b.save(filename);
}
