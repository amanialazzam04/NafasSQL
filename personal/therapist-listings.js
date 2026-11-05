"use strict";
document.addEventListener("DOMContentLoaded", function () {
  const key = "nafas.frontendDemoAccounts.v1";
  const organicRoot = document.getElementById("approved-therapist-listings");
  const sponsoredRoot = document.getElementById("sponsored-therapist-listings");
  const select = document.getElementById("therapist-select");
  if (!organicRoot || !sponsoredRoot) return;
  let accounts = {};
  try { accounts = JSON.parse(localStorage.getItem(key) || "{}"); } catch (error) {}
  if (!accounts || typeof accounts !== "object" || Array.isArray(accounts)) accounts = {};
  const approved = Object.entries(accounts).filter(([, account]) => account && account.role === "therapist" && account.therapistApplication?.status === "approved" && account.therapistDirectoryListing?.enabled === true).map(([email, account]) => ({ email, account, details: account.therapistApplication.details || {}, promotion: account.therapistPromotion || {} }));
  const now = Date.now();
  const sponsored = approved.filter(item => item.promotion.status === "active" && item.promotion.expiresAt && new Date(item.promotion.expiresAt).getTime() > now);
  const sponsoredEmails = new Set(sponsored.map(item => item.email));
  const organic = approved.filter(item => !sponsoredEmails.has(item.email));
  function text(tag, className, value) { const node = document.createElement(tag); if (className) node.className = className; node.textContent = value; return node; }
  function empty(root, copy) { root.replaceChildren(text("p", "listing-empty", copy)); }
  function addOption(name) {
    if (!select || !name || [...select.options].some(option => option.value === name)) return;
    const option = document.createElement("option"); option.value = name; option.textContent = name; select.append(option);
  }
  function renderCard(item, isSponsored) {
    const details = item.details;
    const name = String(details.name || item.account.name || "Approved therapist").slice(0, 100);
    const title = String(details.title || "Therapist").slice(0, 100);
    const specialty = String(details.specialty || "Specialization not provided").slice(0, 120);
    const card = document.createElement("article"); card.className = "therapist-card directory-provider-card";
    const badge = text("span", isSponsored ? "placement-label sponsored-label" : "placement-label organic-label", isSponsored ? "Featured · Sponsored" : "Organic listing");
    const initials = text("div", "therapist-initials", name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase());
    const content = document.createElement("div"); content.className = "therapist-content";
    content.append(text("h3", "", name), text("p", "therapist-role", title), text("p", "therapist-bio", specialty));
    if (isSponsored) content.append(text("p", "sponsored-disclosure", "Paid visibility placement; this label does not indicate clinical quality or ranking."));
    const request = text("button", "text-button listing-request-button", "Request a Session →"); request.type = "button"; request.dataset.therapist = name;
    content.append(request); card.append(badge, initials, content); addOption(name); return card;
  }
  sponsoredRoot.replaceChildren(); organicRoot.replaceChildren();
  if (sponsored.length) sponsored.forEach(item => sponsoredRoot.append(renderCard(item, true)));
  else empty(sponsoredRoot, "No active Sponsored listings. Promotion is separate from Admin approval and is not a quality ranking.");
  if (organic.length) organic.forEach(item => organicRoot.append(renderCard(item, false)));
  else empty(organicRoot, "No approved organic therapist listings are currently available.");
  document.addEventListener("click", function (event) {
    const button = event.target.closest && event.target.closest(".listing-request-button");
    if (!button || !select) return;
    select.value = button.dataset.therapist;
    const booking = document.getElementById("booking");
    if (booking) booking.scrollIntoView({ behavior: "smooth", block: "start" });
    select.focus();
  });
});
