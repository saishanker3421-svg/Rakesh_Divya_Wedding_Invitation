/*
 * After creating the Google Photos shared album, paste its share URL below.
 * In Google Photos, enable link sharing and allow collaborators to add photos.
 */
const GUEST_PHOTO_ALBUM_URL = "";

document.addEventListener("DOMContentLoaded", () => {
  const translations = window.WEDDING_TRANSLATIONS;
  const languageButtons = document.querySelectorAll("[data-language]");
  const music = document.getElementById("weddingMusic");
  const musicToggle = document.getElementById("musicToggle");
  const musicLabel = musicToggle.querySelector("[data-i18n]");
  const musicMessage = document.getElementById("musicMessage");
  let currentLanguage = "en";
  let messageTimer;

  function showMusicMessage(key) {
    musicMessage.textContent = translations[currentLanguage][key];
    musicMessage.classList.add("visible");
    window.clearTimeout(messageTimer);
    messageTimer = window.setTimeout(() => musicMessage.classList.remove("visible"), 4200);
  }

  function setLanguage(language) {
    currentLanguage = language;
    document.documentElement.lang = language;
    document.body.classList.toggle("telugu", language === "te");

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.dataset.i18n;
      const value = translations[language][key];
      if (value !== undefined) element.textContent = value;
    });

    languageButtons.forEach((button) => {
      const active = button.dataset.language === language;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    musicLabel.textContent = music.paused
      ? translations[language].musicOff
      : translations[language].musicOn;
  }

  languageButtons.forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.language));
  });

  const cover = document.getElementById("cover");
  const invitation = document.getElementById("invitation");
  const openInvitationButton = document.getElementById("openInvitation");

  let revealObserver = null;
  let galleryObserver = null;
  let invitationOpened = false;

  function activateScrollReveals() {
    const revealTargets = document.querySelectorAll("#invitation .reveal-on-scroll");
    const firstSection = document.querySelector("#invitation .reveal-on-scroll");

    // The first section must be visible immediately; it should never depend on scrolling.
    if (firstSection) firstSection.classList.add("is-visible");

    if (!("IntersectionObserver" in window)) {
      revealTargets.forEach((target) => target.classList.add("is-visible"));
      document.querySelectorAll(".memories-grid figure").forEach((figure) => figure.classList.add("is-visible"));
      return;
    }

    if (revealObserver) revealObserver.disconnect();
    revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -20px 0px" });

    revealTargets.forEach((target) => {
      if (target !== firstSection) revealObserver.observe(target);
    });

    const gallery = document.querySelector(".memories-grid");
    if (gallery) {
      if (galleryObserver) galleryObserver.disconnect();
      galleryObserver = new IntersectionObserver((entries, observer) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          gallery.querySelectorAll("figure").forEach((figure) => figure.classList.add("is-visible"));
          observer.disconnect();
        }
      }, { threshold: 0.08 });
      galleryObserver.observe(gallery);
    }
  }

  openInvitationButton.addEventListener("click", () => {
    if (invitationOpened) return;
    invitationOpened = true;
    openInvitationButton.disabled = true;

    // Reveal the main content first, then start its entrance and scroll animations.
    invitation.hidden = false;
    const firstSection = invitation.querySelector(".reveal-on-scroll");
    if (firstSection) firstSection.classList.add("is-visible");
    invitation.classList.add("is-revealing");
    cover.classList.add("is-opening");
    window.scrollTo({ top: 0, behavior: "auto" });

    // Start observers only after the previously-hidden invitation has been made visible.
    window.requestAnimationFrame(() => activateScrollReveals());

    window.setTimeout(() => {
      cover.hidden = true;
      cover.classList.remove("is-opening");
      invitation.classList.remove("is-revealing");
    }, 1250);
  });

  musicToggle.addEventListener("click", async () => {
    if (music.paused) {
      try {
        await music.play();
        musicToggle.classList.add("playing");
        musicToggle.setAttribute("aria-pressed", "true");
        musicLabel.textContent = translations[currentLanguage].musicOn;
      } catch (error) {
        // A missing local song or browser playback restriction is handled here.
        showMusicMessage("musicMissing");
      }
    } else {
      music.pause();
      musicToggle.classList.remove("playing");
      musicToggle.setAttribute("aria-pressed", "false");
      musicLabel.textContent = translations[currentLanguage].musicOff;
    }
  });

  const guestPhotoUpload = document.getElementById("guestPhotoUpload");
  const guestPhotoStatus = document.getElementById("guestPhotoStatus");
  guestPhotoUpload.addEventListener("click", () => {
    const albumUrl = GUEST_PHOTO_ALBUM_URL.trim();
    if (!/^https:\/\/(photos\.app\.goo\.gl|photos\.google\.com)\//i.test(albumUrl)) {
      guestPhotoStatus.textContent = translations[currentLanguage].guestPhotosNotReady;
      return;
    }
    window.open(albumUrl, "_blank", "noopener,noreferrer");
  });

  music.addEventListener("error", () => {
    musicToggle.classList.remove("playing");
    musicToggle.setAttribute("aria-pressed", "false");
    musicLabel.textContent = translations[currentLanguage].musicOff;
    showMusicMessage("musicError");
  });

  const weddingTime = new Date("2026-12-03T11:18:00+05:30").getTime();
  function updateCountdown() {
    let remaining = Math.max(0, weddingTime - Date.now());
    const days = Math.floor(remaining / 86400000);
    remaining %= 86400000;
    const hours = Math.floor(remaining / 3600000);
    remaining %= 3600000;
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    document.getElementById("days").textContent = days;
    document.getElementById("hours").textContent = String(hours).padStart(2, "0");
    document.getElementById("minutes").textContent = String(minutes).padStart(2, "0");
    document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");
  }

  setLanguage("en");
  updateCountdown();
  window.setInterval(updateCountdown, 1000);
});
