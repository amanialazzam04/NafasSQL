"use strict";
document.addEventListener("DOMContentLoaded", function () {
  const root = document.getElementById("therapist-application-queue");
  const promotionRoot = document.getElementById("therapist-promotion-queue");
  const key = "nafas.frontendDemoAccounts.v1";
  const activeKey = "nafas.activeDemoAccount.v1";
  let active;
  try { active = JSON.parse(sessionStorage.getItem(activeKey) || "null"); } catch (error) {}
  if (!active || active.role !== "admin") {
    root.textContent = "Admin demo sign-in is required to review applications.";
    return;
  }
  function readAccounts() { try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch (error) { return {}; } }
  function saveStatus(email, status, note) {
    const accounts = readAccounts();
    const account = accounts[email];
    if (!account) return;
    account.therapistApplication = { ...(account.therapistApplication || {}), status, note: note || "", reviewedAt: new Date().toISOString() };
    accounts[email] = account;
    localStorage.setItem(key, JSON.stringify(accounts));
    render();
  }
  function renderPromotions() {
    if (!promotionRoot) return;
    promotionRoot.replaceChildren();
    const accounts = readAccounts();
    const eligible = Object.entries(accounts).filter(([, account]) =>
      account.role === "therapist" && account.therapistApplication?.status === "approved" && account.therapistDirectoryListing?.enabled === true && account.therapistPromotion && ["pending-review", "active"].includes(account.therapistPromotion.status)
    );
    if (!eligible.length) {
      const empty = document.createElement("p"); empty.className = "empty-state"; empty.textContent = "No eligible Sponsored promotion requests. A therapist must be approved and opt in to directory listing first."; promotionRoot.append(empty); return;
    }
    eligible.forEach(([email, account]) => {
      const promotion = account.therapistPromotion;
      if (promotion.status === "active" && promotion.expiresAt && new Date(promotion.expiresAt).getTime() <= Date.now()) {
        promotion.status = "expired"; promotion.updatedAt = new Date().toISOString();
        localStorage.setItem(key, JSON.stringify(accounts));
      }
      if (promotion.status === "expired") return;
      const card = document.createElement("article"); card.className = "promotion-admin-row";
      const heading = document.createElement("h3"); heading.textContent = account.therapistApplication.details?.name || account.name || email;
      const status = document.createElement("p"); status.textContent = `Promotion status: ${promotion.status === "active" ? "Sponsored · active" : "Pending Admin promotion review"}`;
      const date = document.createElement("p"); date.textContent = promotion.expiresAt ? `Expires: ${new Date(promotion.expiresAt).toLocaleString()}` : "Monthly placement: 30 days from simulated activation";
      const note = document.createElement("p"); note.textContent = "Paid placement is a visibility option only. It does not change professional approval or qualifications.";
      card.append(heading, status, date, note);
      const actions = document.createElement("div"); actions.className = "admin-toolbar";
      const button = document.createElement("button"); button.type = "button";
      if (promotion.status === "pending-review") {
        button.className = "primary-button"; button.textContent = "Activate 30-day Sponsored placement · simulated";
        button.addEventListener("click", function () {
          const latest = readAccounts(), current = latest[email];
          if (!current || current.role !== "therapist" || current.therapistApplication?.status !== "approved" || current.therapistDirectoryListing?.enabled !== true || current.therapistPromotion?.status !== "pending-review") return;
          const startsAt = new Date();
          current.therapistPromotion = { ...current.therapistPromotion, status: "active", startsAt: startsAt.toISOString(), expiresAt: new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), label: "Sponsored", simulated: true, paymentStatus: "not-processed", updatedAt: startsAt.toISOString() };
          localStorage.setItem(key, JSON.stringify(latest)); renderPromotions();
        });
      } else {
        button.className = "secondary-button"; button.textContent = "End Sponsored placement";
        button.addEventListener("click", function () {
          const latest = readAccounts(), current = latest[email];
          if (!current || current.therapistApplication?.status !== "approved" || current.therapistPromotion?.status !== "active") return;
          current.therapistPromotion.status = "expired"; current.therapistPromotion.updatedAt = new Date().toISOString();
          localStorage.setItem(key, JSON.stringify(latest)); renderPromotions();
        });
      }
      actions.append(button); card.append(actions); promotionRoot.append(card);
    });
  }
  function render() {
    root.replaceChildren();
    const pending = Object.entries(readAccounts()).filter(([, account]) => account.role === "therapist" && account.therapistApplication && account.therapistApplication.status !== "not-submitted");
    if (!pending.length) {
      const empty = document.createElement("div"); empty.className = "empty-state";
      const title = document.createElement("h3"); title.textContent = "No therapist applications yet";
      const copy = document.createElement("p"); copy.textContent = "Therapist demo applicants will appear here after submitting their professional details.";
      empty.append(title, copy); root.append(empty); renderPromotions(); return;
    }
    pending.forEach(([email, account]) => {
      const application = account.therapistApplication;
      const card = document.createElement("article"); card.className = "panel";
      const title = document.createElement("h3"); title.textContent = account.name || application.details?.name || email;
      const status = document.createElement("p"); status.textContent = `Status: ${application.status || "not submitted"}`;
      const details = document.createElement("dl");
      const entries = application.details ? Object.entries(application.details) : [];
      entries.forEach(([label, value]) => { const dt = document.createElement("dt"); dt.textContent = label.replace(/[A-Z]/g, c => ` ${c.toLowerCase()}`); const dd = document.createElement("dd"); dd.textContent = String(value || ""); details.append(dt, dd); });
      const note = document.createElement("p"); note.textContent = application.note ? `Admin note: ${application.note}` : "";
      card.append(title, status, details, note);
      const actions = document.createElement("div"); actions.className = "admin-toolbar";
      const action = (label, state, primary) => { const button = document.createElement("button"); button.type = "button"; button.className = primary ? "primary-button" : "secondary-button"; button.textContent = label; button.addEventListener("click", () => { let reason = ""; if (state === "more-info" || state === "rejected") reason = window.prompt(state === "rejected" ? "Optional reason for rejection:" : "What information is needed?") || ""; saveStatus(email, state, reason); }); actions.append(button); };
      if (application.status === "pending") { action("Approve", "approved", true); action("Reject", "rejected", false); action("Request more information", "more-info", false); }
      card.append(actions); root.append(card);
    });
    renderPromotions();
  }
  render();
});
