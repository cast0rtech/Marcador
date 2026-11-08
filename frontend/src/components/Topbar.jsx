import { Activity, Radio } from 'lucide-react';

export default function Topbar() {
  return (
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
  );
}

