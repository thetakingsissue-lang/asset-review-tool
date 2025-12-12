import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  },
});

// Asset type guidelines presets
const ASSET_GUIDELINES = {
  logo: `LOGO GUIDELINES:
- Logo must maintain proper aspect ratio (not stretched or distorted)
- Minimum clear space around logo must be respected
- Logo colors must match brand palette (no unauthorized color variations)
- Logo must be high resolution and not pixelated
- No unauthorized modifications or additions to logo elements
- Background must not interfere with logo visibility`,

  banner: `BANNER GUIDELINES:
- Banner dimensions must be appropriate for intended use
- Text must be readable and properly sized (not too small)
- Images must be high quality and not pixelated
- Brand colors must be consistent with brand palette
- Call-to-action must be clear and visible
- No clutter - maintain visual hierarchy
- Safe zones must be respected for text and key elements`,

  social: `SOCIAL MEDIA GUIDELINES:
- Image must be optimized for social platform dimensions
- Text overlay must not exceed 20% of image area
- Brand logo must be visible but not overpowering
- Colors must be vibrant and attention-grabbing
- Key message must be immediately clear
- Contact/website info must be included if promotional
- Must be visually consistent with brand identity`,

  print: `PRINT GUIDELINES:
- Resolution must be at least 300 DPI for print quality
- Colors must be CMYK-compatible (no neon/RGB-only colors)
- Bleed area must be included if required
- Text must be minimum 8pt for readability
- Logo must be vector or high-resolution
- No compression artifacts or pixelation
- Proper margins and safe zones must be maintained`,
};

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Review asset function
async function reviewAsset(imagePath, guidelines) {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  const ext = path.extname(imagePath).toLowerCase();
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  const mediaType = mimeTypes[ext] || 'image/jpeg';

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
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: `data:${mediaType};base64,${base64Image}` },
          },
        ],
      },
    ],
    max_tokens: 1000,
  });

  const content = response.choices[0].message.content;

  let jsonStr = content;
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  return JSON.parse(jsonStr);
}

// API Routes
app.post('/api/review', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const assetType = req.body.assetType || 'logo';
    const customGuidelines = req.body.customGuidelines;

    const guidelines = customGuidelines || ASSET_GUIDELINES[assetType] || ASSET_GUIDELINES.logo;

    const result = await reviewAsset(req.file.path, guidelines);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      assetType,
      result,
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Review error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to review asset',
    });
  }
});

// Get available asset types
app.get('/api/asset-types', (req, res) => {
  res.json({
    types: Object.keys(ASSET_GUIDELINES).map(key => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      description: ASSET_GUIDELINES[key].split('\n')[0],
    })),
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from React app in production
const buildPath = path.join(__dirname, 'client/build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));

  // Handle client-side routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.listen(PORT, () => {
  console.log(`Asset Review API running on http://localhost:${PORT}`);
});
