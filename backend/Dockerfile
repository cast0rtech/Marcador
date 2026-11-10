# Usa una imagen oficial de Python ligera
FROM python:3.11-slim

# Evita que Python escriba archivos .pyc y fuerza el log en tiempo real
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependencias del sistema necesarias para compilar algunas librerías y ffmpeg para audio VoIP
RUN apt-get update && apt-get install -y gcc libpq-dev ffmpeg && rm -rf /var/lib/apt/lists/*

# Instalar librerías de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente
COPY . .

# Exponer el puerto de FastAPI
EXPOSE 8000

# BACnet usa el puerto UDP 47808 por defecto para descubrimiento
EXPOSE 47808/udp

# Comando de inicio
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

