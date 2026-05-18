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
import { updatePreference, updateProfile } from './actions';
import type { Database } from '@/types/database';

type PrefRow = Database['public']['Tables']['user_preferences']['Row'];

type Props = {
  preferences: PrefRow;
  profile: {
    full_name: string | null;
    email: string;
    plan: 'basic' | 'premium' | 'vip';
  };
};

const PLAN_LABELS: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

export default function SettingsForm({ preferences, profile }: Props) {
  // Local mirror lets us reflect server responses immediately without a route
  // round-trip. Each setter wraps the server action and updates state on success.
  const [prefs, setPrefs] = React.useState(preferences);

  React.useEffect(() => setPrefs(preferences), [preferences]);

  function commit<K extends keyof PrefRow>(key: K) {
    return async (value: PrefRow[K]) => {
      const res = await updatePreference(key, value as never);
      if (res.ok) setPrefs(res.preferences);
      return res;
    };
  }

  const commitFullName = async (full_name: string) => {
    const res = await updateProfile({ full_name });
    return res;
  };

  return (
    <div className="grid gap-5 md:gap-6">
      {/* ── Pwofil ─────────────────────────────────────────────────────────── */}
      <SettingsSection
        title="Pwofil"
        description="Enfòmasyon ki parèt sou kont ou ak pou lòt manm yo."
      >
        <TextSetting
          label="Non konplè"
          description="Sa ki parèt nan tablodebò ak komantè ou yo."
          value={profile.full_name ?? ''}
          placeholder="Jean Baptiste"
          commit={commitFullName}
        />
        <div className="pt-5">
          <div className="flex items-center justify-between gap-3">
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
        <div className="pt-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-ink">Plan aktif</div>
              <div className="text-xs text-earth-600 mt-0.5">
                Pou chanje plan, ale sou paj pri yo.
              </div>
            </div>
            <span className="text-sm font-semibold text-forest-800 bg-forest-100 px-3 py-1.5 rounded-lg">
              {PLAN_LABELS[profile.plan]}
            </span>
          </div>
        </div>
      </SettingsSection>

      {/* ── Aparans ────────────────────────────────────────────────────────── */}
      <SettingsSection
        title="Aparans"
        description="Pèsonalize fason dashboard la parèt pou ou."
      >
        <SwatchSetting
          label="Aksan koulè"
          description="Koulè prensipal pou bouton ak detay yo nan tablodebò a."
          value={prefs.accent}
          options={[
            { value: 'forest', label: 'Vèt fèy', color: '#3f7522', accent: '#7aaf52' },
            { value: 'gold', label: 'Lò Hoïs', color: '#c9a227', accent: '#e0c155' },
            { value: 'both', label: 'Melanje', color: '#3f7522', accent: '#c9a227' },
          ]}
          commit={commit('accent')}
        />
        <RadioSetting
          label="Densite"
          description="Konbyen espas ant eleman yo."
          value={prefs.density as 'compact' | 'regular' | 'comfy'}
          options={[
            { value: 'compact', label: 'Konpak' },
            { value: 'regular', label: 'Regilye' },
            { value: 'comfy', label: 'Lajè' },
          ]}
          commit={commit('density')}
        />
        <SliderSetting
          label="Gwosè tèks"
          description="Sa afekte gwosè polis sou tablodebò a."
          value={prefs.font_size}
          min={12}
          max={22}
          unit="px"
          commit={commit('font_size')}
        />
        <RadioSetting
          label="Lang"
          description="Lang prefere pou kontni ak konsèy yo."
          value={prefs.language as 'ht' | 'fr' | 'en'}
          options={[
            { value: 'ht', label: 'Kreyòl' },
            { value: 'fr', label: 'Français' },
            { value: 'en', label: 'English' },
          ]}
          commit={commit('language')}
        />
        <ToggleSetting
          label="Mòd fonse"
          description="Itilize palèt fonse pou aswè / je ki sansib."
          value={prefs.dark_mode}
          commit={commit('dark_mode')}
        />
      </SettingsSection>

      {/* ── Notifikasyon ───────────────────────────────────────────────────── */}
      <SettingsSection
        title="Notifikasyon"
        description="Chwazi kilè ak ki jan w vle resevwa nouvèl Hoïs."
      >
        <ToggleSetting
          label="Email aktive"
          description="Pèmèt MedikaPlant voye w email."
          value={prefs.email_notifications}
          commit={commit('email_notifications')}
        />
        <ToggleSetting
          label="Notifikasyon push"
          description="Sou navigatè (lè w ouvri tablodebò a)."
          value={prefs.push_notifications}
          commit={commit('push_notifications')}
        />
        <ToggleSetting
          label="Konsèy jou a pa email"
          description="Resevwa konsèy plant la chak maten."
          value={prefs.daily_advice_email}
          commit={commit('daily_advice_email')}
        />
        <ToggleSetting
          label="Email lè ou debloke yon badj"
          description="Yon ti mesaj selebrasyon."
          value={prefs.badge_unlock_email}
          commit={commit('badge_unlock_email')}
        />
        <ToggleSetting
          label="Rezime semèn pa email"
          description="Yon koudèy sou pwogrè ou chak dimanch maten."
          value={prefs.weekly_summary_email}
          commit={commit('weekly_summary_email')}
        />
        <TimeSetting
          label="Èdtan rapèl"
          description="Lè nou voye rapèl pou note glikemi ak fini tach yo."
          value={prefs.reminder_time}
          commit={commit('reminder_time')}
        />
      </SettingsSection>

      {/* ── Sib Sante ──────────────────────────────────────────────────────── */}
      <SettingsSection
        title="Sib Sante"
        description="Objektif pèsonèl ki gide tablodebò ak badj yo."
      >
        <RangeSetting
          label="Sib sik nan san (mg/dL)"
          description="Zòn ki konsidere an sante pou ou. Badj 'Mèt Glikemi' konte lojik andedan zòn sa a."
          minValue={prefs.target_blood_sugar_min}
          maxValue={prefs.target_blood_sugar_max}
          bounds={{ min: 50, max: 300 }}
          unit=" mg/dL"
          commitMin={commit('target_blood_sugar_min')}
          commitMax={commit('target_blood_sugar_max')}
        />
        <NumberSetting
          label="Sib pwa (kg)"
          description="Pwa ou ap travay pou rive li. Kite vid si w pa gen yon sib."
          value={prefs.target_weight_kg}
          min={30}
          max={250}
          step={0.1}
          unit="kg"
          commit={commit('target_weight_kg')}
        />
        <SliderSetting
          label="Dlo pa jou"
          description="Konbyen lit ou angaje pou bwè. Badj 'Idratasyon' konte jou w rive ladan."
          value={prefs.daily_water_liters}
          min={0.5}
          max={6}
          step={0.1}
          unit=" L"
          commit={commit('daily_water_liters')}
        />
        <RadioSetting
          label="Inite pwa"
          description="Kilogram (metrik) oswa Liv (Etazini)."
          value={prefs.weight_unit as 'kg' | 'lb'}
          options={[
            { value: 'kg', label: 'kg' },
            { value: 'lb', label: 'lb' },
          ]}
          commit={commit('weight_unit')}
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
          commit={commit('show_in_vip_list')}
        />
        <ToggleSetting
          label="Pataje pwogrè ak antrenè m"
          description="Si w gen yon konsiltan Hoïs, l ap ka wè sik, pwa, ak tach yo."
          value={prefs.share_progress_with_coach}
          commit={commit('share_progress_with_coach')}
        />
        <ToggleSetting
          label="Pèmèt itilizasyon pou rechèch"
          description="Done anonim sèlman, pou ede amelyore pwogram Hoïs yo."
          value={prefs.allow_research_use}
          commit={commit('allow_research_use')}
        />
      </SettingsSection>
    </div>
  );
}
