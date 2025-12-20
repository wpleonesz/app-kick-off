import React from "react";
import { createRoot } from "react-dom/client";
import { defineCustomElements as defineIonPhaser } from "@ionic/pwa-elements/loader";
import { setupIonicReact } from "@ionic/react";
import App from "./App";
import "./theme.css";

setupIonicReact();
defineIonPhaser(window);

const container = document.getElementById("root")!;
createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
