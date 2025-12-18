# AI Compliance Checker - TODO & Roadmap

**Last Updated:** December 18, 2024  
**Current Status:** Phase 2 Complete - Production-Ready MVP (with security TODOs)

---

## 🚨 CRITICAL - Before First Pilot (Must Complete)

### 1. Security Hardening (~2 hours)

**Storage Bucket Security (HIGHEST PRIORITY - 30 minutes):**
- [ ] Switch Supabase `assets` bucket from public to private
- [ ] Update `server.js` to generate signed URLs (1-hour expiration)
- [ ] Replace `getPublicUrl()` with `createSignedUrl(filePath, 3600)`
- [ ] Test upload flow still works
- [ ] Test download/preview still works in Submissions tab
- [ ] Verify old public URLs no longer work

**Why this matters:** Sponsors don't want competitors seeing unreleased assets. Professional security = trust = sales.

**Admin Authentication (30 minutes):**
- [ ] Create proper admin login page (not just password check)
- [ ] Consider Supabase Auth for email/password
- [ ] OR keep simple password but add session expiration (30 days)
- [ ] Clear localStorage on logout

**Environment Variables Audit (15 minutes):**
- [ ] Verify `.env` is in `.gitignore`
- [ ] Check no API keys committed to GitHub
- [ ] Create `.env.example` templates for both root and client
- [ ] Document all required environment variables

**Rate Limiting (30 minutes):**
- [ ] Add basic rate limiting to `/api/review` endpoint
- [ ] Limit to 10 submissions per IP per minute
- [ ] Return 429 status if exceeded
- [ ] Log rate limit violations

**Total Time:** ~2 hours  
**Impact:** CRITICAL - Cannot run paid pilots without this

---

## 📝 Phase 3A - Pre-Pilot Polish (4-6 hours)

### 2. UI/UX Improvements

**Submitter Interface (2 hours):**
- [ ] Add submission gating messages:
  - **If PASS:** "Your asset is compliant! Please submit it here: [unique upload link]"
  - **If FAIL:** "Your asset needs revision. Issues: [violations]. Please fix and resubmit. To request human review, click here: [review request link]"
- [ ] Add estimated analysis time ("Usually takes 5-10 seconds")
- [ ] Better loading states with progress indicator
- [ ] Success animation on PASS (subtle, not cheesy)
- [ ] Make "Download File" actually download instead of opening in tab
- [ ] Mobile responsive improvements

**Admin Dashboard (2 hours):**
- [ ] Add pagination to Submissions table (20 per page)
- [ ] Export submissions to CSV
- [ ] Better date range picker (calendar UI)
- [ ] Bulk actions (download multiple files, bulk approve)
- [ ] Asset type search/filter in admin table
- [ ] Quick stats at top (total submissions, pass rate, avg confidence)

**Error Messages (30 minutes):**
- [ ] More specific error messages with suggested fixes
- [ ] "File too large" → "Maximum file size is 10MB. Please compress your image."
- [ ] "Invalid file type" → "Please upload PNG, JPG, GIF, or WebP files only."
- [ ] "Asset type not found" → "This asset type doesn't exist. Please contact your administrator."

**Total Time:** 4-6 hours  
**Impact:** HIGH - Better user experience = fewer support questions

---

### 3. Guidelines & Testing (6-8 hours)

**Create Comprehensive Guidelines (4 hours):**
- [ ] **Logo guidelines:** Detailed rules for logo usage
  - Minimum size, clear space, color variations
  - Approved logo files vs. modified versions
  - Background color requirements
  - File format requirements
- [ ] **Banner guidelines:** Web banner specifications
  - Dimensions, file size limits
  - Text readability rules
  - Call-to-action placement
  - Brand color usage
- [ ] **Social media guidelines:** Platform-specific rules
  - Image dimensions per platform
  - Text overlay limits
  - Hashtag/handle requirements
- [ ] **Print guidelines:** Print-ready specifications
  - Resolution requirements (300 DPI)
  - Bleed and trim marks
  - Color mode (CMYK vs RGB)

**AI Accuracy Testing (2-4 hours):**
- [ ] Gather 30 sample assets (15 compliant, 15 non-compliant)
- [ ] Run all through system, measure accuracy
- [ ] Document false positives and false negatives
- [ ] Refine prompts based on results
- [ ] Target: 85%+ accuracy before pilot
- [ ] Create test suite spreadsheet (asset, expected result, actual result, notes)

**Total Time:** 6-8 hours  
**Impact:** CRITICAL - Cannot pilot without accurate AI

---

### 4. Documentation & Training Materials (2-3 hours)

**Client-Facing Documentation (1.5 hours):**
- [ ] "How to Submit Assets" guide for sponsors (with screenshots)
- [ ] "How to Upload Reference Images" guide for admins
- [ ] "Understanding AI Results" explainer (confidence scores, violations)
- [ ] FAQ document

**Internal Documentation (1 hour):**
- [ ] Client onboarding checklist
- [ ] Guideline ingestion process
- [ ] Expert interview script (60-90 min)
- [ ] Shadow mode validation process
- [ ] Troubleshooting guide

**Video Tutorials (Optional - 30 minutes):**
- [ ] Record 2-minute Loom: "How to submit an asset"
- [ ] Record 3-minute Loom: "Admin dashboard walkthrough"

**Total Time:** 2-3 hours  
**Impact:** MEDIUM - Reduces onboarding time and support burden

---

## 🚀 Phase 3B - Full Platform Features (After First Pilot - 20-30 hours)

### 5. Authentication & User Management

**Magic Link Authentication for Submitters (6-8 hours):**
- [ ] Implement Supabase Auth with magic links
- [ ] Generate unique submission URLs per sponsor
- [ ] Token expiration (7 days default)
- [ ] Store submitter email with submission record
- [ ] "My Submissions" view (submitters can see their history)
- [ ] Optional: OTP fallback if magic link fails

**Individual Admin Accounts (4-6 hours):**
- [ ] Replace single password with email/password accounts
- [ ] Supabase Auth integration
- [ ] Role-based access control (Viewer, Reviewer, Admin)
- [ ] User management page (invite, deactivate users)
- [ ] Session management with 30-day expiration
- [ ] Password reset flow

**Total Time:** 10-14 hours  
**Impact:** HIGH - Professional authentication system

---

### 6. Submission Workflow & Status Management

**Status System (6-8 hours):**
- [ ] Add `status` column to submissions table
- [ ] Status options:
  - `PROCESSING` - AI analyzing
  - `READY_FOR_REVIEW` - AI passed, awaiting human
  - `NEEDS_ATTENTION` - AI flagged or submitter override
  - `APPROVED` - Human approved
  - `REJECTED` - Human rejected (with reason)
  - `REVISION_REQUESTED` - Human wants changes (with feedback)
  - `COMPLETED` - Approved + downloaded
- [ ] Update admin UI to show status
- [ ] Filter submissions by status
- [ ] Status change buttons in detail modal

**Reviewer Feedback Form (4-6 hours):**
- [ ] Feedback form in submission detail modal
- [ ] Feedback categories (dropdown):
  - Logo issue
  - Color issue
  - Text issue
  - Layout issue
  - File quality issue
  - Other
- [ ] Free-form text field for specific feedback
- [ ] Internal notes field (not visible to submitter)
- [ ] AI assessment pre-populates form (reviewer can edit)
- [ ] Save feedback to database

**Resubmission Linking (2-3 hours):**
- [ ] Track revision history (link new submission to original)
- [ ] Show revision count in submissions table
- [ ] "View Previous Versions" button in detail modal
- [ ] Submitter can see their revision history

**Total Time:** 12-17 hours  
**Impact:** HIGH - Enables complete review workflow

---

### 7. Email Notifications

**Email Infrastructure (2-3 hours):**
- [ ] Set up Resend or SendGrid account
- [ ] Create email templates (HTML + plain text):
  - Submission received
  - Submission approved
  - Submission rejected (with feedback)
  - Revision requested (with feedback)
  - Deadline reminder
- [ ] Test email delivery
- [ ] Unsubscribe handling

**Notification Triggers (3-4 hours):**
- [ ] Send email when submission received (to submitter)
- [ ] Send email when submission approved (to submitter)
- [ ] Send email when submission rejected (to submitter with feedback)
- [ ] Send email when submission flagged for human review (to reviewer)
- [ ] Optional: Daily digest to reviewers (pending submissions)

**Total Time:** 5-7 hours  
**Impact:** MEDIUM-HIGH - Professional communication

---

### 8. Multi-Tenant Architecture

**Database Changes (4-6 hours):**
- [ ] Add `clients` table:
  - id, name, domain, settings, created_at
- [ ] Add `client_id` column to all tables:
  - asset_types
  - submissions
  - app_settings
  - (future: users table)
- [ ] Create default client record
- [ ] Migrate existing data to default client
- [ ] Update all queries to filter by `client_id`

**Row-Level Security (4-6 hours):**
- [ ] Update RLS policies to enforce per-client access
- [ ] Test that Client A cannot see Client B's data
- [ ] Test that Client A cannot modify Client B's data
- [ ] Test submissions are properly isolated
- [ ] Test file storage is properly isolated

**Client Management UI (2-3 hours):**
- [ ] Admin "Clients" tab
- [ ] Add/edit/deactivate clients
- [ ] Assign users to clients
- [ ] Client-specific settings

**Total Time:** 10-15 hours  
**Impact:** CRITICAL - Required for multiple paying clients

---

## 🎨 Phase 4 - Advanced Features (After 5+ Clients - 30-50 hours)

### 9. One-Click Learning from AI Mistakes

**Override Tracking (4-6 hours):**
- [ ] "Override AI Decision" button in admin detail modal
- [ ] Modal asks: "What did the AI miss?" with text field
- [ ] Store override reason in database
- [ ] Link override to specific submission
- [ ] Show override count per asset type

**Auto-Update Guidelines (8-10 hours):**
- [ ] When override saved, prompt admin: "Add this to guidelines?"
- [ ] Extract rule from override reason
- [ ] Show preview of updated guidelines
- [ ] Admin approves or edits
- [ ] Auto-append to guidelines field
- [ ] Version control for guidelines (track changes)

**Test Suite (6-8 hours):**
- [ ] Store override decision as test case
- [ ] "Test Suite" tab in admin
- [ ] View all test cases
- [ ] Re-run AI against test suite
- [ ] Show accuracy metrics
- [ ] Flag cases where AI still fails

**Total Time:** 18-24 hours  
**Impact:** VERY HIGH - Continuous AI improvement

---

### 10. PDF & Multi-Format Support

**PDF Guideline Upload (6-8 hours):**
- [ ] Add PDF upload to asset type modal
- [ ] Install `pdf-parse` library
- [ ] Extract text from PDF
- [ ] Pre-populate guidelines field with extracted text
- [ ] Admin reviews and edits extracted text
- [ ] Store cleaned version in database

**PDF Asset Submission (4-6 hours):**
- [ ] Accept PDF uploads from submitters
- [ ] Convert PDF pages to images (use `pdf-lib` or `pdftoppm`)
- [ ] Send each page to AI for analysis
- [ ] Aggregate results (PASS if all pages pass)
- [ ] Show violations by page number

**Video Support (8-10 hours):**
- [ ] Accept MP4, MOV uploads
- [ ] Sample frames every N seconds (e.g., every 5 seconds)
- [ ] Send frames to AI for analysis
- [ ] Detect issues across timeline
- [ ] Show violations with timestamps

**PPTX/DOCX Support (6-8 hours):**
- [ ] Convert presentations to images per slide
- [ ] Analyze each slide
- [ ] Report violations by slide number

**Total Time:** 24-32 hours  
**Impact:** MEDIUM-HIGH - Expands market to more asset types

---

### 11. Submission Gating & Custom Messages

**Dynamic Pass/Fail Messages (4-6 hours):**
- [ ] Add `pass_message` and `fail_message` fields to asset_types table
- [ ] Support variables: `{violations}`, `{confidence}`, `{submitter_name}`
- [ ] UI in asset type modal to customize messages
- [ ] Show custom message on submitter interface after AI check
- [ ] Include dynamic links (upload link, review request link)

**Magic Link Generation (3-4 hours):**
- [ ] Generate unique upload link per submitter
- [ ] Store link in database with expiration
- [ ] Include in PASS message
- [ ] Track which submitters clicked link

**Review Request Flow (3-4 hours):**
- [ ] Generate unique review request link
- [ ] Include in FAIL message
- [ ] Submitter clicks link → creates review request ticket
- [ ] Notify reviewer via email
- [ ] Track review requests in admin

**Total Time:** 10-14 hours  
**Impact:** MEDIUM - Better submitter experience

---

### 12. Analytics & Reporting

**Submission Analytics Dashboard (6-8 hours):**
- [ ] Chart: Submissions over time (line chart)
- [ ] Chart: Pass rate by asset type (bar chart)
- [ ] Chart: Average confidence score trends
- [ ] Chart: Common violations (word cloud or bar chart)
- [ ] Metrics: Total submissions, avg processing time, top submitters

**Export Reports (2-3 hours):**
- [ ] Export submissions to CSV
- [ ] Export analytics summary to PDF
- [ ] Scheduled reports (email weekly summary)

**Total Time:** 8-11 hours  
**Impact:** MEDIUM - Nice-to-have for client reporting

---

### 13. Integrations & API

**Webhook Support (4-6 hours):**
- [ ] Add webhook URL field to client settings
- [ ] Trigger webhooks on events:
  - Submission received
  - Submission approved
  - Submission rejected
- [ ] Payload includes submission data + AI results
- [ ] Retry logic for failed webhooks
- [ ] Webhook logs in admin

**Google Drive Integration (6-8 hours):**
- [ ] OAuth setup for Google Drive
- [ ] "Export to Drive" button in admin
- [ ] Create folder structure in Drive
- [ ] Upload approved assets to Drive
- [ ] Store Drive link in database

**Ziflow Integration (8-10 hours):**
- [ ] API integration with Ziflow
- [ ] When asset passes AI, auto-create Ziflow review
- [ ] Sync status back to our system
- [ ] Show Ziflow review link in admin

**Public API (10-15 hours):**
- [ ] Design REST API endpoints
- [ ] API key authentication
- [ ] Rate limiting per API key
- [ ] Documentation (OpenAPI/Swagger)
- [ ] Example code in Python, JS, curl

**Total Time:** 28-39 hours  
**Impact:** MEDIUM-HIGH - Enterprise feature

---

## 🏢 Enterprise Features (Year 2+)

### 14. White-Label & Custom Domains

- [ ] Custom domain per client (e.g., assets.acme.com)
- [ ] White-label branding (logo, colors, footer)
- [ ] Custom email templates with client branding
- [ ] Subdomain routing (acme.compliancechecker.app)

**Total Time:** 15-20 hours  
**Impact:** HIGH - Premium feature for $50K+ clients

---

### 15. SAML/SSO

- [ ] SAML authentication
- [ ] Okta integration
- [ ] Azure AD integration
- [ ] JumpCloud integration

**Total Time:** 20-30 hours  
**Impact:** HIGH - Required for large enterprises

---

### 16. Visual Violation Highlighting

- [ ] AI annotates image with red boxes/arrows
- [ ] Show annotated image in results
- [ ] Hover over violation → see highlighted area

**Total Time:** 15-20 hours  
**Impact:** MEDIUM - Very cool feature but not essential

---

### 17. Conversational AI Assistant

- [ ] Chatbot on submitter interface
- [ ] Answers questions about guidelines
- [ ] "Why did this fail?" explainer
- [ ] Powered by Claude API

**Total Time:** 20-25 hours  
**Impact:** LOW-MEDIUM - Nice-to-have, not essential

---

## 📊 Priority Matrix

### MUST DO (Before First Pilot):
1. **Security hardening** (2 hours) - ⚠️ BLOCKING
2. **AI accuracy testing** (2-4 hours) - ⚠️ BLOCKING
3. **Comprehensive guidelines** (4 hours) - ⚠️ BLOCKING

### SHOULD DO (Before Pilot):
4. **UI/UX improvements** (4-6 hours)
5. **Documentation** (2-3 hours)

### CAN WAIT (After First Pilot):
6. **Magic link auth** (6-8 hours)
7. **Submission workflow** (12-17 hours)
8. **Email notifications** (5-7 hours)
9. **Multi-tenant architecture** (10-15 hours)

### NICE TO HAVE (After 5+ Clients):
10. **One-click learning** (18-24 hours)
11. **PDF/video support** (24-32 hours)
12. **Analytics dashboard** (8-11 hours)
13. **Integrations** (28-39 hours)

### ENTERPRISE (Year 2+):
14. **White-label** (15-20 hours)
15. **SAML/SSO** (20-30 hours)
16. **Visual highlighting** (15-20 hours)

---

## ⏱️ Time Estimates Summary

| Phase | Hours | When |
|-------|-------|------|
| **Critical (Pre-Pilot)** | 8-11 hours | Before first pilot |
| **Phase 3A (Polish)** | 12-17 hours | Before pilot |
| **Phase 3B (Full Platform)** | 37-53 hours | After pilot |
| **Phase 4 (Advanced)** | 88-125 hours | After 5+ clients |
| **Enterprise** | 50-70 hours | Year 2+ |
| **TOTAL** | **195-276 hours** | |

---

## 🎯 Recommended Next Steps

### This Week (Before Customer Discovery):
1. ✅ **Complete security hardening** (2 hours)
   - Private storage bucket + signed URLs
   - Test everything still works
2. ✅ **Create 3-4 comprehensive guidelines** (4 hours)
   - Logo, Banner, Social, Print
   - Use detailed prompt format you tested
3. ✅ **Run accuracy tests** (2-4 hours)
   - 30 sample assets
   - Document results
   - Refine prompts

**Total: 8-10 hours (1-2 days of focused work)**

### Before First Pilot (After Hot Leads Identified):
4. ✅ **UI polish** (4-6 hours)
   - Submission gating messages
   - Better error messages
   - Loading states
5. ✅ **Documentation** (2-3 hours)
   - Client guides
   - Onboarding checklist

**Total: 6-9 hours (1 day of work)**

### After First Pilot (Once Validated):
6. ✅ **Authentication overhaul** (10-14 hours)
7. ✅ **Submission workflow** (12-17 hours)
8. ✅ **Multi-tenant setup** (10-15 hours)

**Total: 32-46 hours (1 week of focused work)**

---

## 📝 Things NOT on the List (Intentionally)

**Features you mentioned that are already built:**
- ✅ Reference images - DONE (Phase 2)
- ✅ Multiple reference images per asset type - DONE (unlimited upload)
- ✅ Dynamic asset type loading - DONE (Phase 2)

**Features you mentioned that need specification:**
- ⏳ PDF guidelines upload - In list (#10)
- ⏳ Submission gating messages - In list (#11)
- ⏳ Complex guidelines support - Already possible with current text field (no limit)

**Things we're NOT building (by design):**
- ❌ AI model training/fine-tuning (too complex, prompt engineering works)
- ❌ Mobile apps (web-first is fine)
- ❌ Blockchain/crypto anything (stay focused)
- ❌ Real-time collaboration (overkill for this use case)

---

## 💡 Additional Ideas to Consider

**From your architecture docs:**
1. **Auto-approve mode** - AI passes bypass human review entirely
2. **Confidence thresholds** - Auto-escalate low confidence to human
3. **Aging alerts** - Notify reviewers of submissions >48 hours old
4. **Batch operations** - Approve/reject multiple at once
5. **Submission templates** - Pre-fill fields for repeat submitters
6. **A/B testing** - Test different prompts/guidelines
7. **Audit trails** - Track who approved/rejected what and when
8. **Client satisfaction surveys** - Post-submission feedback
9. **Deadline enforcement** - Block submissions after deadline
10. **Reviewer workload balancing** - Distribute submissions evenly

**Would add these in Phase 4-5 based on client demand**

---

## ✅ Quick Win Opportunities

**Easy wins that add value (1-2 hours each):**
- [ ] Add "Copy to Clipboard" button for submission links
- [ ] Show estimated time savings in admin dashboard ("You've saved 47 hours this month!")
- [ ] Add keyboard shortcuts (Escape to close modal, Enter to submit)
- [ ] Dark mode for admin dashboard
- [ ] Confetti animation on high-confidence PASS (fun!)
- [ ] "Undo" button for accidental deletes
- [ ] Auto-save drafts in asset type modal
- [ ] Show file preview before upload (client-side)

---

**Last Updated:** December 18, 2024  
**Next Review:** After first pilot feedback
