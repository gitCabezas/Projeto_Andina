// src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config(); // Carrega as variáveis de ambiente do .env

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // Habilita o CORS para permitir requisições do frontend
app.use(express.json()); // Permite que o servidor entenda JSON no corpo da requisição

// Rota de exemplo
app.get('/', (req, res) => {
    res.send('Olá do Backend! A API está funcionando.');
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});