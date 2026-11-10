import { useState } from 'react';
import Dashboard from './components/Dashboard';
import FileUploader from './components/FileUploader';
import AuditTable from './components/AuditTable';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { Activity, Radio, Globe } from 'lucide-react';
import { LanguageProvider, useLanguage } from './i18n.jsx';

function AppContent() {
  const [reloadKey, setReloadKey] = useState(0);
  const { lang, changeLanguage, t } = useLanguage();

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
              <h1 className="text-2xl font-bold tracking-tight text-white">{t('appTitle')}</h1>
              <p className="text-xs text-gray-400 font-mono">{t('appSubtitle')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1 text-xs font-mono">
              <Globe size={14} className="text-blue-400 ml-1.5 mr-0.5" />
              <button
                onClick={() => changeLanguage('en')}
                className={`px-2 py-0.5 rounded transition-colors ${lang === 'en' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-gray-200'}`}
                title="English"
              >
                EN
              </button>
              <button
                onClick={() => changeLanguage('de')}
                className={`px-2 py-0.5 rounded transition-colors ${lang === 'de' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-gray-200'}`}
                title="Deutsch"
              >
                DE
              </button>
              <button
                onClick={() => changeLanguage('es')}
                className={`px-2 py-0.5 rounded transition-colors ${lang === 'es' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-gray-200'}`}
                title="Español"
              >
                ES
              </button>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 bg-gray-900 border border-gray-800 rounded-lg text-xs font-mono text-gray-300">
              <Radio size={14} className="text-green-400" />
              <span>{t('fastApiStatus')}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 mt-4">
        <h2 className="text-xl font-semibold mb-6 text-gray-300 flex items-center gap-2">
          {t('telemetryTitle')}
        </h2>
        
        {/* Tarjetas de estado con WebSocket reactivo */}
        <Dashboard reloadTrigger={reloadKey} />

        {/* Sección de Configuración */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileUploader onUploadSuccess={handleConfigUpdated} />
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">{t('systemInfoTitle')}</h3>
              <p className="text-sm text-gray-400 mb-4">
                {t('systemInfoDesc')}
              </p>
            </div>

            <div className="bg-gray-950 p-3 rounded border border-gray-700 text-xs font-mono text-gray-300 space-y-1">
              <div>{t('protoSpecs1')}</div>
              <div>{t('protoSpecs2')}</div>
              <div>{t('protoSpecs3')}</div>
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

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
