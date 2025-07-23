// const fs = require('fs');
// const path = require('path');
// const TicTacToe = require('./TicTacToe');
// const timeouts = {};

// // Caminhos dos arquivos
// const arquivoJogos = path.join(__dirname, '..', 'data', 'jogos.json');
// const arquivoSalas = path.join(__dirname, '..', 'data', 'salas.json');

// // Inicializa os arquivos se não existirem
// if (!fs.existsSync(arquivoJogos)) salvarJogos({});
// if (!fs.existsSync(arquivoSalas)) salvarSalas({});

// // ==================================================== Utilitários de leitura e escrita ====================================================
// function lerJogos() {
//     try {
//         const conteudo = fs.readFileSync(arquivoJogos, 'utf8');
//         return JSON.parse(conteudo) || {};
//     } catch (err) {
//         console.error('Erro ao ler jogos.json:', err);
//         return {};
//     }
// }

// function salvarJogos(obj) {
//     fs.writeFileSync(arquivoJogos, JSON.stringify(obj, null, 4));
// }

// function lerSalas() {
//     try {
//         const conteudo = fs.readFileSync(arquivoSalas, 'utf8');
//         return JSON.parse(conteudo) || {};
//     } catch (err) {
//         console.error('Erro ao ler salas.json:', err);
//         return {};
//     }
// }

// function salvarSalas(obj) {
//     if (!obj || typeof obj !== 'object' || Object.keys(obj).length === 0) {
//         console.warn('⚠️ Tentativa de salvar salas vazias ignorada.');
//         return;
//     }

//     console.log('=== objeto a salvar ===');
//     console.log(obj);
//     fs.writeFileSync(arquivoSalas, JSON.stringify(obj, null, 4));
// }


// // ==================================================== Funções para salas ====================================================
// function getSalas() {
//     return lerSalas();
// }

// function setSala(sala, dados) {
//     console.log('=== setSala ===');
//     console.log(sala, dados);

//     if (!sala || !dados || typeof sala !== 'string' || typeof dados !== 'object') {
//         console.error('Sala ou dados inválidos');
//         return;
//     }

//     const salas = lerSalas();
//     salas[sala] = dados;

//     salvarSalas(salas);
// }

// function removerSala(sala = null, socketId = null) {
//     const salas = lerSalas(); // Carrega as salas do armazenamento

//     if (socketId) {
//         // Remover socketId de todas as salas
//         for (const key in salas) {
//             salas[key] = salas[key].filter(j => j.id !== socketId);

//             // Se a sala ficou vazia, remove ela
//             if (salas[key].length === 0) {
//                 delete salas[key];

//                 // Remove timeout associado
//                 if (timeouts[key]) {
//                     clearTimeout(timeouts[key]);
//                     delete timeouts[key];
//                 }
//             }
//         }
//         salvarSalas(salas);
//     } else if (sala) {
//         // Remover sala específica
//         delete salas[sala];

//         // Remover timeout também
//         if (timeouts[sala]) {
//             clearTimeout(timeouts[sala]);
//             delete timeouts[sala];
//         }

//         salvarSalas(salas);
//     }
// }


// // ==================================================== Funções para jogos ====================================================
// function criarOuAtualizarJogo(sala, dados) {
//     const jogos = lerJogos();
//     jogos[sala] = dados;
//     salvarJogos(jogos);
// }

// function getJogo(sala) {
//     const jogos = lerJogos();
//     const dados = jogos[sala];
//     return dados ? TicTacToe.reconstruir(dados) : null;
// }

// function removerJogo(sala) {
//     const jogos = lerJogos();
//     delete jogos[sala];
//     salvarJogos(jogos);
// }

// // ============================================================= Exportar =============================================================
// module.exports = {
//     getSalas,
//     setSala,
//     removerSala,
//     criarOuAtualizarJogo,
//     getJogo,
//     removerJogo
// };
