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
let contarTempoJogo = 0;
let timeOutContarTempoJogo;

// ============================== Elementos DOM ==============================
const formNomeSala = document.getElementById('formNomeSala');
const inputNome = document.getElementById('nome');
const btnGetRandomUsername = document.getElementById('getRandomUsername');
const inputSala = document.getElementById('sala');
const info = document.querySelector('#info');
const tabuleiro = document.querySelector('#tabuleiro');
const vezJogador = document.querySelector('#vez-jogador');
const jogador1 = document.querySelector('#jogador1');
const jogador2 = document.querySelector('#jogador2');
const divSimbolo1 = document.querySelector('#simbolo1');
const divSimbolo2 = document.querySelector('#simbolo2');
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
const divContarTempoJogo = document.getElementById('contarTempoJogo');

// chat
const botaoToogleChat = document.getElementById('botaoToogleChat');
const chat = document.getElementById('chat');
const formChat = document.getElementById('formChat');
const inputMensagem = document.getElementById('inputMensagem');
const numCharInputMensagem = document.getElementById('numCharInputMensagem');
const divMensagens = document.getElementById('mensagens');
const btnEnviarMensagem = document.querySelector('#btnEnviarMensagem');

// ============================== chat ==============================

function popUpChatEstaAberto() {
    return botaoToogleChat.className.includes('up');
}


numCharInputMensagem.textContent = `0/${inputMensagem.maxLength}`;
inputMensagem.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        inputMensagem.value == '';
        inputMensagem.focus();
        btnEnviarMensagem.click();
    }

    const max = inputMensagem.maxLength;
    const atual = inputMensagem.value.length;

    numCharInputMensagem.textContent = `${atual}/${max}`;

    inputMensagem.classList.remove('perto-limite', 'limite-ultrapassado');

    if (atual >= max) {
        inputMensagem.classList.add('limite-ultrapassado');
    } else if (atual >= max * 0.8) { // 80% do limite
        inputMensagem.classList.add('perto-limite');
    }
});

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
        console.log(`Mensagem não enviada: "${inputMensagem.value}"`)
        return;
    };

    if (inputMensagem.value.length > 72) {
        console.log("Mensagem muito longa (mais de 72 caracteres)");
        return;
    }

    const linhas = inputMensagem.value.split("\n");
    if (linhas.length > 3) {
        console.log("Mensagem muito longa (mais de 3 linhas)");
        return;
    }

    console.log('enviando...')
    const obj = {
        sala: inputSala.value,
        remetente: inputNome.value,
        msg: inputMensagem.value
    }

    inputMensagem.value = '';

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

    divMensagens.scrollTop = divMensagens.scrollHeight
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

// ============================== username aleatório ==============================
btnGetRandomUsername.addEventListener('click', () => {
    console.log('click ->');
    socket.emit('get-random-username');
});

socket.on('send-random-username', (username) => {
    console.log('on ->');
    inputNome.value = username;
});

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
        socket.emit('deletar-sala', sala);
    }
});

socket.on('deletar-sala', () => {
    toastMessage.innerHTML = `${statusToastIcon[STATUS_MESSAGE.SUCCESS]} Sala <strong>${salaJogo}</strong> excluída!`;
    toastEl.className = toastEl.className.replace(/text-bg-[a-z]+/, `text-bg-${STATUS_MESSAGE.SUCCESS}`);
    toast.show();
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
    toastMessage.innerHTML = `${statusToastIcon[STATUS_MESSAGE.WARNING]} Aguardando uma conexão...`;
    toastEl.className = toastEl.className.replace(/text-bg-[a-z]+/, `text-bg-${STATUS_MESSAGE.WARNING}`);
    toast.show();
    btnJogar.style.display = 'none';
    btnCancelar.style.display = '';
    divAguardando.style.display = '';
    esperarEstabelecerConexao(TEMPO_ESPERA_AGUARDAR_CONEXAO);
});

socket.on('jogadores-pareados', ({ jogadores }) => {
    clearInterval(interval);
    inputNome.disabled = true;
    inputSala.disabled = true;
    divAguardando.style.display = 'none';
    const outroJogador = jogadores.find(j => j !== jogadorLocal);
    btnCancelar.style.display = 'none';
    btnJogar.style.display = '';
    btnJogar.className = btnJogar.className.replace('success', 'warning');
    btnJogar.innerHTML = `Conectado com ${outroJogador}...`;
    btnJogar.disabled = true;
    
    toastMessage.innerHTML = `${statusToastIcon[STATUS_MESSAGE.WARNING]} Conectado com <strong>${outroJogador}</strong>...`;
    toastEl.className = toastEl.className.replace(/text-bg-[a-z]+/, `text-bg-${STATUS_MESSAGE.WARNING}`);
    toast.show();

    // mensagem de preparação para partida
    divAguardando.style.display = '';
    esperarIniciarPartida(TEMPO_ESPERA_COMECAR_PARTIDA);
});


// =================================================== PREPARAR DADOS PARA INICIAR A PARTIDA ===================================================
socket.on('iniciar', ({ jogadores, jogadorComeca }) => {
    // iniciar contagem
    timeOutContarTempoJogo = setInterval(() => {
        contarTempoJogo++;
        divContarTempoJogo.textContent = formatarTempoEmMinutoSegundo(contarTempoJogo);
    }, 1000);

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
                socket.emit('get-status');
            }
        });
    });

    // chat disponível
    chat.style.display = '';
});

socket.on('get-status', (status) => {
    if (status != 3) {
        toastMessage.innerHTML = `${statusToastIcon[STATUS_MESSAGE.WARNING]} Não é sua vez!`;
        toastEl.className = toastEl.className.replace(/text-bg-[a-z]+/, `text-bg-${STATUS_MESSAGE.DANGER}`);
        toast.show();
    }
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

// function contraMenu() {
//     // Limpar estado do jogo
//     formNomeSala.style.display = 'none';
//     info.style.display = '';
//     tabuleiro.style.display = '';
//     divAguardando.style.display = '';
//     btnJogarNovamente.style.display = '';
//     btnCancelar.style.display = '';
//     btnJogar.style.display = 'none';
//     btnJogar.className = btnJogar.className.replace('warning', 'success');
//     btnJogar.innerHTML = 'Jogar';
//     btnJogar.disabled = true;
// }
// contraMenu();

// ====================================================== jogador desconectado ======================================================
socket.on('jogador-desconectado', ({ nome, status }) => {
    chat.style.display = 'none';
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

function formatarTempoEmMinutoSegundo(tempo) {
    let min = Math.floor(tempo / 60);
    let seg = tempo % 60;
    return `${min}:${String(seg).padStart(2, "0")}`;
}

socket.on('fim-de-jogo', (obj) => {
    clearInterval(timeOutContarTempoJogo);

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
    // iniciar contagem
    contarTempoJogo = 0;
    divContarTempoJogo.textContent = formatarTempoEmMinutoSegundo(contarTempoJogo);
    timeOutContarTempoJogo = setInterval(() => {
        contarTempoJogo++;
        divContarTempoJogo.textContent = formatarTempoEmMinutoSegundo(contarTempoJogo);
    }, 1000);

    toastMessage.innerHTML = `${statusToastIcon[STATUS_MESSAGE.INFO]} Partida reiniciada!`;
    toastEl.className = toastEl.className.replace(/text-bg-[a-z]+/, `text-bg-${STATUS_MESSAGE.INFO}`);
    toast.show();

    // vez de jogar
    vezJogador.textContent = jogadorComeca;

    // ajustar os símbolos
    const simbolo1 = divSimbolo1.textContent;
    const simbolo2 = divSimbolo2.textContent;
    const temp = simbolo1;
    divSimbolo1.textContent = simbolo2;
    divSimbolo2.textContent = temp;

    // ajustar as classes dos simbolos
    const classeDark = 'text-dark';
    const classeDanger = 'text-danger';
    if (divSimbolo1.className.includes(classeDark)) {
        divSimbolo1.className = divSimbolo1.className.replace(classeDark, classeDanger);
        divSimbolo2.className = divSimbolo1.className.replace(classeDanger, classeDark);
    } else if (divSimbolo1.className.includes(classeDanger)) {
        divSimbolo1.className = divSimbolo1.className.replace(classeDanger, classeDark);
        divSimbolo2.className = divSimbolo1.className.replace(classeDark, classeDanger);
    }

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
