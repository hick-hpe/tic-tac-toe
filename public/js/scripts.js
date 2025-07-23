const socket = io();

// // ============================== Variáveis de estado ==============================
let jogadorLocal = '';
let salaJogo = '';
let interval;

// // ============================== Elementos DOM ==============================
const form = document.querySelector('form');
const inputNome = document.getElementById('nome');
const inputSala = document.getElementById('sala');
const info = document.querySelector('#info');
const tabuleiro = document.querySelector('#tabuleiro');
const vezJogador = document.querySelector('#vez-jogador');
const jogador1 = document.querySelector('#jogador1');
const jogador2 = document.querySelector('#jogador2');
const divAguardando = document.querySelector('#aguardando');
const btnJogar = document.querySelector('#btnJogar');
const btnReiniciar = document.querySelector('#btnReiniciar');
const btnCancelar = document.querySelector('#btnCancelar');
const casas = document.querySelectorAll('.casa');

// // ============================== Constantes ==============================
const TEMPO_ESPERA_AGUARDAR_CONEXAO = 20;
const TEMPO_ESPERA_COMECAR_PARTIDA = 5;

// // ============================== Inicialização ==============================
function inicializarInterface() {
    info.style.display = 'none';
    tabuleiro.style.display = 'none';
    divAguardando.style.display = 'none';
    btnReiniciar.style.display = 'none';
    btnCancelar.style.display = 'none';
}
inicializarInterface();

// ============================== Submissão do formulário ==============================
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nome = inputNome.value.trim();
    const sala = inputSala.value.trim();
    jogadorLocal = nome;
    salaJogo = sala;

    const botaoClicado = e.submitter;

    if (botaoClicado.id === 'btnJogar') {
        if (nome && sala) {
            socket.emit('criar-sala', { nome, sala });
        } else {
            alert("Preencha os dois campos.");
        }
    } else if (botaoClicado.id === 'btnCancelar') {
        btnJogar.style.display = '';
        btnCancelar.style.display = 'none';
        divAguardando.style.display = 'none';
    }
});

function esperarEstabelecerConexao(tempo) {
    divAguardando.textContent = `Aguardando por estabelecer conexão... (${tempo}s)`;

    interval = setInterval(() => {
        tempo--;
        divAguardando.textContent = `Aguardando por estabelecer conexão... (${tempo}s)`;

        if (tempo <= 0) {
            clearInterval(interval);
            divAguardando.style.display = 'none';
            btnJogar.style.display = '';
            btnCancelar.style.display = 'none';
        }
    }, 1000);
}

function esperarIniciarPartida(tempo) {
    divAguardando.textContent = `A partida começará em ${tempo}s`;

    interval = setInterval(() => {
        tempo--;
        divAguardando.textContent = `A partida começará em ${tempo}s`;

        if (tempo <= 0) {
            clearInterval(interval);
            divAguardando.style.display = 'none';
            btnJogar.style.display = 'none';
            btnCancelar.style.display = 'none';
        }
    }, 1000);
}

socket.on('erro', ({ mensagem }) => {
    alert(mensagem);
});

socket.on('aguardando', () => {
    btnJogar.style.display = 'none';
    btnCancelar.style.display = '';
    divAguardando.style.display = '';
    esperarEstabelecerConexao(TEMPO_ESPERA_AGUARDAR_CONEXAO);
});

socket.on('jogadores-pareados', ({ jogadores }) => {
    clearInterval(interval);
    divAguardando.style.display = 'none';
    const outroJogador = jogadores.find(j => j !== jogadorLocal);
    btnCancelar.style.display = 'none';
    btnJogar.style.display = '';
    btnJogar.className = btnJogar.className.replace('success', 'warning');
    btnJogar.innerHTML = `Conectado com ${outroJogador}...`;
    btnJogar.disabled = true;

    // mensagem de preparação para partida
    divAguardando.style.display = '';
    esperarIniciarPartida(TEMPO_ESPERA_COMECAR_PARTIDA);
});


// =================================================== PREPARAR DADOS PARA INICIAR A PARTIDA ===================================================
socket.on('iniciar', ({ jogadores, jogadorComeca }) => {
    // Esconder formulário e aguardando
    form.style.display = 'none';
    divAguardando.style.display = 'none';

    // Exibir informações do jogo
    info.style.display = '';
    tabuleiro.style.display = '';
    vezJogador.textContent = jogadorComeca;
    jogador1.textContent = jogadores[0];
    jogador2.textContent = jogadores[1];

    // eventos de clique nas casas
    casas.forEach(casa => {
        casa.addEventListener('click', () => {
            if (jogadorLocal === vezJogador.textContent) {
                socket.emit('jogada', {
                    sala: salaJogo,
                    jogador: jogadorLocal,
                    casaJogada: casa.id
                });
            } else {
                alert('Não é sua vez!');
            }
        });
    });
});


function exibirMenu() {
    // Limpar estado do jogo
    form.style.display = '';
    info.style.display = 'none';
    tabuleiro.style.display = 'none';
    divAguardando.style.display = 'none';
    btnReiniciar.style.display = 'none';
    btnCancelar.style.display = 'none';
    btnJogar.style.display = '';
    btnJogar.className = btnJogar.className.replace('warning', 'success');
    btnJogar.innerHTML = 'Jogar';
    btnJogar.disabled = false;

    // Limpar campos de entrada
    inputNome.value = '';
    inputSala.value = '';
    jogadorLocal = '';
    salaJogo = '';
}

// ====================================================== jogador desconectado ======================================================
socket.on('jogador-desconectado', ({ nome }) => {
    console.log(`🔌 Jogador ${nome} desconectado`);
    const mensagem = `O(A) jogador(a) ${nome} desconectou.`;
    alert(mensagem);

    // direcionar o usuário de volta ao início
    exibirMenu();
});





// // ============================== Exibir resultado do jogo ==============================
// function exibirResultado(vencedor = null, meuNome = '') {
//     const modal = new bootstrap.Modal(document.getElementById('modal'));
//     const modalTitle = document.getElementById('modalLabel');
//     const modalBody = document.getElementById('modalBody');

//     if (vencedor === null) {
//         modalTitle.textContent = 'Empate!';
//         modalBody.innerHTML = '<p>Ninguém venceu a partida.</p>';
//     } else if (vencedor === meuNome) {
//         modalTitle.textContent = 'Vitória!';
//         modalBody.innerHTML = '<p>Parabéns, você venceu!</p>';
//     } else {
//         modalTitle.textContent = 'Derrota';
//         modalBody.innerHTML = `<p>${vencedor} venceu a partida.</p>`;
//     }

//     modal.show();
// }

// // ============================== Eventos de clique nas casas ==============================
// casas.forEach(casa => {
//     casa.addEventListener('click', () => {
//         if (jogadorLocal === vezJogador.textContent) {
//             socket.emit('jogada', {
//                 sala: salaJogo,
//                 jogador: jogadorLocal,
//                 casaJogada: casa.id
//             });
//         } else {
//             alert('Não é sua vez!');
//         }
//     });
// });

// // ============================== Botões ==============================
// btnReiniciar.addEventListener('click', () => {
//     btnReiniciar.disabled = true;
//     socket.emit('reiniciar', { nome: jogadorLocal, sala: salaJogo });
// });

// // ============================== Funções ==============================

// function limparTabuleiro() {
//     casas.forEach(casa => {
//         casa.innerHTML = '';
//     });
// }

// // ============================== Eventos do socket ==============================
// socket.on('esperar-j2-aceitar', (outroJogador) => {
//     btnReiniciar.innerHTML = `Esperando <strong>${outroJogador}</strong> aceitar...`;
// });

// socket.on('confirmar-reinicio', (outroJogador) => {
//     btnReiniciar.innerHTML = `<strong>${outroJogador}</strong> quer jogar com você de novo...`;
// });

// socket.on('ambos-jogam-denovo', (jogador) => {
//     limparTabuleiro();
//     vezJogador.textContent = jogador;
//     btnReiniciar.textContent = 'Reiniciar';
//     btnReiniciar.style.display = 'none';
//     btnReiniciar.disabled = false;
// });

// socket.on('jogadores-pareados', ({ jogadores }) => {
//     btnCancelar.style.display = 'none';
//     btnJogar.style.display = '';
//     const outroJogador = jogadores.find(j => j !== jogadorLocal);
//     btnJogar.className = btnJogar.className.replace('success', 'warning');
//     btnJogar.innerHTML = `Conectado com ${outroJogador}...`;
//     btnJogar.disabled = true;

//     aguardando.style.display = '';
//     aguardando.innerHTML = `A partida começará em <span id="stempo"></span>s`;
//     contarTempo(TEMPO_ESPERA_COMECAR_PARTIDA);
// });

// socket.on('jogador-existente', () => {
//     alert('Já existe um jogador com esse nome!');
// });

// socket.on('aguardando', () => {
//     aguardando.style.display = '';
//     btnCancelar.style.display = '';
//     contarTempo(TEMPO_ESPERA_AGUARDAR_CONEXAO, true);
// });

// socket.on('iniciar', ({ jogadores }) => {
//     form.style.display = 'none';
//     aguardando.style.display = 'none';
//     info.style.display = '';
//     tabuleiro.style.display = '';

//     vezJogador.textContent = jogadores[0];
//     jogador1.textContent = jogadores[0];
//     jogador2.textContent = jogadores[1];
// });

// socket.on('mostrar-jogada', ({ idCasa, jogada, vez }) => {
//     const casa = document.getElementById(`casa-${idCasa}`);
//     const classeCasa = jogada === 'X' ? 'text-dark' : 'text-danger';
//     casa.textContent = jogada;
//     casa.className = `casa ${classeCasa}`;
//     vezJogador.textContent = vez;
// });

// socket.on('fim-de-jogo', (jogador) => {
//     console.log('vitoria?', (jogador !== null));
//     console.log('empate?', (jogador === null));
//     console.log(`jogador: ${jogador}`);

//     if (jogador === null) {
//         exibirResultado(null);
//     } else {
//         exibirResultado(jogador, jogadorLocal);
//     }
//     btnReiniciar.style.display = '';
//     btnReiniciar.disabled = false;
// });
