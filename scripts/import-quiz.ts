#!/usr/bin/env tsx
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { prisma } from '../lib/db';

interface RawQuizItem {
  header?: string;
  question: string;
  choices: string[];
  correctAnswer?: string | string[];
  explanation?: string;
  order?: number;
}

interface RawQuizFile {
  title?: string;
  description?: string;
  category?: string;
  timeLimitMinutes?: number;
  questions?: RawQuizItem[];
  data?: RawQuizItem[];
}

function printUsage() {
  console.log(`
\x1b[1mQuizRand - CLI JSON Data Importer\x1b[0m

Usage:
  npm run db:import -- <file-path> [options]
  npx tsx scripts/import-quiz.ts <file-path> [options]

Arguments:
  <file-path>               Path to JSON file containing quiz questions

Options:
  -t, --title <string>      Title of the quiz (default: filename or inferred)
  -c, --category <string>   Category for the quiz (e.g. "Cloud Computing", "AWS")
  -d, --description <string>Description of the quiz
  -l, --time-limit <number> Time limit in minutes
  -q, --quiz-id <string>    Import / append questions into an existing Quiz ID
  --keep-prefix             Preserve option letter prefixes (e.g. "A. ") in option text
  --keep-most-voted         Do not strip "Most Voted" badges from choice strings
  --draft                   Save quiz as draft (isPublished = false)
  -h, --help                Show this help message

Examples:
  npm run db:import -- ./quiz_data.json
  npm run db:import -- ../quizrand-scraper/quiz_data.json --title "AWS Solutions Architect" --category "AWS"
  npm run db:import -- ./questions.json --quiz-id "cmtwm..."
`);
}

function parseChoice(
  choiceStr: string,
  index: number,
  keepPrefix: boolean,
  keepMostVoted: boolean
): { letter: string; text: string } {
  let text = choiceStr.trim();

  // Strip trailing "Most Voted" badge text if present
  if (!keepMostVoted) {
    text = text.replace(/\s*Most Voted\s*$/i, '').trim();
  }

  // Check for leading letter prefix (e.g. "A. ", "B) ", "C: ")
  const prefixMatch = text.match(/^([A-Z])[\.\)\:\-]\s*(.*)$/i);
  let letter = String.fromCharCode(65 + index); // default: A, B, C, D...

  if (prefixMatch) {
    letter = prefixMatch[1].toUpperCase();
    if (!keepPrefix) {
      text = prefixMatch[2].trim();
    }
  }

  return { letter, text };
}

function checkIsCorrect(
  letter: string,
  optionText: string,
  correctAnswer?: string | string[]
): boolean {
  if (!correctAnswer) return false;

  if (Array.isArray(correctAnswer)) {
    return correctAnswer.some((ans) => checkIsCorrect(letter, optionText, ans));
  }

  const trimmed = correctAnswer.trim();

  // 1. Direct letter match (e.g. "B")
  if (trimmed.toUpperCase() === letter) return true;

  // 2. Multi-letter answer (e.g. "A, B" or "A and B")
  const letters = trimmed.toUpperCase().match(/[A-Z]/g);
  if (letters && letters.includes(letter)) {
    return true;
  }

  // 3. Direct text match
  if (trimmed.toLowerCase() === optionText.toLowerCase()) {
    return true;
  }

  return false;
}

function formatTitleFromFilename(filePath: string): string {
  const base = path.basename(filePath, path.extname(filePath));
  return base
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

async function importQuizFromFile(
  resolvedPath: string,
  values: {
    title?: string;
    category?: string;
    description?: string;
    timeLimit?: string;
    quizId?: string;
    keepPrefix: boolean;
    keepMostVoted: boolean;
    draft: boolean;
  }
) {
  console.log(`\x1b[36m[quizrand:import] Reading JSON file: ${resolvedPath}\x1b[0m`);

  let rawContent: string;
  try {
    rawContent = fs.readFileSync(resolvedPath, 'utf8');
  } catch (err) {
    console.error(`\x1b[31m[quizrand:import] Error reading file:\x1b[0m`, err);
    process.exit(1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch (err) {
    console.error(`\x1b[31m[quizrand:import] Error parsing JSON file. Please ensure it is valid JSON.\x1b[0m`, err);
    process.exit(1);
  }

  // Extract question items and possible metadata
  let items: RawQuizItem[] = [];
  let fileTitle: string | undefined;
  let fileDescription: string | undefined;
  let fileCategory: string | undefined;
  let fileTimeLimit: number | undefined;

  if (Array.isArray(parsed)) {
    items = parsed as RawQuizItem[];
  } else if (parsed && typeof parsed === 'object') {
    const obj = parsed as RawQuizFile;
    fileTitle = obj.title;
    fileDescription = obj.description;
    fileCategory = obj.category;
    fileTimeLimit = obj.timeLimitMinutes;

    if (Array.isArray(obj.questions)) {
      items = obj.questions;
    } else if (Array.isArray(obj.data)) {
      items = obj.data;
    }
  }

  if (!items || items.length === 0) {
    console.error(`\x1b[31m[quizrand:import] Error: No questions found in JSON file.\x1b[0m`);
    process.exit(1);
  }

  console.log(`\x1b[32m[quizrand:import] Found ${items.length} questions to import.\x1b[0m`);

  const quizTitle = values.title || fileTitle || formatTitleFromFilename(resolvedPath);
  const quizCategory = values.category || fileCategory || 'General';
  const quizDescription =
    values.description ||
    fileDescription ||
    `Imported from ${path.basename(resolvedPath)} (${items.length} questions)`;

  const timeLimitMinutes = values.timeLimit
    ? parseInt(values.timeLimit, 10)
    : fileTimeLimit || Math.max(5, Math.ceil(items.length * 1.5));

  const isPublished = !values.draft;

  let quizId = values.quizId;

  if (quizId) {
    const existingQuiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!existingQuiz) {
      console.error(`\x1b[31m[quizrand:import] Error: Quiz with ID "${quizId}" not found.\x1b[0m`);
      process.exit(1);
    }
    console.log(`[quizrand:import] Appending to existing Quiz: "${existingQuiz.title}" (ID: ${existingQuiz.id})`);
  } else {
    const newQuiz = await prisma.quiz.create({
      data: {
        title: quizTitle,
        description: quizDescription,
        category: quizCategory,
        timeLimitMinutes: isNaN(timeLimitMinutes) ? null : timeLimitMinutes,
        isPublished,
      },
    });
    quizId = newQuiz.id;
    console.log(`\x1b[32m[quizrand:import] Created new Quiz: "${newQuiz.title}" (ID: ${newQuiz.id})\x1b[0m`);
  }

  console.log(`[quizrand:import] Importing questions and choices...`);
  let totalOptionsCount = 0;

  await prisma.$transaction(
    async (tx) => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        let order = i + 1;
        if (typeof item.order === 'number') {
          order = item.order;
        } else if (item.header) {
          const match = item.header.match(/#(\d+)/);
          if (match) {
            order = parseInt(match[1], 10);
          }
        }

        const choices = Array.isArray(item.choices) ? item.choices : [];

        const question = await tx.question.create({
          data: {
            quizId: quizId!,
            header: item.header || null,
            text: item.question || '',
            explanation: item.explanation || null,
            order,
          },
        });

        for (let cIdx = 0; cIdx < choices.length; cIdx++) {
          const choiceRaw = choices[cIdx];
          const { letter, text } = parseChoice(
            choiceRaw,
            cIdx,
            values.keepPrefix,
            values.keepMostVoted
          );

          const isCorrect = checkIsCorrect(letter, text, item.correctAnswer);

          await tx.option.create({
            data: {
              questionId: question.id,
              text,
              isCorrect,
              order: cIdx + 1,
            },
          });
          totalOptionsCount++;
        }
      }
    },
    {
      maxWait: 10000,
      timeout: 30000,
    }
  );

  console.log(`\n\x1b[32m✔ Import Completed Successfully!\x1b[0m`);
  console.log(`- Quiz ID:          ${quizId}`);
  console.log(`- Quiz Title:       ${quizTitle}`);
  console.log(`- Category:         ${quizCategory}`);
  console.log(`- Questions Saved:  ${items.length}`);
  console.log(`- Choices Saved:    ${totalOptionsCount}`);
  console.log(`- Published Status: ${isPublished ? 'Published' : 'Draft'}`);
}

async function main() {
  const { values, positionals } = parseArgs({
    options: {
      file: { type: 'string', short: 'f' },
      title: { type: 'string', short: 't' },
      category: { type: 'string', short: 'c' },
      description: { type: 'string', short: 'd' },
      timeLimit: { type: 'string', short: 'l' },
      quizId: { type: 'string', short: 'q' },
      keepPrefix: { type: 'boolean', default: false },
      keepMostVoted: { type: 'boolean', default: false },
      draft: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: true,
  });

  if (values.help) {
    printUsage();
    process.exit(0);
  }

  const rawFilePath = positionals[0] || values.file;
  if (!rawFilePath) {
    console.error(`\x1b[31m[quizrand:import] Error: Please provide a JSON file path to import.\x1b[0m\n`);
    printUsage();
    process.exit(1);
  }

  const resolvedPath = path.resolve(process.cwd(), rawFilePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`\x1b[31m[quizrand:import] Error: File not found at ${resolvedPath}\x1b[0m`);
    process.exit(1);
  }

  const pathStats = fs.statSync(resolvedPath);

  if (pathStats.isDirectory()) {
    const jsonFiles = fs
      .readdirSync(resolvedPath)
      .filter((fileName) => fileName.toLowerCase().endsWith('.json'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    if (jsonFiles.length === 0) {
      console.error(`\x1b[31m[quizrand:import] Error: No JSON files found in directory ${resolvedPath}\x1b[0m`);
      process.exit(1);
    }

    console.log(`\x1b[36m[quizrand:import] Importing ${jsonFiles.length} JSON files from directory: ${resolvedPath}\x1b[0m`);

    for (const fileName of jsonFiles) {
      const filePath = path.join(resolvedPath, fileName);
      await importQuizFromFile(filePath, {
        ...values,
        title: undefined,
        quizId: undefined,
      });
    }

    return;
  }

  await importQuizFromFile(resolvedPath, values);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(`\x1b[31m[quizrand:import] Import failed:\x1b[0m`, error);
    await prisma.$disconnect();
    process.exit(1);
  });
