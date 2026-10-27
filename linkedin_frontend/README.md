# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

````js
export default defineConfig([
  # Workline frontend

  React, TypeScript, Vite, MUI, and React Query user interface for the sibling FastAPI service.

  ## Run locally

  ```powershell
  cd linkedin_frontend
  npm install
  npm run dev
````

The frontend opens at `http://localhost:5173`. The API defaults to `http://localhost:8000/api/v1`; set `VITE_API_URL` to point at another backend. Without an authenticated account, the app opens in preview mode with sample feed content. Sign in and signup require the backend and MongoDB to be configured.

## Checks

```powershell
npm run build
npm run lint
```

      // other options...
