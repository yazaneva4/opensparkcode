const CONFIG = window.OPENSPARK_AUTH_CONFIG || {};
const PAGE_SIZE = 500;
const SESSION_TABLE = "opensparkcode_sessions";
const PREFS_TABLE = "opensparkcode_preferences";
let client = null, currentUser = null, busy = false, applyingCloud = false;
let debounceTimer = null, intervalTimer = null, root = null, statusNode = null, modal = null;

const configured = () => Boolean(CONFIG.supabaseUrl && CONFIG.supabasePublishableKey);
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const button = (label, className, onClick) => {
  const b = el("button", className, label);
  b.type = "button";
  b.addEventListener("click", onClick);
  return b;
};
const readJSON = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) || "null") || fallback; }
  catch { return fallback; }
};
const appBridge = () => window.OpenSparkcodeApp || null;

function setStatus(message, bad) {
  if (!statusNode) return;
  statusNode.textContent = message;
  statusNode.classList.toggle("is-error", Boolean(bad));
}
function mountStyles() {
  const style = el("style");
  style.textContent = [
    ".osc-account-strip{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin:0 0 16px;padding:14px 16px;border:1px solid #2b2b30;border-radius:16px;background:linear-gradient(115deg,#141414,#0c0c0d);color:#f6f6f4}",
    ".osc-account-copy{display:flex;align-items:flex-start;gap:12px;min-width:0;flex:1}",
    ".osc-account-orb{width:36px;height:36px;flex:0 0 36px;border:1px solid #ff7a1a66;border-radius:12px;background:#ff7a1a18;display:grid;place-items:center;color:#ff8a2b;font-weight:700}",
    ".osc-account-title{font-weight:700;font-size:15px;letter-spacing:.01em}",
    ".osc-account-description{margin-top:3px;color:#a7a7ad;font-size:13px;line-height:1.45}",
    ".osc-account-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}",
    ".osc-account-actions button,.osc-auth-dialog button{min-height:42px;padding:9px 14px;border-radius:10px;border:1px solid #34343a;background:#19191d;color:#f6f6f4;font:600 14px 'Hanken Grotesk',system-ui,sans-serif;cursor:pointer}",
    ".osc-account-actions .osc-primary,.osc-auth-dialog .osc-primary{background:#ff7a1a;border-color:#ff7a1a;color:#141414}",
    ".osc-account-actions button:focus-visible,.osc-auth-dialog button:focus-visible,.osc-auth-dialog input:focus-visible{outline:3px solid #ff9b52;outline-offset:2px}",
    ".osc-sync-status{font-size:12px;color:#9b9ba3;margin-top:5px}",
    ".osc-sync-status.is-error{color:#ffb4a6}",
    ".osc-auth-overlay{position:fixed;z-index:2147483000;inset:0;display:grid;place-items:center;padding:18px;background:#000b;backdrop-filter:blur(8px)}",
    ".osc-auth-dialog{width:min(100%,440px);max-height:min(88vh,720px);overflow:auto;border:1px solid #333339;border-radius:20px;background:#101012;color:#f6f6f4;padding:24px;box-shadow:0 24px 90px #0009}",
    ".osc-auth-dialog h2{font:700 26px 'Chakra Petch',system-ui,sans-serif;margin:0 0 8px}",
    ".osc-auth-dialog p{color:#aaaab2;line-height:1.5;font-size:14px;margin:0 0 16px}",
    ".osc-auth-dialog label{display:block;font-size:13px;color:#d1d1d5;margin:12px 0 6px}",
    ".osc-auth-dialog input{display:block;width:100%;min-height:44px;padding:10px 12px;border:1px solid #3a3a42;border-radius:10px;background:#09090b;color:#fff;font:16px system-ui,sans-serif}",
    ".osc-auth-dialog .osc-auth-message{min-height:20px;color:#ffbd8d;font-size:13px;margin:12px 0}",
    ".osc-auth-dialog .osc-auth-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}",
    ".osc-auth-dialog .osc-divider{height:1px;background:#2d2d32;margin:18px 0}",
    ".osc-auth-dialog .osc-quiet{color:#babac0;background:transparent}",
    "@media(max-width:560px){.osc-account-strip{align-items:flex-start;padding:12px}.osc-account-actions{width:100%}.osc-account-actions button{flex:1}.osc-auth-dialog{padding:20px}}",
    "@media(prefers-reduced-motion:reduce){.osc-auth-overlay{backdrop-filter:none}}"
  ].join("\n");
  document.head.append(style);
}
function mountBanner() {
  const stage = document.querySelector("#stage");
  if (!stage || root) return;
  root = el("section", "osc-account-strip");
  root.setAttribute("aria-label", "Optional account sync");
  const copy = el("div", "osc-account-copy");
  copy.append(el("div", "osc-account-orb", "O"));
  const text = el("div");
  text.append(el("div", "osc-account-title", "Your sessions, on desktop and phone"));
  text.append(el("div", "osc-account-description", "Sign in to sync session history across devices, or stay a guest with local-only storage."));
  statusNode = el("div", "osc-sync-status", configured()
    ? "Guest mode · cloud sync available after sign-in"
    : "Guest mode · local only · account backend not configured");
  text.append(statusNode);
  copy.append(text);
  const actions = el("div", "osc-account-actions");
  root.append(copy, actions);
  stage.parentNode.insertBefore(root, stage);
  renderBanner();
}
function renderBanner() {
  if (!root) return;
  const actions = root.querySelector(".osc-account-actions");
  actions.replaceChildren();
  if (currentUser) {
    actions.append(button("Sync now", "osc-primary", () => syncNow(true)));
    actions.append(button("Sign out", "", () => signOut()));
    if (!/^(Syncing|Synced|Sync paused)/.test(statusNode?.textContent || "")) {
      setStatus("Signed in as " + (currentUser.email || "OpenSparkcode account"), false);
    }
  } else {
    actions.append(button("Sign in / sync", "osc-primary", () => openAuthModal()));
    actions.append(button("Continue as guest", "", () => {
      try { localStorage.setItem("osc-account-mode", "guest"); } catch {}
      closeModal();
      setStatus("Guest mode · this browser only; cloud sync is off", false);
    }));
  }
}
async function getClient() {
  if (!configured()) throw new Error("Account sync is not configured for this deployment yet.");
  if (client) return client;
  const url = new URL(CONFIG.supabaseUrl);
  if (!(url.protocol === "https:" || url.hostname === "localhost" || url.hostname === "127.0.0.1")) {
    throw new Error("The account service URL must use HTTPS.");
  }
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  client = createClient(CONFIG.supabaseUrl, CONFIG.supabasePublishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  client.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    renderBanner();
    if (currentUser) queueMicrotask(() => syncNow(false));
    else stopPolling();
  });
  return client;
}
function openAuthModal() {
  closeModal();
  modal = el("div", "osc-auth-overlay");
  modal.setAttribute("role", "presentation");
  const dialog = el("section", "osc-auth-dialog");
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "osc-auth-title");
  const heading = el("h2", "", "Sync with OpenSparkcode");
  heading.id = "osc-auth-title";
  dialog.append(heading, el("p", "", "Your account keeps session history available when you sign in on your phone or desktop. Guests still work locally with no account and no cloud sync."));
  if (!configured()) {
    dialog.append(el("p", "", "Sign-in is not active in this deployment yet. A dedicated OpenSparkcode sync project and its public client config must be set up first. No demo login is used, and your local sessions remain available."));
    const actions = el("div", "osc-auth-actions");
    actions.append(button("Continue as guest", "osc-primary", () => {
      try { localStorage.setItem("osc-account-mode", "guest"); } catch {}
      closeModal();
      setStatus("Guest mode · local only", false);
    }));
    actions.append(button("Close", "osc-quiet", closeModal));
    dialog.append(actions);
  } else {
    const emailLabel = el("label", "", "Email");
    emailLabel.htmlFor = "osc-auth-email";
    const email = el("input");
    email.id = "osc-auth-email"; email.name = "email"; email.type = "email";
    email.autocomplete = "email"; email.required = true; email.placeholder = "you@example.com";
    const passLabel = el("label", "", "Password");
    passLabel.htmlFor = "osc-auth-password";
    const password = el("input");
    password.id = "osc-auth-password"; password.name = "password";
    password.type = "password"; password.autocomplete = "current-password";
    password.required = true; password.minLength = 8; password.placeholder = "At least 8 characters";
    const message = el("div", "osc-auth-message");
    message.setAttribute("role", "status");
    const actions = el("div", "osc-auth-actions");
    actions.append(
      button("Sign in", "osc-primary", () => submitEmail("signin", email.value, password.value, message)),
      button("Create account", "", () => submitEmail("signup", email.value, password.value, message))
    );
    dialog.append(emailLabel, email, passLabel, password, message, actions, el("div", "osc-divider"));
    dialog.append(el("p", "", "GitHub sign-in is optional and needs to be enabled in the OpenSparkcode auth project."));
    const socialActions = el("div", "osc-auth-actions");
    socialActions.append(button("Continue with GitHub", "", async () => {
      try {
        const api = await getClient();
        const { error } = await api.auth.signInWithOAuth({
          provider: "github",
          options: { redirectTo: window.location.href, scopes: "read:user user:email" }
        });
        if (error) throw error;
      } catch (e) { message.textContent = humanError(e); }
    }));
    socialActions.append(button("Continue as guest", "osc-quiet", () => {
      try { localStorage.setItem("osc-account-mode", "guest"); } catch {}
      closeModal();
      setStatus("Guest mode · local only", false);
    }));
    dialog.append(socialActions, el("p", "osc-auth-message", "This sync layer excludes API keys, OAuth tokens, VPS credentials, and custom endpoint URLs."));
  }
  modal.append(dialog);
  modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", onEscape);
  document.body.append(modal);
  const first = modal.querySelector("input");
  if (first) first.focus();
}
function onEscape(event) {
  if (event.key === "Escape") closeModal();
}
function closeModal() {
  if (!modal) return;
  modal.remove();
  modal = null;
  document.removeEventListener("keydown", onEscape);
}
function humanError(error) {
  const text = String(error?.message || "Something went wrong.");
  if (/invalid login credentials/i.test(text)) return "Those sign-in details were not accepted.";
  if (/email not confirmed/i.test(text)) return "Confirm your email first, then sign in.";
  if (/provider is not enabled|unsupported provider/i.test(text)) return "GitHub sign-in is not enabled for this account project yet.";
  if (/fetch|network/i.test(text)) return "Could not reach the account service. Check your connection and try again.";
  return text.slice(0, 240);
}
async function submitEmail(kind, email, password, message) {
  if (!email || !password || password.length < 8) {
    message.textContent = "Enter a valid email and a password with at least 8 characters.";
    return;
  }
  message.textContent = kind === "signin" ? "Signing in…" : "Creating your account…";
  try {
    const api = await getClient();
    const result = kind === "signin"
      ? await api.auth.signInWithPassword({ email: email.trim(), password })
      : await api.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.href } });
    if (result.error) throw result.error;
    if (kind === "signup" && !result.data.session) {
      message.textContent = "Account created. Check your email if email confirmation is enabled.";
    } else {
      message.textContent = "Signed in. Loading your cloud sessions…";
      closeModal();
      currentUser = result.data.user || result.data.session?.user || currentUser;
      renderBanner();
      await syncNow(true);
    }
  } catch (e) {
    message.textContent = humanError(e);
  }
}
function stopPolling() {
  if (intervalTimer) clearInterval(intervalTimer);
  intervalTimer = null;
}
function startPolling() {
  stopPolling();
  intervalTimer = setInterval(() => {
    if (document.visibilityState === "visible" && navigator.onLine) syncNow(false);
  }, 30000);
}
function queueSync() {
  if (!currentUser || applyingCloud) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => syncNow(false), 900);
}
function localSessions() {
  const api = appBridge();
  if (api?.getSyncSessions) return api.getSyncSessions();
  return readJSON("osc-sessions", []).filter(x => x && !x.sample);
}
function mergeSessions(local, remote) {
  const map = new Map();
  for (const session of (local || [])) {
    if (session && session.id && !session.sample) map.set(String(session.id), session);
  }
  for (const item of (remote || [])) {
    const data = item && (item.session_data || item);
    if (!data || !data.id || data.sample) continue;
    const id = String(data.id);
    const existing = map.get(id);
    const localTime = Number(existing?._oscUpdatedAt || 0);
    const remoteTime = Number(data._oscUpdatedAt || (item.updated_at ? Date.parse(item.updated_at) : 0));
    if (!existing || remoteTime >= localTime) {
      map.set(id, { ...data, _oscUpdatedAt: remoteTime || localTime || Date.now() });
    }
  }
  return [...map.values()];
}
async function fetchAllSessions(api, userId) {
  const rows = [];
  for (let start = 0; ; start += PAGE_SIZE) {
    const end = start + PAGE_SIZE - 1;
    const { data, error } = await api.from(SESSION_TABLE)
      .select("session_id,session_data,updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: true })
      .range(start, end);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}
async function writeSessions(api, userId, sessions) {
  const payload = (sessions || []).filter(s => s && s.id && !s.sample).map(s => {
    const timestamp = Number(s._oscUpdatedAt || Date.now());
    return {
      user_id: userId,
      session_id: String(s.id).slice(0, 128),
      session_data: s,
      updated_at: new Date(timestamp).toISOString()
    };
  });
  for (let i = 0; i < payload.length; i += 100) {
    const { error } = await api.from(SESSION_TABLE).upsert(payload.slice(i, i + 100), { onConflict: "user_id,session_id" });
    if (error) throw error;
  }
}
function localPreferences() {
  const api = appBridge();
  if (api?.getSyncPreferences) return api.getSyncPreferences();
  const stored = readJSON("osc-providers", {});
  return { connected: stored.connected || {}, provider: stored.provider || "", model: stored.model || "", customModel: stored.custom?.model || "" };
}
function safePreferences(value) {
  return {
    connected: value?.connected && typeof value.connected === "object" ? value.connected : {},
    provider: typeof value?.provider === "string" ? value.provider.slice(0, 100) : "",
    model: typeof value?.model === "string" ? value.model.slice(0, 160) : "",
    customModel: typeof value?.customModel === "string" ? value.customModel.slice(0, 160) : ""
  };
}
async function syncNow(showToast) {
  if (busy || !currentUser || !configured()) return;
  busy = true;
  renderBanner();
  setStatus("Syncing session history…", false);
  try {
    const api = await getClient();
    const uid = currentUser.id;
    const [rows, prefsResult] = await Promise.all([
      fetchAllSessions(api, uid),
      api.from(PREFS_TABLE).select("preferences,updated_at").eq("user_id", uid).maybeSingle()
    ]);
    if (prefsResult.error) throw prefsResult.error;
    const merged = mergeSessions(localSessions(), rows);
    applyingCloud = true;
    const app = appBridge();
    if (app?.mergeCloudSessions) app.mergeCloudSessions(merged);
    else {
      try { localStorage.setItem("osc-sessions", JSON.stringify(merged)); } catch {}
    }
    const localPrefs = safePreferences(localPreferences());
    const cloudPrefs = safePreferences(prefsResult.data?.preferences);
    const combinedPrefs = prefsResult.data
      ? {
          connected: { ...localPrefs.connected, ...cloudPrefs.connected },
          provider: cloudPrefs.provider || localPrefs.provider,
          model: cloudPrefs.model || localPrefs.model,
          customModel: cloudPrefs.customModel || localPrefs.customModel
        }
      : localPrefs;
    if (app?.applySyncPreferences) app.applySyncPreferences(combinedPrefs);
    applyingCloud = false;
    await writeSessions(api, uid, localSessions());
    const prefPayload = { user_id: uid, preferences: combinedPrefs, updated_at: new Date().toISOString() };
    const { error: prefError } = await api.from(PREFS_TABLE).upsert(prefPayload, { onConflict: "user_id" });
    if (prefError) throw prefError;
    setStatus("Synced · session history is available on this device and your other signed-in devices", false);
    startPolling();
    if (showToast) {
      const toast = document.querySelector("#toast");
      if (toast) { toast.textContent = "Session sync complete"; toast.classList.remove("hidden"); }
    }
  } catch (e) {
    applyingCloud = false;
    const message = /relation .* does not exist|could not find the table|schema cache/i.test(String(e?.message || ""))
      ? "Sign-in reached the account service, but the sync tables have not been installed yet."
      : humanError(e);
    setStatus("Sync paused · " + message, true);
  } finally {
    busy = false;
    renderBanner();
  }
}
async function signOut() {
  try {
    if (client) {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    }
  } catch (e) {
    setStatus(humanError(e), true);
    return;
  }
  currentUser = null;
  stopPolling();
  setStatus("Signed out · your local copy remains on this browser", false);
  renderBanner();
}
function installListeners() {
  window.addEventListener("osc:sessions-updated", queueSync);
  window.addEventListener("osc:preferences-updated", queueSync);
  window.addEventListener("online", () => { if (currentUser) syncNow(false); });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && currentUser) syncNow(false);
  });
  window.addEventListener("storage", event => {
    if (event.key === "osc-sessions" || event.key === "osc-providers") queueSync();
  });
}
async function boot() {
  mountStyles();
  mountBanner();
  installListeners();
  if (!configured()) return;
  try {
    const api = await getClient();
    const { data, error } = await api.auth.getSession();
    if (error) throw error;
    currentUser = data.session?.user || null;
    renderBanner();
    if (currentUser) await syncNow(false);
  } catch (e) {
    setStatus("Account service unavailable · " + humanError(e), true);
  }
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
else void boot();
