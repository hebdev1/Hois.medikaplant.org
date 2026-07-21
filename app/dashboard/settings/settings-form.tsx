'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  SettingsSection,
  ToggleSetting,
  RadioSetting,
  SliderSetting,
  NumberSetting,
  RangeSetting,
  TextSetting,
  TimeSetting,
  SwatchSetting,
} from '@/components/dashboard/settings-controls';
import {
  SelectSetting,
  DateSetting,
  TextareaSetting,
  MultiSelectSetting,
  AvatarUpload,
} from '@/components/dashboard/settings-controls-extra';
import PlanCard, {
  type SubscriptionInfo,
  type PastSubscription,
} from '@/components/dashboard/plan-card';
import PasswordSection from '@/components/dashboard/password-section';
import PaymentHistoryPanel, {
  type PaymentRecord,
} from '@/components/dashboard/payment-history-panel';
import DangerZonePanel from '@/components/dashboard/danger-zone-panel';
import {
  updatePreference,
  updateProfileField,
  uploadAvatar,
  removeAvatar,
  updateMedicalInfo,
} from './actions';
import { restartTour } from '../actions';
import { Compass, ArrowRight } from 'lucide-react';

// Mirror TranslateSwitcher's cookie contract so a settings-driven change
// lands in the same place the floating switcher writes to. Kept inline
// (rather than imported from the switcher) because the switcher is a
// client-only component whose full module we don't want to pull in just
// for one cookie-writer function.
function writeLangCookie(target: 'ht' | 'fr' | 'en') {
  if (typeof document === 'undefined') return;
  if (target === 'ht') {
    document.cookie = 'googtrans=; path=/; max-age=0';
    const host = window.location.hostname;
    if (host.split('.').length >= 2) {
      const apex = host.replace(/^(www|app|admin)\./, '');
      document.cookie = `googtrans=; path=/; domain=.${apex}; max-age=0`;
    }
    return;
  }
  const value = encodeURIComponent(`/ht/${target}`);
  document.cookie = `googtrans=${value}; path=/; max-age=31536000`;
  const host = window.location.hostname;
  if (host.split('.').length >= 2) {
    const apex = host.replace(/^(www|app|admin)\./, '');
    document.cookie = `googtrans=${value}; path=/; domain=.${apex}; max-age=31536000`;
  }
}
import type { Database } from '@/types/database';

type PrefRow = Database['public']['Tables']['user_preferences']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type MedicalRow = Database['public']['Tables']['user_medical_info']['Row'];

type Props = {
  profile: ProfileRow;
  preferences: PrefRow;
  medical: MedicalRow;
  subscription: SubscriptionInfo;
  pastSubscriptions: PastSubscription[];
  payments: PaymentRecord[];
};

const COUNTRIES: { value: string; label: string }[] = [
  { value: 'HT', label: '🇭🇹 Ayiti' },
  { value: 'US', label: '🇺🇸 Etazini' },
  { value: 'CA', label: '🇨🇦 Kanada' },
  { value: 'FR', label: '🇫🇷 Lafrans' },
  { value: 'DO', label: '🇩🇴 Repiblik Dominikèn' },
  { value: 'BS', label: '🇧🇸 Bahamas' },
  { value: 'JM', label: '🇯🇲 Jamayik' },
  { value: 'BR', label: '🇧🇷 Brezil' },
  { value: 'OTHER', label: 'Lòt peyi' },
];

const MEDICAL_CONDITIONS: { value: string; label: string; icon?: React.ReactNode }[] = [
  { value: 'diabetes_type_1', label: 'Dyabèt Tip 1', icon: '💉' },
  { value: 'diabetes_type_2', label: 'Dyabèt Tip 2', icon: '🩸' },
  { value: 'hypertension', label: 'Tansyon wo', icon: '❤️' },
  { value: 'hypotension', label: 'Tansyon ba', icon: '💙' },
  { value: 'asthma', label: 'Opresyon', icon: '🫁' },
  { value: 'arthritis', label: 'Atrit', icon: '🦴' },
  { value: 'cholesterol', label: 'Kolestewòl wo', icon: '🧈' },
  { value: 'anemia', label: 'Anemi', icon: '🩹' },
  { value: 'thyroid', label: 'Pwoblèm tirowid', icon: '🦋' },
  { value: 'kidney', label: 'Pwoblèm ren', icon: '🫘' },
  { value: 'liver', label: 'Pwoblèm fwa', icon: '🍃' },
  { value: 'gastric', label: 'Pwoblèm dijesyon', icon: '🌿' },
  { value: 'migraine', label: 'Migrèn', icon: '🌀' },
  { value: 'depression', label: 'Depresyon', icon: '🌙' },
  { value: 'anxiety', label: 'Anksyete', icon: '🍂' },
  { value: 'insomnia', label: 'Pwoblèm somèy', icon: '😴' },
];

export default function SettingsForm({
  profile: initialProfile,
  preferences: initialPrefs,
  medical: initialMedical,
  subscription,
  pastSubscriptions,
  payments,
}: Props) {
  const [profile, setProfile] = React.useState(initialProfile);
  const [prefs, setPrefs] = React.useState(initialPrefs);
  const [medical, setMedical] = React.useState(initialMedical);

  React.useEffect(() => setProfile(initialProfile), [initialProfile]);
  React.useEffect(() => setPrefs(initialPrefs), [initialPrefs]);
  React.useEffect(() => setMedical(initialMedical), [initialMedical]);

  function commitPref<K extends keyof PrefRow>(key: K) {
    return async (value: PrefRow[K]) => {
      const res = await updatePreference(key, value as never);
      if (res.ok) setPrefs(res.preferences);
      // When the member changes their UI language, drive the Google
      // Translate cookie the TranslateSwitcher already reads on mount and
      // hard-reload the tab so Google boots against the fresh HTML rather
      // than mutating a hydrated React tree. Same pattern the switcher
      // uses in components/translate-switcher.tsx — kept in sync here.
      if (res.ok && key === 'language') {
        const target = value as 'ht' | 'fr' | 'en';
        writeLangCookie(target);
        // Small timeout so the settings-controls "saved" pulse can render
        // before the page vanishes.
        window.setTimeout(() => window.location.reload(), 250);
      }
      return res;
    };
  }

  function commitProfile<K extends keyof ProfileRow>(key: K) {
    return async (value: ProfileRow[K]) => {
      const res = await updateProfileField(key, value as never);
      // Use the canonical row from the server so normalizations (trimmed
      // strings, cleaned phone numbers, auto-synced full_name) reach the UI.
      if (res.ok) setProfile(res.profile);
      return res;
    };
  }

  // Avatar wrappers — relay the server's canonical profile back to parent
  // state so other components on this page (sidebar avatar, etc.) update too.
  async function handleUploadAvatar(formData: FormData) {
    const res = await uploadAvatar(formData);
    if (res.ok) setProfile(res.profile);
    return res;
  }

  async function handleRemoveAvatar() {
    const res = await removeAvatar();
    if (res.ok) setProfile(res.profile);
    return res;
  }

  function commitMedical<K extends keyof MedicalRow>(key: K) {
    return async (value: MedicalRow[K]) => {
      const res = await updateMedicalInfo(key, value as never);
      if (res.ok) setMedical(res.medical);
      return res;
    };
  }

  const initials =
    `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}` ||
    profile.email?.[0] ||
    'M';

  return (
    <div className="grid gap-5 md:gap-6">
      {/* ── Plan & Abònman ─────────────────────────────────────────────────── */}
      <PlanCard
        currentPlan={profile.plan}
        subscription={subscription}
        pastSubscriptions={pastSubscriptions}
      />

      {/* ── Istwa Pèman & Resi ─────────────────────────────────────────────── */}
      <PaymentHistoryPanel payments={payments} />

      {/* ── Pwofil ─────────────────────────────────────────────────────────── */}
      <SettingsSection
        title="Pwofil"
        description="Foto ak enfòmasyon pèsonèl ki parèt sou kont ou."
      >
        <AvatarUpload
          label="Foto pwofil"
          description="Yon foto pwòp ede manm yo rekonèt ou nan kominote a."
          currentUrl={profile.avatar_url}
          fallbackInitials={initials}
          uploadAction={handleUploadAvatar}
          removeAction={handleRemoveAvatar}
        />
        <TextSetting
          label="Prenon"
          description="Ki jan zanmi w ak fanmi w rele w."
          value={profile.first_name ?? ''}
          placeholder="Jean"
          commit={commitProfile('first_name')}
        />
        <TextSetting
          label="Non"
          description="Non fanmi ou."
          value={profile.last_name ?? ''}
          placeholder="Baptiste"
          commit={commitProfile('last_name')}
        />
        <DateSetting
          label="Dat nesans"
          description="Sa pèmèt nou kalibre konsèy yo selon laj ou."
          value={profile.date_of_birth}
          commit={commitProfile('date_of_birth')}
        />
        <SelectSetting
          label="Sèks"
          description="Yon resous pou enfòmasyon sou sante ak konsèy medikal."
          value={profile.gender as 'male' | 'female' | 'other' | 'prefer_not_to_say' | null}
          placeholder="Pa di"
          options={[
            { value: 'male', label: 'Gason' },
            { value: 'female', label: 'Fi' },
            { value: 'other', label: 'Lòt' },
            { value: 'prefer_not_to_say', label: 'Pa vle di' },
          ]}
          commit={commitProfile('gender')}
        />
        <TextSetting
          label="Telefòn"
          description="Pou resevwa rapèl pa SMS ak mande konsiltasyon ijans. (opsyonèl)."
          value={profile.phone ?? ''}
          placeholder="+1 954 569 0705"
          commit={commitProfile('phone')}
        />
        <TextareaSetting
          label="Sou ou (bio)"
          description="Ekri yon ti deskripsyon kout sou ou. Se sa lòt manm yo ap wè sou pwofil ou."
          value={profile.bio}
          placeholder="Prezante tèt ou an kèk mo..."
          rows={3}
          commit={commitProfile('bio')}
        />

        <div className="pt-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-sm font-semibold text-ink">Email</div>
              <div className="text-xs text-earth-600 mt-0.5">
                Pou chanje email, kontakte Ekip Teknik la.
              </div>
            </div>
            <span className="text-sm text-earth-700 bg-cream-100 px-3 py-1.5 rounded-lg border border-cream-200 font-mono">
              {profile.email}
            </span>
          </div>
        </div>
      </SettingsSection>

      {/* ── Adrès & Kontak Ijans ───────────────────────────────────────────── */}
      <SettingsSection
        title="Adrès & Kontak Ijans"
        description="Itil pou livrezon kòmand MedikaplantShop ak pou ijans ki gen rapò ak konsiltasyon medikal."
      >
        <TextSetting
          label="Adrès liy 1"
          description="Nimewo + rue, oswa lokalite."
          value={profile.address_line1 ?? ''}
          placeholder="Ri Lalue #123"
          commit={commitProfile('address_line1')}
        />
        <TextSetting
          label="Adrès liy 2"
          description="Apatman, etaj, oswa lòt detay (opsyonèl)."
          value={profile.address_line2 ?? ''}
          placeholder="Apt 3B"
          commit={commitProfile('address_line2')}
        />
        <TextSetting
          label="Vil"
          value={profile.city ?? ''}
          placeholder="Pòtoprens"
          commit={commitProfile('city')}
        />
        <TextSetting
          label="Depatman / Eta"
          value={profile.region ?? ''}
          placeholder="Lwès"
          commit={commitProfile('region')}
        />
        <TextSetting
          label="Kòd postal"
          value={profile.postal_code ?? ''}
          placeholder="HT-6110"
          commit={commitProfile('postal_code')}
        />
        <SelectSetting
          label="Peyi"
          value={profile.country}
          options={COUNTRIES}
          commit={commitProfile('country')}
        />
        <TextSetting
          label="Non kontak ijans"
          description="Yon moun nou ka rele si yon bagay an ijans si tout fwa nou pata jwenn ou."
          value={profile.emergency_contact_name ?? ''}
          placeholder="Marie Jean"
          commit={commitProfile('emergency_contact_name')}
        />
        <TextSetting
          label="Telefòn kontak ijans lan"
          value={profile.emergency_contact_phone ?? ''}
          placeholder="+509 38 12 34 56"
          commit={commitProfile('emergency_contact_phone')}
        />
      </SettingsSection>

      {/* ── Sante (Medical info) ───────────────────────────────────────────── */}
      <SettingsSection
        title="Enfòmasyon Sante"
        description="Detay medikal ou yo rete prive epi yo pwoteje. Se sèlman ou menm ak administratè HOÏS yo ki gen otorizasyon pou wè yo."
      >
        <NumberSetting
          label="Wotè (cm)"
          description="Itil pou kalkile IMC ou epi adapte rekòmandasyon yo ak pwofil ou..."
          value={medical.height_cm}
          min={50}
          max={250}
          step={0.5}
          unit="cm"
          commit={commitMedical('height_cm')}
        />
        <SelectSetting
          label="Tip san"
          description="Itil pou ka ijans medikal."
          value={medical.blood_type as 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown' | null}
          placeholder="Pa konnen"
          options={[
            { value: 'A+', label: 'A+' },
            { value: 'A-', label: 'A−' },
            { value: 'B+', label: 'B+' },
            { value: 'B-', label: 'B−' },
            { value: 'AB+', label: 'AB+' },
            { value: 'AB-', label: 'AB−' },
            { value: 'O+', label: 'O+' },
            { value: 'O-', label: 'O−' },
            { value: 'unknown', label: 'Pa konnen' },
          ]}
          commit={commitMedical('blood_type')}
        />
        <MultiSelectSetting
          label="Kondisyon medikal aktyèl"
          description="Chwazi kondisyon ki konsène w yo. Si yon kondisyon pa konsène w ankò oswa li rezoud, jis dekoche li..."
          value={medical.conditions}
          options={MEDICAL_CONDITIONS}
          allowCustom
          commit={commitMedical('conditions')}
        />
        <SelectSetting
          label="Objektif sante prensipal"
          description="Enfòmasyon sa yo ede HOÏS adapte rekòmandasyon li yo ak bezwen ou."
          value={medical.health_goal as
            | 'manage_diabetes'
            | 'manage_hypertension'
            | 'lose_weight'
            | 'gain_weight'
            | 'spiritual_balance'
            | 'general_wellness'
            | 'detox'
            | 'fertility'
            | 'other'
            | null}
          placeholder="Chwazi yon objektif"
          options={[
            { value: 'manage_diabetes', label: 'Jere dyabèt' },
            { value: 'manage_hypertension', label: 'Jere tansyon' },
            { value: 'lose_weight', label: 'Pèdi pwa' },
            { value: 'gain_weight', label: 'Pran pwa' },
            { value: 'spiritual_balance', label: 'Ekilib espirityèl' },
            { value: 'detox', label: 'Detox / netwayaj' },
            { value: 'general_wellness', label: 'Byennèt jeneral' },
            { value: 'fertility', label: 'Fètilite' },
            { value: 'other', label: 'Lòt' },
          ]}
          commit={commitMedical('health_goal')}
        />
        {medical.health_goal === 'other' && (
          <TextareaSetting
            label="Esplike objektif ou (Lòt)"
            description="Dekri, nan pwòp mo pa w, objektif ou ak sa w vle reyalize. Sa ede konsiltan HOÏS yo pi byen konprann bezwen ou epi ba w konsèy ki pi byen adapte ak sitiyasyon ou."
            value={medical.health_goal_other}
            placeholder="Egz: amelyore enèji m apre yon maladi, prepare yon konpetisyon spòtif…"
            rows={3}
            commit={commitMedical('health_goal_other')}
          />
        )}
        <TextareaSetting
          label="Alèji"
          description="Endike plant, manje, oswa medikaman ki ba w alèji. Enfòmasyon sa a enpòtan pou ede nou evite rekòmandasyon ki pa apwopriye, sitou anvan nenpòt pwotokòl tizan."
          value={medical.allergies}
          placeholder="Egz: nwa, krevèt, penisilin…"
          rows={2}
          commit={commitMedical('allergies')}
        />
        <TextareaSetting
          label="Medikaman w ap pran"
          description="Lis tout medikaman w ap pran kounye a. Sa ede nou evite entèraksyon ant medikaman ak remèd natirèl lè n ap prepare rekòmandasyon pou ou."
          value={medical.medications}
          placeholder="Egz: Metformin 500mg 2× pa jou, Losartan 50mg 1× pa jou…"
          rows={3}
          commit={commitMedical('medications')}
        />
        <TextareaSetting
          label="Maladi kwonik / istwa medikal"
          description="Endike nenpòt enfòmasyon enpòtan sou istwa sante ou."
          value={medical.chronic_diseases}
          placeholder="Egz: dyabèt depi 2018, opere apandis 2015…"
          rows={3}
          commit={commitMedical('chronic_diseases')}
        />
        <TextareaSetting
          label="Operasyon pase yo"
          value={medical.past_surgeries}
          placeholder="Egz: apandektomi 2015, sezaryèn 2019…"
          rows={2}
          commit={commitMedical('past_surgeries')}
        />
        <TextSetting
          label="Non doktè w"
          value={medical.doctor_name ?? ''}
          placeholder="Dr. Pierre"
          commit={commitMedical('doctor_name')}
        />
        <TextSetting
          label="Telefòn doktè w"
          value={medical.doctor_phone ?? ''}
          placeholder="+509 38 12 34 56"
          commit={commitMedical('doctor_phone')}
        />
        <TextSetting
          label="Famasi prefere"
          value={medical.preferred_pharmacy ?? ''}
          placeholder="Egz: Famasi Lourdes, Florida"
          commit={commitMedical('preferred_pharmacy')}
        />
        <TextareaSetting
          label="Lòt nòt medikal"
          description="Tout lòt detay ou panse nou dwe konnen."
          value={medical.notes}
          placeholder="Egz: vegetaryen depi 5 lane, fanm ki ansent…"
          rows={3}
          commit={commitMedical('notes')}
        />
      </SettingsSection>

      {/* ── Sib Sante (preferences) ────────────────────────────────────────── */}
      <SettingsSection
        title="Sib Sante"
        description="Objektif pèsonèl ki gide tablodebò ak badj yo."
      >
        <RangeSetting
          label="Sib sik nan san (mg/dL)"
          description="Limit yo konsidere kòm nòmal pou ou."
          minValue={prefs.target_blood_sugar_min}
          maxValue={prefs.target_blood_sugar_max}
          bounds={{ min: 50, max: 300 }}
          unit=" mg/dL"
          commitMin={commitPref('target_blood_sugar_min')}
          commitMax={commitPref('target_blood_sugar_max')}
        />
        <NumberSetting
          label="objektif pwa (kg)"
          description="Antre pwa ou vle rive a. Si w pa gen yon objektif pou kounye a, ou ka kite chan sa a vid."
          value={prefs.target_weight_kg}
          min={30}
          max={250}
          step={0.1}
          unit="kg"
          commit={commitPref('target_weight_kg')}
        />
        <SliderSetting
          label="lit Dlo pa jou"
          description="Konbyen lit ou angaje pou bwè pa jou?."
          value={prefs.daily_water_liters}
          min={0.5}
          max={6}
          step={0.1}
          unit=" L"
          commit={commitPref('daily_water_liters')}
        />
        <RadioSetting
          label="Inite pwa"
          value={prefs.weight_unit as 'kg' | 'lb'}
          options={[
            { value: 'kg', label: 'kg' },
            { value: 'lb', label: 'lb' },
          ]}
          commit={commitPref('weight_unit')}
        />
      </SettingsSection>

      {/* ── Aparans ────────────────────────────────────────────────────────── */}
      <SettingsSection
        title="Aparans"
        description="Ajiste aparans tablodbò ou a selon preferans ou. Tout chanjman yo pran efè imedyatman."
      >
        <SwatchSetting
          label="Aksan koulè"
          value={prefs.accent}
          options={[
            { value: 'forest', label: 'Vèt fèy', color: '#547216', accent: '#93b031' },
            { value: 'gold', label: 'Lò Hoïs', color: '#e78e17', accent: '#eeac41' },
            { value: 'both', label: 'Melanje', color: '#547216', accent: '#e78e17' },
          ]}
          commit={commitPref('accent')}
        />
        <RadioSetting
          label="Densite"
          value={prefs.density as 'compact' | 'regular' | 'comfy'}
          options={[
            { value: 'compact', label: 'Konpak' },
            { value: 'regular', label: 'Regilye' },
            { value: 'comfy', label: 'Lajè' },
          ]}
          commit={commitPref('density')}
        />
        <RadioSetting
          label="Stil kwen kat yo"
          value={prefs.card_radius as 'square' | 'rounded' | 'pill'}
          options={[
            { value: 'square', label: 'Kare' },
            { value: 'rounded', label: 'Awondi' },
            { value: 'pill', label: 'Pil' },
          ]}
          commit={commitPref('card_radius')}
        />
        <SliderSetting
          label="Gwosè tèks"
          value={prefs.font_size}
          min={12}
          max={22}
          unit="px"
          commit={commitPref('font_size')}
        />
        <RadioSetting
          label="Lang"
          value={prefs.language as 'ht' | 'fr' | 'en'}
          options={[
            { value: 'ht', label: 'Kreyòl' },
            { value: 'fr', label: 'Français' },
            { value: 'en', label: 'English' },
          ]}
          commit={commitPref('language')}
        />
        <ToggleSetting
          label="Mòd fonse"
          description="Aktive mòd fonse pou yon ekran ki pi konfòtab pou je w, sitou nan aswè oswa lè limyè a fèb."
          value={prefs.dark_mode}
          commit={commitPref('dark_mode')}
        />
        <ToggleSetting
          label="Kontras wo (aksesiblite)"
          description="Itilize kontou ki pi fonse ak tèks ki gen plis kontrast pou amelyore lizibilite, sitou pou moun ki gen difikilte pou wè.."
          value={prefs.high_contrast}
          commit={commitPref('high_contrast')}
        />
        <ToggleSetting
          label="Diminye animasyon"
          description="Kanpe tout efè vizyèl ki ka bay maltèt oswa distraksyon."
          value={prefs.reduced_motion}
          commit={commitPref('reduced_motion')}
        />
        <ReplayTourButton />
      </SettingsSection>

      {/* ── Notifikasyon ───────────────────────────────────────────────────── */}
      <SettingsSection
        title="Notifikasyon"
        description="Chwazi ki notifikasyon ou vle resevwa. Kounye a, notifikasyon yo disponib dirèkteman nan aplikasyon an. Notifikasyon pa imèl ak sou navigatè a ap disponib byento."
      >
        <ToggleSetting
          label="Notifikasyon nan aplikasyon an"
          description="Mèt switch: kloch la sou tablodebò a. Lè li OFF, ou pap resevwa alèt tretman, konsiltasyon, fowòm, ni repons sipò."
          value={prefs.email_notifications}
          commit={commitPref('email_notifications')}
        />
        <ToggleSetting
          label="Notifikasyon push sou navigatè"
          description="Resevwa yon alèt menm lè tablodebò a fèmen."
          value={prefs.push_notifications}
          commit={commitPref('push_notifications')}
          comingSoon
        />
        <ToggleSetting
          label="Konsèy plant chak jou pa imèl"
          description="Resevwa konsèy chak maten nan bwat imèl ou (7am Ayiti)."
          value={prefs.daily_advice_email}
          commit={commitPref('daily_advice_email')}
        />
        <ToggleSetting
          label="Imèl lè ou debloke yon badj"
          description="Yon notifikasyon imedyat chak fwa ou debloke yon nouvo badj."
          value={prefs.badge_unlock_email}
          commit={commitPref('badge_unlock_email')}
        />
        <ToggleSetting
          label="Rezime ebdomadè pa imèl"
          description="Yon koudèy sou pwogrè ou chak dimanch maten (8am)."
          value={prefs.weekly_summary_email}
          commit={commitPref('weekly_summary_email')}
        />
        <TimeSetting
          label="Èdtan rapèl"
          description="Lè nou voye rapèl pou note mezi yo (tansyon, glikemi, pwa ko w) fini tach yo."
          value={prefs.reminder_time}
          comingSoon
          commit={commitPref('reminder_time')}
        />
      </SettingsSection>

      {/* ── Konfidansyalite ────────────────────────────────────────────────── */}
      <SettingsSection
        title="Konfidansyalite"
        description="Kontwole sa lòt manm kominote Hoïs la ka wè."
      >
        <ToggleSetting
          label="Parèt sou lis VIP piblik"
          description="Plan Melis: non ou parèt sou paj Hoïs VIP nan Medikaplant.org."
          value={prefs.show_in_vip_list}
          commit={commitPref('show_in_vip_list')}
        />
        <ToggleSetting
          label="Pataje pwogrè ak antrenè m"
          description="Si w gen yon konsiltan Hoïs, l ap ka wè sik, pwa, ak tach yo."
          value={prefs.share_progress_with_coach}
          commit={commitPref('share_progress_with_coach')}
        />
        <ToggleSetting
          label="Pèmèt itilizasyon pou rechèch"
          description="Done anonim sèlman, pou ede amelyore pwotokòl Hoïs yo."
          value={prefs.allow_research_use}
          commit={commitPref('allow_research_use')}
        />
      </SettingsSection>

      {/* ── Sekirite ───────────────────────────────────────────────────────── */}
      <PasswordSection currentEmail={profile.email ?? undefined} />

      {/* ── Zòn Danje ──────────────────────────────────────────────────────── */}
      <DangerZonePanel />
    </div>
  );
}

// Replay the welcome tour. Clears tour_completed_at and redirects to
// /dashboard?tour=1 so the auto-launcher fires. Kept in this file
// because it's tightly coupled to the appearance section UI.
function ReplayTourButton() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function onClick() {
    if (pending) return;
    setPending(true);
    try {
      await restartTour();
      router.push('/dashboard?tour=1');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="pt-4 border-t border-cream-200">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-forest-50 hover:bg-forest-100 border border-forest-200 text-forest-800 transition disabled:opacity-60"
      >
        <span className="flex items-center gap-2.5">
          <Compass className="w-4 h-4" strokeWidth={2.2} />
          <span className="text-sm font-semibold">
            {pending ? 'Ap reyajiste…' : 'Refè tou byenveni a'}
          </span>
        </span>
        <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
      </button>
      <p className="text-[11px] text-earth-600 mt-1.5 leading-snug">
       Fè yon vizit gide nan tablodbò a pou dekouvri meni bò a, paramèt yo, fowòm nan, ak tout lòt fonksyon ki disponib.
      </p>
    </div>
  );
}
