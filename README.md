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
- Submitters fix issues before formal submission
- Reviewers only see compliant assets
- **Result:** Eliminate 70%+ of back-and-forth revision cycles

---

## ✅ Current State (Phase 1 Complete, Phase 2 In Progress)

### What's Built & Working:

**Phase 1 (Complete):**
- ✅ Submitter upload interface (drag-and-drop, file browse)
- ✅ Asset type selector (Logo, Banner, Social, Print)
- ✅ AI compliance checking via OpenAI GPT-4o Vision API
- ✅ Pass/fail results with confidence scores and violation lists
- ✅ Admin dashboard shell (login, tabs, routing)
- ✅ Password-protected admin access
- ✅ Supabase database connected
- ✅ `asset_types` table created with test data

**Phase 2 (In Progress):**
- 🚧 Asset Type Management UI (next to build)
- ⏳ Submissions history view
- ⏳ Ghost mode for pilots
- ⏳ UI polish

### What's NOT Built Yet:

- Magic link authentication (Phase 2)
- Reviewer feedback loop (Phase 2)
- Submission status workflow (Phase 2)
- Email notifications (Phase 2)
- Claude API integration (Phase 3)

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
├── .env                          # Environment variables (NOT in git)
├── .env.example                  # Template for .env
├── .gitignore                    # Git ignore rules
├── package.json                  # Node dependencies
├── server.js                     # Express API server (ES modules)
├── guidelines.js                 # OLD: Hardcoded guidelines (being deprecated)
├── review.js                     # OLD: Review logic (being deprecated)
│
├── client/                       # React frontend
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── App.js                # Main router (BrowserRouter, Routes)
│       ├── App.css               # Global styles
│       ├── index.js              # React entry point
│       ├── SubmitterInterface.jsx # Main upload interface (/)
│       └── components/
│           └── Admin/
│               ├── Login.jsx     # Admin login (/admin/login)
│               ├── Dashboard.jsx # Admin main layout (/admin)
│               ├── AssetTypes.jsx # Asset management (placeholder)
│               ├── Submissions.jsx # History view (placeholder)
│               └── Settings.jsx  # Settings (placeholder)
│
├── uploads/                      # Temporary file uploads (auto-created)
└── node_modules/                 # Dependencies (not in git)
```

---

## 🗄 Database Schema (Supabase)

### Current Tables:

**`asset_types`**
```sql
- id (uuid, primary key, default: gen_random_uuid())
- name (text) -- "logo", "banner", "social", "print"
- description (text) -- "Brand logos and marks"
- guidelines (text) -- Full markdown guidelines text
- created_at (timestamptz, default: now())
- updated_at (timestamptz, default: now())
```

**Test data in place:**
- Logo, Banner, Social, Print (4 rows)

### Future Tables (Phase 2):

**`submissions`**
```sql
- id (uuid, primary key)
- asset_type (text)
- file_name (text)
- file_url (text) -- Supabase storage URL
- result (text) -- "pass" or "fail"
- confidence_score (integer) -- 0-100
- violations (jsonb) -- Array of violation strings
- submitted_at (timestamp)
```

---

## 🔧 Environment Variables

**`.env` file contents:**
```env
# OpenAI API Key
OPENAI_API_KEY=sk-proj-...

# Admin Dashboard Password
REACT_APP_ADMIN_PASSWORD=58Rpt253

# Supabase credentials
REACT_APP_SUPABASE_URL=https://ufyavbadxsntzcicluqa.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_URL=https://ufyavbadxsntzcicluqa.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
```

**Note:** The anon key is the same for both React and server variables in this setup.

---

## 🚀 How to Run (From Scratch)

### Prerequisites:
- Node.js 18+ installed
- npm installed
- Supabase account (free tier)
- OpenAI API key

### Setup:
```bash
# 1. Navigate to project
cd ~/Downloads/asset-review-tool-main-3/

# 2. Install dependencies
npm install

# 3. Create .env file (copy from .env.example and fill in values)
cp .env.example .env
# Then edit .env with your actual API keys

# 4. Start development servers (both backend and frontend)
npm run dev
```

**What happens:**
- Backend starts on `http://localhost:3001`
- React frontend starts on `http://localhost:3000`
- Visit `http://localhost:3000` for submitter interface
- Visit `http://localhost:3000/admin` for admin dashboard

### Verify Supabase Connection:

Look for this in terminal after `npm run dev`:
```
🔌 Initializing Supabase connection...
Testing Supabase connection...
✅ Supabase connected successfully!
   Project URL: https://ufyavbadxsntzcicluqa.supabase.co
```

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
- Database table created

### 🚧 Phase 2: Admin Features (IN PROGRESS)
**Next to build:**
1. **Asset Type Management** ⬅️ CURRENT
   - View all asset types in table
   - Add new asset type modal
   - Edit existing asset type
   - Delete asset type
   - Connect to Supabase CRUD operations

2. **Submissions History**
   - Table view of all past submissions
   - Filters (date, asset type, pass/fail)
   - Detail modal with asset preview
   - Download link

3. **Ghost Mode**
   - Toggle in settings
   - AI runs but doesn't show to submitters
   - Admin sees AI + manual review
   - Accuracy tracking

4. **UI Polish**
   - Better hero section
   - Loading states
   - Color-coded violations
   - Success animations

### ⏳ Phase 3: Full Platform (FUTURE)
- Magic link authentication
- Submission status workflow
- Reviewer feedback loop
- Email notifications
- Claude API integration
- Multi-tenant architecture
- Client-specific deployments

---

## 🔑 Key Decisions Made

### Why ES Modules (import/export) in server.js?
- **Decision:** Use `import` instead of `require()`
- **Why:** Modern Node.js standard, better for future features
- **Note:** package.json has `"type": "module"`

### Why OpenAI GPT-4o First (Not Claude)?
- **Decision:** Start with OpenAI for vision analysis
- **Why:** Faster to prototype, well-documented, good vision capabilities
- **Future:** Will add Claude API for reasoning/feedback (Phase 3)

### Why Supabase Over Firebase/MongoDB?
- **Decision:** PostgreSQL via Supabase
- **Why:** 
  - Relational data (asset types, submissions)
  - Built-in auth and storage
  - Great free tier
  - Easy RLS (Row-Level Security) for multi-tenant
  - Familiar SQL

### Why Manual Code Edits Over Claude Code Direct Editing?
- **Decision:** Give code snippets for manual pasting
- **Why:**
  - Claude Code runs in different environment (Linux container)
  - Manual edits give more control
  - Easier for learning/understanding
  - No file syncing headaches

### Why Per-Client Deployments (Not Multi-Tenant SaaS)?
- **Decision:** Each client gets their own instance
- **Why:**
  - Simpler to build
  - Easier to customize per client
  - Lower support burden
  - Clone template approach scales to 25-30 clients fine
- **Note:** May revisit if scaling beyond 50 clients

---

## 🐛 Common Issues & Solutions

### Issue: "Could not find table 'asset_types'"
**Solution:** Table needs to be created in Supabase. See Database Schema section.

### Issue: "Supabase connection error"
**Solution:** Check `.env` file has correct `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`

### Issue: "npm run dev" fails
**Solution:** Make sure you've run `npm install` first in both root and `client/` folders

### Issue: Chrome opens .js files instead of editing
**Solution:** Use `open -a TextEdit filename.js` instead of just `open filename.js`

---

## 📞 Support & Contact

**Founder:** Sean Higgins  
**Email:** [your email]  
**LinkedIn:** [your profile]  
**GitHub:** [your repo if public]

---

## 📝 Development Notes

### How to Start New Claude Conversation:
1. Upload this README.md
2. Say: "I'm continuing work on the AI Compliance Checker. Please read the README to understand the current state."
3. Specify what you want to build next

### Before Committing to Git:
- ✅ Make sure `.env` is in `.gitignore`
- ✅ Test `npm run dev` works
- ✅ Check no API keys are in code

### Testing Checklist:
- [ ] Submitter interface loads at localhost:3000
- [ ] Admin login works at localhost:3000/admin
- [ ] File upload works
- [ ] AI returns pass/fail results
- [ ] Supabase connection shows ✅ in terminal

---

## 🎯 Success Metrics

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

**Last Updated:** December 12, 2024  
**Version:** 1.0 - Phase 1 Complete, Phase 2 Started