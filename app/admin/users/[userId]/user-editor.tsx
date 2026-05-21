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
} from '@/components/dashboard/settings-controls-extra';
import {
  adminUpdateProfileField,
  adminUpdateMedical,
  adminUpdatePreference,
} from '../actions';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type MedicalRow = Database['public']['Tables']['user_medical_info']['Row'];
type PrefRow = Database['public']['Tables']['user_preferences']['Row'];

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

const MEDICAL_CONDITIONS = [
  { value: 'diabetes_type_1', label: 'Dyabèt Tip 1', icon: '💉' },
  { value: 'diabetes_type_2', label: 'Dyabèt Tip 2', icon: '🩸' },
  { value: 'hypertension', label: 'Tansyon wo', icon: '❤️' },
  { value: 'hypotension', label: 'Tansyon ba', icon: '💙' },
  { value: 'asthma', label: 'Opresyon', icon: '🫁' },
  { value: 'arthritis', label: 'Atrit', icon: '🦴' },
  { value: 'cholesterol', label: 'Kolestewòl wo', icon: '🧈' },
  { value: 'anemia', label: 'Anemi', icon: '🩹' },
  { value: 'thyroid', label: 'Tirowid', icon: '🦋' },
  { value: 'kidney', label: 'Pwoblèm ren', icon: '🫘' },
  { value: 'liver', label: 'Pwoblèm fwa', icon: '🍃' },
  { value: 'gastric', label: 'Pwoblèm dijesyon', icon: '🌿' },
  { value: 'migraine', label: 'Migrèn', icon: '🌀' },
  { value: 'depression', label: 'Depresyon', icon: '🌙' },
  { value: 'anxiety', label: 'Anksyete', icon: '🍂' },
  { value: 'insomnia', label: 'Pwoblèm somèy', icon: '😴' },
];

export default function UserEditor({
  userId,
  profile: initialProfile,
  medical: initialMedical,
  preferences: initialPrefs,
}: {
  userId: string;
  profile: ProfileRow;
  medical: MedicalRow;
  preferences: PrefRow;
}) {
  const [profile, setProfile] = React.useState(initialProfile);
  const [medical, setMedical] = React.useState(initialMedical);
  const [prefs, setPrefs] = React.useState(initialPrefs);

  React.useEffect(() => setProfile(initialProfile), [initialProfile]);
  React.useEffect(() => setMedical(initialMedical), [initialMedical]);
  React.useEffect(() => setPrefs(initialPrefs), [initialPrefs]);

  function commitProfile<K extends keyof ProfileRow>(key: K) {
    return async (value: ProfileRow[K]) => {
      const res = await adminUpdateProfileField(userId, key, value as never);
      if (res.ok) setProfile(res.profile);
      return res;
    };
  }

  function commitMedical<K extends keyof MedicalRow>(key: K) {
    return async (value: MedicalRow[K]) => {
      const res = await adminUpdateMedical(userId, key, value as never);
      if (res.ok) setMedical(res.medical);
      return res;
    };
  }

  function commitPref<K extends keyof PrefRow>(key: K) {
    return async (value: PrefRow[K]) => {
      const res = await adminUpdatePreference(userId, key, value as never);
      if (res.ok) setPrefs(res.preferences);
      return res;
    };
  }

  return (
    <div className="grid gap-5 md:gap-6">
      {/* ── Pwofil ─────────────────────────────────────────────────────────── */}
      <SettingsSection
        title="Pwofil"
        description="Enfòmasyon pèsonèl pasyan an. Chanjman yo aplike imedyatman."
      >
        <TextSetting
          label="Prenon"
          value={profile.first_name ?? ''}
          placeholder="Jean"
          commit={commitProfile('first_name')}
        />
        <TextSetting
          label="Non"
          value={profile.last_name ?? ''}
          placeholder="Baptiste"
          commit={commitProfile('last_name')}
        />
        <DateSetting
          label="Dat nesans"
          value={profile.date_of_birth}
          commit={commitProfile('date_of_birth')}
        />
        <SelectSetting
          label="Sèks"
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
          value={profile.phone ?? ''}
          placeholder="+509 38 12 34 56"
          commit={commitProfile('phone')}
        />
        <TextareaSetting
          label="Bio"
          value={profile.bio}
          rows={3}
          commit={commitProfile('bio')}
        />

        <div className="pt-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-sm font-semibold text-ink">Email</div>
              <div className="text-xs text-earth-600 mt-0.5">
                Pou chanje, ale nan paramèt Supabase Auth.
              </div>
            </div>
            <span className="text-sm text-earth-700 bg-cream-100 px-3 py-1.5 rounded-lg border border-cream-200 font-mono">
              {profile.email}
            </span>
          </div>
        </div>
      </SettingsSection>

      {/* ── Adrès ──────────────────────────────────────────────────────────── */}
      <SettingsSection title="Adrès & Kontak Ijans">
        <TextSetting
          label="Adrès liy 1"
          value={profile.address_line1 ?? ''}
          placeholder="Ri Lalue #123"
          commit={commitProfile('address_line1')}
        />
        <TextSetting
          label="Adrès liy 2"
          value={profile.address_line2 ?? ''}
          commit={commitProfile('address_line2')}
        />
        <TextSetting
          label="Vil"
          value={profile.city ?? ''}
          commit={commitProfile('city')}
        />
        <TextSetting
          label="Depatman / Eta"
          value={profile.region ?? ''}
          commit={commitProfile('region')}
        />
        <TextSetting
          label="Kòd postal"
          value={profile.postal_code ?? ''}
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
          value={profile.emergency_contact_name ?? ''}
          commit={commitProfile('emergency_contact_name')}
        />
        <TextSetting
          label="Telefòn kontak ijans"
          value={profile.emergency_contact_phone ?? ''}
          commit={commitProfile('emergency_contact_phone')}
        />
      </SettingsSection>

      {/* ── Enfòmasyon Sante ───────────────────────────────────────────────── */}
      <SettingsSection
        title="Enfòmasyon Sante"
        description="Detay medikal pasyan an. Admin gen aksè konplè pou ka klinik."
      >
        <NumberSetting
          label="Wotè (cm)"
          value={medical.height_cm}
          min={50}
          max={250}
          step={0.5}
          unit="cm"
          commit={commitMedical('height_cm')}
        />
        <SelectSetting
          label="Tip san"
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
          description="Chwazi tout ki konsène pasyan an."
          value={medical.conditions}
          options={MEDICAL_CONDITIONS}
          allowCustom
          commit={commitMedical('conditions')}
        />
        <SelectSetting
          label="Objektif sante prensipal"
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
          placeholder="Chwazi"
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
            label="Esplike objektif (Lòt)"
            value={medical.health_goal_other}
            rows={3}
            commit={commitMedical('health_goal_other')}
          />
        )}
        <TextareaSetting
          label="Alèji"
          value={medical.allergies}
          rows={2}
          commit={commitMedical('allergies')}
        />
        <TextareaSetting
          label="Medikaman aktyèl"
          value={medical.medications}
          rows={3}
          commit={commitMedical('medications')}
        />
        <TextareaSetting
          label="Maladi kwonik"
          value={medical.chronic_diseases}
          rows={3}
          commit={commitMedical('chronic_diseases')}
        />
        <TextareaSetting
          label="Operasyon pase yo"
          value={medical.past_surgeries}
          rows={2}
          commit={commitMedical('past_surgeries')}
        />
        <TextSetting
          label="Non doktè"
          value={medical.doctor_name ?? ''}
          commit={commitMedical('doctor_name')}
        />
        <TextSetting
          label="Telefòn doktè"
          value={medical.doctor_phone ?? ''}
          commit={commitMedical('doctor_phone')}
        />
        <TextSetting
          label="Famasi prefere"
          value={medical.preferred_pharmacy ?? ''}
          commit={commitMedical('preferred_pharmacy')}
        />
        <TextareaSetting
          label="Lòt nòt klinik"
          value={medical.notes}
          rows={3}
          commit={commitMedical('notes')}
        />
      </SettingsSection>

      {/* ── Sib Sante ──────────────────────────────────────────────────────── */}
      <SettingsSection
        title="Sib Sante"
        description="Zòn sib ki gide graf ak chip yo sou paj Swivi Sante pasyan an."
      >
        <RangeSetting
          label="Sib sik nan san (mg/dL)"
          minValue={prefs.target_blood_sugar_min}
          maxValue={prefs.target_blood_sugar_max}
          bounds={{ min: 50, max: 300 }}
          unit=" mg/dL"
          commitMin={commitPref('target_blood_sugar_min')}
          commitMax={commitPref('target_blood_sugar_max')}
        />
        <NumberSetting
          label="Sib pwa (kg)"
          value={prefs.target_weight_kg}
          min={30}
          max={250}
          step={0.1}
          unit="kg"
          commit={commitPref('target_weight_kg')}
        />
        <SliderSetting
          label="Dlo pa jou"
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
      <SettingsSection title="Aparans">
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
          value={prefs.dark_mode}
          commit={commitPref('dark_mode')}
        />
      </SettingsSection>

      {/* ── Notifikasyon ───────────────────────────────────────────────────── */}
      <SettingsSection title="Preferans Notifikasyon">
        <ToggleSetting
          label="Email aktive"
          value={prefs.email_notifications}
          commit={commitPref('email_notifications')}
        />
        <ToggleSetting
          label="Push"
          value={prefs.push_notifications}
          commit={commitPref('push_notifications')}
        />
        <ToggleSetting
          label="Konsèy jou a"
          value={prefs.daily_advice_email}
          commit={commitPref('daily_advice_email')}
        />
        <ToggleSetting
          label="Badj"
          value={prefs.badge_unlock_email}
          commit={commitPref('badge_unlock_email')}
        />
        <ToggleSetting
          label="Rezime semèn"
          value={prefs.weekly_summary_email}
          commit={commitPref('weekly_summary_email')}
        />
        <TimeSetting
          label="Èdtan rapèl"
          value={prefs.reminder_time}
          commit={commitPref('reminder_time')}
        />
      </SettingsSection>

      {/* ── Konfidansyalite ────────────────────────────────────────────────── */}
      <SettingsSection title="Konfidansyalite">
        <ToggleSetting
          label="Parèt sou lis VIP piblik"
          value={prefs.show_in_vip_list}
          commit={commitPref('show_in_vip_list')}
        />
        <ToggleSetting
          label="Pataje pwogrè ak antrenè"
          value={prefs.share_progress_with_coach}
          commit={commitPref('share_progress_with_coach')}
        />
        <ToggleSetting
          label="Pèmèt itilizasyon pou rechèch"
          value={prefs.allow_research_use}
          commit={commitPref('allow_research_use')}
        />
      </SettingsSection>
    </div>
  );
}
