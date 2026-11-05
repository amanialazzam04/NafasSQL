
document.addEventListener("DOMContentLoaded", function () {
  const settingsMessage = document.getElementById("settings-message");

  const settingIds = [
    "private-profile",
    "share-progress",
    "personal-recommendations",
    "usage-analytics",
    "product-updates",
    "email-notifications",
    "session-reminders",
    "language-select"
  ];

  const defaultSettings = {};

  // Capture the initial settings to support Reset Changes.
  settingIds.forEach(function (id) {
    const element = document.getElementById(id);

    defaultSettings[id] =
      element.type === "checkbox"
        ? element.checked
        : element.value;
  });

  function showMessage(message) {
    settingsMessage.textContent = message;
  }

  function getCurrentSettings() {
    const settings = {};

    settingIds.forEach(function (id) {
      const element = document.getElementById(id);

      settings[id] =
        element.type === "checkbox"
          ? element.checked
          : element.value;
    });

    return settings;
  }

  // Save is a prototype action. Nothing is sent to a database.
  document.getElementById("save-settings").addEventListener("click", function () {
    const settings = getCurrentSettings();

    console.log("Current Nafas preferences:", settings);

    showMessage(
      "Preferences updated for this page session. They are not stored permanently."
    );
  });

  // Restore the initial values.
  document.getElementById("reset-settings").addEventListener("click", function () {
    settingIds.forEach(function (id) {
      const element = document.getElementById(id);

      if (element.type === "checkbox") {
        element.checked = defaultSettings[id];
      } else {
        element.value = defaultSettings[id];
      }
    });

    showMessage("Your preferences have been reset to their initial values.");
  });

  // Show and hide the data management information.
  const dataRequestButton = document.getElementById("data-request");
  const dataRequestPanel = document.getElementById("data-request-panel");

  dataRequestButton.addEventListener("click", function () {
    dataRequestPanel.hidden = !dataRequestPanel.hidden;

    dataRequestButton.textContent = dataRequestPanel.hidden
      ? "View Options"
      : "Hide Options";
  });

  document.getElementById("close-data-options").addEventListener("click", function () {
    dataRequestPanel.hidden = true;
    dataRequestButton.textContent = "View Options";
  });

  // Warn before navigating to the login page.
  document.getElementById("signout-link").addEventListener("click", function (event) {
    const confirmed = window.confirm("Are you sure you want to sign out?");

    if (!confirmed) {
      event.preventDefault();
    } else {
      try { sessionStorage.removeItem("nafas.activeDemoAccount.v1"); } catch (error) {}
    }
  });

  document.querySelectorAll(".logout-link").forEach(function (link) {
    link.addEventListener("click", function (event) {
      if (!window.confirm("Are you sure you want to sign out?")) {
        event.preventDefault();
        return;
      }
      try { sessionStorage.removeItem("nafas.activeDemoAccount.v1"); } catch (error) {}
    });
  });

  // Highlight the settings section currently being viewed.
  const sectionLinks = document.querySelectorAll(".settings-nav-link");

  sectionLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      sectionLinks.forEach(function (item) {
        item.classList.remove("active");
      });

      link.classList.add("active");
    });
  });
});
