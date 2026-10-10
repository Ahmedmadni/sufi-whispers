import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "../src/router";
import "../src/styles.css";
import "../src/visual-experience.css";
import "../src/premium-ui.css";
import "../src/printed-mushaf.css";
import "../src/printed-pdf-reader.css";
import "./mobile.css";

const mount = document.getElementById("root");
if (!mount) throw new Error("Missing #root element for mobile application");

const router = getRouter();
createRoot(mount).render(<RouterProvider router={router} />);
