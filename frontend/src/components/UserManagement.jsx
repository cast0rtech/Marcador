import { useState } from 'react';
import axios from 'axios';
import { UserPlus, Shield, User, KeyRound, CheckCircle, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';

export default function UserManagement() {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('operador');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  // Verificamos el rol almacenado en el login
  const currentRole = localStorage.getItem('bms_role');

  // Si no es root, ocultamos el componente por completo por seguridad en el frontend
  if (currentRole !== 'root') {
    return null;
  }

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setStatus('loading');
    
    const token = localStorage.getItem('bms_token');
    const isDev = window.location.port === '3000' || window.location.port === '5173';
    const apiUrl = isDev ? 'http://localhost:8000/api/auth/users' : '/api/auth/users';

    try {
      const response = await axios.post(apiUrl, 
        {
          username: username,
          password: password,
          role: role
        },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setStatus('success');
      setMessage(t('userCreatedSuccess', { username: response.data.username }));
      setUsername('');
      setPassword('');
      
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.detail || t('userCreateError'));
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-md mt-8">
      <div className="flex items-center gap-2 mb-6 border-b border-gray-700 pb-4">
        <Shield className="text-purple-500" />
        <h3 className="text-lg font-semibold text-white">{t('userManagementTitle')}</h3>
      </div>
      
      <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-400 uppercase tracking-wider">{t('newUser')}</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              required
              className="w-full bg-gray-900 border border-gray-600 text-white rounded py-2 pl-9 pr-3 focus:border-purple-500 outline-none text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="operario1"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-400 uppercase tracking-wider">{t('password')}</label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="password"
              required
              minLength={8}
              className="w-full bg-gray-900 border border-gray-600 text-white rounded py-2 pl-9 pr-3 focus:border-purple-500 outline-none text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-400 uppercase tracking-wider">{t('accessLevel')}</label>
          <select
            className="w-full bg-gray-900 border border-gray-600 text-white rounded py-2 px-3 focus:border-purple-500 outline-none text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="operador">{t('roleOperator')}</option>
            <option value="admin">{t('roleAdmin')}</option>
          </select>
        </div>

        <button 
          type="submit"
          disabled={status === 'loading'}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
        >
          <UserPlus size={16} />
          {status === 'loading' ? t('creatingAccount') : t('createAccount')}
        </button>
      </form>

      {status === 'success' && (
        <div className="flex items-center gap-2 text-green-400 text-sm mt-4 p-3 bg-green-900/20 border border-green-500/50 rounded">
          <CheckCircle size={16} /> <span>{message}</span>
        </div>
      )}
      
      {status === 'error' && (
        <div className="flex items-center gap-2 text-red-400 text-sm mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded">
          <AlertTriangle size={16} /> <span>{message}</span>
        </div>
      )}
    </div>
  );
}

