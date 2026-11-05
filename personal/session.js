document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".logout-link").forEach(function (link) {
    link.addEventListener("click", function () {
      try { sessionStorage.removeItem("nafas.activeDemoAccount.v1"); } catch (error) {}
    });
  });
  const bookingForm = document.getElementById("booking-form");
  const therapistSelect = document.getElementById("therapist-select");
  const sessionDate = document.getElementById("session-date");
  const sessionTime = document.getElementById("session-time");
  const sessionType = document.getElementById("session-type");
  const sessionNote = document.getElementById("session-note");

  const bookingMessage = document.getElementById("booking-message");
  const requestList = document.getElementById("request-list");
  const noteCount = document.getElementById("note-count");

  const groupMessage = document.getElementById("group-message");
  const reflectionEntry = document.getElementById("venting-entry");
  const reflectionCount = document.getElementById("reflection-count");
  const reflectionMessage = document.getElementById("reflection-message");
  const reflectionSafetyMessage = document.getElementById("reflection-safety-message");

  function activeLocale() {
    return "en";
  }

  function formatRequestDate(value) {
    return new Date(value + "T12:00:00").toLocaleDateString(activeLocale(), {
      year: "numeric", month: "long", day: "numeric"
    });
  }

  function formatRequestTime(value) {
    const parts = value.split(":");
    return new Date(2000, 0, 1, Number(parts[0]), Number(parts[1]))
      .toLocaleTimeString(activeLocale(), { hour: "numeric", minute: "2-digit" });
  }

  // Temporary data in memory only.
  // Nothing is saved in localStorage or sessionStorage.
  let requests = [];
  let nextRequestId = 1;

  // Set the earliest allowed booking date to today.
  function getLocalDateString() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  sessionDate.min = getLocalDateString();

  // Display feedback messages.
  function showMessage(element, message, isError = false) {
    element.textContent = message;
    element.classList.toggle("error", isError);
  }

  // Normalize Arabic and English text before checking phrases.
  function normalizeText(value) {
    return value.toLowerCase()
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/[ًٌٍَُِّْـ]/g, "")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Basic keyword detection for the project demonstration.
  // This is NOT a clinical assessment and cannot detect every risk.
  const safetyPhrases = [
    "بدي انتحر",
    "اريد الانتحار",
    "بدي انهي حياتي",
    "اريد ان انهي حياتي",
    "بدي اقتل حالي",
    "رح اقتل حالي",
    "ما بدي اعيش",
    "اتمنى اموت",
    "i want to kill myself",
    "i want to end my life",
    "i am going to kill myself",
    "i want to die",
    "i might hurt myself",
    "i am going to hurt myself",
    "i plan to commit suicide",
    "suicidal thoughts"
  ].map(normalizeText);

  function containsSafetyPhrase(text) {
    const normalized = normalizeText(text);

    return safetyPhrases.some(function (phrase) {
      return normalized.includes(phrase);
    });
  }

  // Show an in-page safety message when concerning wording is detected.
  function checkReflectionSafety() {
    const needsSupport = containsSafetyPhrase(reflectionEntry.value);

    reflectionSafetyMessage.hidden = !needsSupport;

    if (needsSupport) {
      showMessage(
        reflectionMessage,
        "This demo noticed wording that may indicate a need for urgent support. It has not contacted anyone.",
        true
      );
    }
  }

  // Select a therapist from their profile card.
  document.querySelectorAll(".book-therapist").forEach(function (button) {
    button.addEventListener("click", function () {
      therapistSelect.value = button.dataset.therapist;

      document.getElementById("booking").scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

      therapistSelect.focus();
    });
  });

  // Group sessions are demo options, not real bookings.
  document.querySelectorAll(".join-group").forEach(function (button) {
    button.addEventListener("click", function () {
      const topic = button.dataset.session;

      showMessage(
        groupMessage,
        `Your interest in "${topic}" has been noted for this demo. No real session has been booked.`
      );
    });
  });

  // Character count for additional session notes.
  sessionNote.addEventListener("input", function () {
    noteCount.textContent = sessionNote.value.length;
  });

  // Render requests safely using DOM elements and textContent.
  function renderRequests() {
    requestList.replaceChildren();

    if (requests.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "empty-state";

      const symbol = document.createElement("div");
      symbol.className = "empty-icon";
      symbol.textContent = "—";

      const heading = document.createElement("h3");
      heading.textContent = "No requests yet";

      const description = document.createElement("p");
      description.textContent =
        "Your session requests will appear here after submission.";

      emptyState.append(symbol, heading, description);
      requestList.appendChild(emptyState);

      return;
    }

    requests.forEach(function (request) {
      const card = document.createElement("article");
      card.className = "request-card";

      const heading = document.createElement("h3");
      heading.textContent = request.therapist;

      const date = document.createElement("p");
      date.textContent = `Preferred date: ${formatRequestDate(request.date)}`;

      const time = document.createElement("p");
      time.textContent = `Preferred time: ${formatRequestTime(request.time)}`;

      const format = document.createElement("p");
      format.textContent = `Format: ${request.type}`;

      card.append(heading, date, time, format);

      if (request.note) {
        const note = document.createElement("p");
        note.textContent = `Additional notes: ${request.note}`;
        card.appendChild(note);
      }

      const status = document.createElement("span");
      status.className = "request-status";
      status.textContent = "Demo request · Not confirmed";

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "remove-request";
      removeButton.textContent = "Remove request";

      removeButton.addEventListener("click", function () {
        requests = requests.filter(function (item) {
          return item.id !== request.id;
        });

        renderRequests();
      });

      card.append(status, removeButton);
      requestList.appendChild(card);
    });
  }

  // Handle the individual session request form.
  bookingForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!bookingForm.checkValidity()) {
      bookingForm.reportValidity();
      return;
    }

    if (sessionDate.value < getLocalDateString()) {
      showMessage(
        bookingMessage,
        "Please select today or a future date.",
        true
      );
      return;
    }

    const request = {
      id: nextRequestId++,
      therapist: therapistSelect.value,
      date: sessionDate.value,
      time: sessionTime.value,
      type: sessionType.value,
      note: sessionNote.value.trim()
    };

    requests.push(request);
    renderRequests();

    showMessage(
      bookingMessage,
      "Your request is displayed for this demo only. It has not been sent to a therapist."
    );

    bookingForm.reset();
    noteCount.textContent = "0";
    sessionDate.min = getLocalDateString();
  });

  // Character count and safety phrase checking for private reflection.
  reflectionEntry.addEventListener("input", function () {
    reflectionCount.textContent = reflectionEntry.value.length;
    checkReflectionSafety();
  });

  // Finish the reflection without saving it or sending it to a server.
  document.getElementById("save-venting").addEventListener("click", function () {
    if (!reflectionEntry.value.trim()) {
      showMessage(
        reflectionMessage,
        "Write something in your reflection before finishing.",
        true
      );

      reflectionEntry.focus();
      return;
    }

    checkReflectionSafety();

    if (!reflectionSafetyMessage.hidden) {
      showMessage(
        reflectionMessage,
        "Please consider reaching out to a trusted person or qualified professional. No alert was sent by this demo.",
        true
      );

      return;
    }

    showMessage(
      reflectionMessage,
      "Reflection completed for this visit. Your writing stays on this page only and will be cleared when you leave or refresh."
    );
  });
});
