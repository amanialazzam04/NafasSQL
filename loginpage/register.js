
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("register-form");

    const nameInput = document.getElementById("full-name");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput =
        document.getElementById("confirm-password");

    const termsCheckbox = document.getElementById("terms");
    const accountTypeInputs = Array.from(
        document.querySelectorAll('input[name="accountType"]')
    );
    const togglePasswordButton =
        document.getElementById("toggle-password");

    const nameError = document.getElementById("name-error");
    const emailError = document.getElementById("email-error");
    const passwordError = document.getElementById("password-error");
    const confirmPasswordError =
        document.getElementById("confirm-password-error");
    const termsError = document.getElementById("terms-error");
    const formMessage = document.getElementById("form-message");

    // Show or hide password
    togglePasswordButton.addEventListener("click", function () {
        const showPassword = passwordInput.type === "password";

        passwordInput.type = showPassword ? "text" : "password";

        updatePasswordToggleLabel();

        togglePasswordButton.setAttribute(
            "aria-pressed",
            String(showPassword)
        );
    });

    function updatePasswordToggleLabel() {
        const showPassword = passwordInput.type === "password";
        NafasI18n.setText(togglePasswordButton, showPassword ? "common.show" : "common.hide");
        NafasI18n.setAttribute(togglePasswordButton, "aria-label", showPassword ? "login.password.showLabel" : "login.password.hideLabel");
    }
    document.addEventListener("nafas:languagechange", updatePasswordToggleLabel);
    updatePasswordToggleLabel();

    // Clear previous errors
    function clearErrors() {
        [nameError, emailError, passwordError, confirmPasswordError, termsError].forEach(NafasI18n.clearText);

        [
            nameInput,
            emailInput,
            passwordInput,
            confirmPasswordInput
        ].forEach(function (input) {
            input.removeAttribute("aria-invalid");
        });

        NafasI18n.clearText(formMessage);
        formMessage.className = "form-message";
    }

    // Check email format
    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // Display a general message
    function showMessage(message, type, values) {
        NafasI18n.setText(formMessage, message, values);
        formMessage.className = "form-message " + type;
    }

    // Register form
    form.addEventListener("submit", function (event) {
        event.preventDefault();
        clearErrors();

        const fullName = nameInput.value.trim();
        const email = emailInput.value.trim();
        const normalizedEmail = email.toLowerCase();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const selectedAccountType = document.querySelector(
            'input[name="accountType"]:checked'
        );

        let isValid = true;

        // Validate name
        if (fullName.length < 2) {
            NafasI18n.setText(nameError, "register.nameRequired");

            nameInput.setAttribute("aria-invalid", "true");
            isValid = false;
        }

        // Validate email
        if (email === "") {
            NafasI18n.setText(emailError, "register.emailRequired");

            emailInput.setAttribute("aria-invalid", "true");
            isValid = false;
        } else if (!validateEmail(email)) {
            NafasI18n.setText(emailError, "register.emailInvalid");

            emailInput.setAttribute("aria-invalid", "true");
            isValid = false;
        } else if (!normalizedEmail.endsWith("@nafas.local")) {
            NafasI18n.setText(emailError, "register.emailDomain");

            emailInput.setAttribute("aria-invalid", "true");
            isValid = false;
        }

        if (!selectedAccountType) {
            showMessage("register.roleRequired", "error");
            isValid = false;
        }

        // Validate password
        if (password.length < 8) {
            NafasI18n.setText(passwordError, "register.passwordShort");

            passwordInput.setAttribute("aria-invalid", "true");
            isValid = false;
        }

        // Confirm password
        if (confirmPassword === "") {
            NafasI18n.setText(confirmPasswordError, "register.confirmRequired");

            confirmPasswordInput.setAttribute(
                "aria-invalid",
                "true"
            );

            isValid = false;
        } else if (password !== confirmPassword) {
            NafasI18n.setText(confirmPasswordError, "register.passwordMismatch");

            confirmPasswordInput.setAttribute(
                "aria-invalid",
                "true"
            );

            isValid = false;
        }

        // Validate terms
        if (!termsCheckbox.checked) {
            NafasI18n.setText(termsError, "register.termsRequired");

            isValid = false;
        }

        // Stop if any field is invalid
        if (!isValid) {
            const firstInvalidInput =
                form.querySelector('[aria-invalid="true"]');

            if (firstInvalidInput) {
                firstInvalidInput.focus();
            }

            return;
        }

        const predefinedEmails = [
            "user.demo@nafas.local",
            "family.demo@nafas.local",
            "therapist.demo@nafas.local",
            "admin.demo@nafas.local"
        ];
        if (predefinedEmails.includes(normalizedEmail)) {
            NafasI18n.setText(emailError, "register.reservedEmail");
            emailInput.setAttribute("aria-invalid", "true");
            emailInput.focus();
            return;
        }

        const storageKey = "nafas.frontendDemoAccounts.v1";
        let demoAccounts = {};
        try {
            // Keep accounts created before the storage change, then prefer current localStorage entries.
            try {
                const legacyAccounts = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
                if (legacyAccounts && typeof legacyAccounts === "object" && !Array.isArray(legacyAccounts)) {
                    Object.assign(demoAccounts, legacyAccounts);
                }
            } catch (error) {}
            try {
                const savedAccounts = JSON.parse(localStorage.getItem(storageKey) || "{}");
                if (savedAccounts && typeof savedAccounts === "object" && !Array.isArray(savedAccounts)) {
                    Object.assign(demoAccounts, savedAccounts);
                }
            } catch (error) {
                throw error;
            }
            if (demoAccounts[normalizedEmail]) {
                NafasI18n.setText(emailError, "register.duplicateEmail");
                emailInput.setAttribute("aria-invalid", "true");
                emailInput.focus();
                return;
            }
            const createdAccount = {
                name: fullName,
                password: password,
                role: selectedAccountType.value,
                ...(selectedAccountType.value === "therapist" ? { therapistApplication: { status: "not-submitted", submittedAt: null } } : {})
            };
            if (selectedAccountType.value === "user") {
                const trialStartedAt = new Date();
                const trialExpiresAt = new Date(trialStartedAt.getTime() + 72 * 60 * 60 * 1000);
                createdAccount.subscription = {
                    status: "trial",
                    plan: "premium",
                    trialStartedAt: trialStartedAt.toISOString(),
                    trialExpiresAt: trialExpiresAt.toISOString(),
                    simulated: true,
                    priceLabel: "TBD"
                };
            }
            demoAccounts[normalizedEmail] = createdAccount;
            localStorage.setItem(storageKey, JSON.stringify(demoAccounts));
        } catch (error) {
            showMessage("register.storageUnavailable", "error");
            return;
        }

        const roleNames = {
            user: "register.role.user",
            family: "register.role.family",
            therapist: "register.role.therapist",
            admin: "register.role.admin"
        };
        const trialNotice = selectedAccountType.value === "user" ? NafasI18n.t("register.trialNotice") : "";
        showMessage(
            "register.success",
            "success",
            { role: NafasI18n.t(roleNames[selectedAccountType.value]), trialNotice: trialNotice }
        );
    });

    // Clear field errors while typing
    [
        nameInput,
        emailInput,
        passwordInput,
        confirmPasswordInput
    ].forEach(function (input) {
        input.addEventListener("input", function () {
            input.removeAttribute("aria-invalid");

            const errorId = {
                "full-name": nameError,
                "email": emailError,
                "password": passwordError,
                "confirm-password": confirmPasswordError
            }[input.id];

            if (errorId) {
                NafasI18n.clearText(errorId);
            }

            NafasI18n.clearText(formMessage);
            formMessage.className = "form-message";
        });

    accountTypeInputs.forEach(function (input) {
        input.addEventListener("change", function () {
            NafasI18n.clearText(formMessage);
            formMessage.className = "form-message";
        });
    });
    });

    termsCheckbox.addEventListener("change", function () {
        NafasI18n.clearText(termsError);
    });
});
