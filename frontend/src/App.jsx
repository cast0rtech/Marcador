import { useState } from 'react';
import Dashboard from './components/Dashboard';
import FileUploader from './components/FileUploader';
import AuditTable from './components/AuditTable';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { Activity, Radio } from 'lucide-react';

export default function App() {
  const [reloadKey, setReloadKey] = useState(0);

  const handleConfigUpdated = () => {
    console.log("Configuración actualizada, recargando estado del sistema...");
    setReloadKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      {/* Topbar */}
      <header className="bg-gray-950 border-b border-gray-800 p-4 shadow-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="text-blue-500 animate-pulse" size={28} />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">BMS Industrial Control</h1>
              <p className="text-xs text-gray-400 font-mono">SCADA Engine • Modbus TCP & BACnet/IP</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-900 border border-gray-800 rounded-lg text-xs font-mono text-gray-300">
            <Radio size={14} className="text-green-400" />
            <span>FastAPI Core: Online</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 mt-4">
        <h2 className="text-xl font-semibold mb-6 text-gray-300 flex items-center gap-2">
          Monitor de Telemetría en Tiempo Real
        </h2>
        
        {/* Tarjetas de estado con WebSocket reactivo */}
        <Dashboard reloadTrigger={reloadKey} />

        {/* Sección de Configuración */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileUploader onUploadSuccess={handleConfigUpdated} />
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Información del Sistema</h3>
              <p className="text-sm text-gray-400 mb-4">
                El motor Modbus/BACnet está escaneando los equipos en segundo plano mediante un bucle asíncrono dinámico. 
                Sube un nuevo archivo Excel o CSV para mapear nuevos registros PLC sin necesidad de reiniciar el servidor.
              </p>
            </div>

            <div className="bg-gray-950 p-3 rounded border border-gray-700 text-xs font-mono text-gray-300 space-y-1">
              <div>• Protocolos soportados: Modbus TCP (Port 502) / BACnet/IP (Port 47808)</div>
              <div>• Ciclo de telemetría: 2 segundos por ciclo (asyncio.gather)</div>
              <div>• Conexión frontend: WebSocket nativo (/ws) con latencia &lt; 10ms</div>
            </div>
          </div>
        </div>

        {/* Panel de Gráficas y Métricas Analíticas */}
        <AnalyticsDashboard />

        {/* Tabla de Auditoría y Trazabilidad de Alarmas */}
        <AuditTable />
      </main>
    </div>
  );
}
