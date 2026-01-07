import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

if (!container) {
  console.error("Root element not found");
} else {
  try {
    const root = createRoot(container);
    root.render(<App />);
  } catch (e) {
    console.error("Render failed:", e);
    // Display error on screen if render crashes
    container.innerHTML = `<div style="color:#ef4444; padding: 20px; font-family: sans-serif;">
      <h2>Application Failed to Start</h2>
      <pre style="background:#111; color:#ddd; padding:10px; border-radius:4px; overflow:auto;">${e}</pre>
    </div>`;
  }
}