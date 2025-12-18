# AI Compliance Checker

> An AI-powered asset review tool that helps organizations (events, franchises) check sponsor/franchisee submissions against brand guidelines.

**Business Model:** $5K-8K setup + $300-500/month per client  
**Target Revenue:** $300K-400K/year with 25-30 clients  
**Founder:** Sean Higgins (AWS Partner Marketing Contractor, building lifestyle business)

---

## 🎯 What It Does

Organizations deploy custom AI "gatekeepers" that sit between submitters and reviewers:
- Submitters upload assets (logos, banners, social, print)
- AI instantly checks against client-specific brand guidelines
- **NEW:** AI learns from reference images uploaded by admins
- Submitters fix issues before formal submission
- Reviewers only see compliant assets
- **Result:** Eliminate 70%+ of back-and-forth revision cycles

---

## ✅ Current State (Phase 2 COMPLETE - December 2024)

### What's Built & Working:

**Phase 1 (Complete):**
- ✅ Submitter upload interface (drag-and-drop, file browse)
- ✅ Dynamic asset type selector (loads from database)
- ✅ AI compliance checking via OpenAI GPT-4o Vision API
- ✅ Pass/fail results with confidence scores and violation lists
- ✅ Admin dashboard with authentication
- ✅ Password-protected admin access
- ✅ Supabase database connected

**Phase 2 (COMPLETE - December 18, 2024):**
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
  - Success/error messaging
  - Loading states
  - Color-coded badges
  - Responsive design

### What's NOT Built Yet:

**Phase 3 (Planned - After First Pilots):**
- Magic link authentication for submitters
- Reviewer feedback loop with status workflow
- Email notifications
- One-click learning from AI mistakes
- PDF guideline upload and parsing
- Multi-tenant client isolation (client_id filtering)
- Private storage with signed URLs (SECURITY - do before pilots!)
- Submission gating with custom pass/fail messages

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
│       ├── App.js                # Main router
│       ├── App.css               # Global styles
│       ├── index.js              # React entry point
│       ├── SubmitterInterface.jsx # Public upload interface (/)
│       └── components/
│           └── Admin/
│               ├── Login.jsx     # Admin login
│               ├── Dashboard.jsx # Admin shell with tabs
│               ├── AssetTypes.jsx # Asset management (with reference images)
│               ├── Submissions.jsx # History view
│               └── Settings.jsx  # Ghost mode toggle
│
├── uploads/                      # Temporary file uploads (auto-created)
└── node_modules/                 # Dependencies (not in git)
```

---

## 🗄 Database Schema (Supabase)

### Table 1: `asset_types`

**Purpose:** Store compliance guidelines and reference images for each asset category

**Schema:**
```sql
CREATE TABLE asset_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,              -- "logo", "banner", "social", "print"
  description text,                -- "Brand logos and marks"
  guidelines text,                 -- Full markdown guidelines (no size limit)
  reference_images jsonb,          -- Array of reference image objects
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Reference Images Format:**
```json
[
  {
    "url": "https://supabase.co/.../reference-images/logo/1234-abc.png",
    "fileName": "apple-logo.png",
    "storagePath": "reference-images/logo/1234-abc.png"
  }
]
```

### Table 2: `submissions`

**Purpose:** Track every asset upload and AI analysis result

**Schema:**
```sql
CREATE TABLE submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  result text NOT NULL,            -- 'pass' or 'fail'
  confidence_score integer,        -- 0-100
  violations jsonb,                -- Array of violation strings
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
```

### Table 3: `app_settings`

**Purpose:** Global application configuration (ghost mode, etc.)

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

### Storage Bucket: `assets`

**Purpose:** Store uploaded asset files and reference images

**Configuration:**
- **Bucket name:** `assets`
- **Public access:** ✅ Enabled (⚠️ TODO: Make private before production)
- **Folder structure:** 
  - `submissions/[timestamp]-[random].[ext]` - Submitted assets
  - `reference-images/[asset-type]/[timestamp]-[random].[ext]` - Reference images

⚠️ **CRITICAL SECURITY TODO:** 
Before first paid client:
1. Make bucket private
2. Use signed URLs with expiration (1 hour)
3. Update server.js to generate signed URLs instead of public URLs

---

## 🔧 Environment Variables

**Root `.env` file:**
```env
# OpenAI API Key
OPENAI_API_KEY=sk-proj-...

# Supabase Backend Credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here
```

**Client `.env` file:**
```env
# Admin Dashboard Password
REACT_APP_ADMIN_PASSWORD=your_password_here

# Supabase Frontend Credentials
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

⚠️ **IMPORTANT:** React requires `.env` file in `client/` folder, NOT in root.

---

## 🚀 How to Run

### Prerequisites:
- Node.js 18+ installed
- npm installed
- Supabase account with project created
- OpenAI API key

### Setup:

```bash
# 1. Navigate to project
cd ~/Downloads/asset-review-tool-main-3/

# 2. Install dependencies
npm install
cd client && npm install && cd ..

# 3. Create environment files
cp .env.example .env
# Edit .env and add your API keys

cp client/.env.example client/.env
# Edit client/.env and add your keys

# 4. Start development servers (both backend and frontend)
npm run dev
```

**What happens:**
- Backend starts on `http://localhost:3001`
- React frontend starts on `http://localhost:3000`
- Visit `http://localhost:3000` for submitter interface
- Visit `http://localhost:3000/admin` for admin dashboard

---

## 🎨 Key Features Explained

### 1. Dynamic Asset Types

Admins can create/edit/delete asset types through the admin dashboard. Each asset type has:
- **Name** (e.g., "Logo", "Banner")
- **Description** (brief explanation)
- **Guidelines** (detailed markdown compliance rules)
- **Reference Images** (optional visual examples)

Asset types load dynamically on the submitter interface - no hardcoding!

### 2. Reference Images (AI Visual Learning)

**How it works:**
1. Admin uploads 1+ reference images per asset type
2. Images stored in Supabase Storage at `reference-images/{asset-type}/`
3. When submission is analyzed:
   - Backend fetches reference images from database
   - Downloads and converts to base64
   - Includes in OpenAI API call BEFORE submission image
   - AI compares submission against references
4. Dramatically improves accuracy for logo recognition and visual compliance

**Use cases:**
- Specific logo matching (e.g., "must use THIS Apple logo")
- Color palette examples
- Layout/composition references
- Typography examples

### 3. Ghost Mode

**Purpose:** Validate AI accuracy during client onboarding without affecting submitters

**How it works:**
1. Admin enables ghost mode in Settings tab
2. Submitters upload normally
3. AI analyzes in background
4. Submitters see generic "Submitted" message (no pass/fail)
5. Admins see full AI analysis in Submissions tab
6. Admin compares AI decisions to their own judgment
7. Once 85%+ accuracy confirmed, disable ghost mode

**Why it's important:** Builds client trust before going live

### 4. Submissions History

View and filter all past submissions:
- **Filter by asset type:** Logo, Banner, etc.
- **Filter by result:** Pass, Fail, All
- **Filter by date:** Today, Last 7 Days, Last 30 Days, All Time
- **Detail modal:** Click "View Details" to see full image, violations, download link

---

## 📋 Phase Roadmap

### ✅ Phase 0: Foundation (COMPLETE)
- Business formation (LLC, EIN, bank account)
- Domain purchased
- Project initialized

### ✅ Phase 1: Basic MVP (COMPLETE)
- Submitter upload interface
- OpenAI GPT-4o integration
- Pass/fail results display
- Admin shell (login, routing, tabs)
- Supabase setup and connection

### ✅ Phase 2: Admin Features (COMPLETE - December 18, 2024)
- Asset Type Management with CRUD interface
- Reference Images upload and AI integration
- Submissions History with filtering
- Ghost Mode for onboarding validation
- UI polish and professional design

### 🚧 Phase 3: Production Readiness (Before First Pilot)
**CRITICAL SECURITY:**
- [ ] Switch storage bucket to private
- [ ] Implement signed URLs (1-hour expiration)
- [ ] Test upload/download still works

**AUTHENTICATION:**
- [ ] Magic link authentication for submitters
- [ ] Individual admin accounts (email/password)
- [ ] Session management with expiration

**SUBMISSION WORKFLOW:**
- [ ] Status system (READY_FOR_REVIEW, APPROVED, REJECTED, etc.)
- [ ] Reviewer feedback form
- [ ] Email notifications
- [ ] Resubmission linking

**MULTI-TENANT:**
- [ ] Add `client_id` column to all tables
- [ ] Update RLS policies for per-client isolation
- [ ] Test data isolation thoroughly

### ⏳ Phase 4: Advanced Features (After 3-5 Pilots)
- One-click learning from AI mistakes
- PDF guideline upload and parsing
- Video/PPTX/DOCX support
- Submission gating with custom messages
- Auto-approve mode
- Webhook integrations
- Visual violation highlighting
- Analytics dashboard

---

## 🔐 Security Notes

### Current Security Status:

**✅ Implemented:**
- Password-protected admin access
- Environment variables for secrets
- Row-Level Security (RLS) enabled on tables
- File type validation
- File size limits (10MB)

**⚠️ TODO Before Production:**
1. **Storage Security (CRITICAL):**
   - Make `assets` bucket private
   - Generate signed URLs with 1-hour expiration
   - Prevent public access to uploaded files

2. **Authentication:**
   - Replace single password with individual accounts
   - Add magic links for submitters
   - Implement session expiration (30 days)

3. **Multi-Tenant Isolation:**
   - Add `client_id` filtering to all queries
   - Update RLS policies to enforce per-client access
   - Test that Client A cannot see Client B's data

4. **Rate Limiting:**
   - Prevent abuse of upload endpoint
   - Limit submissions per IP/user

---

## 📊 Success Metrics

**Technical:**
- AI accuracy: 85%+ (measured in Ghost Mode)
- Response time: <5 seconds per asset check
- Uptime: 99%+

**Business:**
- 10-15 clients by end of Year 1
- $120K-180K revenue Year 1
- 20-25 hours/week founder time
- 80%+ profit margin

---

## 🐛 Known Issues & Limitations

### Current Limitations:

1. **File formats:** Only PNG, JPG, GIF, WebP (no PDF, video, PPTX yet)
2. **Storage security:** Bucket is public (files accessible via URL)
3. **Authentication:** Single shared admin password
4. **No submitter accounts:** Anyone can upload
5. **No email notifications:** No automated communication
6. **No submission workflow:** Just pass/fail, no approval process
7. **Single deployment:** All test data in one database

### Known Bugs:

- "Download File" opens in new tab instead of downloading (expected behavior for images)
- Admin session persists indefinitely (no expiration)
- No pagination on submissions (could be slow with 1,000+ records)

---

## 🎯 TODO Before First Pilot

### Must-Do (Security):
- [ ] Make storage bucket private + signed URLs
- [ ] Test all upload/download flows still work
- [ ] Verify submitters cannot access each other's files

### Should-Do (Functionality):
- [ ] Create 3-4 comprehensive guideline examples
- [ ] Test AI accuracy with 20-30 sample assets
- [ ] Refine prompts based on test results
- [ ] Add better error messages
- [ ] Create client onboarding checklist

### Nice-to-Have (Polish):
- [ ] Loading indicators with estimated time
- [ ] Success animations
- [ ] Better mobile responsive design
- [ ] Print-friendly submission reports

---

## 📞 Support & Contact

**Founder:** Sean Higgins  
**GitHub:** https://github.com/thetakingsissue-lang/asset-review-tool  
**Supabase Project:** ai-compliance-checker

---

## 📝 Development Notes

### How to Start New Claude Conversation:
1. Upload this README.md + ai-compliance-checker-system-architecture-v3.md
2. Say: "I'm continuing work on the AI Compliance Checker. Please read the README to understand the current state."
3. Specify what you want to build next

### Before Committing to Git:
- ✅ Make sure `.env` is in `.gitignore`
- ✅ Test `npm run dev` works
- ✅ Check no API keys are in code
- ✅ Update README with new features

### Testing Checklist:
- [ ] Submitter interface loads
- [ ] Admin login works
- [ ] File upload works
- [ ] AI returns results (with reference images if uploaded)
- [ ] Asset Types CRUD works
- [ ] Submissions history shows data
- [ ] Ghost mode toggles correctly
- [ ] Supabase connection shows ✅ in terminal

---

## 📚 Quick Reference Links

**Services:**
- Supabase Dashboard: https://supabase.com
- OpenAI Platform: https://platform.openai.com
- GitHub Repo: https://github.com/thetakingsissue-lang/asset-review-tool
- GitHub Token Settings: https://github.com/settings/tokens

**Documentation:**
- Supabase Docs: https://supabase.com/docs
- React Docs: https://react.dev
- OpenAI Vision API: https://platform.openai.com/docs/guides/vision

---

**Last Updated:** December 18, 2024  
**Version:** 2.0 - Phase 2 Complete (Reference Images Feature Added)  
**Project Status:** Production-Ready MVP (Security hardening needed before pilots)
