"use strict";
(function () {
  let active;
  try { active = JSON.parse(sessionStorage.getItem("nafas.activeDemoAccount.v1") || "null"); } catch (error) {}
  if (!active || active.role !== "admin") location.replace("../loginpage/login.html");
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".logout-link").forEach(link => link.addEventListener("click", () => sessionStorage.removeItem("nafas.activeDemoAccount.v1")));
  });
})();
