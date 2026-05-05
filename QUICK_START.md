# Vaultly Quick Start Guide

## 5-Minute Setup

### Prerequisites
- Node.js 18+
- Chrome browser
- Supabase account (free)

### Step 1: Dashboard (2 mins)

```bash
cd dashboard
npm install

# Create .env.local with your Supabase keys
# (Copy from Supabase > Settings > API)
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OWNER_EMAIL=your@email.com
EXTENSION_API_KEY=$(openssl rand -hex 32)
COOKIE_ENCRYPTION_KEY=$(openssl rand -hex 32)
NEXTAUTH_SECRET=$(openssl rand -hex 32)
NEXT_PUBLIC_EXTENSION_ID=your_extension_id
EOF

npm run dev
```

→ Dashboard runs at http://localhost:3000

### Step 2: Database (1 min)

1. Go to Supabase SQL Editor
2. Copy `migrations.sql` content
3. Paste and run in SQL editor
4. Tables created ✓ (including active_sessions for session enforcement)

### Step 3: Extension (2 mins)

1. Open `chrome://extensions/` in Chrome
2. Enable Developer mode (top right)
3. Click "Load unpacked"
4. Select `/extension` folder
5. **Copy the Extension ID** (shown under the extension name)
6. Add it to `.env.local` as `NEXT_PUBLIC_EXTENSION_ID`
7. Click extension icon → Settings
8. Configure:
   - Email: your@email.com
   - URL: http://localhost:3000
   - API Key: (from dashboard .env.local)
9. Click "Test Connection" → Success ✓

### You're Done!

**Admin Workflow:**
- Go to Dashboard → Tools → Add a tool
- Add a user (they'll receive invite email)
- Grant access in Access Control page

**User Workflow (Extension):**
- Install extension, configure with credentials
- Click extension icon → See accessible tools
- Click Launch → Logged in automatically!

**User Workflow (Portal):**
- Go to /portal/login
- Login with email/password
- See tool dashboard
- Click Launch → Extension injects cookies

### Session Enforcement
- Only one active session per user per tool
- Launching from another device ends the previous session
- Prevents credential sharing across devices

---

For detailed setup, see [README.md](./README.md)
