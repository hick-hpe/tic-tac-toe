const socket = io("http://localhost:3000");

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
const btnJogarNovamente = document.querySelector('#btnJogarNovamente');
const btnCancelar = document.querySelector('#btnCancelar');
const casas = document.querySelectorAll('.casa');
const simboloJ1 = document.getElementById('simboloJ1');
const simboloJ2 = document.getElementById('simboloJ2');

// // ============================== Constantes ==============================
const TEMPO_ESPERA_AGUARDAR_CONEXAO = 20;
const TEMPO_ESPERA_COMECAR_PARTIDA = 5;

// // ============================== Inicialização ==============================
function inicializarInterface() {
    info.style.display = 'none';
    tabuleiro.style.display = 'none';
    divAguardando.style.display = 'none';
    btnJogarNovamente.style.display = 'none';
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
socket.on('iniciar', ({ jogadores, jogadorComeca, simbolos }) => {
    // Esconder formulário e aguardando
    form.style.display = 'none';
    divAguardando.style.display = 'none';

    // Exibir informações do jogo
    info.style.display = '';
    tabuleiro.style.display = '';
    vezJogador.textContent = jogadorComeca;
    jogador1.textContent = jogadores[0];
    jogador2.textContent = jogadores[1];

    const j1 = jogador1.textContent;
    const j2 = jogador2.textContent;
    simboloJ1.textContent = simbolos[j1];
    simboloJ2.textContent = simbolos[j2];
    
    // colocar preto para 'X' e vermelho para 'O'
    let classeSimbolo = (simbolo) => simbolo === 'X' ? 'text-dark' : 'text-danger';
    simboloJ1.className = `me-1 fs-4 ${classeSimbolo(simbolos[j1])}`;
    simboloJ2.className = `ms-1 fs-4 ${classeSimbolo(simbolos[j2])}`;

    // eventos de clique nas casas
    casas.forEach(casa => {
        casa.addEventListener('click', () => {
            if (jogadorLocal === vezJogador.textContent) {
                socket.emit('jogada', {
                    sala: salaJogo,
                    jogador: jogadorLocal,
                    casaId: Number(casa.id[casa.id.length - 1])
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
    btnJogarNovamente.style.display = 'none';
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
    const mensagem = `O(A) jogador(a) "${nome}" desconectou.`;
    alert(mensagem);

    // direcionar o usuário de volta ao início
    exibirMenu();
});


socket.on('atualizar-tabuleiro', ({ casaId, vez, simbolo }) => {
    const casa = document.getElementById(`casa-${casaId}`);
    casa.textContent = simbolo;
    casa.className = `casa ${simbolo === 'X' ? 'text-dark' : 'text-danger'}`;
    vezJogador.textContent = vez;
});


function exibirResultado(vencedor = null, meuNome = '') {
    const modal = new bootstrap.Modal(document.getElementById('modal'));
    const modalTitle = document.getElementById('modalLabel');
    const modalBody = document.getElementById('modalBody');

    if (vencedor === null) {
        modalTitle.textContent = 'Empate!';
        modalBody.innerHTML = '<p>Ninguém venceu a partida.</p>';
    } else if (vencedor === meuNome) {
        modalTitle.textContent = 'Vitória!';
        modalBody.innerHTML = `<p>Parabéns <strong>${vencedor}</strong>, você venceu!</p>`;
    } else {
        modalTitle.textContent = 'Derrota';
        modalBody.innerHTML = `<p><strong>${vencedor}</strong> venceu a partida.</p>`;
    }

    modal.show();
}

socket.on('fim-de-jogo', (jogador) => {

    if (jogador === null) {
        exibirResultado(null);
    } else {
        exibirResultado(jogador, jogadorLocal);
    }
    // Exibir botão de reiniciar
    btnJogarNovamente.style.display = '';
    btnJogarNovamente.disabled = false;
});

socket.on('aguardando-reiniciar', ({ jogador }) => {
    btnJogarNovamente.innerHTML = `<strong>${jogador}</strong> quer jogar de novo...`;
});

btnJogarNovamente.addEventListener('click', () => {
    const jogador = jogadorLocal === jogador1.textContent ? jogador2.textContent : jogador1.textContent;
    socket.emit('jogar-novamente', { jogador: jogadorLocal, sala: salaJogo });
    btnJogarNovamente.disabled = true;
    btnJogarNovamente.innerHTML = `Esperando <strong>${jogador}</strong> aceitar...`;
});

socket.on('ambos-reiniciam', ({ jogadorComeca, simbolos }) => {
    // vez de jogar
    vezJogador.textContent = jogadorComeca;
    const j1 = jogador1.textContent;
    const j2 = jogador2.textContent;
    simboloJ1.textContent = simbolos[j1];
    simboloJ2.textContent = simbolos[j2];

    // colocar preto para 'X' e vermelho para 'O'
    let classeSimbolo = (simbolo) => simbolo === 'X' ? 'text-dark' : 'text-danger';
    simboloJ1.className = `me-1 fs-4 ${classeSimbolo(simbolos[j1])}`;
    simboloJ2.className = `ms-1 fs-4 ${classeSimbolo(simbolos[j2])}`;

    // limpar tabuleiro
    casas.forEach(casa => {
        casa.textContent = '';
        casa.className = 'casa';
    });

    // botao reiniciar
    btnJogarNovamente.disabled = false;
    btnJogarNovamente.style.display = 'none';
    btnJogarNovamente.textContent = 'Jogar novamente';
});
