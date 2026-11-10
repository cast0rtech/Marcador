import { useState } from 'react';
import axios from 'axios';
import { ShieldCheck, Lock, User, KeyRound, AlertCircle, Globe, Terminal } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';

export default function Login({ onLoginSuccess }) {
  const { lang, changeLanguage, t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) return;

    setIsLoading(true);
    setErrorMessage('');

    const isDev = window.location.port === '3000' || window.location.port === '5173';
    const loginUrl = isDev ? 'http://localhost:8000/api/auth/login' : '/api/auth/login';

    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    try {
      const response = await axios.post(loginUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, role, username: authUser } = response.data;
      localStorage.setItem('bms_token', access_token);
      localStorage.setItem('bms_role', role);
      localStorage.setItem('bms_username', authUser);

      if (onLoginSuccess) {
        onLoginSuccess({ token: access_token, role, username: authUser });
      }
    } catch (err) {
      console.error('Login error:', err);
      const detail = err.response?.data?.detail;
      setErrorMessage(detail || t('loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillRootCredentials = () => {
    setUsername('root');
    setPassword('Marcadorroot');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
      {/* Background cyber grid effect */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-40"></div>

      {/* Top Language Bar */}
      <div className="absolute top-6 right-6 z-10 flex items-center gap-1 bg-gray-900/90 border border-gray-800 rounded-lg p-1 text-xs font-mono backdrop-blur">
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
          onClick={() => changeLanguage('fr')}
          className={`px-2 py-0.5 rounded transition-colors ${lang === 'fr' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-gray-200'}`}
          title="Français"
        >
          FR
        </button>
        <button
          onClick={() => changeLanguage('it')}
          className={`px-2 py-0.5 rounded transition-colors ${lang === 'it' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-gray-200'}`}
          title="Italiano"
        >
          IT
        </button>
        <button
          onClick={() => changeLanguage('es')}
          className={`px-2 py-0.5 rounded transition-colors ${lang === 'es' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-gray-200'}`}
          title="Español"
        >
          ES
        </button>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-md">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
            <ShieldCheck size={36} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
            {t('loginTitle')}
          </h2>
          <p className="text-xs text-gray-400 max-w-xs">
            {t('loginSubtitle')}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-3 bg-red-950/80 border border-red-800 rounded-xl flex items-center gap-3 text-red-300 text-sm animate-shake">
            <AlertCircle size={18} className="shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-mono font-medium text-gray-300 mb-1.5 flex items-center gap-1.5">
              <User size={14} className="text-blue-400" />
              {t('username')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('usernamePlaceholder')}
                required
                autoComplete="username"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-gray-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound size={14} className="text-blue-400" />
              {t('password')}
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                required
                autoComplete="current-password"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer font-mono text-sm"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>{t('authenticating')}</span>
              </>
            ) : (
              <>
                <Lock size={16} />
                <span>{t('loginBtn')}</span>
              </>
            )}
          </button>
        </form>

        {/* Factory Default Helper Pill */}
        <div className="mt-6 pt-5 border-t border-gray-800/80 flex flex-col items-center">
          <button
            type="button"
            onClick={handleFillRootCredentials}
            className="text-xs font-mono text-gray-400 hover:text-blue-400 bg-gray-950 hover:bg-gray-800/60 border border-gray-800 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
            title="Click to autocomple factory credentials"
          >
            <Terminal size={13} className="text-amber-400" />
            <span>{t('factoryCredentialsNotice')}</span>
          </button>
          <span className="text-[10px] text-gray-500 mt-2 font-mono text-center">
            {t('securityNotice')}
          </span>
        </div>
      </div>
    </div>
  );
}

