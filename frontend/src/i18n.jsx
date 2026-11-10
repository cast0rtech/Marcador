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
    langFr: "Français",
    langIt: "Italiano",
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

    // User Management (Root Security Panel)
    userManagementTitle: "Security Panel (Root Access)",
    newUser: "New User",
    accessLevel: "Access Level",
    roleOperator: "Operator (Read-only & ACK)",
    roleAdmin: "Administrator (Configuration)",
    createAccount: "Create Account",
    creatingAccount: "Creating...",
    userCreatedSuccess: "User {username} created successfully.",
    userCreateError: "Error creating user.",

    // Watchdog Banner
    watchdogBannerTitle: "Critical Link Failure",
    watchdogBannerDesc: "Lost network connection with {count} field controller(s).",
    watchdogInaccessibleNodes: "Inaccessible Nodes (IPs):",
    watchdogFaultDetected: "Fault detected!",
    watchdogSystemRestored: "System restored.",
    subsystemStatus: "Subsystem Status",
    statusNormal: "NORMAL",
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
    langFr: "Français",
    langIt: "Italiano",
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

    // User Management (Root Security Panel)
    userManagementTitle: "Sicherheitspanel (Root-Zugriff)",
    newUser: "Neuer Benutzer",
    accessLevel: "Zugriffsebene",
    roleOperator: "Bediener (Nur Lesen & ACK)",
    roleAdmin: "Administrator (Konfiguration)",
    createAccount: "Konto erstellen",
    creatingAccount: "Wird erstellt...",
    userCreatedSuccess: "Benutzer {username} erfolgreich erstellt.",
    userCreateError: "Fehler beim Erstellen des Benutzers.",

    // Watchdog Banner
    watchdogBannerTitle: "Kritischer Verbindungsfehler",
    watchdogBannerDesc: "Netzwerkverbindung zu {count} Feldsteuerungen verloren.",
    watchdogInaccessibleNodes: "Nicht erreichbare Knoten (IPs):",
    watchdogFaultDetected: "Fehler erkannt!",
    watchdogSystemRestored: "System wiederhergestellt.",
    subsystemStatus: "Subsystem-Status",
    statusNormal: "NORMAL",
  },
  fr: {
    appTitle: "Contrôle Industriel BMS",
    appSubtitle: "Moteur SCADA • Modbus TCP & BACnet/IP",
    fastApiStatus: "Cœur FastAPI : En ligne",
    telemetryTitle: "Moniteur de Télémétrie en Temps Réel",
    systemInfoTitle: "Informations Système",
    systemInfoDesc: "Le moteur Modbus/BACnet analyse les équipements sur le terrain en arrière-plan via une boucle asynchrone dynamique. Téléversez un fichier Excel ou CSV pour cartographier les registres PLC sans redémarrer le serveur.",
    protoSpecs1: "• Protocoles pris en charge : Modbus TCP (Port 502) / BACnet/IP (Port 47808)",
    protoSpecs2: "• Cycle de télémétrie : 2 secondes par cycle (asyncio.gather)",
    protoSpecs3: "• Connexion Frontend : WebSocket natif (/ws) avec latence < 10ms",
    
    // FileUploader
    importConfig: "Importer Configuration (Excel/CSV)",
    uploading: "Téléversement en cours...",
    uploadBtn: "Charger dans le Système",
    fileInstructions: "Prend en charge les fichiers CSV, XLSX ou XLS avec colonnes : Nombre, Protocolo, IP, Direccion, Grupo, Activo, Texto_TTS",
    importSuccess: "Importation terminée avec succès.",
    importError: "Erreur de connexion au serveur",

    // Dashboard groups
    statusOk: "OK",
    statusAlarm: "ALARME",
    alarmsActiveCount: "Alarmes Actives",
    nominalState: "État Nominal",
    liveNotification: "Notification BMS en Direct",
    
    // Analytics & Charts
    analyticsTitle: "Analytique de Télémétrie & Incidents",
    analyticsSubtitle: "Tendance des incidents et répartition de charge critique",
    totalIncidents: "Total des Incidents Enregistrés",
    alarmsByGroup: "Incidents par Groupe / Zone",
    alarmsByTrend: "Tendance Temporelle (Derniers Jours)",
    alarmsLegend: "Alarmes",
    total24h: "Total 24h",
    alarmsTriggered24h: "Alarmes déclenchées (24h)",
    noAlarms24h: "Aucune alarme enregistrée au cours des dernières 24 heures.",

    // Audit Table & Grid
    auditTitle: "Journal d'Audit & Traçabilité",
    auditLastEvents: "{count} derniers événements",
    colTimestamp: "Horodatage / Début",
    colGroupPoint: "Groupe & Point de Données",
    colStatus: "État",
    colNotif: "Notifications (Escalade)",
    colResolution: "Résolution",
    statusResolved: "Résolue",
    statusActive: "Active",
    noResolution: "En attente / En cours",
    auditLoading: "Chargement de l'audit...",
    filterEventsPlaceholder: "Filtrer les événements...",
    filterAll: "Tous",
    filterActive: "Actives",
    filterResolved: "Résolues",
    affectedPoint: "Point Affecté",
    category: "Catégorie",
    startTime: "Heure Début",
    notifEmail: "Notification par E-mail",
    resolutionTime: "Heure Résolution",
    noEventsFound: "Aucun événement correspondant aux critères.",
    noNotif: "Aucune notification",
    pending: "En attente",
    exportPdf: "Exporter PDF",

    // Groups & Cards
    noAlarmGroups: "Aucun groupe d'alarmes enregistré dans le système.",
    telemetryMonitoring: "Surveillance de la télémétrie",
    points: "Points",
    alarms: "Alarmes",
    alarm: "Alarme",
    defaultRouting: "Routage par défaut",

    // Languages
    langEn: "English",
    langDe: "Deutsch",
    langFr: "Français",
    langIt: "Italiano",
    langEs: "Español",

    // Authentication & RBAC
    loginTitle: "Contrôle d'Accès Industriel BMS",
    loginSubtitle: "Connectez-vous avec vos identifiants autorisés pour accéder au SCADA",
    username: "Nom d'utilisateur",
    usernamePlaceholder: "ex. root",
    password: "Mot de passe",
    passwordPlaceholder: "Entrez votre mot de passe",
    loginBtn: "Se Connecter",
    authenticating: "Authentification...",
    loginError: "Nom d'utilisateur ou mot de passe incorrect",
    logout: "Déconnexion",
    sessionActive: "Session Active",
    userRole: "Rôle",
    factoryCredentialsNotice: "Par défaut en usine : root / Marcadorroot",
    securityNotice: "Contrôle d'accès basé sur les rôles (RBAC) avec jetons JWT",

    // User Management (Root Security Panel)
    userManagementTitle: "Panneau de Sécurité (Accès Root)",
    newUser: "Nouvel Utilisateur",
    accessLevel: "Niveau d'Accès",
    roleOperator: "Opérateur (Lecture seule & ACK)",
    roleAdmin: "Administrateur (Configuration)",
    createAccount: "Créer le Compte",
    creatingAccount: "Création en cours...",
    userCreatedSuccess: "Utilisateur {username} créé avec succès.",
    userCreateError: "Erreur lors de la création de l'utilisateur.",

    // Watchdog Banner
    watchdogBannerTitle: "Défaut Critique de Liaison",
    watchdogBannerDesc: "Perte de connexion réseau avec {count} contrôleur(s) de terrain.",
    watchdogInaccessibleNodes: "Nœuds Inaccessibles (IPs) :",
    watchdogFaultDetected: "Défaut détecté !",
    watchdogSystemRestored: "Système rétabli.",
    subsystemStatus: "État du Sous-système",
    statusNormal: "NORMAL",
  },
  it: {
    appTitle: "Controllo Industriale BMS",
    appSubtitle: "Motore SCADA • Modbus TCP & BACnet/IP",
    fastApiStatus: "Core FastAPI: Online",
    telemetryTitle: "Monitor Telemetria in Tempo Reale",
    systemInfoTitle: "Informazioni di Sistema",
    systemInfoDesc: "Il motore Modbus/BACnet esegue la scansione dei dispositivi sul campo in background tramite un ciclo asincrono dinamico. Carica un file Excel o CSV per mappare i registri PLC senza riavviare il server.",
    protoSpecs1: "• Protocolli supportati: Modbus TCP (Porta 502) / BACnet/IP (Porta 47808)",
    protoSpecs2: "• Ciclo di telemetria: 2 secondi per ciclo (asyncio.gather)",
    protoSpecs3: "• Connessione Frontend: WebSocket nativo (/ws) con latenza < 10ms",
    
    // FileUploader
    importConfig: "Importa Configurazione (Excel/CSV)",
    uploading: "Caricamento in corso...",
    uploadBtn: "Carica nel Sistema",
    fileInstructions: "Supporta file CSV, XLSX o XLS con colonne: Nombre, Protocolo, IP, Direccion, Grupo, Activo, Texto_TTS",
    importSuccess: "Importazione completata con successo.",
    importError: "Errore di connessione al server",

    // Dashboard groups
    statusOk: "OK",
    statusAlarm: "ALLARME",
    alarmsActiveCount: "Allarmi Attivi",
    nominalState: "Stato Nominale",
    liveNotification: "Notifica BMS in Diretta",
    
    // Analytics & Charts
    analyticsTitle: "Analisi Telemetria & Incidenti",
    analyticsSubtitle: "Trend incidenti e distribuzione carico critico",
    totalIncidents: "Totale Incidenti Registrati",
    alarmsByGroup: "Incidenti per Gruppo / Zona",
    alarmsByTrend: "Trend Temporale (Ultimi Giorni)",
    alarmsLegend: "Allarmi",
    total24h: "Totale 24h",
    alarmsTriggered24h: "Allarmi attivati (24h)",
    noAlarms24h: "Nessun allarme registrato nelle ultime 24 ore.",

    // Audit Table & Grid
    auditTitle: "Registro di Audit & Tracciabilità",
    auditLastEvents: "Ultimi {count} eventi",
    colTimestamp: "Timestamp / Inizio",
    colGroupPoint: "Gruppo & Punto Dati",
    colStatus: "Stato",
    colNotif: "Notifiche (Escalation)",
    colResolution: "Risoluzione",
    statusResolved: "Risolto",
    statusActive: "Attivo",
    noResolution: "In attesa / In corso",
    auditLoading: "Caricamento audit...",
    filterEventsPlaceholder: "Filtra eventi...",
    filterAll: "Tutti",
    filterActive: "Attivi",
    filterResolved: "Risolti",
    affectedPoint: "Punto Interessato",
    category: "Categoria",
    startTime: "Ora Inizio",
    notifEmail: "Notifica via E-mail",
    resolutionTime: "Ora Risoluzione",
    noEventsFound: "Nessun evento corrispondente ai criteri.",
    noNotif: "Nessuna notifica",
    pending: "In attesa",
    exportPdf: "Esporta PDF",

    // Groups & Cards
    noAlarmGroups: "Nessun gruppo di allarmi registrato nel sistema.",
    telemetryMonitoring: "Monitoraggio telemetria",
    points: "Punti",
    alarms: "Allarmi",
    alarm: "Allarme",
    defaultRouting: "Routing predefinito",

    // Languages
    langEn: "English",
    langDe: "Deutsch",
    langFr: "Français",
    langIt: "Italiano",
    langEs: "Español",

    // Authentication & RBAC
    loginTitle: "Controllo Accessi Industriale BMS",
    loginSubtitle: "Accedi con le tue credenziali autorizzate per accedere al controllo SCADA",
    username: "Nome utente",
    usernamePlaceholder: "es. root",
    password: "Password",
    passwordPlaceholder: "Inserisci la password",
    loginBtn: "Accedi",
    authenticating: "Autenticazione in corso...",
    loginError: "Nome utente o password non validi",
    logout: "Disconnetti",
    sessionActive: "Sessione Attiva",
    userRole: "Ruolo",
    factoryCredentialsNotice: "Predefinito di fabbrica: root / Marcadorroot",
    securityNotice: "Controllo degli accessi basato sui ruoli (RBAC) con token JWT",

    // User Management (Root Security Panel)
    userManagementTitle: "Pannello di Sicurezza (Accesso Root)",
    newUser: "Nuovo Utente",
    accessLevel: "Livello di Accesso",
    roleOperator: "Operatore (Sola lettura & ACK)",
    roleAdmin: "Amministratore (Configurazione)",
    createAccount: "Crea Account",
    creatingAccount: "Creazione in corso...",
    userCreatedSuccess: "Utente {username} creato con successo.",
    userCreateError: "Errore durante la creazione dell'utente.",

    // Watchdog Banner
    watchdogBannerTitle: "Guasto Critico del Collegamento",
    watchdogBannerDesc: "Connessione di rete persa con {count} controller sul campo.",
    watchdogInaccessibleNodes: "Nodi Inaccessibili (IP):",
    watchdogFaultDetected: "Guasto rilevato!",
    watchdogSystemRestored: "Sistema ripristinato.",
    subsystemStatus: "Stato Sottosistema",
    statusNormal: "NORMALE",
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
    langFr: "Français",
    langIt: "Italiano",
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

    // User Management (Root Security Panel)
    userManagementTitle: "Panel de Seguridad (Acceso Root)",
    newUser: "Nuevo Usuario",
    accessLevel: "Nivel de Acceso",
    roleOperator: "Operador (Solo lectura y ACK)",
    roleAdmin: "Administrador (Configuración)",
    createAccount: "Crear Cuenta",
    creatingAccount: "Creando...",
    userCreatedSuccess: "Usuario {username} creado correctamente.",
    userCreateError: "Error al crear el usuario.",

    // Watchdog Banner
    watchdogBannerTitle: "Fallo Crítico de Enlace",
    watchdogBannerDesc: "Se ha perdido la conexión de red con {count} controlador(es) de campo.",
    watchdogInaccessibleNodes: "Nodos Inaccesibles (IPs):",
    watchdogFaultDetected: "¡Fallo detectado!",
    watchdogSystemRestored: "Sistema restablecido.",
    subsystemStatus: "Estado de Subsistema",
    statusNormal: "NORMAL",
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

