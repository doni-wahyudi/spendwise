# Plan v2 — SpendWise Web PWA Setup and GitHub Pages Deployment

## Goal
Create a new branch `web_based`, configure the app to be a fully installable PWA with Service Worker support, ensure all assets support subdirectory routing (GitHub Pages `https://github.com/doni-wahyudi/spendwise` under `/spendwise/`), and configure the GitHub Pages deployment.

## Proposed Changes

### 1. Git Branching
- Create and switch to the `web_based` branch.
- Add `TECHNICAL_DETAILS.md` and keep it committed.

### 2. PWA Features (Service Worker)
- **[NEW] `public/sw.js`**: Create a custom service worker to implement cache-first/stale-while-revalidate caching of assets and an offline navigation fallback.
- **[MODIFY] `src/main.tsx`**: Add code to dynamically register `/sw.js` using `import.meta.env.BASE_URL` to ensure it works correctly under subdirectories.
- **[MODIFY] `public/manifest.json`**: Update `"start_url"` to `"."` and verify asset relative paths.
- **[MODIFY] `index.html`**: Change manifest and icon href attributes to relative paths (remove leading slash).

### 3. Build & Subdirectory Support
- **[MODIFY] `vite.config.ts`**: Update the Vite configuration to set the `base` path to `/spendwise/` for production builds.

### 4. Deployment to GitHub Pages
- **[NEW] `.github/workflows/deploy.yml`**: Create a GitHub Actions workflow to build and deploy the React build output (`dist`) directly to GitHub Pages on every push to the `web_based` branch.

## Verification & Results
- Ran `npm run build` locally: compiled successfully in 3.91s.
- Verified dynamic base URL mapping for `/spendwise/` on built assets.
- Pushed branch `web_based` to origin remote repository.

## Completion Log
- **What was done**: Checked out `web_based` branch, created and configured a cache service worker `public/sw.js`, updated `src/main.tsx` to dynamically register the service worker, relative-aligned asset paths in `index.html` and `public/manifest.json`, updated `vite.config.ts` base path to `/spendwise/` for production builds, added a `.github/workflows/deploy.yml` deployment action, compiled the build locally to verify correctness, committed all files, and pushed to the remote repository.
- **Why it was done**: To satisfy the request to transition to a PWA and configure automatic deployment to GitHub Pages under the `/spendwise/` subdirectory.
- **What changed**: Added `public/sw.js`, `.github/workflows/deploy.yml`, and modified `index.html`, `public/manifest.json`, `src/main.tsx`, `vite.config.ts`.
- **Unresolved items**: None. The user must select **GitHub Actions** as the source for Pages under repository **Settings -> Pages** for the deployment to publish.
