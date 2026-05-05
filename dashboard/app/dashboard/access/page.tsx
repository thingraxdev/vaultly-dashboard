"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Tool } from "@/shared/types";
import Modal from "@/components/Modal";
import Tooltip from "@/components/Tooltip";
import { CheckCircleIcon, XCircleIcon } from "@/components/Icons";
import PageLoader from "@/components/PageLoader";

/**
 * Access control page
 * Matrix view for grant/revoke access to tools
 */
export default function AccessPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [access, setAccess] = useState<Record<string, Record<string, boolean>>>({});
  const [expiryDates, setExpiryDates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");

  // Modal state
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [pendingBulk, setPendingBulk] = useState<{ toolId: string; action: "grant" | "revoke"; toolName: string } | null>(null);

  useEffect(() => {
    Promise.all([fetchUsers(), fetchTools(), fetchAccess()]);
  }, []);

  /**
   * Fetch all users
   */
  const fetchUsers = async () => {
    try {
      // Use API route with service role to bypass RLS
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const { users: data } = await response.json();
      // Filter to only active users for access control
      setUsers((data || []).filter((u: User) => u.is_active));
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  /**
   * Fetch all tools
   */
  const fetchTools = async () => {
    try {
      const { data, error } = await supabase.from("tools").select("*").eq("is_active", true);
      if (error) throw error;
      setTools(data || []);
    } catch (err) {
      console.error("Failed to load tools:", err);
    }
  };

  /**
   * Fetch all access grants and populate access matrix
   */
  const fetchAccess = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("access_grants").select("*").eq("is_active", true);

      if (error) throw error;

      const accessMatrix: Record<string, Record<string, boolean>> = {};
      const expiries: Record<string, string> = {};

      (data || []).forEach((grant) => {
        if (!accessMatrix[grant.user_id]) {
          accessMatrix[grant.user_id] = {};
        }
        accessMatrix[grant.user_id][grant.tool_id] = true;

        if (grant.expires_at) {
          expiries[`${grant.user_id}-${grant.tool_id}`] = grant.expires_at;
        }
      });

      setAccess(accessMatrix);
      setExpiryDates(expiries);
    } catch (err) {
      console.error("Failed to load access grants:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle access grant for user/tool
   */
  const handleToggleAccess = async (userId: string, toolId: string) => {
    const hasAccess = access[userId]?.[toolId] || false;

    try {
      if (hasAccess) {
        // Revoke access
        const { error } = await supabase
          .from("access_grants")
          .update({ is_active: false })
          .eq("user_id", userId)
          .eq("tool_id", toolId);

        if (error) throw error;

        // End any active sessions for this user/tool
        await supabase
          .from("active_sessions")
          .update({ session_end: new Date().toISOString() })
          .eq("user_id", userId)
          .eq("tool_id", toolId)
          .is("session_end", null);
      } else {
        // Grant access (upsert to handle re-granting after revoke)
        const { error } = await supabase.from("access_grants").upsert(
          {
            user_id: userId,
            tool_id: toolId,
            is_active: true,
            expires_at: null,
          },
          { onConflict: "user_id,tool_id" }
        );

        if (error) throw error;
      }

      setSuccess(hasAccess ? "Access revoked" : "Access granted");
      await fetchAccess();
    } catch (err) {
      console.error("Failed to toggle access:", err);
    }
  };

  /**
   * Set expiry date for access grant
   */
  const handleSetExpiry = async (userId: string, toolId: string, expiryDate: string) => {
    try {
      const { error } = await supabase
        .from("access_grants")
        .update({ expires_at: expiryDate || null })
        .eq("user_id", userId)
        .eq("tool_id", toolId);

      if (error) throw error;
      setSuccess("Expiry date updated");
      await fetchAccess();
    } catch (err) {
      console.error("Failed to update expiry:", err);
    }
  };

  /**
   * Bulk grant access to all users
   */
  const handleBulkGrant = async (toolId: string) => {
    try {
      const grants = users
        .filter((u) => !access[u.id]?.[toolId])
        .map((u) => ({
          user_id: u.id,
          tool_id: toolId,
          is_active: true,
          expires_at: null,
        }));

      if (grants.length > 0) {
        const { error } = await supabase
          .from("access_grants")
          .upsert(grants, { onConflict: "user_id,tool_id" });
        if (error) throw error;
      }

      setSuccess("Access granted to all users");
      await fetchAccess();
    } catch (err) {
      console.error("Bulk grant failed:", err);
    }
  };

  /**
   * Bulk revoke access from all users
   */
  const handleBulkRevoke = async (toolId: string) => {
    try {
      const { error } = await supabase
        .from("access_grants")
        .update({ is_active: false })
        .eq("tool_id", toolId);

      if (error) throw error;

      // End all active sessions for this tool
      await supabase
        .from("active_sessions")
        .update({ session_end: new Date().toISOString() })
        .eq("tool_id", toolId)
        .is("session_end", null);

      setSuccess("Access revoked from all users");
      await fetchAccess();
    } catch (err) {
      console.error("Bulk revoke failed:", err);
    }
  };

  const confirmBulkAction = (toolId: string, action: "grant" | "revoke", toolName: string) => {
    setPendingBulk({ toolId, action, toolName });
    setBulkModalOpen(true);
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Access Control</h1>
        <p className="text-gray-500 mt-2">Grant or revoke user access to resources</p>
      </div>

      {/* Success Alert */}
      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 flex items-center gap-3 animate-fade-in">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}

      {users.length === 0 || tools.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {users.length === 0 ? "No users yet" : "No resources yet"}
          </h3>
          <p className="text-gray-500">
            {users.length === 0
              ? "Add users first to configure access"
              : "Add resources to configure their access"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                    User
                  </th>
                  {tools.map((tool) => (
                    <th
                      key={tool.id}
                      className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[180px]"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-gray-700">{tool.name}</span>
                        <div className="flex gap-1">
                          <Tooltip content="Grant access to all users">
                            <button
                              onClick={() => confirmBulkAction(tool.id, "grant", tool.name)}
                              className="p-1.5 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                            </button>
                          </Tooltip>
                          <Tooltip content="Revoke access from all users">
                            <button
                              onClick={() => confirmBulkAction(tool.id, "revoke", tool.name)}
                              className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    {tools.map((tool) => {
                      const hasAccess = access[user.id]?.[tool.id] || false;
                      const expiryKey = `${user.id}-${tool.id}`;
                      const expiryDate = expiryDates[expiryKey];

                      return (
                        <td key={tool.id} className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex flex-col items-center gap-2">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={hasAccess}
                                onChange={() => handleToggleAccess(user.id, tool.id)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                            {hasAccess && (
                              <input
                                type="date"
                                value={expiryDate ? expiryDate.split("T")[0] : ""}
                                onChange={(e) =>
                                  handleSetExpiry(
                                    user.id,
                                    tool.id,
                                    e.target.value ? new Date(e.target.value).toISOString() : ""
                                  )
                                }
                                className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-32"
                                placeholder="Expiry"
                              />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk Action Modal */}
      <Modal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        onConfirm={() => {
          if (pendingBulk) {
            if (pendingBulk.action === "grant") {
              handleBulkGrant(pendingBulk.toolId);
            } else {
              handleBulkRevoke(pendingBulk.toolId);
            }
          }
        }}
        title={pendingBulk?.action === "grant" ? "Grant Access to All Users" : "Revoke Access from All Users"}
        message={pendingBulk?.action === "grant"
          ? `This will grant access to "${pendingBulk?.toolName}" for all active users.`
          : `This will revoke access to "${pendingBulk?.toolName}" from all users and end their active sessions.`
        }
        confirmText={pendingBulk?.action === "grant" ? "Grant All" : "Revoke All"}
        variant={pendingBulk?.action === "grant" ? "info" : "danger"}
      />
    </div>
  );
}
