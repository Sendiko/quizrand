#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function loadEnvFile(filePath) {
  const env = {};

  if (!fs.existsSync(filePath)) {
    return env;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...rest] = trimmed.split('=');
      const val = rest.join('=').replace(/^['"]|['"]$/g, '');
      env[key.trim()] = val;
    }
  }

  return env;
}

function loadProjectEnv() {
  const mergedEnv = {};

  for (const fileName of ['.env', '.env.development', '.env.production']) {
    const filePath = path.join(projectRoot, fileName);
    const fileEnv = loadEnvFile(filePath);

    for (const [key, value] of Object.entries(fileEnv)) {
      mergedEnv[key] = value;
    }
  }

  return mergedEnv;
}

const projectEnv = loadProjectEnv();

// 1. Determine target provider
const args = process.argv.slice(2);
let targetProvider = args.find((arg) => !arg.startsWith('--'));

if (!targetProvider) {
  targetProvider = process.env.DATABASE_PROVIDER || projectEnv.DATABASE_PROVIDER;
}

if (!targetProvider) {
  const effectiveNodeEnv = process.env.NODE_ENV || projectEnv.NODE_ENV;
  targetProvider = effectiveNodeEnv === 'production' ? 'mysql' : 'sqlite';
}

targetProvider = targetProvider.toLowerCase();

if (targetProvider !== 'sqlite' && targetProvider !== 'mysql') {
  console.error(`\x1b[31m[quizrand:db] Error: Unknown provider "${targetProvider}". Expected "sqlite" or "mysql".\x1b[0m`);
  process.exit(1);
}

// 2. Paths
const sourceSchema = path.join(projectRoot, 'prisma', `schema.${targetProvider}.prisma`);
const targetSchema = path.join(projectRoot, 'prisma', 'schema.prisma');

if (!fs.existsSync(sourceSchema)) {
  console.error(`\x1b[31m[quizrand:db] Error: Source schema not found at ${sourceSchema}\x1b[0m`);
  process.exit(1);
}

// 3. Copy schema
fs.copyFileSync(sourceSchema, targetSchema);
console.log(`\x1b[32m[quizrand:db] Successfully synced ${targetProvider.toUpperCase()} schema -> prisma/schema.prisma\x1b[0m`);

// 4. Generate Prisma Client unless --no-generate is provided
const shouldGenerate = !args.includes('--no-generate');
if (shouldGenerate) {
  console.log(`[quizrand:db] Running "prisma generate"...`);
  try {
    // Load corresponding env file if present
    const envFileName = targetProvider === 'mysql' ? '.env.production' : '.env.development';
    const envFilePath = path.join(projectRoot, envFileName);
    const extraEnv = {};
    if (fs.existsSync(envFilePath)) {
      const envContent = fs.readFileSync(envFilePath, 'utf8');
      for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...rest] = trimmed.split('=');
          const val = rest.join('=').replace(/^["']|["']$/g, '');
          extraEnv[key.trim()] = val;
        }
      }
    }

    execSync('npx prisma generate', {
      cwd: projectRoot,
      stdio: 'inherit',
      env: { ...process.env, ...extraEnv },
    });
    console.log(`\x1b[32m[quizrand:db] Prisma Client ready for ${targetProvider.toUpperCase()}!\x1b[0m`);
  } catch (error) {
    console.error(`\x1b[31m[quizrand:db] Failed to run "prisma generate".\x1b[0m`, error);
    process.exit(1);
  }
}
