/* OpenSparkcode prototype account layer.
   This file intentionally makes no network requests and has no real authentication.
   Demo account labels live in localStorage only; passwords are never stored or submitted. */
(() => {
  const ACCOUNT_KEY = "osc-demo-account";
  let account = readAccount();
  let root = null;
  let statusNode = null;
  let modal = null;
  let busy = false;
  let lastDemoSync = null;
  let syncTimer = null;

  function readAccount() {
    try {
      const saved = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || "null");
      return saved && saved.demo === true ? saved : null;
    } catch { return null; }
  }
  function saveAccount(value) {
    try {
      if (value) localStorage.setItem(ACCOUNT_KEY, JSON.stringify(value));
      else localStorage.removeItem(ACCOUNT_KEY);
    } catch {}
  }
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function button(label, className, callback) {
    const node = el("button", className, label);
    node.type = "button";
    node.addEventListener("click", callback);
    return node;
  }
  function setStatus(message, error = false) {
    if (!statusNode) return;
    statusNode.textContent = message;
    statusNode.classList.toggle("is-error", error);
  }
  function mountStyles() {
    const style = el("style");
    style.textContent = [
      ".osc-account-strip{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin:10px 0 18px;padding:14px 16px;border:1px solid #2b2b30;border-radius:16px;background:linear-gradient(115deg,#141414,#0c0c0d);color:#f6f6f4}",
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
      ".osc-demo-label{display:inline-block;margin-top:7px;font-size:10px;font-weight:700;letter-spacing:.09em;color:#ffb477;text-transform:uppercase}",
      "@media(max-width:560px){.osc-account-strip{align-items:flex-start;padding:12px}.osc-account-actions{width:100%}.osc-account-actions button{flex:1}.osc-auth-dialog{padding:20px}}",
      "@media(prefers-reduced-motion:reduce){.osc-auth-overlay{backdrop-filter:none}}"
    ].join("\n");
    document.head.append(style);
  }
  function mountBanner() {
    const host = document.querySelector("#accountPrototypeCard");
    if (!host || root) return;
    root = el("section", "osc-account-strip");
    root.setAttribute("aria-label", "Prototype account and sync controls");
    const copy = el("div", "osc-account-copy");
    copy.append(el("div", "osc-account-orb", "O"));
    const text = el("div");
    text.append(el("div", "osc-account-title", "OpenSparkcode account"));
    text.append(el("div", "osc-account-description", "Sign in to preview the account experience, or continue as a guest. All actions here are simulated inside this app prototype."));
    text.append(el("div", "osc-demo-label", "Demo only · no real account or cloud sync"));
    statusNode = el("div", "osc-sync-status");
    text.append(statusNode);
    copy.append(text);
    root.append(copy, el("div", "osc-account-actions"));
    host.replaceChildren(root);
    renderBanner();
    if (account) setStatus("Demo account · " + account.label + " · stored in this browser only");
    else setStatus("Guest mode · local only · no sign-in required");
  }
  function renderBanner() {
    if (!root) return;
    const actions = root.querySelector(".osc-account-actions");
    actions.replaceChildren();
    if (account) {
      actions.append(button("Demo sync", "osc-primary", () => simulateSync(true)));
      actions.append(button("Sign out", "", signOutDemo));
      if (statusNode && !statusNode.textContent) setStatus("Signed in to a simulated demo account · local only");
    } else {
      actions.append(button("Sign in (demo)", "osc-primary", openAuthModal));
      actions.append(button("Continue as guest", "", () => {
        account = null;
        saveAccount(null);
        closeModal();
        setStatus("Guest mode · local only · no sync");
        renderBanner();
      }));
    }
  }
  function openAuthModal() {
    closeModal();
    modal = el("div", "osc-auth-overlay");
    const dialog = el("section", "osc-auth-dialog");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "osc-demo-auth-title");
    const heading = el("h2", "", "Sign in to OpenSparkcode");
    heading.id = "osc-demo-auth-title";
    dialog.append(heading);
    dialog.append(el("p", "", "This is a clickable prototype. Use any example email and a throwaway demo value to preview login states. Nothing is sent to a server, and there is no real account."));
    const message = el("div", "osc-auth-message");
    message.setAttribute("role", "status");
    const emailLabel = el("label", "", "Email for the demo account");
    emailLabel.htmlFor = "osc-demo-email";
    const email = el("input");
    email.id = "osc-demo-email";
    email.type = "email";
    email.autocomplete = "off";
    email.placeholder = "demo@example.com";
    email.required = true;
    const passLabel = el("label", "", "Demo password (not stored or sent)");
    passLabel.htmlFor = "osc-demo-password";
    const password = el("input");
    password.id = "osc-demo-password";
    password.type = "password";
    password.autocomplete = "off";
    password.placeholder = "Any throwaway value";
    password.required = true;
    const actions = el("div", "osc-auth-actions");
    actions.append(button("Sign in (demo)", "osc-primary", () => {
      if (!email.checkValidity()) { email.reportValidity(); return; }
      if (!password.value.trim()) { message.textContent = "Type any throwaway demo value. Do not use a real password."; password.focus(); return; }
      account = { demo: true, provider: "email-demo", label: email.value.trim(), signedInAt: new Date().toISOString() };
      password.value = "";
      saveAccount(account);
      closeModal();
      renderBanner();
      setStatus("Signed in as " + account.label + " · demo only · no server connection");
      simulateSync(true);
    }));
    dialog.append(emailLabel, email, passLabel, password, message, actions, el("div", "osc-divider"));
    dialog.append(el("p", "", "Or preview a social sign-in without opening GitHub or granting permissions."));
    const social = el("div", "osc-auth-actions");
    social.append(button("Continue with GitHub (demo)", "", () => {
      account = { demo: true, provider: "github-demo", label: "GitHub demo account", signedInAt: new Date().toISOString() };
      saveAccount(account);
      closeModal();
      renderBanner();
      setStatus("GitHub sign-in simulated · no OAuth request or account connection");
      simulateSync(true);
    }));
    social.append(button("Close", "osc-quiet", closeModal));
    dialog.append(social);
    modal.append(dialog);
    modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
    modal.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
    document.body.append(modal);
    email.focus();
  }
  function closeModal() {
    if (!modal) return;
    modal.remove();
    modal = null;
  }
  function localSessionCount() {
    try {
      const api = window.OpenSparkcodeApp;
      if (api?.getSyncSessions) return api.getSyncSessions().length;
      const saved = JSON.parse(localStorage.getItem("osc-sessions") || "[]");
      return Array.isArray(saved) ? saved.filter(s => s && !s.sample).length : 0;
    } catch { return 0; }
  }
  function simulateSync(showToast) {
    if (!account || busy) return;
    if (syncTimer) clearTimeout(syncTimer);
    busy = true;
    renderBanner();
    setStatus("Simulating sync… no network request is being made");
    syncTimer = setTimeout(() => {
      busy = false;
      lastDemoSync = new Date();
      const count = localSessionCount();
      setStatus("Demo sync complete · " + count + " local session" + (count === 1 ? "" : "s") + " in this browser · nothing uploaded");
      renderBanner();
      if (showToast) {
        const toast = document.querySelector("#toast");
        if (toast) {
          toast.textContent = "Demo sync complete · simulated only";
          toast.classList.remove("hidden");
        }
      }
    }, 650);
  }
  function signOutDemo() {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = null;
    busy = false;
    account = null;
    saveAccount(null);
    lastDemoSync = null;
    renderBanner();
    setStatus("Signed out · local sessions remain on this browser");
  }
  function installListeners() {
    window.addEventListener("osc:sessions-updated", () => {
      if (account && !busy) setStatus("Local session updated · use Demo sync to preview the sync flow");
    });
    window.addEventListener("storage", event => {
      if (event.key === ACCOUNT_KEY) {
        account = readAccount();
        renderBanner();
        setStatus(account ? "Demo account restored in this browser · no server connection" : "Guest mode · local only");
      }
    });
  }
  function boot() {
    mountStyles();
    mountBanner();
    installListeners();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
