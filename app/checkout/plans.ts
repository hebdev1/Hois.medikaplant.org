import type { Plan } from '@/types/database';

export type BillingCycle = 'monthly' | 'yearly';

export type PlanDetails = {
  key: Plan;
  name: string;
  tagline: string;
  /** Yearly original price (12× monthly, no discount). */
  priceYearlyOriginal: number;
  /** Yearly discounted price (10% off original). */
  priceYearlyDiscounted: number;
  /** Monthly price = yearly_original / 12. */
  priceMonthly: number;
  /** Discount percentage applied to the yearly tier. */
  discountPercentage: number;
  /** Yearly duration in months (= 12). */
  yearlyDurationMonths: number;
  /** Monthly duration in months (= 1). */
  monthlyDurationMonths: number;
  features: string[];
  /** Optional Stripe price IDs — set in the DB when Stripe is wired. */
  stripePriceIdMonthly?: string | null;
  stripePriceIdYearly?: string | null;
};

/**
 * Pricing catalog mirrors the `subscription_plans` table seeded in
 * migration 037. Keep this in sync if you change the DB — and remember
 * the canonical source of truth for the price the user actually pays
 * is the `public.get_plan_price` Postgres function called from the
 * checkout edge function.
 */
export const PLANS: Record<Plan, PlanDetails> = {
  basic: {
    key: 'basic',
    name: 'Hoïs Bazilik',
    tagline: 'Pòt antre nan inivè VIP la',
    priceYearlyOriginal: 135,
    priceYearlyDiscounted: 121.5,
    priceMonthly: 11.25,
    discountPercentage: 10,
    yearlyDurationMonths: 12,
    monthlyDurationMonths: 1,
    features: [
      'Dokiman ak echantiyon pwodui gratis',
      'Aksè privilejye nan aktivite Hoïs',
      'Rabè sou MedikaplantShop',
      'Rabè sou sèvis ak kou Hoïs Inivèsite',
      'Konsèy ak sipò sipirityèl tradisyonèl',
    ],
  },
  premium: {
    key: 'premium',
    name: 'Hoïs Sitwonèl',
    tagline: 'Plan ki pi popilè',
    priceYearlyOriginal: 175,
    priceYearlyDiscounted: 157.5,
    priceMonthly: 14.58,
    discountPercentage: 10,
    yearlyDurationMonths: 12,
    monthlyDurationMonths: 1,
    features: [
      'Tout sa nan Bazilik',
      'Aksè davans pou li kèk pòs',
      'Salon, prezantasyon, fòmasyon gratis VIP',
      'Motivasyon ak gidans espirityèl',
    ],
  },
  vip: {
    key: 'vip',
    name: 'Hoïs Melis',
    tagline: 'Eksperyans VIP ki pi konplè',
    priceYearlyOriginal: 249,
    priceYearlyDiscounted: 224.1,
    priceMonthly: 20.75,
    discountPercentage: 10,
    yearlyDurationMonths: 12,
    monthlyDurationMonths: 1,
    features: [
      'Tout sa nan Sitwonèl',
      'Konsiltasyon patikilye sou ka maladi mistik',
      'Non w pibliye sou paj Hoïs VIP',
      '21 min ak Vye Ewòl',
      'Limyè eksklizif sou fenomèn mondyal',
    ],
  },
};

export function isValidPlan(value: string | null | undefined): value is Plan {
  return value === 'basic' || value === 'premium' || value === 'vip';
}

export function isValidCycle(
  value: string | null | undefined
): value is BillingCycle {
  return value === 'monthly' || value === 'yearly';
}

/** Resolve the price for a (plan, cycle) tuple. */
export function priceFor(plan: PlanDetails, cycle: BillingCycle): number {
  return cycle === 'yearly' ? plan.priceYearlyDiscounted : plan.priceMonthly;
}

/** Duration in months for a (plan, cycle) tuple. */
export function durationFor(plan: PlanDetails, cycle: BillingCycle): number {
  return cycle === 'yearly'
    ? plan.yearlyDurationMonths
    : plan.monthlyDurationMonths;
}
