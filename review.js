import 'dotenv/config';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function reviewAsset(imagePath, guidelines) {
  // Validate image exists
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image file not found: ${imagePath}`);
  }

  // Read and encode image as base64
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  // Determine media type from extension
  const ext = path.extname(imagePath).toLowerCase();
  const mediaType = ext === '.png' ? 'image/png' : 'image/jpeg';

  const prompt = `You are a brand compliance reviewer. Analyze this image against the following brand guidelines and provide a structured assessment.

BRAND GUIDELINES:
${guidelines}

INSTRUCTIONS:
1. Carefully examine the image for any violations of the brand guidelines
2. Determine if the asset passes or fails compliance
3. List specific violations found (if any)
4. Provide a confidence score (0-100) for your assessment

Respond ONLY with valid JSON in this exact format:
{
  "pass": true or false,
  "violations": ["violation 1", "violation 2"],
  "confidence": 0-100,
  "summary": "Brief summary of the review"
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mediaType};base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    max_tokens: 1000,
  });

  const content = response.choices[0].message.content;

  // Parse JSON from response (handle markdown code blocks if present)
  let jsonStr = content;
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  return JSON.parse(jsonStr);
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: node review.js <image-path> <guidelines>');
    console.log('Example: node review.js ./logo.png "Logo must be blue. No text allowed."');
    process.exit(1);
  }

  const imagePath = args[0];
  const guidelines = args.slice(1).join(' ');

  console.log('Reviewing asset...\n');
  console.log(`Image: ${imagePath}`);
  console.log(`Guidelines: ${guidelines}\n`);

  try {
    const result = await reviewAsset(imagePath, guidelines);
    console.log('--- Review Result ---');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
