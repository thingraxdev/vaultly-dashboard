/**
 * Background Service Worker for Chrome Extension.
 */

const EXTENSION_VERSION = "1.3.0";
const tabSessionMap = new Map(); // tabId -> { sessionId, cookieDomain, toolUrl }
const SESSION_CHECK_INTERVAL = 30000; // Check every 30 seconds

// Start session validation loop
setInterval(validateActiveSessions, SESSION_CHECK_INTERVAL);

// Internal messages (from extension popup)
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "injectCookies") {
    injectCookies(request.cookies || [])
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === "openTab") {
    chrome.tabs.create({ url: request.url }).then((tab) => {
      sendResponse({ success: true, tabId: tab.id });
    });
    return true;
  }

  if (request.action === "registerSessionTab") {
    if (request.tabId && request.sessionId) {
      tabSessionMap.set(request.tabId, {
        sessionId: request.sessionId,
        cookieDomain: request.cookieDomain,
        toolUrl: request.toolUrl,
      });
    }
    sendResponse({ success: true });
    return true;
  }

  return false;
});

// External messages (from dashboard website)
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  // Ping to check if extension is installed
  if (request.action === "ping") {
    sendResponse({ success: true, version: EXTENSION_VERSION });
    return true;
  }

  // Launch a tool from the dashboard
  if (request.action === "launchTool") {
    handleExternalLaunch(request, sender)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  return false;
});

/**
 * Handle external launch request from dashboard
 */
async function handleExternalLaunch(request, sender) {
  const { toolId, toolUrl, userEmail } = request;

  if (!toolId || !toolUrl || !userEmail) {
    return { success: false, error: "Missing required parameters" };
  }

  // Get stored API settings
  const storage = await chrome.storage.sync.get(["dashboardUrl", "apiKey"]);
  if (!storage.dashboardUrl || !storage.apiKey) {
    return { success: false, error: "Extension not configured. Please set up the extension first." };
  }

  try {
    // Fetch cookies from API
    const cookieResponse = await fetch(
      `${storage.dashboardUrl}/api/cookies?email=${encodeURIComponent(userEmail)}&toolId=${encodeURIComponent(toolId)}`,
      {
        headers: {
          "X-API-Key": storage.apiKey,
          "X-Extension-Version": EXTENSION_VERSION,
        },
      }
    );

    if (!cookieResponse.ok) {
      const errorData = await cookieResponse.json().catch(() => ({}));
      return { success: false, error: errorData.error || `API error: ${cookieResponse.status}` };
    }

    const cookieData = await cookieResponse.json();

    // Inject cookies
    const injectResult = await injectCookies(cookieData.cookies || []);
    if (!injectResult.success && injectResult.failed?.length > 0) {
      console.warn(`Failed to inject ${injectResult.failed.length} cookies`);
    }

    // Extract cookie domain from the first cookie or URL
    const cookieDomain = cookieData.cookies?.[0]?.domain || new URL(toolUrl).hostname;

    // Open the tool in a new tab
    const tab = await chrome.tabs.create({ url: toolUrl });

    // Log the access (same as popup launch)
    try {
      await fetch(`${storage.dashboardUrl}/api/log-access`, {
        method: "POST",
        headers: {
          "X-API-Key": storage.apiKey,
          "X-Extension-Version": EXTENSION_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          toolId: toolId,
          action: "launch",
          extensionVersion: EXTENSION_VERSION,
        }),
      });
    } catch (logError) {
      console.warn("Failed to log access:", logError);
      // Don't fail the launch if logging fails
    }

    // Register session for cleanup and validation
    if (cookieData.sessionId && tab.id) {
      tabSessionMap.set(tab.id, {
        sessionId: cookieData.sessionId,
        cookieDomain: cookieDomain,
        toolUrl: toolUrl,
      });
    }

    return { success: true, tabId: tab.id };
  } catch (error) {
    console.error("External launch error:", error);
    return { success: false, error: error.message };
  }
}

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const session = tabSessionMap.get(tabId);
  if (!session) return;

  try {
    const storage = await chrome.storage.sync.get(["dashboardUrl", "apiKey"]);
    if (storage.dashboardUrl && storage.apiKey) {
      await fetch(`${storage.dashboardUrl}/api/end-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": storage.apiKey,
          "X-Extension-Version": EXTENSION_VERSION,
        },
        body: JSON.stringify({ sessionId: session.sessionId }),
      });
    }
  } catch (error) {
    console.warn("Failed to end session on tab close", error);
  } finally {
    tabSessionMap.delete(tabId);
  }
});

/**
 * Inject cookies into the browser.
 */
async function injectCookies(cookies) {
  const failed = [];
  const jobs = cookies.map((cookie, index) =>
    injectSingleCookie(cookie).catch(() => {
      failed.push(cookie?.name || `cookie_${index}`);
    })
  );

  await Promise.all(jobs);
  return { success: failed.length === 0, failed };
}

/**
 * Inject one cookie using chrome.cookies.set.
 */
function injectSingleCookie(cookie) {
  return new Promise((resolve, reject) => {
    const normalizedDomain = String(cookie.domain || "").replace(/^\./, "");
    const cookieDetails = {
      url: cookie.url || `https://${normalizedDomain}${cookie.path || "/"}`,
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path || "/",
      secure: cookie.secure !== false,
      httpOnly: !!cookie.httpOnly,
      sameSite: cookie.sameSite || "Lax",
      expirationDate: cookie.expirationDate,
    };

    chrome.cookies.set(cookieDetails, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({ url: chrome.runtime.getURL("public/setup.html") });
  }
});

/**
 * Validate all active sessions periodically
 * Clears cookies and closes tabs for revoked sessions
 */
async function validateActiveSessions() {
  if (tabSessionMap.size === 0) return;

  const storage = await chrome.storage.sync.get(["dashboardUrl", "apiKey"]);
  if (!storage.dashboardUrl || !storage.apiKey) return;

  for (const [tabId, session] of tabSessionMap.entries()) {
    try {
      const response = await fetch(
        `${storage.dashboardUrl}/api/check-session?sessionId=${encodeURIComponent(session.sessionId)}`,
        {
          headers: {
            "X-API-Key": storage.apiKey,
            "X-Extension-Version": EXTENSION_VERSION,
          },
        }
      );

      if (!response.ok) continue;

      const result = await response.json();

      if (!result.valid && result.clearCookies) {
        console.log(`Session ${session.sessionId} invalidated: ${result.reason}`);

        // Clear cookies for this domain
        const domain = result.cookieDomain || session.cookieDomain;
        if (domain) {
          await clearCookiesForDomain(domain);
        }

        // Close the tab
        try {
          await chrome.tabs.remove(tabId);
        } catch {
          // Tab may already be closed
        }

        // Remove from tracking
        tabSessionMap.delete(tabId);

        // Show notification to user
        chrome.notifications.create({
          type: "basic",
          iconUrl: chrome.runtime.getURL("public/icon-48.png"),
          title: "Access Revoked",
          message: `Your access has been revoked. Reason: ${formatReason(result.reason)}`,
        });
      }
    } catch (error) {
      console.warn(`Failed to validate session ${session.sessionId}:`, error);
    }
  }
}

/**
 * Clear all cookies for a specific domain
 */
async function clearCookiesForDomain(domain) {
  // Normalize domain (handle both .domain.com and domain.com)
  const normalizedDomain = domain.replace(/^\./, "");
  const dotDomain = domain.startsWith(".") ? domain : `.${domain}`;

  try {
    // Get all cookies for this domain
    const cookies = await chrome.cookies.getAll({ domain: normalizedDomain });
    const dotCookies = await chrome.cookies.getAll({ domain: dotDomain });

    const allCookies = [...cookies, ...dotCookies];
    const uniqueCookies = allCookies.filter(
      (cookie, index, self) =>
        index === self.findIndex((c) => c.name === cookie.name && c.domain === cookie.domain)
    );

    console.log(`Clearing ${uniqueCookies.length} cookies for domain ${domain}`);

    // Remove each cookie
    for (const cookie of uniqueCookies) {
      const protocol = cookie.secure ? "https" : "http";
      const cookieDomain = cookie.domain.replace(/^\./, "");
      const url = `${protocol}://${cookieDomain}${cookie.path}`;

      await chrome.cookies.remove({
        url: url,
        name: cookie.name,
      });
    }

    console.log(`Cleared cookies for ${domain}`);
  } catch (error) {
    console.error(`Failed to clear cookies for ${domain}:`, error);
  }
}

/**
 * Format reason for notification
 */
function formatReason(reason) {
  const reasons = {
    session_ended: "Session was ended by admin",
    access_revoked: "Access was revoked",
    access_expired: "Access has expired",
    user_deactivated: "Your account was deactivated",
    tool_deactivated: "Tool is no longer available",
    session_not_found: "Session not found",
  };
  return reasons[reason] || reason;
}
