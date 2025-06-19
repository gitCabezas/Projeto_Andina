// src/models/Client.js
import prisma from '../config/prisma.js';

export const ClientModel = {
  create: async (clientData) => {
    try {
      const client = await prisma.client.create({
        data: clientData,
      });
      return client;
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
  },

  findAll: async () => {
    try {
      const clients = await prisma.client.findMany();
      return clients;
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      throw error;
    }
  },

  findById: async (id) => {
    try {
      const client = await prisma.client.findUnique({
        where: { id },
      });
      return client;
    } catch (error) {
      console.error('Erro ao buscar cliente por ID:', error);
      throw error;
    }
  },

  update: async (id, updateData) => {
    try {
      const client = await prisma.client.update({
        where: { id },
        data: updateData,
      });
      return client;
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const client = await prisma.client.delete({
        where: { id },
      });
      return client;
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      throw error;
    }
  },
};