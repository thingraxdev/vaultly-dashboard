"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PageLoader from "@/components/PageLoader";

/**
 * User profile page with name edit, password change, and accessible resources list.
 */
export default function PortalProfilePage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [resources, setResources] = useState<Array<{ name: string; expires_at: string | null }>>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const userEmail = data.user?.email || "";
        setEmail(userEmail);
        if (!userEmail) {
          setLoading(false);
          return;
        }

        // Single query with join to get user and grants in one call
        const userRes = await supabase
          .from("users")
          .select(`
            id, 
            name,
            access_grants!inner(
              expires_at,
              is_active,
              tools(name)
            )
          `)
          .eq("email", userEmail)
          .single();

        if (userRes.data) {
          setName(userRes.data.name);
          const grants = (userRes.data as any).access_grants || [];
          setResources(
            grants
              .filter((g: any) => g.is_active)
              .map((g: any) => ({
                name: g.tools?.name || "Unknown",
                expires_at: g.expires_at,
              }))
          );
        }
        setLoading(false);
      } catch {
        // Ignore auth lock race condition errors
        setLoading(false);
      }
    };
    void load();
  }, []);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("users").update({ name }).eq("email", email);
    setMessageType(error ? "error" : "success");
    setMessage(error ? "Failed to save profile" : "Profile updated successfully");
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    setMessageType(error ? "error" : "success");
    setMessage(error ? error.message : "Password updated successfully");
    if (!error) setPassword("");
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="animate-slide-up max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 mt-2">Manage your profile and security settings</p>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-fade-in ${
          messageType === "success" 
            ? "bg-green-50 border border-green-200 text-green-700" 
            : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {messageType === "success" ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
          {message}
        </div>
      )}

      {/* Account Info */}
      <form onSubmit={saveProfile} className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Account Info</h2>
        </div>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
            <input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="input-modern"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input 
              value={email} 
              readOnly 
              className="input-modern bg-gray-50 cursor-not-allowed" 
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>
          <button className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl">
            Save Changes
          </button>
        </div>
      </form>

      {/* Change Password */}
      <form onSubmit={changePassword} className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
        </div>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Enter new password" 
              className="input-modern" 
              required 
            />
          </div>
          <button className="w-full bg-sidebar-dark hover:bg-gray-800 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl">
            Update Password
          </button>
        </div>
      </form>

      {/* Accessible Resources */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Your Resources</h2>
        </div>
        
        {resources.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-gray-500">No active resource access</p>
          </div>
        ) : (
          <div className="space-y-3">
            {resources.map((resource, i) => (
              <div 
                key={`${resource.name}-${i}`} 
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-gray-200">
                    <svg className="w-5 h-5 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-900">{resource.name}</span>
                </div>
                <span className={`badge ${resource.expires_at ? "badge-warning" : "badge-success"}`}>
                  {resource.expires_at 
                    ? `Expires ${new Date(resource.expires_at).toLocaleDateString()}` 
                    : "Active"
                  }
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
