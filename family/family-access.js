"use strict";
(function () {
  let active;
  try { active = JSON.parse(sessionStorage.getItem("nafas.activeDemoAccount.v1") || "null"); } catch (error) {}
  if (!active || active.role !== "family") { location.replace("../loginpage/login.html"); return; }
})();
