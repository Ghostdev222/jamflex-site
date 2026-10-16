#!/usr/bin/env bash
# deploy/cloudflare/publish.sh — example deploy script
# Usage:
#   export CF_API_TOKEN="..."
#   bash deploy/cloudflare/publish.sh

set -euo pipefail

# Build static site
echo "Building site..."
node build.mjs

# Commit & push (Pages will pick up the build from GitHub)
git add -A
git commit -m "Prepare site for Cloudflare Pages"
git push origin main

# Publish worker (assumes deploy/cloudflare/worker/wrangler.toml exists)
echo "Publishing worker (edit deploy/cloudflare/worker/wrangler.toml first)..."
cd deploy/cloudflare/worker || exit 1
wrangler publish --name jamflex-worker

echo "Done. Use wrangler secret put TMDB_API_KEY to set the TMDb key interactively."
