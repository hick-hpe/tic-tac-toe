const socket = io();

// ============================== Variáveis de estado ==============================
let jogadorLocal = '';
let salaJogo = '';
let interval;
const statusToastIcon = {
    'warning': '<i class="bi bi-exclamation-triangle"></i>',
    'danger': '<i class="bi bi-x-circle"></i>',
    'info': '<i class="bi bi-arrow-clockwise"></i>',
    'success': '<i class="bi bi-check-circle"></i>'
}
const STATUS_MESSAGE = {
    WARNING: 'warning',
    DANGER: 'danger',
    INFO: 'info',
    SUCCESS: 'success',
}
let numMensagensNaoLidas = 0;

// ============================== Elementos DOM ==============================
const formNomeSala = document.getElementById('formNomeSala');
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
const toastEl = document.getElementById('toast');
const toast = new bootstrap.Toast(toastEl);
const toastMessage = document.getElementById('toastMessage');
const placar = document.getElementById('placar');
const notificacao = document.getElementById('notificacao');

// chat
const botaoToogleChat = document.getElementById('botaoToogleChat');
const chat = document.getElementById('chat');
const formChat = document.getElementById('formChat');
const inputMensagem = document.getElementById('inputMensagem');
const divMensagens = document.getElementById('mensagens');
const btnEnviarMensagem = document.querySelector('#btnEnviarMensagem');

// ============================== chat ==============================
function popUpChatEstaAberto() {
    return botaoToogleChat.className.includes('up');
}

botaoToogleChat.addEventListener('click', () => {
    const toUp = botaoToogleChat.className.includes('up');

    if (toUp) {
        notificacao.style.display = 'none';
        numMensagensNaoLidas = 0;
    }

    botaoToogleChat.className = toUp ?
    botaoToogleChat.className.replace('up', 'down') :
    botaoToogleChat.className.replace('down', 'up');
    chat.classList.toggle('active');
    
    inputMensagem.disabled = !toUp;
    btnEnviarMensagem.disabled = !toUp;

    console.log(`Aberto? ${toUp}`);
});

formChat.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!inputMensagem.value) {
        console.log(`Mensagem n send: "${inputMensagem.value}"`)
        return;
    };

    console.log('enviando...')
    const obj = {
        sala: inputSala.value,
        remetente: inputNome.value,
        msg: inputMensagem.value
    }

    inputMensagem.value = '';

    console.log(obj);

    socket.emit('enviar-msg', obj);
});

function atualizaNumMensagensNaoLidas(num) {
    notificacao.textContent = num;
}

socket.on('try-notfy', () => {
    const aberto = popUpChatEstaAberto();
    console.log(`Exibir not? ${aberto}`);

    if (aberto) {
        notificacao.style.display = '';
        numMensagensNaoLidas++;
    } else {
        notificacao.style.display = 'none';
        numMensagensNaoLidas = 0;
    }

    atualizaNumMensagensNaoLidas(numMensagensNaoLidas);
});

socket.on('list-msg', (mensagens) => {
    divMensagens.innerHTML = '';

    mensagens.forEach(msg => {
        divMensagens.innerHTML += `
            <div class="mensagem">
                <strong>${msg.remetente}</strong> <br>
                <small>${msg.msg}</small>
            </div>
        `;
    });
});

// ============================== Constantes ==============================
const TEMPO_ESPERA_AGUARDAR_CONEXAO = 20;
const TEMPO_ESPERA_COMECAR_PARTIDA = 5;

// ============================== Inicialização ==============================
function inicializarInterface() {
    info.style.display = 'none';
    tabuleiro.style.display = 'none';
    divAguardando.style.display = 'none';
    btnJogarNovamente.style.display = 'none';
    btnCancelar.style.display = 'none';
    chat.style.display = 'none';
    notificacao.style.display = 'none';
}
inicializarInterface();

// ============================== Submissão do formulário ==============================
formNomeSala.addEventListener('submit', (e) => {
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
            toastMessage.innerHTML = `${statusToastIcon[STATUS_MESSAGE.DANGER]} Preencha os dois campos!`;
            toastEl.className = toastEl.className.replace(/text-bg-[a-z]+/, `text-bg-${STATUS_MESSAGE.DANGER}`);
            toast.show();
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
    toastMessage.innerHTML = `${statusToastIcon[STATUS_MESSAGE.DANGER]} ${mensagem}`;
    toastEl.className = toastEl.className.replace(/text-bg-[a-z]+/, `text-bg-${STATUS_MESSAGE.DANGER}`);
    toast.show();
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
    formNomeSala.style.display = 'none';
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
                    casaId: Number(casa.id[casa.id.length - 1])
                });
            } else {
                toastMessage.innerHTML = `${statusToastIcon[STATUS_MESSAGE.WARNING]} Não é sua vez!`;
                toastEl.className = toastEl.className.replace(/text-bg-[a-z]+/, `text-bg-${STATUS_MESSAGE.DANGER}`);
                toast.show();
            }
        });
    });

    // chat disponível
    chat.style.display = '';
});


function exibirMenu() {
    // Limpar estado do jogo
    formNomeSala.style.display = '';
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

function contraMenu() {
    // Limpar estado do jogo
    formNomeSala.style.display = 'none';
    info.style.display = '';
    tabuleiro.style.display = '';
    divAguardando.style.display = '';
    btnJogarNovamente.style.display = '';
    btnCancelar.style.display = '';
    btnJogar.style.display = 'none';
    btnJogar.className = btnJogar.className.replace('warning', 'success');
    btnJogar.innerHTML = 'Jogar';
    btnJogar.disabled = true;
}
// contraMenu()

// ====================================================== jogador desconectado ======================================================
socket.on('jogador-desconectado', ({ nome, status }) => {
    console.log(`🔌 Jogador ${nome} desconectado`);
    const mensagem = `O(A) jogador(a) <strong>${nome}</strong> desconectou.`;
    toastMessage.innerHTML = `${statusToastIcon[STATUS_MESSAGE.WARNING]} ${mensagem}`;
    toastEl.className = toastEl.className.replace(/text-bg-[a-z]+/, `text-bg-${STATUS_MESSAGE.WARNING}`);
    toast.show();

    if (status === 1) {
        // no form ainda
        clearInterval(interval);
        btnJogar.disabled = false;
        btnJogar.className = btnJogar.className.replace('warning', 'success');
        btnJogar.innerHTML = '<iclass="bi bi-play-fill"></i> Jogar'
        divAguardando.textContent = '';
        divAguardando.style.display = 'none';
    }

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

socket.on('fim-de-jogo', (obj) => {

    console.log('objeto recebido: ', obj);

    if (obj === null) {
        exibirResultado(null);
    } else {
        const { vencedor, pontos } = obj;
        placar.textContent = `${pontos[0]} | ${pontos[1]}`;
        exibirResultado(vencedor, jogadorLocal);
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

socket.on('ambos-reiniciam', ({ jogadorComeca }) => {
    toastMessage.innerHTML = `${statusToastIcon[STATUS_MESSAGE.INFO]} Partida reiniciada!`;
    toastEl.className = toastEl.className.replace(/text-bg-[a-z]+/, `text-bg-${STATUS_MESSAGE.INFO}`);
    toast.show();

    // vez de jogar
    vezJogador.textContent = jogadorComeca;
    const j1 = jogador1.textContent;
    const j2 = jogador2.textContent;

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
