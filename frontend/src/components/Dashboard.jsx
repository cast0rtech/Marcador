import { useState, useEffect, useRef } from 'react';
import { ServerCrash, CheckCircle, BellRing, WifiOff, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';

export default function Dashboard({ reloadTrigger }) {
  const { t } = useLanguage();

  const [systemGroups, setSystemGroups] = useState([
    { name: 'Climatización Planta 1', status: 'OK', activeAlarms: 0 },
    { name: 'Centro de Datos (Rack)', status: 'OK', activeAlarms: 0 },
    { name: 'Accesos y Seguridad', status: 'OK', activeAlarms: 0 },
  ]);

  const [lastEvent, setLastEvent] = useState(null);
  const [offlinePLCs, setOfflinePLCs] = useState([]); // Estado exclusivo para el Watchdog
  const ws = useRef(null);

  // 1. Cargar estado inicial previo desde la API
  useEffect(() => {
    const isDev = window.location.port === '3000' || window.location.port === '5173';
    const apiBase = isDev ? 'http://localhost:8000' : '';

    fetch(`${apiBase}/dashboard/summary`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.groups && data.groups.length > 0) {
          setSystemGroups(
            data.groups.map((g) => ({
              name: g.name,
              status: g.active_alarms > 0 ? 'ALARM' : 'OK',
              activeAlarms: g.active_alarms,
            }))
          );
        }
      })
      .catch((err) => console.log('Usando grupos iniciales:', err.message));
  }, [reloadTrigger]);

  // 2. Conectar al WebSocket de FastAPI para telemetría en tiempo real
  useEffect(() => {
    const isDev = window.location.port === '3000' || window.location.port === '5173';
    const wsHost = isDev ? 'localhost:8000' : window.location.host;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const token = localStorage.getItem('bms_token');
    const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';
    const wsUrl = `${wsProtocol}//${wsHost}/ws/alarms${tokenQuery}`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => console.log("⚡ [BMS] WebSocket Conectado:", wsUrl);

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Evento BMS recibido:", data);

        // 1. Interceptar Eventos del Watchdog (Caída de Red / Vía de Transmisión)
        if (data.group === "SISTEMA - WATCHDOG") {
          // Extraemos la IP del texto (ej. "Pérdida de Comunicación IP: 192.168.1.50")
          const ipMatch = data.point_name ? data.point_name.match(/IP:\s*([\d\.]+)/) : null;
          const ip = ipMatch ? ipMatch[1] : (data.point_name || 'Desconocida');

          if (data.type === "ALARM_TRIGGERED") {
            setOfflinePLCs((prev) => [...new Set([...prev, ip])]);
          } else if (data.type === "ALARM_RESOLVED") {
            setOfflinePLCs((prev) => prev.filter((p) => p !== ip));
          }
          return; // Detenemos aquí para que no cree una tarjeta de grupo normal
        }

        // 2. Procesar Eventos Físicos (Normales)
        setLastEvent(data);

        setSystemGroups((prevGroups) => {
          // Si el grupo no existe en el estado actual, lo creamos dinámicamente
          const groupExists = prevGroups.find(
            (g) => g.name === data.group || String(g.name).toLowerCase() === String(data.group).toLowerCase()
          );
          let updatedGroups = prevGroups;

          if (!groupExists) {
            updatedGroups = [...prevGroups, { name: data.group, status: 'OK', activeAlarms: 0 }];
          }

          return updatedGroups.map((group) => {
            const isMatch =
              group.name === data.group ||
              String(group.name).toLowerCase() === String(data.group).toLowerCase();

            if (isMatch) {
              if (data.type === "ALARM_TRIGGERED") {
                return { ...group, status: 'ALARM', activeAlarms: group.activeAlarms + 1 };
              } else if (data.type === "ALARM_RESOLVED") {
                const remaining = Math.max(0, group.activeAlarms - 1);
                return { ...group, activeAlarms: remaining, status: remaining === 0 ? 'OK' : 'ALARM' };
              }
            }
            return group;
          });
        });
      } catch (err) {
        console.error("Error procesando WebSocket:", err);
      }
    };

    ws.current.onclose = () => console.log("WebSocket Desconectado");

    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* --- BANNER CRÍTICO DEL WATCHDOG (Caída de red PLC) --- */}
      {offlinePLCs.length > 0 && (
        <div className="bg-red-950 border-2 border-red-500 rounded-lg p-5 flex flex-col md:flex-row items-center justify-between shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <div className="bg-red-600 p-3 rounded-full animate-bounce">
              <WifiOff className="text-white w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle size={24} /> {t('watchdogBannerTitle')}
              </h2>
              <p className="text-red-200 font-medium">
                {t('watchdogBannerDesc', { count: offlinePLCs.length })}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-red-400 font-bold mb-2 uppercase tracking-widest font-mono">
              {t('watchdogInaccessibleNodes')}
            </span>
            <div className="flex flex-wrap gap-2 justify-end">
              {offlinePLCs.map((ip) => (
                <span
                  key={ip}
                  className="bg-black/60 text-red-400 px-3 py-1.5 rounded border border-red-500/60 font-mono text-lg font-bold shadow-inner"
                >
                  {ip}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Alerta flotante del último evento recibido (Pop-up) */}
      {lastEvent && lastEvent.group !== "SISTEMA - WATCHDOG" && (
        <div
          className={`p-4 rounded border flex items-center justify-between transition-all duration-300 ${
            lastEvent.type === 'ALARM_TRIGGERED'
              ? 'bg-orange-900/50 border-orange-500 text-orange-100 shadow-md'
              : 'bg-green-900/50 border-green-500 text-green-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <BellRing size={20} className="shrink-0" />
            <span>
              <strong>{lastEvent.point_name}</strong> -{' '}
              {lastEvent.type === 'ALARM_TRIGGERED'
                ? ` ${t('watchdogFaultDetected')}`
                : ` ${t('watchdogSystemRestored')}`}
            </span>
          </div>
          <span className="text-xs font-mono opacity-70">
            {new Date().toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* Tarjetas de Grupos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {systemGroups.map((sys, idx) => (
          <div
            key={idx}
            className={`p-6 rounded-lg border shadow-lg flex flex-col gap-4 transition-all duration-300 ${
              sys.status === 'OK'
                ? 'bg-gray-800 border-gray-700'
                : 'bg-red-900/30 border-red-500 animate-pulse'
            }`}
          >
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold text-gray-100">{sys.name}</h3>
              {sys.status === 'OK' ? (
                <CheckCircle className="text-green-500" size={28} />
              ) : (
                <ServerCrash className="text-red-500" size={28} />
              )}
            </div>

            <div>
              <span className="text-sm text-gray-400 uppercase tracking-wider">
                {t('subsystemStatus')}
              </span>
              <div
                className={`text-2xl font-black mt-1 ${
                  sys.status === 'OK' ? 'text-green-400' : 'text-red-500'
                }`}
              >
                {sys.status === 'OK' ? t('statusNormal') : `${sys.activeAlarms} ${t('statusAlarm')}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
