/**
 * Utility functions for the extension
 */

const EXTENSION_VERSION = "1.1.0";

/**
 * Fetch user's accessible tools from dashboard API
 * @param email - User email
 * @param apiKey - API key for authentication
 * @param dashboardUrl - Dashboard base URL
 * @returns Array of tools user has access to
 */
async function validateUser(email, apiKey, dashboardUrl) {
  try {
    const url = `${dashboardUrl}/api/validate-user?email=${encodeURIComponent(email)}`;
    const response = await fetch(url, {
      headers: {
        "X-API-Key": apiKey,
        "X-Extension-Version": EXTENSION_VERSION,
      },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      if (response.status === 426) {
        throw new Error("Please reload your extension");
      }
      throw new Error(body.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Validate user error:", error);
    return {
      valid: false,
      allowedTools: [],
    };
  }
}

/**
 * Fetch cookies for a specific tool from dashboard API
 * @param email - User email
 * @param toolId - Tool ID
 * @param apiKey - API key
 * @param dashboardUrl - Dashboard base URL
 * @returns Cookies and tool information
 */
async function getCookiesForTool(email, toolId, apiKey, dashboardUrl) {
  try {
    const url = `${dashboardUrl}/api/cookies?email=${encodeURIComponent(email)}&toolId=${encodeURIComponent(toolId)}`;
    const response = await fetch(url, {
      headers: {
        "X-API-Key": apiKey,
        "X-Extension-Version": EXTENSION_VERSION,
      },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      if (response.status === 426) {
        throw new Error("Please reload your extension");
      }
      if (response.status === 423) {
        throw new Error(body.error || "Tool is busy, try again soon");
      }
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After") || "60";
        throw new Error(`Too many requests. Try again in ${retryAfter}s`);
      }
      throw new Error(body.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Get cookies error:", error);
    throw error;
  }
}

/**
 * Log tool access to dashboard
 * @param email - User email
 * @param toolId - Tool ID
 * @param apiKey - API key
 * @param dashboardUrl - Dashboard base URL
 */
async function logAccess(email, toolId, apiKey, dashboardUrl, action = "launch") {
  try {
    const url = `${dashboardUrl}/api/log-access`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "X-Extension-Version": EXTENSION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        toolId,
        action,
        extensionVersion: EXTENSION_VERSION,
      }),
    });

    if (!response.ok) {
      console.warn(`Failed to log access: ${response.status}`);
    }
  } catch (error) {
    console.error("Log access error:", error);
    // Don't throw - logging failure shouldn't block user
  }
}

/**
 * Ends a tracked session on the API.
 */
async function endSession(sessionId, apiKey, dashboardUrl) {
  const url = `${dashboardUrl}/api/end-session`;
  await fetch(url, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "X-Extension-Version": EXTENSION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sessionId }),
  });
}

/**
 * Show a toast notification
 * @param message - Message to display
 * @param type - 'success', 'error', or 'info'
 * @param duration - How long to show (ms)
 */
function showToast(message, type = "info", duration = 3000) {
  // Get or create toast container
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    `;
    document.body.appendChild(toastContainer);
  }

  // Create toast element
  const toast = document.createElement("div");
  const colors = {
    success: "#10b981",
    error: "#ef4444",
    info: "#3b82f6",
  };
  const bgColor = colors[type] || colors.info;

  toast.style.cssText = `
    background: ${bgColor};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    margin-bottom: 10px;
    animation: slideIn 0.3s ease-out;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  `;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  // Remove after duration
  setTimeout(() => {
    toast.style.animation = "slideOut 0.3s ease-out forwards";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Get storage data with fallback
 */
async function getStorageData() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(null, (data) => {
      resolve(data);
    });
  });
}

/**
 * Set storage data
 */
async function setStorageData(data) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(data, () => {
      resolve();
    });
  });
}

/**
 * Clear all storage data
 */
async function clearStorage() {
  return new Promise((resolve) => {
    chrome.storage.sync.clear(() => {
      resolve();
    });
  });
}
