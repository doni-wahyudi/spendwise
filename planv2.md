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

## Verification Plan

### Local Verification
1. Run `npm install` and verify build compiles:
   ```bash
   npm run build
   ```
2. Check built files in `dist/` to verify manifest and service worker references use `/spendwise/` prefix.

### Deployment Verification
1. Push branch `web_based` to remote repository `origin`.
2. Ensure the user configures the repository settings for GitHub Pages:
   - Go to **Settings -> Pages**.
   - Under **Build and deployment**, select **GitHub Actions** as the source.
