const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined
  ? import.meta.env.VITE_API_URL
  : (typeof window !== 'undefined' && (window.location.port === '3000' || window.location.port === '5173')
      ? 'http://localhost:8000'
      : '');

export async function fetchDashboardSummary() {
  const res = await fetch(`${API_BASE_URL}/dashboard/summary`);
  if (!res.ok) {
    throw new Error(`Error ${res.status}: Fallo al obtener el resumen del dashboard`);
  }
  return res.json();
}

export async function fetchAlarmEvents(limit = 100) {
  const res = await fetch(`${API_BASE_URL}/alarm-events/?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`Error ${res.status}: Fallo al obtener el historial de alarmas`);
  }
  return res.json();
}

export async function fetchNotificationLogs(limit = 100) {
  const res = await fetch(`${API_BASE_URL}/notifications/?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`Error ${res.status}: Fallo al obtener auditoría de notificaciones`);
  }
  return res.json();
}

export async function fetchAlarmGroups() {
  const res = await fetch(`${API_BASE_URL}/alarm-groups/`);
  if (!res.ok) {
    throw new Error(`Error ${res.status}: Fallo al obtener los grupos`);
  }
  return res.json();
}

export async function fetchDatapoints() {
  const res = await fetch(`${API_BASE_URL}/datapoints/`);
  if (!res.ok) {
    throw new Error(`Error ${res.status}: Fallo al obtener los datapoints`);
  }
  return res.json();
}
