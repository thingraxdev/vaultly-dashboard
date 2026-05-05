-- Supabase Migration: Create Cookie Injection Management Schema
-- Run this SQL in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  password_set BOOLEAN DEFAULT false
);

-- Create tools table
CREATE TABLE tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  cookie_domain TEXT NOT NULL,
  cookies_json TEXT NOT NULL, -- Encrypted JSON in production
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  cookie_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  max_concurrent_users INTEGER
);

-- Create access_grants table (junction table)
CREATE TABLE access_grants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, tool_id)
);

-- Create usage_logs table for audit trail
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action TEXT DEFAULT 'launch',
  extension_version TEXT
);

-- Tracks active user sessions per tool for concurrent-session limits
CREATE TABLE active_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX idx_access_grants_user_id ON access_grants(user_id);
CREATE INDEX idx_access_grants_tool_id ON access_grants(tool_id);
CREATE INDEX idx_access_grants_is_active ON access_grants(is_active);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_tool_id ON usage_logs(tool_id);
CREATE INDEX idx_usage_logs_accessed_at ON usage_logs(accessed_at);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_tools_is_active ON tools(is_active);
CREATE INDEX idx_active_sessions_tool_id ON active_sessions(tool_id);
CREATE INDEX idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX idx_active_sessions_open ON active_sessions(session_end);

-- Set up Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only authenticated users can read their own data
-- Note: In production, you'll need to set up proper auth policies
-- For now, allow all authenticated users (restrict further in production)

CREATE POLICY "users_select_self" ON users
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "users_update_self" ON users
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "users_insert" ON users
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "users_delete" ON users
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "tools_select" ON tools
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "access_grants_select" ON access_grants
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "access_grants_insert" ON access_grants
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "access_grants_update" ON access_grants
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "usage_logs_insert" ON usage_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "usage_logs_select" ON usage_logs
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "active_sessions_select" ON active_sessions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "active_sessions_insert" ON active_sessions
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "active_sessions_update" ON active_sessions
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create views for common queries

-- View: User with their assigned tools
CREATE VIEW user_with_tools AS
SELECT 
  u.id,
  u.email,
  u.name,
  u.is_active,
  json_agg(
    json_build_object(
      'tool_id', ag.tool_id,
      'tool_name', t.name,
      'expires_at', ag.expires_at
    )
  ) FILTER (WHERE ag.id IS NOT NULL) as tools
FROM users u
LEFT JOIN access_grants ag ON u.id = ag.user_id AND ag.is_active = true
LEFT JOIN tools t ON ag.tool_id = t.id AND t.is_active = true
GROUP BY u.id, u.email, u.name, u.is_active;

-- View: Tool with user count
CREATE VIEW tool_with_user_count AS
SELECT 
  t.id,
  t.name,
  t.url,
  t.is_active,
  COUNT(DISTINCT u.id) as active_users,
  MAX(ul.accessed_at) as last_accessed
FROM tools t
LEFT JOIN access_grants ag ON t.id = ag.tool_id AND ag.is_active = true
LEFT JOIN users u ON ag.user_id = u.id AND u.is_active = true
LEFT JOIN usage_logs ul ON t.id = ul.tool_id
GROUP BY t.id, t.name, t.url, t.is_active;

-- Seed data (optional - comment out if not needed)
/*
INSERT INTO users (email, name) VALUES
  ('admin@example.com', 'Admin User'),
  ('user1@example.com', 'User One'),
  ('user2@example.com', 'User Two');

INSERT INTO tools (name, url, cookie_domain, cookies_json) VALUES
  ('ChatGPT', 'https://chat.openai.com', '.openai.com', '[]'),
  ('Canva', 'https://canva.com', '.canva.com', '[]');
*/
