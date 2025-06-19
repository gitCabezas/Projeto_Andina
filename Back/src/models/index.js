// src/index.js
import express from 'express';
import { UserModel } from './models/User.js';
import { ClientModel } from './models/Client.js';
// Importe outros modelos conforme necessário

const app = express();
app.use(express.json()); // Para parsear JSON no corpo das requisições

const PORT = process.env.PORT || 3000;

// Exemplo de rota para usuários
app.get('/users', async (req, res) => {
  try {
    const users = await UserModel.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
});

app.post('/users', async (req, res) => {
  try {
    const newUser = await UserModel.create(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar usuário.' });
  }
});

// Exemplo de rota para clientes
app.get('/clients', async (req, res) => {
  try {
    const clients = await ClientModel.findAll();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar clientes.' });
  }
});

app.post('/clients', async (req, res) => {
  try {
    const newClient = await ClientModel.create(req.body);
    res.status(201).json(newClient);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar cliente.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});