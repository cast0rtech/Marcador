import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { BarChart3, Clock } from 'lucide-react';

const CATEGORY_COLORS = {
  incendios: '#ef4444', // Red
  incendio: '#ef4444',
  clima: '#06b6d4',     // Cyan
  hvac: '#06b6d4',
  accesos: '#818cf8',   // Indigo
  seguridad: '#818cf8',
  energia: '#f59e0b',   // Amber
};

function getBarColor(categoryName = '') {
  const key = categoryName.toLowerCase().trim();
  for (const [prefix, color] of Object.entries(CATEGORY_COLORS)) {
    if (key.includes(prefix)) return color;
  }
  return '#3b82f6'; // Default Blue
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700/80 p-3 rounded-lg shadow-xl text-xs">
        <p className="font-semibold text-slate-200 mb-1">{label}</p>
        <p className="text-blue-400 font-mono">
          Alarmas disparadas (24h): <span className="font-bold text-white">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function AlarmsChart({ data = [] }) {
  const totalAlarms24h = (data || []).reduce((acc, curr) => acc + (curr.count || 0), 0);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              Alarmas Disparadas (Últimas 24 Horas)
            </h2>
            <p className="text-xs text-slate-400">
              Distribución de eventos por categoría y subsistema
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>Total 24h: <strong className="text-white">{totalAlarms24h}</strong></span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full mt-2">
        {(!data || data.length === 0) ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 font-mono">
            Sin alarmas registradas en las últimas 24 horas.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
              <XAxis
                dataKey="category"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.category)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

