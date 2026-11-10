import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { BarChart3, TrendingUp } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';

export default function AnalyticsDashboard() {
  const { t } = useLanguage();
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
        console.error("Error cargando datos para analítica", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();

    const interval = setInterval(fetchHistory, 15000);
    return () => clearInterval(interval);
  }, []);

  const dataByGroup = useMemo(() => {
    const counts = {};
    events.forEach(ev => {
      const grupo = ev.grupo || 'General';
      counts[grupo] = (counts[grupo] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({
      name: key,
      Alarmas: counts[key]
    })).sort((a, b) => b.Alarmas - a.Alarmas);
  }, [events]);

  const dataByDate = useMemo(() => {
    const counts = {};
    events.forEach(ev => {
      if (!ev.fecha_inicio) return;
      const dateStr = ev.fecha_inicio.split('T')[0]; 
      counts[dateStr] = (counts[dateStr] || 0) + 1;
    });
    
    return Object.keys(counts).sort().map(date => {
      const parts = date.split('-');
      const day = parts[2] || parts[0];
      const month = parts[1] || parts[0];
      return {
        fechaDate: date,
        fecha: `${day}/${month}`,
        Eventos: counts[date]
      };
    });
  }, [events]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-600 p-3 rounded shadow-xl">
          <p className="text-gray-300 font-semibold mb-1">{label}</p>
          <p className="text-blue-400 font-bold">
            Total: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) return <div className="text-gray-400 p-4">...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      
      {/* Gráfico 1: Distribución por Grupos */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-md">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="text-blue-400" />
          <h3 className="text-lg font-semibold text-white">{t('alarmsByGroup')}</h3>
        </div>
        <div className="h-64 w-full">
          {dataByGroup.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-gray-500 font-mono">
              ---
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataByGroup} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" stroke="#9CA3AF" tick={{fill: '#9CA3AF', fontSize: 12}} />
                <YAxis stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} allowDecimals={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="Alarmas" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Gráfico 2: Tendencia Temporal */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-md">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="text-blue-400" />
          <h3 className="text-lg font-semibold text-white">{t('alarmsByTrend')}</h3>
        </div>
        <div className="h-64 w-full">
          {dataByDate.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-gray-500 font-mono">
              ---
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataByDate} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorEventos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="fecha" stroke="#9CA3AF" tick={{fill: '#9CA3AF', fontSize: 12}} />
                <YAxis stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} allowDecimals={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Eventos" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorEventos)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
}
