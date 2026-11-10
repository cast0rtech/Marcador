import React, { createContext, useContext, useState } from 'react';

export const translations = {
  en: {
    appTitle: "BMS Industrial Control",
    appSubtitle: "SCADA Engine • Modbus TCP & BACnet/IP",
    fastApiStatus: "FastAPI Core: Online",
    telemetryTitle: "Real-time Telemetry Monitor",
    systemInfoTitle: "System Information",
    systemInfoDesc: "The Modbus/BACnet engine scans devices in background via an asynchronous loop. Upload a new Excel or CSV file to map new PLC registers without restarting the server.",
    protoSpecs1: "• Supported protocols: Modbus TCP (Port 502) / BACnet/IP (Port 47808)",
    protoSpecs2: "• Telemetry cycle: 2 seconds per cycle (asyncio.gather)",
    protoSpecs3: "• Frontend connection: Native WebSocket (/ws) with latency < 10ms",
    
    // FileUploader
    importConfig: "Import Configuration (Excel/CSV)",
    uploading: "Uploading...",
    uploadBtn: "Upload to System",
    fileInstructions: "Supports CSV, XLSX or XLS files with columns: Nombre, Protocolo, IP, Direccion, Grupo, Activo, Texto_TTS",
    importSuccess: "Import completed successfully.",
    importError: "Server connection error",

    // Dashboard groups
    statusOk: "OK",
    statusAlarm: "ALARM",
    alarmsActiveCount: "Active Alarms",
    nominalState: "Nominal State",
    liveNotification: "Live BMS Notification",
    
    // Analytics & Charts
    analyticsTitle: "Telemetry Analytics & Incidents",
    analyticsSubtitle: "Incident trend and critical load distribution",
    totalIncidents: "Total Incidents Recorded",
    alarmsByGroup: "Incidents by Group / Zone",
    alarmsByTrend: "Temporal Trend (Last Days)",
    alarmsLegend: "Alarms",
    total24h: "Total 24h",
    alarmsTriggered24h: "Alarms triggered (24h)",
    noAlarms24h: "No alarms recorded in the last 24 hours.",

    // Audit Table & Grid
    auditTitle: "Audit Log & Traceability",
    auditLastEvents: "Last {count} events",
    colTimestamp: "Timestamp / Start",
    colGroupPoint: "Group & Point",
    colStatus: "Status",
    colNotif: "Notifications (Escalation)",
    colResolution: "Resolution",
    statusResolved: "Resolved",
    statusActive: "Active",
    noResolution: "Pending / In Progress",
    auditLoading: "Loading audit...",
    filterEventsPlaceholder: "Filter events...",
    filterAll: "All",
    filterActive: "Active",
    filterResolved: "Resolved",
    affectedPoint: "Affected Point",
    category: "Category",
    startTime: "Start Time",
    notifEmail: "Email Notification",
    resolutionTime: "Resolution Time",
    noEventsFound: "No events matching search query.",
    noNotif: "No notification",
    pending: "Pending",
    exportPdf: "Export PDF",

    // Groups & Cards
    noAlarmGroups: "No alarm groups registered in the system.",
    telemetryMonitoring: "Telemetry monitoring",
    points: "Points",
    alarms: "Alarms",
    alarm: "Alarm",
    defaultRouting: "Default routing",

    // Languages
    langEn: "English",
    langDe: "Deutsch",
    langEs: "Español",

    // Authentication & RBAC
    loginTitle: "BMS Industrial Access Control",
    loginSubtitle: "Sign in with your authorized credentials to access SCADA control",
    username: "Username",
    usernamePlaceholder: "e.g. root",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    loginBtn: "Sign In",
    authenticating: "Authenticating...",
    loginError: "Invalid username or password",
    logout: "Sign Out",
    sessionActive: "Active Session",
    userRole: "Role",
    factoryCredentialsNotice: "Factory Default: root / Marcadorroot",
    securityNotice: "Role-Based Access Control (RBAC) with JWT Cryptographic Tokens",
  },
  de: {
    appTitle: "BMS Industriesteuerung",
    appSubtitle: "SCADA-Engine • Modbus TCP & BACnet/IP",
    fastApiStatus: "FastAPI-Kern: Online",
    telemetryTitle: "Echtzeit-Telemetrieüberwachung",
    systemInfoTitle: "Systeminformationen",
    systemInfoDesc: "Die Modbus/BACnet-Engine scannt Feldgeräte im Hintergrund über eine dynamische asynchrone Schleife. Laden Sie eine neue Excel- oder CSV-Datei hoch, um SPS-Register ohne Serverneustart zuzuordnen.",
    protoSpecs1: "• Unterstützte Protokolle: Modbus TCP (Port 502) / BACnet/IP (Port 47808)",
    protoSpecs2: "• Telemetriezyklus: 2 Sekunden pro Zyklus (asyncio.gather)",
    protoSpecs3: "• Frontend-Verbindung: Natives WebSocket (/ws) mit Latenz < 10ms",
    
    // FileUploader
    importConfig: "Konfiguration importieren (Excel/CSV)",
    uploading: "Wird hochgeladen...",
    uploadBtn: "Ins System laden",
    fileInstructions: "Unterstützt CSV-, XLSX- oder XLS-Dateien mit Spalten: Nombre, Protocolo, IP, Direccion, Grupo, Activo, Texto_TTS",
    importSuccess: "Import erfolgreich abgeschlossen.",
    importError: "Verbindungsfehler zum Server",

    // Dashboard groups
    statusOk: "OK",
    statusAlarm: "ALARM",
    alarmsActiveCount: "Aktive Alarme",
    nominalState: "Normalzustand",
    liveNotification: "BMS-Live-Benachrichtigung",
    
    // Analytics & Charts
    analyticsTitle: "Telemetrie-Analytik & Vorfälle",
    analyticsSubtitle: "Vorfallstrends und Verteilung kritischer Lasten",
    totalIncidents: "Erfasste Vorfälle insgesamt",
    alarmsByGroup: "Vorfälle nach Gruppe / Zone",
    alarmsByTrend: "Zeitlicher Trend (Letzte Tage)",
    alarmsLegend: "Alarme",
    total24h: "Gesamt 24h",
    alarmsTriggered24h: "Ausgelöste Alarme (24h)",
    noAlarms24h: "Keine Alarme in den letzten 24 Stunden erfasst.",

    // Audit Table & Grid
    auditTitle: "Audit-Protokoll & Rückverfolgbarkeit",
    auditLastEvents: "Letzte {count} Ereignisse",
    colTimestamp: "Zeitstempel / Beginn",
    colGroupPoint: "Gruppe & Datenpunkt",
    colStatus: "Status",
    colNotif: "Benachrichtigungen (Eskalation)",
    colResolution: "Behebung",
    statusResolved: "Behoben",
    statusActive: "Aktiv",
    noResolution: "Ausstehend / In Bearbeitung",
    auditLoading: "Auditdaten werden geladen...",
    filterEventsPlaceholder: "Ereignisse filtern...",
    filterAll: "Alle",
    filterActive: "Aktiv",
    filterResolved: "Behoben",
    affectedPoint: "Betroffener Datenpunkt",
    category: "Kategorie",
    startTime: "Startzeitpunkt",
    notifEmail: "E-Mail-Benachrichtigung",
    resolutionTime: "Behebungszeit",
    noEventsFound: "Keine Ereignisse für diese Filterkriterien.",
    noNotif: "Keine Benachrichtigung",
    pending: "Ausstehend",
    exportPdf: "PDF exportieren",

    // Groups & Cards
    noAlarmGroups: "Keine Alarmgruppen im System registriert.",
    telemetryMonitoring: "Telemetrieüberwachung",
    points: "Punkte",
    alarms: "Alarme",
    alarm: "Alarm",
    defaultRouting: "Standard-Routing",

    // Languages
    langEn: "English",
    langDe: "Deutsch",
    langEs: "Español",

    // Authentication & RBAC
    loginTitle: "BMS Industrielle Zugangskontrolle",
    loginSubtitle: "Melden Sie sich mit Ihren autorisierten Zugangsdaten an",
    username: "Benutzername",
    usernamePlaceholder: "z.B. root",
    password: "Passwort",
    passwordPlaceholder: "Passwort eingeben",
    loginBtn: "Anmelden",
    authenticating: "Wird authentifiziert...",
    loginError: "Ungültiger Benutzername oder Passwort",
    logout: "Abmelden",
    sessionActive: "Aktive Sitzung",
    userRole: "Rolle",
    factoryCredentialsNotice: "Standard-Werkseinstellungen: root / Marcadorroot",
    securityNotice: "Rollenbasierte Zugriffskontrolle (RBAC) mit kryptografischen JWT-Tokens",
  },
  es: {
    appTitle: "BMS Industrial Control",
    appSubtitle: "SCADA Engine • Modbus TCP & BACnet/IP",
    fastApiStatus: "FastAPI Core: Online",
    telemetryTitle: "Monitor de Telemetría en Tiempo Real",
    systemInfoTitle: "Información del Sistema",
    systemInfoDesc: "El motor Modbus/BACnet está escaneando los equipos en segundo plano mediante un bucle asíncrono dinámico. Sube un nuevo archivo Excel o CSV para mapear nuevos registros PLC sin necesidad de reiniciar el servidor.",
    protoSpecs1: "• Protocolos soportados: Modbus TCP (Port 502) / BACnet/IP (Port 47808)",
    protoSpecs2: "• Ciclo de telemetría: 2 segundos por ciclo (asyncio.gather)",
    protoSpecs3: "• Conexión frontend: WebSocket nativo (/ws) con latencia < 10ms",
    
    // FileUploader
    importConfig: "Importar Configuración (Excel/CSV)",
    uploading: "Subiendo...",
    uploadBtn: "Cargar al Sistema",
    fileInstructions: "Permite archivos CSV, XLSX o XLS con columnas: Nombre, Protocolo, IP, Direccion, Grupo, Activo, Texto_TTS",
    importSuccess: "Importación completada con éxito.",
    importError: "Error de conexión al servidor",

    // Dashboard groups
    statusOk: "OK",
    statusAlarm: "ALARMA",
    alarmsActiveCount: "Alarmas Activas",
    nominalState: "Estado Nominal",
    liveNotification: "Notificación BMS en Vivo",
    
    // Analytics & Charts
    analyticsTitle: "Analítica de Telemetría e Incidencias",
    analyticsSubtitle: "Tendencia de incidencias y distribución de carga crítica",
    totalIncidents: "Total Incidencias Registradas",
    alarmsByGroup: "Incidencias por Grupo / Zona",
    alarmsByTrend: "Tendencia Temporal (Últimos Días)",
    alarmsLegend: "Alarmas",
    total24h: "Total 24h",
    alarmsTriggered24h: "Alarmas disparadas (24h)",
    noAlarms24h: "Sin alarmas registradas en las últimas 24 horas.",

    // Audit Table & Grid
    auditTitle: "Registro de Auditoría y Trazabilidad",
    auditLastEvents: "Últimos {count} eventos",
    colTimestamp: "Timestamp / Inicio",
    colGroupPoint: "Grupo y Punto",
    colStatus: "Estado",
    colNotif: "Notificaciones (Escalado)",
    colResolution: "Resolución",
    statusResolved: "Resuelta",
    statusActive: "Activa",
    noResolution: "Pendiente / En Curso",
    auditLoading: "Cargando auditoría...",
    filterEventsPlaceholder: "Filtrar eventos...",
    filterAll: "Todos",
    filterActive: "Activas",
    filterResolved: "Resueltas",
    affectedPoint: "Punto Afectado",
    category: "Categoría",
    startTime: "Hora Inicio",
    notifEmail: "Notificado por Email",
    resolutionTime: "Hora Resolución",
    noEventsFound: "Sin eventos que coincidan con la búsqueda.",
    noNotif: "Sin notificación",
    pending: "Pendiente",
    exportPdf: "Exportar PDF",

    // Groups & Cards
    noAlarmGroups: "No hay grupos de alarma registrados en el sistema.",
    telemetryMonitoring: "Monitoreo de telemetría",
    points: "Puntos",
    alarms: "Alarmas",
    alarm: "Alarma",
    defaultRouting: "Enrutado por defecto",

    // Languages
    langEn: "English",
    langDe: "Deutsch",
    langEs: "Español",

    // Authentication & RBAC
    loginTitle: "Control de Acceso Industrial BMS",
    loginSubtitle: "Inicie sesión con sus credenciales autorizadas para acceder al control SCADA",
    username: "Usuario",
    usernamePlaceholder: "ej. root",
    password: "Contraseña",
    passwordPlaceholder: "Ingrese su contraseña",
    loginBtn: "Iniciar Sesión",
    authenticating: "Autenticando...",
    loginError: "Usuario o contraseña incorrectos",
    logout: "Cerrar Sesión",
    sessionActive: "Sesión Activa",
    userRole: "Rol",
    factoryCredentialsNotice: "Credenciales de Fábrica: root / Marcadorroot",
    securityNotice: "Control de Acceso Basado en Roles (RBAC) con Tokens Criptográficos JWT",
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('bms_lang') || 'en';
  });

  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('bms_lang', newLang);
  };

  const t = (key, params = {}) => {
    let text = translations[lang]?.[key] || translations['en']?.[key] || key;
    Object.keys(params).forEach((paramKey) => {
      text = text.replace(`{${paramKey}}`, params[paramKey]);
    });
    return text;
  };

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

