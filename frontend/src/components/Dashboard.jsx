import { useState, useEffect, useRef } from 'react';
import { ServerCrash, CheckCircle, BellRing } from 'lucide-react';

export default function Dashboard() {
  // Estado inicial de grupos
  const [systemGroups, setSystemGroups] = useState([
    { name: 'Climatización Planta 1', status: 'OK', activeAlarms: 0 },
    { name: 'Centro de Datos (Rack)', status: 'OK', activeAlarms: 0 },
    { name: 'Accesos y Seguridad', status: 'OK', activeAlarms: 0 },
  ]);

  const [lastEvent, setLastEvent] = useState(null);
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
  }, []);

  // 2. Conectar al WebSocket de FastAPI para recibir deltas en tiempo real
  useEffect(() => {
    const isDev = window.location.port === '3000' || window.location.port === '5173';
    const wsHost = isDev ? 'localhost:8000' : window.location.host;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${wsHost}/ws/alarms`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => console.log("⚡ [BMS] WebSocket Conectado a", wsUrl);
    
    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📡 Evento BMS recibido:", data);
        
        setLastEvent(data); // Guardar el último evento para mostrar notificación UI flotante

        setSystemGroups((prevGroups) => {
          return prevGroups.map((group) => {
            // Comparar por nombre exacto o inclusión de subcadena
            const match =
              group.name === data.group ||
              group.name.toLowerCase().includes(String(data.group).toLowerCase()) ||
              String(data.group).toLowerCase().includes(group.name.toLowerCase());

            if (match) {
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
        console.error("Error procesando mensaje WebSocket:", err);
      }
    };

    ws.current.onclose = () => console.log("WebSocket Desconectado");

    // Limpieza al desmontar el componente
    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Alerta flotante del último evento recibido */}
      {lastEvent && (
        <div className={`p-4 rounded border flex items-center gap-3 transition-all duration-300 ${
          lastEvent.type === 'ALARM_TRIGGERED' 
            ? 'bg-red-900/50 border-red-500 text-red-100 animate-pulse' 
            : 'bg-green-900/50 border-green-500 text-green-100'
        }`}>
          <BellRing size={20} className="shrink-0" />
          <span>
            <strong>{lastEvent.point_name}</strong> - 
            {lastEvent.type === 'ALARM_TRIGGERED' ? ' ¡Fallo detectado!' : ' Sistema restablecido.'}
            <span className="text-xs opacity-75 font-mono ml-2">({lastEvent.group})</span>
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
                : 'bg-red-900/20 border-red-500 animate-pulse'
            }`}
          >
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold text-gray-100">{sys.name}</h3>
              {sys.status === 'OK' ? (
                <CheckCircle className="text-green-500" size={28} />
              ) : (
                <ServerCrash className="text-red-500 animate-bounce" size={28} />
              )}
            </div>
            
            <div>
              <span className="text-sm text-gray-400 uppercase tracking-wider">Estado</span>
              <div className={`text-2xl font-black mt-1 ${sys.status === 'OK' ? 'text-green-400' : 'text-red-500'}`}>
                {sys.status === 'OK' ? 'NORMAL' : `${sys.activeAlarms} ALARMA(S)`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
