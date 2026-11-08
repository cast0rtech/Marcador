import React from 'react';
import { 
  Flame, 
  Thermometer, 
  ShieldCheck, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Mail 
} from 'lucide-react';

function getGroupIcon(groupName) {
  const name = (groupName || '').toLowerCase();
  if (name.includes('incendio') || name.includes('fuego')) {
    return <Flame className="w-5 h-5 text-red-400" />;
  }
  if (name.includes('clima') || name.includes('hvac') || name.includes('temperatura')) {
    return <Thermometer className="w-5 h-5 text-cyan-400" />;
  }
  if (name.includes('acceso') || name.includes('seguridad') || name.includes('puerta')) {
    return <ShieldCheck className="w-5 h-5 text-indigo-400" />;
  }
  if (name.includes('energia') || name.includes('electric') || name.includes('potencia')) {
    return <Zap className="w-5 h-5 text-amber-400" />;
  }
  return <Layers className="w-5 h-5 text-blue-400" />;
}

export default function AlarmGroupCards({ groups = [] }) {
  if (!groups || groups.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-sm">
        No hay grupos de alarma registrados en el sistema.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {groups.map((group) => {
        const hasAlarm = group.active_alarms > 0 || group.status === 'Alarma Activa';

        return (
          <div
            key={group.id}
            className={`relative overflow-hidden rounded-xl border transition-all duration-300 p-5 flex flex-col justify-between ${
              hasAlarm
                ? 'bg-gradient-to-b from-red-950/40 to-slate-900 border-red-700/80 shadow-lg shadow-red-950/30'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            {/* Ambient Indicator Glow */}
            <div
              className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none transition-all ${
                hasAlarm ? 'bg-red-500/20' : 'bg-emerald-500/10'
              }`}
            />

            <div>
              {/* Header: Icon + Status Pill */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                    {getGroupIcon(group.name)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-base tracking-tight">
                      {group.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {group.description || 'Monitoreo de telemetría'}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                {hasAlarm ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Alarma
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    OK
                  </span>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div>
                  <span className="text-[11px] uppercase font-mono text-slate-400 block">Puntos</span>
                  <span className="text-lg font-bold font-mono text-slate-100">
                    {group.total_points}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-mono text-slate-400 block">Alarmas</span>
                  <span
                    className={`text-lg font-bold font-mono ${
                      hasAlarm ? 'text-red-400' : 'text-slate-400'
                    }`}
                  >
                    {group.active_alarms}
                  </span>
                </div>
              </div>
            </div>

            {/* Notification Email Footer */}
            <div className="mt-2 pt-2.5 border-t border-slate-800/80 flex items-center gap-1.5 text-xs text-slate-400 font-mono truncate">
              <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate" title={group.notification_email || 'Enrutado por defecto'}>
                {group.notification_email || 'Enrutado por defecto'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

