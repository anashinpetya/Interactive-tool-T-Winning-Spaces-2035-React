# Publishing the tool on GitHub Pages

The tool is a static website: everything (maps, sliders, charts) runs in the
visitor's browser, so GitHub Pages can host it for free and it stays fully
interactive. The repository already contains the automation
(`.github/workflows/deploy.yml`): every time you push to the `main` branch,
GitHub builds the site and publishes it at

```
https://<your-github-username>.github.io/<repository-name>/
```

You only have to (1) put the folder on GitHub and (2) switch Pages on once.

## Before you start

- **The repository must be public** on a free GitHub account (private repositories
  can use Pages only on paid plans, and the website itself is public in any case).
  Everything you upload becomes downloadable, including `Datasets/*.gpkg`. The
  website does **not** need `Datasets/` or `scripts/`; leave them out if the data
  must not be shared publicly.
- Keep the branch name **`main`** (GitHub Desktop and the website use it by default).
- Never upload `node_modules/` or `dist/` – GitHub builds those itself
  (`.gitignore` already excludes them for GitHub Desktop).

## Option A – GitHub Desktop (recommended)

1. Install [GitHub Desktop](https://desktop.github.com/) and sign in
   (*File → Options → Accounts*).
2. *File → Add local repository… → Choose…*, select the project folder
   `Interactive-tool-T-Winning-Spaces-2035-React`, click **Add repository**.
3. Desktop says the folder is not a Git repository yet – click
   **create a repository**. Keep the name as it is, leave *Initialize with a
   README* unticked, *Git ignore* and *License* = None, click **Create repository**.
4. Check the *Changes* / *History* tab: you should see `.github/`, `public/`,
   `src/`, `package.json`, `package-lock.json` … and **no** `node_modules/` or `dist/`.
   If there are uncommitted changes, type a summary (e.g. "First version") and
   click **Commit to main**.
5. Click **Publish repository** (top bar). Choose the repository name – it becomes
   part of the web address – and **untick "Keep this code private"**.
   Click **Publish repository**.
6. In your browser open `https://github.com/<you>/<repository-name>` →
   **Settings** → **Pages** (left sidebar) → *Build and deployment* → **Source:
   GitHub Actions**. (This one-time switch cannot be done by the workflow itself.)
7. Open the **Actions** tab. Publishing already started a *Deploy to GitHub Pages*
   run; if it failed because Pages was not switched on yet, open the run and click
   **Re-run jobs → Re-run all jobs** (or: select the workflow on the left →
   **Run workflow** → `main`).
8. When both jobs (*build*, *deploy*) show a green tick – usually 2–5 minutes, at
   most about 10 – the address appears under the *deploy* job and in
   *Settings → Pages* ("Your site is live at …"). Open it, keeping the trailing `/`.

**Updating later:** change files locally → in GitHub Desktop write a summary →
**Commit to main** → **Push origin**. The site rebuilds automatically; press
Ctrl + F5 in the browser to skip its cache.

## Option B – upload through the GitHub website (no extra software)

1. On github.com: **+** (top right) → **New repository**. Enter a name, choose
   **Public**, do not add a README, click **Create repository**.
2. Click **uploading an existing file**.
3. In File Explorer select only: `.github`, `public`, `scripts`, `src`,
   `.gitignore`, `DEPLOYING.md`, `README.md`, `index.html`, `package.json`,
   `package-lock.json`, `tsconfig.json`, `vite.config.ts` (and `Datasets` if it may
   be public). Drag them into the browser (Chrome or Edge keep the folders).
   The limits are 100 files per upload and 25 MB per file – this project is well
   within both. Click **Commit changes**.
4. Check that `.github/workflows/deploy.yml` arrived (hidden folders are sometimes
   skipped by drag-and-drop). If not: **Add file → Create new file**, type
   `.github/workflows/deploy.yml` as the name, paste the file's contents,
   **Commit changes**.
5. Continue with steps 6–8 of option A.

## If something goes wrong

| Symptom | Fix |
|---|---|
| *deploy* job fails with "Failed to create deployment" / 404 | Pages is not switched on: *Settings → Pages → Source: GitHub Actions*, then re-run the workflow. |
| *build* job fails at `npm ci` | `package-lock.json` is missing or out of date – upload it again from the project folder. |
| "Branch … is not allowed to deploy to github-pages" | Deploy from `main`, or allow the branch in *Settings → Environments → github-pages*. |
| No workflow run appears | `.github/workflows/deploy.yml` is missing, or you pushed to a branch other than `main`. |
| Site shows the old version | Wait a few minutes, then Ctrl + F5. |
| A page says "This page could not be loaded" | The site was updated while it was open – click **Reload**. |

Details of a failed run: **Actions** tab → *Deploy to GitHub Pages* → the red run
→ the failed job (the failing step opens automatically).

## Good to know

- Limits (far above this project's ~12 MB site): 1 GB site size, 100 GB/month
  soft bandwidth limit, 10-minute deployment timeout, 100 MB per file in the
  repository.
- Addresses of individual pages look like `https://<you>.github.io/<repo>/#/emissions`
  and can be shared and bookmarked.
- A custom domain can be added later under *Settings → Pages → Custom domain*.
