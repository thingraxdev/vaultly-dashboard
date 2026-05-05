/**
 * Popup script for the extension
 * Handles the main UI for users to launch tools
 */

let storage = {};
let currentTools = [];

/**
 * Initialize the popup
 */
document.addEventListener("DOMContentLoaded", async () => {
  // Add CSS animations
  addStyles();

  // Load storage data
  storage = await getStorageData();

  // Check if configured
  if (!storage.userEmail || !storage.dashboardUrl || !storage.apiKey) {
    showSetupPrompt();
    return;
  }

  // Show email in header
  document.getElementById("userEmail").textContent = storage.userEmail;

  // Load tools
  await loadTools();

  // Attach event listeners
  bindEventListeners();
});

/**
 * Add CSS animations
 */
function addStyles() {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Load tools from dashboard API
 */
async function loadTools() {
  const toolsList = document.getElementById("toolsList");
  const loadingState = document.getElementById("loadingState");
  const toolsGrid = document.getElementById("toolsGrid");

  toolsList.style.display = "block";
  loadingState.style.display = "block";
  toolsGrid.innerHTML = "";

  try {
    const result = await validateUser(
      storage.userEmail,
      storage.apiKey,
      storage.dashboardUrl
    );

    // Update last validation time
    await setStorageData({
      ...storage,
      lastValidation: Date.now(),
    });
    document.getElementById("lastUpdated").textContent = new Date().toLocaleTimeString();

    if (!result.valid) {
      showMessage("error", result.message || "User validation failed. Check your settings.");
      loadingState.style.display = "none";
      return;
    }

    if (result.message) {
      showMessage("info", result.message, 5000);
    }

    currentTools = result.allowedTools || [];

    if (currentTools.length === 0) {
      loadingState.style.display = "none";
      document.getElementById("emptyState").style.display = "block";
      return;
    }

    renderTools(currentTools);
    loadingState.style.display = "none";
  } catch (error) {
    console.error("Load tools error:", error);
    showMessage("error", `Failed to load tools: ${error.message}`);
    loadingState.style.display = "none";
  }
}

/**
 * Render tools in the grid
 */
function renderTools(tools) {
  const toolsGrid = document.getElementById("toolsGrid");
  toolsGrid.innerHTML = "";

  tools.forEach((tool) => {
    const toolCard = document.createElement("div");
    const unavailable = tool.is_active === false || tool.grantActive === false;
    const busy = !!tool.busy;
    toolCard.className = `tool-card${unavailable ? " tool-card-disabled" : ""}`;

    let iconHtml = "";
    if (tool.icon_url) {
      iconHtml = `<img src="${escapeHtml(tool.icon_url)}" alt="${escapeHtml(tool.name)}" class="tool-icon">`;
    } else {
      iconHtml = `<div class="tool-icon-placeholder">📦</div>`;
    }

    const statusLabel = unavailable
      ? '<p class="tool-status unavailable">Currently unavailable</p>'
      : busy
      ? '<p class="tool-status busy">Busy - try again shortly</p>'
      : "";

    toolCard.innerHTML = `
      <div class="tool-icon-container">
        ${iconHtml}
      </div>
      <h3 class="tool-name">${escapeHtml(tool.name)}</h3>
      ${statusLabel}
      <button class="btn btn-primary launch-btn" ${unavailable || busy ? "disabled" : ""} data-tool-id="${tool.id}" data-tool-name="${escapeHtml(tool.name)}" data-tool-url="${escapeHtml(tool.url)}">
        ${busy ? "Busy" : unavailable ? "No access" : "Launch →"}
      </button>
    `;

    toolsGrid.appendChild(toolCard);
  });

  // Attach launch button listeners
  document.querySelectorAll(".launch-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const toolId = btn.dataset.toolId;
      const toolName = btn.dataset.toolName;
      const toolUrl = btn.dataset.toolUrl;
      launchTool(toolId, toolName, toolUrl);
    });
  });
}

/**
 * Launch a tool - fetch cookies and inject them
 */
async function launchTool(toolId, toolName, toolUrl) {
  const modal = document.getElementById("launchingModal");
  const modalOverlay = document.getElementById("modalOverlay");

  // Show launching modal
  document.getElementById("launchToolName").textContent = `Launching ${toolName}...`;
  document.getElementById("launchStatus").textContent = "Setting up cookies...";
  modal.style.display = "block";
  modalOverlay.style.display = "block";

  try {
    // Get cookies from API
    const cookieData = await getCookiesForTool(
      storage.userEmail,
      toolId,
      storage.apiKey,
      storage.dashboardUrl
    );

    document.getElementById("launchStatus").textContent = "Injecting cookies...";

    // Inject cookies via background script
    const injectResult = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          action: "injectCookies",
          cookies: cookieData.cookies,
          domain: cookieData.toolId,
        },
        (response) => {
          resolve(response);
        }
      );
    });

    if (!injectResult.success && injectResult.failed?.length > 0) {
      console.warn(`Failed to inject ${injectResult.failed.length} cookies`);
    }

    document.getElementById("launchStatus").textContent = "Opening tool...";

    // Log access
    await logAccess(storage.userEmail, toolId, storage.apiKey, storage.dashboardUrl, "launch");

    // Open tool in new tab
    const tabResponse = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          action: "openTab",
          url: toolUrl,
        },
        (response) => {
          resolve(response);
        }
      );
    });

    if (tabResponse && tabResponse.tabId && cookieData.sessionId) {
      chrome.runtime.sendMessage({
        action: "registerSessionTab",
        tabId: tabResponse.tabId,
        sessionId: cookieData.sessionId,
      });
    }

    // Success message
    document.getElementById("launchStatus").textContent = `✓ ${toolName} is ready!`;
    setTimeout(() => {
      modal.style.display = "none";
      modalOverlay.style.display = "none";
      showMessage("success", `${toolName} launched successfully!`, 2000);
    }, 1500);

    // Close popup after successful launch (optional)
    setTimeout(() => {
      window.close();
    }, 3000);
  } catch (error) {
    console.error("Launch tool error:", error);
    document.getElementById("launchStatus").textContent = `✗ Error: ${error.message}`;
    setTimeout(() => {
      modal.style.display = "none";
      modalOverlay.style.display = "none";
      showMessage("error", `Failed to launch ${toolName}: ${error.message}`);
    }, 2000);
  }
}

/**
 * Show setup prompt
 */
function showSetupPrompt() {
  document.getElementById("setupPrompt").style.display = "block";
  document.getElementById("toolsList").style.display = "none";

  document.getElementById("setupBtn").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
    chrome.tabs.create({
      url: chrome.runtime.getURL("public/setup.html"),
    });
  });
}

/**
 * Bind event listeners
 */
function bindEventListeners() {
  // Refresh button
  document.getElementById("refreshBtn").addEventListener("click", loadTools);

  // Settings buttons
  document.getElementById("settingsBtn").addEventListener("click", openSettings);
  const settingsBtn2 = document.getElementById("settingsBtn2");
  if (settingsBtn2) {
    settingsBtn2.addEventListener("click", openSettings);
  }
}

/**
 * Open settings/setup page
 */
function openSettings() {
  chrome.tabs.create({
    url: chrome.runtime.getURL("public/setup.html"),
  });
}

/**
 * Show message to user
 */
function showMessage(type, message, duration = 3000) {
  const messageArea = document.getElementById("messageArea");
  messageArea.innerHTML = `<div class="message message-${type}">${escapeHtml(message)}</div>`;

  if (duration > 0) {
    setTimeout(() => {
      messageArea.innerHTML = "";
    }, duration);
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
