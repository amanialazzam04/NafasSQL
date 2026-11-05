
document.addEventListener("DOMContentLoaded", function () {
    const modeCards = document.querySelectorAll(".mode-card");
    const assistantName = document.getElementById("assistant-name");
    const assistantDescription = document.getElementById("assistant-description");
    const assistantAvatar = document.getElementById("assistant-avatar");
    const chatMessages = document.getElementById("chat-messages");
    const chatForm = document.getElementById("chat-form");
    const messageInput = document.getElementById("message-input");
    const welcomeMessage = document.getElementById("welcome-message");
    const suggestionList = document.getElementById("suggestion-list");
    const newChatButton = document.getElementById("new-chat-button");
    const safetyAlert = document.getElementById("safety-alert");
    const safetyAlertMessage = document.getElementById("safety-alert-message");
    const dismissAlertButton = document.getElementById("dismiss-alert");
    const menuButton = document.getElementById("menu-button");
    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay = document.getElementById("sidebar-overlay");
    const logoutButton = document.getElementById("logout-button");
    const currentYear = document.getElementById("current-year");
    const inputStatus = document.getElementById("input-status");
    const voiceInputButton = document.getElementById("voice-input-button");
    const chooseImageButton = document.getElementById("choose-image-button");
    const takePhotoButton = document.getElementById("take-photo-button");
    const imageInput = document.getElementById("image-input");
    const cameraInput = document.getElementById("camera-input");
    const attachmentPreview = document.getElementById("attachment-preview");
    const attachmentPreviewImage = document.getElementById("attachment-preview-image");
    const attachmentPreviewName = document.getElementById("attachment-preview-name");
    const removeAttachmentButton = document.getElementById("remove-attachment");
    let selectedImage = null;
    let selectedImagePreviewUrl = null;
    let messageImageUrls = new Set();
    let speechRecognition = null;
    let isListening = false;

    if (currentYear) currentYear.textContent = new Date().getFullYear();

    const modes = {
        emotional: {
            name: "Emotional Support",
            description: "A gentle space to express yourself.",
            icon: "♡",
            welcomeTitle: "You can start wherever you are.",
            welcome: "I'm here to listen without judgment. What has been on your mind lately?",
            suggestions: ["I've had a difficult day", "I feel overwhelmed", "I just need someone to listen"]
        },
        educational: {
            name: "Scientific Support",
            description: "Understand emotions and mental wellness.",
            icon: "✳",
            welcomeTitle: "Let's understand things together.",
            welcome: "I can explain mental wellness concepts in simple language. What would you like to understand?",
            suggestions: ["What is stress?", "Why do I feel anxious?", "Tell me about depression"]
        },
        routine: {
            name: "Routine Coach",
            description: "Small steps to make your day easier.",
            icon: "☼",
            welcomeTitle: "Small steps are enough to begin.",
            welcome: "Let's find one manageable step for today. You don't need to do everything at once.",
            suggestions: ["Help me organize my day", "I have no motivation", "Give me a simple daily plan"]
        }
    };

    let currentMode = "emotional";

    function normalizeText(value) {
        return value.toLowerCase()
            .normalize("NFKC")
            .replace(/[أإآ]/g, "ا")
            .replace(/ى/g, "ي")
            .replace(/ؤ/g, "و")
            .replace(/ئ/g, "ي")
            .replace(/ة/g, "ه")
            .replace(/[ًٌٍَُِّْـ]/g, "")
            .replace(/[.,!?،؛:()[\]{}"'`~*_+=<>/|]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    const safetyPhrases = [
        "i want to kill myself", "i want to end my life",
        "i am going to kill myself", "i am going to end my life",
        "i plan to kill myself", "i might kill myself", "i want to die",
        "i wish i were dead", "i wish i was dead",
        "i do not want to live anymore", "i don't want to live anymore",
        "i cannot keep myself safe", "i can't keep myself safe",
        "i am going to hurt myself", "i want to hurt myself",
        "i will hurt myself", "i plan to hurt myself",
        "i am thinking about suicide", "i am suicidal",
        "بدي انتحر", "اريد الانتحار", "أريد الانتحار",
        "بدي انهي حياتي", "بدي أنهي حياتي", "بدي انهي كل شي",
        "بدي اموت", "بدي أموت", "نفسي اموت", "نفسي أموت",
        "بتمنى اموت", "بتمنى أموت", "مش بدي اعيش", "ما بدي اعيش",
        "ما بدي أعيش", "ما بدي اعيش بعد اليوم",
        "مش قادر اكمل حياتي", "مش قادرة اكمل حياتي",
        "مش قادر أكمل", "مش قادرة أكمل", "بدي أأذي حالي",
        "بدي اذي حالي", "بدي أؤذي نفسي", "بدي أأذي نفسي",
        "بدي أجرح نفسي", "بفكر بالانتحار", "افكر بالانتحار",
        "أفكر بالانتحار", "رح انهي حياتي", "راح انهي حياتي",
        "رح انتحر", "راح انتحر", "ما بقدر احافظ على سلامتي",
        "مش قادر احافظ على سلامتي", "مش قادرة احافظ على سلامتي"
    ].map(normalizeText);

    function containsSafetyConcern(message) {
        const normalizedMessage = normalizeText(message);
        return safetyPhrases.some(function (phrase) {
            return normalizedMessage.includes(phrase);
        });
    }

    function showSafetyAlert() {
        if (!safetyAlert) return;
        safetyAlert.hidden = false;

        if (safetyAlertMessage) {
            safetyAlertMessage.textContent =
                "Your message includes words that may indicate you are at risk. " +
                "You deserve support. If you may act on these thoughts or are in immediate danger, " +
                "contact local emergency services or go to the nearest emergency department.";
        }

        safetyAlert.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    if (dismissAlertButton && safetyAlert) {
        dismissAlertButton.addEventListener("click", function () {
            safetyAlert.hidden = true;
        });
    }

    function updateSuggestions(suggestions) {
        if (!suggestionList) return;
        suggestionList.replaceChildren();

        suggestions.forEach(function (suggestion) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "suggestion-chip";
            button.textContent = suggestion;
            button.addEventListener("click", function () {
                sendMessage(suggestion);
            });
            suggestionList.appendChild(button);
        });
    }

    function setMode(modeKey) {
        if (!modes[modeKey]) return;
        currentMode = modeKey;

        modeCards.forEach(function (card) {
            const selected = card.dataset.mode === modeKey;
            card.classList.toggle("selected", selected);
            card.setAttribute("aria-pressed", String(selected));
        });

        const mode = modes[modeKey];
        if (assistantName) assistantName.textContent = mode.name;
        if (assistantDescription) assistantDescription.textContent = mode.description;
        if (assistantAvatar) assistantAvatar.textContent = mode.icon;

        if (welcomeMessage && welcomeMessage.isConnected) {
            const title = welcomeMessage.querySelector("#welcome-title");
            const description = welcomeMessage.querySelector("#welcome-description");
            if (title) title.textContent = mode.welcomeTitle;
            if (description) description.textContent = mode.welcome;
            updateSuggestions(mode.suggestions);
        }
    }

    modeCards.forEach(function (card) {
        card.addEventListener("click", function () {
            setMode(card.dataset.mode);
        });
    });

    function addMessage(text, sender, imageFile) {
        const wrapper = document.createElement("div");
        wrapper.className = "chat-message " + sender;

        const label = document.createElement("span");
        label.className = "message-label";
        label.textContent = sender === "user" ? "You" : "Nafas Support";

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";
        bubble.textContent = text;

        if (imageFile) {
            const attachment = document.createElement("div");
            attachment.className = "message-attachment";

            const image = document.createElement("img");
            const imageUrl = URL.createObjectURL(imageFile);
            messageImageUrls.add(imageUrl);
            image.src = imageUrl;
            image.alt = "Image attached to your message";

            const note = document.createElement("small");
            note.textContent = "Local preview only. Image analysis needs an image-capable AI backend.";

            attachment.appendChild(image);
            attachment.appendChild(note);
            bubble.appendChild(attachment);
        }

        wrapper.appendChild(label);
        wrapper.appendChild(bubble);
        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return wrapper;
    }

    function getDemoResponse(message, modeKey) {
        const text = normalizeText(message);

        if (modeKey === "emotional") {
            if (
                text.includes("sad") || text.includes("حزين") ||
                text.includes("حزينه") || text.includes("زعلان") ||
                text.includes("مضايق") || text.includes("تعبان") ||
                text.includes("تعبانه") || text.includes("lonely") ||
                text.includes("overwhelmed")
            ) {
                return "I'm sorry things feel difficult right now. You don't have to explain everything at once. What has been weighing on you the most?";
            }
            return "Thank you for sharing that with me. Your feelings matter. Would you like to tell me a little more about what happened?";
        }

        if (modeKey === "educational") {
            if (text.includes("stress") || text.includes("توتر") || text.includes("التوتر")) {
                return "Stress is a response to pressure or challenges. It can affect thoughts, feelings, and the body. Taking a break, slow breathing, and talking to someone you trust may help. What would you like to know about stress?";
            }
            if (text.includes("depression") || text.includes("الاكتئاب")) {
                return "Depression can affect mood, energy, sleep, and daily activities. Feeling this way does not mean you have to manage it alone. A qualified mental health professional can help assess your situation and discuss support options.";
            }
            if (text.includes("anxious") || text.includes("قلق") || text.includes("القلق")) {
                return "Anxiety is the body's response to a perceived threat or uncertainty. It can affect thoughts and physical sensations. If it is persistent or affecting daily life, a qualified professional can help.";
            }
            return "Mental wellness is affected by many factors, and each person's experience is different. What part would you like to understand better?";
        }

        if (modeKey === "routine") {
            return "Let's start with one small step. You could drink some water, open a window, or spend five minutes on a simple task. Which one feels manageable right now?";
        }

        return "I'm here to listen. What would you like to talk about?";
    }

    function sendMessage(value, imageFile) {
        const message = (value || "").trim();
        if ((!message && !imageFile) || !chatMessages) return;

        const safetyConcernDetected = containsSafetyConcern(message);

        if (welcomeMessage && welcomeMessage.isConnected) {
            welcomeMessage.remove();
        }

        addMessage(message, "user", imageFile);

        if (inputStatus) inputStatus.textContent = "Message not saved.";
        if (messageInput) messageInput.value = "";

        if (!message) {
            addMessage("Your image is shown in the conversation, but this demo does not send it to an AI service or analyze it. Image analysis needs an image-capable AI backend.", "assistant");
            if (messageInput) messageInput.focus();
            return;
        }

        if (safetyConcernDetected) {
            showSafetyAlert();
            addMessage(
                "I'm glad you shared this. Your safety matters. " +
                "Please contact someone you trust and seek immediate professional or emergency help " +
                "if you may act on these thoughts. This demo cannot contact anyone for you.",
                "assistant"
            );
            if (messageInput) messageInput.focus();
            return;
        }

        const reply = getDemoResponse(message, currentMode);
        addMessage(reply, "assistant");
        if (messageInput) messageInput.focus();
    }

    function clearSelectedImage() {
        selectedImage = null;
        if (selectedImagePreviewUrl) URL.revokeObjectURL(selectedImagePreviewUrl);
        selectedImagePreviewUrl = null;
        if (attachmentPreviewImage) attachmentPreviewImage.removeAttribute("src");
        if (attachmentPreviewName) attachmentPreviewName.textContent = "";
        if (attachmentPreview) attachmentPreview.hidden = true;
        if (imageInput) imageInput.value = "";
        if (cameraInput) cameraInput.value = "";
    }

    function selectImage(input) {
        const file = input && input.files && input.files[0];
        if (!file) return;

        if (!file.type || !file.type.startsWith("image/")) {
            if (inputStatus) inputStatus.textContent = "Choose a valid image file.";
            input.value = "";
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            if (inputStatus) inputStatus.textContent = "Choose an image smaller than 10 MB.";
            input.value = "";
            return;
        }

        clearSelectedImage();
        selectedImage = file;
        selectedImagePreviewUrl = URL.createObjectURL(file);
        if (attachmentPreviewImage) attachmentPreviewImage.src = selectedImagePreviewUrl;
        if (attachmentPreviewName) attachmentPreviewName.textContent = file.name || "Selected image";
        if (attachmentPreview) attachmentPreview.hidden = false;
        if (inputStatus) inputStatus.textContent = "Image stays in this browser. Image analysis needs an image-capable AI backend.";
        input.value = "";
    }

    if (chooseImageButton && imageInput) {
        chooseImageButton.addEventListener("click", function () {
            imageInput.click();
        });
        imageInput.addEventListener("change", function () {
            selectImage(imageInput);
        });
    }

    if (takePhotoButton && cameraInput) {
        takePhotoButton.addEventListener("click", function () {
            if (inputStatus) inputStatus.textContent = "Opening your device's camera. Camera capture depends on browser and device support.";
            try {
                cameraInput.click();
            } catch (error) {
                if (inputStatus) inputStatus.textContent = "Camera capture is unavailable here. Choose an image or type your message instead.";
            }
        });
        cameraInput.addEventListener("change", function () {
            selectImage(cameraInput);
        });
        cameraInput.addEventListener("cancel", function () {
            if (inputStatus) inputStatus.textContent = "Camera or photo selection was canceled or unavailable. You can choose an image or type your message.";
        });
    }

    if (removeAttachmentButton) {
        removeAttachmentButton.addEventListener("click", function () {
            clearSelectedImage();
            if (inputStatus) inputStatus.textContent = "Image removed. Your message is not saved.";
        });
    }

    if (voiceInputButton) {
        voiceInputButton.addEventListener("click", function () {
            if (isListening && speechRecognition) {
                speechRecognition.stop();
                isListening = false;
                voiceInputButton.setAttribute("aria-pressed", "false");
                voiceInputButton.setAttribute("aria-label", "Start voice input");
                if (inputStatus) inputStatus.textContent = "Stopped listening. Review or edit your text before sending.";
                return;
            }

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                if (inputStatus) inputStatus.textContent = "Voice input is not supported in this browser. You can type your message instead.";
                return;
            }

            speechRecognition = new SpeechRecognition();
            speechRecognition.continuous = false;
            speechRecognition.interimResults = false;
            speechRecognition.lang = document.documentElement.lang || navigator.language || "en-US";

            speechRecognition.onresult = function (event) {
                const transcript = Array.from(event.results || [])
                    .map(function (result) { return result[0] && result[0].transcript || ""; })
                    .join(" ")
                    .trim();
                if (!transcript) {
                    if (inputStatus) inputStatus.textContent = "No speech was recognized. Try again or type your message.";
                    return;
                }
                const existingText = messageInput.value.trim();
                messageInput.value = existingText ? existingText + " " + transcript : transcript;
                messageInput.focus();
                if (inputStatus) inputStatus.textContent = "Speech transcribed. Review or edit the text, then press Send.";
            };

            speechRecognition.onerror = function (event) {
                const errors = {
                    "not-allowed": "Microphone permission was denied. Allow access in your browser settings or type your message.",
                    "service-not-allowed": "Speech recognition is unavailable. You can type your message instead.",
                    "audio-capture": "No microphone is available. You can type your message instead.",
                    "no-speech": "No speech was detected. Try again when ready.",
                    "network": "Speech recognition could not connect. Check your connection or type your message."
                };
                if (inputStatus) inputStatus.textContent = errors[event.error] || "Voice input stopped. You can type your message instead.";
            };

            speechRecognition.onend = function () {
                isListening = false;
                voiceInputButton.setAttribute("aria-pressed", "false");
                voiceInputButton.setAttribute("aria-label", "Start voice input");
            };

            try {
                if (inputStatus) inputStatus.textContent = "Starting browser speech recognition. Audio may be processed by your browser's service; Nafas does not save recordings.";
                speechRecognition.start();
                isListening = true;
                voiceInputButton.setAttribute("aria-pressed", "true");
                voiceInputButton.setAttribute("aria-label", "Stop voice input");
                if (inputStatus) inputStatus.textContent = "Listening once. Your browser may process audio under its privacy policy; review the transcription before sending.";
            } catch (error) {
                isListening = false;
                voiceInputButton.setAttribute("aria-pressed", "false");
                if (inputStatus) inputStatus.textContent = "Could not start voice input. Check microphone permission or type your message.";
            }
        });
    }

    if (chatForm) {
        chatForm.addEventListener("submit", function (event) {
            event.preventDefault();
            if (!messageInput) return;
            if (!messageInput.value.trim() && !selectedImage) {
                messageInput.focus();
                return;
            }
            const imageToSend = selectedImage;
            sendMessage(messageInput.value, imageToSend);
            if (imageToSend) clearSelectedImage();
        });
    }

    function resetChat() {
        if (!chatMessages) return;
        clearSelectedImage();
        messageImageUrls.forEach(function (url) { URL.revokeObjectURL(url); });
        messageImageUrls.clear();
        chatMessages.replaceChildren();

        if (welcomeMessage) chatMessages.appendChild(welcomeMessage);
        if (safetyAlert) safetyAlert.hidden = true;
        if (inputStatus) inputStatus.textContent = "Your message is not saved.";
        if (messageInput) messageInput.value = "";

        setMode("emotional");
        updateSuggestions(modes.emotional.suggestions);
    }

    if (newChatButton) {
        newChatButton.addEventListener("click", resetChat);
    }

    window.addEventListener("beforeunload", function () {
        clearSelectedImage();
        messageImageUrls.forEach(function (url) { URL.revokeObjectURL(url); });
        messageImageUrls.clear();
    });

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
        if (event.key === "Escape") closeSidebar();
    });

    window.addEventListener("resize", function () {
        if (window.innerWidth > 700) closeSidebar();
    });

    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            const confirmed = window.confirm("Return to the login page?");
            if (confirmed) {
                try { sessionStorage.removeItem("nafas.activeDemoAccount.v1"); } catch (error) {}
                window.location.href = "../loginpage/login.html";
            }
        });
    }

    // Group venting session booking (demo only; no real reservation is created)
    const groupBookingForm = document.getElementById("group-booking-form");
    const groupSessionDate = document.getElementById("group-session-date");
    const bookingMessage = document.getElementById("booking-message");

    if (groupSessionDate) {
        const today = new Date();
        const localToday = [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, "0"),
            String(today.getDate()).padStart(2, "0")
        ].join("-");
        groupSessionDate.min = localToday;
    }

    if (groupBookingForm && groupSessionDate && bookingMessage) {
        groupBookingForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const selectedDate = groupSessionDate.value;
            const selectedTime = document.getElementById("group-session-time").value;
            const consent = document.getElementById("group-session-consent").checked;

            if (!selectedDate || !selectedTime || !consent) {
                bookingMessage.textContent = "Please choose a date and time and confirm the demo notice.";
                bookingMessage.className = "booking-message error";
                return;
            }

            const date = new Date(selectedDate + "T12:00:00");
            const language = "en";
            const locale = language === "ar" ? "ar" : "en";
            const formattedDate = date.toLocaleDateString(locale, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            });

            const parts = selectedTime.split(":");
            const formattedTime = new Date(
                2000, 0, 1, Number(parts[0]), Number(parts[1])
            ).toLocaleTimeString(locale, {
                hour: "numeric",
                minute: "2-digit"
            });

            bookingMessage.textContent =
                "Demo request prepared for " + formattedDate + " at " +
                formattedTime + ". No booking has been submitted or confirmed.";
            bookingMessage.className = "booking-message success";
            bookingMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
    }

    setMode("emotional");
});
