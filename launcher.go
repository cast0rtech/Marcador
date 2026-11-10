package main

import (
	"bufio"
	"context"
	"flag"
	"fmt"
	"net"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"syscall"
	"time"
	"unsafe"
)

const (
	ColorReset  = "\033[0m"
	ColorRed    = "\033[31m"
	ColorGreen  = "\033[32m"
	ColorYellow = "\033[33m"
	ColorBlue   = "\033[34m"
	ColorPurple = "\033[35m"
	ColorCyan   = "\033[36m"
	ColorWhite  = "\033[37m"
	ColorBold   = "\033[1m"
)

type Lang string

const (
	LangEN Lang = "en"
	LangDE Lang = "de"
	LangFR Lang = "fr"
	LangIT Lang = "it"
	LangES Lang = "es"
)

type TextBundle struct {
	Title             string
	Subtitle          string
	CurrentStatus     string
	DockerOnline      string
	DockerOffline     string
	FrontendActive    string
	FrontendOffline   string
	BackendActive     string
	BackendOffline    string
	DbActive          string
	DbOffline         string
	OptionsHeader     string
	OptDocker         string
	OptLocal          string
	OptBrowser        string
	OptLogs           string
	OptStop           string
	OptDeps           string
	OptLang           string
	OptExit           string
	SelectPrompt      string
	DockerSelected    string
	DockerNotRunning  string
	DockerAskStart    string
	DockerStarting    string
	DockerWaiting     string
	DockerReady       string
	DockerTimeout     string
	DockerNoInstall   string
	StartingCompose   string
	ComposeSuccess    string
	WaitingStartup    string
	StopSelected      string
	StoppingDocker    string
	StoppingLocalPid  string
	ServicesStopped   string
	LocalSelected     string
	PyNotFound        string
	StartingBackend   string
	StartingFrontend  string
	NodeModulesNotice string
	LocalRunningTip   string
	LocalStopped      string
	InstallingDeps    string
	InstallingPip     string
	PipSuccess        string
	InstallingNpm     string
	NpmSuccess        string
	LogsTip           string
	NoActiveService   string
	BrowserOpenMsg    string
	InvalidOption     string
	PressEnter        string
	Goodbye           string
}

var i18n = map[Lang]TextBundle{
	LangEN: {
		Title:             "BMS INDUSTRIAL - SCADA MONITORING",
		Subtitle:          "SYSTEM LAUNCHER & OPERATIONS MANAGER",
		CurrentStatus:     "--- Current Services Status ---",
		DockerOnline:      "[ONLINE / READY]",
		DockerOffline:     "[STOPPED / NOT AVAILABLE]",
		FrontendActive:    "[ACTIVE]",
		FrontendOffline:   "[OFFLINE]",
		BackendActive:     "[ACTIVE]",
		BackendOffline:    "[OFFLINE]",
		DbActive:          "[ACTIVE]",
		DbOffline:         "[OFFLINE]",
		OptionsHeader:     "AVAILABLE ACTIONS:",
		OptDocker:         "Start BMS with Docker Compose (Recommended / Complete)",
		OptLocal:          "Start BMS in Local Mode (Python FastAPI + Vite)",
		OptBrowser:        "Open SCADA Dashboard in Web Browser",
		OptLogs:           "View Real-time Container Logs",
		OptStop:           "Stop all services",
		OptDeps:           "Install / Update dependencies (Pip & NPM)",
		OptLang:           "Change Language / Sprache / Idioma",
		OptExit:           "Exit",
		SelectPrompt:      "Select an option [0-7]: ",
		DockerSelected:    "[+] Docker Compose mode selected.",
		DockerNotRunning:  "[?] Docker Engine does not seem to be running.",
		DockerAskStart:    "Do you want to start Docker Desktop now? (y/n): ",
		DockerStarting:    "[*] Launching Docker Desktop in background...",
		DockerWaiting:     "[*] Waiting for Docker Engine to be ready (up to 60s)... ",
		DockerReady:       "Ready!",
		DockerTimeout:     "[!] Timeout waiting for Docker Engine.",
		DockerNoInstall:   "[!] Docker Desktop was not found in standard paths.",
		StartingCompose:   "[*] Executing: docker compose up -d --build",
		ComposeSuccess:    "[✓] Containers started successfully.",
		WaitingStartup:    "[*] Waiting 3 seconds for services to initialize...",
		StopSelected:      "[*] Stopping all services...",
		StoppingDocker:    "[*] Stopping Docker containers...",
		StoppingLocalPid:  "[*] Terminating local process PID %d on port %d...",
		ServicesStopped:   "[✓] All services have been stopped.",
		LocalSelected:     "[+] Local Mode (Backend FastAPI + Frontend Vite) selected.",
		PyNotFound:        "[!] Python was not found in PATH.",
		StartingBackend:   "[*] Starting Backend FastAPI (uvicorn main:app --port 8000)...",
		StartingFrontend:  "[*] Starting Frontend React (npm run dev)...",
		NodeModulesNotice: "[!] node_modules not found in ./frontend. You can access the API docs at http://localhost:8000/docs",
		LocalRunningTip:   "[✓] BMS running locally. Press Ctrl+C to stop.",
		LocalStopped:      "[✓] Local Backend and Frontend stopped.",
		InstallingDeps:    "[*] Installing / Updating dependencies...",
		InstallingPip:     "1. Installing Python libraries from requirements.txt...",
		PipSuccess:        "[✓] Python requirements installed.",
		InstallingNpm:     "2. Installing Node.js dependencies in ./frontend...",
		NpmSuccess:        "[✓] NPM dependencies installed.",
		LogsTip:           "[*] Displaying live Docker logs (Ctrl+C to return to menu)...",
		NoActiveService:   "[!] No active web service detected on standard ports (80, 3000, 5173, 8000).",
		BrowserOpenMsg:    "[*] Opening web browser at: %s",
		InvalidOption:     "[!] Invalid option. Please try again.",
		PressEnter:        "Press [Enter] to continue...",
		Goodbye:           "Goodbye!",
	},
	LangDE: {
		Title:             "BMS INDUSTRIE - SCADA-ÜBERWACHUNG",
		Subtitle:          "SYSTEM-STARTER & BETRIEBSMANAGER",
		CurrentStatus:     "--- Aktueller Systemstatus ---",
		DockerOnline:      "[ONLINE / BEREIT]",
		DockerOffline:     "[ANGEHALTEN / NICHT VERFÜGBAR]",
		FrontendActive:    "[AKTIV]",
		FrontendOffline:   "[OFFLINE]",
		BackendActive:     "[AKTIV]",
		BackendOffline:    "[OFFLINE]",
		DbActive:          "[AKTIV]",
		DbOffline:         "[OFFLINE]",
		OptionsHeader:     "VERFÜGBARE AKTIONEN:",
		OptDocker:         "BMS mit Docker Compose starten (Empfohlen / Vollständig)",
		OptLocal:          "BMS im lokalen Modus starten (Python FastAPI + Vite)",
		OptBrowser:        "SCADA-Dashboard im Webbrowser öffnen",
		OptLogs:           "Container-Logs in Echtzeit anzeigen",
		OptStop:           "Alle Dienste stoppen",
		OptDeps:           "Abhängigkeiten installieren / aktualisieren (Pip & NPM)",
		OptLang:           "Sprache ändern / Change Language / Cambiar idioma",
		OptExit:           "Beenden",
		SelectPrompt:      "Option auswählen [0-7]: ",
		DockerSelected:    "[+] Docker Compose-Modus ausgewählt.",
		DockerNotRunning:  "[?] Die Docker Engine scheint nicht aktiv zu sein.",
		DockerAskStart:    "Möchten Sie Docker Desktop jetzt starten? (j/n): ",
		DockerStarting:    "[*] Docker Desktop wird im Hintergrund gestartet...",
		DockerWaiting:     "[*] Warte auf Bereitschaft der Docker Engine (bis zu 60s)... ",
		DockerReady:       "Bereit!",
		DockerTimeout:     "[!] Zeitüberschreitung beim Warten auf Docker Engine.",
		DockerNoInstall:   "[!] Docker Desktop wurde in Standardpfaden nicht gefunden.",
		StartingCompose:   "[*] Ausführung: docker compose up -d --build",
		ComposeSuccess:    "[✓] Container erfolgreich gestartet.",
		WaitingStartup:    "[*] Warte 3 Sekunden auf Initialisierung der Dienste...",
		StopSelected:      "[*] Alle Dienste werden gestoppt...",
		StoppingDocker:    "[*] Docker-Container werden gestoppt...",
		StoppingLocalPid:  "[*] Beende lokalen Prozess PID %d auf Port %d...",
		ServicesStopped:   "[✓] Alle Dienste wurden erfolgreich beendet.",
		LocalSelected:     "[+] Lokaler Modus (Backend FastAPI + Frontend Vite) ausgewählt.",
		PyNotFound:        "[!] Python wurde nicht im PATH gefunden.",
		StartingBackend:   "[*] Starte Backend FastAPI (uvicorn main:app --port 8000)...",
		StartingFrontend:  "[*] Starte Frontend React (npm run dev)...",
		NodeModulesNotice: "[!] node_modules nicht in ./frontend gefunden. API-Dokumentation erreichbar unter http://localhost:8000/docs",
		LocalRunningTip:   "[✓] BMS läuft lokal. Drücken Sie Strg+C zum Beenden.",
		LocalStopped:      "[✓] Lokales Backend und Frontend beendet.",
		InstallingDeps:    "[*] Installiere / Aktualisiere Abhängigkeiten...",
		InstallingPip:     "1. Installiere Python-Pakete aus requirements.txt...",
		PipSuccess:        "[✓] Python-Anforderungen erfolgreich installiert.",
		InstallingNpm:     "2. Installiere Node.js-Pakete in ./frontend...",
		NpmSuccess:        "[✓] NPM-Pakete erfolgreich installiert.",
		LogsTip:           "[*] Zeige Live-Docker-Logs an (Strg+C zum Zurückkehren)...",
		NoActiveService:   "[!] Kein aktiver Webdienst auf Standard-Ports gefunden (80, 3000, 5173, 8000).",
		BrowserOpenMsg:    "[*] Öffne Webbrowser unter: %s",
		InvalidOption:     "[!] Ungültige Auswahl. Bitte erneut versuchen.",
		PressEnter:        "Drücken Sie [Enter], um fortzufahren...",
		Goodbye:           "Auf Wiedersehen!",
	},
	LangFR: {
		Title:             "BMS INDUSTRIEL - SUPERVISION SCADA",
		Subtitle:          "LANCEUR DU SYSTÈME & GESTIONNAIRE D'OPÉRATIONS",
		CurrentStatus:     "--- État Actuel des Services ---",
		DockerOnline:      "[EN LIGNE / PRÊT]",
		DockerOffline:     "[ARRÊTÉ / NON DISPONIBLE]",
		FrontendActive:    "[ACTIF]",
		FrontendOffline:   "[HORS LIGNE]",
		BackendActive:     "[ACTIF]",
		BackendOffline:    "[HORS LIGNE]",
		DbActive:          "[ACTIF]",
		DbOffline:         "[HORS LIGNE]",
		OptionsHeader:     "OPTIONS DISPONIBLES :",
		OptDocker:         "Démarrer BMS avec Docker Compose (Recommandé / Complet)",
		OptLocal:          "Démarrer BMS en Mode Local (Python FastAPI + Vite)",
		OptBrowser:        "Ouvrir le Tableau de Bord dans le Navigateur Web",
		OptLogs:           "Afficher les Journaux des Conteneurs en direct",
		OptStop:           "Arrêter tous les services",
		OptDeps:           "Installer / Mettre à jour les dépendances (Pip & NPM)",
		OptLang:           "Changer de langue / Change Language",
		OptExit:           "Quitter",
		SelectPrompt:      "Sélectionnez une option [0-7] : ",
		DockerSelected:    "[+] Mode Docker Compose sélectionné.",
		DockerNotRunning:  "[?] Le moteur Docker ne semble pas être en cours d'exécution.",
		DockerAskStart:    "Voulez-vous démarrer Docker Desktop maintenant ? (o/n) : ",
		DockerStarting:    "[*] Démarrage de Docker Desktop en arrière-plan...",
		DockerWaiting:     "[*] En attente du moteur Docker (jusqu'à 60s)... ",
		DockerReady:       "Prêt !",
		DockerTimeout:     "[!] Délai d'attente dépassé pour Docker Engine.",
		DockerNoInstall:   "[!] Docker Desktop non trouvé dans les emplacements habituels.",
		StartingCompose:   "[*] Exécution de : docker compose up -d --build",
		ComposeSuccess:    "[✓] Conteneurs démarrés avec succès.",
		WaitingStartup:    "[*] Attente de 3 secondes pour le démarrage des services...",
		StopSelected:      "[*] Arrêt des services...",
		StoppingDocker:    "[*] Arrêt des conteneurs Docker...",
		StoppingLocalPid:  "[*] Fermeture du processus PID %d sur le port %d...",
		ServicesStopped:   "[✓] Tous les services ont été arrêtés.",
		LocalSelected:     "[+] Mode Local (Backend FastAPI + Frontend Vite) sélectionné.",
		PyNotFound:        "[!] Python n'est pas disponible dans le PATH.",
		StartingBackend:   "[*] Lancement du Backend FastAPI (uvicorn main:app --port 8000)...",
		StartingFrontend:  "[*] Lancement du Frontend React (npm run dev)...",
		NodeModulesNotice: "[!] node_modules non trouvé dans ./frontend. API accessible sur http://localhost:8000/docs",
		LocalRunningTip:   "[✓] BMS en cours d'exécution en arrière-plan. Appuyez sur Ctrl+C pour arrêter.",
		LocalStopped:      "[✓] Backend et Frontend arrêtés.",
		InstallingDeps:    "[*] Installation/Mise à jour des dépendances...",
		InstallingPip:     "1. Installation des bibliothèques Python (requirements.txt)...",
		PipSuccess:        "[✓] Dépendances Python installées.",
		InstallingNpm:     "2. Installation des dépendances Node.js dans ./frontend...",
		NpmSuccess:        "[✓] Dépendances NPM installées.",
		LogsTip:           "[*] Affichage des journaux Docker en direct (Ctrl+C pour quitter)...",
		NoActiveService:   "[!] Aucun service web actif trouvé sur les ports standard (80, 3000, 5173, 8000).",
		BrowserOpenMsg:    "[*] Ouverture du navigateur web sur : %s",
		InvalidOption:     "[!] Sélection non valide. Veuillez réessayer.",
		PressEnter:        "Appuyez sur [Entrée] pour continuer...",
		Goodbye:           "Au revoir !",
	},
	LangIT: {
		Title:             "BMS INDUSTRIALE - SUPERVISIONE SCADA",
		Subtitle:          "AVVIATORE DI SISTEMA & GESTORE OPERATIVO",
		CurrentStatus:     "--- Stato Attuale dei Servizi ---",
		DockerOnline:      "[ONLINE / PRONTO]",
		DockerOffline:     "[ARRESTATO / NON DISPONIBILE]",
		FrontendActive:    "[ATTIVO]",
		FrontendOffline:   "[OFFLINE]",
		BackendActive:     "[ATTIVO]",
		BackendOffline:    "[OFFLINE]",
		DbActive:          "[ATTIVO]",
		DbOffline:         "[OFFLINE]",
		OptionsHeader:     "OPZIONI DISPONIBILI:",
		OptDocker:         "Avvia BMS con Docker Compose (Consigliato / Completo)",
		OptLocal:          "Avvia BMS in Modalità Locale (Python FastAPI + Vite)",
		OptBrowser:        "Apri la Dashboard nel Browser Web",
		OptLogs:           "Visualizza i Log dei Container in tempo reale",
		OptStop:           "Arresta tutti i servizi",
		OptDeps:           "Installa / Aggiorna dipendenze (Pip & NPM)",
		OptLang:           "Cambia lingua / Change Language",
		OptExit:           "Esci",
		SelectPrompt:      "Seleziona un'opzione [0-7]: ",
		DockerSelected:    "[+] Modalità Docker Compose selezionata.",
		DockerNotRunning:  "[?] Il motore Docker non sembra essere in esecuzione.",
		DockerAskStart:    "Vuoi avviare Docker Desktop adesso? (s/n): ",
		DockerStarting:    "[*] Avvio di Docker Desktop in background...",
		DockerWaiting:     "[*] In attesa del motore Docker (fino a 60s)... ",
		DockerReady:       "Pronto!",
		DockerTimeout:     "[!] Timeout durante l'attesa di Docker Engine.",
		DockerNoInstall:   "[!] Docker Desktop non trovato nei percorsi standard.",
		StartingCompose:   "[*] Esecuzione: docker compose up -d --build",
		ComposeSuccess:    "[✓] Container avviati con successo.",
		WaitingStartup:    "[*] Attesa di 3 secondi per l'avvio dei servizi...",
		StopSelected:      "[*] Arresto dei servizi...",
		StoppingDocker:    "[*] Arresto dei container Docker...",
		StoppingLocalPid:  "[*] Chiusura processo PID %d sulla porta %d...",
		ServicesStopped:   "[✓] Tutti i servizi sono stati arrestati.",
		LocalSelected:     "[+] Modalità Locale (Backend FastAPI + Frontend Vite) selezionata.",
		PyNotFound:        "[!] Python non è disponibile nel PATH.",
		StartingBackend:   "[*] Avvio Backend FastAPI (uvicorn main:app --port 8000)...",
		StartingFrontend:  "[*] Avvio Frontend React (npm run dev)...",
		NodeModulesNotice: "[!] node_modules non trovato in ./frontend. API raggiungibile su http://localhost:8000/docs",
		LocalRunningTip:   "[✓] BMS in esecuzione in background. Premi Ctrl+C per arrestare.",
		LocalStopped:      "[✓] Backend e Frontend arrestati.",
		InstallingDeps:    "[*] Installazione/Aggiornamento delle dipendenze...",
		InstallingPip:     "1. Installazione librerie Python da requirements.txt...",
		PipSuccess:        "[✓] Requisiti Python installati.",
		InstallingNpm:     "2. Installazione dipendenze Node.js in ./frontend...",
		NpmSuccess:        "[✓] Dipendenze NPM installate.",
		LogsTip:           "[*] Visualizzazione log Docker in tempo reale (Ctrl+C per uscire)...",
		NoActiveService:   "[!] Nessun servizio web attivo trovato sulle porte standard (80, 3000, 5173, 8000).",
		BrowserOpenMsg:    "[*] Apertura browser web su: %s",
		InvalidOption:     "[!] Selezione non valida. Riprova.",
		PressEnter:        "Premi [Invio] per continuare...",
		Goodbye:           "Arrivederci!",
	},
	LangES: {
		Title:             "BMS INDUSTRIAL - SUPERVISIÓN SCADA",
		Subtitle:          "LANZADOR DEL SISTEMA Y GESTOR DE OPERACIONES",
		CurrentStatus:     "--- Estado Actual de Servicios ---",
		DockerOnline:      "[ONLINE / LISTO]",
		DockerOffline:     "[DETENIDO / NO DISPONIBLE]",
		FrontendActive:    "[ACTIVO]",
		FrontendOffline:   "[OFFLINE]",
		BackendActive:     "[ACTIVO]",
		BackendOffline:    "[OFFLINE]",
		DbActive:          "[ACTIVO]",
		DbOffline:         "[OFFLINE]",
		OptionsHeader:     "OPCIONES DISPONIBLES:",
		OptDocker:         "Iniciar BMS con Docker Compose (Recomendado / Completo)",
		OptLocal:          "Iniciar BMS en Modo Local (Python FastAPI + Vite)",
		OptBrowser:        "Abrir Dashboard en el Navegador Web",
		OptLogs:           "Ver Logs de Contenedores en tiempo real",
		OptStop:           "Detener todos los servicios",
		OptDeps:           "Instalar / Actualizar dependencias (Pip y NPM)",
		OptLang:           "Cambiar idioma / Change Language / Sprache ändern",
		OptExit:           "Salir",
		SelectPrompt:      "Selecciona una opción [0-7]: ",
		DockerSelected:    "[+] Modo Docker Compose seleccionado.",
		DockerNotRunning:  "[?] El motor de Docker no parece estar en ejecución.",
		DockerAskStart:    "¿Deseas intentar arrancar Docker Desktop ahora? (s/n): ",
		DockerStarting:    "[*] Iniciando Docker Desktop en segundo plano...",
		DockerWaiting:     "[*] Esperando a que el motor Docker esté listo (hasta 60s)... ",
		DockerReady:       "¡Listo!",
		DockerTimeout:     "[!] Tiempo de espera agotado esperando a Docker Engine.",
		DockerNoInstall:   "[!] No se encontró Docker Desktop instalado en rutas comunes.",
		StartingCompose:   "[*] Ejecutando: docker compose up -d --build",
		ComposeSuccess:    "[✓] Contenedores iniciados correctamente.",
		WaitingStartup:    "[*] Esperando 3 segundos a que los servicios inicien...",
		StopSelected:      "[*] Deteniendo servicios...",
		StoppingDocker:    "[*] Deteniendo contenedores Docker...",
		StoppingLocalPid:  "[*] Cerrando proceso local PID %d en puerto %d...",
		ServicesStopped:   "[✓] Todos los servicios han sido detenidos.",
		LocalSelected:     "[+] Modo Local (Backend FastAPI + Frontend Vite) seleccionado.",
		PyNotFound:        "[!] Python no está disponible en el PATH.",
		StartingBackend:   "[*] Lanzando Backend FastAPI (uvicorn main:app --port 8000)...",
		StartingFrontend:  "[*] Lanzando Frontend React (npm run dev)...",
		NodeModulesNotice: "[!] node_modules no encontrado en ./frontend. Puedes acceder al API en http://localhost:8000/docs",
		LocalRunningTip:   "[✓] BMS ejecutándose en segundo plano. Presiona Ctrl+C para detener.",
		LocalStopped:      "[✓] Backend y Frontend detenidos.",
		InstallingDeps:    "[*] Instalando/Actualizando dependencias...",
		InstallingPip:     "1. Instalando librerías Python de requirements.txt...",
		PipSuccess:        "[✓] Requisitos Python instalados.",
		InstallingNpm:     "2. Instalando dependencias de Node.js en ./frontend...",
		NpmSuccess:        "[✓] Dependencias NPM instaladas.",
		LogsTip:           "[*] Mostrando últimos logs de Docker Compose (Ctrl+C para volver al menú)...",
		NoActiveService:   "[!] Ningún servicio web detectado en los puertos habituales (80, 3000, 5173, 8000).",
		BrowserOpenMsg:    "[*] Abriendo navegador en: %s",
		InvalidOption:     "[!] Opción no válida. Intenta de nuevo.",
		PressEnter:        "Presiona [Enter] para continuar...",
		Goodbye:           "¡Hasta pronto!",
	},
}

var currentLang Lang = LangEN

func detectSystemLanguage() Lang {
	for _, env := range []string{"LC_ALL", "LC_MESSAGES", "LANG"} {
		v := strings.ToLower(os.Getenv(env))
		if strings.HasPrefix(v, "de") {
			return LangDE
		}
		if strings.HasPrefix(v, "fr") {
			return LangFR
		}
		if strings.HasPrefix(v, "it") {
			return LangIT
		}
		if strings.HasPrefix(v, "es") {
			return LangES
		}
		if strings.HasPrefix(v, "en") {
			return LangEN
		}
	}

	if runtime.GOOS == "windows" {
		kernel32 := syscall.NewLazyDLL("kernel32.dll")
		proc := kernel32.NewProc("GetUserDefaultUILanguage")
		ret, _, _ := proc.Call()
		primaryLang := ret & 0x3ff
		switch primaryLang {
		case 0x07:
			return LangDE
		case 0x0c:
			return LangFR
		case 0x10:
			return LangIT
		case 0x0a:
			return LangES
		case 0x09:
			return LangEN
		}
	}
	return LangEN
}

func T() TextBundle {
	if b, ok := i18n[currentLang]; ok {
		return b
	}
	return i18n[LangEN]
}

func enableWindowsANSI() {
	if runtime.GOOS != "windows" {
		return
	}
	kernel32 := syscall.NewLazyDLL("kernel32.dll")
	setConsoleMode := kernel32.NewProc("SetConsoleMode")
	getConsoleMode := kernel32.NewProc("GetConsoleMode")

	stdOutHandle, err := syscall.GetStdHandle(syscall.STD_OUTPUT_HANDLE)
	if err == nil {
		var mode uint32
		r, _, _ := getConsoleMode.Call(uintptr(stdOutHandle), uintptr(unsafe.Pointer(&mode)))
		if r != 0 {
			mode |= 0x0004
			setConsoleMode.Call(uintptr(stdOutHandle), uintptr(mode))
		}
	}
}

func printBanner() {
	t := T()
	fmt.Print(ColorCyan + ColorBold)
	fmt.Println(`
╔═══════════════════════════════════════════════════════════════════╗
║ ` + centerText(t.Title, 65) + ` ║
║ ` + centerText(t.Subtitle, 65) + ` ║
║ ` + centerText(fmt.Sprintf("[ Language: %s | EN / DE / FR / IT / ES ]", strings.ToUpper(string(currentLang))), 65) + ` ║
╚═══════════════════════════════════════════════════════════════════╝` + ColorReset)
}

func centerText(s string, width int) string {
	if len(s) >= width {
		return s[:width]
	}
	left := (width - len(s)) / 2
	right := width - len(s) - left
	return strings.Repeat(" ", left) + s + strings.Repeat(" ", right)
}

func isPortOpen(host string, port int, timeout time.Duration) bool {
	target := fmt.Sprintf("%s:%d", host, port)
	conn, err := net.DialTimeout("tcp", target, timeout)
	if err != nil {
		return false
	}
	_ = conn.Close()
	return true
}

func checkDockerRunning() bool {
	cmd := exec.Command("docker", "info")
	err := cmd.Run()
	return err == nil
}

func getDockerDesktopPath() string {
	localAppData := os.Getenv("LOCALAPPDATA")
	p1 := filepath.Join(localAppData, "Programs", "DockerDesktop", "Docker Desktop.exe")
	if _, err := os.Stat(p1); err == nil {
		return p1
	}
	p2 := `C:\Program Files\Docker\Docker\Docker Desktop.exe`
	if _, err := os.Stat(p2); err == nil {
		return p2
	}
	return ""
}

func startDockerDesktop() bool {
	t := T()
	path := getDockerDesktopPath()
	if path == "" {
		fmt.Println(ColorRed + t.DockerNoInstall + ColorReset)
		return false
	}
	fmt.Println(ColorYellow + t.DockerStarting + ColorReset)
	cmd := exec.Command(path)
	if err := cmd.Start(); err != nil {
		fmt.Printf(ColorRed+"[!] Error: %v\n"+ColorReset, err)
		return false
	}

	fmt.Print(ColorCyan + t.DockerWaiting + ColorReset)
	for i := 0; i < 30; i++ {
		time.Sleep(2 * time.Second)
		if checkDockerRunning() {
			fmt.Println(ColorGreen + t.DockerReady + ColorReset)
			return true
		}
		fmt.Print(".")
	}
	fmt.Println(ColorRed + "\n" + t.DockerTimeout + ColorReset)
	return false
}

func openBrowser(url string) {
	t := T()
	fmt.Printf(ColorGreen+t.BrowserOpenMsg+"\n"+ColorReset, url)
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("cmd", "/c", "start", "", url)
	case "darwin":
		cmd = exec.Command("open", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	_ = cmd.Start()
}

func showSystemStatus() {
	t := T()
	fmt.Println(ColorBold + "\n" + t.CurrentStatus + ColorReset)

	dockerOk := checkDockerRunning()
	if dockerOk {
		fmt.Println("  Docker Engine:       " + ColorGreen + t.DockerOnline + ColorReset)
	} else {
		fmt.Println("  Docker Engine:       " + ColorYellow + t.DockerOffline + ColorReset)
	}

	p80 := isPortOpen("127.0.0.1", 80, 500*time.Millisecond)
	p3000 := isPortOpen("127.0.0.1", 3000, 500*time.Millisecond)
	p8000 := isPortOpen("127.0.0.1", 8000, 500*time.Millisecond)
	p5432 := isPortOpen("127.0.0.1", 5432, 500*time.Millisecond)

	if p80 {
		fmt.Println("  Frontend Nginx (80): " + ColorGreen + t.FrontendActive + " -> http://localhost" + ColorReset)
	} else if p3000 {
		fmt.Println("  Frontend Vite (3000):" + ColorGreen + t.FrontendActive + " -> http://localhost:3000" + ColorReset)
	} else {
		fmt.Println("  Frontend (80/3000):  " + ColorRed + t.FrontendOffline + ColorReset)
	}

	if p8000 {
		fmt.Println("  Backend API (8000):  " + ColorGreen + t.BackendActive + " -> http://localhost:8000/docs" + ColorReset)
	} else {
		fmt.Println("  Backend API (8000):  " + ColorRed + t.BackendOffline + ColorReset)
	}

	if p5432 {
		fmt.Println("  PostgreSQL (5432):   " + ColorGreen + t.DbActive + ColorReset)
	} else {
		fmt.Println("  PostgreSQL (5432):   " + ColorRed + t.DbOffline + ColorReset)
	}
	fmt.Println("----------------------------------\n")
}

func startWithDocker() {
	t := T()
	fmt.Println(ColorCyan + "\n" + t.DockerSelected + ColorReset)
	if !checkDockerRunning() {
		fmt.Println(ColorYellow + t.DockerNotRunning + ColorReset)
		fmt.Print(t.DockerAskStart)
		reader := bufio.NewReader(os.Stdin)
		ans, _ := reader.ReadString('\n')
		ans = strings.TrimSpace(strings.ToLower(ans))
		if ans == "s" || ans == "si" || ans == "y" || ans == "yes" || ans == "j" || ans == "ja" {
			if !startDockerDesktop() {
				return
			}
		} else {
			return
		}
	}

	fmt.Println(ColorCyan + t.StartingCompose + ColorReset)
	cmd := exec.Command("docker", "compose", "up", "-d", "--build")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin
	if err := cmd.Run(); err != nil {
		fmt.Printf(ColorRed+"[!] Error: %v\n"+ColorReset, err)
		return
	}

	fmt.Println(ColorGreen + "\n" + t.ComposeSuccess + ColorReset)
	fmt.Println(ColorCyan + t.WaitingStartup + ColorReset)
	time.Sleep(3 * time.Second)

	if isPortOpen("127.0.0.1", 80, 2*time.Second) {
		openBrowser("http://localhost")
	} else if isPortOpen("127.0.0.1", 3000, 2*time.Second) {
		openBrowser("http://localhost:3000")
	} else if isPortOpen("127.0.0.1", 8000, 2*time.Second) {
		openBrowser("http://localhost:8000/dashboard")
	}
}

func stopAllServices() {
	t := T()
	fmt.Println(ColorYellow + "\n" + t.StopSelected + ColorReset)

	if checkDockerRunning() {
		fmt.Println(ColorCyan + t.StoppingDocker + ColorReset)
		cmd := exec.Command("docker", "compose", "down")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		_ = cmd.Run()
	}

	if runtime.GOOS == "windows" {
		killPort(8000)
		killPort(3000)
		killPort(5173)
	}

	fmt.Println(ColorGreen + t.ServicesStopped + ColorReset)
}

func killPort(port int) {
	t := T()
	out, err := exec.Command("netstat", "-ano").Output()
	if err != nil {
		return
	}
	lines := strings.Split(string(out), "\n")
	target := fmt.Sprintf(":%d", port)
	for _, line := range lines {
		if strings.Contains(line, target) && strings.Contains(line, "LISTENING") {
			parts := strings.Fields(line)
			if len(parts) >= 5 {
				pidStr := parts[len(parts)-1]
				if pid, err := strconv.Atoi(pidStr); err == nil && pid > 0 {
					fmt.Printf(ColorYellow+t.StoppingLocalPid+"\n"+ColorReset, pid, port)
					_ = exec.Command("taskkill", "/F", "/PID", pidStr).Run()
				}
			}
		}
	}
}

func startLocalMode() {
	t := T()
	fmt.Println(ColorCyan + "\n" + t.LocalSelected + ColorReset)

	pyCmd := "python"
	if _, err := exec.LookPath(pyCmd); err != nil {
		pyCmd = "py"
		if _, err := exec.LookPath(pyCmd); err != nil {
			fmt.Println(ColorRed + t.PyNotFound + ColorReset)
			return
		}
	}

	fmt.Println(ColorGreen + t.StartingBackend + ColorReset)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	backendCmd := exec.CommandContext(ctx, pyCmd, "-m", "uvicorn", "main:app", "--port", "8000")
	backendCmd.Env = os.Environ()
	if !isPortOpen("127.0.0.1", 5432, 300*time.Millisecond) && os.Getenv("DATABASE_URL") == "" {
		backendCmd.Env = append(backendCmd.Env, "DATABASE_URL=sqlite+aiosqlite:///./bms.db")
		fmt.Println(ColorYellow + "[*] PostgreSQL no detectado en 5432. Usando SQLite local (bms.db)..." + ColorReset)
	}
	backendCmd.Stdout = os.Stdout
	backendCmd.Stderr = os.Stderr
	if err := backendCmd.Start(); err != nil {
		fmt.Printf(ColorRed+"[!] Error: %v\n"+ColorReset, err)
		return
	}

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	frontendDir := "frontend"
	nodeModulesDir := filepath.Join(frontendDir, "node_modules")
	var frontendCmd *exec.Cmd

	if _, err := os.Stat(nodeModulesDir); err == nil {
		fmt.Println(ColorGreen + t.StartingFrontend + ColorReset)
		frontendCmd = exec.CommandContext(ctx, "npm.cmd", "run", "dev")
		frontendCmd.Dir = frontendDir
		frontendCmd.Stdout = os.Stdout
		frontendCmd.Stderr = os.Stderr
		_ = frontendCmd.Start()
	} else {
		fmt.Println(ColorYellow + t.NodeModulesNotice + ColorReset)
	}

	go func() {
		for i := 0; i < 20; i++ {
			time.Sleep(1 * time.Second)
			if isPortOpen("127.0.0.1", 8000, 500*time.Millisecond) {
				time.Sleep(500 * time.Millisecond)
				if isPortOpen("127.0.0.1", 5173, 500*time.Millisecond) {
					openBrowser("http://localhost:5173")
				} else if isPortOpen("127.0.0.1", 3000, 500*time.Millisecond) {
					openBrowser("http://localhost:3000")
				} else {
					openBrowser("http://localhost:8000/dashboard")
				}
				break
			}
		}
	}()

	fmt.Println(ColorBold + ColorGreen + "\n" + t.LocalRunningTip + ColorReset)
	<-sigChan
	cancel()
	if backendCmd.Process != nil {
		_ = backendCmd.Process.Kill()
	}
	if frontendCmd != nil && frontendCmd.Process != nil {
		_ = frontendCmd.Process.Kill()
	}
	killPort(8000)
	killPort(3000)
	killPort(5173)
	fmt.Println(ColorGreen + t.LocalStopped + ColorReset)
}

func installDependencies() {
	t := T()
	fmt.Println(ColorCyan + "\n" + t.InstallingDeps + ColorReset)

	fmt.Println(ColorYellow + t.InstallingPip + ColorReset)
	cmdPip := exec.Command("python", "-m", "pip", "install", "-r", "requirements.txt")
	cmdPip.Stdout = os.Stdout
	cmdPip.Stderr = os.Stderr
	if err := cmdPip.Run(); err != nil {
		fmt.Printf(ColorRed+"[!] Error: %v\n"+ColorReset, err)
	} else {
		fmt.Println(ColorGreen + t.PipSuccess + ColorReset)
	}

	fmt.Println(ColorYellow + "\n" + t.InstallingNpm + ColorReset)
	cmdNpm := exec.Command("npm.cmd", "install")
	cmdNpm.Dir = "frontend"
	cmdNpm.Stdout = os.Stdout
	cmdNpm.Stderr = os.Stderr
	if err := cmdNpm.Run(); err != nil {
		fmt.Printf(ColorRed+"[!] Error: %v\n"+ColorReset, err)
	} else {
		fmt.Println(ColorGreen + t.NpmSuccess + ColorReset)
	}
}

func viewLogs() {
	t := T()
	if !checkDockerRunning() {
		fmt.Println(ColorYellow + t.DockerOffline + ColorReset)
		return
	}
	fmt.Println(ColorCyan + "\n" + t.LogsTip + ColorReset)
	cmd := exec.Command("docker", "compose", "logs", "--tail=50", "-f")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin
	_ = cmd.Run()
}

func openDefaultBrowserAction() {
	t := T()
	if isPortOpen("127.0.0.1", 80, 500*time.Millisecond) {
		openBrowser("http://localhost")
	} else if isPortOpen("127.0.0.1", 3000, 500*time.Millisecond) {
		openBrowser("http://localhost:3000")
	} else if isPortOpen("127.0.0.1", 5173, 500*time.Millisecond) {
		openBrowser("http://localhost:5173")
	} else if isPortOpen("127.0.0.1", 8000, 500*time.Millisecond) {
		openBrowser("http://localhost:8000/dashboard")
	} else {
		fmt.Println(ColorYellow + t.NoActiveService + ColorReset)
	}
}

func changeLanguageInteractive(reader *bufio.Reader) {
	fmt.Println(ColorCyan + "\nSELECT LANGUAGE / SPRACHE WÄHLEN / CHOISIR LA LANGUE / SELEZIONA LINGUA / IDIOMA:" + ColorReset)
	fmt.Println("  [1] English (EN)")
	fmt.Println("  [2] Deutsch (DE)")
	fmt.Println("  [3] Français (FR)")
	fmt.Println("  [4] Italiano (IT)")
	fmt.Println("  [5] Español (ES)")
	fmt.Print("Choice / Auswahl [1-5]: ")
	ans, _ := reader.ReadString('\n')
	switch strings.TrimSpace(ans) {
	case "1", "en", "EN":
		currentLang = LangEN
		fmt.Println(ColorGreen + "[✓] Language changed to English." + ColorReset)
	case "2", "de", "DE":
		currentLang = LangDE
		fmt.Println(ColorGreen + "[✓] Sprache geändert zu Deutsch." + ColorReset)
	case "3", "fr", "FR":
		currentLang = LangFR
		fmt.Println(ColorGreen + "[✓] Langue changée en Français." + ColorReset)
	case "4", "it", "IT":
		currentLang = LangIT
		fmt.Println(ColorGreen + "[✓] Lingua modificata in Italiano." + ColorReset)
	case "5", "es", "ES":
		currentLang = LangES
		fmt.Println(ColorGreen + "[✓] Idioma cambiado a Español." + ColorReset)
	default:
		fmt.Println(ColorYellow + "No changes made." + ColorReset)
	}
}

func main() {
	enableWindowsANSI()

	// Idioma por defecto según el sistema
	currentLang = detectSystemLanguage()

	// Flags
	langFlag := flag.String("lang", string(currentLang), "Language: en, de, fr, it, es")
	dockerFlag := flag.Bool("docker", false, "Start with Docker Compose")
	localFlag := flag.Bool("local", false, "Start in Local Mode")
	stopFlag := flag.Bool("stop", false, "Stop all services")
	statusFlag := flag.Bool("status", false, "Show services status")
	browserFlag := flag.Bool("browser", false, "Open web browser")
	flag.Parse()

	switch strings.ToLower(*langFlag) {
	case "de", "german", "deutsch":
		currentLang = LangDE
	case "fr", "french", "francais", "français":
		currentLang = LangFR
	case "it", "italian", "italiano":
		currentLang = LangIT
	case "es", "spanish", "espanol", "español":
		currentLang = LangES
	case "en", "english":
		currentLang = LangEN
	}

	if *dockerFlag {
		printBanner()
		startWithDocker()
		return
	}
	if *localFlag {
		printBanner()
		startLocalMode()
		return
	}
	if *stopFlag {
		printBanner()
		stopAllServices()
		return
	}
	if *statusFlag {
		printBanner()
		showSystemStatus()
		return
	}
	if *browserFlag {
		openDefaultBrowserAction()
		return
	}

	reader := bufio.NewReader(os.Stdin)

	for {
		t := T()
		printBanner()
		showSystemStatus()

		fmt.Println(ColorBold + t.OptionsHeader + ColorReset)
		fmt.Println("  " + ColorGreen + "[1]" + ColorReset + " " + t.OptDocker)
		fmt.Println("  " + ColorGreen + "[2]" + ColorReset + " " + t.OptLocal)
		fmt.Println("  " + ColorGreen + "[3]" + ColorReset + " " + t.OptBrowser)
		fmt.Println("  " + ColorGreen + "[4]" + ColorReset + " " + t.OptLogs)
		fmt.Println("  " + ColorGreen + "[5]" + ColorReset + " " + t.OptStop)
		fmt.Println("  " + ColorGreen + "[6]" + ColorReset + " " + t.OptDeps)
		fmt.Println("  " + ColorCyan + "[7]" + ColorReset + " " + t.OptLang + " [" + strings.ToUpper(string(currentLang)) + "]")
		fmt.Println("  " + ColorRed + "[0]" + ColorReset + " " + t.OptExit)
		fmt.Print(ColorBold + "\n" + t.SelectPrompt + ColorReset)

		input, err := reader.ReadString('\n')
		if err != nil {
			break
		}
		choice := strings.TrimSpace(input)

		switch choice {
		case "1":
			startWithDocker()
		case "2":
			startLocalMode()
		case "3":
			openDefaultBrowserAction()
		case "4":
			viewLogs()
		case "5":
			stopAllServices()
		case "6":
			installDependencies()
		case "7", "l", "lang", "language", "sprache", "idioma":
			changeLanguageInteractive(reader)
		case "0", "exit", "quit", "q", "ende":
			fmt.Println(ColorGreen + "\n" + t.Goodbye + ColorReset)
			return
		default:
			fmt.Println(ColorRed + "\n" + t.InvalidOption + ColorReset)
		}

		fmt.Println(ColorCyan + "\n" + t.PressEnter + ColorReset)
		_, _ = reader.ReadString('\n')
	}
}
