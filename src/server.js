const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const setupSocket = require('./socket');
const cookieParser = require('cookie-parser');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const os = require("os");

// função para pegar o IP da máquina
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (let iface of Object.values(interfaces)) {
    for (let info of iface) {
      if (info.family === "IPv4" && !info.internal) {
        return info.address; // retorna o primeiro IP válido
      }
    }
  }
  return "localhost";
}

const MEU_IP = getLocalIP();

// Middlewares
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Setup Socket.io
setupSocket(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://${MEU_IP}:${PORT}`);
});