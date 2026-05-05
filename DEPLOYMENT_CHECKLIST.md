# Vaultly Deployment Checklist

Use this checklist before deploying to production.

## Pre-Deployment

- [ ] All environment variables configured correctly
- [ ] Database migration SQL applied to Supabase (including active_sessions table)
- [ ] Owner email set in OWNER_EMAIL env var
- [ ] API Key generated and stored securely
- [ ] Encryption key generated and saved
- [ ] Extension ID configured in NEXT_PUBLIC_EXTENSION_ID
- [ ] HTTPS enabled on all endpoints
- [ ] CORS properly configured if needed

## Dashboard Deployment

- [ ] Environment variables set in Vercel/platform secrets
- [ ] `npm run build` succeeds without errors
- [ ] Type checking passes (`npm run type-check`)
- [ ] No console errors or warnings
- [ ] All admin pages load and function correctly
- [ ] All portal pages load and function correctly
- [ ] API routes tested with curl/Postman
- [ ] Database connection confirmed
- [ ] Service role key configured for admin operations

## Extension Deployment

- [ ] manifest.json has correct permissions
- [ ] Background service worker accessible
- [ ] External messaging enabled for portal launch
- [ ] Popup loads without console errors
- [ ] Setup page works correctly
- [ ] Popup displays accessible tools
- [ ] Cookie injection works (test with real cookies)
- [ ] Portal launch works (external message handling)
- [ ] Icon files present (icon-16.png, icon-48.png, icon-128.png)
- [ ] Green/orange theme matches Vaultly branding

## User Portal

- [ ] Portal login page accessible at /portal/login
- [ ] User authentication works
- [ ] Portal dashboard shows user's tools
- [ ] Launch from portal triggers extension
- [ ] Profile page allows name/password update
- [ ] Set password page works for new users

## Security

- [ ] API key not exposed in logs or code
- [ ] Cookies encrypted before database storage
- [ ] RLS policies enabled in Supabase
- [ ] Service role key only used server-side
- [ ] HTTPS enforced (Strict-Transport-Security)
- [ ] X-Frame-Options set to DENY
- [ ] X-API-Key validation on all API endpoints

## Session Management

- [ ] active_sessions table created in database
- [ ] Session enforcement working (one session per user per tool)
- [ ] New launch ends existing sessions
- [ ] /api/check-session endpoint responds correctly
- [ ] /api/end-session endpoint works
- [ ] Admin can view and revoke sessions

## Testing

- [ ] Admin can login to dashboard
- [ ] Tools can be added/edited/deleted
- [ ] Users can be created (with invite email)
- [ ] Access grants work (matrix view)
- [ ] Extension can validate user
- [ ] Cookies can be fetched via API
- [ ] Access logging works (both extension and portal)
- [ ] Expiry dates work correctly
- [ ] API key validation rejects invalid keys
- [ ] Portal launch logs access correctly

## UI/UX

- [ ] PageLoader displays during API calls
- [ ] Tooltips show on hover
- [ ] Modals open/close correctly
- [ ] Vaultly branding consistent (lock icon, colors)
- [ ] Responsive on mobile devices

## Monitoring

- [ ] Error logging configured
- [ ] Database backups enabled (Supabase)
- [ ] Usage logs being recorded
- [ ] Active sessions tracked

## Post-Deployment

- [ ] Test full admin flow: add tool → add user → grant access
- [ ] Test full user flow: login → view tools → launch
- [ ] Test session enforcement: launch from two devices
- [ ] Monitor logs for errors
- [ ] Share correct extension settings with users
- [ ] Create documentation for users

---

**Before deploying, run:**
```bash
# Dashboard
cd dashboard
npm run build
npm run type-check
npm run lint

# Manual testing of API endpoints
curl -H "X-API-Key: $EXTENSION_API_KEY" \
  "https://yourdomain.com/api/validate-user?email=test@example.com"

# Test session check
curl -H "X-API-Key: $EXTENSION_API_KEY" \
  "https://yourdomain.com/api/check-session?sessionId=uuid"
```
