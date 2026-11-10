# Marcador BMS Industrial - SCADA & Alarm Management System

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-brightgreen.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)
![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg)
![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF.svg)
![Go](https://img.shields.io/badge/Go-1.22+-00ADD8.svg)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)
![Compliance](https://img.shields.io/badge/SES_Norm-Übertragungswege-red.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**Sistema industrial integral para la supervisión técnica, control SCADA, gestión de alarmas críticas y monitorización continua de instalaciones (Building Management System).**

[Características](#-características-principales) •
[Credenciales](#-credenciales-de-fábrica-rbac) •
[Instalador Windows](#-instalador-para-windows-v10) •
[Docker Compose](#-despliegue-con-docker-compose) •
[Watchdog SES](#-watchdog-de-vías-de-transmisión-normativa-ses) •
[Telefonía SIP/TTS](#-avisos-telefónicos-voip--sip-con-tts) •
[Exportación PDF](#-auditoría-y-exportación-pdf) •
[Internacionalización](#-interfaz-multilingüe-en--de--fr--it--es)

</div>

---

## 🌟 Características Principales

- **Núcleo Asíncrono de Alto Rendimiento**: Desarrollado con **FastAPI** y **SQLAlchemy 2.0 (AsyncIO)** sobre PostgreSQL o SQLite.
- **Doble Protocolo Industrial**:
  - **Modbus TCP** (Puerto `502`) con lectura asíncrona concurrente mediante `pymodbus`.
  - **BACnet/IP** (Puerto UDP `47808`) con `BAC0` y soporte para objetos binarios y analógicos (`BI`, `BO`, `BV`, `AI`, `AO`, `AV`).
- **Watchdog de Vías de Transmisión (Normativa SES)**: Monitorización activa del enlace con los autómatas (WAGO, Siemens, etc.) con supresión de tormentas de alarmas por IP.
- **Control de Acceso Basado en Roles (RBAC)**: Autenticación criptográfica con tokens **JWT** (OAuth2 Bearer) y perfiles `root`, `admin` y `operador`.
- **Panel de Seguridad y Usuarios Exclusivo**: Interfaz protegida para administradores con creación y asignación dinámica de roles.
- **Despacho Multicanal de Notificaciones**:
  - Correo electrónico asíncrono con **SMTP / TLS** (`aiosmtplib`).
  - Telefonía VoIP / SIP mediante **PBX local** y síntesis de voz en tiempo real (**TTS** a 8kHz 16-bit Mono PCMU).
- **Mapeo Dinámico sin Reinicio**: Carga masiva de registros PLC desde archivos **Excel (.xlsx, .xls)** o **CSV** (`pandas`) con personalización de mensajes de voz por punto (`Texto_TTS`).
- **Auditoría Oficial Inalterable en PDF**: Generación en memoria de informes técnicos de incidencias mediante **ReportLab**.
- **Frontend SCADA en React 18 + Tailwind CSS**: Telemetría reactiva en tiempo real vía **WebSocket** (`/ws/alarms`), gráficas analíticas interactivas y banner crítico intermitente.
- **Multilingüe Nativo (5 Idiomas)**: Inglés (**EN**), Alemán (**DE**), Francés (**FR**), Italiano (**IT**) y Español (**ES**).
- **Instalador Oficial para Windows v1.0**: Paquete ejecutable compilado con Inno Setup 6 y lanzador nativo en Go.

---

## 🔐 Credenciales de Fábrica (RBAC)

El sistema incorpora un mecanismo de inyección automática en el arranque (`lifespan`) que garantiza la existencia del usuario maestro:

| Campo | Valor por Defecto |
| :--- | :--- |
| **Usuario** | `root` |
| **Contraseña** | `Marcadorroot` |
| **Rol de Acceso** | `ROOT` (Superusuario con privilegios totales) |

### Jerarquía de Roles
1. **`ROOT`**: Acceso ilimitado, gestión y creación de usuarios (`/api/auth/users`), importación de puntos y configuración del sistema.
2. **`ADMIN`**: Configuración técnica, importación de registros PLC, exportación de auditorías y acuse de alarmas (ACK).
3. **`OPERADOR`**: Modo operador de planta; monitorización visual de telemetría y confirmación de eventos sin permisos de modificación estructural.

---

## 📦 Instalador para Windows (v1.0)

Para instalaciones rápidas en puestos de control de operadores sobre Windows 10/11 o Windows Server, se dispone de un instalador ejecutable autónomo.

### Descarga e Instalación:
1. El instalador compilado se ubica en:
   ```plaintext
   dist_installer/Marcador_Installer_v1.0.exe
   ```
2. Ejecuta el archivo para iniciar el asistente de instalación multilingüe.
3. Permite seleccionar el idioma del asistente (**Inglés**, **Alemán**, **Francés**, **Italiano** o **Español**), crea accesos directos en el Escritorio y Menú Inicio, y registra la desinstalación limpia en el Panel de Control.

### Compilación del Instalador desde el Código Fuente:
Puedes regenerar el instalador en cualquier momento ejecutando el script por lotes:
```cmd
build_installer.bat
```
El script compila automáticamente los activos de producción de React con Vite (`npm run build`), el binario del lanzador en Go (`go build`) y genera el paquete final utilizando el motor de **Inno Setup 6**.

---

## ⚡ Lanzador del Sistema (`Lanzador.exe`)

El ejecutable nativo [`Lanzador.exe`](file:///c:/Castor%20Programs/Marcador/Lanzador.exe) (compilado en Go) gestiona el ciclo de vida del sistema sin necesidad de comandos complejos:

```powershell
# Ejecución interactiva con menú en consola:
.\iniciar.bat
# o bien:
.\Lanzador.exe
```

### Opciones por Línea de Comandos:
```powershell
.\Lanzador.exe -docker      # Arranca el sistema con Docker Compose y abre el navegador
.\Lanzador.exe -local       # Inicia en Modo Local (Backend FastAPI + Frontend Vite)
.\Lanzador.exe -status      # Muestra el estado en vivo de puertos y servicios
.\Lanzador.exe -browser     # Abre el Dashboard web en el navegador predeterminado
.\Lanzador.exe -stop        # Detiene de forma segura todos los procesos y contenedores
.\Lanzador.exe -lang en     # Fuerza idioma en inglés (en / de / fr / it / es)
```

---

## 🐳 Despliegue con Docker Compose

El despliegue en contenedores es el método recomendado para producción y servidores industriales (IPCs, servidores locales o Raspberry Pi 4/5).

### 1. Variables de Entorno
Copia la plantilla de configuración:
```bash
cp .env.example .env
```

### 2. Levantar la Infraestructura
```bash
docker compose up -d --build
```

Esto desplegará de forma orquestada:
- **`bms_postgres`**: Base de datos PostgreSQL 16 Alpine con almacenamiento persistente.
- **`bms_fastapi`**: Servidor backend FastAPI con motor asíncrono Modbus/BACnet (puertos `8000/tcp` y `47808/udp`).
- **`bms_react`**: Servidor web Nginx Alpine de alta velocidad (puerto `80`) con compresión gzip, enrutamiento SPA y proxy inverso hacia la API.

### 3. Puntos de Entrada
- **Dashboard Web SCADA**: [http://localhost](http://localhost) (o puerto `8000/dashboard` en modo autónomo).
- **Documentación Interactiva Swagger / OpenAPI**: [http://localhost:8000/docs](http://localhost:8000/docs).
- **Canal WebSocket de Alarmas**: `ws://localhost:8000/ws/alarms`.

---

## 🛡️ Watchdog de Vías de Transmisión (Normativa SES)

Conforme a las normativas de la **SES** (*Verband Schweizerischer Errichter von Sicherheitsanlagen*), el sistema debe garantizar la monitorización ininterrumpida de las vías de comunicación (*Übertragungswege*).

### Funcionamiento del Watchdog:
1. **Detección por Dirección IP**: El motor evalúa periódicamente cada controlador. Si un autómata no responde a lecturas Modbus o BACnet, se computan los fallos consecutivos.
2. **Supresión de Tormentas de Alarmas**: Si un autómata con 50 puntos pierde alimentación o se desconecta el cable de red, **no se generan 50 alarmas**. Los puntos físicos se silencian y, tras `MAX_TIMEOUTS = 3` ciclos consecutivos (~6 segundos), se emite **una única alarma crítica de enlace de red para todo el equipo**.
3. **Banner Crítico en el Frontend**: En el cliente React, los eventos del grupo `"SISTEMA - WATCHDOG"` no se mezclan con las tarjetas convencionales; activan un banner superior rojo intermitente con icono `WifiOff` y chips con las direcciones IP de los controladores inaccesibles.
4. **Restablecimiento Automático**: Cuando el autómata vuelve a responder físicamente, la alarma se resuelve en base de datos (`status = RESOLVED`, `resolved_at = func.now()`) y desaparece del banner en tiempo real.

---

## 📞 Avisos Telefónicos VoIP / SIP con TTS

El módulo [`sip_caller.py`](file:///c:/Castor%20Programs/Marcador/sip_caller.py) permite alertar a técnicos de guardia mediante llamadas telefónicas automatizadas a través de una centralita PBX local (ej. Asterisk, FreePBX o 3CX):

1. **Generación de Voz (TTS)**: Síntesis de voz dinámica mediante `gTTS`.
2. **Conversión Estricta de Audio**: Mediante `pydub` y `ffmpeg`, el audio se remuestrea a **8.000 Hz, 16 bits, canal Mono en formato WAV/PCMU**, cumpliendo los requisitos estrictos de telefonía SIP.
3. **Marcación SIP**: A través de `pyVoIP`, la aplicación registra una extensión en la PBX, marca al número asignado al grupo de alarma y reproduce el audio en bucle hasta que el técnico conteste o cuelgue.
4. **Mensajes Personalizables por Excel/CSV**: Cada fila del archivo de importación puede incluir una columna `Texto_TTS` o `Mensaje_Voz` con el guion exacto que la locución reproducirá al llamar.

---

## 📄 Auditoría y Exportación PDF

El módulo [`pdf_exporter.py`](file:///c:/Castor%20Programs/Marcador/pdf_exporter.py) genera documentos técnicos oficiales e inalterables en formato PDF mediante la librería **ReportLab**:

- Formato horizontal **A4 Landscape** con cabecera corporativa y sello de tiempo de emisión.
- Tabla detallada con marcas de tiempo de inicio, punto de datos, grupo técnico, estado de la incidencia, traza de notificaciones emitidas (Email/Voz) y fecha de resolución física.
- Descarga en memoria (*streaming* sin archivos temporales en disco) a través del endpoint:
  ```http
  GET /api/alarms/export/pdf?lang=es
  ```
  Soporta el parámetro `?lang=en`, `?lang=de`, `?lang=fr` o `?lang=it` para adaptar los títulos y encabezados de tabla al idioma requerido por el auditor.

---

## 🌐 Interfaz Multilingüe (EN / DE / FR / IT / ES)

Tanto el Dashboard web como el Lanzador de Windows ofrecen conmutación instantánea entre 5 idiomas:

| Código | Idioma | Área Geográfica / Normativa |
| :---: | :--- | :--- |
| **`EN`** | English | Internacional / Estándar técnico |
| **`DE`** | Deutsch | Suiza (DSCH) / Alemania / Austria (SES, DIN EN 50518) |
| **`FR`** | Français | Suisse Romande / Francia |
| **`IT`** | Italiano | Svizzera Italiana / Italia |
| **`ES`** | Español | España / Latinoamérica |

El selector situado en la barra superior del Dashboard permite cambiar el idioma al vuelo sin recargar la página; las preferencias quedan persistidas en el almacenamiento local del navegador (`bms_lang`).

---

## 🛠️ Estructura del Proyecto

```plaintext
Marcador/
├── dist_installer/            # Instalador ejecutable final para Windows (v1.0)
│   └── Marcador_Installer_v1.0.exe
├── frontend/                  # Aplicación SPA React 18 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/        # Dashboard, Login, UserManagement, AuditTable, etc.
│   │   ├── i18n.jsx           # Motor de internacionalización (EN, DE, FR, IT, ES)
│   │   └── App.jsx            # Enrutamiento, interceptores Axios y topbar
│   ├── dist/                  # Distribución compilada para producción
│   └── standalone_dashboard.html # Dashboard autónomo sin bundler
├── backend/                   # Espejo del backend para contenedor Docker
├── auth.py                    # Motor de autenticación RBAC, hashing bcrypt y tokens JWT
├── database.py                # Conexión SQLAlchemy 2.0 AsyncIO y pool de conexiones
├── models.py                  # Modelos relacionales (User, DataPoint, AlarmGroup, AlarmEvent)
├── polling.py                 # Motor de polling Modbus/BACnet con Watchdog SES
├── routes.py                  # Endpoints REST (puntos, dashboard, métricas, auditoría)
├── notifications.py           # Despacho de notificaciones por Email y canal telefónico
├── sip_caller.py              # Cliente VoIP / SIP con reproducción TTS a 8kHz
├── pdf_exporter.py            # Generador nativo de actas de auditoría en PDF
├── launcher.go                # Código fuente del Lanzador en Go con consola multilingüe
├── Lanzador.exe               # Binario ejecutable compilado del Lanzador
├── installer.iss              # Script de compilación de Inno Setup 6
├── build_installer.bat        # Automatización de compilación y empaquetado del instalador
├── docker-compose.yml         # Orquestación de servicios PostgreSQL, FastAPI y Nginx
└── requirements.txt           # Dependencias de Python
```

---

## 📜 Licencia

Distribuido bajo la Licencia **MIT**. Consulta el archivo `LICENSE` o ponte en contacto con el equipo de desarrollo para soporte en integraciones industriales específicas.
