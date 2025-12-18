# GitHub Update Guide

**Date:** December 18, 2024  
**Purpose:** Push Phase 2 completion (Reference Images feature) to GitHub

---

## What Changed Today

### Major Features Added:
1. **Dynamic Asset Types** - Frontend loads from database (no hardcoded types)
2. **Reference Images Feature** - Upload visual examples for AI to learn from
3. **Backend AI Integration** - AI compares submissions against reference images
4. **Complete CRUD** - Asset Types management fully functional

### Files Modified:
- `client/src/SubmitterInterface.jsx` - Dynamic asset type loading from Supabase
- `client/src/components/Admin/AssetTypes.jsx` - Reference image upload UI
- `server.js` - Reference image fetching and OpenAI integration
- `README.md` - Updated to reflect Phase 2 completion
- Added: `TODO-ROADMAP.md` - Comprehensive feature roadmap

### Database Changes:
- Added `reference_images` column to `asset_types` table (jsonb)

---

## Step-by-Step: Push to GitHub

### 1. Navigate to Project Directory
```bash
cd ~/Downloads/asset-review-tool-main-3/
```

### 2. Check Git Status
```bash
git status
```

**Expected output:**
```
On branch main
Changes not staged for commit:
  modified:   client/src/SubmitterInterface.jsx
  modified:   client/src/components/Admin/AssetTypes.jsx
  modified:   server.js
  
Untracked files:
  README-updated.md
  TODO-ROADMAP.md
```

### 3. Stage All Changes
```bash
git add .
```

### 4. Commit with Descriptive Message
```bash
git commit -m "Phase 2 Complete: Reference Images Feature

Major additions:
- Dynamic asset type loading from database
- Reference image upload UI in Asset Types admin
- AI visual learning (compares submissions against references)
- Backend integration with OpenAI for multi-image prompts
- Logo recognition capability
- Updated README and added TODO roadmap

Database changes:
- Added reference_images column to asset_types table

Testing:
- Tested with Apple logo recognition (4/4 tests passed)
- Reference images stored in Supabase Storage
- AI successfully uses reference images in analysis"
```

### 5. Push to GitHub
```bash
git push origin main
```

**If prompted for credentials:**
- **Username:** thetakingsissue-lang
- **Password:** Use your Personal Access Token (NOT your GitHub password)

---

## GitHub Personal Access Token

**If you need to create a new token:**

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Name it: "AI Compliance Checker - Dev Machine"
4. Expiration: 90 days
5. Select scopes:
   - ✅ `repo` (full control of private repositories)
6. Click "Generate token"
7. **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)
8. Store in password manager

**Use this token as your password when git asks**

---

## Verify Push Success

### Option A: Check in Terminal
```bash
git log --oneline -3
```

Should show your latest commit at the top.

### Option B: Check on GitHub
1. Go to: https://github.com/thetakingsissue-lang/asset-review-tool
2. Should see "Phase 2 Complete: Reference Images Feature" as latest commit
3. Click on commit to see changes

---

## If You Get Errors

### Error: "Repository not found"
**Fix:** Check remote URL
```bash
git remote -v
```

Should show:
```
origin  https://github.com/thetakingsissue-lang/asset-review-tool.git (fetch)
origin  https://github.com/thetakingsissue-lang/asset-review-tool.git (push)
```

If wrong, update it:
```bash
git remote set-url origin https://github.com/thetakingsissue-lang/asset-review-tool.git
```

### Error: "Authentication failed"
**Fix:** You're using GitHub password instead of Personal Access Token
- Delete saved credentials
- Try push again
- Use token as password

### Error: "Permission denied"
**Fix:** Token doesn't have `repo` scope
- Create new token with `repo` permission
- Use new token

### Error: "Merge conflict"
**Fix:** Someone else pushed changes
```bash
git pull origin main --rebase
# Resolve any conflicts
git push origin main
```

---

## Replace Old README

Once committed, replace the old README:

```bash
# Backup current README (optional)
cp README.md README-old-backup.md

# Replace with updated version
mv README-updated.md README.md

# Commit the update
git add README.md
git commit -m "Update README with Phase 2 documentation"
git push origin main
```

---

## Add TODO Document

```bash
# Move TODO to project root
mv TODO-ROADMAP.md .

# Commit
git add TODO-ROADMAP.md
git commit -m "Add comprehensive TODO and roadmap documentation"
git push origin main
```

---

## Clean Up

After successful push:

```bash
# Remove any backup files from git tracking
git rm README-old-backup.md
git commit -m "Remove old README backup"
git push origin main
```

---

## Future Commits - Best Practices

### Commit Message Format:
```
Short summary (50 chars or less)

Detailed description:
- What changed
- Why it changed
- Any breaking changes
- Testing notes
```

### When to Commit:
- ✅ After completing a feature
- ✅ Before taking a break
- ✅ When something works and you don't want to lose it
- ❌ Don't commit broken code
- ❌ Don't commit API keys or secrets

### What NOT to Commit:
- `.env` files (should be in `.gitignore`)
- `node_modules/` (should be in `.gitignore`)
- `uploads/` temp files (should be in `.gitignore`)
- Personal notes or TODO lists (unless meant to be shared)
- API keys, passwords, tokens

---

## Check .gitignore

Make sure these are in your `.gitignore`:

```bash
cat .gitignore
```

Should include:
```
node_modules/
.env
.env.local
uploads/
.DS_Store
*.log
```

If missing, add them:
```bash
echo "node_modules/" >> .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo "uploads/" >> .gitignore
echo ".DS_Store" >> .gitignore
```

Then commit the updated `.gitignore`:
```bash
git add .gitignore
git commit -m "Update .gitignore"
git push origin main
```

---

## Summary: Quick Commands

**Standard workflow:**
```bash
cd ~/Downloads/asset-review-tool-main-3/
git status
git add .
git commit -m "Your commit message here"
git push origin main
```

**Check if push worked:**
```bash
git log --oneline -3
```

**View changes before committing:**
```bash
git diff
```

**Undo last commit (if you made a mistake):**
```bash
git reset --soft HEAD~1
# Make changes
git add .
git commit -m "Corrected commit message"
```

---

**Last Updated:** December 18, 2024  
**Next Update:** After security hardening (before first pilot)
