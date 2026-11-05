document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");
  const navItems = document.querySelectorAll(".nav-link");
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Mobile navigation
  if (menuToggle && navLinks) {
    const updateMenuLabel = () => {
      const open = navLinks.classList.contains("open");
      NafasI18n.setAttribute(menuToggle, "aria-label", open ? "home.menu.close" : "home.menu.open");
    };
    menuToggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(open));
      updateMenuLabel();
      menuToggle.textContent = open ? "✕" : "☰";
    });
    navLinks.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      updateMenuLabel();
      menuToggle.textContent = "☰";
    }));
    document.addEventListener("nafas:languagechange", updateMenuLabel);
    updateMenuLabel();
  }
  navItems.forEach(link => link.addEventListener("click", () => {
    navItems.forEach(item => item.classList.remove("active"));
    link.classList.add("active");
  }));

  // Service cards are public entry points; open Login only after activation.
  document.querySelectorAll(".service-card").forEach(card => {
    const openLogin = () => { window.location.href = "../loginpage/login.html"; };

    card.addEventListener("click", event => {
      if (event.target.closest("a")) return;
      openLogin();
    });

    card.addEventListener("keydown", event => {
      if (event.target.closest("a")) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLogin();
      }
    });
  });

  // Smooth in-page navigation with a reliable offset for the floating navbar.
  // This keeps the About heading visible below the fixed header.
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      const hash = link.getAttribute("href");
      if (!hash || hash === "#") return;
      const target = document.querySelector(hash);
      if (!target) return;
      event.preventDefault();
      const header = document.querySelector(".header");
      const headerOffset = (header?.getBoundingClientRect().height || 76) + 24;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.history.pushState(null, "", hash);
      window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
    });
  });

  // Reveal sections; all content remains visible if JavaScript/observer is unavailable.
  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.documentElement.classList.add("js-ready");
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-in-view");
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.14, rootMargin: "0px 0px -35px 0px" });
    revealItems.forEach(item => observer.observe(item));
  }

  // Keep playback declarative in the video element, and resume from canplay
  // if the browser paused or throttled this background video while hidden.
  const heroVideo = document.getElementById("hero-background-video");
  if (heroVideo) {
    const hero = document.querySelector(".hero");
    let playRequest = null;
    let frameReady = false;

    // Keep the gradient visible and decorative motion paused until the browser
    // has presented the video's first frame.
    hero?.classList.add("video-frame-pending");

    const markFrameReady = () => {
      if (frameReady) return;
      frameReady = true;
      hero?.classList.add("video-frame-ready");
      hero?.classList.remove("video-frame-pending");
    };

    if (typeof heroVideo.requestVideoFrameCallback === "function") {
      heroVideo.requestVideoFrameCallback(() => markFrameReady());
    } else {
      // loadeddata means the first frame is available; wait for a paint turn
      // before revealing it on browsers without requestVideoFrameCallback.
      const revealAvailableFrame = () => requestAnimationFrame(() => markFrameReady());
      if (heroVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        revealAvailableFrame();
      } else {
        heroVideo.addEventListener("loadeddata", revealAvailableFrame, { once: true });
      }
    }

    const setFallback = () => {
      hero?.classList.add("video-unavailable");
      hero?.classList.remove("video-frame-pending");
    };

    const playVideo = () => {
      if (!heroVideo.paused || playRequest) return;
      playRequest = heroVideo.play();
      if (playRequest && typeof playRequest.then === "function") {
        playRequest.then(() => hero?.classList.remove("video-unavailable"))
          .catch(setFallback)
          .finally(() => { playRequest = null; });
      } else {
        hero?.classList.remove("video-unavailable");
        playRequest = null;
      }
    };

    heroVideo.addEventListener("canplay", playVideo);
    heroVideo.addEventListener("error", setFallback);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) playVideo();
    });
    playVideo();
  }

});
