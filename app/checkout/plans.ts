import type { Plan } from '@/types/database';

export type PlanDetails = {
  key: Plan;
  name: string;
  tagline: string;
  price: number;
  period: string;
  durationMonths: number;
  features: string[];
};

export const PLANS: Record<Plan, PlanDetails> = {
  basic: {
    key: 'basic',
    name: 'Hoïs Bazilik',
    tagline: 'Pòt antre nan inivè VIP la',
    price: 350,
    period: '1 Ane',
    durationMonths: 12,
    features: [
      'Dokiman ak echantiyon pwodui gratis',
      'Aksè privilejye nan aktivite Hoïs & Medikaplant',
      'Rabè sou MedikaplantShop',
      'Rabè sou sèvis ak kou Hoïs Inivèsite ofri yo',
      'Salon, prezantasyon, fòmasyon gratis sou gwoup Hoïs VIP a',
      'Konsèy, kèk sipò sipirityèl ak medsin Tradisyonèl ayisyen',
    ],
  },
  premium: {
    key: 'premium',
    name: 'Hoïs Sitwonèl',
    tagline: 'Plan ki pi popilè',
    price: 600,
    period: '2 Ane',
    durationMonths: 24,
    features: [
      'Tout sa ki nan Hoïs Bazilik',
      'Aksè davans pou li kèk pòs anvan li piblik',
      'Motivasyon ak gidans espirityèl',
    ],
  },
  vip: {
    key: 'vip',
    name: 'Hoïs Melis',
    tagline: 'Eksperyans VIP ki pi konplè',
    price: 800,
    period: '3 Ane',
    durationMonths: 36,
    features: [
      'Tout kontni ki nan plan presedan yo',
      'Konsiltasyon patikilye nan yon ka maladi mistik',
      'Sansibilizasyon pou itilize remèd fèy',
      'Non w pibliye nan paj Hoïs VIP sou Medikaplant.org',
      'Mayo gratis Hoïs & Medikaplant ak lòt sipriz',
      'Yon konvèsasyon konfidansyèl 21 minit ak Vye Ewòl',
      'Limyè eksklizif (Primè) sou gwo fenomèn mondyal',
    ],
  },
};

export function isValidPlan(value: string | null | undefined): value is Plan {
  return value === 'basic' || value === 'premium' || value === 'vip';
}
