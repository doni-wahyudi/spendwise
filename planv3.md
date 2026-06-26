# Plan v3 — SpendWise PWA Deploy to gh-pages Branch

## Goal
Switch the deployment method from direct GitHub Actions deployment to pushing compiled static assets to a dedicated `gh-pages` branch using GitHub Actions. This allows the repository to remain set to "Deploy from a branch" (pointing to `gh-pages`) while maintaining automatic builds on push.

## Proposed Changes

### 1. GitHub Actions Workflow Configuration
- **[MODIFY] `.github/workflows/deploy.yml`**: Update the workflow to:
  1. Require `contents: write` permissions.
  2. Build the project under Node 22.
  3. Deploy the compiled `./dist` directory using the `peaceiris/actions-gh-pages@v4` action, which pushes build artifacts directly to a `gh-pages` branch.

### 2. Manual Local Deployment Option (Optional helper)
- **[MODIFY] `package.json`**: Install `gh-pages` as a devDependency and add a `deploy` npm script for manual deployments from the command line if needed:
  ```json
  "deploy": "gh-pages -d dist"
  ```

## Verification Plan

### Execution
1. Update `.github/workflows/deploy.yml`.
2. Commit and push the changes to `web_based` branch.
3. Verify that the GitHub Actions run compiles successfully and successfully pushes files to a new `gh-pages` branch.

### Deployment Verification
1. Inform the user to configure the Pages setting to deploy from the new `gh-pages` branch:
   - Go to **Settings -> Pages**.
   - Under **Build and deployment -> Source**, select **"Deploy from a branch"**.
   - Under **Branch**, select **`gh-pages`** and `/root` path.
