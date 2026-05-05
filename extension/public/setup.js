/**
 * Step-based setup page script.
 */

let step = 1;
let cache = { userEmail: "", dashboardUrl: "", apiKey: "" };

document.addEventListener("DOMContentLoaded", async () => {
  const stored = await getStorageData();
  cache = {
    userEmail: stored.userEmail || "",
    dashboardUrl: stored.dashboardUrl || "",
    apiKey: stored.apiKey || "",
  };
  renderStep();
});

function renderStep(message = "") {
  const root = document.getElementById("setup-form");
  const msg = document.getElementById("message");

  msg.innerHTML = message ? `<div class="${message.startsWith("✓") ? "success" : "error"}">${message}</div>` : "";

  if (step === 1) {
    root.innerHTML = `
      <div class="form-group">
        <label for="userEmail">Step 1: Enter your email</label>
        <input type="email" id="userEmail" placeholder="user@example.com" value="${escapeAttr(cache.userEmail)}" required>
        <p class="help-text">Use the email registered by your admin.</p>
      </div>
      <button id="nextBtn" type="button">Continue</button>
    `;
    document.getElementById("nextBtn").onclick = () => {
      const v = document.getElementById("userEmail").value.trim();
      if (!v) return renderStep("Please enter your email.");
      cache.userEmail = v;
      step = 2;
      renderStep();
    };
    return;
  }

  if (step === 2) {
    root.innerHTML = `
      <div class="form-group">
        <label for="dashboardUrl">Step 2: Enter portal URL</label>
        <input type="url" id="dashboardUrl" placeholder="https://yourdashboard.com" value="${escapeAttr(cache.dashboardUrl)}" required>
        <p class="help-text">This is your dashboard/portal base URL.</p>
      </div>
      <div class="form-group">
        <label for="apiKey">API Key</label>
        <input type="password" id="apiKey" placeholder="••••••••" value="${escapeAttr(cache.apiKey)}" required>
      </div>
      <div style="display:flex;gap:8px;"><button id="backBtn" type="button" style="background:#6b7280;">Back</button><button id="nextBtn" type="button">Continue</button></div>
    `;
    document.getElementById("backBtn").onclick = () => {
      step = 1;
      renderStep();
    };
    document.getElementById("nextBtn").onclick = () => {
      const url = document.getElementById("dashboardUrl").value.trim();
      const key = document.getElementById("apiKey").value.trim();
      if (!url || !key) return renderStep("Portal URL and API key are required.");
      cache.dashboardUrl = url.replace(/\/$/, "");
      cache.apiKey = key;
      step = 3;
      renderStep();
      void runVerification();
    };
    return;
  }

  if (step === 3) {
    root.innerHTML = `
      <div style="text-align:center;padding:16px;">
        <div class="spinner" style="margin:0 auto 12px auto;"></div>
        <p>Step 3: Auto-verifying your access...</p>
      </div>
    `;
    return;
  }

  root.innerHTML = `
    <div style="text-align:center;padding:12px;">
      <h3>Step 4: Setup complete</h3>
      <p class="help-text">You can now launch your accessible tools from the popup.</p>
      <div id="toolList" style="margin-top:12px;text-align:left;"></div>
    </div>
    <button id="finishBtn" type="button">Finish</button>
  `;

  document.getElementById("finishBtn").onclick = () => window.close();
}

async function runVerification() {
  try {
    const result = await validateUser(cache.userEmail, cache.apiKey, cache.dashboardUrl);
    if (!result.valid) {
      step = 2;
      renderStep("Could not verify your account. Check your details.");
      return;
    }

    await setStorageData({
      userEmail: cache.userEmail,
      dashboardUrl: cache.dashboardUrl,
      apiKey: cache.apiKey,
    });

    step = 4;
    renderStep("✓ Setup verified successfully");

    const list = document.getElementById("toolList");
    const tools = result.allowedTools || [];
    list.innerHTML = tools.length
      ? `<ul style="padding-left:18px;">${tools.map((t) => `<li>${escapeHtml(t.name)}</li>`).join("")}</ul>`
      : "<p class='help-text'>No tools assigned yet.</p>";
  } catch (error) {
    step = 2;
    renderStep(`Verification failed: ${error.message}`);
  }
}

function escapeAttr(value) {
  return String(value || "").replace(/"/g, "&quot;");
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value || "");
  return div.innerHTML;
}
