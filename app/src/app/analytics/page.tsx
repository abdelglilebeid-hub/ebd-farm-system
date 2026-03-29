'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, ComposedChart, Area,
  AreaChart
} from 'recharts';

// ====== THEME CONSTANTS ======
const C = {
  bg: '#0f172a', card: '#1e293b', cardHover: '#334155', border: '#334155',
  text: '#f1f5f9', muted: '#94a3b8', dim: '#64748b',
  blue: '#2563eb', blueLight: '#3b82f6', gold: '#f59e0b',
  green: '#10b981', red: '#ef4444', teal: '#14b8a6', purple: '#8b5cf6',
};

const SECTOR_COLORS: Record<string, string> = {
  'Ø§Ù 22 ÙØ¯Ø§Ù': C.gold, 'Ø­ÙØ¶ Ø§ÙØ¨Ø§Ø¨ÙØ±': C.red, 'Ø§ÙØ­ØµÙÙ': C.green,
  'Ø§ÙØ´ÙØ¹Ù': C.teal, 'Ø§ÙØ®Ø·Ø§Ø±Ø©': C.purple, 'Ø§ÙØ®Ø·Ø§Ø±Ù': C.purple,
};

// ====== STATIC DATA (financial summaries) ======
const YEARLY_DATA = [
  { year: 2017, revenue: 3609806, costs: 5604644 },
  { year: 2018, revenue: 1994838, costs: 4053049 },
  { year: 2019, revenue: 1675207, costs: 2102800 },
  { year: 2020, revenue: 2926668, costs: 1876368 },
  { year: 2021, revenue: 1452544, costs: 1798761 },
  { year: 2022, revenue: 3159451, costs: 1905443 },
  { year: 2023, revenue: 4247506, costs: 2079252 },
  { year: 2024, revenue: 4689211, costs: 2388331 },
  { year: 2025, revenue: 7684947, costs: 4442133 },
];

const SECTOR_PERF_2025 = [
  { name: 'Ø§ÙÙ 22 ÙØ¯Ø§Ù', area: 22, revenue: 4016879, costs: 1167155, color: C.gold },
  { name: 'Ø­ÙØ¶ Ø§ÙØ¨Ø§Ø¨ÙØ±', area: 30.5, revenue: 1425979, costs: 1158352, color: C.red },
  { name: 'Ø§ÙØ­ØµÙÙ', area: 30, revenue: 1018300, costs: 972820, color: C.green },
  { name: 'Ø§ÙØ®Ø·Ø§Ø±Ø©', area: 23, revenue: 814398, costs: 859744, color: C.purple },
  { name: 'Ø§ÙØ´ÙØ¹Ù', area: 9.5, revenue: 409392, costs: 284062, color: C.teal },
];

const REV_COMPOSITION_2025 = [
  { name: 'Ø¨ÙØ­ Ø¨Ø±Ø­Ù', value: 4807166, pct: 62.6, color: C.gold },
  { name: 'Ø¨ÙØ¬Ø±', value: 2308067, pct: 30.0, color: C.green },
  { name: 'Ø°Ø±Ø©', value: 441805, pct: 5.7, color: '#f97316' },
  { name: 'ÙØ§ÙØ¬Ù', value: 58109, pct: 0.8, color: C.muted },
  { name: 'Ø£Ø®Ø±Ù', value: 69800, pct: 0.9, color: C.dim },
];

const PALM_DATA = {
  sectors: [
    { name: 'Ø§ÙÙ 22 ÙØ¯Ø§Ù', area: '22 ÙØ¯Ø§Ù', plots: 7, palms: 948, males: 25, color: C.gold,
      hawshat: [
        { name: 'Ø­ÙØ´Ø© 1 (4Ù)', area: '4 ÙØ¯Ø§Ù', palms: 194, males: 0, spacing: '9Ã9', planted: 'Ø£Ø¨Ø±ÙÙ 2019' },
        { name: 'Ø­ÙØ´Ø© 1 (18Ù)', area: '3Ù 6Ù', palms: 134, males: 11, spacing: '8Ã12', planted: 'Ø£ÙØªÙØ¨Ø± 2018' },
        { name: 'Ø­ÙØ´Ø© 2', area: '3Ù 3Ù', palms: 130, males: 0, spacing: '8Ã12', planted: 'Ø£ÙØªÙØ¨Ø± 2018' },
        { name: 'Ø­ÙØ´Ø© 3', area: '2Ù 20Ù', palms: 120, males: 6, spacing: '8Ã12', planted: 'Ø£ÙØªÙØ¨Ø± 2018' },
        { name: 'Ø­ÙØ´Ø© 4', area: '2Ù 20Ù', palms: 120, males: 0, spacing: '8Ã12', planted: 'Ø£ÙØªÙØ¨Ø± 2018' },
        { name: 'Ø­ÙØ´Ø© 5', area: '2Ù 20Ù', palms: 120, males: 3, spacing: '8Ã12', planted: 'Ø£ÙØªÙØ¨Ø± 2018' },
        { name: 'Ø­ÙØ´Ø© 6', area: '3Ù 3Ù', palms: 130, males: 5, spacing: '8Ã12', planted: 'Ø£ÙØªÙØ¨Ø± 2018' },
      ]},
    { name: 'Ø­ÙØ¶ Ø§ÙØ¨Ø§Ø¨ÙØ±', area: '30.5 ÙØ¯Ø§Ù', plots: 5, palms: 1485, males: 91, color: C.red,
      hawshat: [
        { name: 'Ø­ÙØ´Ø© 1', area: '6Ù', palms: 276, males: 58, spacing: '8Ã10', planted: 'ÙÙÙÙÙ 2023' },
        { name: 'Ø­ÙØ´Ø© 2', area: '7Ù 14Ù', palms: 347, males: 16, spacing: '8Ã10', planted: 'ÙÙÙÙÙ 2023' },
        { name: 'Ø­ÙØ´Ø© 3', area: '7Ù 12Ù', palms: 428, males: 17, spacing: '8Ã9', planted: 'ÙÙÙÙÙ 2023' },
        { name: 'Ø­ÙØ´Ø© 4', area: '4Ù 10Ù', palms: 203, males: 0, spacing: '8Ã10', planted: 'ÙÙÙÙÙ 2025' },
        { name: 'Ø­ÙØ´Ø© 5', area: '5Ù', palms: 231, males: 0, spacing: '8Ã10', planted: 'ÙÙÙÙÙ 2025' },
      ]},
    { name: 'Ø§ÙØ­ØµÙÙ', area: '30 ÙØ¯Ø§Ù', plots: 8, palms: 1015, males: 80, color: C.green,
      hawshat: [
        { name: 'Ø¹ÙØ§ÙØ© 1', area: '3Ù 8Ù', palms: 160, males: 16, spacing: '9Ã10', planted: 'ÙÙÙÙÙ 2022' },
        { name: 'Ø¹ÙØ§ÙØ© 2', area: '3Ù 14Ù', palms: 170, males: 16, spacing: '9Ã10', planted: 'ÙÙÙÙÙ 2022' },
        { name: 'Ø¹ÙØ§ÙØ© 3', area: '3Ù 14Ù', palms: 170, males: 16, spacing: '9Ã10', planted: 'ÙÙÙÙÙ 2022' },
        { name: 'Ø¹ÙØ§ÙØ© 4', area: '3Ù 12Ù', palms: 167, males: 0, spacing: '9Ã10', planted: 'ÙÙÙÙÙ 2022' },
        { name: 'Ø­ØµÙÙ 1', area: '4Ù 15Ù', palms: 220, males: 0, spacing: '8Ã10', planted: 'ÙÙÙÙÙ 2025' },
        { name: 'Ø­ØµÙÙ 2', area: '4Ù 11Ù', palms: 212, males: 16, spacing: '8Ã10', planted: 'ÙÙÙÙÙ 2025' },
      ]},
    { name: 'Ø§ÙØ´ÙØ¹Ù', area: '9.5 ÙØ¯Ø§Ù', plots: 4, palms: 269, males: 103, color: C.teal,
      hawshat: [
        { name: 'Ø­ÙØ´Ø© 1', area: '2Ù 1Ù', palms: 118, males: 0, spacing: '8Ã9', planted: 'ÙÙÙÙÙ 2023' },
        { name: 'Ø­ÙØ´Ø© 2', area: '2Ù 14Ù', palms: 151, males: 36, spacing: '8Ã9', planted: 'ÙÙÙÙÙ 2023' },
      ]},
    { name: 'Ø§ÙØ®Ø·Ø§Ø±Ø©', area: '23 ÙØ¯Ø§Ù', plots: 4, palms: 513, males: 0, color: C.purple,
      hawshat: [
        { name: 'Ø§ÙÙØ´Ø§ÙØ©', area: '-', palms: 56, males: 0, spacing: '8.5Ã10', planted: 'ÙØ§Ø±Ø³ 2010' },
        { name: 'ÙØ­Ø¨Ø³ 1', area: '-', palms: 134, males: 0, spacing: '8.5Ã10', planted: '2019-2020' },
        { name: 'ÙØ­Ø¨Ø³ 2', area: '-', palms: 154, males: 0, spacing: '8.5Ã10', planted: '2022-2023' },
        { name: 'ÙØ­Ø¨Ø³ 3', area: '-', palms: 169, males: 0, spacing: '8.5Ã10', planted: 'ÙØ§ÙÙ 2024' },
      ]},
  ],
};

const COST_CATEGORIES = {
  labels: ['ÙØ±ØªØ¨Ø§Øª', 'Ø¹ÙØ§ÙØ©', 'Ø£Ø³ÙØ¯Ø©', 'ÙØ´ØªØ±ÙØ§Øª', 'ÙØ¹Ø¯Ø§Øª', 'ØµÙØ§ÙØ©', 'ÙÙØ±Ø¨Ø§Ø¡', 'Ø¶ÙØ§ÙØ©', 'Ø£Ø®Ø±Ù', 'Ø¨ÙØ¬Ø±', 'Ø°Ø±Ø©'],
  colors: [C.blue, C.gold, C.green, C.red, '#f97316', C.teal, C.purple, '#ec4899', C.dim, '#84cc16', '#a855f7'],
  data: {
    2019: [430250, 269575, 754113, 386800, 74250, 109781, 24590, 9861, 43580, 0, 0],
    2020: [507119, 252830, 639275, 104616, 91377, 131007, 95524, 11980, 42600, 0, 0],
    2021: [584453, 237801, 644671, 41088, 57209, 109588, 68924, 8228, 46800, 0, 0],
    2022: [667568, 288295, 474096, 113901, 76741, 165924, 42110, 9093, 67715, 0, 0],
    2023: [864570, 426760, 390762, 239338, 76090, 34718, 19150, 8976, 18888, 0, 0],
    2024: [861245, 422656, 445737, 241286, 99350, 30530, 29791, 4895, 6890, 245951, 0],
    2025: [1124075, 764030, 735550, 638008, 215522, 131116, 43009, 19033, 56720, 464925, 139950],
  } as Record<number, number[]>,
};

const fmt = (n: number) => new Intl.NumberFormat('ar-EG').format(Math.round(n));
const fmtM = (n: number) => `${(n / 1000000).toFixed(1)}M`;

const PAGES = [
  { id: 'sectors', label: 'ð ØªØ­ÙÙÙ Ø§ÙÙØ·Ø§Ø¹Ø§Øª' },
  { id: 'details', label: 'ð´ ØªÙØ§ØµÙÙ Ø§ÙÙØ·Ø§Ø¹Ø§Øª' },
  { id: 'costs', label: 'ð° Ø§ÙØªÙØ§ÙÙÙ ÙØ§ÙÙÙØ§Ø¡Ø©' },
  { id: 'expenses', label: 'ð Ø³Ø¬Ù Ø§ÙÙØµØ§Ø±ÙÙ' },
  { id: 'seedlings', label: 'ð± Ø§ÙÙØ³Ø§Ø¦Ù' },
  { id: 'scorecard', label: 'ð Ø¨Ø·Ø§ÙØ© Ø§ÙØ£Ø¯Ø§Ø¡' },
  { id: 'outlook', label: 'ð® Ø§ÙÙØ¸Ø±Ø© Ø§ÙÙØ³ØªÙØ¨ÙÙØ©' },
  { id: 'weather', label: 'ð¤ï¸ Ø§ÙØ·ÙØ³' },
];

// ====== COMPONENTS ======
function KPICard({ label, value, sub, subColor = C.green }: { label: string; value: string; sub?: string; subColor?: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRight: `3px solid ${C.blue}`, borderRadius: 12, padding: '16px 20px' }}>
      <div style={{ color: C.muted, fontSize: 12, marginBottom: 4 }}>{label}</div>
      <div style={{ color: C.text, fontSize: 22, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ color: subColor, fontSize: 11, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function StatusBadge({ profit }: { profit: number }) {
  const c = profit > 50000 ? C.green : profit > -50000 ? C.gold : C.red;
  const label = profit > 50000 ? 'Ø±Ø§Ø¨Ø­' : profit > -50000 ? 'ÙØªØ¹Ø§Ø¯Ù' : 'Ø®Ø§Ø³Ø±';
  return <span style={{ background: c + '22', color: c, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{label}</span>;
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
      {title && <div style={{ color: C.text, fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{title}</div>}
      {subtitle && <div style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>{subtitle}</div>}
      {children}
    </div>
  );
}

// ====== PAGE: SECTOR ANALYSIS ======
function SectorAnalysis() {
  const d2025 = YEARLY_DATA.find(d => d.year === 2025)!;
  const revenueData = YEARLY_DATA.map(d => ({ year: d.year, Ø¥ÙØ±Ø§Ø¯Ø§Øª: d.revenue, ØªÙØ§ÙÙÙ: d.costs, Ø±Ø¨Ø­: d.revenue - d.costs }));
  const totalRev = YEARLY_DATA.reduce((s, d) => s + d.revenue, 0);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KPICard label="Ø¥Ø¬ÙØ§ÙÙ Ø§ÙØ¥ÙØ±Ø§Ø¯Ø§Øª 2025" value={`${fmt(d2025.revenue)} Ø¬.Ù`} sub="â +63.9% Ø³ÙÙÙ" />
        <KPICard label="ØµØ§ÙÙ Ø§ÙØ±Ø¨Ø­ 2025" value={`${fmt(d2025.revenue - d2025.costs)} Ø¬.Ù`} sub="â 42.2% Ø§ÙÙØ§ÙØ´" />
        <KPICard label="Ø¥ÙØ±Ø§Ø¯ / ÙØ¯Ø§Ù" value={`${fmt(d2025.revenue / 115)} Ø¬.Ù`} sub="115 ÙØ¯Ø§Ù Ø¥Ø¬ÙØ§ÙÙ" subColor={C.muted} />
        <KPICard label="Ø§ÙØ¥ÙØ±Ø§Ø¯Ø§Øª Ø§ÙØªØ±Ø§ÙÙÙØ©" value={`${fmt(totalRev)} Ø¬.Ù`} sub="2017-2025" subColor={C.muted} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <SectionCard title="ÙØ³Ø§Ø± Ø§ÙØ¥ÙØ±Ø§Ø¯Ø§Øª 2017-2025" subtitle="">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={revenueData}>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fill: C.muted, fontSize: 11 }} />
              <YAxis tick={{ fill: C.muted, fontSize: 11 }} tickFormatter={v => fmtM(v)} />
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }}
                formatter={(v: number) => `${fmt(v)} Ø¬.Ù`} />
              <Area dataKey="Ø±Ø¨Ø­" fill={C.green + '33'} stroke={C.green} />
              <Line dataKey="Ø¥ÙØ±Ø§Ø¯Ø§Øª" stroke={C.gold} strokeWidth={3} dot={{ r: 4 }} />
              <Line dataKey="ØªÙØ§ÙÙÙ" stroke={C.red} strokeWidth={2} strokeDasharray="5 5" />
              <Legend />
            </ComposedChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="ØªØ±ÙÙØ¨Ø© Ø§ÙØ¥ÙØ±Ø§Ø¯Ø§Øª 2025" subtitle="">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={REV_COMPOSITION_2025} dataKey="value" nameKey="name" cx="50%" cy="50%"
                outerRadius={95} innerRadius={50}
                label={({ name, pct }) => `${name} ${pct}%`}
              >
                {REV_COMPOSITION_2025.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }}
                formatter={(v: number) => `${fmt(v)} Ø¬.Ù`} />
            </PieChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      <SectionCard title="Ø£Ø¯Ø§Ø¡ Ø§ÙÙØ·Ø§Ø¹Ø§Øª 2025" subtitle="">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['Ø§ÙÙØ·Ø§Ø¹', 'Ø§ÙÙØ³Ø§Ø­Ø©', 'Ø§ÙØ¥ÙØ±Ø§Ø¯Ø§Øª', 'Ø§ÙØªÙØ§ÙÙÙ', 'Ø§ÙØ±Ø¨Ø­', 'Ø±Ø¨Ø­/ÙØ¯Ø§Ù', 'Ø§ÙØ­Ø§ÙØ©'].map(h =>
                <th key={h} style={{ padding: '10px 12px', textAlign: 'right', color: C.muted, fontWeight: 500 }}>{h}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {SECTOR_PERF_2025.map(s => {
              const profit = s.revenue - s.costs;
              return (
                <tr key={s.name} style={{ borderBottom: `1px solid ${C.border}22` }}>
                  <td style={{ padding: '10px 12px', color: C.text, fontWeight: 600 }}>
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: s.color, marginLeft: 8 }} />
                    {s.name}
                  </td>
                  <td style={{ padding: '10px 12px', color: C.muted }}>{s.area} ÙØ¯Ø§Ù</td>
                  <td style={{ padding: '10px 12px', color: C.green }}>{fmt(s.revenue)}</td>
                  <td style={{ padding: '10px 12px', color: C.red }}>{fmt(s.costs)}</td>
                  <td style={{ padding: '10px 12px', color: profit >= 0 ? C.green : C.red, fontWeight: 600 }}>{fmt(profit)}</td>
                  <td style={{ padding: '10px 12px', color: C.muted }}>{fmt(profit / s.area)}</td>
                  <td style={{ padding: '10px 12px' }}><StatusBadge profit={profit} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

// ====== PAGE: SECTOR DETAILS ======
function SectorDetails() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KPICard label="Ø¥Ø¬ÙØ§ÙÙ Ø§ÙÙØ³Ø§Ø­Ø©" value="115 ÙØ¯Ø§Ù" sub="5 ÙØ·Ø§Ø¹Ø§Øª" subColor={C.muted} />
        <KPICard label="ÙØ®ÙÙ Ø¨Ø±Ø­Ù" value={`${fmt(4230)}`} sub="Ø¥ÙØªØ§Ø¬ ØªÙÙØ±" subColor={C.green} />
        <KPICard label="ÙØ®ÙÙ Ø°ÙÙØ±" value={`${fmt(299)}`} sub="ØªÙÙÙØ­" subColor={C.gold} />
        <KPICard label="Ø­ÙØ´Ø§Øª" value="28" sub="ÙØ­Ø¯Ø© Ø¥Ø¯Ø§Ø±ÙØ©" subColor={C.muted} />
      </div>

      {PALM_DATA.sectors.map(sector => (
        <div key={sector.name} style={{
          background: C.card, border: `1px solid ${C.border}`, borderRight: `4px solid ${sector.color}`,
          borderRadius: 12, marginBottom: 12, overflow: 'hidden'
        }}>
          <div
            onClick={() => setExpanded(expanded === sector.name ? null : sector.name)}
            style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div>
              <div style={{ color: C.text, fontSize: 16, fontWeight: 700 }}>{sector.name}</div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{sector.area} | {sector.plots} Ø­ÙØ´Ø§Øª | {sector.palms} ÙØ®ÙØ© | {sector.males} Ø°ÙÙØ±</div>
            </div>
            <span style={{ color: C.muted, fontSize: 18 }}>{expanded === sector.name ? 'â²' : 'â¼'}</span>
          </div>
          {expanded === sector.name && (
            <div style={{ padding: '0 20px 20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {['Ø§ÙØ­ÙØ´Ø©', 'Ø§ÙÙØ³Ø§Ø­Ø©', 'ÙØ®ÙÙ', 'Ø°ÙÙØ±', 'Ø§ÙÙØ³Ø§ÙØ©', 'ØªØ§Ø±ÙØ® Ø§ÙØ²Ø±Ø§Ø¹Ø©'].map(h =>
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'right', color: C.muted }}>{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sector.hawshat.map(h => (
                    <tr key={h.name} style={{ borderBottom: `1px solid ${C.border}22` }}>
                      <td style={{ padding: '8px 10px', color: C.text, fontWeight: 500 }}>{h.name}</td>
                      <td style={{ padding: '8px 10px', color: C.muted }}>{h.area}</td>
                      <td style={{ padding: '8px 10px', color: C.green }}>{h.palms}</td>
                      <td style={{ padding: '8px 10px', color: C.gold }}>{h.males || '-'}</td>
                      <td style={{ padding: '8px 10px', color: C.muted }}>{h.spacing}</td>
                      <td style={{ padding: '8px 10px', color: C.muted }}>{h.planted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ====== PAGE: COST ANALYSIS ======
function CostAnalysis() {
  const [selectedYear, setSelectedYear] = useState(2025);
  const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
  const yd = YEARLY_DATA.find(d => d.year === selectedYear);
  const costs = COST_CATEGORIES.data[selectedYear] || [];
  const totalCost = costs.reduce((s, c) => s + c, 0);
  const revenue = yd?.revenue || 1;
  const profit = revenue - totalCost;
  const margin = ((profit / revenue) * 100);
  const costRatio = totalCost / revenue;

  const costBreakdown = COST_CATEGORIES.labels.map((label, i) => ({
    name: label, value: costs[i] || 0, color: COST_CATEGORIES.colors[i],
  })).filter(c => c.value > 0).sort((a, b) => b.value - a.value);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {years.map(y => (
          <button key={y} onClick={() => setSelectedYear(y)} style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: selectedYear === y ? C.blue : 'transparent', color: selectedYear === y ? C.text : C.muted,
            border: `1px solid ${selectedYear === y ? C.blue : C.border}`,
          }}>{y}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KPICard label="Ø¥Ø¬ÙØ§ÙÙ Ø§ÙØªÙØ§ÙÙÙ" value={`${fmt(totalCost)} Ø¬.Ù`} sub={`${selectedYear}`} subColor={C.red} />
        <KPICard label="Ø¥Ø¬ÙØ§ÙÙ Ø§ÙØ¥ÙØ±Ø§Ø¯Ø§Øª" value={`${fmt(revenue)} Ø¬.Ù`} sub="" subColor={C.green} />
        <KPICard label="ØµØ§ÙÙ Ø§ÙÙØ§ÙØ´" value={`${margin.toFixed(1)}%`} sub={margin > 20 ? 'ØµØ­Ù' : 'Ø¶Ø¹ÙÙ'} subColor={margin > 20 ? C.green : C.red} />
        <KPICard label="Ø§ÙØªÙÙÙØ© / Ø§ÙØ¥ÙØ±Ø§Ø¯" value={costRatio.toFixed(2)} sub={costRatio <= 0.5 ? 'ÙÙØªØ§Ø²' : 'ÙÙØ¨ÙÙ'} subColor={costRatio <= 0.5 ? C.green : C.gold} />
      </div>

      <SectionCard title={`ØªÙØ²ÙØ¹ Ø§ÙØªÙØ§ÙÙÙ ${selectedYear}`} subtitle="">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={costBreakdown} layout="vertical">
            <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fill: C.muted, fontSize: 11 }} tickFormatter={v => fmtM(v)} />
            <YAxis type="category" dataKey="name" tick={{ fill: C.muted, fontSize: 11 }} width={80} />
            <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }}
              formatter={(v: number) => `${fmt(v)} Ø¬.Ù`} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {costBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard title="Ø§ÙØªØµØ§Ø¯ÙØ§Øª Ø§ÙÙØ­Ø§ØµÙÙ 2025" subtitle="">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { name: 'Ø§ÙØ¨ÙØ¬Ø±', rev: 2308067, cost: 464925, color: C.green },
            { name: 'Ø§ÙØ°Ø±Ø©', rev: 441805, cost: 139950, color: '#f97316' },
            { name: 'Ø§ÙØ¨ÙØ­ Ø§ÙØ¨Ø±Ø­Ù', rev: 4807166, cost: 3837258, color: C.gold },
          ].map(crop => {
            const profit = crop.rev - crop.cost;
            const margin = ((profit / crop.rev) * 100).toFixed(1);
            const roi = ((profit / crop.cost) * 100).toFixed(0);
            return (
              <div key={crop.name} style={{ background: C.cardHover, borderRadius: 12, padding: 16, borderTop: `3px solid ${crop.color}` }}>
                <div style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{crop.name}</div>
                <div style={{ color: C.green, fontSize: 13 }}>Ø¥ÙØ±Ø§Ø¯Ø§Øª: {fmt(crop.rev)} Ø¬.Ù</div>
                <div style={{ color: C.red, fontSize: 13 }}>Ø§ÙØªÙÙÙØ©: ({fmt(crop.cost)}) Ø¬.Ù</div>
                <div style={{ color: C.text, fontSize: 15, fontWeight: 700, marginTop: 8 }}>Ø§ÙØ±Ø¨Ø­: {fmt(profit)} Ø¬.Ù</div>
                <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>ÙØ§ÙØ´ {margin}% | Ø¹Ø§Ø¦Ø¯ {roi}%</div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}

// ====== PAGE: EXPENSE LOG (FROM SUPABASE) ======
function ExpenseLog() {
  const supabase = createClient();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [year, setYear] = useState(2025);
  const [sectorFilter, setSectorFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('expenses').select('*').eq('year', year).order('month', { ascending: false }).order('day', { ascending: false }).limit(500);
    if (sectorFilter) query = query.eq('sector_name', sectorFilter);
    if (typeFilter) query = query.eq('expense_category', typeFilter);
    const { data } = await query;
    setExpenses(data || []);
    setLoading(false);
  }, [supabase, year, sectorFilter, typeFilter]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const filtered = search
    ? expenses.filter(e => e.description?.includes(search))
    : expenses;

  const total = filtered.reduce((s, e) => s + (e.total_amount || 0), 0);
  const sectors = Array.from(new Set(expenses.map(e => e.sector_name).filter(Boolean)));
  const types = Array.from(new Set(expenses.map(e => e.expense_category).filter(Boolean)));

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map(y => (
          <button key={y} onClick={() => setYear(y)} style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: year === y ? C.blue : 'transparent', color: year === y ? C.text : C.muted,
            border: `1px solid ${year === y ? C.blue : C.border}`,
          }}>{y}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
        <KPICard label="Ø§ÙØ¥Ø¬ÙØ§ÙÙ" value={`${fmt(total)} Ø¬.Ù`} sub={`${year}`} subColor={C.red} />
        <KPICard label="ØªÙÙÙØ©/ÙØ¯Ø§Ù" value={`${fmt(total / 115)} Ø¬.Ù`} sub="115 ÙØ¯Ø§Ù" subColor={C.muted} />
        <KPICard label="Ø¹Ø¯Ø¯ Ø§ÙØ³Ø¬ÙØ§Øª" value={`${filtered.length}`} sub="ÙÙ Supabase" subColor={C.blue} />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}
          style={{ background: C.cardHover, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
          <option value="">ÙÙ Ø§ÙÙØ·Ø§Ø¹Ø§Øª</option>
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          style={{ background: C.cardHover, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
          <option value="">ÙÙ Ø§ÙØ£ÙÙØ§Ø¹</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input placeholder="Ø¨Ø­Ø« ÙÙ Ø§ÙØ¨ÙØ§Ù..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ background: C.cardHover, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, flex: 1, minWidth: 200 }} />
      </div>

      <SectionCard title="" subtitle="">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>Ø¬Ø§Ø±Ù Ø§ÙØªØ­ÙÙÙ ÙÙ Supabase...</div>
        ) : (
          <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead style={{ position: 'sticky', top: 0, background: C.card }}>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Ø§ÙØªØ§Ø±ÙØ®', 'Ø§ÙÙØ·Ø§Ø¹', 'Ø§ÙÙØ²Ø±Ø¹Ø©', 'Ø§ÙÙÙØ¹', 'Ø§ÙØ¨ÙØ§Ù', 'Ø§ÙÙØ¨ÙØº'].map(h =>
                    <th key={h} style={{ padding: '10px 8px', textAlign: 'right', color: C.muted }}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 200).map((e, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}22` }}>
                    <td style={{ padding: '8px', color: C.muted }}>{e.year}/{e.month}/{e.day || '-'}</td>
                    <td style={{ padding: '8px', color: SECTOR_COLORS[e.sector_name] || C.muted }}>{e.sector_name || '-'}</td>
                    <td style={{ padding: '8px', color: C.text }}>{e.farm?.name || '-'}</td>
                    <td style={{ padding: '8px', color: C.muted }}>{e.expense_category || '-'}</td>
                    <td style={{ padding: '8px', color: C.text, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</td>
                    <td style={{ padding: '8px', color: C.red, fontWeight: 600 }}>{fmt(e.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ====== PAGE: SEEDLINGS ======
function Seedlings() {
  const movements = [
    { year: 2022, planted: 668, replanting: 6, sold: 475 },
    { year: 2023, planted: 1370, replanting: 48, sold: 362 },
    { year: 2024, planted: 0, replanting: 149, sold: 204 },
    { year: 2025, planted: 932, replanting: 0, sold: 8 },
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KPICard label="ÙØ®ÙØ© Ø£Ù" value="929" sub="22 ÙØ¯Ø§Ù Ø¨Ø§ÙØ¹Ø²Ø¨Ø©" subColor={C.muted} />
        <KPICard label="ÙØ³Ø§Ø¦Ù ÙÙØªØ¬Ø©" value={`${fmt(5382)}`} sub="5.79 ÙØ³ÙÙØ©/ÙØ®ÙØ©" subColor={C.green} />
        <KPICard label="ÙØ³Ø§Ø¦Ù ÙØ¨Ø§Ø¹Ø©" value={`${fmt(1049)}`} sub="" subColor={C.gold} />
        <KPICard label="Ø§ÙØ±ØµÙØ¯ Ø§ÙÙØªØ¨ÙÙ" value={`${fmt(1158)}`} sub={`${fmt(1158 * 3500)} Ø¬.Ù ÙÙÙØ©`} subColor={C.blue} />
      </div>

      <SectionCard title="Ø­Ø±ÙØ© Ø§ÙÙØ³Ø§Ø¦Ù Ø§ÙØ³ÙÙÙØ©" subtitle="">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={movements}>
            <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fill: C.muted, fontSize: 12 }} />
            <YAxis tick={{ fill: C.muted, fontSize: 11 }} />
            <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }} />
            <Legend />
            <Bar dataKey="planted" name="Ø²Ø±Ø§Ø¹Ø©" fill={C.green} radius={[4, 4, 0, 0]} />
            <Bar dataKey="replanting" name="ØªØ±ÙÙØ¹" fill={C.gold} radius={[4, 4, 0, 0]} />
            <Bar dataKey="sold" name="Ø¨ÙØ¹" fill={C.blue} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard title="Ø§ÙØªÙÙØ¹Ø§Øª Ø§ÙÙØ³ØªÙØ¨ÙÙØ©" subtitle="5 Ø³ÙÙØ§Øª ÙÙ Ø§ÙØ²Ø±Ø§Ø¹Ø© ÙØ£ÙÙ Ø¥ÙØªØ§Ø¬ ÙØ³Ø§Ø¦Ù">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
          {[
            { name: 'Ø§ÙÙ 22 ÙØ¯Ø§Ù', palms: 929, planted: '2018-2019', harvest: 'ÙØ´Ø·', projected: 5382, color: C.gold },
            { name: 'Ø¹ÙØ§ÙØ©', palms: 667, planted: 'ÙÙÙÙÙ 2022', harvest: '2027', projected: 3862, color: C.green },
            { name: 'Ø¨Ø§Ø¨ÙØ± 1-3', palms: 1051, planted: 'ÙÙÙÙÙ 2023', harvest: '2028', projected: 6085, color: C.red },
            { name: 'Ø§ÙØ´ÙØ¹Ù', palms: 269, planted: 'ÙÙÙÙÙ 2023', harvest: '2028', projected: 1558, color: C.teal },
            { name: 'Ø¨Ø§Ø¨ÙØ± 4-5', palms: 434, planted: 'ÙÙÙÙÙ 2025', harvest: '2030', projected: 2513, color: C.red },
            { name: 'Ø­ØµÙÙ Ø£ØµÙÙØ©', palms: 498, planted: 'ÙÙÙÙÙ 2025', harvest: '2030', projected: 2883, color: C.green },
          ].map(s => (
            <div key={s.name} style={{ background: C.cardHover, borderRadius: 10, padding: 14, borderRight: `3px solid ${s.color}` }}>
              <div style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{s.name}</div>
              <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>{s.palms} ÙØ®ÙØ© | Ø²Ø±Ø§Ø¹Ø© {s.planted}</div>
              <div style={{ color: C.green, fontSize: 13, fontWeight: 600, marginTop: 6 }}>Ø¨Ø¯Ø§ÙØ© Ø§ÙØ¥ÙØªØ§Ø¬: {s.harvest}</div>
              <div style={{ color: C.blue, fontSize: 12 }}>ÙØªÙÙØ¹: ~{fmt(s.projected)} ÙØ³ÙÙØ©</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: 12, background: C.blue + '22', borderRadius: 8, textAlign: 'center' }}>
          <span style={{ color: C.text, fontSize: 16, fontWeight: 700 }}>Ø¥Ø¬ÙØ§ÙÙ Ø§ÙÙØ³Ø§Ø¦Ù Ø§ÙÙØªÙÙØ¹Ø©: ~{fmt(18771)} ÙØ³ÙÙØ©</span>
        </div>
      </SectionCard>
    </div>
  );
}

// ====== PAGE: SCORECARD ======
function Scorecard() {
  const [yearA, setYearA] = useState(2024);
  const [yearB, setYearB] = useState(2025);
  const dA = YEARLY_DATA.find(d => d.year === yearA);
  const dB = YEARLY_DATA.find(d => d.year === yearB);
  if (!dA || !dB) return null;

  const metrics = [
    { label: 'Ø¥Ø¬ÙØ§ÙÙ Ø§ÙØ¥ÙØ±Ø§Ø¯Ø§Øª', a: dA.revenue, b: dB.revenue },
    { label: 'Ø¥Ø¬ÙØ§ÙÙ Ø§ÙØªÙØ§ÙÙÙ', a: dA.costs, b: dB.costs, invert: true },
    { label: 'ØµØ§ÙÙ Ø§ÙØ±Ø¨Ø­', a: dA.revenue - dA.costs, b: dB.revenue - dB.costs },
    { label: 'ÙØ§ÙØ´ Ø§ÙØ±Ø¨Ø­ %', a: ((dA.revenue - dA.costs) / dA.revenue) * 100, b: ((dB.revenue - dB.costs) / dB.revenue) * 100, isPct: true },
    { label: 'Ø¥ÙØ±Ø§Ø¯/ÙØ¯Ø§Ù', a: dA.revenue / 115, b: dB.revenue / 115 },
    { label: 'ØªÙÙÙØ©/ÙØ¯Ø§Ù', a: dA.costs / 115, b: dB.costs / 115, invert: true },
    { label: 'Ø±Ø¨Ø­/ÙØ¯Ø§Ù', a: (dA.revenue - dA.costs) / 115, b: (dB.revenue - dB.costs) / 115 },
  ];

  const allYears = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

  return (
    <div>
      <div style={{ display: 'flex', gap: 20, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <span style={{ color: C.muted, fontSize: 12, marginLeft: 8 }}>Ø§ÙØ³ÙØ© Ø£:</span>
          {allYears.map(y => (
            <button key={y} onClick={() => setYearA(y)} style={{
              padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', margin: '0 2px',
              background: yearA === y ? C.blue : 'transparent', color: yearA === y ? C.text : C.muted,
              border: `1px solid ${yearA === y ? C.blue : C.border}`,
            }}>{y}</button>
          ))}
        </div>
        <div>
          <span style={{ color: C.muted, fontSize: 12, marginLeft: 8 }}>Ø§ÙØ³ÙØ© Ø¨:</span>
          {allYears.map(y => (
            <button key={y} onClick={() => setYearB(y)} style={{
              padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', margin: '0 2px',
              background: yearB === y ? C.green : 'transparent', color: yearB === y ? C.text : C.muted,
              border: `1px solid ${yearB === y ? C.green : C.border}`,
            }}>{y}</button>
          ))}
        </div>
      </div>

      <SectionCard title={`ÙÙØ§Ø±ÙØ© ${yearA} â ${yearB}`} subtitle="">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              <th style={{ padding: 12, textAlign: 'right', color: C.muted }}>Ø§ÙÙØ¤Ø´Ø±</th>
              <th style={{ padding: 12, textAlign: 'right', color: C.blue }}>{yearA}</th>
              <th style={{ padding: 12, textAlign: 'right', color: C.green }}>{yearB}</th>
              <th style={{ padding: 12, textAlign: 'right', color: C.muted }}>Ø§ÙØªØºÙÙØ±</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map(m => {
              const change = m.a !== 0 ? ((m.b - m.a) / Math.abs(m.a)) * 100 : 0;
              const improved = m.invert ? change < 0 : change > 0;
              return (
                <tr key={m.label} style={{ borderBottom: `1px solid ${C.border}22` }}>
                  <td style={{ padding: 12, color: C.text, fontWeight: 500 }}>{m.label}</td>
                  <td style={{ padding: 12, color: C.muted }}>{m.isPct ? `${m.a.toFixed(1)}%` : `${fmt(m.a)} Ø¬.Ù`}</td>
                  <td style={{ padding: 12, color: C.text, fontWeight: 600 }}>{m.isPct ? `${m.b.toFixed(1)}%` : `${fmt(m.b)} Ø¬.Ù`}</td>
                  <td style={{ padding: 12, color: improved ? C.green : C.red, fontWeight: 600 }}>
                    {change > 0 ? 'â' : 'â'} {Math.abs(change).toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

// ====== PAGE: FUTURE OUTLOOK ======
function FutureOutlook() {
  const scenarios = [
    { name: 'ÙØªØ­ÙØ¸ (19%)', values: [9.2, 11.1, 13.0], color: C.gold },
    { name: 'Ø£Ø³Ø§Ø³Ù (32%)', values: [10.5, 13.8, 17.5], color: C.green },
    { name: 'ÙØªÙØ§Ø¦Ù (40%)', values: [11.8, 16.2, 21.0], color: C.blue },
  ];

  return (
    <div>
      <SectionCard title="ØªÙÙØ¹Ø§Øª Ø§ÙØ¥ÙØ±Ø§Ø¯Ø§Øª" subtitle="3 Ø³ÙÙØ§Ø±ÙÙÙØ§Øª ÙÙÙÙÙ">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {scenarios.map(s => (
            <div key={s.name} style={{ background: C.cardHover, borderRadius: 12, padding: 16, borderTop: `3px solid ${s.color}` }}>
              <div style={{ color: s.color, fontWeight: 700, fontSize: 15, marginBottom: 12 }}>{s.name}</div>
              {['2026', '2027', '2028'].map((y, i) => (
                <div key={y} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: C.muted, fontSize: 12 }}>{y}</span>
                  <span style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{s.values[i]}M Ø¬.Ù</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, padding: 10, background: C.gold + '22', borderRadius: 8, color: C.gold, fontSize: 12, textAlign: 'center' }}>
          â ï¸ Ø§ÙØ¨ÙØ¬Ø± (30% ÙÙ Ø¥ÙØ±Ø§Ø¯Ø§Øª 2025) Ø¨ÙÙÙ Ø³ÙÙÙØ§Ù ÙØ¹ ÙØ¨Ø± Ø§ÙÙØ®ÙÙ â ÙØ­Ø³ÙØ¨ ÙÙ Ø§ÙØªÙÙØ¹Ø§Øª
        </div>
      </SectionCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <SectionCard title="ð¢ ÙØ±Øµ" subtitle="">
          <div style={{ fontSize: 13, color: C.text, lineHeight: 2 }}>
            â¢ 5 ÙØ·Ø§Ø¹Ø§Øª ØªØ¯Ø®Ù Ø§ÙØ¥ÙØªØ§Ø¬ 2027-2030<br />
            â¢ ~15.4M ÙÙ Ø¨ÙØ¹ Ø§ÙÙØ³Ø§Ø¦Ù Ø§ÙÙØªÙÙØ¹Ø©<br />
            â¢ ØªØµØ¯ÙØ± Ø§ÙØ¨Ø±Ø­Ù 3-5Ã Ø§ÙØ³Ø¹Ø± Ø§ÙÙØ­ÙÙ<br />
            â¢ ~18,771 ÙØ³ÙÙØ© ÙØªÙÙØ¹Ø© Ø§ÙØ¥ÙØªØ§Ø¬<br />
            â¢ ÙÙÙ Ø§ÙØ¨ÙØ­ ÙØ¹ÙØ¶ Ø§ÙØ®ÙØ§Ø¶ Ø§ÙØ¨ÙØ¬Ø±
          </div>
        </SectionCard>
        <SectionCard title="ð´ ÙØ®Ø§Ø·Ø±" subtitle="">
          <div style={{ fontSize: 13, color: C.text, lineHeight: 2 }}>
            â¢ ØªÙØ§ÙÙÙ +86% Ø£Ø³Ø±Ø¹ ÙÙ Ø§ÙØ¥ÙØ±Ø§Ø¯Ø§Øª<br />
            â¢ Ø§Ø¹ØªÙØ§Ø¯ Ø¹ÙÙ 22 ÙØ¯Ø§Ù (52% ÙÙ Ø§ÙØ¥ÙØ±Ø§Ø¯Ø§Øª)<br />
            â¢ Ø§ÙØ¨ÙØ¬Ø± Ø¨ÙÙÙ Ø³ÙÙÙØ§Ù<br />
            â¢ ØªÙÙØ¨Ø§Øª Ø£Ø³Ø¹Ø§Ø± Ø§ÙØ¨ÙØ­<br />
            â¢ ÙØ®Ø§Ø·Ø± ÙØ§Ø¦ÙØ© ÙØ·Ø§ÙØ©
          </div>
        </SectionCard>
      </div>

      <SectionCard title="ØªÙÙØ¹Ø§Øª ÙØ¨ÙØ¹Ø§Øª Ø§ÙÙØ³Ø§Ø¦Ù" subtitle="">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { year: '2026', qty: 800, price: 3500, total: 2800000 },
            { year: '2027', qty: 1200, price: 3800, total: 4560000 },
            { year: '2028', qty: 2000, price: 4000, total: 8000000 },
          ].map(f => (
            <div key={f.year} style={{ background: C.cardHover, borderRadius: 10, padding: 14, textAlign: 'center' }}>
              <div style={{ color: C.muted, fontSize: 12 }}>{f.year}</div>
              <div style={{ color: C.text, fontSize: 20, fontWeight: 700 }}>{fmt(f.total)} Ø¬.Ù</div>
              <div style={{ color: C.muted, fontSize: 11 }}>{fmt(f.qty)} ÙØ³ÙÙØ© Ã {fmt(f.price)} Ø¬.Ù</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ====== PAGE: WEATHER ======
function Weather() {
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=30.72&longitude=31.78&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code,uv_index_max&timezone=Africa%2FCairo&forecast_days=7')
      .then(r => r.json())
      .then(setWeather)
      .catch(() => {});
  }, []);

  const weatherIcon = (code: number) => {
    if (code <= 1) return 'âï¸';
    if (code <= 3) return 'â';
    if (code <= 48) return 'ð«ï¸';
    if (code <= 67) return 'ð§ï¸';
    if (code <= 77) return 'âï¸';
    if (code <= 82) return 'ð¦ï¸';
    return 'âï¸';
  };

  const days = ['Ø§ÙØ£Ø­Ø¯', 'Ø§ÙØ¥Ø«ÙÙÙ', 'Ø§ÙØ«ÙØ§Ø«Ø§Ø¡', 'Ø§ÙØ£Ø±Ø¨Ø¹Ø§Ø¡', 'Ø§ÙØ®ÙÙØ³', 'Ø§ÙØ¬ÙØ¹Ø©', 'Ø§ÙØ³Ø¨Øª'];

  if (!weather) return <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Ø¬Ø§Ø±Ù ØªØ­ÙÙÙ Ø¨ÙØ§ÙØ§Øª Ø§ÙØ·ÙØ³...</div>;

  const temp = weather.current?.temperature_2m;
  const tips: string[] = [];
  if (temp > 42) tips.push('ð¥ Ø­Ø±Ø§Ø±Ø© Ø´Ø¯ÙØ¯Ø© â Ø²ÙÙØ¯ Ø§ÙØ±Ù ÙØªØ¬ÙØ¨ Ø§ÙØ¹ÙÙ ÙÙØª Ø§ÙØ¸ÙØ±');
  else if (temp > 38) tips.push('âï¸ Ø­Ø±Ø§Ø±Ø© Ø¹Ø§ÙÙØ© â ØªØ£ÙØ¯ ÙÙ ÙÙØ§ÙØ© Ø§ÙØ±Ù');
  else if (temp < 8) tips.push('âï¸ Ø¨Ø±ÙØ¯Ø© â Ø§Ø­ÙÙ Ø§ÙÙØ³Ø§Ø¦Ù Ø§ÙØµØºÙØ±Ø©');
  if (weather.daily?.precipitation_sum?.[0] > 5) tips.push('ð§ï¸ Ø£ÙØ·Ø§Ø± â Ø£Ø¬ÙÙ Ø§ÙØ±Ø´ ÙØ§ÙØªØ³ÙÙØ¯');
  if (weather.daily?.wind_speed_10m_max?.[0] > 30) tips.push('ð¨ Ø±ÙØ§Ø­ ÙÙÙØ© â Ø«Ø¨ÙØª Ø§ÙØ³Ø¨Ø§Ø·Ø§Øª ÙØ§ÙØ¨Ø±Ø§ÙÙØ²');
  if (weather.daily?.uv_index_max?.[0] > 8) tips.push('ð Ø£Ø´Ø¹Ø© UV Ø¹Ø§ÙÙØ© â ÙØªØ±Ø© ÙØ«Ø§ÙÙØ© ÙÙØ¶Ø¬ Ø§ÙØ¨ÙØ­');
  if (tips.length === 0 && temp >= 25 && temp <= 35) tips.push('ð¿ Ø·ÙØ³ ÙØ«Ø§ÙÙ ÙÙØ¹ÙÙ ÙÙ Ø§ÙÙØ²Ø±Ø¹Ø©');

  return (
    <div>
      <SectionCard title="Ø§ÙØ·ÙØ³ Ø§ÙØ­Ø§ÙÙ â ÙØ§ÙÙØ³, Ø§ÙØ´Ø±ÙÙØ©" subtitle="">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20 }}>
          <div style={{ fontSize: 64 }}>{weatherIcon(weather.current?.weather_code || 0)}</div>
          <div>
            <div style={{ fontSize: 48, fontWeight: 700, color: C.text }}>{temp}Â°C</div>
            <div style={{ color: C.muted, fontSize: 14 }}>
              Ø±Ø·ÙØ¨Ø© {weather.current?.relative_humidity_2m}% | Ø±ÙØ§Ø­ {weather.current?.wind_speed_10m} ÙÙ/Ø³
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="ØªÙÙØ¹Ø§Øª 7 Ø£ÙØ§Ù" subtitle="">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {weather.daily?.time?.map((date: string, i: number) => {
            const d = new Date(date);
            return (
              <div key={date} style={{ background: C.cardHover, borderRadius: 10, padding: 12, textAlign: 'center' }}>
                <div style={{ color: C.muted, fontSize: 11 }}>{days[d.getDay()]}</div>
                <div style={{ fontSize: 28, margin: '8px 0' }}>{weatherIcon(weather.daily.weather_code[i])}</div>
                <div style={{ color: C.red, fontSize: 14, fontWeight: 600 }}>{weather.daily.temperature_2m_max[i]}Â°</div>
                <div style={{ color: C.blue, fontSize: 12 }}>{weather.daily.temperature_2m_min[i]}Â°</div>
                {weather.daily.precipitation_sum[i] > 0 && (
                  <div style={{ color: C.teal, fontSize: 10, marginTop: 4 }}>ð§ {weather.daily.precipitation_sum[i]}mm</div>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

      {tips.length > 0 && (
        <SectionCard title="ÙØµØ§Ø¦Ø­ Ø²Ø±Ø§Ø¹ÙØ©" subtitle="">
          <div style={{ fontSize: 14, color: C.text, lineHeight: 2 }}>
            {tips.map((tip, i) => <div key={i}>{tip}</div>)}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ====== MAIN DASHBOARD ======
export default function AnalyticsDashboard() {
  const [page, setPage] = useState('sectors');

  const renderPage = () => {
    switch (page) {
      case 'sectors': return <SectorAnalysis />;
      case 'details': return <SectorDetails />;
      case 'costs': return <CostAnalysis />;
      case 'expenses': return <ExpenseLog />;
      case 'seedlings': return <Seedlings />;
      case 'scorecard': return <Scorecard />;
      case 'outlook': return <FutureOutlook />;
      case 'weather': return <Weather />;
      default: return <SectorAnalysis />;
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', direction: 'rtl', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      {/* Header */}
      <div style={{
        background: C.card, borderBottom: `1px solid ${C.border}`, padding: '12px 24px',
        position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 20 }}>
          <span style={{ fontSize: 28 }}>ð´</span>
          <div>
            <div style={{ color: C.text, fontSize: 16, fontWeight: 700 }}>ÙØ²Ø§Ø±Ø¹ Ø¹Ø¨ÙØ¯</div>
            <div style={{ color: C.muted, fontSize: 11 }}>ÙØ®ÙÙ Ø¨ÙØ­ Ø¨Ø±Ø­Ù Â· 115 ÙØ¯Ø§Ù</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1 }}>
          {PAGES.map(p => (
            <button key={p.id} onClick={() => setPage(p.id)} style={{
              padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
              background: page === p.id ? C.blue + '22' : 'transparent',
              color: page === p.id ? C.blueLight : C.muted,
              border: page === p.id ? `1px solid ${C.blue}` : '1px solid transparent',
              borderBottom: page === p.id ? `2px solid ${C.blue}` : '2px solid transparent',
            }}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
        {renderPage()}
      </div>
    </div>
  );
}
