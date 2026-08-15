import { initHeaderInteractions, initInstallAppButton, registerServiceWorker, wireSocialLinks } from "./ui.js";

window.addEventListener("DOMContentLoaded", () => {
  initHeaderInteractions();
  initInstallAppButton();
  registerServiceWorker();
  wireSocialLinks();
});
