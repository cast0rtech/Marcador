import { useState, useEffect } from 'react';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import FileUploader from './components/FileUploader';
import AuditTable from './components/AuditTable';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import UserManagement from './components/UserManagement';
import Login from './components/Login';
import { Activity, Radio, Globe, User, LogOut, Shield } from 'lucide-react';
import { LanguageProvider, useLanguage } from './i18n.jsx';

function AppContent() {
  const [reloadKey, setReloadKey] = useState(0);
  const { lang, changeLanguage, t } = useLanguage();

  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('bms_token');
    const role = localStorage.getItem('bms_role') || '';
    const username = localStorage.getItem('bms_username') || '';
    return {
      token,
      role,
      username,
      isAuthenticated: Boolean(token),
    };
  });

  useEffect(() => {
    // Interceptor para inyectar token Bearer en peticiones salientes de Axios
    const reqInterceptor = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('bms_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Interceptor para detectar expiración de sesión (401)
    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          console.warn("Token expirado o no autorizado. Redirigiendo a login...");
          handleLogout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, []);

  const handleLoginSuccess = ({ token, role, username }) => {
    setAuth({
      token,
      role,
      username,
      isAuthenticated: true,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('bms_token');
    localStorage.removeItem('bms_role');
    localStorage.removeItem('bms_username');
    setAuth({
      token: null,
      role: '',
      username: '',
      isAuthenticated: false,
    });
  };

  const handleConfigUpdated = () => {
    console.log("Configuración actualizada, recargando estado del sistema...");
    setReloadKey((prev) => prev + 1);
  };

  // Si no está autenticado, mostramos la pantalla de login
  if (!auth.isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      {/* Topbar */}
      <header className="bg-gray-950 border-b border-gray-800 p-4 shadow-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Activity className="text-blue-500 animate-pulse" size={28} />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">{t('appTitle')}</h1>
              <p className="text-xs text-gray-400 font-mono">{t('appSubtitle')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            {/* User Badge */}
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-900 border border-gray-800 rounded-lg text-xs font-mono">
              <User size={13} className="text-blue-400" />
              <span className="font-semibold text-gray-200">{auth.username}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
                auth.role === 'root' ? 'bg-red-950 text-red-400 border border-red-800' :
                auth.role === 'admin' ? 'bg-purple-950 text-purple-400 border border-purple-800' :
                'bg-blue-950 text-blue-400 border border-blue-800'
              }`}>
                {auth.role}
              </span>
            </div>

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

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1 bg-red-950 hover:bg-red-900/80 border border-red-800/80 text-red-300 rounded-lg text-xs font-mono transition-colors cursor-pointer"
              title={t('logout')}
            >
              <LogOut size={13} />
              <span>{t('logout')}</span>
            </button>
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

        {/* Panel de Gestión de Usuarios y Seguridad (Solo visible para ROOT) */}
        <UserManagement />

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
