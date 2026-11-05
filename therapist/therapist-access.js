"use strict";
(function () {
  let active;
  try { active = JSON.parse(sessionStorage.getItem("nafas.activeDemoAccount.v1") || "null"); } catch (error) {}
  if (!active || active.role !== "therapist") { location.replace("../loginpage/login.html"); return; }
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".logout-link").forEach(link => link.addEventListener("click", () => sessionStorage.removeItem("nafas.activeDemoAccount.v1")));
  });
  if (active.email === "therapist.demo@nafas.local") return;
  let accounts = {};
  try { accounts = JSON.parse(localStorage.getItem("nafas.frontendDemoAccounts.v1") || "{}"); } catch (error) {}
  const status = accounts[active.email]?.therapistApplication?.status;
  if (status !== "approved") location.replace("therapist-application.html");
})();
