import { PrismaClient } from '../../generated/client/client.ts';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import env from './env.js';
import logger from '../utils/logger.js';

// Create the MariaDB/MySQL driver adapter
const adapter = new PrismaMariaDb(env.DATABASE_URL);

const prisma = new PrismaClient({ adapter });

export async function connectDatabase() {
  try {
    // Test the connection with a simple query
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error.message);
    throw error;
  }
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}

export default prisma;
