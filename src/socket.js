const TicTacToe = require('./TicTacToe');
const {
    getSalas,
    setSala,
    removerSala,
    criarOuAtualizarJogo,
    getJogo
} = require('./GameManager');

function setupSocket(io) {
    io.on('connection', (socket) => {
        // === ENTRAR NA SALA ===
        socket.on('entrar-sala', ({ nome, sala }) => {
            const salas = getSalas();

            if (!salas[sala]) {
                salas[sala] = [];
            } else if (salas[sala].some(j => j.nome === nome)) {
                socket.emit('jogador-existente');
                return;
            }

            salas[sala].push({ id: socket.id, nome });
            socket.join(sala);
            setSala(sala, salas[sala]);

            console.log(`🟢 ${nome} entrou na sala ${sala}`);

            if (salas[sala].length === 1) {
                socket.emit('aguardando');
            } else if (salas[sala].length === 2) {
                const jogadores = salas[sala].map(j => j.nome);
                const jogo = new TicTacToe(jogadores[0], jogadores[1]);

                criarOuAtualizarJogo(sala, jogo);
                io.to(sala).emit('jogadores-pareados', { jogadores });

                setTimeout(() => {
                    io.to(sala).emit('iniciar', { jogadores });
                }, 3000);
            }
        });

        // === DESTRUIR SALA ===
        socket.on('destroy-sala', ({salaJogo, jogador}) => {
            removerSala(salaJogo);
            socket.leave(salaJogo);
            console.log(`🔴 ${jogador} destruiu a sala ${salaJogo}`);
        });

        // === REALIZAR JOGADA ===
        socket.on('jogada', ({ sala, jogador, casaJogada }) => {
            const jogo = getJogo(sala);
            if (!jogo) return;

            const idCasa = Number(casaJogada.split('-')[1]);
            jogo.fazerJogada(jogador, idCasa);
            criarOuAtualizarJogo(sala, jogo);

            io.to(sala).emit('mostrar-jogada', {
                idCasa,
                jogada: jogo.simbolos[jogador],
                vez: jogo.vez
            });

            const resultado = jogo.checarVitoriaOuEmpate();

            if (resultado === null) {
                console.log(`🔄 Jogo em andamento na sala ${sala}`);
            } else  if (resultado === -1) {
                io.to(sala).emit('fim-de-jogo', null);
                console.log(`🤝 Empate na sala ${sala}`);
            } else {
                const vencedor = jogo.getJogadorPorSimbolo(resultado.simbolo);
                io.to(sala).emit('fim-de-jogo', vencedor);
                console.log(`🏆 Vencedor na sala ${sala}: ${vencedor}`);
            }
        });

        // === REINICIAR JOGO ===
        socket.on('reiniciar', ({ nome, sala }) => {
            const jogo = getJogo(sala);
            const salas = getSalas();

            if (!jogo || !salas[sala]) {
                console.warn(`⚠️ Sala ou jogo não encontrados para reinício: ${sala}`);
                return;
            }

            const podeReiniciar = jogo.reiniciarJogo(nome);

            if (podeReiniciar) {
                io.to(sala).emit('ambos-jogam-denovo', jogo.vez);
                criarOuAtualizarJogo(sala, jogo);
                console.log(`🔁 Jogo reiniciado na sala ${sala}`);
            } else {
                const outroJogador = jogo.jogadores.find(j => j !== nome);
                const socketOutroJogador = salas[sala].find(obj => obj.nome === outroJogador);

                socket.emit('esperar-j2-aceitar', outroJogador);

                if (socketOutroJogador) {
                    const socketReal = io.sockets.sockets.get(socketOutroJogador.id);
                    if (socketReal) {
                        socketReal.emit('confirmar-reinicio', nome);
                        criarOuAtualizarJogo(sala, jogo);
                        console.log(`🔄 ${nome} solicitou reinício para ${outroJogador}`);
                    } else {
                        console.warn(`⚠️ Socket de ${outroJogador} não encontrado`);
                    }
                } else {
                    console.warn(`⚠️ ${outroJogador} não está na sala ${sala}`);
                }
            }
        });

        // === DESCONECTAR ===
        socket.on('disconnect', () => {
            removerSala(null, socket.id);
            console.log(`🔌 Socket ${socket.id} desconectado`);
        });
    });
}

module.exports = setupSocket;
