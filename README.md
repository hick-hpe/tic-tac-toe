<h1 style="text-align: center; margin-bottom: 30px;">
    Tic Tac Toe - Multiplayer
</h1>

[![Node JS](https://img.shields.io/badge/Node%20js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap%205-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)](https://getbootstrap.com/)

Este projeto é um jogo da velha (Tic Tac Toe) com suporte a multiplayer em tempo real, utilizando Socket.IO.

Todas as funcionalidades foram desenvolvidas em branches separadas ao longo do processo. A branch `main` representa a versão final e estável do projeto, contendo todas as funcionalidades integradas:

- Criação de salas com código
- Conexão entre dois jogadores
- Comunicação em tempo real via WebSocket
- Reinício de partida após o fim do jogo
- Interface simples e responsiva

## 🛠️ Tecnologias Utilizadas

- Node.js
- Express
- Socket.IO
- HTML/CSS/JS
- Bootstrap

## 🔁 Como funciona?

### 🖥️ Inserindo Dados

   O jogador irá iniciar com a seguinte página:
   ![Página inicial](assets/img/pagina-inicial.png)
   Aqui o jogador deverá inserir seu nome e o nome da sala para jogar. O sistema aguardará 20 segundos para encontrar uma conexão para esta sala.

   ![Esperando adversário](assets/img/esperando-adversario.png)
   Caso não encontre-a, removerá a sala.
   
### 🖥️ Encontrou adversário

   Após achar um adversário na mesma sala, o jogo começará!
   ![Jogadores conectados](assets/img/jogadores-conectados.png)

### 🖥️ Partida Iniciada
   
   ![Partida Iniciada](assets/img/partida-iniciada.png)
   O jogador que começará a partida será aleatório!

   Após o término da partida, um jogador poderá solicitar ao outro jogador para continuar jogando, clicando no botão `Jogar Novamente`.

## 🔧 Instalação

1. Clone o repositório:
   ```
   git clone https://github.com/hick-hpe/tic-tac-toe
   cd tic-tac-toe
   ```

2. Instale as dependências:
   ```
   npm install
   ```

## 🚀 Uso

Para iniciar o servidor, execute o seguinte comando:
```
npm start
```

O servidor estará rodando em [http://localhost:3000/](http://localhost:3000/).

## 🌐 Nota (rodar localmente)

Para que outros dispositivos se conectem, devem acessar pelo ip da máquina host. <br/> Por exemplo, se o ip da máquina host é `192.168.3.27`, o link de acesso ao servidor será [http://192.168.3.27:3000/](http://192.168.3.27:3000/).