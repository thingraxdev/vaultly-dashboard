"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Tool } from "@/shared/types";
import Modal from "@/components/Modal";
import Tooltip from "@/components/Tooltip";
import { RefreshIcon, TrashIcon, PencilIcon, PowerIcon } from "@/components/Icons";
import PageLoader from "@/components/PageLoader";

/**
 * Resources management page
 * List, add, edit, and delete resources with their cookies
 */
export default function ResourcesPage() {
  const [resources, setResources] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    cookie_domain: "",
    cookies_json: "",
    icon_url: "",
    max_concurrent_users: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<{ id: string; isActive: boolean } | null>(null);

  useEffect(() => {
    fetchResources();
  }, []);

  /**
   * Fetch all resources from database
   */
  const fetchResources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("tools").select("*").order("created_at", { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (err) {
      setError("Failed to load resources");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Validate JSON cookies format
   */
  const validateCookies = (jsonStr: string): boolean => {
    try {
      const cookies = JSON.parse(jsonStr) as unknown;
      if (!Array.isArray(cookies)) return false;
      return cookies.every(
        (c) =>
          typeof c === "object" &&
          c !== null &&
          "name" in c &&
          "value" in c &&
          "domain" in c
      );
    } catch {
      return false;
    }
  };

  /**
   * Handle form submission for adding/editing resource
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate cookies JSON
    if (!validateCookies(formData.cookies_json)) {
      setError("Invalid cookies JSON format. Must be array of cookie objects.");
      return;
    }

    try {
      const encryptedCookies = formData.cookies_json;

      if (editingId) {
        const { error } = await supabase
          .from("tools")
          .update({
            name: formData.name,
            url: formData.url,
            cookie_domain: formData.cookie_domain,
            cookies_json: encryptedCookies,
            icon_url: formData.icon_url,
            max_concurrent_users: formData.max_concurrent_users ? Number(formData.max_concurrent_users) : null,
            cookie_updated_at: new Date().toISOString(),
          })
          .eq("id", editingId);

        if (error) throw error;
        setSuccess("Resource updated successfully");
      } else {
        const { error } = await supabase.from("tools").insert([
          {
            name: formData.name,
            url: formData.url,
            cookie_domain: formData.cookie_domain,
            cookies_json: encryptedCookies,
            icon_url: formData.icon_url,
            is_active: true,
            max_concurrent_users: formData.max_concurrent_users ? Number(formData.max_concurrent_users) : null,
            cookie_updated_at: new Date().toISOString(),
          },
        ]);

        if (error) throw error;
        setSuccess("Resource added successfully");
      }

      setFormData({ name: "", url: "", cookie_domain: "", cookies_json: "", icon_url: "", max_concurrent_users: "" });
      setEditingId(null);
      setShowForm(false);
      await fetchResources();
    } catch (err) {
      setError("Failed to save resource");
      console.error(err);
    }
  };

  /**
   * Delete a resource
   */
  const handleDelete = async (id: string) => {
    try {
      await supabase
        .from("active_sessions")
        .update({ session_end: new Date().toISOString() })
        .eq("tool_id", id)
        .is("session_end", null);

      const { error } = await supabase.from("tools").delete().eq("id", id);
      if (error) throw error;
      setSuccess("Resource deleted successfully");
      await fetchResources();
    } catch (err) {
      setError("Failed to delete resource");
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

  /**
   * Toggle resource active status
   */
  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from("tools").update({ is_active: !isActive }).eq("id", id);
      if (error) throw error;

      if (isActive) {
        await supabase
          .from("active_sessions")
          .update({ session_end: new Date().toISOString() })
          .eq("tool_id", id)
          .is("session_end", null);
      }

      await fetchResources();
    } catch (err) {
      setError("Failed to update resource status");
      console.error(err);
    }
  };

  const handleEdit = (resource: Tool) => {
    setFormData({
      name: resource.name,
      url: resource.url,
      cookie_domain: resource.cookie_domain,
      cookies_json: resource.cookies_json,
      icon_url: resource.icon_url || "",
      max_concurrent_users: resource.max_concurrent_users ? String(resource.max_concurrent_users) : "",
    });
    setEditingId(resource.id);
    setShowForm(true);
  };

  const handleMarkRefreshed = async (id: string) => {
    try {
      const { error } = await supabase
        .from("tools")
        .update({ cookie_updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      setSuccess("Cookie health marked as refreshed");
      await fetchResources();
    } catch (err) {
      setError("Failed to mark as refreshed");
      console.error(err);
    }
  };

  const getCookieHealth = (resource: Tool) => {
    const updatedAt = resource.cookie_updated_at ? new Date(resource.cookie_updated_at) : new Date(resource.created_at);
    const days = Math.floor((Date.now() - updatedAt.getTime()) / (24 * 60 * 60 * 1000));
    if (days >= 14) return { label: "Alert", sublabel: "14+ days", color: "red", days };
    if (days >= 7) return { label: "Warning", sublabel: "7+ days", color: "yellow", days };
    return { label: "Healthy", sublabel: "Fresh", color: "green", days };
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resources Management</h1>
          <p className="text-gray-500 mt-2">Add and manage resources for secure access</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ name: "", url: "", cookie_domain: "", cookies_json: "", icon_url: "", max_concurrent_users: "" });
          }}
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
              Add Resource
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

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 mb-8 animate-slide-up">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            {editingId ? "Edit Resource" : "Add New Resource"}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resource Name</label>
                <input
                  type="text"
                  placeholder="e.g., ChatGPT, Google, etc."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-modern"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resource URL</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="input-modern"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cookie Domain</label>
                <input
                  type="text"
                  placeholder=".example.com"
                  value={formData.cookie_domain}
                  onChange={(e) => setFormData({ ...formData, cookie_domain: e.target.value })}
                  className="input-modern"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Concurrent Users</label>
                <input
                  type="number"
                  min={1}
                  placeholder="Optional limit"
                  value={formData.max_concurrent_users}
                  onChange={(e) => setFormData({ ...formData, max_concurrent_users: e.target.value })}
                  className="input-modern"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Icon URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/icon.png"
                  value={formData.icon_url}
                  onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                  className="input-modern"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cookies JSON <span className="text-gray-400 font-normal">(paste from browser DevTools)</span>
              </label>
              <textarea
                placeholder='[{"name":"session_id","value":"xxx","domain":".example.com","path":"/"}]'
                value={formData.cookies_json}
                onChange={(e) => setFormData({ ...formData, cookies_json: e.target.value })}
                className="input-modern font-mono text-sm"
                rows={6}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {editingId ? "Update Resource" : "Add Resource"}
            </button>
          </form>
        </div>
      )}

      {/* Resources List */}
      {resources.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No resources added yet</h3>
          <p className="text-gray-500 mb-6">Click &quot;Add Resource&quot; to get started</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-3 rounded-xl transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Your First Resource
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {resources.map((resource) => {
            const health = getCookieHealth(resource);
            return (
              <div
                key={resource.id}
                className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 card-hover"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Resource Info */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {resource.icon_url ? (
                        <img src={resource.icon_url} alt={resource.name} className="w-10 h-10 object-contain" />
                      ) : (
                        <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{resource.name}</h3>
                        <span className={`badge ${resource.is_active ? "badge-success" : "bg-gray-100 text-gray-600"}`}>
                          {resource.is_active ? "Active" : "Inactive"}
                        </span>
                        <span className={`badge ${
                          health.color === "green" ? "badge-success" :
                          health.color === "yellow" ? "badge-warning" : "badge-error"
                        }`}>
                          Cookie: {health.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate mb-2">{resource.url}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                          <span className="font-mono">{resource.cookie_domain}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          Max users: {resource.max_concurrent_users || "∞"}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Updated: {new Date(resource.cookie_updated_at || resource.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Tooltip content="Refresh cookies">
                      <button
                        onClick={() => handleMarkRefreshed(resource.id)}
                        className="p-2.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-xl transition-colors"
                      >
                        <RefreshIcon className="w-5 h-5" />
                      </button>
                    </Tooltip>
                    <Tooltip content={resource.is_active ? "Disable resource" : "Enable resource"}>
                      <button
                        onClick={() => confirmToggle(resource.id, resource.is_active)}
                        className={`p-2.5 rounded-xl transition-colors ${
                          resource.is_active
                            ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <PowerIcon className="w-5 h-5" />
                      </button>
                    </Tooltip>
                    <Tooltip content="Edit resource">
                      <button
                        onClick={() => handleEdit(resource)}
                        className="p-2.5 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                    </Tooltip>
                    <Tooltip content="Delete resource">
                      <button
                        onClick={() => confirmDelete(resource.id)}
                        className="p-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => {
          if (pendingDeleteId) handleDelete(pendingDeleteId);
        }}
        title="Delete Resource"
        message="Are you sure you want to delete this resource? This action cannot be undone."
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
        title={pendingToggle?.isActive ? "Disable Resource" : "Enable Resource"}
        message={pendingToggle?.isActive
          ? "Disabling this resource will end all active sessions. Users will not be able to access it."
          : "Enabling this resource will make it available to users with access."
        }
        confirmText={pendingToggle?.isActive ? "Disable" : "Enable"}
        variant={pendingToggle?.isActive ? "warning" : "info"}
      />
    </div>
  );
}
