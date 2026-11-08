import React from 'react';
import { Activity, RefreshCw, Radio, HardDrive, ShieldCheck } from 'lucide-react';

export default function Navbar({ onRefresh, isRefreshing, lastUpdated, totalActiveAlarms }) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Logo and System Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                SCADA / BMS Core
              </h1>
              <span className="px-2 py-0.5 text-xs font-mono font-medium rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                v1.0.0
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Building Management System • Modbus TCP & BACnet/IP Telemetry
            </p>
          </div>
        </div>

        {/* Global Status Badges & Controls */}
        <div className="flex items-center flex-wrap gap-3">
          {/* Active Alarms Indicator */}
          {totalActiveAlarms > 0 ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-950/80 border border-red-800/80 text-red-300 text-xs font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>{totalActiveAlarms} ALARMA{totalActiveAlarms > 1 ? 'S' : ''} ACTIVA{totalActiveAlarms > 1 ? 'S' : ''}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>SISTEMA NOMINAL (OK)</span>
            </div>
          )}

          {/* Engine Status */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-slate-300 text-xs">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono">Engine: Polling 5s</span>
          </div>

          {/* Timestamp */}
          <div className="text-xs font-mono text-slate-400">
            {lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--:--'}
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-all active:scale-95 disabled:opacity-50"
            title="Recargar datos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>
    </header>
  );
}

