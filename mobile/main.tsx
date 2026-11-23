import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "../src/router";
import { freshMobileAppUrl } from "../src/lib/mobile-route-recovery";
import { listenForWirdOpens } from "../src/lib/wird-reminders";
import "../src/styles.css";
import "../src/visual-experience.css";
import "../src/premium-ui.css";
import "../src/printed-mushaf.css";
import "../src/printed-pdf-reader.css";
import "./mobile.css";
import "../src/ios-refinements.css";
import "../src/rihab-daylight.css";
import "../src/rihab-identity.css";

// Native-only responsive layout rules must never change the Lovable web preview.
document.documentElement.classList.add("rihab-android");

// Vite reports failed async chunks here. They can occur after an APK upgrade
// when WebView has cached the previous bundle; refresh the app assets at most
// once, preserving the current book hash and all locally saved progress.
window.addEventListener("vite:preloadError", (event: Event) => {
  event.preventDefault();
  try {
    const next = freshMobileAppUrl(window.location.href, "android-1.0.18");
    if (next) window.location.replace(next);
  } catch (error) {
    console.warn("Cannot recover a stale Android module import", error);
  }
});

const mount = document.getElementById("root");
if (!mount) throw new Error("Missing #root element for mobile application");

// Keep the splash visible until React has actually rendered a route (not until
// bundle download alone). A broken boot exposes a retry action after 9 seconds.
const boot = document.getElementById("rihab-boot");
let dismissed = false;
const finishBoot = () => {
  if (!boot || dismissed || !mount.firstElementChild) return;
  dismissed = true;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    boot.classList.add("is-done");
    window.setTimeout(() => boot.remove(), 350);
  }));
};
const watchRoot = new MutationObserver(() => {
  if (mount.firstElementChild) {
    watchRoot.disconnect();
    finishBoot();
  }
});
watchRoot.observe(mount, { childList: true, subtree: true });
window.setTimeout(() => {
  if (!dismissed) boot?.classList.add("is-delayed");
}, 9000);

void listenForWirdOpens().catch((error: unknown) => console.warn("Wird reminder actions not available", error));
const router = getRouter();
createRoot(mount).render(<RouterProvider router={router} />);
