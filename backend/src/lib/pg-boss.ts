import PgBoss from 'pg-boss';
import { env } from '../config/env';

export const boss = new PgBoss(env.DATABASE_URL);

export const initPgBoss = async () => {
  try {
    await boss.start();
    console.log('pg-boss started successfully');
  } catch (error) {
    console.error('Failed to start pg-boss', error);
  }
};
