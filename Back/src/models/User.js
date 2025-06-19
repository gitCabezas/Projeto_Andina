// src/models/User.js
import prisma from '../config/prisma.js';

export const UserModel = {
  // Criar um novo usuário
  create: async (userData) => {
    try {
      const user = await prisma.user.create({
        data: userData,
      });
      return user;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  },

  // Buscar todos os usuários
  findAll: async () => {
    try {
      const users = await prisma.user.findMany();
      return users;
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }
  },

  // Buscar usuário por ID
  findById: async (id) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      return user;
    } catch (error) {
      console.error('Erro ao buscar usuário por ID:', error);
      throw error;
    }
  },

  // Buscar usuário por email
  findByEmail: async (email) => {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      return user;
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      throw error;
    }
  },

  // Atualizar um usuário
  update: async (id, updateData) => {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: updateData,
      });
      return user;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  },

  // Deletar um usuário
  delete: async (id) => {
    try {
      const user = await prisma.user.delete({
        where: { id },
      });
      return user;
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      throw error;
    }
  },
};