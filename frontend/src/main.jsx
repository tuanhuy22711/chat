import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import App from "./App.jsx";

import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
