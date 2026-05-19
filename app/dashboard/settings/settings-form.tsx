'use client';

import React from 'react';
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
import {
  updatePreference,
  updateProfileField,
  uploadAvatar,
  removeAvatar,
  updateMedicalInfo,
} from './actions';
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
      return res;
    };
  }

  function commitProfile<K extends keyof ProfileRow>(key: K) {
    return async (value: ProfileRow[K]) => {
      const res = await updateProfileField(key, value as never);
      if (res.ok) setProfile((p) => ({ ...p, [key]: value } as ProfileRow));
      return res;
    };
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
          uploadAction={uploadAvatar}
          removeAction={removeAvatar}
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
          description="Itil pou konsèy medikal san jenerasyon."
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
          description="Pou rapèl SMS ak konsiltasyon ijans (opsyonèl)."
          value={profile.phone ?? ''}
          placeholder="+509 38 12 34 56"
          commit={commitProfile('phone')}
        />
        <TextareaSetting
          label="Sou ou (bio)"
          description="Yon ti deskripsyon kout — sa lòt manm yo wè."
          value={profile.bio}
          placeholder="Ekri yon ti pawòl sou tèt ou…"
          rows={3}
          commit={commitProfile('bio')}
        />

        <div className="pt-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-sm font-semibold text-ink">Email</div>
              <div className="text-xs text-earth-600 mt-0.5">
                Pou chanje email, kontakte sipò.
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
        description="Pou livrezon pwodwi MedikaplantShop ak ka ijans medikal."
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
          description="Yon moun nou ka rele si yon bagay rive ou."
          value={profile.emergency_contact_name ?? ''}
          placeholder="Marie Jean"
          commit={commitProfile('emergency_contact_name')}
        />
        <TextSetting
          label="Telefòn kontak ijans"
          value={profile.emergency_contact_phone ?? ''}
          placeholder="+509 38 12 34 56"
          commit={commitProfile('emergency_contact_phone')}
        />
      </SettingsSection>

      {/* ── Sante (Medical info) ───────────────────────────────────────────── */}
      <SettingsSection
        title="Enfòmasyon Sante"
        description="Detay medikal w. Yo prive epi RLS pwoteje yo — sèl ou ak admin Hoïs ki ka wè yo."
      >
        <NumberSetting
          label="Wotè (cm)"
          description="Pou kalkile IMC ak rekòmandasyon pèsonalize."
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
          description="Chwazi sa ki konsène w. Si w geri yon kondisyon, jis dekoche l."
          value={medical.conditions}
          options={MEDICAL_CONDITIONS}
          allowCustom
          commit={commitMedical('conditions')}
        />
        <SelectSetting
          label="Objektif sante prensipal"
          description="Sa ki gide rekòmandasyon Hoïs yo pou ou."
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
        <TextareaSetting
          label="Alèji"
          description="Plant, manje, oswa medikaman ou alerjik. Trè enpòtan anvan tizan."
          value={medical.allergies}
          placeholder="Egz: nwa, krevèt, penisilin…"
          rows={2}
          commit={commitMedical('allergies')}
        />
        <TextareaSetting
          label="Medikaman w ap pran"
          description="Lis medikaman aktyèl pou nou evite konfli ak remèd fèy."
          value={medical.medications}
          placeholder="Egz: Metformin 500mg 2× pa jou, Losartan 50mg 1× pa jou…"
          rows={3}
          commit={commitMedical('medications')}
        />
        <TextareaSetting
          label="Maladi kwonik / istwa medikal"
          description="Bagay enpòtan nan istwa sante w."
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
          label="Non doktè trete w"
          value={medical.doctor_name ?? ''}
          placeholder="Dr. Pierre"
          commit={commitMedical('doctor_name')}
        />
        <TextSetting
          label="Telefòn doktè"
          value={medical.doctor_phone ?? ''}
          placeholder="+509 38 12 34 56"
          commit={commitMedical('doctor_phone')}
        />
        <TextSetting
          label="Famasi prefere"
          value={medical.preferred_pharmacy ?? ''}
          placeholder="Egz: Famasi Lourdes, Petyonvil"
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
          description="Zòn ki konsidere an sante pou ou."
          minValue={prefs.target_blood_sugar_min}
          maxValue={prefs.target_blood_sugar_max}
          bounds={{ min: 50, max: 300 }}
          unit=" mg/dL"
          commitMin={commitPref('target_blood_sugar_min')}
          commitMax={commitPref('target_blood_sugar_max')}
        />
        <NumberSetting
          label="Sib pwa (kg)"
          description="Pwa ou ap travay pou rive li. Kite vid si w pa gen yon sib."
          value={prefs.target_weight_kg}
          min={30}
          max={250}
          step={0.1}
          unit="kg"
          commit={commitPref('target_weight_kg')}
        />
        <SliderSetting
          label="Dlo pa jou"
          description="Konbyen lit ou angaje pou bwè."
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
        description="Pèsonalize fason dashboard la parèt pou ou."
      >
        <SwatchSetting
          label="Aksan koulè"
          value={prefs.accent}
          options={[
            { value: 'forest', label: 'Vèt fèy', color: '#3f7522', accent: '#7aaf52' },
            { value: 'gold', label: 'Lò Hoïs', color: '#c9a227', accent: '#e0c155' },
            { value: 'both', label: 'Melanje', color: '#3f7522', accent: '#c9a227' },
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
          description="Itilize palèt fonse pou aswè."
          value={prefs.dark_mode}
          commit={commitPref('dark_mode')}
        />
      </SettingsSection>

      {/* ── Notifikasyon ───────────────────────────────────────────────────── */}
      <SettingsSection
        title="Notifikasyon"
        description="Chwazi kilè ak ki jan w vle resevwa nouvèl Hoïs."
      >
        <ToggleSetting
          label="Email aktive"
          value={prefs.email_notifications}
          commit={commitPref('email_notifications')}
        />
        <ToggleSetting
          label="Notifikasyon push"
          description="Sou navigatè (lè w ouvri tablodebò a)."
          value={prefs.push_notifications}
          commit={commitPref('push_notifications')}
        />
        <ToggleSetting
          label="Konsèy jou a pa email"
          description="Resevwa konsèy plant la chak maten."
          value={prefs.daily_advice_email}
          commit={commitPref('daily_advice_email')}
        />
        <ToggleSetting
          label="Email lè ou debloke yon badj"
          value={prefs.badge_unlock_email}
          commit={commitPref('badge_unlock_email')}
        />
        <ToggleSetting
          label="Rezime semèn pa email"
          description="Yon koudèy sou pwogrè ou chak dimanch maten."
          value={prefs.weekly_summary_email}
          commit={commitPref('weekly_summary_email')}
        />
        <TimeSetting
          label="Èdtan rapèl"
          description="Lè nou voye rapèl pou note glikemi ak fini tach yo."
          value={prefs.reminder_time}
          commit={commitPref('reminder_time')}
        />
      </SettingsSection>

      {/* ── Konfidansyalite ────────────────────────────────────────────────── */}
      <SettingsSection
        title="Konfidansyalite"
        description="Kontwole sa lòt manm ak Hoïs Inivèsite ka wè."
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
          description="Done anonim sèlman, pou ede amelyore pwogram Hoïs yo."
          value={prefs.allow_research_use}
          commit={commitPref('allow_research_use')}
        />
      </SettingsSection>

      {/* ── Sekirite ───────────────────────────────────────────────────────── */}
      <PasswordSection />
    </div>
  );
}
