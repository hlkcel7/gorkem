Production deployment (cPanel / static host)

This project builds a static frontend (Vite) and a small Node server bundle. For cPanel-style deployments where you upload the `dist` folder, the frontend needs Firebase runtime config available at bootstrap.

Recommended approach (no rebuild required):

1. Place a file at `public/app-config.js` (or overwrite the one in the `dist` produced by the build) with this content, filled with your Firebase web app values:

```js
window.__APP_CONFIG__ = {
  VITE_FIREBASE_API_KEY: "YOUR_WEB_API_KEY",
  VITE_FIREBASE_AUTH_DOMAIN: "YOUR_AUTH_DOMAIN",
  VITE_FIREBASE_PROJECT_ID: "YOUR_PROJECT_ID",
  VITE_FIREBASE_APP_ID: "YOUR_APP_ID",
}
```

2. Ensure `public/app-config.js` is served before the main bundle in `index.html`. The current build includes `public/app-config.js` automatically under `dist/public` and it will be loaded by the server if present.

3. Upload `dist` to cPanel and set server environment variables needed by the backend (if you host the Node server). If you only upload static frontend, you still need to ensure auth-related server endpoints are reachable.

Alternative: rebuild with Vite environment variables injected (VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID) and re-run `npm run package`.
