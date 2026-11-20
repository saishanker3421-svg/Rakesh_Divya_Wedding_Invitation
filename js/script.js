/*
 * DIRA Wedding guest photo upload
 * Paste the deployed Google Apps Script Web App URL (ending in /exec) below.
 */
const GOOGLE_DRIVE_UPLOAD_URL = "https://script.google.com/macros/s/AKfycbxhl8S8i29OXVNJxxRNuKwpnvxEd3pTqcpXmkZjL_LNik54mpyiNhccY9oJsPlVMWPX2w/exec";
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
    invitation.hidden = false;
    const firstSection = invitation.querySelector(".reveal-on-scroll");
    if (firstSection) firstSection.classList.add("is-visible");
    invitation.classList.add("is-revealing");
    cover.classList.add("is-opening");
    window.scrollTo({ top: 0, behavior: "auto" });
    window.requestAnimationFrame(() => activateScrollReveals());
    window.setTimeout(() => {
      cover.hidden = true;
      cover.classList.remove("is-opening");
      invitation.classList.remove("is-revealing");
    }, 1250);
  });
  musicToggle.addEventListener("click", function () {
    if (music.paused) {
      music.play().then(function () {
        musicToggle.classList.add("playing");
        musicToggle.setAttribute("aria-pressed", "true");
        musicLabel.textContent = translations[currentLanguage].musicOn;
      }).catch(function () {
        showMusicMessage("musicMissing");
      });
    } else {
      music.pause();
      musicToggle.classList.remove("playing");
      musicToggle.setAttribute("aria-pressed", "false");
      musicLabel.textContent = translations[currentLanguage].musicOff;
    }
  });
  // Google Drive guest uploads: no Google sign-in is required from guests.
  const guestPhotoUpload = document.getElementById("guestPhotoUpload");
  const guestPhotoStatus = document.getElementById("guestPhotoStatus");
  const MAX_FILES = 5;
  const MAX_FILE_BYTES = 12 * 1024 * 1024;
  function setPhotoStatus(message) {
    if (guestPhotoStatus) guestPhotoStatus.textContent = message;
  }
  function createHiddenUploadFrame() {
    let frame = document.getElementById("diraDriveUploadFrame");
    if (!frame) {
      frame = document.createElement("iframe");
      frame.id = "diraDriveUploadFrame";
      frame.name = "diraDriveUploadFrame";
      frame.title = "Photo upload";
      frame.style.display = "none";
      document.body.appendChild(frame);
    }
    return frame;
  }
  function compressToJpeg(file) {
    return new Promise((resolve, reject) => {
      const imageUrl = URL.createObjectURL(file);
      const image = new Image();
      image.onload = function () {
        const maxSide = 2000;
        const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          URL.revokeObjectURL(imageUrl);
          reject(new Error("This photo could not be processed."));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(imageUrl);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        resolve(dataUrl.substring(dataUrl.indexOf(",") + 1));
      };
      image.onerror = function () {
        URL.revokeObjectURL(imageUrl);
        reject(new Error("One of the selected photos could not be opened."));
      };
      image.src = imageUrl;
    });
  }
  async function uploadGuestPhotos(files) {
    const endpoint = GOOGLE_DRIVE_UPLOAD_URL.trim();
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/i.test(endpoint)) {
      setPhotoStatus("Photo upload is not configured yet. Please try again later.");
      return;
    }
    if (!files.length) return;
    if (files.length > MAX_FILES) {
      setPhotoStatus("Please select no more than 5 photos at a time.");
      return;
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        setPhotoStatus("Please choose JPG, PNG or WebP photos only.");
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        setPhotoStatus("Each selected photo must be 12 MB or smaller.");
        return;
      }
    }
    const token = "dira_" + Date.now().toString(36) + "_" +
      Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    setPhotoStatus("Preparing your photos…");
    try {
      const photos = [];
      for (let i = 0; i < files.length; i += 1) {
        setPhotoStatus("Preparing photo " + (i + 1) + " of " + files.length + "…");
        const data = await compressToJpeg(files[i]);
        photos.push({
          name: files[i].name.replace(/\.[^.]+$/, "") + ".jpg",
          data: data
        });
      }
      const frame = createHiddenUploadFrame();
      const form = document.createElement("form");
      form.method = "POST";
      form.action = endpoint;
      form.target = frame.name;
      form.style.display = "none";
      const payloadInput = document.createElement("input");
      payloadInput.type = "hidden";
      payloadInput.name = "payload";
      payloadInput.value = JSON.stringify({ token: token, photos: photos });
      form.appendChild(payloadInput);
      document.body.appendChild(form);
      setPhotoStatus("Uploading your photos…");
      form.submit();
      window.setTimeout(function () {
        if (form.isConnected) form.remove();

        setPhotoStatus(currentLanguage === "te"
          ? "మీ ఫోటోలు విజయవంతంగా అప్‌లోడ్ అయ్యాయి. ధన్యవాదాలు!"
          : "Your photos were uploaded successfully. Thank you for sharing!");
      }, 5000);
    } catch (error) {
      setPhotoStatus(error && error.message ? error.message : "Unable to upload photos. Please try again.");
    }
  }
  if (guestPhotoUpload && guestPhotoStatus) {
    const filePicker = document.createElement("input");
    filePicker.type = "file";
    filePicker.accept = "image/jpeg,image/png,image/webp";
    filePicker.multiple = true;
    filePicker.style.display = "none";
    document.body.appendChild(filePicker);
    guestPhotoUpload.addEventListener("click", () => {
      setPhotoStatus("");
      filePicker.click();
    });
    filePicker.addEventListener("change", () => {
      const selected = Array.from(filePicker.files || []);
      filePicker.value = "";
      uploadGuestPhotos(selected);
    });
  }
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
