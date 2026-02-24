# AI Compliance Checker

> An AI-powered asset review tool that helps organizations (events, franchises, property management) check submissions against brand and quality guidelines — before they reach human reviewers.

**Business Name:** SubmitClear  
**Business Model:** $5K-25K setup + $300-2,500/month per client  
**Target Revenue:** $300K-400K/year with 25-30 clients  
**Founder:** Sean Higgins (AWS Partner Marketing Contractor)

---

## 🎯 What It Does

Organizations deploy custom AI "gatekeepers" that sit between submitters and reviewers:
- Submitters upload assets (logos, banners, social, print, property photos)
- AI instantly checks against client-specific guidelines
- AI learns from reference images uploaded by admins
- Custom pass/fail messages guide submitters to next steps
- Submitters fix issues before formal submission
- Reviewers only see compliant assets
- **Result:** Eliminate 70%+ of back-and-forth revision cycles

**NEW USE CASE — Property Photo Quality:** Property managers submit listing photos via mobile batch upload. AI screens for orientation, lighting, clutter, and staging issues before photos go live on listing sites.

---

## ✅ Current State (Phase 2 COMPLETE + Batch Upload - February 2026)

### What's Built & Working:

**Phase 1 (Complete):**
- ✅ Submitter upload interface (drag-and-drop, file browse)
- ✅ Dynamic asset type selector (loads from database)
- ✅ AI compliance checking via OpenAI GPT-4o Vision API
- ✅ Pass/fail results with confidence scores and violation lists
- ✅ Admin dashboard with authentication
- ✅ Password-protected admin access
- ✅ Supabase database connected

**Phase 2 (COMPLETE - December 18, 2025):**
- ✅ **Asset Type Management UI** - Full CRUD interface
  - Add, edit, delete asset types
  - Custom guidelines per asset type
  - Real-time sync with database
- ✅ **Reference Images Feature** - AI visual learning
  - Upload reference images per asset type
  - AI compares submissions against reference images
  - Supports logo recognition and visual compliance
  - Images stored in Supabase Storage
- ✅ **Submissions History** - View and filter all submissions
  - Filter by asset type, result, date range
  - Detail modal with image preview
  - Download capability
- ✅ **Ghost Mode** - Shadow mode for client onboarding
  - Toggle in Settings tab
  - AI analyzes but hides results from submitters
  - Validates accuracy before going live
- ✅ **UI Polish** - Professional interface

**Custom Messages Feature (COMPLETE - January 15, 2026):**
- ✅ Optional pass/fail message fields per asset type
- ✅ Displayed to submitters after AI analysis
- ✅ Email addresses automatically converted to clickable links
- ✅ Styled with appropriate colors (green for pass, red for fail)

**Security Hardening (COMPLETE - December 30, 2025):**
- ✅ Private storage bucket (public access disabled)
- ✅ Signed URLs with 1-hour expiration
- ✅ All upload/download flows tested and working

**Batch Photo Upload (COMPLETE - February 20, 2026):**
- ✅ **New interface at `/batch`** — original single-file tool unchanged at `/`
- ✅ Upload up to 30 photos at once via click or drag-and-drop
- ✅ Throttled parallel processing (5 concurrent requests) — avoids timeouts
- ✅ Results stream in as photos complete (real-time feedback)
- ✅ Thumbnail grid with green checkmark / red X overlays
- ✅ Tap-to-expand modal showing full violation details per photo
- ✅ Summary count (passed/failed) after batch completes
- ✅ Mobile-first responsive CSS (3-column grid on mobile, 6 on desktop)
- ✅ "Clear All" and "Resubmit Failed Photos" actions
- ✅ Built for property management use case (tested with Sun Communities photos)

**Property Photo Guidelines (COMPLETE - February 20, 2026):**
- ✅ "Property Photos" asset type configured in admin
- ✅ Calibrated for real-world property manager iPhone photography (not professional shoots)
- ✅ Hard fails: vertical orientation, extremely dark, visible clutter/mess, toilet lid up, people/pets in frame
- ✅ Lenient on: slight darkness, throw pillows/decor, minor framing imperfections, small counter items

---

### What's NOT Built Yet:

**Phase 3 (Planned - Before First Pilots):**
- [ ] Magic link authentication for submitters
- [ ] Reviewer feedback loop with status workflow
- [ ] Email notifications
- [ ] One-click learning from AI mistakes
- [ ] Multi-tenant client isolation (client_id filtering)

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React | Submitter portal + admin dashboard |
| Backend | Node.js + Express | API server |
| Database | Supabase (PostgreSQL) | Data storage, auth, file storage |
| AI (Current) | OpenAI GPT-4o Vision | Image compliance analysis |
| AI (Future) | Claude API (Anthropic) | Will replace/augment OpenAI |
| Hosting | Vercel (planned) | Deployment |
| Dev Server | Concurrently | Runs both backend (:3001) and React (:3000) |

---

## 📁 Project Structure

```
~/Downloads/asset-review-tool-main-3/
│
├── .env                          # Backend environment variables
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore rules
├── package.json                  # Node dependencies
├── server.js                     # Express API server (ES modules)
│
├── client/                       # React frontend
│   ├── .env                      # Frontend environment variables
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── App.js                # Main router (/ and /batch routes)
│       ├── App.css               # Global styles
│       ├── index.js              # React entry point
│       ├── SubmitterInterface.jsx # Single-file upload interface (/)
│       ├── BatchUploader.jsx      # NEW: Batch photo upload interface (/batch)
│       ├── BatchUploader.css      # NEW: Mobile-first batch uploader styles
│       │
│       └── components/
│           └── Admin/                      # Admin dashboard components
│               ├── Login.jsx               # Admin login
│               ├── Dashboard.jsx           # Admin shell with tabs
│               ├── AssetTypes.jsx          # Asset management (guidelines + reference images + custom messages)
│               ├── Submissions.jsx         # History view
│               └── Settings.jsx            # Ghost mode toggle
│
├── uploads/                      # Temporary file uploads (auto-created)
└── node_modules/                 # Dependencies (not in git)
```

---

## 🗄 Database Schema (Supabase)

### Table 1: `asset_types`

```sql
CREATE TABLE asset_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  guidelines text,
  reference_images jsonb,
  pass_message text,
  fail_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Table 2: `submissions`

```sql
CREATE TABLE submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  result text NOT NULL,
  confidence_score integer,
  violations jsonb,
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
```

### Table 3: `app_settings`

```sql
CREATE TABLE app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
```

### Storage Bucket: `assets`

- **Bucket name:** `assets`
- **Public access:** ❌ DISABLED (Private)
- **Access method:** Signed URLs, 1-hour expiration
- **Folders:** `submissions/` and `reference-images/[asset-type]/`

---

## 🔧 Environment Variables

**Root `.env`:**
```env
OPENAI_API_KEY=sk-proj-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here
```

**Client `.env`:**
```env
REACT_APP_ADMIN_PASSWORD=your_password_here
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## 🚀 How to Run

**Terminal 1 — Backend:**
```bash
cd ~/Downloads/asset-review-tool-main-3
node server.js
```

**Terminal 2 — Frontend:**
```bash
cd ~/Downloads/asset-review-tool-main-3/client
npm start
```

**URLs:**
- `http://localhost:3000/` — Single-file submitter interface
- `http://localhost:3000/batch` — Batch photo upload interface (NEW)
- `http://localhost:3000/admin` — Admin dashboard

---

## 🎯 Target Markets

**Primary — Event Operations Teams:**
- Setup: $5K-8K | Monthly: $300-500
- Pain: Sponsor asset review cycles, 30-40% rejection rates

**Secondary — Franchise Systems:**
- Setup: $15K-25K | Monthly: $1K-2.5K
- Pain: Franchisee marketing compliance at scale

**Emerging — Property Management:**
- Setup: $5K-15K | Monthly: $300-1,500
- Pain: Property managers submitting low-quality listing photos
- Validated by Rob Burns (Sun Communities) discovery call, Feb 2026
- Batch upload interface built and tested for this use case

---

## 📋 Phase Roadmap

### ✅ Phase 0: Foundation (COMPLETE)
- LLC, EIN, bank account, domain

### ✅ Phase 1: Basic MVP (COMPLETE)
- Submitter upload, OpenAI integration, pass/fail results, admin shell, Supabase

### ✅ Phase 2: Admin Features (COMPLETE - December 2025)
- Asset Type Management, Reference Images, Submissions History, Ghost Mode

### ✅ Custom Messages (COMPLETE - January 2026)
- Per-asset-type pass/fail messages with email link detection

### ✅ Security Hardening (COMPLETE - December 2025)
- Private bucket, signed URLs

### ✅ Batch Photo Upload (COMPLETE - February 2026)
- Mobile-first batch interface at /batch
- Throttled parallel processing
- Property photo guidelines calibrated

### 🚧 Phase 3: Production Readiness (Before First Pilots)
- [ ] Magic link authentication for submitters
- [ ] Individual admin accounts
- [ ] Status workflow (READY_FOR_REVIEW, APPROVED, REJECTED, etc.)
- [ ] Email notifications
- [ ] Multi-tenant client_id isolation

### ⏳ Phase 4: Advanced Features (After 3-5 Pilots)
- One-click learning from AI mistakes
- PDF guideline upload
- Video/PPTX/DOCX support
- Auto-approve mode
- Webhook integrations
- Visual violation highlighting

---

## 🔒 Security Notes

**✅ Implemented:**
- Password-protected admin access
- Environment variables for all secrets
- RLS enabled on Supabase tables
- File type validation + 10MB size limit
- Private storage bucket with signed URLs (1-hour expiration)

**⚠️ TODO Before Production:**
- Replace shared password with individual accounts
- Add magic links for submitters
- Add client_id filtering for multi-tenant isolation
- Rate limiting on upload endpoint

---

## 🐛 Known Issues & Limitations

1. File formats: PNG, JPG, GIF, WebP only (no PDF, video, PPTX yet)
2. Signed URLs expire after 1 hour (by design)
3. Single shared admin password
4. No submitter accounts
5. No email notifications
6. No submission workflow (just pass/fail)
7. Single deployment (all test data in one database)
8. No pagination on submissions (could slow with 1,000+ records)

---

## 📊 Success Metrics

**Technical:**
- AI accuracy: 85%+ (measured in Ghost Mode)
- Response time: <5 seconds per asset
- Uptime: 99%+

**Business:**
- 10-15 clients by end of Year 1
- $120K-180K revenue Year 1
- 20-25 hours/week founder time
- 80%+ profit margin

---

## 📝 Development Notes

### How to Start a New Claude Conversation:
1. Upload `README.md` + `ai-compliance-checker-system-architecture-v4.md`
2. Say: "I'm continuing work on SubmitClear. Please read the README to understand current state."
3. Specify what you want to work on next

### Before Committing to Git:
- ✅ Confirm `.env` is in `.gitignore`
- ✅ Test both `/` and `/batch` interfaces work
- ✅ No API keys in code
- ✅ Update README with new features

### Testing Checklist:
- [ ] Single-file interface loads at `/`
- [ ] Batch interface loads at `/batch`
- [ ] Admin login works at `/admin`
- [ ] File upload works (single and batch)
- [ ] AI returns results
- [ ] Custom messages display correctly
- [ ] Asset Types CRUD works
- [ ] Submissions history shows data
- [ ] Ghost mode toggles correctly
- [ ] Supabase connection shows ✅ in terminal

---

## 📚 Quick Reference Links

- Supabase Dashboard: https://supabase.com
- OpenAI Platform: https://platform.openai.com
- GitHub Repo: https://github.com/thetakingsissue-lang/asset-review-tool

---

**Last Updated:** February 20, 2026  
**Version:** 2.3 — Batch Photo Upload + Property Management Vertical  
**Project Status:** Production-Ready MVP — Ready for shadow audits and first pilot outreach
