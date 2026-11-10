# BMS Industrial - Building Management System

Sistema industrial completo para supervisión de edificios (**BMS**) y control de plantas en tiempo real. 

Incluye:
- **Backend**: **FastAPI** con **SQLAlchemy 2.0 asíncrono** (SQLite / PostgreSQL).
- **Motor de Telemetría**: Polling asíncrono en segundo plano compatible con **Modbus TCP (`pymodbus`)** y **BACnet/IP (`BAC0`)**.
- **Gestión de Alarmas y Notificaciones**: Generación y resolución automática de incidencias y envío asíncrono de correos vía SMTP (`aiosmtplib`) con auditoría en `NotificationLog`.
- **Importación/Exportación Masiva**: Carga y descarga de puntos en **CSV y Excel (`pandas`)**.
- **Llamadas de Voz VoIP / SIP**: Despacho automático de avisos telefónicos por voz TTS (`pyVoIP`, `gTTS`, `pydub`, `ffmpeg`) con PBX local.
- **Frontend SCADA Multilingüe**: Dashboard SPA en **React**, **Tailwind CSS**, **Recharts** con soporte para **Español**, **Inglés** y **Alemán**.
- **Lanzador Nativo**: Ejecutable autónomo `Lanzador.exe` para gestión del sistema en Windows.

---

## ⚡ Lanzador Rápido para Windows (`Lanzador.exe`)

El proyecto incluye un ejecutable nativo de control de servicios compilado en Go con detección automática de idioma (`ES`, `EN`, `DE`).

Puedes ejecutarlo con doble clic en **`iniciar.bat`** o directamente desde consola:
```powershell
.\Lanzador.exe            # Menú interactivo con selector de idioma
.\Lanzador.exe -docker    # Inicia con Docker Compose y abre el navegador
.\Lanzador.exe -local     # Inicia en Modo Local (FastAPI + Vite)
.\Lanzador.exe -status    # Comprueba el estado de puertos y servicios
.\Lanzador.exe -lang de   # Inicia directamente en alemán
.\Lanzador.exe -lang en   # Inicia directamente en inglés
.\Lanzador.exe -stop      # Detiene todos los servicios y libera puertos
```

---

## 🐳 Despliegue Rápido con Docker Compose (Recomendado)

Todo el sistema está listo para ejecutarse en entornos locales u on-premise sin dependencias externas en la nube.

### 1. Clonar y configurar variables de entorno (Opcional)
```bash
cp .env.example .env
```

### 2. Construir y levantar los contenedores
```bash
docker compose up -d --build
```

Esto desplegará de forma automática y orquestada:
1. **`bms_postgres`**: Base de datos relacional PostgreSQL 15 con volumen persistente (`bms_postgres_data`).
2. **`bms_fastapi`**: Servicio backend FastAPI con motor de comunicaciones Modbus/BACnet en el puerto `8000` y `47808/udp`.
3. **`bms_react`**: Servidor Web Nginx de alto rendimiento en el puerto `80` sirviendo la SPA de React compilada en multi-etapa y funcionando como *reverse proxy* hacia la API.

### 3. Acceso a los Servicios

- **Dashboard SCADA / Frontend**: **[http://localhost](http://localhost)** o **[http://localhost:3000](http://localhost:3000)**
- **Documentación Swagger API**: **[http://localhost:8000/docs](http://localhost:8000/docs)** (o **[http://localhost/docs](http://localhost/docs)**)
- **Base de Datos PostgreSQL**: `localhost:5432` (Usuario: `bms_user`, Base de datos: `bms_db`)

Para ver los logs en tiempo real del motor de polling y el backend:
```bash
docker compose logs -f backend
```

Para detener el sistema:
```bash
docker compose down
```

---

## 🍓 Despliegue Específico en Raspberry Pi / Servidores Industriales (IPC)

El stack está optimizado tanto para arquitecturas **x86_64 (AMD64)** como **ARM64 (Raspberry Pi 4, Pi 5, RockPi, IPCs industriales)** gracias a las imágenes base multi-arquitectura (`python:3.11-slim`, `postgres:16-alpine` y `nginx:alpine`).

### Particularidad de BACnet/IP en Entornos Industriales:
- **Modbus TCP**: Funciona directamente a través del puente de red virtual de Docker (`bridge`), comunicando punto a punto con los autómatas o gateways.
- **BACnet/IP**: Utiliza mensajes de difusión UDP (*broadcast* en puerto 47808, ej. `Who-Is` / `I-Am`). Para permitir que el contenedor descubra autómatas físicos en la misma subred LAN sin bloqueos de red interna de Docker:
  1. En [docker-compose.yml](file:///Users/castordfedez/Marcador/docker-compose.yml), activa `network_mode: "host"` en el servicio `backend` (o mantén el mapeo `47808:47808/udp` si tu pasarela BACnet admite unicast).
  2. Define la IP estática y máscara de tu interfaz de red en `.env` (ej. `BACNET_IP=192.168.1.50/24`).

### Inicio Automático con el Sistema Operativo (Servicio Systemd):
En una Raspberry Pi o servidor Linux, puedes garantizar que el BMS arranque automáticamente tras cortes de suministro eléctrico mediante las directivas `restart: unless-stopped` ya configuradas en [docker-compose.yml](file:///Users/castordfedez/Marcador/docker-compose.yml).


### Backend
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend React (Vite)
```bash
cd frontend
npm install
npm run dev
```
Acceso en **`http://localhost:3000`**.
