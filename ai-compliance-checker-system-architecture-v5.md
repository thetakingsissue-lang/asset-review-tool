# AI Compliance Checker - System Architecture v5

**Version:** 5.0  
**Last Updated:** February 20, 2026  
**Status:** Phase 2 Complete + Batch Photo Upload — Production-Ready MVP

---

## Executive Summary

SubmitClear is a productized AI compliance checking service. Organizations deploy custom instances that sit between submitters and reviewers — catching guideline violations before they reach human review.

**What it does:** Submitters upload assets (images, photos, marketing materials). AI checks against client-specific guidelines instantly. Submitters fix issues before formal submission. Reviewers only see compliant assets.

**Current state:** Fully functional MVP with two distinct submitter interfaces, complete admin dashboard, database-driven guidelines, reference image learning, ghost mode for onboarding, and a new batch photo upload interface targeting property management companies.

**What's new in v5:**
- Batch photo upload interface (`/batch`) for processing up to 30 photos simultaneously
- Mobile-first responsive design for property manager smartphone workflows
- Property photo guidelines calibrated for real-world iPhone photography
- Property management identified as third target vertical alongside events and franchises

---

## Table of Contents

1. [System Components](#1-system-components)
2. [Database Architecture](#2-database-architecture)
3. [AI Integration](#3-ai-integration)
4. [Reference Images Feature](#4-reference-images-feature)
5. [Batch Upload Feature](#5-batch-upload-feature-new-in-v5)
6. [Authentication & Access Control](#6-authentication--access-control)
7. [File Processing Pipeline](#7-file-processing-pipeline)
8. [Tech Stack](#8-tech-stack)
9. [Environment Configuration](#9-environment-configuration)
10. [Deployment Model](#10-deployment-model)
11. [Cost Structure](#11-cost-structure)
12. [Target Markets](#12-target-markets)
13. [Known Limitations & TODOs](#13-known-limitations--todos)
14. [File Structure](#14-file-structure)
15. [How to Run](#15-how-to-run)
16. [Data Flow Examples](#16-data-flow-examples)
17. [Testing Checklist](#17-testing-checklist)
18. [Next Steps](#18-next-steps)
19. [Update Log](#19-update-log)

---

## 1. System Components

### A. Single-File Submitter Interface (`SubmitterInterface.jsx`)

**URL:** `http://localhost:3000/`

**Purpose:** Original public-facing portal for single asset submission (sponsor logos, banners, marketing materials)

**Features:**
- Drag-and-drop or browse file upload (PNG, JPG, GIF, WebP, up to 10MB)
- Dynamic asset type selector (loads from Supabase in real-time)
- Real-time AI compliance checking via OpenAI GPT-4o Vision
- Normal Mode: PASS/FAIL with confidence score and violations list
- Ghost Mode: Generic "SUBMITTED" message (AI runs silently)
- Custom pass/fail messages per asset type with email link detection

**User Flow:**
1. Select asset type from dropdown
2. Upload file
3. Click "Review Asset"
4. AI analyzes (5-15 seconds)
5. Results display with violation details and next-step instructions

---

### B. Batch Photo Upload Interface (`BatchUploader.jsx`) — NEW in v5

**URL:** `http://localhost:3000/batch`

**Purpose:** Mobile-optimized interface for property managers submitting multiple listing photos at once

**Features:**
- Upload up to 30 photos via click or drag-and-drop
- Throttled parallel processing (5 concurrent API requests)
- Results stream in as individual photos complete
- Thumbnail grid with green checkmark / red X overlays
- Tap-to-expand modal showing full violation details per photo
- Summary count (X Passed, X Failed) after batch completes
- "Clear All" to reset, "Resubmit Failed Photos" to retry
- Mobile-first CSS: 3-column grid on mobile, scales to 6 on desktop
- Touch-friendly controls

**User Flow:**
1. Select asset type (e.g., "Property Photos")
2. Upload 1-30 photos
3. Click "Review [N] Photos"
4. Watch results stream in (5 at a time)
5. Tap any thumbnail to see why it passed or failed
6. Fix failed photos and resubmit

**Why throttled at 5:** Prevents timeouts from simultaneous OpenAI API calls and avoids overwhelming the Express backend. 5 concurrent provides fast streaming UX without rate limit risk.

---

### C. Admin Dashboard (`Dashboard.jsx` + sub-components)

**URL:** `http://localhost:3000/admin`

**Authentication:** Password-protected (set in `client/.env`)

**Tabs:**

**Asset Types tab (`AssetTypes.jsx`):**
- Add, edit, delete asset types
- Full guideline editing (markdown text)
- Reference image upload and management
- Custom pass/fail message configuration
- Real-time Supabase sync

**Submissions tab (`Submissions.jsx`):**
- View all submission history
- Filter by asset type, result (pass/fail), date range
- Detail modal: full image, confidence score, violations, download
- Works for both single-file and batch submissions

**Settings tab (`Settings.jsx`):**
- Ghost mode toggle (on/off)
- When on: submitters see "SUBMITTED" regardless of AI result

---

## 2. Database Architecture

### Table: `asset_types`

Stores compliance configuration for each asset category.

```sql
CREATE TABLE asset_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  guidelines text,           -- Full markdown guidelines document
  reference_images jsonb,    -- Array of reference image objects
  pass_message text,         -- Optional message shown on pass
  fail_message text,         -- Optional message shown on fail
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Reference images format:**
```json
[
  {
    "url": "https://supabase.co/.../reference-images/logo/1234-abc.png",
    "fileName": "approved-logo.png",
    "storagePath": "reference-images/logo/1234-abc.png"
  }
]
```

---

### Table: `submissions`

Tracks every asset upload and AI result.

```sql
CREATE TABLE submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  result text NOT NULL,          -- 'pass' or 'fail'
  confidence_score integer,      -- 0-100
  violations jsonb,              -- Array of violation strings
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
```

---

### Table: `app_settings`

Global configuration (ghost mode, etc.).

```sql
CREATE TABLE app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
```

---

### Storage Bucket: `assets`

| Setting | Value |
|---------|-------|
| Bucket name | `assets` |
| Public access | ❌ DISABLED |
| Access method | Signed URLs (1-hour expiration) |
| Submissions folder | `submissions/[timestamp]-[random].[ext]` |
| Reference images folder | `reference-images/[asset-type]/[timestamp]-[random].[ext]` |

---

## 3. AI Integration

**Current model:** OpenAI GPT-4o Vision (`gpt-4o`)  
**Future:** Claude API (Anthropic) — modular, swappable

**API endpoint:** `POST /api/review`

**Request payload:**
```
FormData:
  - file: [image file]
  - assetType: "Property Photos"
```

**Processing flow:**
1. File received and temporarily stored in `/uploads/`
2. Guidelines fetched from Supabase for selected asset type
3. Reference images fetched (if any) and converted to base64
4. OpenAI call constructed with: system prompt (guidelines) + reference images + uploaded file
5. AI returns: pass/fail decision, confidence score (0-100), violations array, summary
6. Result saved to `submissions` table
7. Signed URL generated for stored file
8. Response returned to frontend
9. Temp file deleted from `/uploads/`

**Prompt structure:**
```
System: You are a compliance checker. Guidelines: [asset type guidelines]
User: [reference images if any] [uploaded image] Analyze this asset.
Return JSON: { result, confidence, violations[], summary }
```

---

## 4. Reference Images Feature

Admins upload example images (approved logos, correct formats, etc.) per asset type. AI includes these as visual context when analyzing submissions.

**Impact:** Improved accuracy from ~75% to ~95% for logo recognition tasks.

**How it works:**
1. Admin uploads reference images in Asset Types tab
2. Images stored in Supabase private bucket
3. When submission reviewed, backend fetches reference images
4. Images converted to base64 and included in OpenAI API call
5. AI uses them as "this is what correct looks like" context

---

## 5. Batch Upload Feature (NEW in v5)

### Architecture

The batch interface fires concurrent requests to the existing `/api/review` endpoint — no backend changes required.

**Frontend components added:**
- `BatchUploader.jsx` — Main batch upload component
- `BatchUploader.css` — Mobile-first responsive styles

**App.js routing addition:**
```javascript
<Route path="/batch" element={<BatchUploader />} />
```

### Concurrency Model

```
User uploads 12 photos
→ Split into chunks of 5
→ Chunk 1 (photos 1-5): fire simultaneously
→ As each completes, result appears in grid
→ When chunk 1 done, fire chunk 2 (photos 6-10)
→ Continue until all processed
```

Uses `Promise.allSettled` so a single failure doesn't block the batch.

### Property Photo Guidelines

Asset type: "Property Photos"  
Philosophy: Calibrated for property managers with iPhones, not professional photographers.

**Hard fails (always reject):**
- Vertical/portrait orientation
- Extremely dark (room not clearly visible)
- Visible clutter or mess
- Toilet lid up
- People or pets in frame

**Pass without penalty:**
- Slightly dark but room still clearly visible
- Decorative items (throw pillows, plants, artwork)
- Minor framing or angle imperfections
- Small counter items (coffee maker, soap, fruit bowl)
- Modest or older furnishings

**AI instruction:** When in doubt, pass. Flag only photos that would embarrass the property or mislead a prospective resident.

---

## 6. Authentication & Access Control

| User | Method | Session |
|------|--------|---------|
| Submitters (single-file) | None — open access | N/A |
| Submitters (batch) | None — open access | N/A |
| Admin | Password (env variable) | Persists (no expiration yet) |
| Super admin | Direct Supabase access | N/A |

**Planned (Phase 3):**
- Magic links for submitters
- Individual admin accounts with expiring sessions
- Row-level security per client_id

---

## 7. File Processing Pipeline

```
1. File upload (FormData POST to /api/review)
2. Multer middleware saves to /uploads/ temporarily
3. File type + size validation
4. Asset type guidelines fetched from Supabase
5. Reference images fetched + converted to base64
6. OpenAI API call (GPT-4o Vision)
7. Result parsed from AI response
8. File uploaded to Supabase private bucket
9. Submission record saved to database
10. Signed URL generated (1-hour expiration)
11. Response returned to frontend
12. Temp file deleted from /uploads/
```

---

## 8. Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | React | Hooks-based functional components |
| Backend | Node.js + Express | ES modules |
| Database | Supabase (PostgreSQL) | RLS enabled |
| File Storage | Supabase Storage | Private bucket, signed URLs |
| AI | OpenAI GPT-4o Vision | Modular — swappable for Claude |
| Dev server | Concurrently | Backend :3001, React :3000 |
| Hosting (planned) | Vercel | Single deployment, all clients |

---

## 9. Environment Configuration

**Root `.env` (backend):**
```env
OPENAI_API_KEY=sk-proj-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here
```

**`client/.env` (frontend):**
```env
REACT_APP_ADMIN_PASSWORD=your_password_here
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## 10. Deployment Model

**Current:** Local development only  
**Planned:** Vercel (frontend) + Supabase (backend/db/storage)

**Per-client deployment strategy:**
- Single codebase, multiple client configurations
- Each client's guidelines, reference images, and settings stored in database
- Future: `client_id` column on all tables for full multi-tenant isolation
- Future: vanity subdomains (client.submitclear.com)

---

## 11. Cost Structure

**Per client per month:**
- Vercel hosting: ~$0 (shared)
- Supabase: ~$25 (shared across clients)
- OpenAI API: $50-200 (depends on volume)
- **Total variable cost: $50-200/month per client**

**Pricing vs. cost:**
- Events clients: $300-500/month → 60-90% margin
- Franchise clients: $1,000-2,500/month → 80-92% margin
- Property management: $300-1,500/month → 60-90% margin

**Token cost per photo (property use case):**
- ~$0.003-0.005 per photo
- 20 photos per listing cycle: ~$0.10-0.15
- Large client (20K photos/month): ~$100-125 API cost

---

## 12. Target Markets

### Events (Primary)
- Mid-to-large conferences, 30-200 sponsors
- Pain: Sponsor asset review cycles, 30-40% rejection rates
- Pricing: $5K-8K setup + $300-500/month

### Franchises (Secondary)
- 50-500 locations, franchisee marketing compliance
- Pain: Volume (600-1,500 assets/month), legal liability, inconsistency
- Pricing: $15K-25K setup + $1K-2,500/month

### Property Management (Emerging — validated Feb 2026)
- 50-300 properties, local managers taking listing photos
- Pain: Bad photos only caught after going live, no scalable pre-screening
- Validated by Rob Burns (Director, Sun Communities) discovery call
- Key insight: Property managers don't post bad photos knowing they're bad — they post the least-bad ones from a bad batch. Tool gives them confidence to submit more photos.
- Batch upload interface built specifically for this workflow
- Pricing: $5K-15K setup + $300-1,500/month

**Other adjacent verticals identified (not yet pursued):**
- Auto dealership groups (inventory photo quality)
- Restaurant franchise chains (food photography for menus/delivery)
- Fitness franchises (gym floor and equipment photos)
- Senior living operators
- Vacation rental management companies (50+ properties)

---

## 13. Known Limitations & TODOs

**Current limitations:**
- File formats: PNG, JPG, GIF, WebP only (no PDF, video, PPTX)
- Authentication: Single shared admin password, no submitter accounts
- No email notifications
- No submission status workflow
- No multi-tenant isolation (single database, no client_id)
- No pagination on submissions list
- Signed URLs expire in 1 hour (by design)

**Phase 3 priorities (before first pilots):**
- [ ] Magic link auth for submitters
- [ ] Individual admin accounts with session expiration
- [ ] Status workflow (READY_FOR_REVIEW → APPROVED/REJECTED)
- [ ] Email notifications
- [ ] client_id column + RLS policies for multi-tenant isolation
- [ ] Rate limiting on upload endpoint

---

## 14. File Structure

```
~/Downloads/asset-review-tool-main-3/
│
├── .env                          # Backend secrets (not in git)
├── .env.example                  # Template
├── .gitignore
├── package.json
├── server.js                     # Express API (ES modules)
│
├── client/
│   ├── .env                      # Frontend secrets (not in git)
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── App.js                # Router: /, /batch, /admin
│       ├── App.css
│       ├── index.js
│       ├── SubmitterInterface.jsx # Single-file upload (/)
│       ├── BatchUploader.jsx      # Batch photo upload (/batch) — NEW
│       ├── BatchUploader.css      # Batch uploader styles — NEW
│       │
│       └── components/Admin/
│           ├── Login.jsx
│           ├── Dashboard.jsx
│           ├── AssetTypes.jsx
│           ├── Submissions.jsx
│           └── Settings.jsx
│
└── uploads/                      # Temp storage (auto-created, gitignored)
```

---

## 15. How to Run

**Terminal 1 — Backend:**
```bash
cd ~/Downloads/asset-review-tool-main-3
node server.js
# Should show: Server running on port 3001 + Supabase ✅
```

**Terminal 2 — Frontend:**
```bash
cd ~/Downloads/asset-review-tool-main-3/client
npm start
# Opens browser to localhost:3000
```

**URLs:**
| URL | Interface |
|-----|-----------|
| `localhost:3000/` | Single-file submitter |
| `localhost:3000/batch` | Batch photo upload |
| `localhost:3000/admin` | Admin dashboard |

---

## 16. Data Flow Examples

### Single Asset Review
```
Submitter → / → selects asset type → uploads file
→ POST /api/review (FormData: file + assetType)
→ server.js: fetch guidelines from Supabase
→ server.js: fetch reference images from Supabase
→ OpenAI GPT-4o Vision API call
→ Parse result (pass/fail, confidence, violations)
→ Save to submissions table
→ Generate signed URL
→ Return result to frontend
→ Display PASS/FAIL with violations
```

### Batch Photo Review
```
Property manager → /batch → selects "Property Photos" → uploads 15 photos
→ BatchUploader splits into chunks of 5
→ Chunk 1: 5 concurrent POST /api/review requests
→ Results stream in as each completes (thumbnails go green/red)
→ Chunk 2 fires when chunk 1 complete
→ Continue until all 15 processed
→ Summary: "11 Passed, 4 Failed"
→ Tap failed thumbnail → see specific violations
→ Retake failed photos, resubmit
```

---

## 17. Testing Checklist

- [ ] `node server.js` starts without errors
- [ ] Supabase connection shows ✅ in terminal
- [ ] Single-file interface loads at `/`
- [ ] Asset type dropdown populates from database
- [ ] Single file upload + AI review works
- [ ] Pass/fail result displays with violations
- [ ] Custom pass/fail messages display
- [ ] Batch interface loads at `/batch`
- [ ] Multi-photo upload works
- [ ] Results stream in (not all at once)
- [ ] Tap-to-expand modal shows violation details
- [ ] Admin login works at `/admin`
- [ ] Asset Types CRUD works
- [ ] Reference image upload works
- [ ] Submissions history shows data
- [ ] Ghost mode toggles correctly
- [ ] Signed URLs load images correctly

---

## 18. Next Steps

### Immediate (Before Pilot Outreach)
- [ ] Record Loom demo of batch upload for Rob Burns (Sun Communities)
- [ ] Get Rob to intro to VP Marketing at mid-size property management company
- [ ] Validate buyer (VP Marketing) vs. validator (Rob) distinction
- [ ] Continue discovery interview outreach (LinkedIn)

### Phase 3 Build (Before First Paying Client)
- [ ] Magic link auth for submitters
- [ ] Submission status workflow
- [ ] Email notifications
- [ ] Multi-tenant client_id isolation

### Business Development
- [ ] Shadow audit offer: run AI parallel to human review, prove accuracy
- [ ] Target: 3-5 shadow audit participants who could convert to paying clients
- [ ] Pricing validation: $5K-15K setup + $300-1,500/month for property management

---

## 19. Update Log

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | Nov 2025 | Initial MVP — submitter interface + OpenAI integration |
| v2.0 | Dec 2025 | Admin dashboard, asset type management |
| v3.0 | Dec 18, 2025 | Reference images, submissions history, ghost mode |
| v4.0 | Dec 27, 2025 | Security hardening — private bucket + signed URLs |
| v4.1 | Dec 30, 2025 | Security tested and verified |
| v4.2 | Jan 15, 2026 | Custom pass/fail messages per asset type |
| v5.0 | Feb 20, 2026 | Batch photo upload interface, property management vertical, property photo guidelines |

---

*For business context, pricing, go-to-market strategy, and ICP details, see the project system prompt.*
