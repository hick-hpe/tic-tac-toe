const salas = {};
const timeoutRemoverSala = {};
const TicTacToe = require('./TicTacToe');
const TEMPO_ESPERA_INICIAR_PARTIDA = 5000;
const TEMPO_ESPERA_AGUARDAR_CONEXAO = 20000;

function setupSocket(io) {
    io.on('connection', (socket) => {
        console.log(`🟢 Socket ${socket.id} conectado`);

        // ========================================================== criar sala ==========================================================
        socket.on('criar-sala', ({ nome, sala }) => {
            console.log(`Sala criada por ${nome} na sala "${sala}"`);

            // Verifica se a sala já existe, se não, cria uma nova
            if (!salas[sala]) {
                salas[sala] = { jogadores: [] };
            }
            
            console.log('=== salas disponíveis ===');
            console.log(Object.keys(salas));
            
            // Adiciona o jogador à sala
            if (salas[sala].jogadores.some(j => j.nome === nome)) {
                // Se já existe um jogador com esse nome na sala, emite erro
                socket.emit('erro', { mensagem: 'Já existe um jogador com esse nome na sala!' });
                return;
            }
            salas[sala].jogadores.push({ id: socket.id, nome });
            socket.join(sala);
            console.log('=== jogadores na sala ===');
            console.log(salas[sala].jogadores);

            // se tiver 2 jogadores, iniciar partida
            if (salas[sala].jogadores.length === 2) {
                console.log(`Iniciando partida na sala "${sala}" com jogadores:`, salas[sala].jogadores.map(j => j.nome));
                
                // remover timeout de remoção da sala, pois já tem 2 jogadores
                clearTimeout(timeoutRemoverSala[sala]);

                // criar instância do jogo TicTacToe
                const jogador1 = salas[sala].jogadores[0].nome;
                const jogador2 = salas[sala].jogadores[1].nome;
                salas[sala].jogo = new TicTacToe(jogador1, jogador2);

                // informar aos jogadores que estão pareados
                io.to(sala).emit('jogadores-pareados', {
                    jogadores: salas[sala].jogadores.map(j => j.nome)
                });

                // aguardar 3 segundos antes de iniciar a partida
                setTimeout(() => {
                    const numJogadorComeca = Math.floor(Math.random() * 2);

                    io.to(sala).emit('iniciar', {
                        jogadores: salas[sala].jogadores.map(j => j.nome),
                        jogadorComeca: salas[sala].jogadores[numJogadorComeca].nome
                    });
                }, TEMPO_ESPERA_INICIAR_PARTIDA);
            } else {
                // se não tiver 2 jogadores, aguardar
                timeoutRemoverSala[sala] = setTimeout(() => {
                    console.log(`Removendo sala "${sala}" por inatividade`);
                    delete salas[sala];
                    clearTimeout(timeoutRemoverSala[sala]);
                }, TEMPO_ESPERA_AGUARDAR_CONEXAO); // 20 segundos de inatividade

                // informar ao jogador que está aguardando
                socket.emit('aguardando');
            }
        });

        // ========================================== jogadas ==========================================
        socket.on('jogada', ({ sala, jogador, casaId }) => {
            console.log(`Jogada recebida de ${jogador} na sala "${sala}" na casa ${casaId}`);

            // Verifica se a sala existe e se o jogo está iniciado
            if (!salas[sala] || !salas[sala].jogo) {
                console.log(`Sala "${sala}" não encontrada ou jogo não iniciado`);
                socket.emit('erro', { mensagem: 'Sala não encontrada ou jogo não iniciado.' });
                return;
            }

            const jogo = salas[sala].jogo;
            const jogadaValida = jogo.fazerJogada(jogador, casaId);
            jogo.exibirTabuleiro();

            if (!jogadaValida) {
                console.log(`Jogada inválida de ${jogador} na sala "${sala}"`);
                socket.emit('erro', { mensagem: 'Jogada inválida.' });
                return;
            }

            console.log(`Jogada válida de ${jogador} na sala "${sala}"`);
            io.to(sala).emit('atualizar-tabuleiro', {
                casaId,
                vez: jogo.vez,
                simbolo: jogo.simbolos[jogador]
            });


            // Verifica se o jogo terminou
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

        // ====================================================== jogador desconectado ======================================================
        socket.on('disconnect', () => {
            console.log(`🔌 Socket ${socket.id} desconectado`);

            // remover o jogador de todas as salas
            for (const sala in salas) {
                const index = salas[sala].jogadores.findIndex(j => j.id === socket.id);
                if (index !== -1) {
                    const jogador = salas[sala].jogadores[index].nome;
                    console.log(`Jogador ${jogador} desconectado da sala "${sala}"`);

                    // remover o jogador da sala
                    salas[sala].jogadores.splice(index, 1);

                    // se a sala ficar vazia, remover a sala
                    if (salas[sala].jogadores.length === 0) {
                        console.log(`Removendo sala "${sala}" por estar vazia`);
                        delete salas[sala];
                        clearTimeout(timeoutRemoverSala[sala]);
                    } else {
                        // se ainda tiver jogadores, informar aos restantes
                        io.to(sala).emit('jogador-desconectado', { nome: jogador });
                    }
                }
            }
        });
    });
}

module.exports = setupSocket;
