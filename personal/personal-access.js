"use strict";
(function () {
  let active;
  try { active = JSON.parse(sessionStorage.getItem("nafas.activeDemoAccount.v1") || "null"); } catch (error) {}
  if (!active || active.role !== "user") { location.replace("../loginpage/login.html"); return; }
})();
