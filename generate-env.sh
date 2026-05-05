#!/bin/bash

# Generate secure environment variables for the Cookie Injection system

echo "🔐 Generating secure credentials..."
echo

EXTENSION_API_KEY=$(openssl rand -hex 32)
COOKIE_ENCRYPTION_KEY=$(openssl rand -hex 32)
NEXTAUTH_SECRET=$(openssl rand -hex 32)

echo "# Add these to your dashboard/.env.local"
echo
echo "EXTENSION_API_KEY=$EXTENSION_API_KEY"
echo "COOKIE_ENCRYPTION_KEY=$COOKIE_ENCRYPTION_KEY"
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET"
echo
echo "# Also configure:"
echo "NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
echo "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
echo "OWNER_EMAIL=your@email.com"
echo
echo "✓ Keys generated! Copy above to dashboard/.env.local"
echo "✓ Extension API Key: Keep this secure!"
echo "✓ Share EXTENSION_API_KEY with extension config."
