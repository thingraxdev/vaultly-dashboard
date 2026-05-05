# Vaultly Security & Best Practices Guide

## 🔐 Security Overview

Vaultly handles sensitive information (session cookies) that grant access to shared accounts. This guide covers all security measures implemented.

## Authentication & Authorization

### Admin Dashboard

- **Email-based authentication** via Supabase Auth
- Only the email specified in `OWNER_EMAIL` can access the admin dashboard
- Session tokens stored securely in HTTP-only cookies
- All `/dashboard` routes protected by middleware

### User Portal

- **Email-based authentication** via Supabase Auth
- Any registered user in the `users` table can access the portal
- Users must be marked as `is_active: true`
- Session tokens stored securely in HTTP-only cookies
- All `/portal` routes protected by middleware

### API Authentication

- **API Key-based authentication** via `X-API-Key` header
- Generate strong, random 32-byte keys using:
  ```bash
  openssl rand -hex 32
  ```
- API key never exposed in client-side code
- Validate every request server-side

### Extension Authentication

- Receives user email and dashboard URL from owner
- Stores API key locally in `chrome.storage.sync`
- Private to each browser profile
- Sent with every API request in `X-API-Key` header

## Session Enforcement

### One Session Per User Per Tool

Vaultly enforces **one active session per user per tool** to prevent credential sharing:

```typescript
// When user launches a tool:
// 1. End any existing session for this user+tool
await supabase
  .from("active_sessions")
  .update({ session_end: new Date().toISOString() })
  .eq("user_id", userId)
  .eq("tool_id", toolId)
  .is("session_end", null);

// 2. Create new session
await supabase
  .from("active_sessions")
  .insert({ user_id: userId, tool_id: toolId });
```

### Session Validation

The extension periodically calls `/api/check-session` to validate:
- Session has not been ended (by admin or new launch)
- User is still active
- Tool is still active
- Access grant is still valid

If invalid, extension receives `clearCookies: true` and removes injected cookies.

### Admin Revocation

Admins can:
- End individual sessions from the Logs page
- Revoke access grants (which implicitly ends sessions)
- Deactivate users or tools (ends all related sessions)

## Cookie Security

### Storage

- **Encrypted** in database before storage using AES encryption
- Encryption key stored in `COOKIE_ENCRYPTION_KEY` environment variable
- Never log raw cookie values

```typescript
// Encrypt before storing
const encrypted = encryptData(cookieData);
await supabase.from('tools').update({ cookies_json: encrypted });

// Decrypt when needed
const decrypted = decryptData(encrypted, []);
```

### Injection

- Cookies injected only to their specified domain
- `domain` field must match and be normalized
- Domain validation prevents cross-domain injection

```javascript
// Good
{ domain: ".openai.com", ... }  // ✓ Can access openai.com subdomains

// Bad - won't work
{ domain: "openai.com", ... }   // ✗ Missing leading dot
{ domain: ".gmail.com", ... }   // ✗ Wrong domain
```

### Expiration

- Set reasonable cookie expiration dates
- Monitor and update expired cookies
- Implement automated warnings for near-expiry cookies

```typescript
// Cookie with 1-year expiration
{
  expirationDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
}
```

## Network Security

### HTTPS

**Always use HTTPS in production:**

```typescript
// ✓ Good
const dashboardUrl = "https://yourdomain.com"

// ✗ Bad for production
const dashboardUrl = "http://localhost:3000"
```

### HSTS (HTTP Strict Transport Security)

Add to your server configuration:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### CORS

Configure restrictively in Next.js:
```typescript
// Only allow requests from extension
const allowedOrigins = [
  'chrome-extension://your-extension-id'
];
```

### Headers

Set secure headers on all responses:
```typescript
// In Next.js API route
res.setHeader('X-Frame-Options', 'DENY');
res.setHeader('X-Content-Type-Options', 'nosniff');
res.setHeader('X-XSS-Protection', '1; mode=block');
res.setHeader('Referrer-Policy', 'no-referrer');
res.setHeader('Permissions-Policy', 'geolocation=(),microphone=(),camera=()');
```

## Rate Limiting

Prevent brute force and DoS attacks:

```typescript
// Implement rate limiting on API routes
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## Logging & Monitoring

### What to Log

- ✓ Successful access grants
- ✓ Failed authentication attempts
- ✓ Access tool launches
- ✓ Configuration changes
- ✓ API errors

### What NOT to Log

- ✗ Raw cookie values
- ✗ API keys or secrets
- ✗ User passwords
- ✗ Full request/response bodies (if containing cookies)

```typescript
// Good
console.log(`Tool launched by ${email} for ${toolId}`);

// Bad
console.log(`Tool launched: ${JSON.stringify(cookieData)}`);
```

### Audit Trail

Enable usage logging:
```sql
-- View access history
SELECT u.email, t.name, ul.accessed_at 
FROM usage_logs ul
JOIN users u ON u.id = ul.user_id
JOIN tools t ON t.id = ul.tool_id
ORDER BY ul.accessed_at DESC;
```

## Access Control

### RLS (Row Level Security)

Supabase RLS prevents unauthorized database access:

```sql
-- Only authenticated users can access their own data
CREATE POLICY "users_select_self" ON users
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
```

### Principle of Least Privilege

- Users get access only to tools they need
- Grant temporary access with expiration dates
- Regularly review and revoke unnecessary access
- Owner is the single source of truth for permissions

### Expiring Access

Set automatic expiration for sensitive access:

```typescript
// Grant access for 30 days
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 30);

await supabase.from('access_grants').insert({
  user_id,
  tool_id,
  expires_at: expiresAt.toISOString(),
  is_active: true
});
```

## Secrets Management

### Environment Variables

Never commit secrets:

```bash
# .gitignore
.env
.env.local
.env.*.local
```

### Production Secrets

Use platform-specific secret management:

**Vercel:**
- Settings → Environment Variables
- Set SUPABASE_SERVICE_ROLE_KEY as secret
- Never expose in NEXT_PUBLIC_* variables

**Docker/Kubernetes:**
```bash
docker run -e NEXT_PUBLIC_SUPABASE_URL=... \
           -e SUPABASE_SERVICE_ROLE_KEY=... \
           myimage
```

**AWS Secrets Manager / Azure Key Vault:**
Integrate with your deployment pipeline

### Key Rotation

Implement periodic key rotation:

1. Generate new API key
2. Update in dashboard `.env`
3. Deploy
4. Share new key with users
5. Deprecate old key

## Browser Security

### Content Security Policy (CSP)

Add to Next.js headers:

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://your-supabase.supabase.co"
  }
];
```

### Extension Security

- Permissions: request minimum necessary
- Host permissions: consider restricting domain list
- Don't inject scripts into untrusted domains
- Validate all data from background scripts

## Code Security

### Input Validation

Always validate and sanitize:

```typescript
// ✓ Good
if (!isValidEmail(email)) {
  return { error: 'Invalid email' };
}

// ✗ Bad
const result = await db.query(
  `SELECT * FROM users WHERE email = '${email}'` // SQL injection!
);
```

### SQL Injection Prevention

Supabase Postgres prevents SQL injection with parameterized queries:

```typescript
// ✓ Good
const { data } = await supabase
  .from('users')
  .select()
  .eq('email', email); // Parameter is escaped

// ✗ Bad
const result = await db.from('users')
  .select()
  .filter(`email=${email}`); // Dangerous!
```

### XSS Prevention

Never use `dangerouslySetInnerHTML`:

```typescript
// ✓ Good
<div>{escapeHtml(userInput)}</div>

// ✗ Bad
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

## Regular Maintenance

### Weekly

- [ ] Review usage logs for anomalies
- [ ] Check error logs

### Monthly

- [ ] Update dependencies
- [ ] Review access grants, revoke if unnecessary
- [ ] Check database backups are working

### Quarterly

- [ ] Security audit
- [ ] Penetration testing (if applicable)
- [ ] Update encryption keys
- [ ] Review and update security policies

## Incident Response

### Cookie Compromise

If a cookie is compromised:

1. **Immediately** remove the tool from dashboard (toggle inactive)
2. Log in to the actual service and revoke the session
3. Update the cookies with fresh ones
4. Notify all users who had access
5. Review access logs for misuse

### API Key Compromise

If API key is exposed:

1. Generate new API key
2. Update in all extension configurations
3. Invalidate old key (if possible)
4. Rotate all user cookies as precaution
5. Review logs for unauthorized access

### Database Breach

1. Enable Supabase database backup
2. Rotate all credentials
3. Force re-authentication for all users
4. Implement enhanced monitoring
5. Consider encryption key rotation

## Compliance

### GDPR

- [ ] User data can be exported
- [ ] User data can be deleted (right to be forgotten)
- [ ] Privacy policy explains data usage
- [ ] Consent obtained for data processing

### Data Retention

- Implement data retention policies
- Delete old usage logs after 90 days (configurable)
- Clean up inactive users periodically

```sql
-- Delete old logs (keep 90 days)
DELETE FROM usage_logs 
WHERE accessed_at < NOW() - INTERVAL '90 days';
```

## Security Checklist

Before production deployment:

- [ ] All API keys and secrets set as environment variables
- [ ] HTTPS enabled on all endpoints
- [ ] RLS policies configured in Supabase
- [ ] Rate limiting implemented
- [ ] Audit logging enabled
- [ ] CORS configured restrictively
- [ ] Security headers set
- [ ] Dependencies updated (`npm audit`)
- [ ] No hardcoded secrets in code
- [ ] Error messages don't leak information

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/basic-security)
- [Chrome Extension Security](https://developer.chrome.com/docs/extensions/mv3/security/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)

---

**Remember: Security is not a one-time effort; it's an ongoing process. Stay vigilant! 🔐**
