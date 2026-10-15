import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "../src/router";
import "../src/styles.css";
import "../src/visual-experience.css";
import "../src/premium-ui.css";
import "../src/printed-mushaf.css";
import "../src/printed-pdf-reader.css";
import "./mobile.css";
import "../src/ios-refinements.css";

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

const router = getRouter();
createRoot(mount).render(<RouterProvider router={router} />);
