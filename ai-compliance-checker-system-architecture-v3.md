# AI Compliance Checker - Phase 2 Complete Architecture

**Version:** 2.0  
**Last Updated:** December 17, 2024  
**Status:** Phase 2 Complete - Production-Ready MVP

---

## Executive Summary

This document describes the complete architecture of the AI Compliance Checker as built through Phase 2. The system is a working multi-tenant AI compliance checker with three distinct interfaces, complete backend infrastructure, and database integration.

**What it does:** Organizations can deploy custom AI-powered compliance checkers that analyze sponsor/franchisee asset submissions against brand guidelines, providing instant feedback and eliminating 70%+ of revision cycles.

**Current state:** Fully functional MVP ready for pilot clients. Supports image uploads, real-time AI analysis via OpenAI GPT-4o, database-driven guidelines, submission tracking, and ghost mode for onboarding validation.

---

## Table of Contents

1. [System Components](#1-system-components)
2. [Database Architecture](#2-database-architecture)
3. [AI Integration](#3-ai-integration)
4. [Authentication & Access Control](#4-authentication--access-control)
5. [File Processing Pipeline](#5-file-processing-pipeline)
6. [Tech Stack](#6-tech-stack)
7. [Environment Configuration](#7-environment-configuration)
8. [Deployment Model](#8-deployment-model)
9. [Cost Structure](#9-cost-structure)
10. [Key Features Summary](#10-key-features-summary)
11. [Known Limitations & TODOs](#11-known-limitations--todos)
12. [File Structure](#12-file-structure)
13. [How to Run](#13-how-to-run)
14. [Data Flow Example](#14-data-flow-example)
15. [Testing Checklist](#15-testing-checklist)
16. [Next Steps](#16-next-steps)

---

## 1. System Components

### A. Submitter Interface (`SubmitterInterface.jsx`)

**Public-facing portal where sponsors/franchisees upload assets**

**URL:** `http://localhost:3000`

**Features:**
- Drag-and-drop file upload (PNG, JPG, GIF, WebP up to 10MB)
- Asset type selector (Logo, Banner, Social, Print)
- Real-time AI compliance checking via OpenAI GPT-4o
- Two response modes:
  - **Normal Mode:** Shows PASS/FAIL with confidence score, violations list, and summary
  - **Ghost Mode:** Shows generic "SUBMITTED" message (AI runs but results hidden)

**User Flow:**
1. User drags/browses image file
2. Selects asset type from dropdown
3. Clicks "Review Asset"
4. AI analyzes (5-15 seconds)
5. Results display immediately

**Technologies:**
- React functional components with hooks
- FormData API for file uploads
- Fetch API for backend communication
- CSS modules for styling

---

### B. Admin Dashboard (`Dashboard.jsx` + 3 sub-components)

**Protected interface for reviewers to manage the system**

**URL:** `http://localhost:3000/admin`

#### Login (`Login.jsx`)
- Simple password authentication
- Password stored in `.env` file (`REACT_APP_ADMIN_PASSWORD`)
- Session persists in browser localStorage
- Redirects to dashboard on success

#### Tab 1: Asset Types (`AssetTypes.jsx`)

**Manage compliance guidelines for different asset categories**

**Features:**
- View all asset types in table (name, description, guidelines preview)
- **Add New:** Modal form to create asset type with markdown guidelines
- **Edit:** Modify existing asset type and guidelines
- **Delete:** Remove asset type (with confirmation dialog)
- Real-time sync with Supabase `asset_types` table
- Success/error messaging
- Form validation

**How guidelines work:**
- Guidelines stored as plain text/markdown in database
- AI receives these guidelines in system prompt when checking assets
- Can update guidelines anytime (changes apply immediately to next submission)
- No character limit on guidelines field

**Current asset types:** Logo, Banner, Social, Print (4 defaults with sample guidelines)

**Technical implementation:**
- React state management for CRUD operations
- Supabase client for database operations
- Modal component for add/edit forms
- Textarea with monospace font for guidelines editing

---

#### Tab 2: Submissions (`Submissions.jsx`)

**View and filter all past asset submissions**

**Features:**
- Table showing all submissions with columns:
  - File name
  - Asset type
  - Result (color-coded badge: green=PASS, red=FAIL)
  - Confidence score (0-100%)
  - Submitted timestamp (formatted)
  - Actions (View Details button)
- **Three filters:**
  - Asset Type: All Types / Logo / Banner / Social / Print
  - Result: All Results / Pass / Fail
  - Date Range: All Time / Today / Last 7 Days / Last 30 Days
- Real-time filtering (no page reload)
- Count display: "X of Y submissions"
- Click "View Details" opens modal with:
  - Full-size image preview
  - Complete submission info (asset type, result, confidence, timestamp)
  - List of violations (if any)
  - "Download File" button (opens image in new tab)
  - "Close" button

**Data source:** 
- Fetches from Supabase `submissions` table
- Ordered by `submitted_at` DESC (newest first)
- Auto-refreshes on component mount

**Technical implementation:**
- useState for filter state
- useEffect for data fetching and filter application
- Client-side filtering (all data loaded once)
- Modal overlay with backdrop click-to-close

---

#### Tab 3: Settings (`Settings.jsx`)

**Configure system behavior**

**Ghost Mode Toggle:**
- Visual toggle switch (gray when OFF, green when ON)
- Real-time status display: "ACTIVE" or "DISABLED"
- Shows submission count when ghost mode is active
- Success message on toggle: "Ghost Mode enabled/disabled successfully!"
- "How It Works" instructions displayed when active:
  - Submitters upload normally
  - AI analyzes in background
  - Submitters see generic "Submitted" message
  - Admins see full AI analysis in Submissions tab
  - Use to validate accuracy before going live

**Use case:** Enable during client onboarding to validate AI accuracy without affecting submitter experience. Reviewer compares AI decisions to their own judgment, builds trust in system.

**Future settings:** Placeholder section for Phase 3 features (email notifications, auto-approve mode, etc.)

**Technical implementation:**
- Fetches `ghost_mode` setting from `app_settings` table
- Updates setting on toggle
- Optimistic UI update with rollback on error
- Auto-hides success message after 3 seconds

---

### C. Backend API (`server.js`)

**Node.js Express server handling all business logic**

**Port:** `http://localhost:3001`

**Key Endpoint: `POST /api/review`**

Accepts: `multipart/form-data` with:
- `file`: Image file
- `assetType`: String (logo, banner, social, print)

**Processing flow:**
1. Validate file upload and asset type
2. Fetch guidelines from `asset_types` table for specified asset type
3. Convert file to base64 encoding
4. Construct prompt with guidelines and send to OpenAI GPT-4o Vision API
5. Parse AI response (handles JSON extraction from markdown code blocks)
6. Upload file to Supabase Storage (`assets` bucket, `submissions/` folder)
7. Generate public URL for uploaded file
8. Save submission record to `submissions` table with all metadata
9. Check ghost mode setting from `app_settings` table
10. Return appropriate response based on ghost mode status
11. Clean up temporary file from `/uploads` folder

**Response format:**

Ghost Mode ON:
```json
{
  "ghostMode": true,
  "message": "Submission received and is under review."
}
```

Ghost Mode OFF:
```json
{
  "ghostMode": false,
  "result": {
    "pass": true,
    "confidence": 92,
    "violations": [],
    "summary": "Logo meets all brand guidelines."
  }
}
```

**Error handling:**
- Returns 400 for validation errors (no file, invalid asset type, unsupported file type)
- Returns 500 for processing errors (API failures, database errors)
- Graceful degradation: If storage upload fails, still saves submission to database
- Always cleans up temp files, even on error
- Detailed console logging for debugging

**Other endpoints:**
- `GET /api/health` - System health check, returns `{ status: 'ok', timestamp }`

**Technical details:**
- ES modules (`import`/`export`)
- Multer for file upload handling
- CORS enabled for local development
- File type filtering (only images allowed)
- 10MB file size limit
- Supabase client initialized with service key for full access

---

## 2. Database Architecture (Supabase)

### Table 1: `asset_types`

**Purpose:** Store compliance guidelines for each asset category

**Schema:**
```sql
CREATE TABLE asset_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,              -- "logo", "banner", "social", "print"
  description text,                -- "Brand logos and marks"
  guidelines text,                 -- Full markdown guidelines (no size limit)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Row-Level Security:** 
- Public read access (SELECT)
- Public insert access (INSERT)
- Public update access (UPDATE)
- Public delete access (DELETE)

⚠️ **Phase 3 TODO:** Restrict to authenticated admins only

**Current data:**
- 4 default asset types: Logo, Banner, Social, Print
- Each has sample guidelines (100-200 words)

**Usage:**
- Admin creates/edits via Asset Types tab
- Backend fetches guidelines when processing submissions
- AI receives guidelines in system prompt

---

### Table 2: `submissions`

**Purpose:** Track every asset upload and AI analysis result

**Schema:**
```sql
CREATE TABLE submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type text NOT NULL,        -- Links to asset_types.name
  file_name text NOT NULL,         -- Original filename (e.g., "acme-logo.png")
  file_url text NOT NULL,          -- Supabase Storage public URL
  result text NOT NULL,            -- 'pass' or 'fail'
  confidence_score integer,        -- 0-100
  violations jsonb,                -- Array of violation strings
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
```

**Indexes:**
```sql
CREATE INDEX idx_submissions_asset_type ON submissions(asset_type);
CREATE INDEX idx_submissions_result ON submissions(result);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at DESC);
```

**Row-Level Security:** 
- Public read/insert/update/delete access

⚠️ **Phase 3 TODO:** Add `client_id` column and restrict access per client

**Sample record:**
```json
{
  "id": "7154e373-4006-4ada-912b-7fc625fae4b6",
  "asset_type": "logo",
  "file_name": "Logo Lockup.PNG",
  "file_url": "https://ufyavbadxsntzcicluqa.supabase.co/storage/v1/object/public/assets/submissions/1766004629125-1c5v2.PNG",
  "result": "fail",
  "confidence_score": 90,
  "violations": ["Logo aspect ratio is distorted", "Minimum clear space not maintained"],
  "submitted_at": "2024-12-17T20:30:29.125Z"
}
```

**Usage:**
- Backend creates record after AI analysis
- Admin views in Submissions tab
- Filtered and sorted for reporting

---

### Table 3: `app_settings`

**Purpose:** Global application configuration

**Schema:**
```sql
CREATE TABLE app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
```

**Row-Level Security:** 
- Public read/insert/update access

**Current settings:**
```json
{
  "setting_key": "ghost_mode",
  "setting_value": {
    "enabled": false,
    "submission_count": 0
  }
}
```

**Usage:**
- Settings tab reads/updates ghost_mode setting
- Backend checks ghost_mode.enabled before sending response
- Submission count tracks how many submissions processed in ghost mode

**Future settings (Phase 3):**
- `auto_approve_enabled`
- `email_notifications_enabled`
- `submission_deadline`
- `aging_alert_hours`

---

### Storage Bucket: `assets`

**Purpose:** Store uploaded asset files

**Configuration:**
- **Bucket name:** `assets`
- **Public access:** ✅ Enabled (⚠️ TODO: Make private before production)
- **Folder structure:** `submissions/[timestamp]-[random].[ext]`
- **File naming example:** `1766018295374-k4tlh9.PNG`

**RLS Policies:**
```sql
CREATE POLICY "Allow public uploads to assets bucket"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'assets');

CREATE POLICY "Allow public reads from assets bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'assets');
```

**Access:**
- Files accessible via public URL
- Example: `https://ufyavbadxsntzcicluqa.supabase.co/storage/v1/object/public/assets/submissions/1766018295374-k4tlh9.PNG`

⚠️ **CRITICAL SECURITY TODO:** 
Before first paid client:
1. Make bucket private
2. Use signed URLs with expiration (1 hour)
3. Update `server.js` to generate signed URLs instead of public URLs

**Why this matters:**
- Sponsors don't want competitors seeing unreleased assets
- Franchises require confidential file storage
- Professional security = trust = sales

---

## 3. AI Integration

### Current: OpenAI GPT-4o Vision

**Model:** `gpt-4o`  
**Endpoint:** `https://api.openai.com/v1/chat/completions`  
**Max tokens:** 500  
**Cost:** ~$0.50-2.00 per asset check (varies by image size)

**Prompt structure:**

**System message:**
```
You are a brand compliance checker. Review the submitted asset against these guidelines and determine if it passes or fails.

Guidelines:
[client-specific guidelines from database]

Respond in this exact JSON format:
{
  "passed": true or false,
  "confidence": 0-100,
  "violations": ["violation 1", "violation 2"] or [],
  "summary": "Brief explanation"
}
```

**User message:**
- Text: `Please review this [asset_type] asset for brand compliance.`
- Image: Base64-encoded image with proper MIME type

**Response parsing:**
1. Extract content from `choices[0].message.content`
2. Use regex to find JSON block: `/\{[\s\S]*\}/`
3. Parse JSON
4. Fallback if parsing fails: `{ passed: false, confidence: 50, violations: ['AI response format error'], summary: aiResponse }`

**Error handling:**
- OpenAI API errors caught and logged
- Non-200 responses throw error
- Parsing errors fallback to safe default
- Submitter sees generic error message

**Future enhancements (Phase 3):**
- Add Claude API as alternative model
- Layer models (GPT-4o for vision, Claude for reasoning)
- Confidence thresholds for auto-escalation
- Test suite for guideline validation
- Version control for AI responses

---

## 4. Authentication & Access Control

### Current Implementation (MVP)

**Submitters:**
- ❌ No authentication required
- Public access to upload interface (`/`)
- Can upload unlimited times
- No rate limiting

**Admins:**
- ✅ Password protection (single shared password)
- Password stored in `REACT_APP_ADMIN_PASSWORD` env variable
- Session persists in browser `localStorage` with key `isAdminAuthenticated`
- No expiration (persists until logout or localStorage clear)
- No individual accounts
- Login page at `/admin/login`
- Protected routes redirect to login if not authenticated

### Security Layers

**Application level:**
- Admin routes check `localStorage.getItem('isAdminAuthenticated')`
- Redirect to `/admin/login` if not authenticated
- No server-side session validation (insecure for production)

**Database level:**
- Supabase Row-Level Security (RLS) enabled on all tables
- Public policies allow full CRUD operations
- No `client_id` filtering yet

⚠️ **CRITICAL SECURITY TODOS (Phase 3):**

**For submitters:**
1. Implement magic link authentication
2. Pre-authenticated submission links generated by reviewers
3. Token-based access with expiration (7 days)
4. Optional: Submitter allowlist (only registered emails can submit)

**For admins:**
5. Individual accounts with email/password (Supabase Auth)
6. Role-based access control (Viewer, Reviewer, Admin)
7. Session management with expiration (30 days with activity)
8. Multi-factor authentication for sensitive clients

**For database:**
9. Add `client_id` column to all tables
10. Update RLS policies to filter by `client_id`
11. Ensure complete data isolation between clients
12. Add `user_id` tracking for audit trails

**For storage:**
13. Make bucket private
14. Generate signed URLs (1-hour expiration)
15. Require authentication to access files

---

## 5. File Processing Pipeline

### Supported Files (Current)

**Accepted:**
- PNG (image/png)
- JPG/JPEG (image/jpeg)
- GIF (image/gif)
- WebP (image/webp)

**Max size:** 10MB

**Rejected:**
- All other file types (PDF, video, documents)
- Files over 10MB
- Corrupted files

### Processing Flow
```
1. Upload received via multipart/form-data
   ↓
2. Multer validation
   - File type check (MIME type)
   - Size check (≤10MB)
   - Save to /uploads/ temp folder
   ↓
3. Express handler (/api/review)
   - Validate file exists
   - Validate assetType provided
   ↓
4. Database query
   - Fetch guidelines for assetType
   - Return 400 if asset type not found
   ↓
5. File conversion
   - Read file buffer from temp location
   - Convert to base64 string
   - Determine MIME type from file extension
   ↓
6. OpenAI API call
   - Construct prompt with guidelines
   - Send base64 image
   - Wait for response (5-15 seconds typical)
   ↓
7. Response parsing
   - Extract JSON from AI response
   - Handle parsing errors with fallback
   ↓
8. Supabase Storage upload
   - Generate unique filename (timestamp + random)
   - Upload to assets/submissions/ folder
   - Get public URL
   - Continue if upload fails (graceful degradation)
   ↓
9. Database insert
   - Save submission record with all metadata
   - Log success/failure
   ↓
10. Ghost mode check
    - Query app_settings for ghost_mode.enabled
    - Determine response format
    ↓
11. Response to client
    - Ghost mode ON: Generic success message
    - Ghost mode OFF: Full AI results
    ↓
12. Cleanup
    - Delete temp file from /uploads/
    - Log completion
```

**Error handling at each step:**
- **Step 2:** Return 400 with "Invalid file type" or "File too large"
- **Step 4:** Return 400 with "Asset type not found"
- **Step 6:** Return 500 with "OpenAI API error" + log details
- **Step 8:** Log error but continue (file URL will be empty string)
- **Step 9:** Log error but continue (response still sent to user)
- **All steps:** Clean up temp file even on error

**Future enhancements (Phase 2+):**
- PDF support (convert pages to images)
- Video support (frame sampling every N seconds)
- PPTX/DOCX support (convert to images)
- Vector format support (AI, EPS via rasterization)
- Batch processing (multiple files at once)
- Resume upload for large files
- Client-side image compression before upload

---

## 6. Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| React Router | 6.x | Client-side routing |
| CSS Modules | - | Component styling |
| Fetch API | Native | HTTP requests |
| Supabase JS Client | Latest | Database/storage access |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | JavaScript runtime |
| Express | 4.x | Web framework |
| Multer | Latest | File upload handling |
| dotenv | Latest | Environment variables |
| @supabase/supabase-js | Latest | Supabase client |
| CORS | Latest | Cross-origin requests |

### Database & Storage

| Technology | Purpose |
|------------|---------|
| Supabase (PostgreSQL) | Relational database |
| Supabase Auth | Authentication (basic) |
| Supabase Storage | File storage |
| Row-Level Security | Access control |

### AI

| Technology | Purpose |
|------------|---------|
| OpenAI GPT-4o Vision | Image compliance analysis |

### Development

| Technology | Purpose |
|------------|---------|
| Concurrently | Run backend + frontend together |
| Nodemon | Auto-restart on file changes (future) |
| Git | Version control |
| GitHub | Code hosting |

### Production (Future)

| Technology | Purpose |
|------------|---------|
| Vercel | Frontend + serverless functions |
| Supabase (hosted) | Database + storage + auth |
| Custom domain | Client-specific URLs |

---

## 7. Environment Configuration

### Root `.env` File

**Location:** `~/Downloads/asset-review-tool-main-3/.env`

**Contents:**
```env
# OpenAI API Key
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx

# Supabase Backend Credentials
SUPABASE_URL=https://ufyavbadxsntzcicluqa.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here
```

**Used by:** `server.js` (backend)

---

### Client `.env` File

**Location:** `~/Downloads/asset-review-tool-main-3/client/.env`

**Contents:**
```env
# Admin Dashboard Password
REACT_APP_ADMIN_PASSWORD=your_password_here

# Supabase Frontend Credentials
REACT_APP_SUPABASE_URL=https://ufyavbadxsntzcicluqa.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

**Used by:** React components (frontend)

⚠️ **IMPORTANT:** React requires `.env` file in `client/` folder, NOT in root. Environment variables must be prefixed with `REACT_APP_` to be accessible in React.

---

### `.env.example` Template

**Location:** Root directory

**Purpose:** Template for other developers (no sensitive data)
```env
# OpenAI API Key
OPENAI_API_KEY=sk-proj-your_key_here

# Admin Dashboard Password
REACT_APP_ADMIN_PASSWORD=your_password_here

# Supabase credentials
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here
```

---

## 8. Deployment Model

### Current: Single Instance (Development)

**Setup:**
- One deployment on local machine
- Backend: `http://localhost:3001`
- Frontend: `http://localhost:3000`
- Single Supabase project (shared database)
- Single OpenAI API key

**Limitations:**
- Not accessible outside local network
- No HTTPS
- No custom domain
- Single admin password
- All data in one database

---

### Phase 3: Multi-Tenant Architecture

**Planned deployment:**
- Single codebase deployed on Vercel
- All clients share one application instance
- Data isolation via `client_id` filtering + Row-Level Security
- Vanity subdomains: `acme.compliancechecker.app`
- Custom domains available as upsell: `assets.acme.com`

**Why multi-tenant:**
- ✅ One codebase = one bugfix benefits all clients
- ✅ Lower operational overhead as client count scales
- ✅ Reduced infrastructure costs (shared Vercel/Supabase)
- ✅ Same security guarantees via RLS
- ✅ Easier to maintain and update
- ✅ Can still spin off isolated instances for enterprise ($50K+/year)

**Database changes needed:**
1. Add `client_id` UUID column to all tables
2. Create `clients` table with company info
3. Update RLS policies to filter by `client_id`
4. Link admin users to specific `client_id`
5. Ensure complete data isolation in queries

**Authentication changes needed:**
1. Magic links tied to specific `client_id`
2. Admin users tied to specific `client_id`
3. Can only see/edit data for their client
4. Super admin role for support access

---

## 9. Cost Structure

### Fixed Costs (Monthly - Shared Across All Clients)

| Item | Cost | Notes |
|------|------|-------|
| Vercel Pro | $20 | All clients share one deployment |
| Supabase Pro | $25 | 8GB database, 100GB storage, 250GB bandwidth |
| Domain | $1 | Annualized cost |
| **Total Fixed** | **$46/month** | Scales to 100+ clients |

### Variable Costs (Per Client, Monthly)

| Item | Low | High | Notes |
|------|-----|------|-------|
| OpenAI API | $50 | $300 | Depends on submission volume |
| Email (Resend) | $0 | $20 | Phase 3 feature |
| Extra Storage | $0 | $10 | If over 100GB |
| **Total Variable** | **$50** | **$330** | Per client |

### Cost Examples

**Low-volume client (50 submissions/month):**
- Fixed: $46 ÷ 10 clients = $4.60
- Variable: $50 (OpenAI)
- **Total: $54.60/month**
- **Revenue (at $500/month): 89% margin**

**High-volume client (500 submissions/month):**
- Fixed: $46 ÷ 10 clients = $4.60
- Variable: $200 (OpenAI)
- **Total: $204.60/month**
- **Revenue (at $1,500/month): 86% margin**

### Margin Calculation

**Typical mid-market client:**
- Revenue: $500/month ($5K-8K setup + $400-500 recurring)
- Costs: $150/month (moderate API usage)
- **Gross margin: 70%**

**Target margins:**
- Year 1 (10-15 clients): 80-90% (mostly founder labor)
- Year 2+ (20-30 clients): 70-80% (with VA/contractor help)

---

## 10. Key Features Summary

### ✅ Working Features (Phase 2 Complete)

**Submitter Interface:**
- ✅ File upload (drag-and-drop + browse)
- ✅ Asset type selection (4 types)
- ✅ Real-time AI compliance checking
- ✅ Pass/fail results with confidence score
- ✅ Violations list with explanations
- ✅ Ghost mode support (hides results when enabled)
- ✅ Error handling and validation
- ✅ Responsive design

**Admin Dashboard - Asset Types:**
- ✅ View all asset types in table
- ✅ Add new asset type with guidelines
- ✅ Edit existing asset type
- ✅ Delete asset type
- ✅ Real-time database sync
- ✅ Form validation
- ✅ Success/error messaging

**Admin Dashboard - Submissions:**
- ✅ View all submissions in table
- ✅ Filter by asset type
- ✅ Filter by result (pass/fail)
- ✅ Filter by date range
- ✅ Color-coded pass/fail badges
- ✅ Confidence score display
- ✅ View details modal
- ✅ Image preview
- ✅ Violations list
- ✅ Download file capability

**Admin Dashboard - Settings:**
- ✅ Ghost mode toggle
- ✅ Real-time status display
- ✅ Submission count in ghost mode
- ✅ Instructions when active
- ✅ Database persistence

**Backend:**
- ✅ Express API server
- ✅ OpenAI GPT-4o integration
- ✅ Supabase database CRUD
- ✅ File storage with public URLs
- ✅ Ghost mode logic
- ✅ Error handling and logging
- ✅ Temp file cleanup

**Database:**
- ✅ 3 tables with complete schemas
- ✅ Row-Level Security policies
- ✅ Storage bucket with policies
- ✅ Indexes for performance
- ✅ Automatic timestamps

---

## 11. Known Limitations & TODOs

### 🔒 Security (CRITICAL - Before First Paid Client)

- ⚠️ **Storage bucket is PUBLIC** → Switch to private + signed URLs
- ⚠️ **Single shared admin password** → Individual accounts with email/password
- ⚠️ **No submitter authentication** → Add magic links
- ⚠️ **RLS policies too permissive** → Restrict per `client_id`
- ⚠️ **No session expiration** → Add 30-day timeout
- ⚠️ **localStorage authentication** → Move to secure httpOnly cookies
- ⚠️ **No rate limiting** → Add to prevent abuse
- ⚠️ **No HTTPS in dev** → Required for production

**How to fix storage security (15 minutes):**
1. Go to Supabase → Storage → `assets` bucket
2. Toggle bucket to PRIVATE
3. Update `server.js` line ~215:
```javascript
// CHANGE FROM:
const { data: urlData } = supabase.storage
  .from('assets')
  .getPublicUrl(filePath);

// TO:
const { data: urlData, error } = await supabase.storage
  .from('assets')
  .createSignedUrl(filePath, 3600); // Expires in 1 hour
```
4. Test upload/download still works

---

### 📋 Features (Phase 3 Priorities)

**Must-have before production:**
- ❌ Magic link authentication for submitters
- ❌ Email notifications (submission received, approved, rejected)
- ❌ Submission status workflow (READY_FOR_REVIEW, APPROVED, REJECTED, REVISION_REQUESTED)
- ❌ Reviewer feedback loop
- ❌ Multi-tenant client isolation (`client_id` filtering)

**Nice-to-have (Phase 3+):**
- ❌ PDF support (convert pages to images)
- ❌ Video support (frame sampling)
- ❌ PPTX/DOCX support
- ❌ Vector format support (AI, EPS)
- ❌ Batch upload (multiple files)
- ❌ Auto-approve mode (AI passes bypass human review)
- ❌ Confidence thresholds (auto-escalate low confidence)
- ❌ Test suite for guidelines validation
- ❌ Version control for guidelines
- ❌ Analytics dashboard
- ❌ Webhook integrations
- ❌ API for custom integrations
- ❌ SAML/SSO for enterprise
- ❌ Reviewer roles (Viewer, Reviewer, Admin)
- ❌ Visual violation highlighting (annotate images)
- ❌ Conversational chatbot (ask guideline questions)

---

### 🐛 Known Bugs & Quirks

**Download behavior:**
- "Download File" button opens image in new tab instead of downloading
- ✅ This is expected browser behavior for images
- ✅ Users can right-click → "Save Image As..."
- 🔧 To force download, add `Content-Disposition: attachment` header (Phase 3)

**Session management:**
- Admin session persists indefinitely in localStorage
- No "Remember me" checkbox
- 🔧 Add session expiration and refresh logic (Phase 3)

**File upload:**
- No progress indicator for large files
- No resumable uploads
- 🔧 Add upload progress bar (Phase 3)

**Submissions table:**
- All submissions loaded at once (no pagination)
- Could be slow with 1,000+ submissions
- 🔧 Add pagination or virtual scrolling (Phase 3)

**Error messages:**
- Generic errors don't always guide user to solution
- 🔧 Add more specific error codes and help text (Phase 3)

---

## 12. File Structure
```
~/Downloads/asset-review-tool-main-3/
│
├── .env                                    # Backend environment variables
├── .env.example                            # Environment template
├── .gitignore                              # Git ignore rules
├── package.json                            # Root dependencies (backend)
├── package-lock.json                       # Dependency lock file
├── server.js                               # Express API server (ES modules)
├── README.md                               # Project documentation
├── ai-compliance-checker-phase-2-architecture.md  # This file
│
├── client/                                 # React frontend application
│   ├── .env                                # Frontend environment variables (REQUIRED!)
│   ├── package.json                        # Frontend dependencies
│   ├── package-lock.json
│   │
│   ├── public/                             # Static assets
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── manifest.json
│   │
│   └── src/                                # React source code
│       ├── index.js                        # React entry point
│       ├── App.js                          # Main router (BrowserRouter, Routes)
│       ├── App.css                         # Global styles
│       ├── SubmitterInterface.jsx          # Public upload interface (/)
│       │
│       └── components/
│           └── Admin/                      # Admin dashboard components
│               ├── Login.jsx               # Admin login (/admin/login)
│               ├── Dashboard.jsx           # Admin shell with tabs (/admin)
│               ├── AssetTypes.jsx          # Asset type management tab
│               ├── Submissions.jsx         # Submissions history tab
│               └── Settings.jsx            # Settings tab (ghost mode)
│
├── uploads/                                # Temporary file storage (auto-created, gitignored)
│   └── [temp files deleted after processing]
│
└── node_modules/                           # Dependencies (gitignored)
```

**Key files explained:**

- **`server.js`**: Express backend, handles `/api/review` endpoint, integrates with OpenAI and Supabase
- **`SubmitterInterface.jsx`**: Public-facing upload form, handles file selection and result display
- **`Dashboard.jsx`**: Admin shell with tab navigation
- **`AssetTypes.jsx`**: Full CRUD interface for managing guidelines
- **`Submissions.jsx`**: View and filter all submissions with detail modal
- **`Settings.jsx`**: Ghost mode toggle and future settings
- **`client/.env`**: Frontend environment variables (must be in `client/` folder, not root!)

---

## 13. How to Run

### Prerequisites
- Node.js 18+ installed
- npm installed
- Supabase account with project created
- OpenAI API key

### Initial Setup (One Time)
```bash
# 1. Navigate to project
cd ~/Downloads/asset-review-tool-main-3/

# 2. Install backend dependencies
npm install

# 3. Install frontend dependencies
cd client
npm install
cd ..

# 4. Create environment files
cp .env.example .env
# Edit .env and add your API keys

cp client/.env.example client/.env  # If example exists
# Edit client/.env and add your keys

# 5. Verify Supabase tables exist
# - Go to Supabase dashboard
# - Check for: asset_types, submissions, app_settings
# - Check for: assets storage bucket
# - If missing, run SQL queries from architecture doc
```

### Daily Development
```bash
# Start both backend and frontend
cd ~/Downloads/asset-review-tool-main-3/
npm run dev

# Backend will start on http://localhost:3001
# Frontend will start on http://localhost:3000
# Browser should auto-open to http://localhost:3000
```

**What `npm run dev` does:**
- Runs `concurrently "npm run server" "npm run client"`
- Backend: `node server.js` (port 3001)
- Frontend: `npm start --prefix client` (port 3000)
- Both run in parallel in same terminal
- Ctrl+C to stop both

### Access Points

- **Submitter interface:** http://localhost:3000
- **Admin dashboard:** http://localhost:3000/admin
- **Admin login:** http://localhost:3000/admin/login
- **Backend API:** http://localhost:3001
- **Health check:** http://localhost:3001/api/health

### Troubleshooting

**"npm run dev" fails:**
```bash
# Make sure dependencies are installed
npm install
cd client && npm install && cd ..

# Try running separately to isolate issue
npm run server  # Terminal 1
npm run client  # Terminal 2
```

**React doesn't see environment variables:**
```bash
# Make sure .env is in client/ folder, not root
ls client/.env  # Should exist

# Restart dev server after changing .env
# Ctrl+C, then npm run dev
```

**Supabase connection error:**
```bash
# Check .env has correct values
cat .env | grep SUPABASE

# Verify both files have same URL
cat .env | grep SUPABASE_URL
cat client/.env | grep SUPABASE_URL
```

**Port already in use:**
```bash
# Find and kill process on port 3000 or 3001
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Then restart
npm run dev
```

---

## 14. Data Flow Example

**Scenario:** Sponsor uploads logo for compliance check

### Step-by-Step Flow

**1. Sponsor opens submitter interface**
- URL: `http://localhost:3000`
- Sees upload zone and asset type dropdown
- Default asset type: "Logo"

**2. Sponsor drags file to upload zone**
- File: `acme-logo.png` (150KB, 1200×400 PNG)
- JavaScript creates preview using `URL.createObjectURL()`
- "Review Asset" button becomes enabled

**3. Sponsor clicks "Review Asset"**
- Frontend: `handleSubmit()` function executes
- Creates `FormData` object:
```javascript
  formData.append('file', file);
  formData.append('assetType', 'logo');
```
- Sends POST to `/api/review`
- Shows loading spinner: "Analyzing..."

**4. Backend receives request**
- Express handler: `app.post('/api/review', upload.single('file'), ...)`
- Multer saves file to `/uploads/abc123.png`
- Extracts `assetType: "logo"`
- Logs: `📋 Processing submission: Asset Type: logo, File: acme-logo.png, Size: 150 KB`

**5. Backend fetches guidelines**
- Query Supabase:
```javascript
  await supabase
    .from('asset_types')
    .select('guidelines')
    .eq('name', 'logo')
    .single()
```
- Returns guidelines text (200 words of logo compliance rules)
- Logs: `Guidelines loaded: LOGO GUIDELINES: - Logo must maintain...`

**6. Backend prepares AI request**
- Reads file: `fs.readFileSync('/uploads/abc123.png')`
- Converts to base64: 200KB string
- Constructs prompt:
```json
  {
    "model": "gpt-4o",
    "messages": [
      {
        "role": "system",
        "content": "You are a brand compliance checker...\n\nGuidelines:\n[guidelines text]"
      },
      {
        "role": "user",
        "content": [
          { "type": "text", "text": "Please review this logo asset..." },
          { "type": "image_url", "image_url": { "url": "data:image/png;base64,..." } }
        ]
      }
    ]
  }
```
- Logs: `🤖 Calling OpenAI API...`

**7. OpenAI processes request**
- Takes 8 seconds to analyze
- Returns:
```json
  {
    "choices": [{
      "message": {
        "content": "{\n  \"passed\": false,\n  \"confidence\": 92,\n  \"violations\": [\"Logo aspect ratio is distorted (should be 3:1 but appears 2.5:1)\", \"Minimum clear space of 40px not maintained on left side\"],\n  \"summary\": \"Logo fails compliance due to distorted aspect ratio and insufficient clear space.\"\n}"
      }
    }]
  }
```

**8. Backend parses response**
- Extracts JSON from response
- Logs: `✅ AI Response received`
- Parsed result:
```javascript
  {
    passed: false,
    confidence: 92,
    violations: [
      "Logo aspect ratio is distorted (should be 3:1 but appears 2.5:1)",
      "Minimum clear space of 40px not maintained on left side"
    ],
    summary: "Logo fails compliance due to distorted aspect ratio and insufficient clear space."
  }
```

**9. Backend uploads file to storage**
- Generates unique filename: `1734470400000-k7m2p9.png`
- Uploads to Supabase Storage: `assets/submissions/1734470400000-k7m2p9.png`
- Gets public URL: `https://ufyavbadxsntzcicluqa.supabase.co/storage/v1/object/public/assets/submissions/1734470400000-k7m2p9.png`
- Logs: `✅ File uploaded: https://...`

**10. Backend saves submission record**
- Inserts into `submissions` table:
```javascript
  {
    asset_type: 'logo',
    file_name: 'acme-logo.png',
    file_url: 'https://ufyavbadxsntzcicluqa.supabase.co/storage/v1/object/public/assets/submissions/1734470400000-k7m2p9.png',
    result: 'fail',
    confidence_score: 92,
    violations: ["Logo aspect ratio is distorted...", "Minimum clear space..."],
    submitted_at: '2024-12-17T20:00:00Z'
  }
```
- Logs: `✅ Submission saved with ID: 7154e373-4006-4ada-912b-7fc625fae4b6`

**11. Backend checks ghost mode**
- Queries `app_settings` table:
```javascript
  await supabase
    .from('app_settings')
    .select('setting_value')
    .eq('setting_key', 'ghost_mode')
    .single()
```
- Returns: `{ enabled: false, submission_count: 0 }`
- Logs: `👻 Ghost Mode: DISABLED`

**12. Backend sends response**
- Ghost mode is OFF, so send full results:
```json
  {
    "ghostMode": false,
    "result": {
      "pass": false,
      "confidence": 92,
      "violations": ["Logo aspect ratio is distorted...", "Minimum clear space..."],
      "summary": "Logo fails compliance..."
    }
  }
```
- Deletes temp file: `/uploads/abc123.png`
- Logs: `✨ Review complete: FAIL (92% confidence)`

**13. Frontend receives response**
- After 10 seconds total, fetch resolves
- Checks `data.ghostMode` → false
- Sets `result` state to `data.result`
- React re-renders with results

**14. Sponsor sees results**
- Red "FAIL" badge
- Confidence: 92%
- Summary text displayed
- Violations section shows:
  - "Violations Found (2)"
  - List of 2 violations
- Loading spinner disappears

**15. Admin checks dashboard**
- Navigates to `http://localhost:3000/admin`
- Clicks "Submissions" tab
- Sees new row in table:
  - File: `acme-logo.png`
  - Type: `logo`
  - Result: Red "FAIL" badge
  - Confidence: `92%`
  - Submitted: "Dec 17, 2024, 8:00 PM"
- Clicks "View Details"
- Modal opens showing:
  - Image preview (full 1200×400 logo)
  - Complete info
  - 2 violations listed
  - "Download File" button

**16. Sponsor fixes and resubmits**
- Corrects aspect ratio to 3:1
- Adds proper clear space
- Uploads new version: `acme-logo-v2.png`
- AI analyzes again (similar flow)
- This time: `passed: true, confidence: 95, violations: []`
- Sees green "PASS" badge

---

### Ghost Mode Example

**Same flow, but with ghost mode enabled:**

**Steps 1-10:** Identical (upload, analyze, save)

**Step 11:** Ghost mode check
- Queries `app_settings`
- Returns: `{ enabled: true, submission_count: 15 }`
- Logs: `👻 Ghost Mode: ACTIVE (hiding results from submitter)`

**Step 12:** Backend sends different response
```json
{
  "ghostMode": true,
  "message": "Submission received and is under review."
}
```

**Step 14:** Sponsor sees generic message
- Green "SUBMITTED" badge
- Text: "Submission Received"
- Message: "Submission received and is under review."
- Additional text: "Our team will review your submission and get back to you soon."
- NO pass/fail, NO violations, NO confidence score

**Step 15:** Admin sees full details
- Submission table shows real result: Red "FAIL" badge, 92% confidence
- "View Details" shows all violations
- Admin can compare AI decision to their own judgment
- Builds trust in AI accuracy before turning off ghost mode

---

## 15. Testing Checklist

### Functional Testing

**Submitter Interface:**
- [ ] Navigate to `http://localhost:3000`
- [ ] Drag image to upload zone (should show preview)
- [ ] Click "browse" and select image (should show preview)
- [ ] Try uploading non-image file (should show error)
- [ ] Try uploading file >10MB (should show error)
- [ ] Select different asset types from dropdown
- [ ] Click "Review Asset" (should show loading spinner)
- [ ] Wait for results (5-15 seconds)
- [ ] Verify PASS result shows green badge + confidence + summary
- [ ] Verify FAIL result shows red badge + violations list
- [ ] Click "Remove" to clear preview
- [ ] Upload second image without refresh

**Ghost Mode (Submitter Side):**
- [ ] Admin enables ghost mode in Settings
- [ ] Upload image on submitter interface
- [ ] Should see "SUBMITTED" badge (not PASS/FAIL)
- [ ] Should see generic message (not AI results)
- [ ] Terminal should log "Ghost Mode: ACTIVE"

**Admin - Login:**
- [ ] Navigate to `http://localhost:3000/admin`
- [ ] Should redirect to `/admin/login`
- [ ] Enter wrong password (should show error)
- [ ] Enter correct password (should redirect to dashboard)
- [ ] Close browser, reopen (should still be logged in)

**Admin - Asset Types:**
- [ ] Click "Asset Types" tab
- [ ] See 4 default asset types in table
- [ ] Click "Add New" button
- [ ] Fill in name, description, guidelines
- [ ] Click "Create" (should see success message)
- [ ] New row appears in table
- [ ] Click "Edit" on a row
- [ ] Modify guidelines text
- [ ] Click "Update" (should see success message)
- [ ] Changes reflected in table
- [ ] Click "Delete" on test asset type
- [ ] Confirm deletion (should see success message)
- [ ] Row disappears from table
- [ ] Refresh page (changes persist)

**Admin - Submissions:**
- [ ] Click "Submissions" tab
- [ ] See all past submissions in table
- [ ] Verify file name column
- [ ] Verify asset type column
- [ ] Verify result badges (green/red)
- [ ] Verify confidence scores
- [ ] Verify timestamps formatted correctly
- [ ] Filter by asset type (should update count)
- [ ] Filter by result "Pass" (should show only pass)
- [ ] Filter by result "Fail" (should show only fail)
- [ ] Filter by "Today" (should show only today's)
- [ ] Filter by "Last 7 Days"
- [ ] Filter by "Last 30 Days"
- [ ] Reset all filters to "All"
- [ ] Click "View Details" on a submission
- [ ] Modal opens with image preview
- [ ] See all submission info
- [ ] See violations list (if fail)
- [ ] Click "Download File" (should open in new tab)
- [ ] Click "Close" or backdrop (modal closes)
- [ ] Refresh page (filters reset)

**Admin - Settings:**
- [ ] Click "Settings" tab
- [ ] See Ghost Mode section
- [ ] Toggle should be gray (OFF)
- [ ] Click toggle (should turn green)
- [ ] Status changes to "ACTIVE"
- [ ] Success message appears
- [ ] "How It Works" instructions appear
- [ ] Click toggle again (should turn gray)
- [ ] Status changes to "DISABLED"
- [ ] Instructions disappear
- [ ] Refresh page (setting persists)

### Database Verification

**Supabase Dashboard:**
- [ ] Go to Supabase Table Editor
- [ ] Check `asset_types` table has 4+ rows
- [ ] Click on a row, verify `guidelines` field populated
- [ ] Check `submissions` table has test submissions
- [ ] Verify `file_url` links are valid
- [ ] Verify `violations` field is JSON array
- [ ] Check `app_settings` table has `ghost_mode` row
- [ ] Verify `setting_value` is JSON with `enabled` boolean
- [ ] Go to Supabase Storage
- [ ] Check `assets` bucket exists
- [ ] Open `submissions/` folder
- [ ] See uploaded files with timestamp names
- [ ] Click a file (should preview image)

### Error Handling

**Backend errors:**
- [ ] Stop Supabase (disable network)
- [ ] Try uploading (should show error)
- [ ] Restart Supabase
- [ ] Remove OpenAI API key from .env
- [ ] Try uploading (should show error with details)
- [ ] Restore API key

**Frontend errors:**
- [ ] Upload while backend is stopped
- [ ] Should show "Failed to review asset" error
- [ ] Network tab should show failed fetch
- [ ] Upload extremely large file (15MB)
- [ ] Should be blocked before reaching backend

### Performance

- [ ] Upload 1MB image (should complete in 5-10 seconds)
- [ ] Upload 10MB image (should complete in 10-20 seconds)
- [ ] Load submissions with 50+ records (should render quickly)
- [ ] Apply filters on 50+ submissions (should be instant)
- [ ] Open detail modal (should load image quickly)

### Cross-Browser (Optional)

- [ ] Test in Chrome
- [ ] Test in Safari
- [ ] Test in Firefox
- [ ] Verify drag-and-drop works
- [ ] Verify file browse works
- [ ] Verify modals display correctly

---

## 16. Next Steps

### Immediate (This Week)

**1. Test with Real Guidelines**
- [ ] Create comprehensive logo guidelines (2-3 pages)
- [ ] Create banner guidelines
- [ ] Create social media guidelines
- [ ] Test AI accuracy with 20-30 sample assets
- [ ] Measure pass/fail accuracy
- [ ] Identify edge cases and refine guidelines
- [ ] Target: 85%+ accuracy before pilot

**2. Security Hardening (Before Any Pilots)**
- [ ] Switch storage bucket to private
- [ ] Implement signed URLs with 1-hour expiration
- [ ] Test upload/download still works
- [ ] Document security changes in README
- [ ] Update architecture doc with security status

**3. Documentation Updates**
- [ ] Add this architecture doc to project folder
- [ ] Update README with Phase 2 status
- [ ] Create client-facing "How to Use" guide
- [ ] Document admin workflows (how to add asset types, etc.)

### Before First Paid Pilot (Next 2-4 Weeks)

**4. Client Onboarding Preparation**
- [ ] Create guideline ingestion questionnaire
- [ ] Design expert interview script (60-90 minutes)
- [ ] Build sample instruction document template
- [ ] Prepare test suite of "known answer" assets
- [ ] Create training materials for client reviewers

**5. MVP Polish**
- [ ] Better error messages (more specific guidance)
- [ ] Loading states with estimated time
- [ ] Success animations (subtle)
- [ ] Print-friendly submission reports
- [ ] Email templates for notifications (Phase 3 prep)

**6. Pilot Program Structure**
- [ ] Define pilot pricing ($1K-2K for 30-60 days)
- [ ] Create pilot agreement template
- [ ] Set success metrics (85% accuracy, 10+ hours saved)
- [ ] Money-back guarantee terms
- [ ] Case study release consent

### Phase 3 Priorities (Clients 1-5)

**7. Authentication Overhaul**
- [ ] Implement magic link authentication for submitters
- [ ] Pre-authenticated submission links generated by reviewers
- [ ] Individual admin accounts with email/password
- [ ] Session management with 30-day expiration
- [ ] Password reset flow

**8. Multi-Tenant Architecture**
- [ ] Add `client_id` column to all tables
- [ ] Create `clients` table
- [ ] Update RLS policies for per-client isolation
- [ ] Test data isolation thoroughly
- [ ] Deploy single instance with multiple test clients

**9. Submission Workflow**
- [ ] Status system: READY_FOR_REVIEW, APPROVED, REJECTED, REVISION_REQUESTED
- [ ] Reviewer feedback form
- [ ] Email notifications (submission received, approved, rejected)
- [ ] Resubmission linking (track revision history)
- [ ] Bulk approve/reject

**10. Email Integration**
- [ ] Set up Resend or SendGrid account
- [ ] Create email templates (5-6 templates)
- [ ] Implement notification triggers
- [ ] Test delivery and formatting
- [ ] Unsubscribe handling

### Future Enhancements (Phase 3+)

**11. Advanced AI Features**
- [ ] Claude API integration as alternative
- [ ] Model layering (GPT-4o + Claude)
- [ ] Confidence thresholds and auto-escalation
- [ ] Test suite for guideline validation
- [ ] A/B testing different prompts
- [ ] One-click learning from reviewer overrides

**12. File Format Expansion**
- [ ] PDF support (convert pages to images)
- [ ] Video support (frame sampling)
- [ ] PPTX/DOCX support
- [ ] Vector format support (AI, EPS via rasterization)
- [ ] Batch upload (multiple files at once)

**13. Integration Ecosystem**
- [ ] Webhook support (generic)
- [ ] Google Drive export
- [ ] Dropbox export
- [ ] Slack notifications
- [ ] Ziflow integration
- [ ] API for custom integrations

**14. Analytics & Reporting**
- [ ] Submission volume dashboard
- [ ] Pass rate trends
- [ ] Common violation patterns
- [ ] AI accuracy metrics
- [ ] Reviewer performance stats
- [ ] Export to PDF/CSV

**15. Enterprise Features**
- [ ] SAML/SSO (Okta, Azure AD)
- [ ] Custom domains per client
- [ ] White-labeling options
- [ ] SLA monitoring
- [ ] Dedicated instances for $50K+ clients
- [ ] SOC 2 compliance documentation

---

## Appendix A: Quick Reference Commands

### Development
```bash
# Start dev environment
cd ~/Downloads/asset-review-tool-main-3/
npm run dev

# Stop servers
Ctrl+C

# Install new backend package
npm install package-name

# Install new frontend package
cd client
npm install package-name
cd ..

# View backend logs
# (Already visible in terminal where npm run dev is running)

# View frontend logs
# (In browser console: Command+Option+J)
```

### Database
```bash
# Access Supabase
open https://supabase.com/dashboard

# Common queries (run in SQL Editor):

# View all asset types
SELECT * FROM asset_types;

# View recent submissions
SELECT * FROM submissions ORDER BY submitted_at DESC LIMIT 10;

# Check ghost mode status
SELECT * FROM app_settings WHERE setting_key = 'ghost_mode';

# Count submissions by result
SELECT result, COUNT(*) FROM submissions GROUP BY result;
```

### Git
```bash
# Check status
git status

# Add all changes
git add .

# Commit with message
git commit -m "Description of changes"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main

# View commit history
git log --oneline
```

### Troubleshooting
```bash
# Check if ports are in use
lsof -ti:3000  # Frontend
lsof -ti:3001  # Backend

# Kill process on port
lsof -ti:3000 | xargs kill -9

# Check environment variables
cat .env
cat client/.env

# Verify Node version
node --version  # Should be 18+

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules
npm install
```

---

## Appendix B: Common Issues & Solutions

### Issue: React doesn't see environment variables

**Symptom:** Frontend shows "Missing Supabase credentials" error

**Solution:**
1. Verify `.env` file is in `client/` folder (not root)
2. Verify variables are prefixed with `REACT_APP_`
3. Restart dev server (Ctrl+C, then `npm run dev`)

---

### Issue: Supabase connection fails

**Symptom:** Backend logs "❌ Supabase connection error"

**Solution:**
1. Check `.env` has correct `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
2. Verify keys are not wrapped in quotes
3. Test connection in Supabase dashboard (should be green)
4. Check network/firewall isn't blocking requests

---

### Issue: OpenAI API returns 401

**Symptom:** "❌ OpenAI API error: 401"

**Solution:**
1. Verify `OPENAI_API_KEY` in `.env` is correct
2. Check key starts with `sk-proj-` or `sk-`
3. Log in to OpenAI dashboard and verify key is active
4. Check billing is enabled and has credits

---

### Issue: File upload fails silently

**Symptom:** Upload completes but no file in storage

**Solution:**
1. Check Supabase Storage bucket exists and is named `assets`
2. Verify RLS policies allow public uploads
3. Check browser console for errors
4. Verify `SUPABASE_SERVICE_KEY` is correct (not anon key)

---

### Issue: Ghost mode toggle doesn't work

**Symptom:** Toggle switches but setting doesn't persist

**Solution:**
1. Check `app_settings` table exists in Supabase
2. Verify table has `ghost_mode` row
3. Check RLS policies allow updates
4. Look for errors in browser console

---

### Issue: Admin password doesn't work

**Symptom:** Correct password rejected at login

**Solution:**
1. Check `REACT_APP_ADMIN_PASSWORD` in `client/.env`
2. Verify no extra spaces or quotes
3. Restart dev server after changing .env
4. Clear browser localStorage: `localStorage.clear()`

---

### Issue: Images don't display in submissions modal

**Symptom:** Modal shows broken image icon

**Solution:**
1. Check file actually uploaded to storage
2. Verify `file_url` in submissions table is valid
3. Try opening URL directly in browser
4. Check storage bucket is public (or signed URLs implemented)

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| **Asset Type** | Category of submission (Logo, Banner, Social, Print) |
| **Ghost Mode** | AI analyzes but hides results from submitters (for onboarding) |
| **Guideline** | Rules stored in database that AI uses to check compliance |
| **Submission** | Single asset upload with associated metadata and AI analysis |
| **Submitter** | External party uploading assets (sponsor, franchisee, partner) |
| **Reviewer** | Client's internal team member who manages system |
| **Confidence Score** | AI's self-reported certainty (0-100) in its analysis |
| **Violation** | Specific guideline rule that asset failed to meet |
| **Pass/Fail** | Binary result of AI compliance check |
| **RLS** | Row-Level Security - Supabase database access control |
| **Magic Link** | Pre-authenticated URL that logs user in automatically |
| **Multi-Tenant** | Single app instance serving multiple clients with data isolation |
| **Signed URL** | Temporary URL with expiration for accessing private files |
| **Base64** | Image encoding format for API transmission |
| **MIME Type** | File type indicator (image/png, image/jpeg, etc.) |

---

## Document Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 12, 2024 | Initial architecture (Phase 1 complete) |
| 2.0 | Dec 17, 2024 | Phase 2 complete architecture documentation |

---

**END OF DOCUMENT**