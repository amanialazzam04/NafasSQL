"use strict";
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("therapist-application-form");
  const feedback = document.getElementById("application-feedback");
  const key = "nafas.frontendDemoAccounts.v1";
  document.querySelectorAll('a[href="../loginpage/login.html"]').forEach(link => link.addEventListener("click", () => sessionStorage.removeItem("nafas.activeDemoAccount.v1")));
  let active;
  try { active = JSON.parse(sessionStorage.getItem("nafas.activeDemoAccount.v1") || "null"); } catch (error) {}
  if (!active || active.role !== "therapist") {
    feedback.textContent = "Sign in with a therapist demo account to submit an application.";
    form.querySelector("button[type=submit]").disabled = true;
    return;
  }
  let accounts = {};
  try { accounts = JSON.parse(localStorage.getItem(key) || "{}"); } catch (error) {}
  const account = accounts[active.email] || {};
  document.getElementById("app-name").value = account.name || "";
  document.getElementById("app-email").value = active.email;
  const current = account.therapistApplication;
  if (current && ["pending", "approved", "rejected", "more-info"].includes(current.status)) {
    const labels = { pending: "Pending review", approved: "Approved", rejected: "Rejected", "more-info": "More information requested" };
    feedback.textContent = `Application status: ${labels[current.status]}. ${current.note || ""}`;
    if (current.status === "pending" || current.status === "approved") form.hidden = true;
  }
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const file = document.getElementById("app-document").files[0];
    if (!file) return;
    const data = Object.fromEntries(new FormData(form).entries());
    data.documentName = file.name;
    delete data.document;
    accounts[active.email] = { ...account, role: "therapist", therapistApplication: { status: "pending", submittedAt: new Date().toISOString(), details: data, note: "" } };
    try { localStorage.setItem(key, JSON.stringify(accounts)); }
    catch (error) { feedback.textContent = "Browser storage is unavailable; this demo application was not recorded."; return; }
    form.hidden = true;
    feedback.textContent = "Application submitted for Admin review. Status: Pending. No credentials were verified and the document was not uploaded.";
  });
});
