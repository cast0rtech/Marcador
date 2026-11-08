import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Mail, 
  MailCheck, 
  MailX,
  Radio
} from 'lucide-react';

function formatDate(dateString) {
  if (!dateString) return null;
  try {
    const d = new Date(dateString);
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export default function AuditDataGrid({ events = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const dp = ev.data_point || ev.datapoint;
      const dpName = dp?.name || `DataPoint #${ev.data_point_id || ev.datapoint_id}`;
      const groupName = dp?.group?.name || dp?.alarm_group?.name || '';
      const notif = ev.notifications?.[0] || ev.notification_logs?.[0];
      const recipient = notif?.recipient || '';

      const matchesSearch =
        dpName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipient.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      const evStatus = ev.status || ev.state;
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'ACTIVE') return evStatus !== 'Resuelta';
      if (statusFilter === 'RESOLVED') return evStatus === 'Resuelta';

      return evStatus === statusFilter;
    });
  }, [events, searchTerm, statusFilter]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
      {/* Table Header and Controls */}
      <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              Auditoría Histórica de AlarmEvent
            </h2>
            <p className="text-xs text-slate-400">
              Registro secuencial de incidencias, notificaciones SMTP y resolución
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar punto, grupo, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950/80 border border-slate-700/80 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 w-52 sm:w-64 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500 font-mono"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-700/80 p-1 rounded-lg text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                statusFilter === 'ACTIVE'
                  ? 'bg-red-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Activas
            </button>
            <button
              onClick={() => setStatusFilter('RESOLVED')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                statusFilter === 'RESOLVED'
                  ? 'bg-emerald-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Resueltas
            </button>
          </div>
        </div>
      </div>

      {/* DataGrid Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px] tracking-wider">
              <th className="py-3 px-4">Punto Afectado</th>
              <th className="py-3 px-4">Grupo / Categoría</th>
              <th className="py-3 px-4">Hora Inicio (Alarma)</th>
              <th className="py-3 px-4">Notificado por Email</th>
              <th className="py-3 px-4">Hora Resolución</th>
              <th className="py-3 px-4 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-10 text-center text-slate-500 font-mono">
                  No se encontraron eventos de alarma que coincidan con el criterio.
                </td>
              </tr>
            ) : (
              filteredEvents.map((ev) => {
                const dp = ev.data_point || ev.datapoint;
                const notif = ev.notifications?.[0] || ev.notification_logs?.[0];
                const isResolved = ev.status === 'Resuelta' || ev.state === 'Resuelta' || ev.resolved_at !== null;
                const dpAddress = dp?.address || dp?.register_address || '';
                const startTime = ev.created_at || ev.started_at;

                return (
                  <tr
                    key={ev.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Punto Afectado */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">
                        {dp?.name || `Punto #${ev.data_point_id || ev.datapoint_id}`}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {dp?.protocol || 'Protocolo'}
                        </span>
                        <span>{dp?.ip_address}:{dpAddress}</span>
                      </div>
                    </td>

                    {/* Grupo / Categoría */}
                    <td className="py-3.5 px-4 font-medium text-slate-300">
                      <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-xs">
                        {dp?.group?.name || dp?.alarm_group?.name || 'General'}
                      </span>
                    </td>

                    {/* Timestamp Inicio */}
                    <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-red-400" />
                        <span>{formatDate(startTime)}</span>
                      </div>
                    </td>

                    {/* Notificado por Email */}
                    <td className="py-3.5 px-4 font-mono">
                      {notif ? (
                        <div className="flex items-center gap-1.5">
                          {notif.delivery_status === 'delivered' || notif.success ? (
                            <MailCheck className="w-4 h-4 text-emerald-400 shrink-0" title="Email enviado con éxito" />
                          ) : (
                            <MailX className="w-4 h-4 text-red-400 shrink-0" title={`Fallo: ${notif.delivery_status || notif.error_message || 'Error SMTP'}`} />
                          )}
                          <span
                            className="truncate max-w-[200px] text-xs text-slate-300"
                            title={notif.recipient}
                          >
                            {notif.recipient}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-slate-500 text-xs">
                          <Mail className="w-3.5 h-3.5" />
                          <span>Sin notificación</span>
                        </div>
                      )}
                    </td>

                    {/* Timestamp Resolución */}
                    <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                      {ev.resolved_at ? (
                        <div className="flex items-center gap-1.5 text-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{formatDate(ev.resolved_at)}</span>
                        </div>
                      ) : (
                        <span className="text-amber-400/80 italic text-xs font-sans">
                          Pendiente de resolución
                        </span>
                      )}
                    </td>

                    {/* Estado Badge */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {isResolved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Resuelta
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                          <AlertCircle className="w-3 h-3" />
                          {ev.status || ev.state || 'Generada'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Summary */}
      <div className="p-3.5 bg-slate-950/70 border-t border-slate-800 text-xs text-slate-400 font-mono flex items-center justify-between">
        <span>Mostrando {filteredEvents.length} de {events.length} eventos registrados</span>
        <span>Auditoría BMS v1.0.0</span>
      </div>
    </div>
  );
}

