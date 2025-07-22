const socket = io();

// ============================== Variáveis de estado ==============================
let jogadorLocal = '';
let salaJogo = '';
let interval;

// ============================== Elementos DOM ==============================
const form = document.querySelector('form');
const inputNome = document.getElementById('nome');
const inputSala = document.getElementById('sala');
const info = document.querySelector('#info');
const tabuleiro = document.querySelector('#tabuleiro');
const vezJogador = document.querySelector('#vez-jogador');
const jogador1 = document.querySelector('#jogador1');
const jogador2 = document.querySelector('#jogador2');
const aguardando = document.querySelector('#aguardando');
const btnJogar = document.querySelector('#btnJogar');
const btnReiniciar = document.querySelector('#btnReiniciar');
const btnCancelar = document.querySelector('#btnCancelar');
const casas = document.querySelectorAll('.casa');

// ============================== Constantes ==============================
const TEMPO_ESPERA_AGUARDAR_CONEXAO = 20;
const TEMPO_ESPERA_COMECAR_PARTIDA = 3;

// ============================== Inicialização ==============================
function inicializarInterface() {
    info.style.display = 'none';
    tabuleiro.style.display = 'none';
    aguardando.style.display = 'none';
    btnReiniciar.style.display = 'none';
    btnCancelar.style.display = 'none';
}
inicializarInterface();

// ============================== Exibir resultado do jogo ==============================
function exibirResultado(vencedor = null, meuNome = '') {
    const modal = new bootstrap.Modal(document.getElementById('modal'));
    const modalTitle = document.getElementById('modalLabel');
    const modalBody = document.getElementById('modalBody');

    if (vencedor === null) {
        modalTitle.textContent = 'Empate!';
        modalBody.innerHTML = '<p>Ninguém venceu a partida.</p>';
    } else if (vencedor === meuNome) {
        modalTitle.textContent = 'Vitória!';
        modalBody.innerHTML = '<p>Parabéns, você venceu!</p>';
    } else {
        modalTitle.textContent = 'Derrota';
        modalBody.innerHTML = `<p>${vencedor} venceu a partida.</p>`;
    }

    modal.show();
}

// ============================== Eventos de clique nas casas ==============================
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

// ============================== Botões ==============================
btnReiniciar.addEventListener('click', () => {
    btnReiniciar.disabled = true;
    socket.emit('reiniciar', { nome: jogadorLocal, sala: salaJogo });
});

// ============================== Funções ==============================
function contarTempo(tempo, deleteRoom = false) {
    const stempo = document.querySelector('#stempo');
    stempo.textContent = tempo;
    
    interval = setInterval(() => {
        tempo--;
        stempo.textContent = tempo;

        if (tempo <= 0) {
            clearInterval(interval);
            aguardando.style.display = 'none';
            btnJogar.style.display = 'none';
            if (deleteRoom)
                socket.emit('destroy-sala', { salaJogo, jogador: jogadorLocal });
        }
    }, 1000);
}

function limparTabuleiro() {
    casas.forEach(casa => {
        casa.innerHTML = '';
    });
}

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
            btnJogar.style.display = 'none';
            btnCancelar.style.display = '';
            socket.emit('entrar-sala', { nome, sala });
        } else {
            alert("Preencha os dois campos.");
        }
    } else if (botaoClicado.id === 'btnCancelar') {
        clearInterval(interval);
        socket.emit('destroy-sala', { salaJogo, jogador: jogadorLocal });
        aguardando.style.display = 'none';
        btnJogar.style.display = '';
        btnCancelar.style.display = 'none';
    }
});

// ============================== Eventos do socket ==============================
socket.on('esperar-j2-aceitar', (outroJogador) => {
    btnReiniciar.innerHTML = `Esperando <strong>${outroJogador}</strong> aceitar...`;
});

socket.on('confirmar-reinicio', (outroJogador) => {
    btnReiniciar.innerHTML = `<strong>${outroJogador}</strong> quer jogar com você de novo...`;
});

socket.on('ambos-jogam-denovo', (jogador) => {
    limparTabuleiro();
    vezJogador.textContent = jogador;
    btnReiniciar.textContent = 'Reiniciar';
    btnReiniciar.style.display = 'none';
    btnReiniciar.disabled = false;
});

socket.on('jogadores-pareados', ({ jogadores }) => {
    btnCancelar.style.display = 'none';
    btnJogar.style.display = '';
    const outroJogador = jogadores.find(j => j !== jogadorLocal);
    btnJogar.className = btnJogar.className.replace('success', 'warning');
    btnJogar.innerHTML = `Conectado com ${outroJogador}...`;
    btnJogar.disabled = true;

    aguardando.style.display = '';
    aguardando.innerHTML = `A partida começará em <span id="stempo"></span>s`;
    contarTempo(TEMPO_ESPERA_COMECAR_PARTIDA);
});

socket.on('jogador-existente', () => {
    alert('Já existe um jogador com esse nome!');
});

socket.on('aguardando', () => {
    aguardando.style.display = '';
    btnCancelar.style.display = '';
    contarTempo(TEMPO_ESPERA_AGUARDAR_CONEXAO, true);
});

socket.on('iniciar', ({ jogadores }) => {
    form.style.display = 'none';
    aguardando.style.display = 'none';
    info.style.display = '';
    tabuleiro.style.display = '';

    vezJogador.textContent = jogadores[0];
    jogador1.textContent = jogadores[0];
    jogador2.textContent = jogadores[1];
});

socket.on('mostrar-jogada', ({ idCasa, jogada, vez }) => {
    const casa = document.getElementById(`casa-${idCasa}`);
    const classeCasa = jogada === 'X' ? 'text-dark' : 'text-danger';
    casa.textContent = jogada;
    casa.className = `casa ${classeCasa}`;
    vezJogador.textContent = vez;
});

socket.on('fim-de-jogo', (jogador) => {
    console.log('vitoria?', (jogador !== null));
    console.log('empate?', (jogador === null));
    console.log(`jogador: ${jogador}`);

    if (jogador === null) {
        exibirResultado(null);
    } else {
        exibirResultado(jogador, jogadorLocal);
    }
    btnReiniciar.style.display = '';
    btnReiniciar.disabled = false;
});
