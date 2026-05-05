@echo off
REM Generate secure environment variables for the Cookie Injection system

echo Generating secure credentials...
echo.

REM Generate random hex strings using PowerShell
for /f "delims=" %%A in ('powershell -Command "[System.Security.Cryptography.RNGCryptoServiceProvider]::new().GetBytes(32) | ForEach-Object { $_ .ToString('x2') } | Join-String"') do set EXTENSION_API_KEY=%%A

for /f "delims=" %%B in ('powershell -Command "[System.Security.Cryptography.RNGCryptoServiceProvider]::new().GetBytes(32) | ForEach-Object { $_ .ToString('x2') } | Join-String"') do set COOKIE_ENCRYPTION_KEY=%%B

for /f "delims=" %%C in ('powershell -Command "[System.Security.Cryptography.RNGCryptoServiceProvider]::new().GetBytes(32) | ForEach-Object { $_ .ToString('x2') } | Join-String"') do set NEXTAUTH_SECRET=%%C

echo # Add these to your dashboard\.env.local
echo.
echo EXTENSION_API_KEY=%EXTENSION_API_KEY%
echo COOKIE_ENCRYPTION_KEY=%COOKIE_ENCRYPTION_KEY%
echo NEXTAUTH_SECRET=%NEXTAUTH_SECRET%
echo.
echo # Also configure:
echo NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
echo NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
echo SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
echo OWNER_EMAIL=your@email.com
echo.
echo Keys generated! Copy above to dashboard\.env.local
echo Extension API Key: Keep this secure!
echo Share EXTENSION_API_KEY with extension config.
