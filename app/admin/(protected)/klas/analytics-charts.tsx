'use client';

import type { ReactNode } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

// Earthy Hoïs palette — greens first, then gold/clay accents for extra courses.
const GREEN = '#3f7d5a';
const BAR_COLORS = [
  '#3f7d5a',
  '#6ba368',
  '#c9a227',
  '#d98c4a',
  '#8a9b6e',
  '#b4536b',
  '#5b8fb0',
  '#9c7bb0',
];

const dollars = (n: number) =>
  `$${n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/** Shorten long course titles so they fit on a bar axis. */
const short = (s: string) => (s.length > 18 ? s.slice(0, 17) + '…' : s);

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-4 md:p-5">
      <div className="mb-3">
        <h3 className="font-display text-sm font-bold text-ink">{title}</h3>
        {subtitle && (
          <p className="text-[11px] text-earth-600 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export default function AnalyticsCharts({
  perCourse,
  timeline,
}: {
  perCourse: { name: string; revenue: number; buyers: number }[];
  timeline: { label: string; revenue: number }[];
}) {
  // Bar height grows with the number of courses so labels never overlap.
  const barHeight = Math.max(160, perCourse.length * 44 + 24);

  return (
    <div className="grid gap-4">
      {/* Revenue over the last 6 months — the hero trend line. */}
      <ChartCard
        title="Revni pa mwa (6 dènye mwa)"
        subtitle="Sèlman acha peye reyèl (Stripe)."
      >
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={timeline}
              margin={{ top: 8, right: 12, left: 4, bottom: 4 }}
            >
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GREEN} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={GREEN} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eae4d8" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#7a6f5c' }}
                axisLine={{ stroke: '#eae4d8' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#7a6f5c' }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(v: number) => `$${v}`}
              />
              <Tooltip
                formatter={(v: number) => [dollars(v), 'Revni']}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #eae4d8',
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={GREEN}
                strokeWidth={2.5}
                fill="url(#revGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Money each course brought in. */}
        <ChartCard title="Revni pa kou" subtitle="Kantite kòb chak kou rapòte.">
          {perCourse.length === 0 ? (
            <EmptyMini />
          ) : (
            <div style={{ height: barHeight }} className="w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={perCourse}
                  margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#eae4d8"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#7a6f5c' }}
                    axisLine={{ stroke: '#eae4d8' }}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${v}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#4a4234' }}
                    axisLine={false}
                    tickLine={false}
                    width={116}
                    tickFormatter={short}
                  />
                  <Tooltip
                    cursor={{ fill: '#f6f2e9' }}
                    formatter={(v: number) => [dollars(v), 'Revni']}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #eae4d8',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                    {perCourse.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        {/* How many people bought each course. */}
        <ChartCard title="Moun ki achte pa kou" subtitle="Kantite acha peye pa kou.">
          {perCourse.length === 0 ? (
            <EmptyMini />
          ) : (
            <div style={{ height: barHeight }} className="w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={perCourse}
                  margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#eae4d8"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#7a6f5c' }}
                    axisLine={{ stroke: '#eae4d8' }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#4a4234' }}
                    axisLine={false}
                    tickLine={false}
                    width={116}
                    tickFormatter={short}
                  />
                  <Tooltip
                    cursor={{ fill: '#f6f2e9' }}
                    formatter={(v: number) => [`${v} moun`, 'Acha']}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #eae4d8',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="buyers" radius={[0, 6, 6, 0]}>
                    {perCourse.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function EmptyMini() {
  return (
    <div className="h-[160px] grid place-items-center text-center">
      <p className="text-xs text-earth-500">Poko gen okenn vant peye.</p>
    </div>
  );
}
