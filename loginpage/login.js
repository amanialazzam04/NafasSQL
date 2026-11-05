"use strict";

const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const message = document.getElementById("form-message");
const togglePassword = document.getElementById("toggle-password");
const DEMO_ACCOUNT_STORAGE_KEY = "nafas.frontendDemoAccounts.v1";

const predefinedAccounts = {
    "user.demo@nafas.local": {
        password: "NafasUser123!",
        role: "user",
        route: "../personal/dashbord.html"
    },
    "family.demo@nafas.local": {
        password: "NafasFamily123!",
        role: "family",
        route: "../family/family-dashboard.html"
    },
    "therapist.demo@nafas.local": {
        password: "NafasTherapist123!",
        role: "therapist",
        name: "Demo Therapist",
        therapistApplication: { status: "approved", demo: true },
        route: "../therapist/therapist-dashboard.html"
    },
    "admin.demo@nafas.local": {
        password: "NafasAdmin123!",
        role: "admin",
        route: "../admin/admin-dashboard.html"
    }
};

document.querySelectorAll("[data-demo-account]").forEach(function (button) {
    button.addEventListener("click", function () {
        const email = button.dataset.demoAccount;
        const account = predefinedAccounts[email];
        if (!account) return;

        emailInput.value = email;
        passwordInput.value = account.password;
    });
});

function showMessage(text, type) {
    NafasI18n.setText(message, text);
    message.className = `form-message show ${type}`;
}

function getRegisteredDemoAccounts() {
    const accounts = {};
    try {
        const legacyAccounts = JSON.parse(sessionStorage.getItem(DEMO_ACCOUNT_STORAGE_KEY) || "{}");
        if (legacyAccounts && typeof legacyAccounts === "object" && !Array.isArray(legacyAccounts)) {
            Object.assign(accounts, legacyAccounts);
        }
    } catch (error) {}
    try {
        const savedAccounts = JSON.parse(localStorage.getItem(DEMO_ACCOUNT_STORAGE_KEY) || "{}");
        if (savedAccounts && typeof savedAccounts === "object" && !Array.isArray(savedAccounts)) {
            Object.assign(accounts, savedAccounts);
        }
    } catch (error) {}
    return accounts;
}

function updatePasswordToggleLabel() {
    const isHidden = passwordInput.type === "password";
    NafasI18n.setText(togglePassword, isHidden ? "common.show" : "common.hide");
    NafasI18n.setAttribute(togglePassword, "aria-label", isHidden ? "login.password.showLabel" : "login.password.hideLabel");
}

togglePassword.addEventListener("click", function () {
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    updatePasswordToggleLabel();
});
document.addEventListener("nafas:languagechange", updatePasswordToggleLabel);
updatePasswordToggleLabel();

loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    if (!email || !password) {
        showMessage("login.emailRequired", "error");
        return;
    }

    const account = predefinedAccounts[email] || getRegisteredDemoAccounts()[email];
    if (!account || account.password !== password) {
        showMessage("login.credentialsInvalid", "error");
        return;
    }

    const routes = {
        user: "../personal/dashbord.html",
        family: "../family/family-dashboard.html",
        therapist: "../therapist/therapist-dashboard.html",
        admin: "../admin/admin-dashboard.html"
    };
    const route = account.role === "therapist"
        ? (account.therapistApplication && account.therapistApplication.status === "approved"
            ? routes.therapist
            : "../therapist/therapist-application.html")
        : routes[account.role];
    if (!route) {
        showMessage("login.unsupportedRole", "error");
        return;
    }

    showMessage("login.success", "success");
    try {
        sessionStorage.setItem("nafas.activeDemoAccount.v1", JSON.stringify({ email: email, role: account.role }));
    } catch (error) {}
    window.location.href = route;
});

document.getElementById("forgot-link").addEventListener("click", function (event) {
    event.preventDefault();
    showMessage("login.recoveryUnavailable", "error");
});
