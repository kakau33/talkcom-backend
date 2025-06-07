// server.js

// 1. Importar as ferramentas necessárias
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { nanoid } = require('nanoid'); // nanoid v5 é ESM, vamos usar a v4 que é CJS com require
// Se o comando acima der erro, instale a v4: npm install nanoid@4
// E use: const { nanoid } = require('nanoid');

// 2. Configurações iniciais
const app = express();
const PORT = process.env.PORT || 3000; // A porta onde nosso servidor vai "ouvir"
const db = new sqlite3.Database('./links.db', (err) => {
    if (err) {
        console.error("Erro ao abrir o banco de dados", err.message);
    } else {
        console.log("Conectado ao banco de dados SQLite.");
        // Cria a nossa tabela se ela não existir
        db.run('CREATE TABLE IF NOT EXISTS urls (id INTEGER PRIMARY KEY AUTOINCREMENT, short_code TEXT NOT NULL UNIQUE, long_url TEXT NOT NULL)');
    }
});

// 3. Middlewares: "Porteiros" que preparam as requisições
app.use(express.json()); // Permite que o servidor entenda requisições com corpo em JSON
app.use(express.static('public')); // Serve os arquivos estáticos (nosso frontend) da pasta 'public'

// --- AS ROTAS (A LÓGICA DA APLICAÇÃO) VIRÃO AQUI NOS PRÓXIMOS PASSOS ---
// ROTA PARA ENCURTAR UMA URL (recebe um POST)
app.post('/shorten', (req, res) => {
    const { longUrl } = req.body; // Pega a URL longa do corpo da requisição

    if (!longUrl) {
        return res.status(400).json({ error: 'URL longa é obrigatória' });
    }

    const shortCode = nanoid(7); // Gera um código único de 7 caracteres
    const sql = 'INSERT INTO urls (long_url, short_code) VALUES (?, ?)';

    db.run(sql, [longUrl, shortCode], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Erro ao salvar no banco de dados' });
        }
        
        // Sucesso! Retorna a URL curta completa para o frontend.
        const shortUrl = `http://localhost:${PORT}/${shortCode}`;
        res.status(201).json({ shortUrl });
    });
});
// ROTA PARA REDIRECIONAR (recebe um GET)
app.get('/:shortCode', (req, res) => {
    const { shortCode } = req.params; // Pega o código da própria URL

    const sql = 'SELECT long_url FROM urls WHERE short_code = ?';

    db.get(sql, [shortCode], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Erro no servidor' });
        }

        if (row) {
            // Se encontrou o link no banco, redireciona o usuário
            res.redirect(row.long_url);
        } else {
            // Se não encontrou, retorna um erro 404 (Não Encontrado)
            res.status(404).send('URL não encontrada');
        }
    });
});


// 4. Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});