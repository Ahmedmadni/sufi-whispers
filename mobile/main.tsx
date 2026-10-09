import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "../src/router";
import "../src/styles.css";
import "./mobile.css";

const mount = document.getElementById("root");
if (!mount) throw new Error("Missing #root element for mobile application");

const router = getRouter();
createRoot(mount).render(<RouterProvider router={router} />);
