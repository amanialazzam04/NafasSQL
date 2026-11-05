"use strict";
document.addEventListener("DOMContentLoaded", function () {
  const key = "nafas.frontendDemoAccounts.v1";
  const activeKey = "nafas.activeDemoAccount.v1";
  const panel = document.querySelector(".promotion-panel");
  if (!panel) return;
  let active = null, accounts = {};
  try { active = JSON.parse(sessionStorage.getItem(activeKey) || "null"); } catch (error) {}
  if (!active || active.role !== "therapist") { panel.hidden = true; return; }
  try { accounts = JSON.parse(localStorage.getItem(key) || "{}"); } catch (error) {}
  if (!accounts || typeof accounts !== "object" || Array.isArray(accounts)) accounts = {};
  if (active.email === "therapist.demo@nafas.local" && !accounts[active.email]) {
    accounts[active.email] = { name: "Demo Therapist", role: "therapist", therapistApplication: { status: "approved", demo: true, details: { name: "Demo Therapist", title: "Therapist", specialty: "General wellbeing" } } };
  }
  const account = accounts[active.email];
  if (!account || account.role !== "therapist" || account.therapistApplication?.status !== "approved") { panel.hidden = true; return; }
  const consent = document.getElementById("directory-listing-consent");
  const status = document.getElementById("promotion-status");
  const expiration = document.getElementById("promotion-expiration");
  const button = document.getElementById("promotion-request");
  const feedback = document.getElementById("promotion-feedback");
  function save() { try { localStorage.setItem(key, JSON.stringify(accounts)); return true; } catch (error) { return false; } }
  function render(message) {
    const listing = account.therapistDirectoryListing || { enabled: false };
    const promotion = account.therapistPromotion || { status: "not-requested" };
    consent.checked = listing.enabled === true;
    if (promotion.status === "active" && promotion.expiresAt && new Date(promotion.expiresAt).getTime() <= Date.now()) {
      promotion.status = "expired"; promotion.updatedAt = new Date().toISOString(); account.therapistPromotion = promotion; save();
    }
    const labels = { "not-requested": "Not requested", "pending-review": "Pending Admin review", active: "Sponsored · active", expired: "Expired", cancelled: "Cancelled" };
    status.textContent = labels[promotion.status] || "Not requested";
    expiration.textContent = promotion.status === "active" ? `Sponsored placement expires ${new Date(promotion.expiresAt).toLocaleString()}. No payment was processed.` : "Promotion pricing is TBD. No payment processing or automatic renewal is connected.";
    button.disabled = !listing.enabled || ["pending-review", "active"].includes(promotion.status);
    button.textContent = promotion.status === "pending-review" ? "Awaiting Admin review" : promotion.status === "active" ? "Sponsored placement active" : "Request monthly Sponsored placement · simulated";
    if (message) feedback.textContent = message;
  }
  consent.addEventListener("change", function () {
    account.therapistDirectoryListing = { enabled: consent.checked, updatedAt: new Date().toISOString() };
    if (!consent.checked && account.therapistPromotion && ["pending-review", "active"].includes(account.therapistPromotion.status)) {
      account.therapistPromotion.status = "cancelled"; account.therapistPromotion.updatedAt = new Date().toISOString();
    }
    if (!save()) { feedback.textContent = "Browser storage is unavailable; the directory choice was not saved."; consent.checked = !consent.checked; return; }
    render(consent.checked ? "Directory consent saved in this browser. Only your professional name, title, and specialization are listed." : "Your profile is hidden from listings. Any simulated promotion request was cancelled.");
  });
  button.addEventListener("click", function () {
    if (!account.therapistDirectoryListing?.enabled || account.therapistApplication?.status !== "approved") {
      feedback.textContent = "Admin approval and directory consent are required before requesting a promotion."; return;
    }
    account.therapistPromotion = { status: "pending-review", plan: "monthly", requestedAt: new Date().toISOString(), priceLabel: "TBD", simulated: true, paymentStatus: "not-processed" };
    if (!save()) { feedback.textContent = "Browser storage is unavailable; the promotion request was not saved."; return; }
    render("Monthly Sponsored placement request saved for Admin review. No payment was made.");
  });
  panel.hidden = false;
  render();
});
