"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PageLoader from "@/components/PageLoader";

// Declare chrome types for extension communication
declare const chrome: {
  runtime: {
    sendMessage: (
      extensionId: string,
      message: unknown,
      callback: (response: unknown) => void
    ) => void;
    lastError?: { message: string };
  };
} | undefined;

// The extension ID - users must update this after installing the extension
const EXTENSION_ID = process.env.NEXT_PUBLIC_EXTENSION_ID || "";

interface PortalResource {
  id: string;
  name: string;
  url: string;
  icon_url: string | null;
  is_active: boolean;
  grantActive: boolean;
  expiresAt?: string;
  lastUsed?: string;
}

/**
 * Portal dashboard: resources grid for end users (Vaultly style)
 */
export default function PortalDashboardPage() {
  const [resources, setResources] = useState<PortalResource[]>([]);
  const [message, setMessage] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [extensionInstalled, setExtensionInstalled] = useState<boolean | null>(null);
  const [launching, setLaunching] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const userRes = await supabase.auth.getUser();
        const email = userRes.data.user?.email;
        if (!email) {
          setLoading(false);
          return;
        }
        setUserEmail(email);

      // Check if extension is installed
      checkExtension();

      const response = await fetch(`/api/portal/tools?email=${encodeURIComponent(email)}`);

      if (!response.ok) {
        setMessage("Unable to load your resources right now.");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setResources(data.tools || []);
      if (data.message) setMessage(data.message);
      setLoading(false);
      } catch {
        // Ignore auth lock race condition errors
        setLoading(false);
      }
    };

    void load();
  }, []);

  const checkExtension = () => {
    if (!EXTENSION_ID || typeof chrome === "undefined" || !chrome?.runtime) {
      setExtensionInstalled(false);
      return;
    }

    try {
      chrome.runtime.sendMessage(EXTENSION_ID, { action: "ping" }, (response) => {
        if (chrome?.runtime?.lastError || !(response as { success?: boolean })?.success) {
          setExtensionInstalled(false);
        } else {
          setExtensionInstalled(true);
        }
      });
    } catch {
      setExtensionInstalled(false);
    }
  };

  const handleLaunch = async (resource: PortalResource) => {
    if (!userEmail) return;

    // If extension not installed, show warning
    if (!extensionInstalled) {
      setMessage("Please install and configure the browser extension to launch resources with automatic login.");
      return;
    }

    if (typeof chrome === "undefined" || !chrome?.runtime) {
      setMessage("Browser extension not available.");
      return;
    }

    setLaunching(resource.id);
    setMessage("");

    try {
      const response = await new Promise<{ success: boolean; error?: string }>((resolve) => {
        chrome.runtime.sendMessage(
          EXTENSION_ID,
          {
            action: "launchTool",
            toolId: resource.id,
            toolUrl: resource.url,
            userEmail,
          },
          (result) => {
            if (chrome?.runtime?.lastError) {
              resolve({ success: false, error: chrome.runtime.lastError.message });
            } else {
              resolve((result as { success: boolean; error?: string }) || { success: false, error: "No response from extension" });
            }
          }
        );
      });

      if (!response.success) {
        setMessage(response.error || "Failed to launch resource");
      }
    } catch (error) {
      setMessage(`Launch error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLaunching(null);
    }
  };

  // Filter resources based on search
  const filteredResources = resources.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get active subscriptions (resources with active grants)
  const activeSubscriptions = resources.filter((r) => r.grantActive && r.is_active);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="animate-slide-up">
      {/* Extension Warning */}
      {extensionInstalled === false && (
        <div className="mb-6 p-5 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-blue-900 font-semibold mb-1">Browser Extension Required</p>
              <p className="text-blue-700 text-sm mb-2">
                To launch resources with automatic login, install the Cookie Injection Manager extension and configure it with your dashboard URL.
              </p>
              <p className="text-blue-600 text-xs">
                After installing, set NEXT_PUBLIC_EXTENSION_ID in your environment to the extension&apos;s ID.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error/Message Banner */}
      {message && (
        <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{message}</span>
        </div>
      )}

      {/* Active Subscriptions Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Subscriptions</h2>
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
          {activeSubscriptions.length === 0 ? (
            <p className="text-gray-500 text-sm">No active subscriptions</p>
          ) : (
            <div className="space-y-3">
              {activeSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="font-medium text-gray-900">{sub.name.toUpperCase()}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {sub.expiresAt
                      ? `expires ${new Date(sub.expiresAt).toLocaleDateString()}`
                      : "Active"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Resources Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Resources</h2>
        
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Any Resource..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-4 pl-12 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white shadow-sm"
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => {
            const disabled = !resource.grantActive || !resource.is_active;
            const isLaunching = launching === resource.id;

            return (
              <div
                key={resource.id}
                className={`resource-card group ${disabled ? "opacity-60" : ""}`}
              >
                {/* Resource Icon/Logo */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-4 shadow-inner overflow-hidden">
                    {resource.icon_url ? (
                      <img
                        src={resource.icon_url}
                        alt={resource.name}
                        className="w-12 h-12 object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center">
                        <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-[10px] font-bold text-primary-600 mt-1">Vaultly</span>
                      </div>
                    )}
                  </div>

                  {/* Resource Name Button */}
                  <button
                    disabled={disabled || isLaunching}
                    onClick={() => handleLaunch(resource)}
                    className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-300 ${
                      disabled
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : isLaunching
                        ? "bg-primary-600 text-white"
                        : "bg-sidebar-dark text-white hover:bg-primary-600 hover:shadow-lg hover:-translate-y-0.5"
                    }`}
                  >
                    {isLaunching ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Launching...
                      </span>
                    ) : disabled ? (
                      "No Access"
                    ) : (
                      resource.name.toUpperCase()
                    )}
                  </button>

                  {/* Last Used */}
                  <p className="text-xs text-gray-400 mt-3">
                    {resource.lastUsed
                      ? `Last used: ${new Date(resource.lastUsed).toLocaleDateString()}`
                      : "Never used"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredResources.length === 0 && (
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-500 text-sm">
              {searchQuery
                ? "Try a different search term"
                : "You don't have access to any resources yet"}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-400">
          If you&apos;re facing any issues, please message us on WhatsApp
        </p>
      </div>
    </div>
  );
}
