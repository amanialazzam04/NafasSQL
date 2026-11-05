"use strict";
document.addEventListener("DOMContentLoaded", function () {
  const key = "nafas.frontendDemoAccounts.v1";
  const activeKey = "nafas.activeDemoAccount.v1";
  let active = null;
  let accounts = {};
  try { active = JSON.parse(sessionStorage.getItem(activeKey) || "null"); } catch (error) {}
  if (!active || active.role !== "user") return;
  try {
    const stored = JSON.parse(localStorage.getItem(key) || "{}");
    if (stored && typeof stored === "object" && !Array.isArray(stored)) accounts = stored;
  } catch (error) {}
  const account = accounts[active.email];
  if (!account) return;
  // Existing and predefined demo accounts without trial metadata remain Free.
  account.subscription = account.subscription || { status: "free", plan: "free", simulated: true, priceLabel: "TBD" };
  const subscription = account.subscription;

  const dashboard = document.getElementById("subscription-dashboard-summary");
  const profile = document.getElementById("subscription-profile-summary");
  const action = document.getElementById("subscription-action");
  const feedback = document.getElementById("subscription-feedback");
  const premiumCopy = document.querySelector("[data-premium-feature-copy]");
  if (!dashboard && !profile) return;
  let timer = null;

  function writeAccount() {
    try { localStorage.setItem(key, JSON.stringify(accounts)); return true; }
    catch (error) { return false; }
  }
  function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }
  function render() {
    const now = Date.now();
    const trialExpired = subscription.status === "trial" && new Date(subscription.trialExpiresAt).getTime() <= now;
    const paidPeriodExpired = subscription.status === "active" && subscription.periodEndsAt && new Date(subscription.periodEndsAt).getTime() <= now;
    if (trialExpired || paidPeriodExpired) {
      subscription.expiredSource = trialExpired ? "trial" : "subscription";
      subscription.status = "expired";
      subscription.plan = "free";
      subscription.expiredAt = trialExpired ? subscription.trialExpiresAt : subscription.periodEndsAt;
      if (!writeAccount()) {
        // Treat the account as Free in this view even if browser storage is unavailable.
        subscription.status = "expired";
        subscription.plan = "free";
      }
    }
    const onTrial = subscription.status === "trial" && subscription.plan === "premium";
    const statusText = onTrial ? "Premium trial" : subscription.status === "active" ? "Premium · simulated" : "Free plan";
    const expiry = onTrial ? subscription.trialExpiresAt : subscription.periodEndsAt;
    let remaining = "";
    if (onTrial) {
      const milliseconds = Math.max(0, new Date(expiry).getTime() - now);
      const hours = Math.floor(milliseconds / 3600000);
      const minutes = Math.floor((milliseconds % 3600000) / 60000);
      remaining = hours >= 24 ? `${Math.floor(hours / 24)} days, ${hours % 24} hours remaining` : `${hours} hours, ${minutes} minutes remaining`;
    }
    const description = onTrial
      ? `Your simulated Premium trial ends ${formatDate(expiry)}. ${remaining}. No payment method is saved and no automatic charge will occur.`
      : subscription.status === "expired"
        ? `Your ${subscription.expiredSource === "subscription" ? "Premium period" : "trial"} ended ${formatDate(subscription.expiredAt || subscription.trialExpiresAt)}. You are now on the Free plan. Your journal, basic mood tracking, wellness resources, and safety information remain available.`
        : subscription.status === "active"
          ? `Premium is simulated for this prototype${expiry ? ` through ${formatDate(expiry)}` : ""}. No payment was taken or automatic billing set up.`
          : subscription.status === "cancelled"
            ? "Your simulated subscription is cancelled. Free features and all saved personal data remain available."
            : "You are on the Free plan. Subscription pricing is TBD. No payment processing is connected.";
    [dashboard, profile].filter(Boolean).forEach(function (root) {
      const status = root.querySelector("[data-subscription-status]");
      const copy = root.querySelector("[data-subscription-description]");
      if (status) status.textContent = statusText;
      if (copy) copy.textContent = description;
      root.dataset.subscriptionState = subscription.status || "free";
      root.hidden = false;
    });
    if (action) {
      const isActive = subscription.status === "active" && subscription.plan === "premium";
      action.textContent = isActive ? "Simulate cancellation · no payment" : "Simulate Premium access · no payment";
      action.dataset.action = isActive ? "cancel" : "activate";
    }
    if (premiumCopy) premiumCopy.textContent = onTrial || (subscription.status === "active" && subscription.plan === "premium")
      ? "Premium access is active in this simulated trial. This advanced insight preview is not computed from your mood data; basic mood tracking remains available on every plan."
      : "This Premium feature is a preview and is not currently computed. Basic mood tracking remains available on Free. Pricing is TBD.";
  }
  render();
  if (action) action.addEventListener("click", function () {
    const now = new Date();
    if (subscription.status === "active" && subscription.plan === "premium") {
      subscription.status = "cancelled";
      subscription.plan = "free";
      subscription.cancelledAt = now.toISOString();
      subscription.autoRenew = false;
    } else {
      subscription.status = "active";
      subscription.plan = "premium";
      subscription.periodStartedAt = now.toISOString();
      subscription.periodEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      subscription.simulated = true;
      subscription.autoRenew = false;
      subscription.priceLabel = "TBD";
    }
    if (!writeAccount()) {
      if (feedback) feedback.textContent = "Browser storage is unavailable; the simulated plan change was not saved.";
      return;
    }
    if (feedback) feedback.textContent = subscription.status === "active"
      ? "Premium access was simulated for 30 days. No payment or automatic billing occurred."
      : "The simulated plan was cancelled and Free access is active. Your saved journal and wellbeing data were not changed.";
    render();
  });
  if (["trial", "active"].includes(subscription.status)) {
    timer = window.setInterval(render, 60000);
    window.addEventListener("storage", function (event) {
      if (event.key === key) window.location.reload();
    });
  }
  window.addEventListener("beforeunload", function () { if (timer) window.clearInterval(timer); });
});
