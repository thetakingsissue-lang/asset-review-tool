import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Supabase setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

console.log('🔌 Initializing Supabase connection...');

// Test Supabase connection on startup
async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    const { data, error } = await supabase
      .from('asset_types')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Supabase connection error:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connected successfully!');
    console.log('   Project URL:', process.env.SUPABASE_URL);
    return true;
  } catch (err) {
    console.error('❌ Supabase connection failed:', err.message);
    return false;
  }
}

testSupabaseConnection();

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

// API Routes
app.post('/api/review', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { assetType } = req.body;
    
    if (!assetType) {
      return res.status(400).json({ error: 'Asset type is required' });
    }

    console.log(`\n📋 Processing submission:`);
    console.log(`   Asset Type: ${assetType}`);
    console.log(`   File: ${req.file.originalname}`);
    console.log(`   Size: ${(req.file.size / 1024).toFixed(2)} KB`);

    // Get guidelines for this asset type from Supabase
    const { data: assetTypeData, error: assetTypeError } = await supabase
      .from('asset_types')
      .select('guidelines')
      .eq('name', assetType)
      .single();

    if (assetTypeError || !assetTypeData) {
      console.error('❌ Asset type not found:', assetType);
      return res.status(400).json({ error: `Asset type "${assetType}" not found` });
    }

    const guidelines = assetTypeData.guidelines || 'No specific guidelines provided.';
    console.log(`   Guidelines loaded: ${guidelines.substring(0, 100)}...`);

    // Read file and convert to base64
    const fileBuffer = fs.readFileSync(req.file.path);
    const base64Image = fileBuffer.toString('base64');
    const mimeType = req.file.mimetype;

    // Call OpenAI Vision API
    console.log('🤖 Calling OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a brand compliance checker. Review the submitted asset against these guidelines and determine if it passes or fails.

Guidelines:
${guidelines}

Respond in this exact JSON format:
{
  "passed": true or false,
  "confidence": 0-100,
  "violations": ["violation 1", "violation 2"] or [],
  "summary": "Brief explanation"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Please review this ${assetType} asset for brand compliance.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    console.log('✅ AI Response received');

    // Parse AI response
    let result;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      result = {
        passed: false,
        confidence: 50,
        violations: ['AI response format error'],
        summary: aiResponse
      };
    }

    // Upload file to Supabase Storage
    console.log('📤 Uploading file to Supabase Storage...');
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `submissions/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('assets')
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: false
      });

    if (uploadError) {
      console.error('❌ File upload error:', uploadError);
      // Continue anyway - we'll save submission without file URL
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('assets')
      .getPublicUrl(filePath);

    const fileUrl = urlData?.publicUrl || '';
    console.log('✅ File uploaded:', fileUrl);

    // Save submission to database
    console.log('💾 Saving submission to database...');
    const { data: submissionData, error: submissionError } = await supabase
      .from('submissions')
      .insert([{
        asset_type: assetType,
        file_name: req.file.originalname,
        file_url: fileUrl,
        result: result.passed ? 'pass' : 'fail',
        confidence_score: result.confidence || 0,
        violations: result.violations || []
      }])
      .select()
      .single();

    if (submissionError) {
      console.error('❌ Database save error:', submissionError);
      // Continue anyway - we'll still return results to user
    } else {
      console.log('✅ Submission saved with ID:', submissionData.id);
    }

    // Clean up temporary file
    fs.unlinkSync(req.file.path);

    // Check if ghost mode is enabled
const { data: ghostModeData } = await supabase
  .from('app_settings')
  .select('setting_value')
  .eq('setting_key', 'ghost_mode')
  .single();

const ghostModeEnabled = ghostModeData?.setting_value?.enabled || false;

// Send response
console.log(`\n✨ Review complete: ${result.passed ? 'PASS' : 'FAIL'} (${result.confidence}% confidence)`);
console.log(`👻 Ghost Mode: ${ghostModeEnabled ? 'ACTIVE (hiding results from submitter)' : 'DISABLED'}\n`);

if (ghostModeEnabled) {
  // Ghost mode: Don't show AI results to submitter
  res.json({
    ghostMode: true,
    message: 'Submission received and is under review.'
  });
} else {
  // Normal mode: Show AI results
  res.json({
    ghostMode: false,
    result: {
      pass: result.passed,
      confidence: result.confidence,
      violations: result.violations,
      summary: result.summary
    }
  });
}

  } catch (error) {
    console.error('❌ Error in /api/review:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Failed to process file',
      details: error.message 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.listen(PORT, () => {
  console.log(`Asset Review API running on http://localhost:${PORT}`);
});

export { supabase };