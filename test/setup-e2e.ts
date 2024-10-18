/*
 * In Nodejs >= v20.12.0
 *import { loadEnvFile } from 'node:process';
 *
 *loadEnvFile('./.env');
 */

import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { Redis } from 'ioredis';

import { DomainEvents } from '@/core/events/domain-events';
import { envSchema } from '@/infra/env/envSchema';

config({ path: '.env', override: true });
config({ path: '.env.test', override: true });

const env = envSchema.parse(process.env);

const prisma = new PrismaClient();

const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  db: env.REDIS_DB,
});

/**
 *
 * @param schemaId string
 * @returns string - the new URL with generate random schema id
 *
 * IMPORTANT: THIS IS A SPECIFIC POSTGRESQL DATABASE SCHEMA GENERATION!
 */
function generateUniqueDatabaseURL(schemaId: string) {
  if (!env.DATABASE_URL) {
    throw new Error('Provide a database url environment value for test e2e.');
  }

  const url = new URL(env.DATABASE_URL);
  url.searchParams.set('schema', schemaId);

  return url.toString();
}

const schemaId = randomUUID();
beforeAll(async () => {
  const databaseURL = generateUniqueDatabaseURL(schemaId);

  process.env.DATABASE_URL = databaseURL;

  DomainEvents.shouldRun = false;

  await redis.flushdb();

  execSync('pnpm prisma migrate deploy');
});

afterAll(async () => {
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`);
  await prisma.$disconnect();
});
