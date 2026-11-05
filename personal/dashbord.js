
document.addEventListener("DOMContentLoaded", function () {
    const welcomeName = document.getElementById("welcome-name");
    const topAvatar = document.getElementById("top-avatar");
    const todayDate = document.getElementById("today-date");
    const currentYear = document.getElementById("current-year");

    const moodOptions = document.getElementById("mood-options");
    const moodMessage = document.getElementById("mood-message");
    const moodSummary = document.getElementById("mood-summary");
    const moodSummaryText = document.getElementById("mood-summary-text");
    const activityCount = document.getElementById("activity-count");
    const feedbackTitle = document.getElementById("feedback-title");

    const menuButton = document.getElementById("menu-button");
    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay = document.getElementById("sidebar-overlay");
    const logoutButton = document.getElementById("logout-button");

    const now = new Date();

    function updateTodayDate(language) {
        if (!todayDate) return;
        todayDate.textContent = now.toLocaleDateString(language === "ar" ? "ar" : "en", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }
    updateTodayDate("en");

    if (currentYear) {
        currentYear.textContent = now.getFullYear();
    }

    const userName = "Friend";

    if (welcomeName) {
        welcomeName.textContent = userName;
    }

    if (topAvatar) {
        topAvatar.textContent = userName.charAt(0).toUpperCase();
    }

    const moodResponses = {
        Great: {
            title: "It's lovely that you're feeling great.",
            message: "Enjoy this moment and take a little time to appreciate it.",
            summary: "Feeling great"
        },
        Good: {
            title: "That's good to hear.",
            message: "Keep taking care of yourself. Small moments matter.",
            summary: "Feeling good"
        },
        Okay: {
            title: "It's okay to feel just okay.",
            message: "Take today one step at a time. You don't need to rush.",
            summary: "Feeling okay"
        },
        Low: {
            title: "Be gentle with yourself today.",
            message: "You don't have to do everything at once. One small step is enough.",
            summary: "Feeling low"
        },
        Anxious: {
            title: "Let's take a moment to slow down.",
            message: "Try a slow, comfortable breath. You can take things one step at a time.",
            summary: "Feeling anxious"
        }
    };

    function selectMood(mood) {
        if (!moodOptions || !moodResponses[mood]) return;

        const selectedButton = moodOptions.querySelector(
            '[data-mood="' + mood + '"]'
        );

        if (!selectedButton) return;

        moodOptions.querySelectorAll(".mood-option").forEach(function (button) {
            button.classList.remove("selected");
            button.setAttribute("aria-pressed", "false");
        });

        selectedButton.classList.add("selected");
        selectedButton.setAttribute("aria-pressed", "true");

        const response = moodResponses[mood];

        if (moodSummary) {
            moodSummary.textContent = response.summary;
        }

        if (moodSummaryText) {
            moodSummaryText.textContent = "Temporary demo check-in; not saved.";
        }

        if (feedbackTitle) {
            feedbackTitle.textContent = response.title;
        }

        if (moodMessage) {
            moodMessage.textContent = response.message;
        }
    }

    if (moodOptions) {
        moodOptions.addEventListener("click", function (event) {
            const button = event.target.closest(".mood-option");

            if (button) {
                selectMood(button.dataset.mood);
            }
        });
    }

    if (activityCount) {
        activityCount.textContent = "0 activities";
    }

    function openSidebar() {
        if (!sidebar || !sidebarOverlay || !menuButton) return;

        sidebar.classList.add("open");
        sidebarOverlay.classList.add("visible");
        menuButton.setAttribute("aria-expanded", "true");
    }

    function closeSidebar() {
        if (!sidebar || !sidebarOverlay || !menuButton) return;

        sidebar.classList.remove("open");
        sidebarOverlay.classList.remove("visible");
        menuButton.setAttribute("aria-expanded", "false");
    }

    if (menuButton) {
        menuButton.addEventListener("click", function () {
            if (sidebar && sidebar.classList.contains("open")) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", closeSidebar);
    }

    if (sidebar) {
        sidebar.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", closeSidebar);
        });
    }

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeSidebar();
        }
    });

    window.addEventListener("resize", function () {
        if (window.innerWidth > 700) {
            closeSidebar();
        }
    });

    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            const confirmed = window.confirm("Are you sure you want to log out?");

            if (confirmed) {
                try { sessionStorage.removeItem("nafas.activeDemoAccount.v1"); } catch (error) {}
                window.location.href = "../loginpage/login.html";
            }
        });
    }
});
