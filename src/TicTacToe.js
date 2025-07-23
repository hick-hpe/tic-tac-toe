class TicTacToe {
    constructor(jogador1, jogador2) {
        this.tabuleiro = Array.from({ length: 3 }, () => Array(3).fill('*'));
        this.jogadores = [jogador1, jogador2];
        this.vez = null;
        this.simbolos = {
            [jogador1]: 'X',
            [jogador2]: 'O'
        };
        this.reiniciar = [];
    }

    // static reconstruir(dados) {
    //     const jogo = new TicTacToe(dados.jogadores[0], dados.jogadores[1]);

    //     // Restaurar os dados salvos
    //     jogo.tabuleiro = Array.isArray(dados.tabuleiro) ? dados.tabuleiro : jogo.tabuleiro;
    //     jogo.vez = dados.vez || jogo.vez;
    //     jogo.simbolos = dados.simbolos || jogo.simbolos;
    //     jogo.reiniciar = Array.isArray(dados.reiniciar) ? dados.reiniciar : [];

    //     return jogo;
    // }   

    exibirTabuleiro() {
        console.log('==== TABULEIRO ====');
        for (let i = 0; i < 3; i++) {
            const linha = this.tabuleiro[i].join(' ');
            console.log(linha);
        }
        console.log('===================');
    }

    fazerJogada(jogador, posicao) {
        const linha = Math.floor(posicao / 3);
        const coluna = posicao % 3;

        if (this.tabuleiro[linha][coluna] !== '*') {
            console.log('=== Jogada inválida: casa já ocupada ===');
            return false;
        }
        if (this.vez !== jogador) {
            console.log(`=== Jogada inválida: não é a vez de ${jogador} ===`);
            return false;
        }

        this.tabuleiro[linha][coluna] = this.simbolos[jogador];
        this.vez = this.jogadores.find(j => j !== jogador);
        return true;
    }


    reiniciarJogo(nome) {
        console.log('=== reiniciarJogo ===');
        console.log(`Solicitação de ${nome}`);
        console.log('Estado atual:', this.reiniciar);

        if (!this.reiniciar.includes(nome)) {
            this.reiniciar.push(nome);
            console.log(`${nome} adicionado à lista de reinício`);
        }

        const podeReiniciar = this.reiniciar.length === 2;

        if (podeReiniciar) {
            console.log('=== Ambos aceitaram, reiniciando jogo ===');
            this.tabuleiro = Array.from({ length: 3 }, () => Array(3).fill('*'));
            this.reiniciar = [];
        }

        console.log('Retornando podeReiniciar:', podeReiniciar);
        return podeReiniciar;
    }


    checarVitoriaOuEmpate() {
        const tabuleiro = this.tabuleiro;

        // Verifica linhas
        for (let i = 0; i < 3; i++) {
            if (
                tabuleiro[i][0] !== '*' && tabuleiro[i][0] &&
                tabuleiro[i][0] === tabuleiro[i][1] &&
                tabuleiro[i][1] === tabuleiro[i][2]
            ) {
                return { tipo: 'linha', indice: i, simbolo: tabuleiro[i][0] };
            }
        }

        // Verifica colunas
        for (let i = 0; i < 3; i++) {
            if (
                tabuleiro[0][i] !== '*' && tabuleiro[0][i] &&
                tabuleiro[0][i] === tabuleiro[1][i] &&
                tabuleiro[1][i] === tabuleiro[2][i]
            ) {
                return { tipo: 'coluna', indice: i, simbolo: tabuleiro[0][i] };
            }
        }

        // Verifica diagonal principal
        if (
            tabuleiro[0][0] !== '*' && tabuleiro[0][0] &&
            tabuleiro[0][0] === tabuleiro[1][1] &&
            tabuleiro[1][1] === tabuleiro[2][2]
        ) {
            return { tipo: 'diagonal', indice: 0, simbolo: tabuleiro[0][0] };
        }

        // Verifica diagonal secundária
        if (
            tabuleiro[0][2] !== '*' && tabuleiro[0][2] &&
            tabuleiro[0][2] === tabuleiro[1][1] &&
            tabuleiro[1][1] === tabuleiro[2][0]
        ) {
            return { tipo: 'diagonal', indice: 1, simbolo: tabuleiro[0][2] };
        }

        // Verifica empate
        const empate = tabuleiro.every(linha => linha.every(casa => casa === 'X' || casa === 'O'));
        if (empate) return -1;

        // Jogo ainda em andamento
        return null;
    }

    getJogadorPorSimbolo(simbolo) {
        return Object.keys(this.simbolos).find(j => this.simbolos[j] === simbolo);
    }
}


module.exports = TicTacToe;