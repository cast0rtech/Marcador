import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function AuditTable() {
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
    
    // Refrescar la tabla cada 10 segundos
    const interval = setInterval(fetchHistory, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return '---';
    return new Date(isoString).toLocaleString('es-ES', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  if (loading) return <div className="text-gray-400 p-4">Cargando auditoría...</div>;

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-md overflow-hidden mt-8">
      <div className="p-4 border-b border-gray-700 bg-gray-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Registro de Auditoría y Trazabilidad</h3>
        </div>
        <span className="text-xs text-gray-400 font-mono">Últimos {events.length} eventos</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-gray-700">
            <tr>
              <th className="px-4 py-3">Timestamp / Inicio</th>
              <th className="px-4 py-3">Grupo y Punto</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Notificaciones (Escalado)</th>
              <th className="px-4 py-3">Resolución</th>
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
                    ev.estado === 'Generada' ? 'bg-red-900/50 text-red-400 border border-red-500/50' : 
                    ev.estado === 'Resuelta' ? 'bg-green-900/50 text-green-400 border border-green-500/50' : 
                    'bg-yellow-900/50 text-yellow-400 border border-yellow-500/50'
                  }`}>
                    {ev.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs font-mono text-gray-400">
                  {ev.notificaciones.length === 0 ? (
                    <span className="text-gray-600">Sin notificaciones</span>
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
                      <AlertCircle size={14} /> Activa
                    </div>
                  )}
                </td>
              </tr>
            ))}
            
            {events.length === 0 && (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                  No hay eventos registrados en la base de datos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

