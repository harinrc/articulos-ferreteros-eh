import { STORE_CONFIG } from "./config.js";

let deferredInstallPrompt = null;

export function buildWhatsAppLink(message) {
  const text = message || STORE_CONFIG.whatsappGreeting;
  return `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

export function wireSocialLinks() {
  const waLinks = [
    "hero-whatsapp-link",
    "footer-wa-link",
    "about-wa-link"
  ];

  waLinks.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.href = buildWhatsAppLink();
    }
  });

  const map = [
    ["footer-fb-link", STORE_CONFIG.social.facebook],
    ["footer-ig-link", STORE_CONFIG.social.instagram],
    ["footer-tt-link", STORE_CONFIG.social.tiktok],
    ["about-fb-link", STORE_CONFIG.social.facebook],
    ["about-ig-link", STORE_CONFIG.social.instagram],
    ["about-tt-link", STORE_CONFIG.social.tiktok]
  ];

  map.forEach(([id, href]) => {
    const el = document.getElementById(id);
    if (el && href) el.href = href;
  });
}

export function initHeaderInteractions() {
  const header = document.getElementById("site-header");
  const menuButton = document.getElementById("menu-toggle");
  const nav = document.getElementById("main-nav");

  if (header) {
    const handleScroll = () => {
      if (window.scrollY > 24) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
  }

  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const opened = nav.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", String(opened));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!target) return;

      if (!nav.contains(target) && !menuButton.contains(target) && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded", "false");
      }
    });
  }
}

export function initHeroSwiper() {
  if (!window.Swiper) return;
  if (!document.getElementById("hero-swiper")) return;

  new window.Swiper("#hero-swiper", {
    loop: true,
    effect: "fade",
    autoplay: {
      delay: 3500,
      disableOnInteraction: false
    }
  });
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./sw.js", { scope: "./" });
    } catch (error) {
      console.error("Service Worker registration failed", error);
    }
  });
}

export function initInstallAppButton() {
  const installButton = document.getElementById("install-app-btn");
  if (!installButton) return;

  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
  if (isStandalone) {
    installButton.hidden = true;
    return;
  }

  installButton.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;

    deferredInstallPrompt.prompt();
    try {
      await deferredInstallPrompt.userChoice;
    } catch (error) {
      console.error("Install prompt failed", error);
    }
    deferredInstallPrompt = null;
    installButton.hidden = true;
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installButton.hidden = false;
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installButton.hidden = true;
  });
}

export function safeText(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
