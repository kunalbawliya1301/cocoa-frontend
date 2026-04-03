import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Register the Service Worker early so SW-based notifications
// (the only kind that work on mobile Chrome and in minimised desktop tabs)
// are ready before the user logs in.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service Worker registration failed:', err);
    });
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
);
