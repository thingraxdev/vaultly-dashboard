"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Tool } from "@/shared/types";
import Modal from "@/components/Modal";
import Tooltip from "@/components/Tooltip";
import { TrashIcon, PowerIcon } from "@/components/Icons";
import PageLoader from "@/components/PageLoader";

/**
 * Users management page
 * List, add, and manage user accounts
 */
export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [userAccess, setUserAccess] = useState<Record<string, Tool[]>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ email: "", name: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<{ id: string; isActive: boolean } | null>(null);

  useEffect(() => {
    Promise.all([fetchUsers()]);
  }, []);

  /**
   * Fetch all users
   */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Use API route with service role to bypass RLS
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const { users: data } = await response.json();

      setUsers(data || []);

      // Fetch access grants for each user
      if (data) {
        for (const user of data) {
          await fetchUserTools(user.id);
        }
      }
    } catch (err) {
      setError("Failed to load users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch tools available to a user
   */
  const fetchUserTools = async (userId: string) => {
    try {
      const { data: grants, error } = await supabase
        .from("access_grants")
        .select("tool_id")
        .eq("user_id", userId)
        .eq("is_active", true);

      if (error) throw error;

      const toolIds = Array.from(new Set((grants || []).map((ag) => ag.tool_id)));
      if (toolIds.length === 0) {
        setUserAccess((prev) => ({ ...prev, [userId]: [] }));
        return;
      }

      const { data: toolRows, error: toolsError } = await supabase
        .from("tools")
        .select("id, name, url, cookie_domain, cookies_json, icon_url, created_at, is_active, cookie_updated_at, max_concurrent_users")
        .in("id", toolIds);

      if (toolsError) throw toolsError;

      setUserAccess((prev) => ({ ...prev, [userId]: (toolRows || []) as Tool[] }));
    } catch (err) {
      console.error("Failed to fetch user tools:", err);
    }
  };

  /**
   * Handle add user
   */
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.email || !formData.name) {
      setError("Email and name are required");
      return;
    }

    try {
      setCreating(true);
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, name: formData.name }),
      });

      const result = (await response.json()) as { error?: string; success?: boolean };
      if (!response.ok) {
        throw new Error(result.error || "Failed to add user");
      }

      setSuccess("User created and invite email sent");
      setFormData({ email: "", name: "" });
      setShowForm(false);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add user");
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  /**
   * Toggle user active status
   */
  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from("users").update({ is_active: !isActive }).eq("id", id);
      if (error) throw error;

      // If deactivating user, end all their active sessions
      if (isActive) {
        await supabase
          .from("active_sessions")
          .update({ session_end: new Date().toISOString() })
          .eq("user_id", id)
          .is("session_end", null);
      }

      await fetchUsers();
    } catch (err) {
      setError("Failed to update user");
      console.error(err);
    }
  };

  /**
   * Delete user
   */
  const handleDeleteUser = async (id: string) => {
    try {
      // End all active sessions for this user
      await supabase
        .from("active_sessions")
        .update({ session_end: new Date().toISOString() })
        .eq("user_id", id)
        .is("session_end", null);

      // First delete access grants
      await supabase.from("access_grants").delete().eq("user_id", id);
      // Then delete user
      const { data: deletedRows, error } = await supabase.from("users").delete().eq("id", id).select("id");
      if (error) throw error;
      if (!deletedRows || deletedRows.length === 0) {
        throw new Error("Delete was blocked by permissions (RLS). User was not removed.");
      }
      setSuccess("User deleted successfully");
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
      console.error(err);
    }
  };

  const confirmDelete = (id: string) => {
    setPendingDeleteId(id);
    setDeleteModalOpen(true);
  };

  const confirmToggle = (id: string, isActive: boolean) => {
    setPendingToggle({ id, isActive });
    setToggleModalOpen(true);
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-500 mt-2">Manage user accounts and their access</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-200 ${
            showForm
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl"
          }`}
        >
          {showForm ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add User
            </>
          )}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 animate-fade-in">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 flex items-center gap-3 animate-fade-in">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}

      {/* Add User Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 mb-8 animate-slide-up">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            Add New User
          </h2>
          <form onSubmit={handleAddUser} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-modern"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-modern"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={creating}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:shadow-none"
            >
              {creating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                "Add User & Send Invite"
              )}
            </button>
          </form>
        </div>
      )}

      {/* Users List */}
      {users.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No users yet</h3>
          <p className="text-gray-500 mb-6">Click &quot;Add User&quot; to create your first user</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-3 rounded-xl transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Your First User
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Resources</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Onboarding</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold text-sm">
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{user.email}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-sm font-medium text-gray-700">
                        {(userAccess[user.id] || []).length} resource(s)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${user.is_active ? "badge-success" : "bg-gray-100 text-gray-600"}`}>
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${user.password_set ? "badge-success" : "badge-warning"}`}>
                        {user.password_set ? "Completed" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Tooltip content={user.is_active ? "Disable user" : "Enable user"}>
                          <button
                            onClick={() => confirmToggle(user.id, user.is_active)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.is_active
                                ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            <PowerIcon className="w-5 h-5" />
                          </button>
                        </Tooltip>
                        <Tooltip content="Delete user">
                          <button
                            onClick={() => confirmDelete(user.id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => {
          if (pendingDeleteId) handleDeleteUser(pendingDeleteId);
        }}
        title="Delete User"
        message="Are you sure you want to delete this user? This will also remove their access grants and cannot be undone."
        confirmText="Delete"
        variant="danger"
      />

      {/* Toggle Status Modal */}
      <Modal
        isOpen={toggleModalOpen}
        onClose={() => setToggleModalOpen(false)}
        onConfirm={() => {
          if (pendingToggle) handleToggleActive(pendingToggle.id, pendingToggle.isActive);
        }}
        title={pendingToggle?.isActive ? "Disable User" : "Enable User"}
        message={pendingToggle?.isActive
          ? "Disabling this user will end all their active sessions. They will not be able to access any resources."
          : "Enabling this user will allow them to access their assigned resources."
        }
        confirmText={pendingToggle?.isActive ? "Disable" : "Enable"}
        variant={pendingToggle?.isActive ? "warning" : "info"}
      />
    </div>
  );
}
