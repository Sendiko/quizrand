/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_FILE = '../quiz_data.json';
const CHUNK_SIZE = 20;

function splitQuizData() {
  try {
    // 1. Read and parse the input JSON file
    const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
    const questions = JSON.parse(rawData);

    console.log(`Loaded ${questions.length} questions from ${INPUT_FILE}.`);

    // 2. Loop through the array and chunk into groups of CHUNK_SIZE
    let fileIndex = 1;
    for (let i = 0; i < questions.length; i += CHUNK_SIZE) {
      const chunk = questions.slice(i, i + CHUNK_SIZE);
      const outputFilename = `quiz_part_${fileIndex}.json`;

      // 3. Write each chunk to its own JSON file
      fs.writeFileSync(
        path.join(__dirname, outputFilename),
        JSON.stringify(chunk, null, 2),
        'utf8'
      );

      console.log(`Created ${outputFilename} with ${chunk.length} questions.`);
      fileIndex++;
    }

    console.log('Successfully split the JSON file into 8 parts!');

  } catch (error) {
    console.error('An error occurred while splitting the file:', error.message);
  }
}

splitQuizData();