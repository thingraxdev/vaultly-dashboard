# Vaultly Troubleshooting Guide

## Common Issues & Solutions

### Extension Issues

#### Extension Icon Not Showing

**Problem**: Extension doesn't appear in Chrome toolbar

**Causes & Solutions**:
1. **Extension not loaded**
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Check if extension is listed
   - If not, click "Load unpacked" and select `/extension` folder

2. **Chrome blocked it**
   - Extensions sometimes disabled after browser crash
   - Go to `chrome://extensions/`
   - Toggle the extension on

3. **Wrong folder selected**
   - Must select folder with `manifest.json`
   - Should be the `/extension` directory, not `/extension/src`

#### "Not Configured" Message

**Problem**: Extension shows setup prompt instead of tools

**Causes & Solutions**:
1. **Extension not configured**
   - Click extension icon → Settings
   - Fill in: Email, Dashboard URL, API Key
   - Click "Save Configuration"
   - Test connection should show ✓

2. **Invalid dashboard URL**
   - Remove trailing slash: `https://example.com` not `https://example.com/`
   - Check URL is accessible (open in browser)
   - Should see login page

3. **Wrong API key**
   - Compare with `EXTENSION_API_KEY` in dashboard `.env.local`
   - Generate new key if lost: `openssl rand -hex 32`

#### "Connection Failed" on Test

**Problem**: Extension can't reach dashboard API

**Causes & Solutions**:
1. **Dashboard not running**
   - Run `npm run dev` in `/dashboard` folder
   - Should see "Local: http://localhost:3000"
   - If remote, verify it's deployed and running

2. **Firewall/Network**
   - Check if dashboard URL is accessible from browser
   - Try opening dashboard URL directly in Chrome
   - If local, check localhost:3000 is accessible

3. **Incorrect credentials**
   - Dashboard URL must match where dashboard is hosted
   - API Key must match `EXTENSION_API_KEY` from `.env.local`
   - Email must exist in Users table

4. **CORS Issue**
   - If deployed, ensure domain is whitelisted
   - Check browser console (F12) for CORS errors
   - May need to configure CORS headers

#### No Tools Showing

**Problem**: Extension shows "No Tools Available"

**Causes & Solutions**:
1. **User not created in database**
   - Dashboard → Users page
   - Check if user email exists
   - Create user if missing

2. **No access grants**
   - Dashboard → Access Control
   - Check if user has any checkboxes checked
   - Click checkbox to grant access to a tool

3. **Tool is inactive**
   - Dashboard → Tools
   - Check if tool shows "Active" status
   - Toggle to make active

4. **Access expired**
   - Dashboard → Access Control
   - Check if expiry date has passed
   - Update expiry date to future date

#### Cookies Not Injecting

**Problem**: Launch tool but site shows "not logged in"

**Causes & Solutions**:
1. **Wrong cookie domain**
   - When adding tool, check cookie domain format
   - Should start with dot: `.openai.com` not `openai.com`
   - Domain must match website domain

2. **Cookies are invalid**
   - Cookies may have expired in original session
   - Go to actual website, log in fresh
   - Export new cookies
   - Dashboard → Tools → Edit tool
   - Paste new cookies JSON

3. **Website blocking injected cookies**
   - Some sites have strict cookie validation
   - Try with different sameSite value: "Lax", "Strict", "None"
   - Check website's security requirements

4. **httpOnly flag issue**
   - If `httpOnly: true`, browser can't see/use cookie
   - Some APIs require `httpOnly: false` for JavaScript access
   - Toggle this flag when exporting

5. **Secure flag mismatch**
   - If `secure: true`, only works on HTTPS
   - For localhost testing, set `secure: false`
   - For production, always set `secure: true`

#### "Failed to Launch Tool" Error

**Problem**: Error message when clicking Launch

**Solutions**:
1. **Check browser console** (F12 → Console)
   - Read the error message
   - Screenshot and search online for the specific error

2. **API key invalid**
   - Error: 401 Unauthorized
   - Solution: Update API key in extension settings

3. **User not found**
   - Error: 403 Access denied
   - Solution: Ensure user email matches registered email

4. **Tool not found**
   - Error: 404 Tool not found
   - Solution: Tool was deleted, ask admin to re-add

5. **Access expired**
   - Error: 403 Access expired
   - Solution: Ask admin to renew expiry date

---

### Dashboard Issues

#### Can't Login

**Problem**: "Invalid credentials" or stuck on login page

**Causes & Solutions**:
1. **Email not registered with Supabase**
   - Must create user in Supabase Auth first
   - Go to Supabase Dashboard → Auth → Users
   - Click "Add user"
   - Email must match `OWNER_EMAIL`

2. **Wrong password**
   - Reset via Supabase Dashboard
   - Auth → Users → Change user's password

3. **Browser cookies disabled**
   - Session stored in HTTP-only cookies
   - Enable cookies in Chrome: Settings → Privacy → Cookies
   - Try incognito mode to test

4. **Supabase not configured**
   - Check `.env.local` has Supabase URLs/keys
   - Keys must be from your Supabase project
   - Copy from Supabase → Settings → API

#### "Cannot GET /dashboard"

**Problem**: 404 error when accessing dashboard pages

**Causes & Solutions**:
1. **Not logged in**
   - Go to `/login` first
   - Authenticate before accessing `/dashboard`
   - Should be redirected automatically

2. **Wrong URL**
   - Check URL format: `http://localhost:3000/dashboard`
   - Not `http://localhost:3000/dashboard/`
   - Trailing slash may cause issues

3. **Dashboard not running**
   - Run `npm run dev` in `/dashboard` folder
   - Port 3000 must be available
   - Kill any processes on port 3000

4. **Build errors**
   - If deployed: check build logs
   - Locally: check terminal for TypeScript errors
   - Run `npm run type-check`

#### Tools Won't Save

**Problem**: "Error saving tool" or tool not added

**Causes & Solutions**:
1. **Invalid JSON in cookies field**
   - Must be valid JSON array
   - Use JSON validator: jsonlint.com
   - Check syntax: `[{...}]` with proper quotes

2. **Missing required fields**
   - name, url, cookie_domain, cookies_json all required
   - Check all fields are filled
   - Error message should show which field is wrong

3. **Cookie JSON missing required cookie fields**
   - Each cookie object mismatch need: name, value, domain
   - Check JSON structure:
     ```json
     [
       {
         "name": "session",
         "value": "abc123",
         "domain": ".example.com"
       }
     ]
     ```

4. **URL format wrong**
   - Must start with `http://` or `https://`
   - Full URL required: `https://chat.openai.com`
   - Not just domain

#### Users Not Showing in List

**Problem**: No users appear on Users page

**Causes & Solutions**:
1. **No users created yet**
   - Go to Users → + Add User
   - Fill in email and name
   - Click "Add User"

2. **Database not set up**
   - Run `migrations.sql` in Supabase
   - Check tables exist: `users`, `tools`, etc.
   - Verify data is there: SELECT * FROM users;

3. **Supabase connection broken**
   - Check `.env.local` has correct SUPABASE_URL
   - Verify SUPABASE_SERVICE_ROLE_KEY is set
   - Check browser console for errors

#### Access Control Matrix Empty

**Problem**: No rows or columns in matrix

**Causes & Solutions**:
1. **No users created**
   - Go to Users page and create users first

2. **No tools created**
   - Go to Tools page and create tools first

3. **Inactive tools/users**
   - Must have is_active = true
   - Toggle tools and users to active
   - Check in database: SELECT * FROM users WHERE is_active = true;

---

### API Issues

#### API Returns 401 Unauthorized

**Problem**: "Invalid API key"

**Causes & Solutions**:
1. **API key wrong**
   ```bash
   # Check your API key
   grep EXTENSION_API_KEY dashboard/.env.local
   
   # Make sure extension has same key
   # Settings → API Key field
   ```

2. **Header not sent**
   - Extension must send `X-API-Key` header
   - Check background.js is sending header
   - Test with curl:
   ```bash
   curl -H "X-API-Key: your-key" \
     http://localhost:3000/api/validate-user?email=test@example.com
   ```

3. **Key not in environment**
   - Check `.env.local` has EXTENSION_API_KEY set
   - Restart `npm run dev` after changing env vars
   - Environment variables don't hot-reload

#### API Returns 403 Forbidden

**Problem**: "User not found" or "Access denied"

**Causes & Solutions**:
1. **User doesn't exist**
   - Check email in Users table
   - Email must match exactly (case-sensitive usually)
   - Create user if not present

2. **No access grant**
   - User exists but has no tools
   - Dashboard → Access Control
   - Check checkbox to grant access to tool

3. **Access expired**
   - Check expiry date in access_grants table
   - SELECT * FROM access_grants WHERE user_id = 'xxx';
   - Update expires_at to future date

#### API Returns 404 Not Found

**Problem**: "Tool not found"

**Causes & Solutions**:
1. **Tool doesn't exist**
   - Tool may have been deleted
   - Dashboard → Tools
   - Re-add the tool if needed

2. **Tool is inactive**
   - Dashboard → Tools
   - Toggle tool to "Active"

#### API Returns 500 Internal Server Error

**Problem**: Server error when calling API

**Causes & Solutions**:
1. **Check server logs**
   - Terminal running `npm run dev` should show error
   - Screenshot error and search for solution

2. **Database connection**
   - Can't connect to Supabase
   - Check NEXT_PUBLIC_SUPABASE_URL and keys are correct
   - Verify database is running

3. **Type error in API route**
   - Run `npm run type-check`
   - Fix any TypeScript errors
   - Restart dev server

---

### Database Issues

#### "Table does not exist"

**Problem**: Database error when saving data

**Causes & Solutions**:
1. **Migration SQL not run**
   - Go to Supabase SQL Editor
   - Copy entire migrations.sql
   - Run it to create tables
   - Verify tables exist: `\dt` in SQL

2. **Wrong database selected**
   - Verify you're in correct Supabase project
   - Check project URL matches `.env.local`

3. **Table deleted**
   - Someone may have deleted table
   - Re-run migrations.sql to recreate

#### Database Locked

**Problem**: "Cannot update" or "database is locked"

**Causes & Solutions**:
1. **Browser too many open connections**
   - Close other dashboard tabs
   - Refresh page

2. **Long-running queries**
   - Wait a moment for operation to complete
   - Check Supabase logs for slow queries

3. **Reload extension cache**
   - Go to `chrome://extensions/`
   - Click reload button on extension

#### Row Level Security (RLS) Error

**Problem**: "row level security violation" in logs

**Causes & Solutions**:
1. **Not authenticated**
   - Must be logged in to dashboard
   - Log in with owner email

2. **RLS policies too restrictive**
   - Verify RLS policies were created with migration
   - Check: select * from auth.users;
   - May need to adjust policies in production

---

### General Debugging

#### Enable Debug Logging

**Extension:**
```javascript
// In popup.js, set debug mode
const DEBUG = true;

if (DEBUG) {
  console.log('Loading tools...', tools);
  console.log('API response:', result);
}
```

**Dashboard:**
```typescript
// In API routes
console.log('Request email:', email);
console.log('User ID:', user?.id);
```

#### Check Browser Console

1. **Chrome DevTools** (F12)
2. **Console tab**
3. Red errors or yellow warnings
4. Click to see full error message
5. Note request/response if API call

#### Test API Manually

```bash
# Validate user
curl -H "X-API-Key: your-key" \
  "http://localhost:3000/api/validate-user?email=user@example.com"

# Get cookies
curl -H "X-API-Key: your-key" \
  "http://localhost:3000/api/cookies?email=user@example.com&toolId=tool-uuid"

# Log access
curl -X POST \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","toolId":"tool-uuid"}' \
  "http://localhost:3000/api/log-access"
```

#### Database Inspection

```sql
-- Check users
SELECT * FROM users;

-- Check tools
SELECT * FROM tools;

-- Check access grants
SELECT ag.*, u.email, t.name FROM access_grants ag
  JOIN users u ON ag.user_id = u.id
  JOIN tools t ON ag.tool_id = t.id;

-- Check usage logs
SELECT ul.*, u.email, t.name FROM usage_logs ul
  JOIN users u ON ul.user_id = u.id
  JOIN tools t ON ul.tool_id = t.id
  ORDER BY ul.accessed_at DESC LIMIT 10;

-- Check active sessions
SELECT s.*, u.email, t.name FROM active_sessions s
  JOIN users u ON s.user_id = u.id
  JOIN tools t ON s.tool_id = t.id
  WHERE s.session_end IS NULL
  ORDER BY s.session_start DESC;
```

---

### User Portal Issues

#### Portal Login Not Working

**Problem**: Can't login to user portal at /portal/login

**Causes & Solutions**:
1. **User not created**
   - Admin must create user in Dashboard → Users
   - User email must exist in users table

2. **User not active**
   - Check is_active = true in users table
   - Admin can toggle in Users page

3. **Wrong password**
   - User may need to reset password
   - Admin can send invite link for new password

4. **Auth race condition error**
   - Error: "lock was released because another request stole it"
   - This is handled internally - refresh the page
   - If persistent, check for duplicate auth calls

#### Portal Shows No Tools

**Problem**: User logged in but no tools displayed

**Causes & Solutions**:
1. **No access grants**
   - Admin needs to grant access in Access Control page
   - Check access_grants table has entries for user

2. **Tools inactive**
   - Tools must have is_active = true
   - Admin can toggle in Tools page

3. **Extension not installed**
   - Portal launch requires extension
   - Install extension and configure with same email

#### Portal Launch Fails

**Problem**: Clicking Launch in portal doesn't work

**Causes & Solutions**:
1. **Extension not installed**
   - Must have Chrome extension installed
   - Configure with same email as portal login

2. **Extension ID mismatch**
   - Check NEXT_PUBLIC_EXTENSION_ID in .env.local
   - Must match extension ID from chrome://extensions/

3. **Extension not configured**
   - Open extension popup → Settings
   - Configure dashboard URL and API key

4. **External messaging blocked**
   - Check manifest.json has externally_connectable
   - Extension must allow messages from dashboard origin

---

### Session Issues

#### "Session Ended" Error

**Problem**: Tool says session ended while using

**Causes & Solutions**:
1. **Launched from another device**
   - Vaultly enforces one session per user per tool
   - Launching again ends previous session
   - This is expected behavior - prevents sharing

2. **Admin revoked access**
   - Check with admin if access was revoked
   - Dashboard → Access Control shows grants

3. **Access expired**
   - Check expiry date in Access Control
   - Ask admin to extend if needed

4. **User deactivated**
   - Admin may have deactivated user
   - Check is_active in users table

#### Session Not Ending

**Problem**: Old session still active after new launch

**Causes & Solutions**:
1. **Check active_sessions table**
   ```sql
   SELECT * FROM active_sessions
   WHERE user_id = 'xxx' AND tool_id = 'yyy'
   AND session_end IS NULL;
   ```

2. **Multiple active sessions**
   - Should only be one with session_end IS NULL
   - Manually end via:
   ```sql
   UPDATE active_sessions
   SET session_end = NOW()
   WHERE user_id = 'xxx' AND tool_id = 'yyy'
   AND session_end IS NULL;
   ```

3. **Cookie API not ending sessions**
   - Check /api/cookies route logic
   - Should end existing before creating new

---

## Still Having Issues?

1. **Check documentation**: README.md, ARCHITECTURE.md, SECURITY.md
2. **Search GitHub issues**: Similar problems might be solved
3. **Read error messages carefully**: Often they tell you exactly what's wrong
4. **Check recent changes**: Did you change env vars? Update code?
5. **Try fresh setup**: Clear cache, restart services, reload extension

---

**Remember**: Most issues have simple solutions! 💡
