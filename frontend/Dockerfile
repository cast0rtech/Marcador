# Etapa 1: Compilación (Build)
FROM node:20-alpine AS build

WORKDIR /app

# Copiar dependencias e instalar
COPY package.json package-lock.json* ./
RUN npm install

# Copiar el resto del código y compilar para producción
COPY . .
RUN npm run build

# Etapa 2: Servidor Web (Nginx)
FROM nginx:alpine

# Copiar los estáticos generados por Vite a la carpeta pública de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Configuración de Nginx para soportar SPA y proxy inverso a FastAPI y WebSockets
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
