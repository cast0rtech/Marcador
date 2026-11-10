import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, AlertCircle, CheckCircle, Clock, Download } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';

export default function AuditTable() {
  const { lang, t } = useLanguage();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const isDev = window.location.port === '3000' || window.location.port === '5173';
        const apiBase = isDev ? 'http://localhost:8000' : '';
        const response = await axios.get(`${apiBase}/api/alarms/history`);
        setEvents(response.data);
      } catch (error) {
        console.error("Error cargando historial", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return '---';
    const locale = lang === 'de' ? 'de-DE' : lang === 'es' ? 'es-ES' : 'en-US';
    return new Date(isoString).toLocaleString(locale, { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const getStatusLabel = (estado) => {
    if (estado === 'Resuelta' || estado === 'Resolved') return t('statusResolved');
    return t('statusActive');
  };

  const handleExportPdf = () => {
    const isDev = window.location.port === '3000' || window.location.port === '5173';
    const apiBase = isDev ? 'http://localhost:8000' : '';
    window.open(`${apiBase}/api/alarms/export/pdf?lang=${lang}`, '_blank');
  };

  if (loading) return <div className="text-gray-400 p-4">{t('auditLoading')}</div>;

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-md overflow-hidden mt-8">
      <div className="p-4 border-b border-gray-700 bg-gray-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FileText className="text-blue-400" />
          <h3 className="text-lg font-semibold text-white">{t('auditTitle')}</h3>
          <span className="text-xs text-gray-400 font-mono ml-2">
            ({t('auditLastEvents', { count: events.length })})
          </span>
        </div>
        
        <button 
          onClick={handleExportPdf}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded text-xs font-semibold shadow transition-colors active:scale-95"
          title={t('exportPdf')}
        >
          <Download size={15} />
          {t('exportPdf')}
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-gray-700">
            <tr>
              <th className="px-4 py-3">{t('colTimestamp')}</th>
              <th className="px-4 py-3">{t('colGroupPoint')}</th>
              <th className="px-4 py-3">{t('colStatus')}</th>
              <th className="px-4 py-3">{t('colNotif')}</th>
              <th className="px-4 py-3">{t('colResolution')}</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                <td className="px-4 py-3 font-mono text-xs">
                  <div className="flex items-center gap-1">
                    <Clock size={14} className="text-gray-500" />
                    {formatDate(ev.fecha_inicio)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-white">{ev.punto}</div>
                  <div className="text-xs text-gray-500">{ev.grupo}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    ev.estado === 'Generada' || ev.estado === 'Active' ? 'bg-red-900/50 text-red-400 border border-red-500/50' : 
                    ev.estado === 'Resuelta' || ev.estado === 'Resolved' ? 'bg-green-900/50 text-green-400 border border-green-500/50' : 
                    'bg-yellow-900/50 text-yellow-400 border border-yellow-500/50'
                  }`}>
                    {getStatusLabel(ev.estado)}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs font-mono text-gray-400">
                  {ev.notificaciones.length === 0 ? (
                    <span className="text-gray-600">---</span>
                  ) : (
                    <ul className="list-disc list-inside">
                      {ev.notificaciones.map((notif, i) => (
                        <li key={i}>{notif}</li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {ev.fecha_resolucion ? (
                    <div className="flex items-center gap-1 text-green-400">
                      <CheckCircle size={14} />
                      {formatDate(ev.fecha_resolucion)}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-400 animate-pulse">
                      <AlertCircle size={14} /> {t('statusActive')}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            
            {events.length === 0 && (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                  ---
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
