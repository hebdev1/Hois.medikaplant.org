'use client';

import React from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckIcon, SparklesIcon } from 'lucide-react';

type PricingCardProps = {
  titleBadge: string;
  priceLabel: string;
  priceSuffix?: string;
  features: string[];
  cta?: string;
  className?: string;
};

function FilledCheck() {
  return (
    <div className="bg-primary text-primary-foreground rounded-full p-0.5">
      <CheckIcon className="size-3" strokeWidth={3} />
    </div>
  );
}

function PricingCard({
  titleBadge,
  priceLabel,
  priceSuffix = '/month',
  features,
  cta = 'Subscribe',
  className,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        'bg-background border-foreground/10 relative overflow-hidden rounded-md border',
        'supports-[backdrop-filter]:bg-background/10 backdrop-blur',
        className
      )}
    >
      <div className="flex items-center gap-3 p-4">
        <Badge variant="secondary">{titleBadge}</Badge>
        <div className="ml-auto">
          <Button variant="outline">{cta}</Button>
        </div>
      </div>

      <div className="flex items-end gap-2 px-4 py-2">
        <span className="font-mono text-5xl font-semibold tracking-tight">
          {priceLabel}
        </span>
        {priceLabel.toLowerCase() !== 'free' && (
          <span className="text-muted-foreground text-sm">{priceSuffix}</span>
        )}
      </div>

      <ul className="text-muted-foreground grid gap-4 p-4 text-sm">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-3">
            <FilledCheck />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export type BentoPlan = {
  titleBadge: string;
  priceLabel: string;
  priceSuffix?: string;
  features: string[];
  cta?: string;
  featured?: boolean;
  featuredTagline?: string;
};

/**
 * Adapted from the original shadcn BentoPricing demo. Renders 3-4 plans in
 * a 8-column grid where one card (featured=true) spans 5 columns at lg+,
 * and the rest tile around it. Used by the admin /admin/subscriptions
 * page to render the live plan mix in the same glassy aesthetic as the
 * public landing page.
 */
export function BentoPricing({ plans }: { plans: BentoPlan[] }) {
  const featured = plans.find((p) => p.featured);
  const others = plans.filter((p) => !p.featured);

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-8">
      {/* Featured card spans 5 columns on lg+ */}
      {featured && (
        <div
          className={cn(
            'bg-background border-foreground/10 relative w-full overflow-hidden rounded-md border',
            'supports-[backdrop-filter]:bg-background/10 backdrop-blur',
            'lg:col-span-5'
          )}
        >
          {/* Decorative grid */}
          <div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)]">
            <div className="from-foreground/5 to-foreground/[0.02] absolute inset-0 bg-gradient-to-r [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]">
              <div
                aria-hidden="true"
                className={cn(
                  'absolute inset-0 size-full mix-blend-overlay',
                  '[background-image:linear-gradient(to_right,rgb(var(--foreground)/0.1)_1px,transparent_1px)]',
                  '[background-size:24px]'
                )}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <Badge variant="secondary">{featured.titleBadge}</Badge>
            {featured.featuredTagline && (
              <Badge variant="outline" className="hidden lg:flex">
                <SparklesIcon className="me-1 size-3" />
                {featured.featuredTagline}
              </Badge>
            )}
            <div className="ml-auto">
              <Button>{featured.cta ?? 'Eksplore'}</Button>
            </div>
          </div>
          <div className="flex flex-col p-4 lg:flex-row">
            <div className="pb-4 lg:w-[30%]">
              <span className="font-mono text-5xl font-semibold tracking-tight">
                {featured.priceLabel}
              </span>
              {featured.priceLabel.toLowerCase() !== 'free' && (
                <span className="text-muted-foreground text-sm">
                  {featured.priceSuffix ?? '/year'}
                </span>
              )}
            </div>
            <ul className="text-muted-foreground grid gap-4 text-sm lg:w-[70%]">
              {featured.features.map((f, i) => (
                <li key={i} className="flex items-center gap-3">
                  <FilledCheck />
                  <span className="leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Other plans tile around */}
      {others.map((p, i) => (
        <PricingCard
          key={p.titleBadge}
          titleBadge={p.titleBadge}
          priceLabel={p.priceLabel}
          priceSuffix={p.priceSuffix ?? '/year'}
          features={p.features}
          cta={p.cta ?? 'Eksplore'}
          // First fills 3 cols, the rest fill 4 cols
          className={cn(i === 0 ? 'lg:col-span-3' : 'lg:col-span-4')}
        />
      ))}
    </div>
  );
}
