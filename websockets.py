from typing import List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Almacena las conexiones activas de los navegadores web
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        """Envía un JSON a todos los clientes conectados simultáneamente."""
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error enviando mensaje por WS: {e}")

# Instancia global que usaremos en toda la aplicación
manager = ConnectionManager()

