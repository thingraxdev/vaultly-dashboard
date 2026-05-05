# Vaultly - Architecture & Components Documentation

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Internet / Browser                                │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ Chrome Browser                                                      ││
│  │  ┌──────────────────────────────────────────────────────────────┐  ││
│  │  │ Extension (Green/Orange Theme)                                │  ││
│  │  │  ┌─────────────────────────────────────────────────────────┐ │  ││
│  │  │  │ Popup UI                     Background Service Worker  │ │  ││
│  │  │  │ - Tool List                  - Cookie Injection         │ │  ││
│  │  │  │ - Launch Buttons             - Session Tracking         │ │  ││
│  │  │  │ - Settings                   - External Launch Handler  │ │  ││
│  │  │  └─────────────────────────────────────────────────────────┘ │  ││
│  │  └──────────────────────────────────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────────────┘│
│            │                     │                      │               │
│            │ HTTP/HTTPS          │ chrome.runtime       │ HTTP/HTTPS    │
│            ↓                     ↓                      ↓               │
│  ┌────────────────────┐  ┌─────────────────┐  ┌────────────────────────┐│
│  │ Tool Websites      │  │ User Portal     │  │ Admin Dashboard        ││
│  │ (openai.com, etc)  │  │ (/portal)       │  │ (/dashboard)           ││
│  │                    │  │                 │  │                        ││
│  │ Receives injected  │  │ - Login         │  │ - Tools Mgmt           ││
│  │ cookies for auto   │  │ - Tool Launcher │  │ - Users Mgmt           ││
│  │ login              │  │ - Profile       │  │ - Access Control       ││
│  └────────────────────┘  │ - Password      │  │ - Logs & Sessions      ││
│                          └─────────────────┘  └────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ TCP Port 5432
                                       ↓
                          ┌────────────────────────────┐
                          │   Supabase Database        │
                          │   (PostgreSQL + RLS)       │
                          │                            │
                          │ - users                    │
                          │ - tools                    │
                          │ - access_grants            │
                          │ - usage_logs               │
                          │ - active_sessions (NEW)    │
                          └────────────────────────────┘
```

## Key Design Decisions

### Session Enforcement
One active session per user per tool prevents credential sharing:
- When launching a tool, existing sessions for that user+tool are ended
- `active_sessions` table tracks all session states
- Extension periodically validates session status

### Dual Launch Support
Users can launch tools from:
1. **Extension Popup**: Direct click from browser toolbar
2. **User Portal**: Web-based dashboard at `/portal`

Both methods use the same session enforcement and logging.

### RLS Bypass for Admin
Admin operations use Supabase Service Role to bypass RLS:
- `/api/admin/users` fetches all users regardless of RLS policies
- Service role key stored only server-side

## Component Breakdown

### 1. Chrome Extension

**Location:** `/extension`

**Theme:** Green (#16a34a) / Orange (#f97316) matching Vaultly branding

#### Manifest (manifest.json)
- Defines extension metadata and permissions
- Manifest V3 compatible
- Permissions: cookies, storage, tabs, scripting
- External messaging enabled for portal launch support

#### Popup (public/popup.html, public/popup.js)
- Main UI users interact with
- Displays list of accessible tools
- Shows tool icons and names
- Launch buttons for each tool
- Refresh button to reload tools
- Settings button to configure

**Data Flow:**
1. User clicks extension icon → Popup loads
2. Popup calls `getStorageData()` to get config
3. Calls `validateUser()` API endpoint
4. Renders tool list
5. User clicks "Launch" → `launchTool()` called
6. Fetches cookies via API
7. Injects cookies via background service worker
8. Opens tool in new tab

#### Background Service Worker (src/background.js)
- Runs in background, always available
- Handles message passing between popup and content scripts
- Implements cookie injection via chrome.cookies API
- Opens new tabs
- Listens for extension install events
- **Handles external launch from portal** via `chrome.runtime.onMessageExternal`

**Key Functions:**
```typescript
injectCookies(cookies, domain) → Promise<{ success, failed[] }>
- Sets each cookie via chrome.cookies.set()
- Handles per-cookie errors gracefully
- Returns success status

handleExternalLaunch(request) → Promise<{ success }>
- Receives launch request from user portal
- Fetches cookies via API
- Injects cookies
- Opens tool in new tab
- Logs access

injectSingleCookie(cookie) → Promise<void>
- Wraps chrome.cookies.set in Promise
- Logs errors
```

#### Setup Page (public/setup.html, public/setup.js)
- Initial configuration page shown on install
- Stores settings in chrome.storage.sync
- Validates connection to dashboard
- Test button to verify configuration

#### Utilities (src/utils.js)
- `validateUser(email, apiKey, dashboardUrl)`
- `getCookiesForTool(email, toolId, apiKey, dashboardUrl)`
- `logAccess(email, toolId, apiKey, dashboardUrl)`
- `showToast(message, type, duration)`
- Storage helpers: `getStorageData()`, `setStorageData()`

### 2. Next.js Dashboard

**Location:** `/dashboard`

**Branding:** Vaultly with lock icon, green (#16a34a) primary, orange (#f97316) accent

#### File Structure
```
/dashboard
├── /app
│   ├── /api                 → API Routes (server-side)
│   │   ├── /admin           → Admin-only routes
│   │   │   └── /users       → RLS bypass user fetch
│   │   ├── /portal          → Portal-specific routes
│   │   │   └── /tools       → User's accessible tools
│   │   ├── /check-session   → Session validation
│   │   ├── /end-session     → Session termination
│   │   ├── /cookies         → Cookie fetch + session start
│   │   └── /log-access      → Access logging
│   ├── /dashboard           → Admin pages
│   │   ├── /tools           → Tool management
│   │   ├── /users           → User management
│   │   ├── /access          → Access control matrix
│   │   └── /logs            → Usage logs viewer
│   ├── /portal              → User portal pages
│   │   ├── /dashboard       → Tool launcher
│   │   ├── /profile         → Profile settings
│   │   ├── /login           → User login
│   │   └── /set-password    → Initial password setup
│   ├── /login               → Admin login page
│   └── layout.tsx           → Root layout
├── /lib
│   ├── supabase.ts          → Supabase client + service role
│   ├── encryption.ts        → AES cookie encryption
│   ├── api-auth.ts          → API key verification
│   └── database.types.ts    → TypeScript types
├── /components
│   ├── AdminSidebar.tsx     → Admin navigation
│   ├── AdminTopbar.tsx      → Admin header with user menu
│   ├── UserSidebar.tsx      → Portal navigation
│   ├── UserTopbar.tsx       → Portal header with greeting
│   ├── PageLoader.tsx       → Animated loading overlay
│   ├── Modal.tsx            → Reusable modal
│   ├── Tooltip.tsx          → Hover tooltips
│   └── Icons.tsx            → SVG icon components
├── middleware.ts            → Route protection
└── /styles                  → Global CSS/Tailwind
```

#### Admin Pages

**Login (`/login`)**
- Email/password authentication via Supabase
- Only owner email can access
- Redirects to dashboard on success
- Session stored in HTTP-only cookies

**Dashboard Overview (`/dashboard`)**
- Stats: Total tools, users, active access, logins
- Quick action cards linking to other pages
- Shows system status at a glance

#### User Portal Pages

**Portal Login (`/portal/login`)**
- User email/password authentication
- Redirects to portal dashboard

**Portal Dashboard (`/portal/dashboard`)**
- Grid of accessible tools with icons
- Launch button for each tool
- Extension installation check
- Search/filter tools

**Profile (`/portal/profile`)**
- View/edit display name
- Change password
- View granted resources

**Set Password (`/portal/set-password`)**
- First-time password setup
- Accessed via invite link

**Tools Management (`/dashboard/tools`)**
- List all tools with active/inactive status
- Form to add new tools
  - Name, URL, domain, cookies JSON, icon URL
  - Validates JSON format
  - Encrypts before storing
- Edit/delete buttons per tool
- Toggle active status

**Users Management (`/dashboard/users`)**
- Table of all users
- Add user form (email + name)
- Delete button
- Shows how many tools each user has

**Access Control (`/dashboard/access`)**
- Matrix view: users (rows) × tools (columns)
- Checkboxes to grant/revoke access
- Date picker for expiry dates
- Bulk grant/revoke buttons per column

#### API Routes

**`GET /api/validate-user`**
- Query: `email`
- Returns: User validity + accessible tools
- Auth: X-API-Key header

**`GET /api/cookies`**
- Query: `email`, `toolId`
- Returns: Cookies + starts new session
- Ends any existing session for user+tool (session enforcement)
- Auth: X-API-Key header

**`POST /api/log-access`**
- Body: `{ email, toolId }`
- Logs access to usage_logs table
- Auth: X-API-Key header

**`GET /api/check-session`**
- Query: `sessionId`
- Validates session is still active
- Returns clearCookies instruction if invalid
- Auth: X-API-Key header

**`POST /api/end-session`**
- Body: `{ sessionId }`
- Marks session as ended
- Auth: X-API-Key header

**`GET /api/admin/users`**
- Returns all users (bypasses RLS using service role)
- Auth: Supabase session (admin only)

**`GET /api/portal/tools`**
- Query: `email`
- Returns tools accessible to specific user
- Auth: Supabase session (user only)

#### Middleware (middleware.ts)
- Protects `/dashboard` routes (admin only)
- Protects `/portal` routes (authenticated users)
- Redirects to appropriate login if not authenticated
- Allows public access to `/login` and `/portal/login`

#### Libraries & Dependencies
- **Supabase**: Auth + Database (with service role for admin)
- **Next.js 14**: React framework + App Router
- **TailwindCSS**: Styling with custom theme
- **CryptoJS**: Cookie encryption
- **Axios**: HTTP requests

### 3. Shared Types & Utils

**Location:** `/shared`

#### Types (types.ts)
All interfaces and types shared between dashboard & extension:
- `Tool`, `User`, `AccessGrant`, `UsageLog`
- `CookieInjectObject`, `ValidateUserResponse`
- `ExtensionStorage`

#### Utils (utils.ts)
Helper functions:
- `isValidEmail()`, `isValidUrl()`
- `extractDomainFromUrl()`, `normalizeCookieDomain()`
- `safeJsonParse()`, `isValidCookie()`
- `formatDate()`, `generateRandomString()`
- `delay()`

### 4. Database (Supabase)

**Tables:**

**users**
- `id` (UUID, PK)
- `email` (TEXT, UNIQUE)
- `name` (TEXT)
- `created_at` (TIMESTAMP)
- `is_active` (BOOLEAN)

**tools**
- `id` (UUID, PK)
- `name`, `url`, `cookie_domain` (TEXT)
- `cookies_json` (TEXT, encrypted)
- `icon_url` (TEXT)
- `created_at` (TIMESTAMP)
- `is_active` (BOOLEAN)

**access_grants**
- `id` (UUID, PK)
- `user_id` (FK → users)
- `tool_id` (FK → tools)
- `granted_at`, `expires_at` (TIMESTAMP)
- `is_active` (BOOLEAN)

**usage_logs**
- `id` (UUID, PK)
- `user_id` (FK → users)
- `tool_id` (FK → tools)
- `accessed_at` (TIMESTAMP)
- `action` (TEXT, e.g., "launch")

**active_sessions** (NEW - Session Enforcement)
- `id` (UUID, PK)
- `user_id` (FK → users)
- `tool_id` (FK → tools)
- `session_start` (TIMESTAMP)
- `session_end` (TIMESTAMP, NULL = active)
- `created_at` (TIMESTAMP)

*Note: Only one active session (session_end IS NULL) allowed per user+tool combination.*

**Indexes:**
- `access_grants` on user_id, tool_id, is_active
- `usage_logs` on user_id, tool_id, accessed_at
- `active_sessions` on user_id, tool_id, session_end
- `users` on email
- `tools` on is_active

**Views:**
- `user_with_tools`: User + their assigned tools
- `tool_with_user_count`: Tool + active user count + last access

## Data Flow

### Complete User Journey

```
1. SETUP (Day 1)
   ┌─────────────────────────────────────────┐
   │ Owner: Adds tool (ChatGPT w/ cookies)  │
   │ Owner: Creates user (user@example.com) │
   │ Owner: Grants user access to ChatGPT   │
   └─────────────────────────────────────────┘
           ↓ (Data stored in database)
   
2. EXTENSION SETUP
   ┌─────────────────────────────────────────┐
   │ User: Installs extension                │
   │ User: Configures (email, dashboard URL)│
   │ User: Enters API key from admin        │
   │ Extension: Tests connection ✓           │
   └─────────────────────────────────────────┘
           ↓ (Config stored locally in extension)

3. TOOL LAUNCH (Extension)
   ┌─────────────────────────────────────────┐
   │ User: Clicks extension icon             │
   │ Popup: Loads & calls /api/validate-user│
   │ API: Returns allowed tools              │
   │ Popup: Renders tool list                │
   │ User: Clicks "Launch" on ChatGPT       │
   │ Popup: Calls /api/cookies               │
   │ API: Ends any existing session          │
   │ API: Creates new session in DB          │
   │ API: Returns cookies + session ID       │
   │ Background: Injects cookies             │
   │ Extension: Opens ChatGPT URL in new tab│
   │ Popup: Calls /api/log-access            │
   │ API: Records in usage_logs              │
   │ User: Sees ChatGPT page - logged in! ✓ │
   └─────────────────────────────────────────┘

4. TOOL LAUNCH (Portal)
   ┌─────────────────────────────────────────┐
   │ User: Logs into Portal (/portal/login) │
   │ Portal: Loads dashboard                 │
   │ Portal: Calls /api/portal/tools        │
   │ API: Returns user's accessible tools    │
   │ User: Clicks "Launch" on tool          │
   │ Portal: Sends message to extension      │
   │ Extension: Receives via onMessageExt   │
   │ Extension: Calls /api/cookies          │
   │ API: Ends existing session, creates new│
   │ Extension: Injects cookies             │
   │ Extension: Opens tool, logs access     │
   │ User: Sees tool page - logged in! ✓    │
   └─────────────────────────────────────────┘
```

## Security Layers

```
LAYER 1: Authentication
└─ Admin Dashboard: Supabase Auth (owner email only)
└─ User Portal: Supabase Auth (any registered user)
└─ Extension API: X-API-Key in header

LAYER 2: Authorization
└─ Dashboard: RLS policies + service role bypass for admin
└─ Portal: RLS policies for user data
└─ API: X-API-Key validation middleware
└─ Data: access_grants table enforces permissions

LAYER 3: Session Enforcement
└─ One active session per user per tool
└─ New launch ends existing session
└─ Extension checks session validity periodically
└─ Admin can revoke sessions instantly

LAYER 4: Data Protection
└─ Encryption: Cookies encrypted at rest
└─ HTTPS: All communication encrypted in transit
└─ Secrets: Environment variables, never hardcoded

LAYER 5: Audit Trail
└─ usage_logs: Track who accessed what when
└─ active_sessions: Track session lifecycle
└─ Timestamps: Created_at, accessed_at for all records
```

## Performance Considerations

### Caching

**Extension Popup:**
- Tools cached briefly to avoid re-fetching immediately
- Refresh button forces re-fetch
- Last validation timestamp stored

**Dashboard:**
- User tools loaded once on mount
- No persistent cache (real-time is important for access control)

### Database Queries

**N+1 Query Prevention:**
```typescript
// ✓ Good - fetch tools in one query
SELECT ag.user_id, ag.tool_id, t.* 
FROM access_grants ag
JOIN tools t ON ag.tool_id = t.id

// ✗ Bad - would fetch each tool separately
FOR each access_grant:
  SELECT * FROM tools WHERE id = tool_id
```

### API Response Time

Optimize by:
- Indexing frequently queried columns
- Using views for complex queries
- Limiting select columns to needed ones
- Pagination for large result sets

## Scalability

### Current Limitations

- Single owner model (adjust for multi-tenant if needed)
- Extension per browser/user (not shared profiles)
- No load balancing (single server)

### Scaling Recommendations

1. **Multi-tenant**: Add organization concept
2. **API Gateway**: Rate limiting, caching
3. **Database**: Read replicas for dashboard queries
4. **Cache Layer**: Redis for validation results
5. **CDN**: Static assets (icons)
6. **Async Jobs**: Background tasks for log cleanup

## Testing Strategy

### Unit Tests
- Utility functions (shared/utils.ts)
- Cookie validation logic
- Email/URL validation

### Integration Tests
- API endpoints with mock Supabase
- Database queries
- Encryption/decryption

### E2E Tests
- Full user journey: login → add tool → grant access → extension launch
- Error scenarios
- Edge cases (expired access, invalid cookies)

### Extension Testing
- Manual popup testing
- Cookie injection verification
- Background service worker message passing

---

**For more details, see README.md and SECURITY.md**
