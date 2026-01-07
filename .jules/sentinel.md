## 2024-02-14 - Hardcoded API Key Injection
**Vulnerability:** Hardcoded API Key Injection in Client Bundle
**Learning:** `vite.config.ts` uses `define` to inject `process.env.GEMINI_API_KEY` into the client-side code. This exposes the secret to anyone who views the source code of the deployed application.
**Prevention:** Use a backend proxy to handle API calls, keeping secrets server-side. Do not inject sensitive keys via `define` or `VITE_` env vars unless they are intended to be public.
