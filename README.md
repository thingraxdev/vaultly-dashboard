# Vaultly - Secure Cookie Injection Management System

A complete solution for shared account access management with automatic cookie injection via a Next.js 14 admin dashboard, user portal, and Chrome Manifest V3 extension.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
  - [Dashboard Setup](#dashboard-setup)
  - [Extension Setup](#extension-setup)
  - [Database Setup](#database-setup)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [API Routes](#api-routes)
- [Security](#security)
- [Session Management](#session-management)
- [How to Export Cookies](#how-to-export-cookies)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Development](#development)

## 🏗️ Architecture Overview

This system consists of four main components:

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Dashboard (/dashboard)              │
│  - Manage tools and their session cookies                   │
│  - Manage user accounts and access permissions              │
│  - View usage logs and active sessions                      │
│  - Monitor and revoke access in real-time                   │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP API
                     ↓
        ┌────────────────────────────────────┐
        │   API Routes:                      │
        │   /api/validate-user               │
        │   /api/cookies (session enforced)  │
        │   /api/check-session               │
        │   /api/end-session                 │
        │   /api/admin/users                 │
        │   /api/portal/tools                │
        └────────────────────────────────────┘
                     ↑
        ┌────────────┴────────────┐
        │                         │
┌───────┴───────────┐   ┌────────┴───────────────────────────┐
│   User Portal     │   │    Chrome Extension                │
│   (/portal)       │   │    (/extension)                    │
│ - Tool dashboard  │   │ - Popup UI with tool list          │
│ - Profile mgmt    │   │ - Cookie injection                 │
│ - Web-based       │   │ - Session tracking                 │
│   tool launch     │   │ - External launch support          │
└───────────────────┘   └────────────────────────────────────┘
```

### Key Features

- **Vaultly Branding**: Consistent lock icon and green/orange theme
- **Session Enforcement**: One active session per user per tool (prevents sharing)
- **Dual Launch**: Users can launch from extension popup OR user portal
- **Real-time Revocation**: End sessions instantly from admin dashboard
- **Usage Logging**: All access logged from both extension and portal

## 📁 Project Structure

```
/
├── /dashboard              # Next.js 14 Dashboard App
│   ├── /app                # App Router pages and layouts
│   │   ├── /api            # API routes
│   │   │   ├── /admin      # Admin-only routes (RLS bypass)
│   │   │   │   └── /users  # Fetch all users
│   │   │   ├── /portal     # Portal routes
│   │   │   │   └── /tools  # User's accessible tools
│   │   │   ├── /check-session  # Session validation
│   │   │   ├── /end-session    # Session termination
│   │   │   ├── /cookies        # Cookie retrieval + session start
│   │   │   └── /log-access     # Access logging
│   │   ├── /dashboard      # Admin dashboard pages
│   │   │   ├── /tools      # Tool management (CRUD)
│   │   │   ├── /users      # User management
│   │   │   ├── /access     # Access control matrix
│   │   │   └── /logs       # Usage logs viewer
│   │   ├── /portal         # User portal pages
│   │   │   ├── /dashboard  # Tool launcher
│   │   │   ├── /profile    # Profile settings
│   │   │   ├── /login      # User login
│   │   │   └── /set-password # Initial password setup
│   │   └── /login          # Admin login page
│   ├── /lib                # Server utilities
│   │   ├── supabase.ts     # Supabase client + service role
│   │   ├── encryption.ts   # AES cookie encryption
│   │   ├── api-auth.ts     # API key verification
│   │   └── database.types.ts # TypeScript types
│   ├── /components         # React components
│   │   ├── AdminSidebar.tsx    # Admin navigation (Vaultly branded)
│   │   ├── AdminTopbar.tsx     # Admin header with user menu
│   │   ├── UserSidebar.tsx     # Portal navigation
│   │   ├── UserTopbar.tsx      # Portal header with greeting
│   │   ├── PageLoader.tsx      # Animated loading overlay
│   │   ├── Modal.tsx           # Reusable modal component
│   │   ├── Tooltip.tsx         # Hover tooltips
│   │   └── Icons.tsx           # SVG icon components
│   ├── /styles             # Global CSS and Tailwind
│   ├── middleware.ts       # Route protection
│   ├── tailwind.config.js  # Custom theme (primary/accent colors)
│   └── package.json        # Dependencies
│
├── /extension              # Chrome MV3 Extension
│   ├── /src
│   │   ├── background.js   # Service worker + external launch handler
│   │   ├── utils.js        # API utilities
│   │   └── types.ts        # TypeScript types
│   ├── /public
│   │   ├── popup.html/js   # Main popup UI
│   │   └── setup.html/js   # Configuration page
│   ├── /styles
│   │   └── popup.css       # Green/orange theme
│   ├── manifest.json       # Manifest V3 config
│   └── package.json
│
├── /shared                 # Shared types and utilities
│   ├── types.ts            # Shared interfaces
│   ├── utils.ts            # Common helpers
│   └── package.json
│
├── migrations.sql          # Database schema + active_sessions table
└── README.md
```

## 📦 Prerequisites

### Required Software
- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager
- **Chrome** or Chromium-based browser
- **Supabase** account (free tier available at https://supabase.com)

### Accounts Needed
- Supabase account with a new project
- Vercel account (for dashboard deployment, optional but recommended)

## 🚀 Setup & Installation

### Dashboard Setup

#### 1. Initialize Dashboard

```bash
cd dashboard
npm install
```

#### 2. Configure Environment Variables

Create `.env.local` file in the dashboard directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Owner Configuration
OWNER_EMAIL=owner@example.com

# Extension API Security
EXTENSION_API_KEY=generate-a-random-32-character-string-here

# Encryption Key (for storing cookies)
COOKIE_ENCRYPTION_KEY=generate-a-random-32-byte-key-here

# NextAuth Secret
NEXTAUTH_SECRET=generate-a-random-secret-here
```

**How to generate secure keys:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output into your `.env.local` file for `EXTENSION_API_KEY` and `COOKIE_ENCRYPTION_KEY`.

#### 3. Get Supabase Credentials

1. Create a new project at https://supabase.com
2. Go to **Settings** → **API**
3. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service Role Key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

#### 4. Run Dashboard Locally

```bash
npm run dev
```

Dashboard will be available at `http://localhost:3000`

### Database Setup

#### 1. Run Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `migrations.sql`
5. Paste into the SQL editor
6. Click **Run**

This will create:
- `users` table
- `tools` table
- `access_grants` table (access control)
- `usage_logs` table (audit trail)
- Proper indexes and RLS policies

#### 2. Verify Tables

In Supabase SQL Editor, run:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;
```

You should see:
- access_grants
- tools
- usage_logs
- users

### Extension Setup

#### 1. Prepare Extension Files

The extension is ready in `/extension` directory. No build step needed for Manifest V3.

#### 2. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Navigate to the `/extension` folder and select it
5. Extension should appear in your extensions list

#### 3. Configure Extension

1. Click the extension icon in Chrome toolbar
2. You'll see a setup prompt
3. Fill in:
   - **Your Email**: Email registered in the dashboard
   - **Dashboard URL**: Base URL of your dashboard (e.g., `http://localhost:3000`)
   - **API Key**: The `EXTENSION_API_KEY` from your dashboard `.env.local`
4. Click **Save Configuration**
5. Click **Test Connection** to verify settings

## ⚙️ Configuration

### Owner Email

In `dashboard/.env.local`, set `OWNER_EMAIL` to your email address. Only this email can access the dashboard after authentication.

### API Key Generation

The extension communicates with the dashboard API using the `X-API-Key` header. Generate a strong key:

```bash
openssl rand -hex 32
# or with Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Cookie Encryption

Cookies are stored encrypted in the database. To disable encryption (for development):

In `dashboard/app/api/cookies/route.ts`, comment out the decryption line:
```typescript
// cookies = decryptData(tool.cookies_json, [])
cookies = JSON.parse(tool.cookies_json) as CookieInjectObject[]
```

## 📖 Usage Guide

### Dashboard Owner Workflow

#### 1. Add Tools

1. Go to **Tools** page
2. Click **+ Add Tool**
3. Fill in:
   - **Tool Name**: e.g., "ChatGPT"
   - **URL**: The tool's website URL
   - **Cookie Domain**: Where to inject cookies (e.g., `.openai.com`)
   - **Cookies JSON**: Paste exported cookies (see below)
   - **Icon URL** (optional): Tool logo URL
4. Click **Add Tool**

#### 2. Create Users

1. Go to **Users** page
2. Click **+ Add User**
3. Enter user email and name
4. Click **Add User**

#### 3. Grant Access

1. Go to **Access Control** page
2. You'll see a matrix: users (rows) × tools (columns)
3. Check boxes to grant access
4. Set optional expiry dates
5. Use **Bulk Grant/Revoke** buttons for efficiency

### User Extension Workflow

1. **Initial Setup**:
   - Install extension in Chrome
   - Click extension icon → Settings → Configure with dashboard URL, email, and API key

2. **Launch Tool**:
   - Click extension icon
   - See list of accessible tools
   - Click **Launch** on any tool
   - Cookies are automatically injected
   - Tool opens in new tab
   - You're logged in! ✓

3. **Refresh Tools**:
   - Click **Refresh** button to reload tool list
   - Useful after admin grants new access

### User Portal Workflow

Users can also access tools via the web-based portal:

1. **Login**:
   - Navigate to `/portal/login`
   - Enter email and password
   - First-time users set password via invite link

2. **Launch from Portal**:
   - Go to Portal Dashboard
   - See all accessible tools with icons
   - Click **Launch** on any tool
   - Extension receives message and injects cookies
   - Tool opens in new tab

3. **Profile Management**:
   - Update display name
   - Change password
   - View granted resources

**Note**: Portal launch requires the Chrome extension to be installed and configured.

## 🔌 API Routes

All extension requests must include `X-API-Key` header.

### GET /api/validate-user

Validates user and returns accessible tools.

**Request:**
```bash
curl -H "X-API-Key: your-api-key" \
  "http://localhost:3000/api/validate-user?email=user@example.com"
```

**Response (200):**
```json
{
  "valid": true,
  "allowedTools": [
    {
      "id": "uuid",
      "name": "ChatGPT",
      "url": "https://chat.openai.com",
      "icon_url": "https://...",
      "cookie_domain": ".openai.com",
      "is_active": true
    }
  ],
  "email": "user@example.com"
}
```

### GET /api/cookies

Fetches cookies for a specific tool (if user has access).

**Request:**
```bash
curl -H "X-API-Key: your-api-key" \
  "http://localhost:3000/api/cookies?email=user@example.com&toolId=tool-uuid"
```

**Response (200):**
```json
{
  "cookies": [
    {
      "name": "session_id",
      "value": "abc123...",
      "domain": ".openai.com",
      "path": "/",
      "secure": true,
      "httpOnly": true,
      "sameSite": "Lax",
      "expirationDate": 1735689600
    }
  ],
  "toolId": "tool-uuid",
  "toolUrl": "https://chat.openai.com"
}
```

### POST /api/log-access

Logs tool access for audit trail.

**Request:**
```bash
curl -X POST \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "toolId": "tool-uuid"}' \
  "http://localhost:3000/api/log-access"
```

**Response (200):**
```json
{
  "success": true
}
```

## 🔐 Security

### Best Practices

1. **API Key**
   - Generate a strong, random key
   - Store securely in extension storage (not in code)
   - Rotate periodically
   - Don't commit to version control

2. **Cookie Storage**
   - Cookies are encrypted before storing in database
   - Use `COOKIE_ENCRYPTION_KEY` environment variable
   - Never store raw cookies in public places

3. **Own email in environment**
   - Set `OWNER_EMAIL` to restrict dashboard access
   - Only this email can authenticate

4. **Row Level Security (RLS)**
   - Supabase RLS policies are enabled
   - Only authenticated users can access data
   - Enhance further in production

5. **HTTPS in Production**
   - Always use HTTPS for dashboard and extension communication
   - Cookies should have `Secure` flag

### Security Headers

Add to your deployment environment:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## 🔄 Session Management

### Session Enforcement

Vaultly enforces **one active session per user per tool**. This prevents credential sharing across multiple devices:

- When a user launches a tool, any existing session for that user+tool is automatically ended
- The extension periodically checks if sessions are still valid
- Sessions can be revoked instantly from the admin dashboard

### How It Works

1. **Session Start** (`/api/cookies`):
   - When cookies are requested, existing sessions for user+tool are ended
   - New session is created in `active_sessions` table
   - Session ID returned to extension for tracking

2. **Session Validation** (`/api/check-session`):
   - Extension periodically calls this endpoint
   - Validates session is still active, user is active, tool is active
   - Returns clear cookies instruction if session is invalid

3. **Session End** (`/api/end-session`):
   - Called when user logs out or admin revokes
   - Updates session_end timestamp
   - Extension clears cookies on next check

### Database Table: `active_sessions`

```sql
CREATE TABLE active_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  tool_id UUID REFERENCES tools(id),
  session_start TIMESTAMP DEFAULT NOW(),
  session_end TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Admin Controls

From the admin dashboard, you can:
- View all active sessions in the Logs page
- End individual sessions by clicking the end button
- Bulk revoke access (which ends all related sessions)

## 🍪 How to Export Cookies

### Using Chrome DevTools

1. Open the tool website (e.g., ChatGPT)
2. Open **Chrome DevTools** (F12 or ⌘+Option+I)
3. Go to **Application** tab
4. Click **Cookies** → select the website domain
5. Select all cookies (Ctrl+A / Cmd+A)
6. Right-click → **Copy as cURL**
7. Paste in a text editor
8. Extract the cookie names/values to JSON format

### Using EditThisCookie Extension

1. Install **EditThisCookie** Chrome extension
2. Visit the tool website and log in
3. Click EditThisCookie icon
4. Click **Export** button
5. Copy the exported JSON
6. Paste into dashboard cookie field

### Manual JSON Format

Cookies must be valid JSON array:

```json
[
  {
    "name": "session_id",
    "value": "your-session-value",
    "domain": ".openai.com",
    "path": "/",
    "secure": true,
    "httpOnly": true,
    "sameSite": "Lax",
    "expirationDate": 1735689600
  },
  {
    "name": "other_cookie",
    "value": "value",
    "domain": ".openai.com",
    "path": "/"
  }
]
```

**Cookie Fields:**
- `name` ✓ required
- `value` ✓ required
- `domain` ✓ required
- `path` optional (default: "/")
- `secure` optional (default: true)
- `httpOnly` optional
- `sameSite` optional ("Strict", "Lax", "None")
- `expirationDate` optional (Unix timestamp in seconds)

## 🚢 Deployment

### Deploy Dashboard to Vercel

#### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

#### 2. Connect to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Select `dashboard` folder as root
4. Add environment variables from `.env.local`
5. Deploy!

Your dashboard is now live at `https://your-project.vercel.app`

#### 3. Update Extension Configuration

In the extension, go to Settings and update Dashboard URL to your Vercel domain.

### Deploy to Other Platforms

**AWS/Azure/DigitalOcean:**
```bash
cd dashboard
npm run build
npm start
```

The build creates a `.next` folder. Deploy this folder to your platform.

**Docker Deployment:**

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t cookie-dashboard .
docker run -e NEXT_PUBLIC_SUPABASE_URL=... -p 3000:3000 cookie-dashboard
```

## 📝 Updating Cookies

When user session cookies expire, update them in the dashboard:

1. User must log back into the tool to get fresh cookies
2. Export cookies (using method above)
3. Go to **Tools** page → Edit the tool
4. Paste new cookies JSON
5. Save
6. Users' next access will use new cookies

## 🐛 Troubleshooting

### Extension Can't Validate User

**Problem**: "Connection failed or user not found"

**Solutions**:
1. Check EXTENSION_API_KEY is correct in both `.env.local` and extension settings
2. Verify dashboard URL is reachable and has trailing slash removed
3. Ensure user email exists in Users table
4. Check browser console (F12) for error messages

### Cookies Not Injecting

**Problem**: Cookies set but website shows "not logged in"

**Solutions**:
1. Verify cookie domain matches website (e.g., `.openai.com` for openai.com)
2. Check cookie `path` matches website requirements
3. Some sites require `httpOnly: false`
4. Check expiration date is in future (Unix timestamp in seconds)
5. Browser console may show cookie rejection reasons

### API Returns 403 Forbidden

**Problem**: API returns "Access denied" or "User not found"

**Solutions**:
1. Verify user was added to Users table
2. Check access_grants table has entry for user and tool
3. Verify grant is not expired
4. Check user's `is_active` is `true` in Users table

### Dashboard Won't Load

**Problem**: "Cannot GET /dashboard" or authentication errors

**Solutions**:
1. Make sure you're logged in (login page at `/login`)
2. Clear browser cookies if stuck on login
3. Check SUPABASE_SERVICE_ROLE_KEY is set correctly
4. Verify Supabase tables were created with migration SQL

## 📦 Development

### Development Server

```bash
# Dashboard
cd dashboard
npm run dev
# Runs on http://localhost:3000

# Extension
# Load unpacked from /extension folder
# Changes require manual reload in chrome://extensions/
```

### Building for Production

```bash
# Dashboard
cd dashboard
npm run build

# Extension (no build needed)
# Just copy /extension folder as is
```

### Type Checking

```bash
cd dashboard
npm run type-check

cd shared
npm run build
```

### Code Structure

- **TypeScript** used throughout for type safety
- **JSDoc comments** on all functions
- **Shared types** in `/shared` directory
- **API authentication** via X-API-Key header
- **Encryption** for sensitive data

### Next Steps for Production

1. ✅ Implement Supabase Auth (currently basic auth)
2. ✅ Add comprehensive error handling
3. ✅ Implement audit logging for all admin actions
4. ✅ Add rate limiting to API endpoints
5. ✅ Set up automated backups for Supabase
6. ✅ Implement certificate pinning in extension (optional)
7. ✅ Add usage analytics dashboard
8. ✅ Implement webhook for expiring access grants

## 📄 License

This project is provided as-is for internal use.

## 🤝 Support

For issues or questions:
1. Check Troubleshooting section
2. Review browser console (F12) for errors
3. Check Supabase SQL logs for database errors
4. Verify all environment variables are set correctly

---

**Happy cookie injecting! 🍪**
