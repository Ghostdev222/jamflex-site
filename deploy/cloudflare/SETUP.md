# Cloudflare Pages + Worker deployment — SETUP

This document walks through publishing JAMFLEX to Cloudflare Pages (static site) and deploying the small server/API as a standalone Cloudflare Worker. It assumes the repo already exists on GitHub (https://github.com/Ghostdev222/jamflex-site).

Summary
- Pages: serves the static files produced by `node build.mjs` into `dist/`.
- Worker: run the TypeScript functions (TMDb proxy, library adapters) as a standalone Worker and mount it at an API route.

Two deployment choices
A) Pages + separate Worker (recommended)
   - Pages serves `dist/`.
   - Worker is published separately (wrangler) and attached to routes like `https://<your-pages>.pages.dev/api/*` or `https://api.yourdomain.com/*`.
B) Pages Functions
   - If you prefer, move/adjust the code to the Pages Functions format under `functions/` and let Pages deploy them automatically. This requires verifying the code is compatible.

I. Prepare locally
1. Clone the repo and install Wrangler (Cloudflare CLI):

   # clone if not already
   git clone https://github.com/Ghostdev222/jamflex-site.git
   cd jamflex-site

   # Install Wrangler (npm) — use your preferred method
   npm install -g wrangler

2. Optional: create a small local build to verify:

   node build.mjs
   # then open dist/index.html in a static server or use Pages preview

II. Create a Cloudflare Pages site (UI method)
1. Go to https://dash.cloudflare.com → Pages → Create a project.
2. Connect your GitHub account and select the `Ghostdev222/jamflex-site` repository and the `main` branch.
3. Build settings:
   - Framework preset: None
   - Build command: `node build.mjs`
   - Build output directory: `dist`
4. Environment variables during build: none required.
5. Create the site. Pages will run the build on push and publish a site at `https://<your-site>.pages.dev`.

III. Deploy the Worker (recommended: Wrangler CLI)
We publish a standalone Worker that the front-end calls for API actions (`?a=…`). This keeps secrets isolated and gives fine control.

1. Create a Cloudflare API token for CLI use (recommended minimal scopes):
   - Permissions:
     - Account: Workers Scripts — Edit
     - Account: Pages — Edit (if you want to control Pages via API)
     - Zone: DNS — Edit (only if you plan to add a custom domain via API)
   - Or use the full “All Zones” but minimal permissions are safer.

2. Login with Wrangler using your Cloudflare token (or authenticate with `wrangler login` to open the browser):

   # set the token in the environment for the session
   export CF_API_TOKEN="<your_token>"    # macOS / Linux
   set CF_API_TOKEN=<your_token>           # Windows PowerShell

   # then (option A) interactive login
   wrangler login

   # or (option B) configure token in ~/.wrangler/config/defaults (advanced)

3. Create a wrangler project (if you want to use the existing functions/ TypeScript code you'll need a small wrapper or bundler step):

   # example init — this will create wrangler.toml and a worker template
   wrangler init jamflex-worker

   # Move or adapt your server code under the worker project, or build it with a bundler so it exports a fetch handler.

4. Build & publish the worker

   # in the worker project directory
   wrangler publish --name jamflex-worker

5. Set the TMDB_API_KEY secret

   # Using Wrangler v2
   wrangler secret put TMDB_API_KEY
   # or via dashboard: Workers → jamflex-worker → Settings → Variables & Secrets → Add secret

6. Configure a route
   - In Cloudflare dashboard: Workers & Routes → Add route `your-pages-site.pages.dev/api/*` and attach the `jamflex-worker` Worker.
   - Or use your own domain: `api.yourdomain.com/*` (requires DNS pointing to Cloudflare and a route to the Worker).

IV. Quick CLI script (example)

Create `deploy/cloudflare/publish.sh` and run it after setting CF_API_TOKEN and logging in:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Build the site
node build.mjs

# Publish pages is done by GitHub push (Pages watches the repo). Push changes:
git add -A
git commit -m "Prepare site for Cloudflare Pages"
git push origin main

# Publish worker (assumes wrangler.toml is configured in deploy/cloudflare/worker/)
cd deploy/cloudflare/worker
wrangler publish --name jamflex-worker

# Set secret interactively
wrangler secret put TMDB_API_KEY
```

V. Notes and troubleshooting
- If the Worker uses Node-specific modules or APIs, you must port them to Worker-compatible APIs (no Node built-in modules like fs, child_process, etc.). The functions/ code may already be written with Cloudflare in mind — review it and bundle with esbuild if necessary.
- If you prefer Pages Functions (no separate Worker), confirm the code in `functions/` exports handlers compatible with Pages Functions. The README suggests `functions/handler.ts` is already present; test it by deploying via Pages.
- After publish, test these endpoints from the browser console or curl:
  - `https://<your-pages>.pages.dev/?a=list` (or whatever your function routes expect)

VI. Add the TMDB API key in the dashboard (if you don't use wrangler):
- Pages: Settings → Environment variables & secrets → Add variable for the Pages Functions (if using Pages Functions).
- Workers: Workers → jamflex-worker → Settings → Variables & Secrets → Add secret `TMDB_API_KEY`.

VII. Revoke / rotate your Cloudflare token after use
- For security, create a short-lived token for CLI use and revoke it after deployment.

---

If you want, I can:
- Add a wrangler.toml example and a small worker wrapper to the repo so `wrangler publish` will work with minimal edits.
- Or, if you prefer me to complete the Cloudflare deployment directly, you can provide a fresh API token (I cannot use the token pasted earlier from this chat). For security, rotate the token after use.

Which next step do you want? I can:
1) Add a wrangler.toml example + publish script to the repo (I can do that now).  
2) Provide exact copy-paste UI steps only (you run them).  
3) Attempt the deploy with a new API token you give (you must paste it here).